'use strict';

var express = require('express');
var router = express.Router();
var minnebar_sessions = require('../lib/minnebar_sessions');

router.get('/', function (req, res, next) {
  minnebar_sessions(function (err, results) {
    if (err) {
      res.status(500).send('Something went wrong');
    } else {
      res.json(results);
    }
  });
});

module.exports = router;
