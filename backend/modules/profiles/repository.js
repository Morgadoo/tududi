'use strict';

const { Profile } = require('../../models');
const BaseRepository = require('../../shared/database/BaseRepository');

const PUBLIC_ATTRIBUTES = [
    'uid',
    'name',
    'icon',
    'color',
    'is_default',
    'order',
];
const LIST_ATTRIBUTES = [
    'id',
    'uid',
    'name',
    'icon',
    'color',
    'is_default',
    'order',
];

class ProfilesRepository extends BaseRepository {
    constructor() {
        super(Profile);
    }

    /**
     * Find all profiles for a user, ordered by order then name.
     */
    async findAllByUser(userId) {
        return this.model.findAll({
            where: { user_id: userId },
            attributes: LIST_ATTRIBUTES,
            order: [
                ['order', 'ASC'],
                ['name', 'ASC'],
            ],
        });
    }

    /**
     * Find a profile by UID for a specific user.
     */
    async findByUid(userId, uid) {
        return this.model.findOne({
            where: {
                uid,
                user_id: userId,
            },
        });
    }

    /**
     * Find a profile by ID for a specific user.
     */
    async findById(userId, id) {
        return this.model.findOne({
            where: {
                id,
                user_id: userId,
            },
        });
    }

    /**
     * Find a profile by UID with public attributes only.
     */
    async findByUidPublic(userId, uid) {
        return this.model.findOne({
            where: {
                uid,
                user_id: userId,
            },
            attributes: PUBLIC_ATTRIBUTES,
        });
    }

    /**
     * Find the default profile for a user.
     */
    async findDefault(userId) {
        return this.model.findOne({
            where: {
                user_id: userId,
                is_default: true,
            },
        });
    }

    /**
     * Count profiles for a user.
     */
    async countByUser(userId) {
        return this.model.count({
            where: { user_id: userId },
        });
    }

    /**
     * Create a new profile for a user.
     */
    async createForUser(userId, { name, icon, color, is_default, order }) {
        return this.model.create({
            name,
            icon: icon || 'folder',
            color: color || '#6B7280',
            is_default: is_default || false,
            order: order || 0,
            user_id: userId,
        });
    }

    /**
     * Clear default flag from all user's profiles.
     */
    async clearDefaultForUser(userId) {
        return this.model.update(
            { is_default: false },
            { where: { user_id: userId } }
        );
    }
}

module.exports = new ProfilesRepository();
module.exports.PUBLIC_ATTRIBUTES = PUBLIC_ATTRIBUTES;
module.exports.LIST_ATTRIBUTES = LIST_ATTRIBUTES;
