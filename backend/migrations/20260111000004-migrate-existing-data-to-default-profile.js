'use strict';

const { nanoid } = require('nanoid');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Get all existing users
        const [users] = await queryInterface.sequelize.query(
            'SELECT id FROM users'
        );

        for (const user of users) {
            // Create a default profile for each user
            const profileUid = nanoid(12);
            const now = new Date().toISOString();

            await queryInterface.sequelize.query(
                `INSERT INTO profiles (uid, user_id, name, icon, color, is_default, "order", created_at, updated_at)
                 VALUES (:uid, :userId, 'Default', 'folder', '#6B7280', 1, 0, :now, :now)`,
                {
                    replacements: {
                        uid: profileUid,
                        userId: user.id,
                        now: now,
                    },
                }
            );

            // Get the newly created profile ID
            const [[profile]] = await queryInterface.sequelize.query(
                'SELECT id FROM profiles WHERE uid = :uid',
                { replacements: { uid: profileUid } }
            );

            const profileId = profile.id;

            // Update all user's entities to use this profile
            const tables = [
                'tasks',
                'projects',
                'areas',
                'tags',
                'notes',
                'inbox_items',
                'views',
            ];

            for (const table of tables) {
                await queryInterface.sequelize.query(
                    `UPDATE ${table} SET profile_id = :profileId WHERE user_id = :userId`,
                    {
                        replacements: { profileId, userId: user.id },
                    }
                );
            }

            // Set the user's active profile
            await queryInterface.sequelize.query(
                'UPDATE users SET active_profile_id = :profileId WHERE id = :userId',
                {
                    replacements: { profileId, userId: user.id },
                }
            );
        }

        console.log(
            `Created default profiles for ${users.length} users and migrated their data`
        );
    },

    async down(queryInterface) {
        // Clear profile_id from all entities
        const tables = [
            'tasks',
            'projects',
            'areas',
            'tags',
            'notes',
            'inbox_items',
            'views',
        ];

        for (const table of tables) {
            await queryInterface.sequelize.query(
                `UPDATE ${table} SET profile_id = NULL`
            );
        }

        // Clear active_profile_id from users
        await queryInterface.sequelize.query(
            'UPDATE users SET active_profile_id = NULL'
        );

        // Delete all profiles
        await queryInterface.sequelize.query('DELETE FROM profiles');

        console.log('Reverted profile migration');
    },
};
