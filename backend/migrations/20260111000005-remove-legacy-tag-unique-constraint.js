'use strict';

/**
 * Migration: Remove legacy tag unique constraint to enable profile-scoped tags
 *
 * Before: Tags are unique per (user_id, name) - prevents same tag name across profiles
 * After: Tags are unique per (user_id, profile_id, name) - allows same tag name in different profiles
 *
 * This enables proper tag isolation between profiles, so a user can have
 * "urgent" tag in both their "Work" and "Personal" profiles.
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // CRITICAL: Disable foreign keys BEFORE starting transaction
        await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF;');

        const transaction = await queryInterface.sequelize.transaction();

        try {
            console.log(
                '📋 Removing legacy (user_id, name) unique constraint from tags...'
            );

            // Step 1: Check current indexes
            const [indexes] = await queryInterface.sequelize.query(
                "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='tags';",
                { transaction }
            );
            console.log(
                '📊 Current indexes:',
                indexes.map((i) => i.name)
            );

            // Step 2: Create new tags table without the legacy constraint
            await queryInterface.sequelize.query(
                `
                CREATE TABLE tags_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    uid VARCHAR(255) NOT NULL UNIQUE,
                    name VARCHAR(255) NOT NULL,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    profile_id INTEGER REFERENCES profiles(id),
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL
                );
            `,
                { transaction }
            );

            // Step 3: Copy all existing data
            const [countBefore] = await queryInterface.sequelize.query(
                'SELECT COUNT(*) as count FROM tags;',
                { transaction, type: Sequelize.QueryTypes.SELECT }
            );
            console.log(`📊 Tags to migrate: ${countBefore.count}`);

            await queryInterface.sequelize.query(
                `
                INSERT INTO tags_new (id, uid, name, user_id, profile_id, created_at, updated_at)
                SELECT id, uid, name, user_id, profile_id, created_at, updated_at
                FROM tags;
            `,
                { transaction }
            );

            // Step 4: Verify data was copied
            const [countAfter] = await queryInterface.sequelize.query(
                'SELECT COUNT(*) as count FROM tags_new;',
                { transaction, type: Sequelize.QueryTypes.SELECT }
            );

            if (countAfter.count !== countBefore.count) {
                throw new Error(
                    `Data verification failed! Expected ${countBefore.count} but got ${countAfter.count}`
                );
            }
            console.log(`✅ Copied ${countAfter.count} tags to new table`);

            // Step 5: Backup junction tables
            await queryInterface.sequelize.query(
                'CREATE TABLE tasks_tags_backup AS SELECT * FROM tasks_tags;',
                { transaction }
            );
            await queryInterface.sequelize.query(
                'CREATE TABLE notes_tags_backup AS SELECT * FROM notes_tags;',
                { transaction }
            );
            await queryInterface.sequelize.query(
                'CREATE TABLE projects_tags_backup AS SELECT * FROM projects_tags;',
                { transaction }
            );

            // Step 6: Drop old table and rename new one
            await queryInterface.sequelize.query('DROP TABLE tags;', {
                transaction,
            });
            await queryInterface.sequelize.query(
                'ALTER TABLE tags_new RENAME TO tags;',
                { transaction }
            );

            // Step 7: Add only the profile-scoped unique constraint (NOT the legacy one)
            await queryInterface.addIndex('tags', ['user_id'], {
                name: 'tags_user_id',
                transaction,
            });

            await queryInterface.addIndex('tags', ['profile_id'], {
                name: 'tags_profile_id',
                transaction,
            });

            await queryInterface.addIndex('tags', ['user_id', 'profile_id'], {
                name: 'tags_user_id_profile_id',
                transaction,
            });

            // This is the ONLY unique constraint - allows same tag name in different profiles
            await queryInterface.addIndex(
                'tags',
                ['user_id', 'profile_id', 'name'],
                {
                    unique: true,
                    name: 'tags_user_profile_name_unique',
                    transaction,
                }
            );

            // Step 8: Restore junction tables
            await queryInterface.sequelize.query('DELETE FROM tasks_tags;', {
                transaction,
            });
            await queryInterface.sequelize.query(
                'INSERT INTO tasks_tags SELECT * FROM tasks_tags_backup;',
                { transaction }
            );

            await queryInterface.sequelize.query('DELETE FROM notes_tags;', {
                transaction,
            });
            await queryInterface.sequelize.query(
                'INSERT INTO notes_tags SELECT * FROM notes_tags_backup;',
                { transaction }
            );

            await queryInterface.sequelize.query('DELETE FROM projects_tags;', {
                transaction,
            });
            await queryInterface.sequelize.query(
                'INSERT INTO projects_tags SELECT * FROM projects_tags_backup;',
                { transaction }
            );

            // Step 9: Drop backup tables
            await queryInterface.sequelize.query(
                'DROP TABLE tasks_tags_backup;',
                { transaction }
            );
            await queryInterface.sequelize.query(
                'DROP TABLE notes_tags_backup;',
                { transaction }
            );
            await queryInterface.sequelize.query(
                'DROP TABLE projects_tags_backup;',
                { transaction }
            );

            // Step 10: Final verification
            const [finalIndexes] = await queryInterface.sequelize.query(
                "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='tags';",
                { transaction }
            );
            console.log(
                '📊 Final indexes:',
                finalIndexes.map((i) => i.name)
            );

            // Verify legacy constraint is gone
            const hasLegacyConstraint = finalIndexes.some(
                (i) => i.name === 'tags_user_id_name_unique'
            );
            if (hasLegacyConstraint) {
                throw new Error(
                    'Legacy constraint tags_user_id_name_unique still exists!'
                );
            }

            await transaction.commit();
            await queryInterface.sequelize.query('PRAGMA foreign_keys = ON;');

            console.log(
                '✅ Successfully removed legacy tag constraint - tags are now profile-scoped'
            );
            console.log(
                '✅ Users can now have same tag name in different profiles'
            );
        } catch (error) {
            await transaction.rollback();
            try {
                await queryInterface.sequelize.query(
                    'PRAGMA foreign_keys = ON;'
                );
            } catch (e) {
                /* ignore */
            }
            console.error('❌ Migration failed:', error);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        // WARNING: Rolling back could fail if there are now duplicate tag names per user
        console.warn('⚠️  Rolling back will add back the legacy constraint');
        console.warn(
            '⚠️  This may fail if you have same tag names in different profiles'
        );

        await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF;');

        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Check for conflicts first
            const [conflicts] = await queryInterface.sequelize.query(
                `
                SELECT user_id, name, COUNT(*) as count
                FROM tags
                GROUP BY user_id, name
                HAVING COUNT(*) > 1;
            `,
                { transaction, type: Sequelize.QueryTypes.SELECT }
            );

            if (conflicts && conflicts.length > 0) {
                throw new Error(
                    `Cannot rollback: ${conflicts.length} tag names exist in multiple profiles. ` +
                        'Delete duplicate tags first or keep the new constraint.'
                );
            }

            // Add back the legacy constraint
            await queryInterface.addIndex('tags', ['user_id', 'name'], {
                unique: true,
                name: 'tags_user_id_name_unique',
                transaction,
            });

            await transaction.commit();
            await queryInterface.sequelize.query('PRAGMA foreign_keys = ON;');

            console.log('✅ Rolled back - legacy constraint restored');
        } catch (error) {
            await transaction.rollback();
            try {
                await queryInterface.sequelize.query(
                    'PRAGMA foreign_keys = ON;'
                );
            } catch (e) {
                /* ignore */
            }
            throw error;
        }
    },
};
