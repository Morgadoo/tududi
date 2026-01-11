const { DataTypes } = require('sequelize');
const { uid } = require('../utils/uid');

module.exports = (sequelize) => {
    const Note = sequelize.define(
        'Note',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            uid: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                defaultValue: uid,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            profile_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'profiles',
                    key: 'id',
                },
            },
            project_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'projects',
                    key: 'id',
                },
            },
            color: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: 'notes',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                {
                    fields: ['user_id'],
                },
                {
                    fields: ['project_id'],
                },
                {
                    fields: ['profile_id'],
                },
                {
                    fields: ['user_id', 'profile_id'],
                },
            ],
        }
    );

    return Note;
};
