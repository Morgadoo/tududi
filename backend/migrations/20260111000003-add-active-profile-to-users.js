'use strict';

const { safeAddColumns } = require('../utils/migration-utils');

module.exports = {
    async up(queryInterface, Sequelize) {
        await safeAddColumns(queryInterface, 'users', [
            {
                name: 'active_profile_id',
                definition: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: {
                        model: 'profiles',
                        key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL',
                },
            },
        ]);
    },

    async down(queryInterface) {
        // SQLite doesn't support removing columns easily
        console.log(
            'Note: active_profile_id column not removed in down migration for SQLite compatibility'
        );
    },
};
