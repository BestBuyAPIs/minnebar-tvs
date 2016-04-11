'use strict';

var express = require('express');
var router = express.Router({mergeParams: true});
var db = require('../lib/db');

router.use(function authChecker (req, res, next) {
  if (req.headers['x-admin-code'] === process.env.SUPERADMIN_CODE) {
    return next();
  }

  var user = db('users').find({ tv: req.params.name, code: req.query.code });
  if (user) {
    if (user.banned) {
      res.status(403).send('Sorry. We decided to ban your access to this system due to abuse.');
    } else {
      return next();
    }
  }

  res.status(404).send('File Not Found');
});

router.get('/', function (req, res, next) {
  res.render('tv-control/index', {});
});

module.exports = router;
