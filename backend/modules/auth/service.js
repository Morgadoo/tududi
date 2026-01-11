'use strict';

const { User, Profile, sequelize } = require('../../models');
const { isAdmin } = require('../../services/rolesService');
const { logError } = require('../../services/logService');
const { getConfig } = require('../../config/config');
const {
    isRegistrationEnabled,
    createUnverifiedUser,
    sendVerificationEmail,
    verifyUserEmail,
} = require('./registrationService');
const packageJson = require('../../../package.json');
const {
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
} = require('../../shared/errors');

class AuthService {
    getVersion() {
        return { version: packageJson.version };
    }

    async getRegistrationStatus() {
        return { enabled: await isRegistrationEnabled() };
    }

    async register(email, password) {
        const transaction = await sequelize.transaction();

        try {
            if (!(await isRegistrationEnabled())) {
                await transaction.rollback();
                throw new NotFoundError('Registration is not enabled');
            }

            if (!email || !password) {
                await transaction.rollback();
                throw new ValidationError('Email and password are required');
            }

            const { user, verificationToken } = await createUnverifiedUser(
                email,
                password,
                transaction
            );

            const emailResult = await sendVerificationEmail(
                user,
                verificationToken
            );

            if (!emailResult.success) {
                await transaction.rollback();
                logError(
                    new Error(emailResult.reason),
                    'Email sending failed during registration, rolling back user creation'
                );
                throw new Error(
                    'Failed to send verification email. Please try again later.'
                );
            }

            await transaction.commit();

            return {
                message:
                    'Registration successful. Please check your email to verify your account.',
            };
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }

            if (error.message === 'Email already registered') {
                throw new ValidationError(error.message);
            }
            if (
                error.message === 'Invalid email format' ||
                error.message === 'Password must be at least 6 characters long'
            ) {
                throw new ValidationError(error.message);
            }
            throw error;
        }
    }

    async verifyEmail(token) {
        if (!token) {
            throw new ValidationError('Verification token is required');
        }

        try {
            await verifyUserEmail(token);
            const config = getConfig();
            return { redirect: `${config.frontendUrl}/login?verified=true` };
        } catch (error) {
            const config = getConfig();
            let errorParam = 'invalid';

            if (error.message === 'Email already verified') {
                errorParam = 'already_verified';
            } else if (error.message === 'Verification token has expired') {
                errorParam = 'expired';
            }

            logError('Email verification error:', error);
            return {
                redirect: `${config.frontendUrl}/login?verified=false&error=${errorParam}`,
            };
        }
    }

    async getCurrentUser(session) {
        if (session && session.userId) {
            const user = await User.findByPk(session.userId, {
                attributes: [
                    'uid',
                    'email',
                    'name',
                    'surname',
                    'language',
                    'appearance',
                    'timezone',
                    'avatar_image',
                    'active_profile_id',
                ],
            });
            if (user) {
                const admin = await isAdmin(user.uid);

                // Get profiles for the user
                const profiles = await Profile.findAll({
                    where: { user_id: session.userId },
                    attributes: [
                        'uid',
                        'name',
                        'icon',
                        'color',
                        'is_default',
                        'order',
                    ],
                    order: [
                        ['order', 'ASC'],
                        ['name', 'ASC'],
                    ],
                });

                // Get active profile
                let activeProfile = null;
                if (user.active_profile_id) {
                    activeProfile = await Profile.findByPk(
                        user.active_profile_id,
                        {
                            attributes: [
                                'uid',
                                'name',
                                'icon',
                                'color',
                                'is_default',
                                'order',
                            ],
                        }
                    );
                }

                // If no active profile but profiles exist, use the default or first one
                if (!activeProfile && profiles.length > 0) {
                    activeProfile =
                        profiles.find((p) => p.is_default) || profiles[0];
                    // Update user's active_profile_id
                    await User.update(
                        { active_profile_id: activeProfile.id },
                        { where: { id: session.userId } }
                    );
                }

                return {
                    user: {
                        uid: user.uid,
                        email: user.email,
                        name: user.name,
                        surname: user.surname,
                        language: user.language,
                        appearance: user.appearance,
                        timezone: user.timezone,
                        avatar_image: user.avatar_image,
                        is_admin: admin,
                    },
                    profiles: profiles.map((p) => ({
                        uid: p.uid,
                        name: p.name,
                        icon: p.icon,
                        color: p.color,
                        isDefault: p.is_default,
                        order: p.order,
                    })),
                    activeProfile: activeProfile
                        ? {
                              uid: activeProfile.uid,
                              name: activeProfile.name,
                              icon: activeProfile.icon,
                              color: activeProfile.color,
                              isDefault: activeProfile.is_default,
                              order: activeProfile.order,
                          }
                        : null,
                };
            }
        }

        return { user: null, profiles: [], activeProfile: null };
    }

    async login(email, password, session) {
        if (!email || !password) {
            throw new ValidationError('Invalid login parameters.');
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const isValidPassword = await User.checkPassword(
            password,
            user.password_digest
        );
        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid credentials');
        }

        if (!user.email_verified) {
            const error = new ForbiddenError(
                'Please verify your email address before logging in.'
            );
            error.email_not_verified = true;
            throw error;
        }

        session.userId = user.id;

        await new Promise((resolve, reject) => {
            session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const admin = await isAdmin(user.uid);

        // Get profiles for the user
        const profiles = await Profile.findAll({
            where: { user_id: user.id },
            attributes: ['uid', 'name', 'icon', 'color', 'is_default', 'order'],
            order: [
                ['order', 'ASC'],
                ['name', 'ASC'],
            ],
        });

        // Get active profile
        let activeProfile = null;
        if (user.active_profile_id) {
            activeProfile = await Profile.findByPk(user.active_profile_id, {
                attributes: [
                    'uid',
                    'name',
                    'icon',
                    'color',
                    'is_default',
                    'order',
                ],
            });
        }

        // If no active profile but profiles exist, use the default or first one
        if (!activeProfile && profiles.length > 0) {
            activeProfile = profiles.find((p) => p.is_default) || profiles[0];
            // Update user's active_profile_id
            await User.update(
                { active_profile_id: activeProfile.id },
                { where: { id: user.id } }
            );
        }

        return {
            user: {
                uid: user.uid,
                email: user.email,
                name: user.name,
                surname: user.surname,
                language: user.language,
                appearance: user.appearance,
                timezone: user.timezone,
                avatar_image: user.avatar_image,
                is_admin: admin,
            },
            profiles: profiles.map((p) => ({
                uid: p.uid,
                name: p.name,
                icon: p.icon,
                color: p.color,
                isDefault: p.is_default,
                order: p.order,
            })),
            activeProfile: activeProfile
                ? {
                      uid: activeProfile.uid,
                      name: activeProfile.name,
                      icon: activeProfile.icon,
                      color: activeProfile.color,
                      isDefault: activeProfile.is_default,
                      order: activeProfile.order,
                  }
                : null,
        };
    }

    logout(session) {
        return new Promise((resolve, reject) => {
            session.destroy((err) => {
                if (err) {
                    logError('Logout error:', err);
                    reject(new Error('Could not log out'));
                } else {
                    resolve({ message: 'Logged out successfully' });
                }
            });
        });
    }
}

module.exports = new AuthService();
