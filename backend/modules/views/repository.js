'use strict';

const BaseRepository = require('../../shared/database/BaseRepository');
const { View } = require('../../models');

class ViewsRepository extends BaseRepository {
    constructor() {
        super(View);
    }

    async findAllByUser(userId, profileId = null) {
        const where = { user_id: userId };
        if (profileId) {
            where.profile_id = profileId;
        }
        return this.model.findAll({
            where,
            order: [
                ['is_pinned', 'DESC'],
                ['created_at', 'DESC'],
            ],
        });
    }

    async findPinnedByUser(userId, profileId = null) {
        const where = { user_id: userId, is_pinned: true };
        if (profileId) {
            where.profile_id = profileId;
        }
        return this.model.findAll({
            where,
            order: [['created_at', 'DESC']],
        });
    }

    async findByUidAndUser(uid, userId, profileId = null) {
        const where = { uid, user_id: userId };
        if (profileId) {
            where.profile_id = profileId;
        }
        return this.model.findOne({ where });
    }

    async createForUser(userId, data, profileId = null) {
        return this.model.create({
            ...data,
            user_id: userId,
            profile_id: profileId,
        });
    }
}

module.exports = new ViewsRepository();
