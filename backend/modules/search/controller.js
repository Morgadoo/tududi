'use strict';

const searchService = require('./service');

/**
 * Search controller - handles HTTP requests/responses.
 */
const searchController = {
    /**
     * GET /api/search
     * Universal search endpoint.
     */
    async search(req, res, next) {
        try {
            const userId = req.currentUser?.id;
            const timezone = req.currentUser?.timezone || 'UTC';
            const profileId = req.activeProfileId || null;
            const result = await searchService.search(
                userId,
                req.query,
                timezone,
                profileId
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
};

module.exports = searchController;
