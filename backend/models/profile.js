const { DataTypes } = require('sequelize');
const { uid } = require('../utils/uid');

module.exports = (sequelize) => {
    const Profile = sequelize.define(
        'Profile',
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
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            icon: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'folder',
            },
            color: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: '#6B7280',
            },
            is_default: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            tableName: 'profiles',
            indexes: [
                {
                    fields: ['user_id'],
                },
                {
                    fields: ['user_id', 'is_default'],
                },
            ],
            hooks: {
                beforeUpdate: (profile) => {
                    if (profile.changed('uid')) {
                        throw new Error('Cannot update uid after creation');
                    }
                },
            },
        }
    );

    return Profile;
};
