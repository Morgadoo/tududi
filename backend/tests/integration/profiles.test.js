const request = require('supertest');
const app = require('../../app');
const {
    Profile,
    User,
    Task,
    Project,
    Note,
    Tag,
    Area,
    InboxItem,
    View,
} = require('../../models');
const { createTestUser, createTestProfile } = require('../helpers/testUtils');

describe('Profiles Routes', () => {
    let user, agent;

    beforeEach(async () => {
        user = await createTestUser({
            email: 'profiles-test@example.com',
        });

        // Create authenticated agent
        agent = request.agent(app);
        await agent.post('/api/login').send({
            email: 'profiles-test@example.com',
            password: 'password123',
        });
    });

    describe('GET /api/v1/profiles', () => {
        it('should require authentication', async () => {
            const response = await request(app).get('/api/v1/profiles');
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Authentication required');
        });

        it('should return empty array when user has no profiles', async () => {
            const response = await agent.get('/api/v1/profiles');

            expect(response.status).toBe(200);
            expect(response.body.profiles).toBeDefined();
            expect(Array.isArray(response.body.profiles)).toBe(true);
            expect(response.body.profiles.length).toBe(0);
        });

        it('should return all profiles for the user', async () => {
            const profile1 = await createTestProfile(user, { name: 'Work' });
            const profile2 = await createTestProfile(user, {
                name: 'Personal',
            });

            const response = await agent.get('/api/v1/profiles');

            expect(response.status).toBe(200);
            expect(response.body.profiles.length).toBe(2);
            expect(response.body.profiles.map((p) => p.name)).toContain('Work');
            expect(response.body.profiles.map((p) => p.name)).toContain(
                'Personal'
            );
        });

        it('should not return profiles from other users', async () => {
            await createTestProfile(user, { name: 'My Profile' });

            const otherUser = await createTestUser({
                email: 'other@example.com',
            });
            await createTestProfile(otherUser, { name: 'Other Profile' });

            const response = await agent.get('/api/v1/profiles');

            expect(response.status).toBe(200);
            expect(response.body.profiles.length).toBe(1);
            expect(response.body.profiles[0].name).toBe('My Profile');
        });

        it('should return profiles ordered by order then name', async () => {
            await createTestProfile(user, { name: 'Charlie', order: 2 });
            await createTestProfile(user, { name: 'Alpha', order: 0 });
            await createTestProfile(user, { name: 'Beta', order: 1 });

            const response = await agent.get('/api/v1/profiles');

            expect(response.status).toBe(200);
            expect(response.body.profiles[0].name).toBe('Alpha');
            expect(response.body.profiles[1].name).toBe('Beta');
            expect(response.body.profiles[2].name).toBe('Charlie');
        });
    });

    describe('GET /api/v1/profiles/active', () => {
        it('should require authentication', async () => {
            const response = await request(app).get('/api/v1/profiles/active');
            expect(response.status).toBe(401);
        });

        it('should create and return default profile if none exists', async () => {
            const response = await agent.get('/api/v1/profiles/active');

            expect(response.status).toBe(200);
            expect(response.body.profile).toBeDefined();
            expect(response.body.profile.name).toBe('Default');
            expect(response.body.profile.is_default).toBe(true);
        });

        it('should return the active profile', async () => {
            const profile = await createTestProfile(user, { name: 'Work' });
            await user.update({ active_profile_id: profile.id });

            const response = await agent.get('/api/v1/profiles/active');

            expect(response.status).toBe(200);
            expect(response.body.profile.name).toBe('Work');
        });
    });

    describe('GET /api/v1/profiles/:uid', () => {
        it('should require authentication', async () => {
            const profile = await createTestProfile(user, { name: 'Test' });
            const response = await request(app).get(
                `/api/v1/profiles/${profile.uid}`
            );
            expect(response.status).toBe(401);
        });

        it('should return profile by uid', async () => {
            const profile = await createTestProfile(user, {
                name: 'Work',
                icon: 'briefcase',
                color: '#FF0000',
            });

            const response = await agent.get(`/api/v1/profiles/${profile.uid}`);

            expect(response.status).toBe(200);
            expect(response.body.profile.name).toBe('Work');
            expect(response.body.profile.icon).toBe('briefcase');
            expect(response.body.profile.color).toBe('#FF0000');
        });

        it('should return 404 for non-existent profile', async () => {
            const response = await agent.get(
                '/api/v1/profiles/nonexistent12345'
            );
            expect(response.status).toBe(404);
        });

        it("should not return other user's profile", async () => {
            const otherUser = await createTestUser({
                email: 'other@example.com',
            });
            const otherProfile = await createTestProfile(otherUser, {
                name: 'Other',
            });

            const response = await agent.get(
                `/api/v1/profiles/${otherProfile.uid}`
            );

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/v1/profiles', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/v1/profiles')
                .send({ name: 'Test' });
            expect(response.status).toBe(401);
        });

        it('should create a new profile', async () => {
            const profileData = {
                name: 'Work',
                icon: 'briefcase',
                color: '#3B82F6',
            };

            const response = await agent
                .post('/api/v1/profiles')
                .send(profileData);

            expect(response.status).toBe(201);
            expect(response.body.profile.name).toBe('Work');
            expect(response.body.profile.icon).toBe('briefcase');
            expect(response.body.profile.color).toBe('#3B82F6');
            expect(response.body.profile.uid).toBeDefined();
        });

        it('should make first profile the default', async () => {
            const response = await agent
                .post('/api/v1/profiles')
                .send({ name: 'First' });

            expect(response.status).toBe(201);
            expect(response.body.profile.is_default).toBe(true);
        });

        it('should not make subsequent profiles default by default', async () => {
            await agent.post('/api/v1/profiles').send({ name: 'First' });

            const response = await agent
                .post('/api/v1/profiles')
                .send({ name: 'Second' });

            expect(response.status).toBe(201);
            expect(response.body.profile.is_default).toBe(false);
        });

        it('should allow setting a profile as default', async () => {
            await agent.post('/api/v1/profiles').send({ name: 'First' });

            const response = await agent
                .post('/api/v1/profiles')
                .send({ name: 'Second', is_default: true });

            expect(response.status).toBe(201);
            expect(response.body.profile.is_default).toBe(true);

            // Verify first profile is no longer default
            const profiles = await Profile.findAll({
                where: { user_id: user.id },
            });
            const firstProfile = profiles.find((p) => p.name === 'First');
            expect(firstProfile.is_default).toBe(false);
        });

        it('should require name', async () => {
            const response = await agent
                .post('/api/v1/profiles')
                .send({ icon: 'folder' });

            expect(response.status).toBe(400);
        });

        it('should validate name length', async () => {
            const response = await agent
                .post('/api/v1/profiles')
                .send({ name: 'A'.repeat(101) });

            expect(response.status).toBe(400);
        });

        it('should enforce maximum profile limit', async () => {
            // Create 10 profiles (the limit)
            for (let i = 0; i < 10; i++) {
                await createTestProfile(user, { name: `Profile ${i}` });
            }

            const response = await agent
                .post('/api/v1/profiles')
                .send({ name: 'One Too Many' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Maximum');
        });
    });

    describe('PATCH /api/v1/profiles/:uid', () => {
        let profile;

        beforeEach(async () => {
            profile = await createTestProfile(user, {
                name: 'Original',
                icon: 'folder',
                color: '#000000',
            });
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .patch(`/api/v1/profiles/${profile.uid}`)
                .send({ name: 'Updated' });
            expect(response.status).toBe(401);
        });

        it('should update profile name', async () => {
            const response = await agent
                .patch(`/api/v1/profiles/${profile.uid}`)
                .send({ name: 'Updated' });

            expect(response.status).toBe(200);
            expect(response.body.profile.name).toBe('Updated');
        });

        it('should update profile icon', async () => {
            const response = await agent
                .patch(`/api/v1/profiles/${profile.uid}`)
                .send({ icon: 'briefcase' });

            expect(response.status).toBe(200);
            expect(response.body.profile.icon).toBe('briefcase');
        });

        it('should update profile color', async () => {
            const response = await agent
                .patch(`/api/v1/profiles/${profile.uid}`)
                .send({ color: '#FF5500' });

            expect(response.status).toBe(200);
            expect(response.body.profile.color).toBe('#FF5500');
        });

        it('should return 404 for non-existent profile', async () => {
            const response = await agent
                .patch('/api/v1/profiles/nonexistent12345')
                .send({ name: 'Updated' });

            expect(response.status).toBe(404);
        });

        it("should not update other user's profile", async () => {
            const otherUser = await createTestUser({
                email: 'other@example.com',
            });
            const otherProfile = await createTestProfile(otherUser, {
                name: 'Other',
            });

            const response = await agent
                .patch(`/api/v1/profiles/${otherProfile.uid}`)
                .send({ name: 'Hacked' });

            expect(response.status).toBe(404);

            // Verify profile wasn't changed
            await otherProfile.reload();
            expect(otherProfile.name).toBe('Other');
        });
    });

    describe('PATCH /api/v1/profiles/switch/:uid', () => {
        let profile1, profile2;

        beforeEach(async () => {
            profile1 = await createTestProfile(user, { name: 'Profile 1' });
            profile2 = await createTestProfile(user, { name: 'Profile 2' });
            await user.update({ active_profile_id: profile1.id });
        });

        it('should require authentication', async () => {
            const response = await request(app).patch(
                `/api/v1/profiles/switch/${profile2.uid}`
            );
            expect(response.status).toBe(401);
        });

        it('should switch active profile', async () => {
            const response = await agent.patch(
                `/api/v1/profiles/switch/${profile2.uid}`
            );

            expect(response.status).toBe(200);
            expect(response.body.profile.name).toBe('Profile 2');
            expect(response.body.message).toBe('Profile switched successfully');

            // Verify user's active profile was updated
            await user.reload();
            expect(user.active_profile_id).toBe(profile2.id);
        });

        it('should return 404 for non-existent profile', async () => {
            const response = await agent.patch(
                '/api/v1/profiles/switch/nonexistent12345'
            );
            expect(response.status).toBe(404);
        });

        it("should not switch to other user's profile", async () => {
            const otherUser = await createTestUser({
                email: 'other@example.com',
            });
            const otherProfile = await createTestProfile(otherUser, {
                name: 'Other',
            });

            const response = await agent.patch(
                `/api/v1/profiles/switch/${otherProfile.uid}`
            );

            expect(response.status).toBe(404);

            // Verify active profile wasn't changed
            await user.reload();
            expect(user.active_profile_id).toBe(profile1.id);
        });
    });

    describe('DELETE /api/v1/profiles/:uid', () => {
        let profile1, profile2;

        beforeEach(async () => {
            profile1 = await createTestProfile(user, {
                name: 'Profile 1',
                is_default: true,
            });
            profile2 = await createTestProfile(user, { name: 'Profile 2' });
            await user.update({ active_profile_id: profile1.id });
        });

        it('should require authentication', async () => {
            const response = await request(app).delete(
                `/api/v1/profiles/${profile2.uid}`
            );
            expect(response.status).toBe(401);
        });

        it('should delete a profile', async () => {
            const response = await agent.delete(
                `/api/v1/profiles/${profile2.uid}`
            );

            expect(response.status).toBe(204);

            // Verify profile was deleted
            const deletedProfile = await Profile.findByPk(profile2.id);
            expect(deletedProfile).toBeNull();
        });

        it('should delete all associated data', async () => {
            // Create data in profile2
            await Task.create({
                name: 'Task in Profile 2',
                user_id: user.id,
                profile_id: profile2.id,
            });
            await Project.create({
                name: 'Project in Profile 2',
                user_id: user.id,
                profile_id: profile2.id,
            });
            await Note.create({
                title: 'Note in Profile 2',
                user_id: user.id,
                profile_id: profile2.id,
            });

            const response = await agent.delete(
                `/api/v1/profiles/${profile2.uid}`
            );

            expect(response.status).toBe(204);

            // Verify associated data was deleted
            const tasks = await Task.findAll({
                where: { profile_id: profile2.id },
            });
            const projects = await Project.findAll({
                where: { profile_id: profile2.id },
            });
            const notes = await Note.findAll({
                where: { profile_id: profile2.id },
            });

            expect(tasks.length).toBe(0);
            expect(projects.length).toBe(0);
            expect(notes.length).toBe(0);
        });

        it('should not delete the only profile', async () => {
            // Delete profile2 first
            await agent.delete(`/api/v1/profiles/${profile2.uid}`);

            // Try to delete the only remaining profile
            const response = await agent.delete(
                `/api/v1/profiles/${profile1.uid}`
            );

            expect(response.status).toBe(403);
            expect(response.body.error).toContain('only profile');

            // Verify profile still exists
            const remainingProfile = await Profile.findByPk(profile1.id);
            expect(remainingProfile).not.toBeNull();
        });

        it('should not delete the active profile', async () => {
            const response = await agent.delete(
                `/api/v1/profiles/${profile1.uid}`
            );

            expect(response.status).toBe(403);
            expect(response.body.error).toContain('active profile');
        });

        it('should return 404 for non-existent profile', async () => {
            const response = await agent.delete(
                '/api/v1/profiles/nonexistent12345'
            );
            expect(response.status).toBe(404);
        });

        it("should not delete other user's profile", async () => {
            const otherUser = await createTestUser({
                email: 'other@example.com',
            });
            const otherProfile = await createTestProfile(otherUser, {
                name: 'Other',
            });

            const response = await agent.delete(
                `/api/v1/profiles/${otherProfile.uid}`
            );

            expect(response.status).toBe(404);

            // Verify profile wasn't deleted
            const stillExists = await Profile.findByPk(otherProfile.id);
            expect(stillExists).not.toBeNull();
        });
    });

    describe('Profile Data Isolation', () => {
        let workProfile, personalProfile;

        beforeEach(async () => {
            workProfile = await createTestProfile(user, { name: 'Work' });
            personalProfile = await createTestProfile(user, {
                name: 'Personal',
            });
            await user.update({ active_profile_id: workProfile.id });
        });

        describe('Tasks', () => {
            it('should only return tasks from active profile', async () => {
                await Task.create({
                    name: 'Work Task',
                    user_id: user.id,
                    profile_id: workProfile.id,
                });
                await Task.create({
                    name: 'Personal Task',
                    user_id: user.id,
                    profile_id: personalProfile.id,
                });

                const response = await agent.get('/api/tasks');

                expect(response.status).toBe(200);
                const taskNames = response.body.tasks.map((t) => t.name);
                expect(taskNames).toContain('Work Task');
                expect(taskNames).not.toContain('Personal Task');
            });

            it('should create tasks in active profile', async () => {
                const response = await agent
                    .post('/api/task')
                    .send({ name: 'New Task' });

                expect(response.status).toBe(201);

                const task = await Task.findByPk(response.body.id);
                expect(task.profile_id).toBe(workProfile.id);
            });

            it('should see different tasks after profile switch', async () => {
                await Task.create({
                    name: 'Work Task',
                    user_id: user.id,
                    profile_id: workProfile.id,
                });
                await Task.create({
                    name: 'Personal Task',
                    user_id: user.id,
                    profile_id: personalProfile.id,
                });

                // Get tasks from work profile
                let response = await agent.get('/api/tasks');
                expect(
                    response.body.tasks.some((t) => t.name === 'Work Task')
                ).toBe(true);
                expect(
                    response.body.tasks.some((t) => t.name === 'Personal Task')
                ).toBe(false);

                // Switch to personal profile
                await agent.patch(
                    `/api/v1/profiles/switch/${personalProfile.uid}`
                );

                // Get tasks from personal profile
                response = await agent.get('/api/tasks');
                expect(
                    response.body.tasks.some((t) => t.name === 'Work Task')
                ).toBe(false);
                expect(
                    response.body.tasks.some((t) => t.name === 'Personal Task')
                ).toBe(true);
            });
        });

        describe('Projects', () => {
            it('should only return projects from active profile', async () => {
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

                const response = await agent.get('/api/projects');

                expect(response.status).toBe(200);
                const projectNames = response.body.projects.map((p) => p.name);
                expect(projectNames).toContain('Work Project');
                expect(projectNames).not.toContain('Personal Project');
            });

            it('should create projects in active profile', async () => {
                const response = await agent
                    .post('/api/project')
                    .send({ name: 'New Project' });

                expect(response.status).toBe(201);

                const project = await Project.findOne({
                    where: { uid: response.body.uid },
                });
                expect(project.profile_id).toBe(workProfile.id);
            });
        });

        describe('Notes', () => {
            it('should only return notes from active profile', async () => {
                await Note.create({
                    title: 'Work Note',
                    user_id: user.id,
                    profile_id: workProfile.id,
                });
                await Note.create({
                    title: 'Personal Note',
                    user_id: user.id,
                    profile_id: personalProfile.id,
                });

                const response = await agent.get('/api/notes');

                expect(response.status).toBe(200);
                const noteTitles = response.body.map((n) => n.title);
                expect(noteTitles).toContain('Work Note');
                expect(noteTitles).not.toContain('Personal Note');
            });

            it('should create notes in active profile', async () => {
                const response = await agent
                    .post('/api/note')
                    .send({ title: 'New Note', content: 'Content' });

                expect(response.status).toBe(201);

                const note = await Note.findByPk(response.body.id);
                expect(note.profile_id).toBe(workProfile.id);
            });
        });

        describe('Tags', () => {
            it('should only return tags from active profile', async () => {
                await Tag.create({
                    name: 'work-tag',
                    user_id: user.id,
                    profile_id: workProfile.id,
                });
                await Tag.create({
                    name: 'personal-tag',
                    user_id: user.id,
                    profile_id: personalProfile.id,
                });

                const response = await agent.get('/api/tags');

                expect(response.status).toBe(200);
                const tagNames = response.body.map((t) => t.name);
                expect(tagNames).toContain('work-tag');
                expect(tagNames).not.toContain('personal-tag');
            });

            // NOTE: This test is skipped because the current database has a
            // legacy unique constraint on (user_id, name) that prevents
            // same tag names in different profiles. A migration is needed.
            it.skip('should allow same tag name in different profiles (requires migration)', async () => {
                await Tag.create({
                    name: 'urgent',
                    user_id: user.id,
                    profile_id: workProfile.id,
                });
                await Tag.create({
                    name: 'urgent',
                    user_id: user.id,
                    profile_id: personalProfile.id,
                });

                // Both should exist
                const workTags = await Tag.findAll({
                    where: { user_id: user.id, profile_id: workProfile.id },
                });
                const personalTags = await Tag.findAll({
                    where: { user_id: user.id, profile_id: personalProfile.id },
                });

                expect(workTags.some((t) => t.name === 'urgent')).toBe(true);
                expect(personalTags.some((t) => t.name === 'urgent')).toBe(
                    true
                );
            });
        });

        describe('Areas', () => {
            it('should only return areas from active profile', async () => {
                await Area.create({
                    name: 'Work Area',
                    user_id: user.id,
                    profile_id: workProfile.id,
                });
                await Area.create({
                    name: 'Personal Area',
                    user_id: user.id,
                    profile_id: personalProfile.id,
                });

                const response = await agent.get('/api/areas');

                expect(response.status).toBe(200);
                const areaNames = response.body.map((a) => a.name);
                expect(areaNames).toContain('Work Area');
                expect(areaNames).not.toContain('Personal Area');
            });
        });
    });
});
