const { Tag } = require('../../../models');
const { validateTagName } = require('../../tags/tagsService');

/**
 * Update task tags, creating new tags if needed.
 * Tags are scoped to the user's profile for proper isolation.
 */
async function updateTaskTags(task, tagsData, userId, profileId = null) {
    if (!tagsData) return;

    const validTagNames = [];
    const invalidTags = [];

    for (const tag of tagsData) {
        const validation = validateTagName(tag.name);
        if (validation.valid) {
            if (!validTagNames.includes(validation.name)) {
                validTagNames.push(validation.name);
            }
        } else {
            invalidTags.push({ name: tag.name, error: validation.error });
        }
    }

    if (invalidTags.length > 0) {
        throw new Error(
            `Invalid tag names: ${invalidTags.map((t) => `"${t.name}" (${t.error})`).join(', ')}`
        );
    }

    if (validTagNames.length === 0) {
        await task.setTags([]);
        return;
    }

    // Build where clause for finding existing tags (profile-aware)
    const whereClause = { user_id: userId, name: validTagNames };
    if (profileId) {
        whereClause.profile_id = profileId;
    }

    const existingTags = await Tag.findAll({
        where: whereClause,
    });

    const existingTagNames = existingTags.map((tag) => tag.name);
    const newTagNames = validTagNames.filter(
        (name) => !existingTagNames.includes(name)
    );

    // Create new tags with profile_id
    const createdTags = await Promise.all(
        newTagNames.map((name) =>
            Tag.create({ name, user_id: userId, profile_id: profileId })
        )
    );

    const allTags = [...existingTags, ...createdTags];
    await task.setTags(allTags);
}

module.exports = {
    updateTaskTags,
};
