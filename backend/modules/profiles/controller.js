'use strict';

const profilesService = require('./service');
const { UnauthorizedError } = require('../../shared/errors');
const { getAuthenticatedUserId } = require('../../utils/request-utils');

/**
 * Get authenticated user ID or throw UnauthorizedError.
 */
function requireUserId(req) {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
        throw new UnauthorizedError('Authentication required');
    }
    return userId;
}

/**
 * Profiles controller - handles HTTP requests/responses.
 */
const profilesController = {
    /**
     * GET /api/v1/profiles
     * List all profiles for the current user.
     */
    async list(req, res, next) {
        try {
            const userId = requireUserId(req);
            const profiles = await profilesService.getAll(userId);
            res.json({ profiles });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/v1/profiles/active
     * Get the active profile for the current user.
     */
    async getActive(req, res, next) {
        try {
            const userId = requireUserId(req);
            const profile = await profilesService.getActiveProfile(userId);
            res.json({ profile });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/v1/profiles/:uid
     * Get a single profile by UID.
     */
    async getOne(req, res, next) {
        try {
            const userId = requireUserId(req);
            const { uid } = req.params;
            const profile = await profilesService.getByUid(userId, uid);
            res.json({ profile });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/v1/profiles
     * Create a new profile.
     */
    async create(req, res, next) {
        try {
            const userId = requireUserId(req);
            const { name, icon, color, is_default } = req.body;
            const profile = await profilesService.create(userId, {
                name,
                icon,
                color,
                is_default,
            });
            res.status(201).json({ profile });
        } catch (error) {
            next(error);
        }
    },

    /**
     * PATCH /api/v1/profiles/:uid
     * Update a profile.
     */
    async update(req, res, next) {
        try {
            const userId = requireUserId(req);
            const { uid } = req.params;
            const { name, icon, color, is_default, order } = req.body;
            const profile = await profilesService.update(userId, uid, {
                name,
                icon,
                color,
                is_default,
                order,
            });
            res.json({ profile });
        } catch (error) {
            next(error);
        }
    },

    /**
     * PATCH /api/v1/profiles/switch/:uid
     * Switch to a different profile.
     */
    async switchProfile(req, res, next) {
        try {
            const userId = requireUserId(req);
            const { uid } = req.params;
            const profile = await profilesService.switchActiveProfile(
                userId,
                uid
            );
            res.json({ profile, message: 'Profile switched successfully' });
        } catch (error) {
            next(error);
        }
    },

    /**
     * DELETE /api/v1/profiles/:uid
     * Delete a profile and all its data.
     */
    async delete(req, res, next) {
        try {
            const userId = requireUserId(req);
            const { uid } = req.params;
            await profilesService.delete(userId, uid);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },
};

module.exports = profilesController;
