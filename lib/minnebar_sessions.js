'use strict';

var request = require('request');
var memoize = require('memoizee');

var getSessionsLive = function (callback) {
  var url = 'http://sessions.minnestar.org/sessions.json';
  request.get({ url: url, json: true }, function (err, response, sessions) {
    if (err) {
      return callback(err);
    }
    return callback(null, sessions);
  });
};

module.exports = memoize(getSessionsLive, { maxAge: 1000 * 60, async: true });
