import React from 'react';
import {
    FolderIcon,
    BriefcaseIcon,
    HomeIcon,
    AcademicCapIcon,
    HeartIcon,
    StarIcon,
    BoltIcon,
    GlobeAltIcon,
    CodeBracketIcon,
    MusicalNoteIcon,
    CameraIcon,
    BookOpenIcon,
    PuzzlePieceIcon,
    RocketLaunchIcon,
    SunIcon,
    MoonIcon,
} from '@heroicons/react/24/outline';

interface ProfileIconProps {
    icon: string;
    color: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    folder: FolderIcon,
    briefcase: BriefcaseIcon,
    home: HomeIcon,
    'academic-cap': AcademicCapIcon,
    heart: HeartIcon,
    star: StarIcon,
    'lightning-bolt': BoltIcon,
    globe: GlobeAltIcon,
    code: CodeBracketIcon,
    music: MusicalNoteIcon,
    camera: CameraIcon,
    book: BookOpenIcon,
    puzzle: PuzzlePieceIcon,
    rocket: RocketLaunchIcon,
    sun: SunIcon,
    moon: MoonIcon,
};

const sizeClasses = {
    xs: {
        container: 'w-5 h-5',
        icon: 'w-3 h-3',
    },
    sm: {
        container: 'w-7 h-7',
        icon: 'w-4 h-4',
    },
    md: {
        container: 'w-9 h-9',
        icon: 'w-5 h-5',
    },
    lg: {
        container: 'w-12 h-12',
        icon: 'w-7 h-7',
    },
};

const ProfileIcon: React.FC<ProfileIconProps> = ({
    icon,
    color,
    size = 'md',
    className = '',
}) => {
    const IconComponent = iconMap[icon] || FolderIcon;
    const sizes = sizeClasses[size];

    return (
        <div
            className={`${sizes.container} rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
            style={{ backgroundColor: color }}
        >
            <IconComponent className={`${sizes.icon} text-white`} />
        </div>
    );
};

export default ProfileIcon;
