'use strict';

var express = require('express');
var controller = require('./tradeoffer.controller');
import ensureAuthenticated from './../../middleware/ensureAuthenticated';


var router = express.Router();

router.get('/inventory', ensureAuthenticated, controller.inventory);
router.get('/:id', ensureAuthenticated, controller.show);
router.post('/deposit', ensureAuthenticated, controller.deposit);
router.post('/withdraw', ensureAuthenticated, controller.withdraw);

module.exports = router;
