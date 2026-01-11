import React from 'react';
import { useTranslation } from 'react-i18next';
import { Note } from '../../entities/Note';

interface NoteListItemProps {
    note: Note;
    isSelected: boolean;
    isLast: boolean;
    onSelect: (note: Note) => void;
}

const NoteListItem: React.FC<NoteListItemProps> = ({
    note,
    isSelected,
    isLast,
    onSelect,
}) => {
    const { t } = useTranslation();

    const getContainerClassName = () => {
        if (isSelected) {
            return 'bg-white dark:bg-gray-900 border-b border-transparent mx-4 rounded-lg';
        }
        if (!isLast) {
            return 'border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-800 mx-4';
        }
        return 'border-b border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 mx-4';
    };

    const displayDate = note.updated_at || note.created_at || '';
    const formattedDate = displayDate
        ? new Date(displayDate).toLocaleDateString()
        : '';

    const contentPreview = note.content.substring(0, 100);
    const hasMoreContent = note.content.length > 100;

    return (
        <div
            onClick={() => onSelect(note)}
            className={`relative p-5 cursor-pointer ${getContainerClassName()}`}
        >
            {isSelected && (
                <span className="absolute inset-y-0 left-0 w-1 bg-blue-400 dark:bg-blue-500 rounded-l-md pointer-events-none" />
            )}
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                {note.title || t('notes.untitled', 'Untitled Note')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {contentPreview}
                {hasMoreContent ? '...' : ''}
            </p>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {formattedDate}
            </div>
        </div>
    );
};

export default NoteListItem;
