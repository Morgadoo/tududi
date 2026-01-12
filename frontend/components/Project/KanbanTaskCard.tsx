import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
    CalendarIcon,
    ClockIcon,
    ArrowPathIcon,
    PlayIcon,
    PauseCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationCircleIcon,
    ChevronDoubleUpIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    MinusIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import { FireIcon } from '@heroicons/react/24/solid';
import { Task, PriorityType } from '../../entities/Task';
import { formatRelativeDate, isOverdue, isToday } from '../../utils/dateUtils';
import {
    isTaskCompleted,
    isTaskInProgress,
    isTaskWaiting,
    isTaskCancelled,
    isTaskPlanned,
    getStatusString,
} from '../../constants/taskStatus';

interface KanbanTaskCardProps {
    task: Task;
    isDragging?: boolean;
    onPriorityChange?: (taskId: string, priority: PriorityType) => void;
}

const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({
    task,
    isDragging = false,
    onPriorityChange,
}) => {
    const { t } = useTranslation();
    const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
    });
    const priorityBadgeRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({
        id: task.uid || task.id?.toString() || '',
        data: {
            type: 'task',
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isActuallyDragging = isDragging || isSortableDragging;
    const taskCompleted = isTaskCompleted(task.status);
    const taskInProgress = isTaskInProgress(task.status);
    const taskWaiting = isTaskWaiting(task.status);
    const taskCancelled = isTaskCancelled(task.status);
    const taskPlanned = isTaskPlanned(task.status);

    // Get status-based styling for the card
    const getStatusStyles = () => {
        if (taskCompleted) {
            return {
                border: 'border-green-200 dark:border-green-800',
                bg: 'bg-green-50/50 dark:bg-green-900/10',
                ring: 'ring-green-500',
            };
        }
        if (taskInProgress) {
            return {
                border: 'border-blue-200 dark:border-blue-800',
                bg: 'bg-blue-50/50 dark:bg-blue-900/10',
                ring: 'ring-blue-500',
            };
        }
        if (taskWaiting) {
            return {
                border: 'border-yellow-200 dark:border-yellow-800',
                bg: 'bg-yellow-50/50 dark:bg-yellow-900/10',
                ring: 'ring-yellow-500',
            };
        }
        if (taskCancelled) {
            return {
                border: 'border-red-200 dark:border-red-800',
                bg: 'bg-red-50/30 dark:bg-red-900/10',
                ring: 'ring-red-500',
            };
        }
        if (taskPlanned) {
            return {
                border: 'border-purple-200 dark:border-purple-800',
                bg: 'bg-purple-50/50 dark:bg-purple-900/10',
                ring: 'ring-purple-500',
            };
        }
        // Default (not_started)
        return {
            border: 'border-gray-200 dark:border-gray-700',
            bg: 'bg-white dark:bg-gray-800',
            ring: 'ring-gray-400',
        };
    };

    // Get priority details with icon, color, and label
    // Priority values: 0 = Low, 1 = Medium, 2 = High, null/undefined = None
    const getPriorityDetails = () => {
        const priority = task.priority;

        // High priority: numeric 2 or string 'high'
        if (priority === 2 || priority === 'high') {
            return {
                barColor: 'bg-red-500',
                badgeBg: 'bg-red-100 dark:bg-red-900/40',
                badgeText: 'text-red-700 dark:text-red-300',
                badgeBorder: 'border-red-200 dark:border-red-700',
                icon: ChevronDoubleUpIcon,
                iconColor: 'text-red-500 dark:text-red-400',
                label: t('priority.high', 'High'),
                shortLabel: t('priority.highShort', 'High'),
            };
        }

        // Medium priority: numeric 1 or string 'medium'
        if (priority === 1 || priority === 'medium') {
            return {
                barColor: 'bg-yellow-500',
                badgeBg: 'bg-yellow-100 dark:bg-yellow-900/40',
                badgeText: 'text-yellow-700 dark:text-yellow-300',
                badgeBorder: 'border-yellow-200 dark:border-yellow-700',
                icon: ChevronUpIcon,
                iconColor: 'text-yellow-500 dark:text-yellow-400',
                label: t('priority.medium', 'Medium'),
                shortLabel: t('priority.mediumShort', 'Med'),
            };
        }

        // Low priority: numeric 0 or string 'low'
        if (priority === 0 || priority === 'low') {
            return {
                barColor: 'bg-blue-500',
                badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
                badgeText: 'text-blue-700 dark:text-blue-300',
                badgeBorder: 'border-blue-200 dark:border-blue-700',
                icon: ChevronDownIcon,
                iconColor: 'text-blue-500 dark:text-blue-400',
                label: t('priority.low', 'Low'),
                shortLabel: t('priority.lowShort', 'Low'),
            };
        }

        // No priority (null, undefined, or any other value)
        return {
            barColor: 'bg-gray-300 dark:bg-gray-600',
            badgeBg: 'bg-gray-100 dark:bg-gray-700',
            badgeText: 'text-gray-500 dark:text-gray-400',
            badgeBorder: 'border-gray-200 dark:border-gray-600',
            icon: MinusIcon,
            iconColor: 'text-gray-400 dark:text-gray-500',
            label: t('priority.none', 'None'),
            shortLabel: t('priority.noneShort', 'None'),
        };
    };

    // Get status icon
    const getStatusIcon = () => {
        const iconClass = 'h-4 w-4';
        if (taskCompleted) {
            return (
                <CheckCircleIcon
                    className={`${iconClass} text-green-500 dark:text-green-400`}
                />
            );
        }
        if (taskInProgress) {
            return (
                <PlayIcon
                    className={`${iconClass} text-blue-500 dark:text-blue-400`}
                />
            );
        }
        if (taskWaiting) {
            return (
                <ClockIcon
                    className={`${iconClass} text-yellow-500 dark:text-yellow-400`}
                />
            );
        }
        if (taskCancelled) {
            return (
                <XCircleIcon
                    className={`${iconClass} text-red-500 dark:text-red-400`}
                />
            );
        }
        if (taskPlanned) {
            return (
                <CalendarIcon
                    className={`${iconClass} text-purple-500 dark:text-purple-400`}
                />
            );
        }
        return (
            <PauseCircleIcon
                className={`${iconClass} text-gray-400 dark:text-gray-500`}
            />
        );
    };

    const getDueDateStyles = () => {
        if (!task.due_date) return '';
        if (isOverdue(task.due_date)) {
            return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
        }
        if (isToday(task.due_date)) {
            return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
        }
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
    };

    const statusStyles = getStatusStyles();
    const priorityDetails = getPriorityDetails();
    const PriorityIcon = priorityDetails.icon;

    // Limit displayed tags
    const displayedTags = task.tags?.slice(0, 2) || [];
    const remainingTagsCount = (task.tags?.length || 0) - 2;

    // Priority options for dropdown
    const priorityOptions: {
        value: PriorityType;
        label: string;
        icon: typeof ChevronDoubleUpIcon;
        iconColor: string;
        bgColor: string;
    }[] = [
        {
            value: null,
            label: t('priority.none', 'None'),
            icon: MinusIcon,
            iconColor: 'text-gray-400 dark:text-gray-500',
            bgColor: 'hover:bg-gray-100 dark:hover:bg-gray-700',
        },
        {
            value: 'low',
            label: t('priority.low', 'Low'),
            icon: ChevronDownIcon,
            iconColor: 'text-blue-500 dark:text-blue-400',
            bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
        },
        {
            value: 'medium',
            label: t('priority.medium', 'Medium'),
            icon: ChevronUpIcon,
            iconColor: 'text-yellow-500 dark:text-yellow-400',
            bgColor: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/30',
        },
        {
            value: 'high',
            label: t('priority.high', 'High'),
            icon: ChevronDoubleUpIcon,
            iconColor: 'text-red-500 dark:text-red-400',
            bgColor: 'hover:bg-red-50 dark:hover:bg-red-900/30',
        },
    ];

    // Get current priority value for comparison
    const getCurrentPriorityValue = (): PriorityType => {
        const p = task.priority;
        if (p === 2 || p === 'high') return 'high';
        if (p === 1 || p === 'medium') return 'medium';
        if (p === 0 || p === 'low') return 'low';
        return null;
    };

    const currentPriorityValue = getCurrentPriorityValue();

    // Handle priority badge click
    const handlePriorityClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!onPriorityChange) return;

        if (priorityBadgeRef.current) {
            const rect = priorityBadgeRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const menuHeight = 180; // Approximate height of dropdown

            // Position below or above based on available space
            const top =
                spaceBelow < menuHeight
                    ? rect.top - menuHeight - 4
                    : rect.bottom + 4;

            setDropdownPosition({
                top,
                left: rect.left,
            });
        }
        setIsPriorityDropdownOpen(!isPriorityDropdownOpen);
    };

    // Handle priority selection
    const handlePrioritySelect = (priority: PriorityType) => {
        const taskId = task.uid || task.id?.toString() || '';
        if (onPriorityChange && taskId) {
            onPriorityChange(taskId, priority);
        }
        setIsPriorityDropdownOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isPriorityDropdownOpen &&
                priorityBadgeRef.current &&
                !priorityBadgeRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsPriorityDropdownOpen(false);
            }
        };

        if (isPriorityDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isPriorityDropdownOpen]);

    // Close dropdown when dragging starts
    useEffect(() => {
        if (isActuallyDragging && isPriorityDropdownOpen) {
            setIsPriorityDropdownOpen(false);
        }
    }, [isActuallyDragging, isPriorityDropdownOpen]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
                group relative rounded-lg shadow-sm cursor-grab active:cursor-grabbing
                border ${statusStyles.border} ${statusStyles.bg}
                ${isActuallyDragging ? 'opacity-60 shadow-xl ring-2 ' + statusStyles.ring + ' scale-105' : ''}
                ${taskCancelled && !isActuallyDragging ? 'opacity-60' : ''}
                hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
                transition-all duration-200 ease-out
            `}
        >
            {/* Priority indicator bar on the left */}
            <div
                className={`absolute top-0 left-0 w-1.5 h-full rounded-l-lg ${priorityDetails.barColor}`}
                title={priorityDetails.label}
            />

            {/* Card Content */}
            <div className="p-3 pl-4">
                {/* Top row: Priority Badge + Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    {/* Priority Badge - Clickable to change priority */}
                    <button
                        ref={priorityBadgeRef}
                        onClick={handlePriorityClick}
                        disabled={!onPriorityChange}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border
                            ${priorityDetails.badgeBg} ${priorityDetails.badgeText} ${priorityDetails.badgeBorder}
                            ${onPriorityChange ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all' : ''}`}
                        title={
                            onPriorityChange
                                ? t(
                                      'priority.clickToChange',
                                      'Click to change priority'
                                  )
                                : priorityDetails.label
                        }
                    >
                        <PriorityIcon
                            className={`h-3.5 w-3.5 ${priorityDetails.iconColor}`}
                        />
                        <span>{priorityDetails.shortLabel}</span>
                    </button>

                    {/* Status Badge */}
                    <Link
                        to={`/task/${task.uid}`}
                        onClick={(e) => {
                            if (isActuallyDragging) {
                                e.preventDefault();
                            }
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                            hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all
                            ${
                                taskCompleted
                                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                    : taskInProgress
                                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                      : taskWaiting
                                        ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                                        : taskCancelled
                                          ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                          : taskPlanned
                                            ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }
                        `}
                    >
                        {getStatusIcon()}
                        <span className="hidden sm:inline">
                            {t(
                                `status.${getStatusString(task.status)}`,
                                getStatusString(task.status)
                            )}
                        </span>
                    </Link>
                </div>

                {/* Task Name - Clickable link to task details */}
                <Link
                    to={`/task/${task.uid}`}
                    onClick={(e) => {
                        if (isActuallyDragging) {
                            e.preventDefault();
                        }
                    }}
                    className="block mb-2 hover:underline"
                >
                    <div className="flex items-start gap-1.5">
                        {task.habit_mode && (
                            <FireIcon
                                className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5"
                                title={t('task.habit', 'Habit')}
                            />
                        )}
                        <h4
                            className={`text-sm font-medium line-clamp-2 leading-snug ${
                                taskCompleted || taskCancelled
                                    ? 'text-gray-500 dark:text-gray-400 line-through'
                                    : 'text-gray-900 dark:text-gray-100'
                            }`}
                        >
                            {task.original_name || task.name}
                        </h4>
                    </div>
                </Link>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {/* Due Date */}
                    {task.due_date && (
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${getDueDateStyles()}`}
                        >
                            {isOverdue(task.due_date) ? (
                                <ExclamationCircleIcon className="h-3 w-3" />
                            ) : (
                                <CalendarIcon className="h-3 w-3" />
                            )}
                            {formatRelativeDate(
                                task.due_date,
                                t as (
                                    key: string,
                                    options?: { defaultValue: string }
                                ) => string
                            )}
                        </span>
                    )}

                    {/* Defer Date */}
                    {task.defer_until && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                            <ClockIcon className="h-3 w-3" />
                            {t('task.deferred', 'Deferred')}
                        </span>
                    )}

                    {/* Recurring Indicator */}
                    {task.recurrence_type &&
                        task.recurrence_type !== 'none' && (
                            <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-700"
                                title={t('task.recurring', 'Recurring task')}
                            >
                                <ArrowPathIcon className="h-3 w-3" />
                            </span>
                        )}
                </div>

                {/* Tags */}
                {displayedTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        {displayedTags.map((tag) => (
                            <span
                                key={tag.uid || tag.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs
                                    bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
                                    border border-gray-200 dark:border-gray-600"
                            >
                                #{tag.name}
                            </span>
                        ))}
                        {remainingTagsCount > 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-0.5">
                                +{remainingTagsCount}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Priority Dropdown Portal */}
            {isPriorityDropdownOpen &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[140px]"
                        style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                        }}
                    >
                        {priorityOptions.map((option) => {
                            const OptionIcon = option.icon;
                            const isSelected =
                                currentPriorityValue === option.value;
                            return (
                                <button
                                    key={option.value ?? 'none'}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handlePrioritySelect(option.value);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                                    ${option.bgColor}
                                    ${isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''}
                                    transition-colors`}
                                >
                                    <OptionIcon
                                        className={`h-4 w-4 ${option.iconColor}`}
                                    />
                                    <span className="flex-1 text-gray-700 dark:text-gray-200">
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <CheckIcon className="h-4 w-4 text-green-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default KanbanTaskCard;
