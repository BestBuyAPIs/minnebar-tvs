'use strict';

var request = require('request');
var memoize = require('memoizee');
var _ = require('lodash');
var moment = require('moment-timezone');

var startTimes = ['09:15', '10:15', '11:15', '13:45', '14:45', '15:45'];
var rooms = ['Theater', 'Nokomis', 'Minnetonka', 'Harriet', 'Calhoun', 'Brand',
  'Proverb-Edison', 'Zeke Landres', 'Learn', 'Challenge', 'Discovery', 'Tackle',
  'Stephen Leacock', 'Gandhi', 'Louis Pasteur', 'Texas', 'California'];

var getSessionsLive = function (callback) {
  var url = 'http://sessions.minnestar.org/sessions.json';
  request.get({ url: url, json: true }, function (err, response, sessions) {
    if (err) {
      return callback(err);
    }
    // Mock out any data missing start times or rooms
    if (false && process.env.NODE_ENV !== 'production') {
      _.each(sessions, function (session) {
        if (!session.room_name) session.room_name = _.sample(rooms);
        if (!session.starts_at) {
          var startTime = moment(_.sample(startTimes), 'HH:mm');
          session.starts_at = startTime.tz('UTC').format('YYYY-MM-DD HH:mm:ss z');
          session.ends_at = startTime.add(50, 'minutes').tz('UTC').format('YYYY-MM-DD HH:mm:ss z');
        }
      });
    }
    return callback(null, sessions);
  });
};

module.exports = memoize(getSessionsLive, { maxAge: 1000 * 60, async: true });
