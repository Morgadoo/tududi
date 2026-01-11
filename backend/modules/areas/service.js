'use strict';

const _ = require('lodash');
const areasRepository = require('./repository');
const { PUBLIC_ATTRIBUTES } = require('./repository');
const { validateName, validateUid } = require('./validation');
const { NotFoundError } = require('../../shared/errors');

class AreasService {
    /**
     * Get all areas for a user.
     */
    async getAll(userId, profileId = null) {
        return areasRepository.findAllByUser(userId, profileId);
    }

    /**
     * Get a single area by UID.
     */
    async getByUid(userId, uid, profileId = null) {
        validateUid(uid);

        const area = await areasRepository.findByUidPublic(
            userId,
            uid,
            profileId
        );

        if (!area) {
            throw new NotFoundError(
                "Area not found or doesn't belong to the current user."
            );
        }

        return area;
    }

    /**
     * Create a new area.
     */
    async create(userId, { name, description, profile_id }) {
        const validatedName = validateName(name);

        const area = await areasRepository.createForUser(userId, {
            name: validatedName,
            description,
            profile_id,
        });

        return _.pick(area, PUBLIC_ATTRIBUTES);
    }

    /**
     * Update an area.
     */
    async update(userId, uid, { name, description }, profileId = null) {
        validateUid(uid);

        const area = await areasRepository.findByUid(userId, uid, profileId);

        if (!area) {
            throw new NotFoundError('Area not found.');
        }

        const updateData = {};

        if (name !== undefined) {
            updateData.name = name;
        }
        if (description !== undefined) {
            updateData.description = description;
        }

        await areasRepository.update(area, updateData);

        return _.pick(area, PUBLIC_ATTRIBUTES);
    }

    /**
     * Delete an area.
     */
    async delete(userId, uid, profileId = null) {
        validateUid(uid);

        const area = await areasRepository.findByUid(userId, uid, profileId);

        if (!area) {
            throw new NotFoundError('Area not found.');
        }

        await areasRepository.destroy(area);

        return null; // 204 No Content
    }
}

module.exports = new AreasService();
