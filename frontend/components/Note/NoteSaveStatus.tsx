import React from 'react';

interface NoteSaveStatusProps {
    status: 'saved' | 'saving' | 'unsaved';
}

const NoteSaveStatus: React.FC<NoteSaveStatusProps> = ({ status }) => {
    switch (status) {
        case 'saving':
            return (
                <span className="text-blue-500 dark:text-blue-400 italic">
                    Saving...
                </span>
            );
        case 'saved':
            return (
                <span className="text-green-600 dark:text-green-400">
                    ✓ Saved
                </span>
            );
        case 'unsaved':
            return (
                <span className="text-amber-600 dark:text-amber-400">
                    • Unsaved changes
                </span>
            );
        default:
            return null;
    }
};

export default NoteSaveStatus;
