'use strict';

const { safeCreateTable } = require('../utils/migration-utils');

module.exports = {
    async up(queryInterface, Sequelize) {
        await safeCreateTable(queryInterface, 'profiles', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            uid: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            icon: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'folder',
            },
            color: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: '#6B7280',
            },
            is_default: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Add indexes
        await queryInterface.addIndex('profiles', ['user_id']);
        await queryInterface.addIndex('profiles', ['user_id', 'is_default']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('profiles');
    },
};
