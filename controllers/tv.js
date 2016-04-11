'use strict';

var _ = require('lodash');
var express = require('express');
var router = express.Router({mergeParams: true});
var db = require('../lib/db');
var tvs = require('../config/tvs');
var tvHorizontal = require('../config/tv-horizontal');
var tvVertical = require('../config/tv-vertical');

router.get('/', function (req, res, next) {
  var templateData = {};
  templateData.tv = _.find(tvs, {id: req.params.id});
  if (!templateData.tv) {
    res.status(404).send('File Not Found');
  }

  templateData.current = db('tvs').find({id: req.params.id});

  templateData.layouts = JSON.stringify({
    horizontal: tvHorizontal,
    vertical: tvVertical,
    current: templateData.current ? templateData.current.layout : false
  });
  templateData.path = 'control' + (req.query.code ? '?code=' + req.query.code : '');
  res.render('tv/index', templateData);
});

module.exports = router;
