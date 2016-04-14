'use strict';

var low = require('lowdb');
var storage = require('lowdb/file-async');

var db = low('tv-configs.json', { storage });

module.exports = db;
