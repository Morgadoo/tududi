'use strict';

const { safeAddColumns, safeAddIndex } = require('../utils/migration-utils');

module.exports = {
    async up(queryInterface, Sequelize) {
        const profileIdColumn = {
            name: 'profile_id',
            definition: {
                type: Sequelize.INTEGER,
                allowNull: true, // Initially nullable for migration
                references: {
                    model: 'profiles',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
        };

        // Add profile_id to all entity tables
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
            await safeAddColumns(queryInterface, table, [profileIdColumn]);
            await safeAddIndex(queryInterface, table, ['profile_id']);
        }

        // Add composite index for user_id + profile_id on frequently queried tables
        await safeAddIndex(queryInterface, 'tasks', ['user_id', 'profile_id']);
        await safeAddIndex(queryInterface, 'projects', [
            'user_id',
            'profile_id',
        ]);
        await safeAddIndex(queryInterface, 'tags', ['user_id', 'profile_id']);
    },

    async down(queryInterface) {
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
            try {
                await queryInterface.removeIndex(table, ['profile_id']);
            } catch (e) {
                console.log(`Index removal failed for ${table}:`, e.message);
            }
        }

        // Note: Removing columns in SQLite is complex, handled by safeRemoveColumn
        // For down migration, we'll leave the columns as they won't affect functionality
        console.log(
            'Note: profile_id columns not removed in down migration for SQLite compatibility'
        );
    },
};
