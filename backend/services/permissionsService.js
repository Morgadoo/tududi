const { Op } = require('sequelize');
const { Project, Task, Note, Permission } = require('../models');
const { isAdmin } = require('./rolesService');

const ACCESS = { NONE: 'none', RO: 'ro', RW: 'rw', ADMIN: 'admin' };

async function getSharedUidsForUser(resourceType, userId) {
    const rows = await Permission.findAll({
        where: { user_id: userId, resource_type: resourceType },
        attributes: ['resource_uid'],
        raw: true,
    });
    const set = new Set(rows.map((r) => r.resource_uid));
    return Array.from(set);
}

// Check if user has access through a parent project
async function getAccessViaProject(projectId, userId, getAccessFn) {
    if (!projectId) return null;

    const project = await Project.findOne({
        where: { id: projectId },
        attributes: ['uid'],
        raw: true,
    });

    if (!project) return null;

    const projectAccess = await getAccessFn(userId, 'project', project.uid);
    return projectAccess === ACCESS.NONE ? null : projectAccess;
}

// Check ownership for a resource type
async function checkOwnership(resourceType, resourceUid, userId) {
    const models = { project: Project, task: Task, note: Note };
    const Model = models[resourceType];

    if (!Model) return { found: false };

    const attributes =
        resourceType === 'project' ? ['user_id'] : ['user_id', 'project_id'];

    const resource = await Model.findOne({
        where: { uid: resourceUid },
        attributes,
        raw: true,
    });

    if (!resource) return { found: false };
    if (resource.user_id === userId) return { found: true, isOwner: true };

    return { found: true, isOwner: false, projectId: resource.project_id };
}

async function getAccess(userId, resourceType, resourceUid) {
    if (await isAdmin(userId)) return ACCESS.ADMIN;

    const ownership = await checkOwnership(resourceType, resourceUid, userId);

    if (!ownership.found) return ACCESS.NONE;
    if (ownership.isOwner) return ACCESS.RW;

    // For tasks/notes, check project-level access
    if (ownership.projectId) {
        const projectAccess = await getAccessViaProject(
            ownership.projectId,
            userId,
            getAccess
        );
        if (projectAccess) return projectAccess;
    }

    // Check direct sharing permissions
    const perm = await Permission.findOne({
        where: {
            user_id: userId,
            resource_type: resourceType,
            resource_uid: resourceUid,
        },
        attributes: ['access_level'],
        raw: true,
    });
    return perm ? perm.access_level : ACCESS.NONE;
}

async function ownershipOrPermissionWhere(resourceType, userId, cache = null) {
    // Check cache first (request-scoped)
    const cacheKey = `permission_${resourceType}_${userId}`;
    if (cache && cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    // Admin users should NOT see all resources automatically
    // They should only see their own resources and shared resources, like regular users
    // If admin-level system-wide visibility is needed, it should be via dedicated admin endpoints

    const sharedUids = await getSharedUidsForUser(resourceType, userId);

    // For tasks and notes, also include items from shared projects
    if (resourceType === 'task' || resourceType === 'note') {
        const sharedProjectUids = await getSharedUidsForUser('project', userId);

        // Get the project IDs for shared projects
        let sharedProjectIds = [];
        if (sharedProjectUids.length > 0) {
            const projects = await Project.findAll({
                where: { uid: { [Op.in]: sharedProjectUids } },
                attributes: ['id'],
                raw: true,
            });
            sharedProjectIds = projects.map((p) => p.id);
        }

        const conditions = [
            { user_id: userId }, // Items owned by user
        ];

        if (sharedUids.length > 0) {
            conditions.push({ uid: { [Op.in]: sharedUids } }); // Items directly shared with user
        }

        if (sharedProjectIds.length > 0) {
            conditions.push({ project_id: { [Op.in]: sharedProjectIds } }); // Items in shared projects
        }

        const result = { [Op.or]: conditions };
        if (cache) cache.set(cacheKey, result);
        return result;
    }

    // For other resource types (projects, etc.), use the original logic
    const result = {
        [Op.or]: [
            { user_id: userId },
            sharedUids.length
                ? { uid: { [Op.in]: sharedUids } }
                : { uid: null },
        ],
    };
    if (cache) cache.set(cacheKey, result);
    return result;
}

module.exports = {
    ACCESS,
    getAccess,
    ownershipOrPermissionWhere,
    getSharedUidsForUser,
};
