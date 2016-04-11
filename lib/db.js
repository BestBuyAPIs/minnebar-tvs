'use strict';

var low = require('lowdb');
var storage = require('lowdb/file-async');

var db = low('tv-configs.json', { storage });

// Seed the database to make sure to subsequent lookups return a Promise
// when we're doing a find. Because that just makes coding ugly due to
// it not returning promises in all situations.
db('users').find();
db('tvs').find();
db('user_warnings').find();

module.exports = db;
