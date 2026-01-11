'use strict';

const express = require('express');
const router = express.Router();
const profilesController = require('./controller');

// All routes require authentication (handled by app.js middleware)

router.get('/profiles', profilesController.list);
router.get('/profiles/active', profilesController.getActive);
router.get('/profiles/:uid', profilesController.getOne);
router.post('/profiles', profilesController.create);
router.patch('/profiles/switch/:uid', profilesController.switchProfile);
router.patch('/profiles/:uid', profilesController.update);
router.delete('/profiles/:uid', profilesController.delete);

module.exports = router;
