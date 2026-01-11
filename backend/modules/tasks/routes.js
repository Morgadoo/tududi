const express = require('express');
const router = express.Router();

// Import sub-routers for task-related routes
const attachmentsRouter = require('./attachments');
const eventsRouter = require('./events');

const {
    Task,
    TaskEvent,
    RecurringCompletion,
    sequelize,
} = require('../../models');
const taskRepository = require('./repository');
const {
    resetQueryCounter,
    getQueryStats,
    enableQueryLogging,
} = require('../../middleware/queryLogger');

const {
    calculateNextDueDate,
    calculateVirtualOccurrences,
    shouldGenerateNextTask,
} = require('./recurringTaskService');
const { logError } = require('../../services/logService');
const { logEvent } = require('./taskEventService');

const {
    serializeTask,
    serializeTasks,
    toISOStringOrNull,
} = require('./core/serializers');
const { updateTaskTags } = require('./operations/tags');

// Extract date portion (YYYY-MM-DD) from date value
function toDateString(date) {
    if (!date) return null;
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return new Date(date).toISOString().split('T')[0];
}
const { filterTasksByParams } = require('./queries/query-builders');
const {
    getSafeTimezone,
    getTodayBoundsInUTC,
} = require('../../utils/timezone-utils');
const { isValidUid } = require('../../utils/slug-utils');

const {
    validateProjectAccess,
    validateParentTaskAccess,
    validateDeferUntilAndDueDate,
} = require('./utils/validation');
const {
    buildTaskAttributes,
    buildUpdateAttributes,
} = require('./core/builders');
const { createSubtasks, updateSubtasks } = require('./operations/subtasks');
const { handleCompletionStatus } = require('./operations/completion');
const { captureOldValues, logTaskChanges } = require('./utils/logging');
const {
    handleParentChildOnStatusChange,
} = require('./operations/parent-child');
const {
    TASK_INCLUDES,
    TASK_INCLUDES_WITH_SUBTASKS,
} = require('./utils/constants');

const {
    handleRecurringTasks,
    buildGroupedTasks,
    serializeGroupedTasks,
    addDashboardLists,
    addPerformanceHeaders,
} = require('./operations/list');

const {
    handleRecurrenceUpdate,
    calculateNextIterations,
} = require('./operations/recurring');
const {
    updateParentRecurrence,
    createFinalValueResolver,
    calculateRecurrenceAdvancement,
    createRecurringCompletionWithEvent,
} = require('./operations/task-update-helpers');

const { getTaskMetrics } = require('./queries/metrics-computation');

const { getSubtasks } = require('./operations/subtasks');

const {
    requireTaskReadAccess,
    requireTaskWriteAccess,
} = require('./middleware/access');

if (process.env.NODE_ENV === 'development') {
    enableQueryLogging();
}

function expandRecurringTasks(tasks, maxDays = 7, statusFilter = null) {
    const expandedTasks = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    tasks.forEach((task) => {
        const isRecurring =
            task.recurrence_type &&
            task.recurrence_type !== 'none' &&
            !task.recurring_parent_id;

        if (!isRecurring) {
            expandedTasks.push(task);
            return;
        }

        console.log('[DEBUG] Processing recurring task:', {
            id: task.id,
            name: task.name,
            recurrence_type: task.recurrence_type,
            due_date: task.due_date,
            status: task.status,
            completed_at: task.completed_at,
            has_due_date: !!task.due_date,
            statusFilter: statusFilter,
        });

        if (
            (statusFilter === 'completed' || statusFilter === 'done') &&
            (task.status === 2 || task.status === 'done')
        ) {
            console.log(
                '[DEBUG] Task is completed and filter is completed, showing actual task'
            );
            expandedTasks.push(task);
            return;
        }

        let startFrom = task.due_date ? new Date(task.due_date) : now;

        if (task.status === 2 || task.status === 'done') {
            const baseDate =
                task.completion_based && task.completed_at
                    ? new Date(task.completed_at)
                    : new Date(task.due_date || now);
            const nextDate = calculateNextDueDate(task, baseDate);
            startFrom = nextDate || now;
            console.log(
                '[DEBUG] Task is completed, starting from next occurrence:',
                startFrom
            );
        } else if (startFrom < now) {
            let nextDate = startFrom;
            let iterations = 0;
            const MAX_ITERATIONS = 100;

            while (nextDate && nextDate < now && iterations < MAX_ITERATIONS) {
                nextDate = calculateNextDueDate(task, nextDate);
                iterations++;
            }

            startFrom = nextDate || now;
        }

        console.log('[DEBUG] Starting from date:', startFrom);
        const occurrences = calculateVirtualOccurrences(
            task,
            maxDays,
            startFrom
        );
        console.log('[DEBUG] Generated occurrences:', occurrences.length);

        occurrences.forEach((occurrence, index) => {
            const virtualTask = {
                ...(task.toJSON ? task.toJSON() : task),
                due_date: occurrence.due_date,
                is_virtual_occurrence: true,
                occurrence_index: index,
                virtual_id: `${task.id}_occurrence_${index}`,
            };
            expandedTasks.push(virtualTask);
        });
    });

    return expandedTasks;
}

router.get('/tasks', async (req, res) => {
    const startTime = Date.now();
    resetQueryCounter();

    try {
        const {
            type,
            groupBy,
            maxDays,
            order_by,
            include_lists,
            limit: limitParam,
            offset: offsetParam,
        } = req.query;
        const { id: userId, timezone, language } = req.currentUser;

        await handleRecurringTasks(userId, type);

        let tasks = await filterTasksByParams(req.query, userId, timezone);

        if (type === 'upcoming' && groupBy === 'day') {
            console.log('[DEBUG] Expanding recurring tasks for /upcoming');
            console.log('[DEBUG] Total tasks before expansion:', tasks.length);
            console.log(
                '[DEBUG] Recurring tasks:',
                tasks
                    .filter(
                        (t) => t.recurrence_type && t.recurrence_type !== 'none'
                    )
                    .map((t) => ({
                        id: t.id,
                        name: t.name,
                        recurrence_type: t.recurrence_type,
                        due_date: t.due_date,
                        recurring_parent_id: t.recurring_parent_id,
                    }))
            );
            const days = maxDays ? parseInt(maxDays, 10) : 7;
            tasks = expandRecurringTasks(tasks, days, req.query.status);
            console.log('[DEBUG] Total tasks after expansion:', tasks.length);
        }

        if (type === 'today') {
            const safeTimezone = getSafeTimezone(timezone);
            const todayBounds = getTodayBoundsInUTC(safeTimezone);

            const instancesForToday = tasks.filter(
                (t) =>
                    t.recurring_parent_id &&
                    t.due_date &&
                    new Date(t.due_date) >= todayBounds.start &&
                    new Date(t.due_date) <= todayBounds.end
            );

            const parentIdsWithTodayInstances = new Set(
                instancesForToday.map((t) => t.recurring_parent_id)
            );

            tasks = tasks.filter(
                (t) =>
                    !t.recurrence_type ||
                    t.recurrence_type === 'none' ||
                    t.recurring_parent_id !== null ||
                    !parentIdsWithTodayInstances.has(t.id)
            );
        }

        const hasPagination =
            limitParam !== undefined || offsetParam !== undefined;
        const totalCount = tasks.length;
        let paginatedTasks = tasks;

        if (hasPagination) {
            const limit = parseInt(limitParam, 10) || 20;
            const offset = parseInt(offsetParam, 10) || 0;
            paginatedTasks = tasks.slice(offset, offset + limit);
        }

        const groupedTasks = await buildGroupedTasks(
            paginatedTasks,
            type,
            groupBy,
            maxDays,
            order_by,
            timezone,
            language || 'en'
        );

        const serializationOptions =
            type === 'today' ? { preserveOriginalName: true } : {};

        const response = {
            tasks: await serializeTasks(
                paginatedTasks,
                timezone,
                serializationOptions
            ),
        };

        const serializedGrouped = await serializeGroupedTasks(
            groupedTasks,
            timezone
        );
        if (serializedGrouped) {
            response.groupedTasks = serializedGrouped;
        }

        await addDashboardLists(
            response,
            userId,
            timezone,
            type,
            include_lists,
            serializationOptions
        );

        if (hasPagination) {
            const limit = parseInt(limitParam, 10) || 20;
            const offset = parseInt(offsetParam, 10) || 0;
            response.pagination = {
                total: totalCount,
                limit: limit,
                offset: offset,
                hasMore: offset + paginatedTasks.length < totalCount,
            };
        }

        addPerformanceHeaders(res, startTime, getQueryStats());
        res.json(response);
    } catch (error) {
        logError('Error fetching tasks:', error);
        if (error.message === 'Invalid order column specified.') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/tasks/metrics', async (req, res) => {
    try {
        const response = await getTaskMetrics(
            req.currentUser.id,
            req.currentUser.timezone,
            req.query.type
        );

        res.json(response);
    } catch (error) {
        logError('Error fetching task metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/task', async (req, res) => {
    try {
        const { name, project_id, parent_task_id, tags, Tags, subtasks } =
            req.body;
        const tagsData = tags || Tags;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Task name is required.' });
        }

        const timezone = getSafeTimezone(req.currentUser.timezone);
        const taskAttributes = buildTaskAttributes(
            req.body,
            req.currentUser.id,
            timezone
        );

        try {
            validateDeferUntilAndDueDate(
                taskAttributes.defer_until,
                taskAttributes.due_date
            );
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

        try {
            const validProjectId = await validateProjectAccess(
                project_id,
                req.currentUser.id
            );
            if (validProjectId) taskAttributes.project_id = validProjectId;
        } catch (error) {
            return res
                .status(error.message === 'Forbidden' ? 403 : 400)
                .json({ error: error.message });
        }

        try {
            const validParentId = await validateParentTaskAccess(
                parent_task_id,
                req.currentUser.id
            );
            if (validParentId) taskAttributes.parent_task_id = validParentId;
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

        const task = await taskRepository.create(taskAttributes);
        await updateTaskTags(task, tagsData, req.currentUser.id);
        await createSubtasks(task.id, subtasks, req.currentUser.id);

        const taskWithAssociations = await taskRepository.findById(task.id, {
            include: TASK_INCLUDES,
        });

        if (!taskWithAssociations) {
            logError('Failed to reload created task:', task.id);
            const fallbackTask = {
                ...task.toJSON(),
                tags: [],
                Project: null,
                subtasks: [],
                today_move_count: 0,
                due_date: toDateString(task.due_date),
                completed_at: toISOStringOrNull(task.completed_at),
            };
            return res.status(201).json(fallbackTask);
        }

        const serializedTask = await serializeTask(
            taskWithAssociations,
            req.currentUser.timezone,
            { skipDisplayNameTransform: true }
        );

        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
        });

        res.status(201).json(serializedTask);
    } catch (error) {
        logError('Error creating task:', error);
        logError('Error stack:', error.stack);
        logError('Error name:', error.name);
        res.status(400).json({
            error: 'There was a problem creating the task.',
            details: error.errors
                ? error.errors.map((e) => e.message)
                : [error.message],
        });
    }
});

router.get('/task/:uid', requireTaskReadAccess, async (req, res) => {
    try {
        const task = await taskRepository.findByUid(req.params.uid, {
            include: TASK_INCLUDES_WITH_SUBTASKS,
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        const serializedTask = await serializeTask(
            task,
            req.currentUser.timezone,
            { skipDisplayNameTransform: true }
        );

        res.json(serializedTask);
    } catch (error) {
        logError('Error fetching task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/task/:uid', requireTaskWriteAccess, async (req, res) => {
    try {
        const { status, project_id, parent_task_id, tags, Tags, subtasks } =
            req.body;
        const tagsData = tags || Tags;

        const task = await taskRepository.findByUid(req.params.uid, {
            include: TASK_INCLUDES_WITH_SUBTASKS,
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        const oldValues = captureOldValues(task);
        const oldStatus = task.status;

        // Update parent task's recurrence if requested
        await updateParentRecurrence(task, req.body, req.currentUser.id);

        const timezone = getSafeTimezone(req.currentUser.timezone);
        const taskAttributes = buildUpdateAttributes(req.body, task, timezone);

        // Validate defer until and due date
        const finalDeferUntil =
            taskAttributes.defer_until !== undefined
                ? taskAttributes.defer_until
                : task.defer_until;
        const finalDueDate =
            taskAttributes.due_date !== undefined
                ? taskAttributes.due_date
                : task.due_date;

        try {
            validateDeferUntilAndDueDate(finalDeferUntil, finalDueDate);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }

        await handleCompletionStatus(taskAttributes, status, task);

        // Validate and set project_id
        if (project_id !== undefined) {
            try {
                taskAttributes.project_id = await validateProjectAccess(
                    project_id,
                    req.currentUser.id
                );
            } catch (error) {
                const statusCode = error.message === 'Forbidden' ? 403 : 400;
                return res.status(statusCode).json({ error: error.message });
            }
        }

        // Validate and set parent_task_id
        if (parent_task_id !== undefined) {
            if (parent_task_id && parent_task_id.toString().trim()) {
                try {
                    taskAttributes.parent_task_id = await validateParentTaskAccess(
                        parent_task_id,
                        req.currentUser.id
                    );
                } catch (error) {
                    return res.status(400).json({ error: error.message });
                }
            } else {
                taskAttributes.parent_task_id = null;
            }
        }

        const recurrenceFields = [
            'recurrence_type',
            'recurrence_interval',
            'recurrence_end_date',
            'recurrence_weekday',
            'recurrence_weekdays',
            'recurrence_month_day',
            'recurrence_week_of_month',
            'completion_based',
        ];

        await handleRecurrenceUpdate(task, recurrenceFields, req.body);

        // Calculate recurrence advancement if completing a recurring task
        const resolveFinalValue = createFinalValueResolver(taskAttributes, task);
        const finalRecurrenceType = resolveFinalValue('recurrence_type');
        const finalCompletionBased = resolveFinalValue('completion_based');
        const finalDueDateBeforeAdvance =
            taskAttributes.due_date !== undefined
                ? taskAttributes.due_date
                : task.due_date;

        const { recurringCompletionPayload, recurrenceAdvanceInfo } =
            calculateRecurrenceAdvancement({
                task,
                taskAttributes,
                status,
                finalRecurrenceType,
                finalCompletionBased,
                finalDueDateBeforeAdvance,
                resolveFinalValue,
            });

        await task.update(taskAttributes);

        if (status !== undefined) {
            await handleParentChildOnStatusChange(
                task,
                oldStatus,
                taskAttributes.status,
                req.currentUser.id
            );
        }

        // Create recurring completion record and log event
        await createRecurringCompletionWithEvent({
            recurringCompletionPayload,
            recurrenceAdvanceInfo,
            task,
            userId: req.currentUser.id,
            finalCompletionBased,
        });

        await updateTaskTags(task, tagsData, req.currentUser.id);
        await updateSubtasks(task.id, subtasks, req.currentUser.id);
        await logTaskChanges(
            task,
            oldValues,
            req.body,
            tagsData,
            req.currentUser.id
        );

        const taskWithAssociations = await taskRepository.findById(task.id, {
            include: TASK_INCLUDES,
        });

        const serializedTask = await serializeTask(
            taskWithAssociations,
            req.currentUser.timezone,
            { skipDisplayNameTransform: true }
        );

        res.json(serializedTask);
    } catch (error) {
        logError('Error updating task:', error);
        res.status(400).json({
            error: 'There was a problem updating the task.',
            details: error.errors
                ? error.errors.map((e) => e.message)
                : [error.message],
        });
    }
});

router.delete('/task/:uid', requireTaskWriteAccess, async (req, res) => {
    try {
        const task = await taskRepository.findByUid(req.params.uid);

        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        const taskId = task.id;

        const childTasks = await taskRepository.findRecurringChildren(taskId);

        if (childTasks.length > 0) {
            const now = new Date();

            const futureInstances = childTasks.filter((child) => {
                if (!child.due_date) return true;
                return new Date(child.due_date) > now;
            });

            const pastInstances = childTasks.filter((child) => {
                if (!child.due_date) return false;
                return new Date(child.due_date) <= now;
            });

            for (const futureInstance of futureInstances) {
                await futureInstance.destroy();
            }

            for (const pastInstance of pastInstances) {
                await pastInstance.update({
                    recurring_parent_id: null,
                    recurrence_type: 'none',
                    recurrence_interval: null,
                    recurrence_end_date: null,
                    recurrence_weekday: null,
                    recurrence_month_day: null,
                    recurrence_week_of_month: null,
                    completion_based: false,
                });
            }
        }

        await sequelize.query('PRAGMA foreign_keys = OFF');

        try {
            await TaskEvent.destroy({
                where: { task_id: taskId },
                force: true,
            });

            await sequelize.query('DELETE FROM tasks_tags WHERE task_id = ?', {
                replacements: [taskId],
            });

            await taskRepository.clearRecurringParent(taskId);

            await task.destroy({ force: true });
        } finally {
            await sequelize.query('PRAGMA foreign_keys = ON');
        }

        res.json({ message: 'Task successfully deleted' });
    } catch (error) {
        res.status(400).json({
            error: 'There was a problem deleting the task.',
        });
    }
});

router.get('/task/:uid/subtasks', async (req, res) => {
    try {
        if (!isValidUid(req.params.uid)) {
            return res.status(400).json({ error: 'Invalid UID' });
        }

        const task = await taskRepository.findByUid(req.params.uid);
        if (!task) {
            return res.json([]);
        }

        const result = await getSubtasks(
            task.id,
            req.currentUser.id,
            req.currentUser.timezone
        );

        if (result.error === 'Forbidden') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (result.error === 'Not found') {
            return res.json([]);
        }

        res.json(result.subtasks);
    } catch (error) {
        logError('Error fetching subtasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/task/:uid/next-iterations', async (req, res) => {
    try {
        if (!isValidUid(req.params.uid)) {
            return res.status(400).json({ error: 'Invalid UID' });
        }

        const task = await taskRepository.findByUid(req.params.uid);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Verify user owns this task
        if (task.user_id !== req.currentUser.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!task.recurrence_type || task.recurrence_type === 'none') {
            return res.json({ iterations: [] });
        }

        const iterations = await calculateNextIterations(
            task,
            req.query.startFromDate,
            req.currentUser.timezone
        );

        res.json({ iterations });
    } catch (error) {
        logError('Error getting next iterations:', error);
        res.status(500).json({ error: 'Failed to get next iterations' });
    }
});

// Mount sub-routers for task-related routes
router.use(attachmentsRouter);
router.use(eventsRouter);

module.exports = router;
