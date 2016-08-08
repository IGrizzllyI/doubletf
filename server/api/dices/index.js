  'use strict';

var controller = require('./dices.controller');

import express from 'express';
import passport from 'passport';
import ensureAuthenticated from './../../middleware/ensureAuthenticated';

var router = express.Router();

router.post('/roll', controller.roll);
router.get('/history', controller.history);

// router.get('/', controller.index);
// router.get('/users', controller.users);
// router.get('/:id', controller.show);
// router.post('/', ensureAuthenticated, controller.create);
// router.post('/:id/accept', controller.accept);

module.exports = router;
