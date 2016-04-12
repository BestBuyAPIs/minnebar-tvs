'use strict';

var _ = require('lodash');
var express = require('express');
var router = express.Router({mergeParams: true});
var db = require('../lib/db');
var tvs = require('../config/tvs');
var tvHorizontal = require('../config/tv-horizontal');
var tvVertical = require('../config/tv-vertical');

router.use(function authChecker (req, res, next) {
  if (req.headers['x-admin-code'] === process.env.SUPERADMIN_CODE) {
    req.user = {id: 'Best Buy'};
    return next();
  }

  var user = db('users').find({ tv: req.params.id, code: req.query.code });
  if (user) {
    if (user.banned) {
      return res.status(403).send('Sorry. We decided to ban your access to this system due to abuse.');
    } else {
      req.user = user;
      return next();
    }
  }

  res.status(404).send('File Not Found');
});

router.get('/', function (req, res, next) {
  var templateData = {};
  templateData.tv = _.find(tvs, {id: req.params.id});
  if (!templateData.tv) {
    return res.status(404).send('File Not Found');
  }

  var currentLayout = db('tvs').find({id: req.params.id});

  templateData.layouts = JSON.stringify({
    horizontal: tvHorizontal,
    vertical: tvVertical,
    current: currentLayout ? currentLayout.layout : false
  });
  templateData.path = 'control' + (req.query.code ? '?code=' + req.query.code : '');

  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', 0);
  res.render('tv-control/index', templateData);
});

router.post('/', function (req, res, next) {
  var redirectPath = 'control' + (req.query.code ? '?code=' + req.query.code : '');
  if (!req.body.cmd) {
    return next(new Error('POST without a cmd'));
  }

  switch (req.body.cmd) {
    case 'save':
      var tv = db('tvs').find({ id: req.params.id });
      var layout;
      try {
        layout = JSON.parse(req.body.layout);
      } catch (e) {
        return res.status(400).send('Bad layout format');
      }

      if (!tv) {
        db('tvs')
        .push({
          id: req.params.id,
          user: req.user.id,
          timestamp: (new Date()).toString(),
          layout: layout
        })
        .write().then(function (tv) {
          req.app.io.emit('reload tv', {id: req.params.id});
          req.flash('success', 'TV layout successfully updated');
          res.redirect(redirectPath);
        });
      } else {
        tv.user = req.user.id;
        tv.timestamp = (new Date()).toString();
        tv.layout = layout;
        db.write().then(function (tv) {
          req.app.io.emit('reload tv', {id: req.params.id});
          req.flash('success', 'TV layout successfully updated');
          res.redirect(redirectPath);
        });
      }
      break;

    default:
      res.redirect(redirectPath);
  }
});

module.exports = router;
