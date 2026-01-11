'use strict';

const { ValidationError } = require('../../shared/errors');

const VALID_ICONS = [
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
];

const MAX_PROFILES_PER_USER = 10;

/**
 * Validate profile name.
 */
function validateName(name) {
    if (!name || typeof name !== 'string') {
        throw new ValidationError('Profile name is required.');
    }

    const trimmed = name.trim();

    if (trimmed.length === 0) {
        throw new ValidationError('Profile name cannot be empty.');
    }

    if (trimmed.length > 50) {
        throw new ValidationError(
            'Profile name must be 50 characters or less.'
        );
    }

    return trimmed;
}

/**
 * Validate profile UID.
 */
function validateUid(uid) {
    if (!uid || typeof uid !== 'string') {
        throw new ValidationError('Profile UID is required.');
    }
    return uid;
}

/**
 * Validate profile icon.
 */
function validateIcon(icon) {
    if (!icon) return 'folder';

    if (!VALID_ICONS.includes(icon)) {
        throw new ValidationError(
            `Invalid icon. Must be one of: ${VALID_ICONS.join(', ')}`
        );
    }

    return icon;
}

/**
 * Validate profile color (hex color).
 */
function validateColor(color) {
    if (!color) return '#6B7280';

    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    if (!hexColorRegex.test(color)) {
        throw new ValidationError(
            'Invalid color. Must be a valid hex color (e.g., #FF5733).'
        );
    }

    return color;
}

module.exports = {
    validateName,
    validateUid,
    validateIcon,
    validateColor,
    VALID_ICONS,
    MAX_PROFILES_PER_USER,
};
