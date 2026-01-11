'use strict';

const { Profile } = require('../models');
const { ForbiddenError } = require('../shared/errors');

/**
 * Validate that a profile belongs to a specific user.
 * This is a security helper to ensure profile isolation.
 *
 * @param {number} userId - The user ID to validate against
 * @param {number|null} profileId - The profile ID to validate
 * @returns {Promise<boolean>} True if valid, throws ForbiddenError if invalid
 * @throws {ForbiddenError} If profileId is provided but doesn't belong to userId
 */
async function validateProfileOwnership(userId, profileId) {
    // If no profileId provided, validation passes (optional profile)
    if (!profileId) {
        return true;
    }

    const profile = await Profile.findByPk(profileId);

    // Profile doesn't exist or doesn't belong to user
    if (!profile || profile.user_id !== userId) {
        throw new ForbiddenError('Invalid profile');
    }

    return true;
}

/**
 * Get the profile ID for a user, ensuring it belongs to them.
 * Returns the profileId if valid, or null if not provided.
 *
 * @param {number} userId - The user ID to validate against
 * @param {number|null} profileId - The profile ID to validate
 * @returns {Promise<number|null>} The validated profileId or null
 * @throws {ForbiddenError} If profileId is provided but doesn't belong to userId
 */
async function getValidatedProfileId(userId, profileId) {
    if (!profileId) {
        return null;
    }

    await validateProfileOwnership(userId, profileId);
    return profileId;
}

module.exports = {
    validateProfileOwnership,
    getValidatedProfileId,
};
