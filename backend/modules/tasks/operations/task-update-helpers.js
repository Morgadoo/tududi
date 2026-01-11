const { Task, RecurringCompletion } = require('../../../models');
const taskRepository = require('../repository');
const { logEvent } = require('../taskEventService');
const { logError } = require('../../../services/logService');
const {
    calculateNextDueDate,
    shouldGenerateNextTask,
} = require('../recurringTaskService');

/**
 * Updates the parent task's recurrence settings
 * @param {Object} task - The current task
 * @param {Object} recurrenceData - Recurrence data from request body
 * @param {number} userId - The current user's ID
 * @returns {Promise<void>}
 */
async function updateParentRecurrence(task, recurrenceData, userId) {
    const {
        recurrence_type,
        recurrence_interval,
        recurrence_end_date,
        recurrence_weekday,
        recurrence_month_day,
        recurrence_week_of_month,
        completion_based,
        update_parent_recurrence,
    } = recurrenceData;

    if (!update_parent_recurrence || !task.recurring_parent_id) {
        return;
    }

    const parentTask = await taskRepository.findByIdAndUser(
        task.recurring_parent_id,
        userId
    );

    if (!parentTask) {
        return;
    }

    const updates = {
        recurrence_type:
            recurrence_type !== undefined
                ? recurrence_type
                : parentTask.recurrence_type,
        recurrence_interval:
            recurrence_interval !== undefined
                ? recurrence_interval
                : parentTask.recurrence_interval,
        recurrence_end_date:
            recurrence_end_date !== undefined
                ? recurrence_end_date
                : parentTask.recurrence_end_date,
        recurrence_weekday:
            recurrence_weekday !== undefined
                ? recurrence_weekday
                : parentTask.recurrence_weekday,
        recurrence_month_day:
            recurrence_month_day !== undefined
                ? recurrence_month_day
                : parentTask.recurrence_month_day,
        recurrence_week_of_month:
            recurrence_week_of_month !== undefined
                ? recurrence_week_of_month
                : parentTask.recurrence_week_of_month,
        completion_based:
            completion_based !== undefined
                ? completion_based
                : parentTask.completion_based,
    };

    await parentTask.update(updates);
}

/**
 * Creates a value resolver function for final values
 * @param {Object} taskAttributes - The updated attributes
 * @param {Object} task - The original task
 * @returns {Function} - Resolver function
 */
function createFinalValueResolver(taskAttributes, task) {
    return (field) =>
        taskAttributes[field] !== undefined ? taskAttributes[field] : task[field];
}

/**
 * Checks if a recurring task should advance to next occurrence
 * @param {string} status - The new status
 * @param {Object} taskAttributes - The task attributes
 * @param {string} finalRecurrenceType - The recurrence type
 * @param {Object} task - The task object
 * @returns {boolean}
 */
function shouldAdvanceRecurrence(
    status,
    taskAttributes,
    finalRecurrenceType,
    task
) {
    const isDone =
        taskAttributes.status === Task.STATUS.DONE ||
        taskAttributes.status === 'done';
    const hasRecurrence = finalRecurrenceType && finalRecurrenceType !== 'none';
    const isNotChildTask = !task.recurring_parent_id;

    return status !== undefined && isDone && hasRecurrence && isNotChildTask;
}

/**
 * Builds the recurrence context for calculating next due date
 * @param {Object} task - The task object
 * @param {Object} params - Parameters including resolveFinalValue and originalDueDate
 * @returns {Object} - Recurrence context
 */
function buildRecurrenceContext(task, params) {
    const { resolveFinalValue, finalRecurrenceType, originalDueDate } = params;

    const taskPlain =
        typeof task.get === 'function' ? task.get({ plain: true }) : task;

    return {
        ...taskPlain,
        recurrence_type: finalRecurrenceType,
        recurrence_interval: resolveFinalValue('recurrence_interval'),
        recurrence_end_date: resolveFinalValue('recurrence_end_date'),
        recurrence_weekday: resolveFinalValue('recurrence_weekday'),
        recurrence_weekdays: resolveFinalValue('recurrence_weekdays'),
        recurrence_month_day: resolveFinalValue('recurrence_month_day'),
        recurrence_week_of_month: resolveFinalValue('recurrence_week_of_month'),
        completion_based: resolveFinalValue('completion_based'),
        due_date: originalDueDate,
    };
}

/**
 * Calculates recurrence advancement data
 * @param {Object} params - Parameters for recurrence calculation
 * @returns {Object} - Object with recurringCompletionPayload and recurrenceAdvanceInfo
 */
function calculateRecurrenceAdvancement(params) {
    const {
        task,
        taskAttributes,
        status,
        finalRecurrenceType,
        finalCompletionBased,
        finalDueDateBeforeAdvance,
        resolveFinalValue,
    } = params;

    if (
        !shouldAdvanceRecurrence(
            status,
            taskAttributes,
            finalRecurrenceType,
            task
        )
    ) {
        return { recurringCompletionPayload: null, recurrenceAdvanceInfo: null };
    }

    const completedAt = new Date();
    const hasOriginalDueDate =
        finalDueDateBeforeAdvance !== undefined &&
        finalDueDateBeforeAdvance !== null &&
        finalDueDateBeforeAdvance !== '';
    const originalDueDate = hasOriginalDueDate
        ? new Date(finalDueDateBeforeAdvance)
        : new Date(completedAt);

    const recurrenceContext = buildRecurrenceContext(task, {
        resolveFinalValue,
        finalRecurrenceType,
        originalDueDate,
    });

    const baseDate = finalCompletionBased
        ? completedAt
        : new Date(originalDueDate);
    const nextDueDate = calculateNextDueDate(recurrenceContext, baseDate);

    const recurringCompletionPayload = {
        task_id: task.id,
        completed_at: completedAt,
        original_due_date: new Date(originalDueDate),
        skipped: false,
    };

    const recurrenceAdvanceInfo = {
        originalDueDate: new Date(originalDueDate),
        completedAt,
        nextDueDate,
    };

    // Update task attributes if we should advance to next occurrence
    if (nextDueDate && shouldGenerateNextTask(recurrenceContext, nextDueDate)) {
        taskAttributes.status = Task.STATUS.NOT_STARTED;
        taskAttributes.completed_at = null;
        taskAttributes.due_date = nextDueDate;
    }

    return { recurringCompletionPayload, recurrenceAdvanceInfo };
}

/**
 * Creates a recurring completion record and logs the event
 * @param {Object} params - Parameters for creating the completion
 * @returns {Promise<void>}
 */
async function createRecurringCompletionWithEvent(params) {
    const {
        recurringCompletionPayload,
        recurrenceAdvanceInfo,
        task,
        userId,
        finalCompletionBased,
    } = params;

    if (!recurringCompletionPayload) {
        return;
    }

    await RecurringCompletion.create(recurringCompletionPayload);

    try {
        await logEvent({
            taskId: task.id,
            userId,
            eventType: 'recurring_occurrence_completed',
            fieldName: 'recurrence',
            oldValue: recurrenceAdvanceInfo?.originalDueDate ?? null,
            newValue: recurrenceAdvanceInfo?.nextDueDate ?? null,
            metadata: {
                action: 'recurring_occurrence_completed',
                original_due_date:
                    recurrenceAdvanceInfo?.originalDueDate?.toISOString?.() ??
                    recurrenceAdvanceInfo?.originalDueDate,
                next_due_date:
                    recurrenceAdvanceInfo?.nextDueDate?.toISOString?.() ?? null,
                completion_based: finalCompletionBased,
            },
        });
    } catch (eventError) {
        logError(
            'Error logging recurring occurrence completion event:',
            eventError
        );
    }
}

module.exports = {
    updateParentRecurrence,
    createFinalValueResolver,
    shouldAdvanceRecurrence,
    buildRecurrenceContext,
    calculateRecurrenceAdvancement,
    createRecurringCompletionWithEvent,
};
