import React from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, TagIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Note } from '../../entities/Note';

interface NoteMetadataProps {
    note: Note;
    textColor?: string;
    onProjectClick?: () => void;
    onTagsClick?: () => void;
    isEditing?: boolean;
}

/**
 * Creates a URL-friendly slug from a name
 */
const createSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};

/**
 * Generates a project URL from project data
 */
const getProjectUrl = (project: { uid?: string; id?: number; name: string }): string => {
    if (project.uid) {
        return `/project/${project.uid}-${createSlug(project.name)}`;
    }
    return `/project/${project.id}`;
};

/**
 * Generates a tag URL from tag data
 */
const getTagUrl = (tag: { uid?: string; name: string }): string => {
    const slug = createSlug(tag.name);
    return tag.uid ? `/tag/${tag.uid}-${slug}` : `/tag/${slug}`;
};

const NoteMetadata: React.FC<NoteMetadataProps> = ({
    note,
    textColor,
    onProjectClick,
    onTagsClick,
    isEditing = false,
}) => {
    const project = note.project || note.Project;
    const tags = note.tags || note.Tags || [];
    const hasTags = tags.length > 0;
    const displayDate = note.updated_at
        ? new Date(note.updated_at).toLocaleDateString()
        : 'New';

    const style = textColor ? { color: textColor } : undefined;

    const renderProjectButton = () => {
        if (!isEditing) return null;

        return (
            <button
                type="button"
                onClick={onProjectClick}
                className="flex items-center hover:underline text-left"
                title={project ? 'Change project' : 'Add project'}
            >
                <FolderIcon className="h-3 w-3 mr-1" />
                {project ? project.name : 'Add project'}
            </button>
        );
    };

    const renderProjectLink = () => {
        if (isEditing || !project) return null;

        return (
            <div className="flex items-center">
                <FolderIcon className="h-3 w-3 mr-1" />
                <Link
                    to={getProjectUrl(project)}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {project.name}
                </Link>
            </div>
        );
    };

    const renderTagsButton = () => {
        if (!isEditing) return null;

        return (
            <button
                type="button"
                onClick={onTagsClick}
                className="flex items-center hover:underline text-left"
                title={hasTags ? 'Change tags' : 'Add tags'}
            >
                <TagIcon className="h-3 w-3 mr-1" />
                <span>
                    {hasTags
                        ? tags.map((tag, idx) => (
                              <React.Fragment key={tag.name || idx}>
                                  {idx > 0 && ', '}
                                  {tag.name}
                              </React.Fragment>
                          ))
                        : 'Add tags'}
                </span>
            </button>
        );
    };

    const renderTagsLinks = () => {
        if (isEditing || !hasTags) return null;

        return (
            <div className="flex items-center">
                <TagIcon className="h-3 w-3 mr-1" />
                <span>
                    {tags.map((tag, idx) => (
                        <React.Fragment key={tag.name}>
                            {idx > 0 && ', '}
                            <Link
                                to={getTagUrl(tag)}
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {tag.name}
                            </Link>
                        </React.Fragment>
                    ))}
                </span>
            </div>
        );
    };

    return (
        <div
            className="flex flex-col text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-2"
            style={style}
        >
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    <span>{displayDate}</span>
                </div>
                {renderProjectButton()}
                {renderProjectLink()}
                {renderTagsButton()}
                {renderTagsLinks()}
            </div>
        </div>
    );
};

export default NoteMetadata;
