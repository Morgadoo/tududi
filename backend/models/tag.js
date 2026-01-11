const { DataTypes } = require('sequelize');
const { uid } = require('../utils/uid');

module.exports = (sequelize) => {
    const Tag = sequelize.define(
        'Tag',
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
            name: {
                type: DataTypes.STRING,
                allowNull: false,
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
        },
        {
            tableName: 'tags',
            indexes: [
                {
                    fields: ['user_id'],
                    name: 'tags_user_id',
                },
                {
                    fields: ['profile_id'],
                    name: 'tags_profile_id',
                },
                {
                    fields: ['user_id', 'profile_id'],
                    name: 'tags_user_id_profile_id',
                },
                {
                    // Tags are unique per profile - allows same tag name in different profiles
                    unique: true,
                    fields: ['user_id', 'profile_id', 'name'],
                    name: 'tags_user_profile_name_unique',
                },
            ],
        }
    );

    return Tag;
};
