const bcrypt = require('bcrypt');
const { User, Profile } = require('../../models');

const createTestUser = async (userData = {}) => {
    const defaultUser = {
        email: 'test@example.com',
        password_digest:
            '$2b$10$DPcA0XSvK9FT04mLyKGza.uHb8d.bESwP.XdQfQ47.sKVT4fYzbP.', // Pre-computed hash for 'password123'
        ...userData,
    };

    return await User.create(defaultUser);
};

/**
 * Create a test user with a default profile already set up.
 * This is the recommended way to create users for profile-aware tests.
 */
const createTestUserWithProfile = async (userData = {}, profileData = {}) => {
    const user = await createTestUser(userData);

    const defaultProfile = {
        name: 'Default',
        icon: 'folder',
        color: '#6B7280',
        is_default: true,
        order: 0,
        user_id: user.id,
        ...profileData,
    };

    const profile = await Profile.create(defaultProfile);

    // Set the active profile on the user
    await user.update({ active_profile_id: profile.id });

    return { user, profile };
};

/**
 * Create a test profile for an existing user.
 */
const createTestProfile = async (user, profileData = {}) => {
    const existingCount = await Profile.count({ where: { user_id: user.id } });

    const defaultProfile = {
        name: `Profile ${existingCount + 1}`,
        icon: 'folder',
        color: '#6B7280',
        is_default: existingCount === 0,
        order: existingCount,
        user_id: user.id,
        ...profileData,
    };

    return await Profile.create(defaultProfile);
};

/**
 * Switch the active profile for a user.
 */
const switchActiveProfile = async (user, profile) => {
    await user.update({ active_profile_id: profile.id });
    await user.reload();
    return user;
};

const authenticateUser = async (request, user) => {
    const response = await request.post('/api/login').send({
        email: user.email,
        password: 'password123',
    });

    return response.headers['set-cookie'];
};

module.exports = {
    createTestUser,
    createTestUserWithProfile,
    createTestProfile,
    switchActiveProfile,
    authenticateUser,
};
