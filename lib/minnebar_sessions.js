'use strict';

// var cheerio = require('cheerio');
// var request = require('request');
var memoize = require('memoizee');

var getSessionsLive = function (callback) {
  // We'll make a live call to the session page and parse/cache it
  // But until its live, we'll mock the data
  var sessions = [
    { time: '08:00',
      name: 'Something 1',
      location: 'Somewhere 1'
    },
    { time: '09:00',
      name: 'Something 2',
      location: 'Somewhere 2'
    },
    { time: '10:00',
      name: 'Something 3',
      location: 'Somewhere 3'
    },
    { time: '11:00',
      name: 'Something 4',
      location: 'Somewhere 4'
    }
  ];
  return callback(null, sessions);
};

module.exports = memoize(getSessionsLive, { maxAge: 1000 * 60, async: true });
