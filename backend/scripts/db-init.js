#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes the database by creating all tables and dropping existing data
 */

require('dotenv').config();
const { sequelize, User } = require('../models');

async function initDatabase() {
    try {
        console.log('Initializing database...');
        console.log('WARNING: This will drop all existing data!');

        await sequelize.sync({ force: true });

        console.log('✅ Database initialized successfully');
        console.log(
            'All tables have been created and existing data has been cleared'
        );

        // Create initial admin user from environment variables
        const adminEmail = process.env.TUDUDI_USER_EMAIL;
        const adminPassword = process.env.TUDUDI_USER_PASSWORD;

        if (adminEmail && adminPassword) {
            console.log('\nCreating initial admin user...');
            const adminUser = await User.create({
                email: adminEmail,
                password: adminPassword,
                name: 'Admin',
                email_verified: true,
            });

            console.log('✅ Admin user created successfully');
            console.log(`   Email: ${adminEmail}`);
            console.log(
                '   Note: This user will automatically be assigned admin role'
            );
        } else {
            console.warn(
                '\n⚠️  Warning: TUDUDI_USER_EMAIL or TUDUDI_USER_PASSWORD not set in .env'
            );
            console.warn(
                '   No initial admin user was created. You can create one later using npm run user:create'
            );
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        process.exit(1);
    }
}

initDatabase();
