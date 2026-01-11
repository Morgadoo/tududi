const request = require('supertest');
const app = require('../../app');
const {
    Task,
    Project,
    Note,
    Tag,
    Area,
    Profile,
    User,
} = require('../../models');
const { createTestUser, createTestProfile } = require('../helpers/testUtils');
const packageJson = require('../../../package.json');

// Enable backups for tests
process.env.FF_ENABLE_BACKUPS = 'true';

// Use actual app version for backup compatibility
const APP_VERSION = packageJson.version;

describe('Backup Routes', () => {
    let user, agent, profile;

    beforeEach(async () => {
        user = await createTestUser({
            email: 'backup-test@example.com',
        });

        profile = await createTestProfile(user, { name: 'Default' });
        await user.update({ active_profile_id: profile.id });

        // Create authenticated agent
        agent = request.agent(app);
        await agent.post('/api/login').send({
            email: 'backup-test@example.com',
            password: 'password123',
        });
    });

    describe('POST /api/backup/export', () => {
        it('should require authentication', async () => {
            const response = await request(app).post('/api/backup/export');
            expect(response.status).toBe(401);
        });

        it('should export user data', async () => {
            // Create some test data
            await Task.create({
                name: 'Test Task',
                user_id: user.id,
                profile_id: profile.id,
            });
            await Project.create({
                name: 'Test Project',
                user_id: user.id,
                profile_id: profile.id,
            });

            const response = await agent.post('/api/backup/export');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.backup).toBeDefined();
            expect(response.body.backup.uid).toBeDefined();
            expect(response.body.backup.item_counts).toBeDefined();
        });

        it('should include item counts in export', async () => {
            await Task.create({
                name: 'Test Task',
                user_id: user.id,
                profile_id: profile.id,
            });

            const response = await agent.post('/api/backup/export');

            expect(response.status).toBe(200);
            expect(response.body.backup.item_counts).toBeDefined();
            expect(
                response.body.backup.item_counts.tasks
            ).toBeGreaterThanOrEqual(1);
        });

        describe('Profile-Scoped Export', () => {
            let workProfile, personalProfile;

            beforeEach(async () => {
                workProfile = await createTestProfile(user, { name: 'Work' });
                personalProfile = await createTestProfile(user, {
                    name: 'Personal',
                });
                await user.update({ active_profile_id: workProfile.id });

                // Create data in both profiles
                await Task.create({
                    name: 'Work Task 1',
                    user_id: user.id,
                    profile_id: workProfile.id,
                });
                await Task.create({
                    name: 'Work Task 2',
                    user_id: user.id,
                    profile_id: workProfile.id,
                });
                await Task.create({
                    name: 'Personal Task',
                    user_id: user.id,
                    profile_id: personalProfile.id,
                });

                await Project.create({
                    name: 'Work Project',
                    user_id: user.id,
                    profile_id: workProfile.id,
                });
                await Project.create({
                    name: 'Personal Project',
                    user_id: user.id,
                    profile_id: personalProfile.id,
                });
            });

            it('should export all data when scope is not specified', async () => {
                const response = await agent.post('/api/backup/export');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                // Without scope, exports all data (3 tasks, 2 projects)
                expect(response.body.backup.item_counts.tasks).toBe(3);
                expect(response.body.backup.item_counts.projects).toBe(2);
            });

            it('should export only active profile data when scope=profile', async () => {
                const response = await agent
                    .post('/api/backup/export')
                    .query({ scope: 'profile' });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                // With scope=profile, exports only work profile data (2 tasks, 1 project)
                expect(response.body.backup.item_counts.tasks).toBe(2);
                expect(response.body.backup.item_counts.projects).toBe(1);
            });

            it('should include profile info in scoped export', async () => {
                const response = await agent
                    .post('/api/backup/export')
                    .query({ scope: 'profile' });

                expect(response.status).toBe(200);
                expect(response.body.backup.scope).toBe('profile');
                expect(response.body.backup.profile).toBeDefined();
                expect(response.body.backup.profile.name).toBe('Work');
            });

            it('should export data from switched profile', async () => {
                // Switch to personal profile
                await agent.patch(
                    `/api/v1/profiles/switch/${personalProfile.uid}`
                );

                const response = await agent
                    .post('/api/backup/export')
                    .query({ scope: 'profile' });

                expect(response.status).toBe(200);
                // Personal profile has 1 task
                expect(response.body.backup.item_counts.tasks).toBe(1);
            });
        });
    });

    describe('POST /api/backup/import', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/backup/import')
                .attach('backup', Buffer.from('{}'), 'backup.json');
            expect(response.status).toBe(401);
        });

        it('should import backup data', async () => {
            const backupData = {
                version: APP_VERSION,
                exportedAt: new Date().toISOString(),
                data: {
                    tasks: [
                        {
                            uid: 'import-task-1',
                            name: 'Imported Task',
                            priority: 1,
                            status: 0,
                        },
                    ],
                    projects: [
                        {
                            uid: 'import-proj-1',
                            name: 'Imported Project',
                            status: 'active',
                        },
                    ],
                    notes: [],
                    tags: [],
                    areas: [],
                },
            };

            const response = await agent
                .post('/api/backup/import')
                .attach(
                    'backup',
                    Buffer.from(JSON.stringify(backupData)),
                    'backup.json'
                );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify data was imported
            const tasks = await Task.findAll({ where: { user_id: user.id } });
            expect(tasks.some((t) => t.name === 'Imported Task')).toBe(true);
        });

        describe('Profile-Scoped Import', () => {
            let workProfile, personalProfile;

            beforeEach(async () => {
                workProfile = await createTestProfile(user, { name: 'Work' });
                personalProfile = await createTestProfile(user, {
                    name: 'Personal',
                });
                await user.update({ active_profile_id: workProfile.id });
            });

            it('should import data to active profile by default', async () => {
                const backupData = {
                    version: APP_VERSION,
                    exportedAt: new Date().toISOString(),
                    data: {
                        tasks: [
                            {
                                uid: 'profile-task-1',
                                name: 'Imported Task',
                                priority: 0,
                                status: 0,
                            },
                        ],
                        projects: [],
                        notes: [],
                        tags: [],
                        areas: [],
                    },
                };

                const response = await agent
                    .post('/api/backup/import')
                    .attach(
                        'backup',
                        Buffer.from(JSON.stringify(backupData)),
                        'backup.json'
                    );

                expect(response.status).toBe(200);

                // Verify task was created in work profile
                const task = await Task.findOne({
                    where: { name: 'Imported Task', user_id: user.id },
                });
                expect(task).not.toBeNull();
                expect(task.profile_id).toBe(workProfile.id);
            });

            it('should import data to specified target profile', async () => {
                const backupData = {
                    version: APP_VERSION,
                    exportedAt: new Date().toISOString(),
                    data: {
                        tasks: [
                            {
                                uid: 'personal-task-1',
                                name: 'Task for Personal',
                                priority: 0,
                                status: 0,
                            },
                        ],
                        projects: [],
                        notes: [],
                        tags: [],
                        areas: [],
                    },
                };

                const response = await agent
                    .post('/api/backup/import')
                    .field('targetProfileId', personalProfile.id.toString())
                    .attach(
                        'backup',
                        Buffer.from(JSON.stringify(backupData)),
                        'backup.json'
                    );

                expect(response.status).toBe(200);

                // Verify task was created in personal profile
                const task = await Task.findOne({
                    where: { name: 'Task for Personal', user_id: user.id },
                });
                expect(task).not.toBeNull();
                expect(task.profile_id).toBe(personalProfile.id);
            });

            it('should not import to profile owned by another user', async () => {
                const otherUser = await createTestUser({
                    email: 'other@example.com',
                });
                const otherProfile = await createTestProfile(otherUser, {
                    name: 'Other',
                });

                const backupData = {
                    version: APP_VERSION,
                    exportedAt: new Date().toISOString(),
                    data: {
                        tasks: [
                            {
                                uid: 'malicious-task-1',
                                name: 'Malicious Task',
                                priority: 0,
                                status: 0,
                            },
                        ],
                        projects: [],
                        notes: [],
                        tags: [],
                        areas: [],
                    },
                };

                const response = await agent
                    .post('/api/backup/import')
                    .field('targetProfileId', otherProfile.id.toString())
                    .attach(
                        'backup',
                        Buffer.from(JSON.stringify(backupData)),
                        'backup.json'
                    );

                // Should either fail or use the user's own profile
                if (response.status === 200) {
                    // If import succeeded, verify data went to user's profile, not other user's
                    const task = await Task.findOne({
                        where: { name: 'Malicious Task' },
                    });
                    if (task) {
                        expect(task.profile_id).not.toBe(otherProfile.id);
                    }
                } else {
                    // Can be 400 (validation), 403 (forbidden), or 500 (error)
                    expect([400, 403, 500]).toContain(response.status);
                }
            });
        });
    });

    describe('POST /api/backup/validate', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/backup/validate')
                .attach('backup', Buffer.from('{}'), 'backup.json');
            expect(response.status).toBe(401);
        });

        it('should validate a valid backup file', async () => {
            const backupData = {
                version: APP_VERSION,
                exportedAt: new Date().toISOString(),
                data: {
                    tasks: [],
                    projects: [],
                    notes: [],
                    tags: [],
                    areas: [],
                },
            };

            const response = await agent
                .post('/api/backup/validate')
                .attach(
                    'backup',
                    Buffer.from(JSON.stringify(backupData)),
                    'backup.json'
                );

            expect(response.status).toBe(200);
            expect(response.body.valid).toBe(true);
        });

        it('should reject invalid backup file', async () => {
            const response = await agent
                .post('/api/backup/validate')
                .attach(
                    'backup',
                    Buffer.from('not valid json{'),
                    'backup.json'
                );

            expect(response.status).toBe(400);
        });
    });

    describe('Feature Flag', () => {
        beforeEach(() => {
            process.env.FF_ENABLE_BACKUPS = 'false';
        });

        afterEach(() => {
            process.env.FF_ENABLE_BACKUPS = 'true';
        });

        it('should return 403 when backups are disabled', async () => {
            const response = await agent.post('/api/backup/export');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Backups feature is disabled');
        });
    });
});
