'use strict';

var express = require('express');
var router = express.Router();

router.use('/tv/:id/control', require('./tv-control'));
router.use('/tv/:id', require('./tv'));
router.use('/superadmin', require('./superadmin'));
router.use('/recent-tweets.json', require('./recent-tweets'));
router.use('/session-list.json', require('./session-list'));

module.exports = router;
