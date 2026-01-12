import React, { useMemo, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { Task, PriorityType } from '../../entities/Task';
import { Project } from '../../entities/Project';
import KanbanColumn from './KanbanColumn';
import KanbanTaskCard from './KanbanTaskCard';
import {
    getKanbanColumn,
    getKanbanDropStatus,
    KanbanColumnId,
} from '../../constants/taskStatus';

interface ProjectKanbanBoardProps {
    project: Project;
    tasks: Task[];
    onTaskUpdate: (task: Task) => Promise<void>;
}

interface ColumnConfig {
    id: KanbanColumnId;
    title: string;
    color: 'gray' | 'blue' | 'green';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProjectKanbanBoard: React.FC<ProjectKanbanBoardProps> = (props) => {
    const { tasks, onTaskUpdate } = props;
    const { t } = useTranslation();
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    // Configure sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement before drag starts
            },
        })
    );

    // Column configuration
    const columns: ColumnConfig[] = useMemo(
        () => [
            {
                id: 'TODO' as KanbanColumnId,
                title: t('kanban.todo', 'Todo'),
                color: 'gray' as const,
            },
            {
                id: 'IN_PROGRESS' as KanbanColumnId,
                title: t('kanban.inProgress', 'In Progress'),
                color: 'blue' as const,
            },
            {
                id: 'DONE' as KanbanColumnId,
                title: t('kanban.done', 'Done'),
                color: 'green' as const,
            },
        ],
        [t]
    );

    // Group tasks by column
    const tasksByColumn = useMemo(() => {
        const grouped: Record<KanbanColumnId, Task[]> = {
            TODO: [],
            IN_PROGRESS: [],
            DONE: [],
        };

        // Filter out subtasks (only show parent tasks)
        const parentTasks = tasks.filter((task) => !task.parent_task_id);

        parentTasks.forEach((task) => {
            const column = getKanbanColumn(task.status);
            grouped[column].push(task);
        });

        // Sort within columns: by priority (Low -> None -> Med -> High), then by due date (earliest first)
        // Priority values: 3 = Low, 2 = None, 1 = Medium, 0 = High
        Object.keys(grouped).forEach((key) => {
            const columnId = key as KanbanColumnId;
            grouped[columnId].sort((a, b) => {
                // Priority first (Low -> None -> Med -> High)
                // Convert string priorities to numbers for custom sort order
                const getPriorityValue = (p: unknown): number => {
                    if (p === 0 || p === 'low') return 3;
                    if (p === null || p === undefined) return 2;
                    if (p === 1 || p === 'medium') return 1;
                    if (p === 2 || p === 'high') return 0;
                    return 2; // Default to None for any other value
                };

                const priorityA = getPriorityValue(a.priority);
                const priorityB = getPriorityValue(b.priority);
                const priorityDiff = priorityA - priorityB;
                if (priorityDiff !== 0) return priorityDiff;

                // Then due date (earliest first, null dates last)
                const dateA = a.due_date
                    ? new Date(a.due_date).getTime()
                    : Infinity;
                const dateB = b.due_date
                    ? new Date(b.due_date).getTime()
                    : Infinity;
                return dateA - dateB;
            });
        });

        return grouped;
    }, [tasks]);

    // Find task by ID
    const findTaskById = (id: string): Task | undefined => {
        return tasks.find(
            (task) => task.uid === id || task.id?.toString() === id
        );
    };

    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = findTaskById(active.id as string);
        if (task) {
            setActiveTask(task);
        }
    };

    // Handle drag over (for visual feedback)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleDragOver = (event: DragOverEvent) => {
        // Can be used for more complex interactions if needed
    };

    // Handle drag end - update task status when dropped in a new column
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const task = findTaskById(taskId);

        if (!task) return;

        // Determine the target column
        let targetColumnId: KanbanColumnId | null = null;

        // Check if dropped on a column directly
        if (
            over.id === 'TODO' ||
            over.id === 'IN_PROGRESS' ||
            over.id === 'DONE'
        ) {
            targetColumnId = over.id as KanbanColumnId;
        }
        // Check if dropped on another task (inherit its column)
        else {
            const overTask = findTaskById(over.id as string);
            if (overTask) {
                targetColumnId = getKanbanColumn(overTask.status);
            }
        }

        if (!targetColumnId) return;

        // Check if task is already in the target column
        const currentColumn = getKanbanColumn(task.status);
        if (currentColumn === targetColumnId) return;

        // Get the new status for the target column
        const newStatus = getKanbanDropStatus(targetColumnId);

        // Update the task with the new status
        try {
            await onTaskUpdate({
                ...task,
                status: newStatus,
            });
        } catch (error) {
            console.error('Failed to update task status:', error);
        }
    };

    // Handle priority change from kanban card
    const handlePriorityChange = async (
        taskId: string,
        priority: PriorityType
    ) => {
        const task = findTaskById(taskId);
        if (!task) return;

        try {
            await onTaskUpdate({
                ...task,
                priority,
            });
        } catch (error) {
            console.error('Failed to update task priority:', error);
        }
    };

    const totalTasks = tasks.filter((t) => !t.parent_task_id).length;

    return (
        <div className="w-full">
            {/* Board Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {totalTasks}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t('tasks.tasks', 'tasks')}
                        </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                        <span className="inline-block w-3 h-3 rounded bg-gray-400" />
                        <span>{tasksByColumn.TODO.length} todo</span>
                        <span className="mx-1">|</span>
                        <span className="inline-block w-3 h-3 rounded bg-blue-500" />
                        <span>{tasksByColumn.IN_PROGRESS.length} active</span>
                        <span className="mx-1">|</span>
                        <span className="inline-block w-3 h-3 rounded bg-green-500" />
                        <span>{tasksByColumn.DONE.length} done</span>
                    </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    {t(
                        'kanban.dragHint',
                        'Drag tasks between columns to change status'
                    )}
                </p>
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-5 overflow-x-auto pb-6 -mx-2 px-2">
                    {columns.map((column) => (
                        <KanbanColumn
                            key={column.id}
                            id={column.id}
                            title={column.title}
                            tasks={tasksByColumn[column.id]}
                            color={column.color}
                            onPriorityChange={handlePriorityChange}
                        />
                    ))}
                </div>

                {/* Drag Overlay - shows the dragged card */}
                <DragOverlay dropAnimation={null}>
                    {activeTask ? (
                        <div className="rotate-2 scale-105 opacity-90">
                            <KanbanTaskCard task={activeTask} isDragging />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Empty State */}
            {tasks.length === 0 && (
                <div className="flex justify-center items-center py-20">
                    <div className="text-center max-w-sm">
                        <div className="mx-auto w-20 h-20 mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <svg
                                className="h-10 w-10 text-gray-400 dark:text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('kanban.noTasks', 'No tasks in this project')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t(
                                'kanban.createTaskHint',
                                'Create a task from the Tasks tab to see it here'
                            )}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectKanbanBoard;
