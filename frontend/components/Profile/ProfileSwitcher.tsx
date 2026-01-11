import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import {
    ChevronUpDownIcon,
    CheckIcon,
    PlusIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import ProfileIcon from './ProfileIcon';

interface ProfileSwitcherProps {
    collapsed?: boolean;
}

const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({
    collapsed = false,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { profiles, activeProfile, switchProfile, loadProfiles, hasLoaded } =
        useStore((state) => state.profilesStore);

    useEffect(() => {
        if (!hasLoaded) {
            loadProfiles();
        }
    }, [hasLoaded, loadProfiles]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleProfileSwitch = async (profileUid: string) => {
        if (profileUid === activeProfile?.uid) {
            setIsOpen(false);
            return;
        }

        try {
            await switchProfile(profileUid);
            setIsOpen(false);
            // Navigate to today page after switching
            navigate('/today');
            // Force page reload to refresh all data
            window.location.reload();
        } catch (error) {
            console.error('Failed to switch profile:', error);
        }
    };

    const handleManageProfiles = () => {
        setIsOpen(false);
        navigate('/profile/profiles');
    };

    if (!activeProfile) {
        return null;
    }

    if (collapsed) {
        return (
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={activeProfile.name}
            >
                <ProfileIcon
                    icon={activeProfile.icon}
                    color={activeProfile.color}
                    size="sm"
                />
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <ProfileIcon
                        icon={activeProfile.icon}
                        color={activeProfile.color}
                        size="sm"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {activeProfile.name}
                    </span>
                </div>
                <ChevronUpDownIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
                    <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {t('profiles.switch_to', 'Switch to')}
                    </div>

                    {profiles.map((profile) => (
                        <button
                            key={profile.uid}
                            onClick={() => handleProfileSwitch(profile.uid)}
                            className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <ProfileIcon
                                    icon={profile.icon}
                                    color={profile.color}
                                    size="sm"
                                />
                                <span className="text-sm text-gray-900 dark:text-white truncate">
                                    {profile.name}
                                </span>
                            </div>
                            {profile.uid === activeProfile.uid && (
                                <CheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            )}
                        </button>
                    ))}

                    <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                        <button
                            onClick={handleManageProfiles}
                            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                        >
                            <Cog6ToothIcon className="h-4 w-4" />
                            <span className="text-sm">
                                {t('profiles.manage', 'Manage Profiles')}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSwitcher;
