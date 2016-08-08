'use strict';

var controller = require('./coinflip.controller');

import express from 'express';
import passport from 'passport';
import ensureAuthenticated from './../../middleware/ensureAuthenticated';

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', ensureAuthenticated, controller.create);
router.post('/:id/accept', controller.accept);

module.exports = router;
