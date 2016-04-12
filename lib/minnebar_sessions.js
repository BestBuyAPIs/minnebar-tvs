'use strict';

// var cheerio = require('cheerio');
// var request = require('request');
var memoize = require('memoizee');

var getSessionsLive = function (callback) {
  // We'll make a live call to the session page and parse/cache it
  // But until its live, we'll mock the data
  var sessions = [];
  for (var i = 0; i <= 24; i++) {
    sessions.push(
      { start: i * 100,
        start_cosmetic: i + 'am',
        end: (i + 1) * 100,
        end_cosmetic: (i + 1) + 'am',
        name: 'Something ' + i,
        location: 'Somewhere ' + i
      }
    );
  }
  return callback(null, sessions);
};

module.exports = memoize(getSessionsLive, { maxAge: 1000 * 60, async: true });
