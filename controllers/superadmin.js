'use strict';

var express = require('express');
var router = express.Router();
var db = require('../lib/db');

router.use(function authChecker (req, res, next) {
  if (req.headers['x-admin-code'] === process.env.SUPERADMIN_CODE) {
    next();
  } else {
    res.status(404).send('File Not Found');
  }
});

router.get('/', function (req, res, next) {
  var templateData = {};
  templateData.users = db('users').value();
  templateData.tvs = require('../config/tvs');
  res.render('superadmin/index', templateData);
});

router.post('/', function (req, res, next) {
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'));
  }
  switch (req.body.cmd) {
    case 'something':
      if (true) {
        req.flash('success', 'Something good.');
        res.redirect('/');
      } else {
        req.flash('error', 'Something bad.');
        res.redirect('/');
      }
      break;
    default:
      res.redirect('/');
  }
});

module.exports = router;
