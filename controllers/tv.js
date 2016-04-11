'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
  console.log(req.params);
  res.render('tv/index', {});
});

module.exports = router;
