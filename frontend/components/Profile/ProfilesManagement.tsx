import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useToast } from '../Shared/ToastContext';
import ProfileIcon from './ProfileIcon';
import ConfirmDialog from '../Shared/ConfirmDialog';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
    ArrowLeftIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { PROFILE_ICONS, DEFAULT_PROFILE_COLORS } from '../../entities/Profile';
import type { Profile } from '../../entities/Profile';

interface EditingProfile {
    uid: string | null;
    name: string;
    icon: string;
    color: string;
}

const ProfilesManagement: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showSuccessToast, showErrorToast } = useToast();

    const {
        profiles,
        activeProfile,
        loadProfiles,
        createProfile,
        updateProfile,
        deleteProfile,
        hasLoaded,
        isLoading,
    } = useStore((state) => state.profilesStore);

    const [isCreating, setIsCreating] = useState(false);
    const [editingProfile, setEditingProfile] = useState<EditingProfile | null>(
        null
    );
    const [newProfile, setNewProfile] = useState<EditingProfile>({
        uid: null,
        name: '',
        icon: 'folder',
        color: DEFAULT_PROFILE_COLORS[0],
    });
    const [profileToDelete, setProfileToDelete] = useState<Profile | null>(
        null
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!hasLoaded) {
            loadProfiles();
        }
    }, [hasLoaded, loadProfiles]);

    const handleCreateProfile = async () => {
        if (!newProfile.name.trim()) {
            showErrorToast(
                t('profiles.nameRequired', 'Profile name is required')
            );
            return;
        }

        setIsSaving(true);
        try {
            await createProfile({
                name: newProfile.name.trim(),
                icon: newProfile.icon,
                color: newProfile.color,
            });
            showSuccessToast(
                t('profiles.created', 'Profile created successfully')
            );
            setIsCreating(false);
            setNewProfile({
                uid: null,
                name: '',
                icon: 'folder',
                color: DEFAULT_PROFILE_COLORS[0],
            });
        } catch (error) {
            showErrorToast(
                (error as Error).message ||
                    t('profiles.createError', 'Failed to create profile')
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!editingProfile || !editingProfile.uid) return;

        if (!editingProfile.name.trim()) {
            showErrorToast(
                t('profiles.nameRequired', 'Profile name is required')
            );
            return;
        }

        setIsSaving(true);
        try {
            await updateProfile(editingProfile.uid, {
                name: editingProfile.name.trim(),
                icon: editingProfile.icon,
                color: editingProfile.color,
            });
            showSuccessToast(
                t('profiles.updated', 'Profile updated successfully')
            );
            setEditingProfile(null);
        } catch (error) {
            showErrorToast(
                (error as Error).message ||
                    t('profiles.updateError', 'Failed to update profile')
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProfile = async () => {
        if (!profileToDelete) return;

        setIsDeleting(true);
        try {
            await deleteProfile(profileToDelete.uid);
            showSuccessToast(
                t('profiles.deleted', 'Profile deleted successfully')
            );
            setProfileToDelete(null);
        } catch (error) {
            showErrorToast(
                (error as Error).message ||
                    t('profiles.deleteError', 'Failed to delete profile')
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const startEditing = (profile: Profile) => {
        setEditingProfile({
            uid: profile.uid,
            name: profile.name,
            icon: profile.icon,
            color: profile.color,
        });
    };

    const cancelEditing = () => {
        setEditingProfile(null);
    };

    const renderIconSelector = (
        selectedIcon: string,
        onSelect: (icon: string) => void
    ) => (
        <div className="grid grid-cols-8 gap-2">
            {PROFILE_ICONS.map((icon) => (
                <button
                    key={icon}
                    type="button"
                    onClick={() => onSelect(icon)}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                        selectedIcon === icon
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                    <ProfileIcon icon={icon} color="#6B7280" size="sm" />
                </button>
            ))}
        </div>
    );

    const renderColorSelector = (
        selectedColor: string,
        onSelect: (color: string) => void
    ) => (
        <div className="flex flex-wrap gap-2">
            {DEFAULT_PROFILE_COLORS.map((color) => (
                <button
                    key={color}
                    type="button"
                    onClick={() => onSelect(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color
                            ? 'border-gray-900 dark:border-white scale-110'
                            : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                />
            ))}
        </div>
    );

    const renderProfileForm = (
        profile: EditingProfile,
        setProfile: (profile: EditingProfile) => void,
        onSave: () => void,
        onCancel: () => void,
        isNew: boolean
    ) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profiles.name', 'Name')}
                </label>
                <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                    }
                    placeholder={t(
                        'profiles.namePlaceholder',
                        'e.g., Work, Personal'
                    )}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    autoFocus
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('profiles.icon', 'Icon')}
                </label>
                {renderIconSelector(profile.icon, (icon) =>
                    setProfile({ ...profile, icon })
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('profiles.color', 'Color')}
                </label>
                {renderColorSelector(profile.color, (color) =>
                    setProfile({ ...profile, color })
                )}
            </div>

            <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{t('profiles.preview', 'Preview')}:</span>
                    <ProfileIcon
                        icon={profile.icon}
                        color={profile.color}
                        size="md"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                        {profile.name || t('profiles.untitled', 'Untitled')}
                    </span>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    {t('common.cancel', 'Cancel')}
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving || !profile.name.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <span className="animate-spin">...</span>
                            {t('common.saving', 'Saving...')}
                        </>
                    ) : (
                        <>
                            <CheckIcon className="w-4 h-4" />
                            {isNew
                                ? t('profiles.create', 'Create Profile')
                                : t('common.save', 'Save')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    if (isLoading && !hasLoaded) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500 dark:text-gray-400">
                    {t('common.loading', 'Loading...')}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full p-4 sm:p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {t('profiles.manage', 'Manage Profiles')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t(
                            'profiles.description',
                            'Profiles help you organize your tasks into separate workspaces like Work and Personal.'
                        )}
                    </p>
                </div>
            </div>

            {/* Active Profile Banner */}
            {activeProfile && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <ProfileIcon
                            icon={activeProfile.icon}
                            color={activeProfile.color}
                            size="md"
                        />
                        <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                {t(
                                    'profiles.currentProfile',
                                    'Current Profile'
                                )}
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {activeProfile.name}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Profiles List */}
            <div className="space-y-3">
                {profiles.map((profile) => (
                    <div key={profile.uid}>
                        {editingProfile?.uid === profile.uid ? (
                            renderProfileForm(
                                editingProfile,
                                setEditingProfile,
                                handleUpdateProfile,
                                cancelEditing,
                                false
                            )
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ProfileIcon
                                        icon={profile.icon}
                                        color={profile.color}
                                        size="md"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {profile.name}
                                        </p>
                                        {profile.isDefault && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {t(
                                                    'profiles.default',
                                                    'Default'
                                                )}
                                            </span>
                                        )}
                                        {activeProfile?.uid === profile.uid && (
                                            <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                                                {t('profiles.active', 'Active')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => startEditing(profile)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title={t('common.edit', 'Edit')}
                                    >
                                        <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </button>
                                    {profiles.length > 1 && (
                                        <button
                                            onClick={() =>
                                                setProfileToDelete(profile)
                                            }
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title={t('common.delete', 'Delete')}
                                        >
                                            <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Create New Profile */}
                {isCreating ? (
                    renderProfileForm(
                        newProfile,
                        setNewProfile,
                        handleCreateProfile,
                        () => {
                            setIsCreating(false);
                            setNewProfile({
                                uid: null,
                                name: '',
                                icon: 'folder',
                                color: DEFAULT_PROFILE_COLORS[0],
                            });
                        },
                        true
                    )
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        disabled={profiles.length >= 10}
                        className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-600"
                    >
                        <PlusIcon className="w-5 h-5" />
                        {profiles.length >= 10
                            ? t(
                                  'profiles.maxReached',
                                  'Maximum profiles reached (10)'
                              )
                            : t('profiles.addNew', 'Add New Profile')}
                    </button>
                )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-medium mb-1">
                            {t('profiles.warning', 'Important')}
                        </p>
                        <p>
                            {t(
                                'profiles.warningText',
                                'Deleting a profile will permanently delete all tasks, projects, notes, and other data within that profile. This action cannot be undone.'
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {profileToDelete && (
                <ConfirmDialog
                    title={t('profiles.deleteTitle', 'Delete Profile')}
                    message={t(
                        'profiles.deleteConfirm',
                        'Are you sure you want to delete "{{name}}"? All tasks, projects, notes, and other data in this profile will be permanently deleted.',
                        { name: profileToDelete.name }
                    )}
                    confirmButtonText={
                        isDeleting
                            ? t('common.deleting', 'Deleting...')
                            : t('common.delete', 'Delete')
                    }
                    onConfirm={handleDeleteProfile}
                    onCancel={() => !isDeleting && setProfileToDelete(null)}
                />
            )}
        </div>
    );
};

export default ProfilesManagement;
