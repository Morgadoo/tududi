const getAuthenticatedUserId = (req) =>
    req.currentUser?.id || req.session?.userId;

const getActiveProfileId = (req) => req.activeProfileId || null;

module.exports = {
    getAuthenticatedUserId,
    getActiveProfileId,
};
