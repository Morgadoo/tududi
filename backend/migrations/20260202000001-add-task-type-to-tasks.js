'use strict';

const { safeAddColumns, safeAddIndex } = require('../utils/migration-utils');

module.exports = {
    async up(queryInterface, Sequelize) {
        await safeAddColumns(queryInterface, 'tasks', [
            {
                name: 'task_type',
                definition: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    defaultValue: null,
                    comment:
                        'Task type: 0=Business Projects, 1=Internal Projects, 2=Changes, 3=Unplanned Work',
                },
            },
        ]);

        await safeAddIndex(queryInterface, 'tasks', ['task_type']);
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('tasks', ['task_type']);
        await queryInterface.removeColumn('tasks', 'task_type');
    },
};
