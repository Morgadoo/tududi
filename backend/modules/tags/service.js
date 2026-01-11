'use strict';

const tagsRepository = require('./repository');
const { validateTagName } = require('./validation');
const { NotFoundError, ConflictError } = require('../../shared/errors');

class TagsService {
    /**
     * Get all tags for a user.
     */
    async getAllForUser(userId, profileId = null) {
        const tags = await tagsRepository.findAllByUser(userId, profileId);
        return tags.map((tag) => ({
            uid: tag.uid,
            name: tag.name,
        }));
    }

    /**
     * Get a single tag by uid or name.
     */
    async getByQuery(userId, { uid, name }, profileId = null) {
        let tag = null;

        if (uid) {
            tag = await tagsRepository.findByUid(userId, uid, profileId);
        } else if (name) {
            tag = await tagsRepository.findByName(
                userId,
                decodeURIComponent(name),
                profileId
            );
        }

        if (!tag) {
            throw new NotFoundError('Tag not found');
        }

        return {
            uid: tag.uid,
            name: tag.name,
        };
    }

    /**
     * Create a new tag.
     */
    async create(userId, name, profileId = null) {
        const validatedName = validateTagName(name);

        const exists = await tagsRepository.nameExists(
            userId,
            validatedName,
            null,
            profileId
        );
        if (exists) {
            throw new ConflictError(
                `A tag with the name "${validatedName}" already exists.`
            );
        }

        const tag = await tagsRepository.createForUser(
            userId,
            validatedName,
            profileId
        );

        return {
            uid: tag.uid,
            name: tag.name,
        };
    }

    /**
     * Update a tag's name.
     */
    async update(userId, identifier, newName, profileId = null) {
        const decodedIdentifier = decodeURIComponent(identifier);
        const tag = await tagsRepository.findByIdentifier(
            userId,
            decodedIdentifier,
            profileId
        );

        if (!tag) {
            throw new NotFoundError('Tag not found');
        }

        const validatedName = validateTagName(newName);

        // Check for name conflict if changing name
        if (validatedName !== tag.name) {
            const exists = await tagsRepository.nameExists(
                userId,
                validatedName,
                tag.id,
                profileId
            );
            if (exists) {
                throw new ConflictError(
                    `A tag with the name "${validatedName}" already exists.`
                );
            }
        }

        await tagsRepository.update(tag, { name: validatedName });

        return {
            id: tag.id,
            name: tag.name,
        };
    }

    /**
     * Delete a tag and all its associations.
     */
    async delete(userId, identifier, profileId = null) {
        const decodedIdentifier = decodeURIComponent(identifier);
        const tag = await tagsRepository.findByIdentifier(
            userId,
            decodedIdentifier,
            profileId
        );

        if (!tag) {
            throw new NotFoundError('Tag not found');
        }

        await tagsRepository.deleteWithAssociations(tag);

        return { message: 'Tag successfully deleted' };
    }
}

// Export singleton instance
module.exports = new TagsService();
