const { Profile, User } = require('../../../models');

describe('Profile Model', () => {
    let user;

    beforeEach(async () => {
        const bcrypt = require('bcrypt');
        user = await User.create({
            email: 'test@example.com',
            password_digest: await bcrypt.hash('password123', 10),
        });
    });

    describe('validation', () => {
        it('should create a profile with valid data', async () => {
            const profileData = {
                name: 'Work',
                icon: 'briefcase',
                color: '#3B82F6',
                user_id: user.id,
            };

            const profile = await Profile.create(profileData);

            expect(profile.name).toBe(profileData.name);
            expect(profile.icon).toBe(profileData.icon);
            expect(profile.color).toBe(profileData.color);
            expect(profile.user_id).toBe(user.id);
            expect(profile.uid).toBeDefined();
            expect(profile.is_default).toBe(false);
            expect(profile.order).toBe(0);
        });

        it('should require name', async () => {
            const profileData = {
                user_id: user.id,
            };

            await expect(Profile.create(profileData)).rejects.toThrow();
        });

        it('should require user_id', async () => {
            const profileData = {
                name: 'Test Profile',
            };

            await expect(Profile.create(profileData)).rejects.toThrow();
        });

        it('should generate uid automatically', async () => {
            const profile = await Profile.create({
                name: 'Test',
                user_id: user.id,
            });

            expect(profile.uid).toBeDefined();
            expect(typeof profile.uid).toBe('string');
            expect(profile.uid.length).toBeGreaterThan(0);
        });

        it('should not allow duplicate uid', async () => {
            const profile1 = await Profile.create({
                name: 'Profile 1',
                user_id: user.id,
            });

            await expect(
                Profile.create({
                    name: 'Profile 2',
                    user_id: user.id,
                    uid: profile1.uid, // Try to use same uid
                })
            ).rejects.toThrow();
        });
    });

    describe('default values', () => {
        it('should set correct default values', async () => {
            const profile = await Profile.create({
                name: 'Test Profile',
                user_id: user.id,
            });

            expect(profile.is_default).toBe(false);
            expect(profile.order).toBe(0);
            expect(profile.icon).toBe('folder');
            expect(profile.color).toBe('#6B7280');
        });
    });

    describe('optional fields', () => {
        it('should allow setting icon', async () => {
            const profile = await Profile.create({
                name: 'Work',
                icon: 'briefcase',
                user_id: user.id,
            });

            expect(profile.icon).toBe('briefcase');
        });

        it('should allow setting color', async () => {
            const profile = await Profile.create({
                name: 'Personal',
                color: '#FF5500',
                user_id: user.id,
            });

            expect(profile.color).toBe('#FF5500');
        });

        it('should allow setting is_default', async () => {
            const profile = await Profile.create({
                name: 'Default Profile',
                is_default: true,
                user_id: user.id,
            });

            expect(profile.is_default).toBe(true);
        });

        it('should allow setting order', async () => {
            const profile = await Profile.create({
                name: 'Third Profile',
                order: 2,
                user_id: user.id,
            });

            expect(profile.order).toBe(2);
        });
    });

    describe('associations', () => {
        it('should belong to a user', async () => {
            const profile = await Profile.create({
                name: 'Test',
                user_id: user.id,
            });

            const profileWithUser = await Profile.findByPk(profile.id, {
                include: [User],
            });

            expect(profileWithUser.User).toBeDefined();
            expect(profileWithUser.User.id).toBe(user.id);
        });
    });

    describe('multiple profiles per user', () => {
        it('should allow multiple profiles for the same user', async () => {
            await Profile.create({
                name: 'Work',
                user_id: user.id,
            });

            await Profile.create({
                name: 'Personal',
                user_id: user.id,
            });

            await Profile.create({
                name: 'Side Projects',
                user_id: user.id,
            });

            const profiles = await Profile.findAll({
                where: { user_id: user.id },
            });

            expect(profiles.length).toBe(3);
        });

        it('should allow same profile name for different users', async () => {
            const bcrypt = require('bcrypt');
            const otherUser = await User.create({
                email: 'other@example.com',
                password_digest: await bcrypt.hash('password123', 10),
            });

            await Profile.create({
                name: 'Work',
                user_id: user.id,
            });

            const otherProfile = await Profile.create({
                name: 'Work',
                user_id: otherUser.id,
            });

            expect(otherProfile.name).toBe('Work');
        });
    });

    describe('update operations', () => {
        let profile;

        beforeEach(async () => {
            profile = await Profile.create({
                name: 'Original',
                icon: 'folder',
                color: '#000000',
                user_id: user.id,
            });
        });

        it('should update name', async () => {
            await profile.update({ name: 'Updated' });
            await profile.reload();

            expect(profile.name).toBe('Updated');
        });

        it('should update icon', async () => {
            await profile.update({ icon: 'star' });
            await profile.reload();

            expect(profile.icon).toBe('star');
        });

        it('should update color', async () => {
            await profile.update({ color: '#FFFFFF' });
            await profile.reload();

            expect(profile.color).toBe('#FFFFFF');
        });

        it('should update is_default', async () => {
            await profile.update({ is_default: true });
            await profile.reload();

            expect(profile.is_default).toBe(true);
        });

        it('should update order', async () => {
            await profile.update({ order: 5 });
            await profile.reload();

            expect(profile.order).toBe(5);
        });

        it('should not allow updating uid', async () => {
            const originalUid = profile.uid;

            await expect(
                profile.update({ uid: 'newuid12345' })
            ).rejects.toThrow('Cannot update uid after creation');

            await profile.reload();
            expect(profile.uid).toBe(originalUid);
        });
    });

    describe('delete operations', () => {
        it('should delete profile', async () => {
            const profile = await Profile.create({
                name: 'To Delete',
                user_id: user.id,
            });

            const profileId = profile.id;
            await profile.destroy();

            const deletedProfile = await Profile.findByPk(profileId);
            expect(deletedProfile).toBeNull();
        });
    });
});
