'use strict';

const _ = require('lodash');
const profilesRepository = require('./repository');
const { PUBLIC_ATTRIBUTES } = require('./repository');
const {
    validateName,
    validateUid,
    validateIcon,
    validateColor,
    MAX_PROFILES_PER_USER,
} = require('./validation');
const {
    NotFoundError,
    ValidationError,
    ForbiddenError,
} = require('../../shared/errors');
const {
    User,
    Task,
    Project,
    Area,
    Tag,
    Note,
    InboxItem,
    View,
    sequelize,
} = require('../../models');

class ProfilesService {
    /**
     * Get all profiles for a user.
     */
    async getAll(userId) {
        return profilesRepository.findAllByUser(userId);
    }

    /**
     * Get a single profile by UID.
     */
    async getByUid(userId, uid) {
        validateUid(uid);

        const profile = await profilesRepository.findByUidPublic(userId, uid);

        if (!profile) {
            throw new NotFoundError(
                "Profile not found or doesn't belong to the current user."
            );
        }

        return profile;
    }

    /**
     * Get the active profile for a user, or create default if none exists.
     */
    async getActiveProfile(userId) {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new NotFoundError('User not found.');
        }

        // If user has an active profile, return it
        if (user.active_profile_id) {
            const profile = await profilesRepository.findById(
                userId,
                user.active_profile_id
            );
            if (profile) {
                return _.pick(profile, PUBLIC_ATTRIBUTES);
            }
        }

        // Try to find default profile
        let profile = await profilesRepository.findDefault(userId);

        // If no profile exists, create a default one
        if (!profile) {
            profile = await this.create(userId, {
                name: 'Default',
                icon: 'folder',
                color: '#6B7280',
                is_default: true,
            });

            // Set as active profile
            await User.update(
                { active_profile_id: profile.id },
                { where: { id: userId } }
            );
        } else if (!user.active_profile_id) {
            // Set default as active if user has no active profile
            await User.update(
                { active_profile_id: profile.id },
                { where: { id: userId } }
            );
        }

        return _.pick(profile, PUBLIC_ATTRIBUTES);
    }

    /**
     * Create a new profile.
     */
    async create(userId, { name, icon, color, is_default }) {
        const validatedName = validateName(name);
        const validatedIcon = validateIcon(icon);
        const validatedColor = validateColor(color);

        // Check profile limit
        const profileCount = await profilesRepository.countByUser(userId);
        if (profileCount >= MAX_PROFILES_PER_USER) {
            throw new ValidationError(
                `Maximum of ${MAX_PROFILES_PER_USER} profiles allowed per user.`
            );
        }

        // If this is the first profile or marked as default, handle default flag
        if (is_default || profileCount === 0) {
            await profilesRepository.clearDefaultForUser(userId);
        }

        const profile = await profilesRepository.createForUser(userId, {
            name: validatedName,
            icon: validatedIcon,
            color: validatedColor,
            is_default: is_default || profileCount === 0,
            order: profileCount,
        });

        return _.pick(profile, ['id', ...PUBLIC_ATTRIBUTES]);
    }

    /**
     * Update a profile.
     */
    async update(userId, uid, { name, icon, color, is_default, order }) {
        validateUid(uid);

        const profile = await profilesRepository.findByUid(userId, uid);

        if (!profile) {
            throw new NotFoundError('Profile not found.');
        }

        const updateData = {};

        if (name !== undefined) {
            updateData.name = validateName(name);
        }
        if (icon !== undefined) {
            updateData.icon = validateIcon(icon);
        }
        if (color !== undefined) {
            updateData.color = validateColor(color);
        }
        if (order !== undefined) {
            updateData.order = order;
        }
        if (is_default === true) {
            // Clear other defaults first
            await profilesRepository.clearDefaultForUser(userId);
            updateData.is_default = true;
        }

        await profilesRepository.update(profile, updateData);

        return _.pick(profile, PUBLIC_ATTRIBUTES);
    }

    /**
     * Switch the active profile for a user.
     */
    async switchActiveProfile(userId, profileUid) {
        validateUid(profileUid);

        const profile = await profilesRepository.findByUid(userId, profileUid);

        if (!profile) {
            throw new NotFoundError('Profile not found.');
        }

        await User.update(
            { active_profile_id: profile.id },
            { where: { id: userId } }
        );

        return _.pick(profile, PUBLIC_ATTRIBUTES);
    }

    /**
     * Delete a profile.
     * WARNING: This deletes ALL data associated with the profile!
     */
    async delete(userId, uid) {
        validateUid(uid);

        const profile = await profilesRepository.findByUid(userId, uid);

        if (!profile) {
            throw new NotFoundError('Profile not found.');
        }

        // Check if this is the only profile
        const profileCount = await profilesRepository.countByUser(userId);
        if (profileCount <= 1) {
            throw new ForbiddenError(
                'Cannot delete the only profile. Create another profile first.'
            );
        }

        // Check if this is the active profile
        const user = await User.findByPk(userId);
        if (user.active_profile_id === profile.id) {
            throw new ForbiddenError(
                'Cannot delete the active profile. Switch to another profile first.'
            );
        }

        // Delete all associated data in a transaction
        const transaction = await sequelize.transaction();

        try {
            // Delete in order of dependencies
            await Task.destroy({
                where: { profile_id: profile.id },
                transaction,
            });

            await Note.destroy({
                where: { profile_id: profile.id },
                transaction,
            });

            await Project.destroy({
                where: { profile_id: profile.id },
                transaction,
            });

            await Area.destroy({
                where: { profile_id: profile.id },
                transaction,
            });

            await Tag.destroy({
                where: { profile_id: profile.id },
                transaction,
            });

            await InboxItem.destroy({
                where: { profile_id: profile.id },
                transaction,
            });

            await View.destroy({
                where: { profile_id: profile.id },
                transaction,
            });

            // Delete the profile itself
            await profilesRepository.destroy(profile, { transaction });

            // If deleted profile was default, set another as default
            if (profile.is_default) {
                const remainingProfile =
                    await profilesRepository.findAllByUser(userId);
                if (remainingProfile.length > 0) {
                    await profilesRepository.update(
                        remainingProfile[0],
                        { is_default: true },
                        { transaction }
                    );
                }
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        return null;
    }
}

module.exports = new ProfilesService();
