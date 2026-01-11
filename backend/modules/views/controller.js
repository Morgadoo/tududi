'use strict';

const viewsService = require('./service');

const viewsController = {
    async getAll(req, res, next) {
        try {
            const profileId = req.activeProfileId;
            const views = await viewsService.getAll(
                req.currentUser.id,
                profileId
            );
            res.json(views);
        } catch (error) {
            next(error);
        }
    },

    async getPinned(req, res, next) {
        try {
            const profileId = req.activeProfileId;
            const views = await viewsService.getPinned(
                req.currentUser.id,
                profileId
            );
            res.json(views);
        } catch (error) {
            next(error);
        }
    },

    async getOne(req, res, next) {
        try {
            const profileId = req.activeProfileId;
            const uid = decodeURIComponent(req.params.identifier);
            const view = await viewsService.getByUid(
                req.currentUser.id,
                uid,
                profileId
            );
            res.json(view);
        } catch (error) {
            next(error);
        }
    },

    async create(req, res, next) {
        try {
            const profileId = req.activeProfileId;
            const view = await viewsService.create(
                req.currentUser.id,
                req.body,
                profileId
            );
            res.status(201).json(view);
        } catch (error) {
            next(error);
        }
    },

    async update(req, res, next) {
        try {
            const profileId = req.activeProfileId;
            const uid = decodeURIComponent(req.params.identifier);
            const view = await viewsService.update(
                req.currentUser.id,
                uid,
                req.body,
                profileId
            );
            res.json(view);
        } catch (error) {
            next(error);
        }
    },

    async delete(req, res, next) {
        try {
            const profileId = req.activeProfileId;
            const uid = decodeURIComponent(req.params.identifier);
            const result = await viewsService.delete(
                req.currentUser.id,
                uid,
                profileId
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
};

module.exports = viewsController;
