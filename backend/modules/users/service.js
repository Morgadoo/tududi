'use strict';

const usersRepository = require('./repository');
const {
    validateFirstDayOfWeek,
    validatePassword,
    validateFrequency,
    validateApiKeyId,
    validateApiKeyName,
    validateExpiresAt,
    validateSidebarSettings,
} = require('./validation');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { User } = require('../../models');
const {
    createApiToken,
    revokeApiToken,
    deleteApiToken,
    serializeApiToken,
} = require('./apiTokenService');
const taskSummaryService = require('../tasks/taskSummaryService');
const { logError } = require('../../services/logService');
const fs = require('fs').promises;
const path = require('path');

// Fields that can be directly copied from data to allowedUpdates
const SIMPLE_PROFILE_FIELDS = [
    'name',
    'surname',
    'appearance',
    'language',
    'timezone',
    'avatar_image',
    'telegram_bot_token',
    'telegram_allowed_users',
    'task_intelligence_enabled',
    'task_summary_enabled',
    'task_summary_frequency',
    'auto_suggest_next_actions_enabled',
    'productivity_assistant_enabled',
    'next_task_suggestion_enabled',
    'pomodoro_enabled',
    'ui_settings',
    'notification_preferences',
    'keyboard_shortcuts',
];

// Copy allowed fields from source to target if defined
function copyDefinedFields(source, target, fields) {
    for (const field of fields) {
        if (source[field] !== undefined) {
            target[field] = source[field];
        }
    }
}

class UsersService {
    /**
     * List all users with roles.
     */
    async listUsers() {
        const users = await usersRepository.findAllBasic();
        const roles = await usersRepository.findAllRoles();
        const userIdToRole = new Map(roles.map((r) => [r.user_id, r.is_admin]));

        return users.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            surname: u.surname,
            role: userIdToRole.get(u.id) ? 'admin' : 'user',
        }));
    }

    /**
     * Get user profile.
     */
    async getProfile(userId) {
        const user = await usersRepository.findProfileById(userId);
        if (!user) {
            throw new NotFoundError('Profile not found.');
        }

        // Parse today_settings if it's a string
        if (user.today_settings && typeof user.today_settings === 'string') {
            try {
                user.today_settings = JSON.parse(user.today_settings);
            } catch (error) {
                logError('Error parsing today_settings:', error);
                user.today_settings = null;
            }
        }
        if (user.ui_settings && typeof user.ui_settings === 'string') {
            try {
                user.ui_settings = JSON.parse(user.ui_settings);
            } catch (error) {
                logError('Error parsing ui_settings:', error);
                user.ui_settings = null;
            }
        }

        return user;
    }

    /**
     * Update user profile.
     */
    async updateProfile(userId, data) {
        const user = await usersRepository.findByIdWithPassword(userId);
        if (!user) {
            throw new NotFoundError('Profile not found.');
        }

        const allowedUpdates = {};

        // Copy simple fields
        copyDefinedFields(data, allowedUpdates, SIMPLE_PROFILE_FIELDS);

        // Handle first_day_of_week with validation
        if (data.first_day_of_week !== undefined) {
            validateFirstDayOfWeek(data.first_day_of_week);
            allowedUpdates.first_day_of_week = data.first_day_of_week;
        }

        // Handle password change if provided
        if (data.currentPassword && data.newPassword) {
            validatePassword(data.newPassword, 'newPassword');

            const isValidPassword = await User.checkPassword(
                data.currentPassword,
                user.password_digest
            );
            if (!isValidPassword) {
                throw new ValidationError(
                    'Current password is incorrect',
                    'currentPassword'
                );
            }

            const hashedNewPassword = await User.hashPassword(data.newPassword);
            allowedUpdates.password_digest = hashedNewPassword;
        }

        await usersRepository.update(user, allowedUpdates);
        return usersRepository.findUpdatedProfile(user.id);
    }

    /**
     * Upload avatar.
     */
    async uploadAvatar(userId, file) {
        if (!file) {
            throw new ValidationError('No file uploaded');
        }

        const user = await usersRepository.findById(userId);
        if (!user) {
            await fs.unlink(file.path).catch(() => {});
            throw new NotFoundError('User not found');
        }

        // Delete old avatar file if it exists
        if (user.avatar_image) {
            const oldAvatarPath = path.join(
                __dirname,
                '../../uploads/avatars',
                path.basename(user.avatar_image)
            );
            await fs.unlink(oldAvatarPath).catch(() => {});
        }

        const avatarUrl = `/uploads/avatars/${path.basename(file.path)}`;
        await usersRepository.update(user, { avatar_image: avatarUrl });

        return {
            success: true,
            avatar_image: avatarUrl,
            message: 'Avatar uploaded successfully',
        };
    }

    /**
     * Delete avatar.
     */
    async deleteAvatar(userId) {
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.avatar_image) {
            const avatarPath = path.join(
                __dirname,
                '../../uploads/avatars',
                path.basename(user.avatar_image)
            );
            await fs.unlink(avatarPath).catch(() => {});
        }

        await usersRepository.update(user, { avatar_image: null });

        return { success: true, message: 'Avatar removed successfully' };
    }

    /**
     * Change password.
     */
    async changePassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw new ValidationError(
                'Current password and new password are required'
            );
        }

        validatePassword(newPassword, 'newPassword');

        const user = await usersRepository.findByIdWithPassword(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const isValidPassword = await User.checkPassword(
            currentPassword,
            user.password_digest
        );
        if (!isValidPassword) {
            throw new ValidationError(
                'Current password is incorrect',
                'currentPassword'
            );
        }

        const hashedNewPassword = await User.hashPassword(newPassword);
        await usersRepository.update(user, {
            password_digest: hashedNewPassword,
        });

        return { message: 'Password changed successfully' };
    }

    /**
     * List API keys.
     */
    async listApiKeys(userId) {
        const tokens = await usersRepository.findApiTokens(userId);
        return tokens.map(serializeApiToken);
    }

    /**
     * Create API key.
     */
    async createApiKey(userId, name, expires_at) {
        const validatedName = validateApiKeyName(name);
        const expiresAtDate = validateExpiresAt(expires_at);

        const { rawToken, tokenRecord } = await createApiToken({
            userId,
            name: validatedName,
            expiresAt: expiresAtDate,
        });

        return {
            token: rawToken,
            apiKey: serializeApiToken(tokenRecord),
        };
    }

    /**
     * Revoke API key.
     */
    async revokeApiKey(userId, keyId) {
        const tokenId = validateApiKeyId(keyId);
        const token = await revokeApiToken(tokenId, userId);
        if (!token) {
            throw new NotFoundError('API key not found.');
        }
        return serializeApiToken(token);
    }

    /**
     * Delete API key.
     */
    async deleteApiKey(userId, keyId) {
        const tokenId = validateApiKeyId(keyId);
        const deleted = await deleteApiToken(tokenId, userId);
        if (!deleted) {
            throw new NotFoundError('API key not found.');
        }
        return null;
    }

    /**
     * Toggle task summary.
     */
    async toggleTaskSummary(userId) {
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        const enabled = !user.task_summary_enabled;
        await usersRepository.update(user, { task_summary_enabled: enabled });

        return {
            success: true,
            enabled,
            message: enabled
                ? 'Task summary notifications have been enabled.'
                : 'Task summary notifications have been disabled.',
        };
    }

    /**
     * Update task summary frequency.
     */
    async updateTaskSummaryFrequency(userId, frequency) {
        const validatedFrequency = validateFrequency(frequency);

        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        await usersRepository.update(user, {
            task_summary_frequency: validatedFrequency,
        });

        return {
            success: true,
            frequency: validatedFrequency,
            message: `Task summary frequency has been set to ${validatedFrequency}.`,
        };
    }

    /**
     * Send task summary now.
     */
    async sendTaskSummaryNow(userId) {
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        if (!user.telegram_bot_token || !user.telegram_chat_id) {
            throw new ValidationError(
                'Telegram bot is not properly configured.'
            );
        }

        const success = await taskSummaryService.sendSummaryToUser(user.id);

        if (!success) {
            throw new ValidationError('Failed to send message to Telegram.');
        }

        return {
            success: true,
            message: 'Task summary was sent to your Telegram.',
        };
    }

    /**
     * Get task summary status.
     */
    async getTaskSummaryStatus(userId) {
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        return {
            success: true,
            enabled: user.task_summary_enabled,
            frequency: user.task_summary_frequency,
            last_run: user.task_summary_last_run,
            next_run: user.task_summary_next_run,
        };
    }

    /**
     * Update today settings.
     */
    async updateTodaySettings(userId, data) {
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        const {
            showMetrics,
            projectShowMetrics,
            showProductivity,
            showNextTaskSuggestion,
            showSuggestions,
            showDueToday,
            showCompleted,
            showDailyQuote,
        } = data;

        const todaySettings = {
            projectShowMetrics:
                projectShowMetrics !== undefined
                    ? projectShowMetrics
                    : (user.today_settings?.projectShowMetrics ?? true),
            showMetrics:
                showMetrics !== undefined
                    ? showMetrics
                    : user.today_settings?.showMetrics || false,
            showProductivity:
                showProductivity !== undefined
                    ? showProductivity
                    : user.today_settings?.showProductivity || false,
            showNextTaskSuggestion:
                showNextTaskSuggestion !== undefined
                    ? showNextTaskSuggestion
                    : user.today_settings?.showNextTaskSuggestion || false,
            showSuggestions:
                showSuggestions !== undefined
                    ? showSuggestions
                    : user.today_settings?.showSuggestions || false,
            showDueToday:
                showDueToday !== undefined
                    ? showDueToday
                    : user.today_settings?.showDueToday || true,
            showCompleted:
                showCompleted !== undefined
                    ? showCompleted
                    : user.today_settings?.showCompleted || true,
            showProgressBar: true,
            showDailyQuote:
                showDailyQuote !== undefined
                    ? showDailyQuote
                    : user.today_settings?.showDailyQuote || true,
        };

        const profileUpdates = { today_settings: todaySettings };
        if (showProductivity !== undefined) {
            profileUpdates.productivity_assistant_enabled = showProductivity;
        }
        if (showNextTaskSuggestion !== undefined) {
            profileUpdates.next_task_suggestion_enabled =
                showNextTaskSuggestion;
        }

        await usersRepository.update(user, profileUpdates);

        return { success: true, today_settings: todaySettings };
    }

    /**
     * Update sidebar settings.
     */
    async updateSidebarSettings(userId, data) {
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        const { pinnedViewsOrder } = validateSidebarSettings(data);
        const sidebarSettings = { pinnedViewsOrder };

        await usersRepository.update(user, {
            sidebar_settings: sidebarSettings,
        });

        return { success: true, sidebar_settings: sidebarSettings };
    }

    /**
     * Update UI settings.
     */
    async updateUiSettings(userId, data) {
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        const { project } = data;

        const currentSettings =
            user.ui_settings && typeof user.ui_settings === 'object'
                ? user.ui_settings
                : { project: { details: {} } };

        const newSettings = {
            ...currentSettings,
            project: {
                ...(currentSettings.project || {}),
                ...(project || {}),
                details: {
                    ...((currentSettings.project &&
                        currentSettings.project.details) ||
                        {}),
                    ...((project && project.details) || {}),
                },
            },
        };

        await usersRepository.update(user, { ui_settings: newSettings });

        return { success: true, ui_settings: newSettings };
    }
}

module.exports = new UsersService();
