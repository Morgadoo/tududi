import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import {
    ClipboardDocumentListIcon,
    PlayCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Task, PriorityType } from '../../entities/Task';
import KanbanTaskCard from './KanbanTaskCard';
import { KanbanColumnId } from '../../constants/taskStatus';

interface KanbanColumnProps {
    id: KanbanColumnId;
    title: string;
    tasks: Task[];
    color: 'gray' | 'blue' | 'green';
    onPriorityChange?: (taskId: string, priority: PriorityType) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
    id,
    title,
    tasks,
    color,
    onPriorityChange,
}) => {
    const { t } = useTranslation();

    const { setNodeRef, isOver } = useDroppable({
        id,
        data: {
            type: 'column',
            columnId: id,
        },
    });

    const getColumnIcon = () => {
        const iconClass = 'h-5 w-5';
        switch (id) {
            case 'TODO':
                return (
                    <ClipboardDocumentListIcon
                        className={`${iconClass} text-gray-500 dark:text-gray-400`}
                    />
                );
            case 'IN_PROGRESS':
                return (
                    <PlayCircleIcon
                        className={`${iconClass} text-blue-500 dark:text-blue-400`}
                    />
                );
            case 'DONE':
                return (
                    <CheckCircleIcon
                        className={`${iconClass} text-green-500 dark:text-green-400`}
                    />
                );
            default:
                return null;
        }
    };

    const getHeaderStyles = () => {
        switch (color) {
            case 'blue':
                return {
                    bg: 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-900/10',
                    border: 'border-blue-200 dark:border-blue-800',
                    accent: 'bg-blue-500',
                };
            case 'green':
                return {
                    bg: 'bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-900/10',
                    border: 'border-green-200 dark:border-green-800',
                    accent: 'bg-green-500',
                };
            default:
                return {
                    bg: 'bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30',
                    border: 'border-gray-200 dark:border-gray-700',
                    accent: 'bg-gray-400',
                };
        }
    };

    const getHeaderTextStyles = () => {
        switch (color) {
            case 'blue':
                return 'text-blue-800 dark:text-blue-200';
            case 'green':
                return 'text-green-800 dark:text-green-200';
            default:
                return 'text-gray-800 dark:text-gray-200';
        }
    };

    const getCountBadgeStyles = () => {
        switch (color) {
            case 'blue':
                return 'bg-blue-500 text-white';
            case 'green':
                return 'bg-green-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const getDropZoneStyles = () => {
        if (isOver) {
            switch (color) {
                case 'blue':
                    return 'bg-blue-100/80 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/50 dark:ring-blue-500/50';
                case 'green':
                    return 'bg-green-100/80 dark:bg-green-900/30 border-green-400 dark:border-green-500 ring-2 ring-green-400/50 dark:ring-green-500/50';
                default:
                    return 'bg-gray-200/80 dark:bg-gray-700/50 border-gray-400 dark:border-gray-500 ring-2 ring-gray-400/50 dark:ring-gray-500/50';
            }
        }
        return 'bg-gray-50/50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
    };

    const getEmptyMessage = () => {
        switch (id) {
            case 'TODO':
                return t('kanban.emptyTodo', 'No tasks to do');
            case 'IN_PROGRESS':
                return t('kanban.emptyInProgress', 'No tasks in progress');
            case 'DONE':
                return t('kanban.emptyDone', 'No completed tasks');
            default:
                return t('kanban.emptyColumn', 'No tasks');
        }
    };

    const getEmptyIcon = () => {
        const iconClass = 'h-10 w-10 text-gray-300 dark:text-gray-600 mb-2';
        switch (id) {
            case 'TODO':
                return <ClipboardDocumentListIcon className={iconClass} />;
            case 'IN_PROGRESS':
                return <PlayCircleIcon className={iconClass} />;
            case 'DONE':
                return <CheckCircleIcon className={iconClass} />;
            default:
                return null;
        }
    };

    const headerStyles = getHeaderStyles();
    const taskIds = tasks.map((task) => task.uid || task.id?.toString() || '');

    return (
        <div className="flex flex-col min-w-[300px] max-w-[380px] flex-1">
            {/* Column Header */}
            <div
                className={`relative flex items-center justify-between px-4 py-3 rounded-t-xl border ${headerStyles.border} ${headerStyles.bg}`}
            >
                {/* Accent bar */}
                <div
                    className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${headerStyles.accent}`}
                />

                <div className="flex items-center gap-2">
                    {getColumnIcon()}
                    <h3
                        className={`text-sm font-bold uppercase tracking-wide ${getHeaderTextStyles()}`}
                    >
                        {title}
                    </h3>
                </div>
                <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full ${getCountBadgeStyles()}`}
                >
                    {tasks.length}
                </span>
            </div>

            {/* Column Content */}
            <div
                ref={setNodeRef}
                className={`
                    flex-1 p-3 space-y-3 min-h-[250px] max-h-[calc(100vh-280px)] overflow-y-auto
                    rounded-b-xl border border-t-0
                    transition-all duration-200 ease-out
                    ${getDropZoneStyles()}
                `}
            >
                <SortableContext
                    items={taskIds}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.length > 0 ? (
                        tasks.map((task) => (
                            <KanbanTaskCard
                                key={task.uid || task.id}
                                task={task}
                                onPriorityChange={onPriorityChange}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[200px] py-8">
                            {getEmptyIcon()}
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
                                {getEmptyMessage()}
                            </p>
                            <p className="text-xs text-gray-300 dark:text-gray-600 text-center mt-1">
                                {t(
                                    'kanban.dropHere',
                                    'Drop tasks here or create new ones'
                                )}
                            </p>
                        </div>
                    )}
                </SortableContext>

                {/* Drop indicator when dragging over with tasks */}
                {isOver && tasks.length > 0 && (
                    <div
                        className={`h-1 rounded-full mx-4 animate-pulse ${headerStyles.accent}`}
                    />
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
