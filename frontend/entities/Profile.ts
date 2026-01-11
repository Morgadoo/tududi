export interface Profile {
    uid: string;
    name: string;
    icon: string;
    color: string;
    isDefault: boolean;
    order: number;
}

export const PROFILE_ICONS = [
    'folder',
    'briefcase',
    'home',
    'academic-cap',
    'heart',
    'star',
    'lightning-bolt',
    'globe',
    'code',
    'music',
    'camera',
    'book',
    'puzzle',
    'rocket',
    'sun',
    'moon',
] as const;

export type ProfileIcon = (typeof PROFILE_ICONS)[number];

export const DEFAULT_PROFILE_COLORS = [
    '#6B7280', // Gray
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
];
