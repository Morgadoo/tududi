const { Task } = require('../../../models');
const taskRepository = require('../repository');
const { calculateNextDueDate } = require('../recurringTaskService');
const {
    processDueDateForResponse,
    getSafeTimezone,
} = require('../../../utils/timezone-utils');

/**
 * Parse weekdays from task (handles both array and JSON string)
 */
function parseWeekdays(recurrence_weekdays) {
    if (!recurrence_weekdays) return null;
    return Array.isArray(recurrence_weekdays)
        ? recurrence_weekdays
        : JSON.parse(recurrence_weekdays);
}

/**
 * Check if today matches a weekly recurrence pattern
 */
function checkWeeklyTodayMatch(task, todayWeekday) {
    if (task.recurrence_weekdays) {
        const weekdays = parseWeekdays(task.recurrence_weekdays);
        return weekdays.includes(todayWeekday);
    }

    if (
        task.recurrence_weekday !== null &&
        task.recurrence_weekday !== undefined
    ) {
        return task.recurrence_weekday === todayWeekday;
    }

    return false;
}

/**
 * Check if today matches a monthly recurrence pattern
 */
function checkMonthlyTodayMatch(task, startDate) {
    const targetDay =
        task.recurrence_month_day !== null &&
        task.recurrence_month_day !== undefined
            ? task.recurrence_month_day
            : startDate.getUTCDate();
    const todayDay = startDate.getUTCDate();

    if (targetDay <= todayDay) {
        return { matches: false, nextDate: null };
    }

    const currentMonth = startDate.getUTCMonth();
    const currentYear = startDate.getUTCFullYear();
    const maxDayInMonth = new Date(
        Date.UTC(currentYear, currentMonth + 1, 0)
    ).getUTCDate();

    if (targetDay > maxDayInMonth) {
        return { matches: false, nextDate: null };
    }

    const nextDate = new Date(
        Date.UTC(
            currentYear,
            currentMonth,
            targetDay,
            startDate.getUTCHours(),
            startDate.getUTCMinutes(),
            startDate.getUTCSeconds(),
            startDate.getUTCMilliseconds()
        )
    );

    return { matches: true, nextDate };
}

/**
 * Check if today matches the recurrence pattern
 */
function checkTodayMatchesRecurrence(task, startDate) {
    const nextDate = new Date(startDate);

    switch (task.recurrence_type) {
        case 'daily':
            return { matches: true, nextDate };
        case 'weekly': {
            const todayWeekday = nextDate.getUTCDay();
            const matches = checkWeeklyTodayMatch(task, todayWeekday);
            return { matches, nextDate };
        }
        case 'monthly': {
            return checkMonthlyTodayMatch(task, startDate);
        }
        default:
            return { matches: false, nextDate };
    }
}

/**
 * Calculate the next date for daily recurrence
 */
function getNextDailyDate(currentDate, interval) {
    const nextDate = new Date(currentDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + (interval || 1));
    return nextDate;
}

/**
 * Calculate the next date for weekly recurrence when today doesn't match
 */
function getNextWeeklyDate(currentDate, task) {
    const nextDate = new Date(currentDate);
    const interval = task.recurrence_interval || 1;

    if (
        task.recurrence_weekday !== null &&
        task.recurrence_weekday !== undefined
    ) {
        const currentWeekday = nextDate.getUTCDay();
        const daysUntilTarget =
            (task.recurrence_weekday - currentWeekday + 7) % 7;

        if (daysUntilTarget === 0) {
            nextDate.setUTCDate(nextDate.getUTCDate() + interval * 7);
        } else {
            nextDate.setUTCDate(nextDate.getUTCDate() + daysUntilTarget);
        }
    } else {
        nextDate.setUTCDate(nextDate.getUTCDate() + interval * 7);
    }

    return nextDate;
}

/**
 * Find the next matching weekday for multi-day weekly recurrence
 */
function findNextMatchingWeekday(currentDate, weekdays) {
    for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
        const testDate = new Date(currentDate);
        testDate.setUTCDate(testDate.getUTCDate() + daysAhead);
        const testWeekday = testDate.getUTCDay();

        if (weekdays.includes(testWeekday)) {
            return testDate;
        }
    }

    // Fallback: add 7 days
    const fallbackDate = new Date(currentDate);
    fallbackDate.setUTCDate(fallbackDate.getUTCDate() + 7);
    return fallbackDate;
}

/**
 * Advance to the next occurrence based on recurrence type
 */
function advanceToNextOccurrence(currentDate, task) {
    switch (task.recurrence_type) {
        case 'daily':
            return getNextDailyDate(currentDate, task.recurrence_interval);
        case 'weekly': {
            if (task.recurrence_weekdays) {
                const weekdays = parseWeekdays(task.recurrence_weekdays);
                return findNextMatchingWeekday(currentDate, weekdays);
            }
            const nextDate = new Date(currentDate);
            nextDate.setUTCDate(
                nextDate.getUTCDate() + (task.recurrence_interval || 1) * 7
            );
            return nextDate;
        }
        default:
            return calculateNextDueDate(task, currentDate);
    }
}

/**
 * Check if iteration should stop based on end date
 */
function shouldStopIteration(nextDate, endDate) {
    if (!endDate) return false;
    return nextDate > new Date(endDate);
}

async function handleRecurrenceUpdate(task, recurrenceFields, reqBody) {
    // Check if recurrence fields changed
    const recurrenceChanged = recurrenceFields.some((field) => {
        const newValue = reqBody[field];
        return newValue !== undefined && newValue !== task[field];
    });

    // Also check if template fields that affect instances have changed
    // These fields should be propagated to all future instances
    const templateFieldsChanged = [
        'name',
        'project_id',
        'priority',
        'note',
    ].some((field) => {
        const newValue = reqBody[field];
        return newValue !== undefined && newValue !== task[field];
    });

    const shouldRegenerateInstances =
        (recurrenceChanged || templateFieldsChanged) &&
        task.recurrence_type !== 'none';

    if (!shouldRegenerateInstances) {
        return false;
    }

    const childTasks = await taskRepository.findRecurringChildren(task.id);

    if (childTasks.length > 0) {
        const now = new Date();
        const futureInstances = childTasks.filter((child) => {
            if (!child.due_date) return true;
            return new Date(child.due_date) > now;
        });

        const newRecurrenceType =
            reqBody.recurrence_type !== undefined
                ? reqBody.recurrence_type
                : task.recurrence_type;

        if (newRecurrenceType !== 'none') {
            for (const futureInstance of futureInstances) {
                try {
                    await futureInstance.destroy();
                } catch (error) {
                    // If dependent records block deletion (e.g., subtasks FK), skip that instance
                    console.warn(
                        'Skipping recurring instance deletion due to constraint:',
                        {
                            id: futureInstance.id,
                            error: error?.message,
                        }
                    );
                }
            }
        }
    }

    return shouldRegenerateInstances;
}

async function calculateNextIterations(task, startFromDate, userTimezone) {
    const iterations = [];
    const MAX_ITERATIONS = 6;

    const startDate = startFromDate ? new Date(startFromDate) : new Date();
    startDate.setUTCHours(0, 0, 0, 0);

    // Check if today matches the recurrence pattern
    const todayMatch = checkTodayMatchesRecurrence(task, startDate);
    let nextDate = todayMatch.nextDate || new Date(startDate);
    const includesToday = todayMatch.matches;

    // If monthly matched, use the calculated nextDate from todayMatch
    if (task.recurrence_type === 'monthly' && todayMatch.nextDate) {
        nextDate = todayMatch.nextDate;
    }

    console.log('calculateNextIterations:', {
        startDate: startDate.toISOString(),
        includesToday,
        recurrence_type: task.recurrence_type,
        recurrence_weekdays: task.recurrence_weekdays,
    });

    // If today doesn't match, calculate the next occurrence
    if (!includesToday) {
        nextDate = getFirstOccurrence(task, startDate);
    }

    // Generate iterations
    for (let i = 0; i < MAX_ITERATIONS && nextDate; i++) {
        if (shouldStopIteration(nextDate, task.recurrence_end_date)) {
            break;
        }

        iterations.push({
            date: processDueDateForResponse(
                nextDate,
                getSafeTimezone(userTimezone)
            ),
            utc_date: nextDate.toISOString(),
        });

        nextDate = advanceToNextOccurrence(nextDate, task);
    }

    return iterations;
}

/**
 * Get the first occurrence date when today doesn't match
 */
function getFirstOccurrence(task, startDate) {
    switch (task.recurrence_type) {
        case 'daily':
            return getNextDailyDate(startDate, task.recurrence_interval);
        case 'weekly':
            return getNextWeeklyDate(startDate, task);
        default:
            return calculateNextDueDate(task, startDate);
    }
}

module.exports = {
    handleRecurrenceUpdate,
    calculateNextIterations,
};
