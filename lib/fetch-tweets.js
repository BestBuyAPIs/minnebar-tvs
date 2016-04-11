'use strict';
module.exports = fetchTweets;

var T = require('../lib/twitter_client').app;
var memoize = require('memoizee');

function getTweetsLive (query, callback) {
  T.get('search/tweets',
    { q: query,
      count: 10,
      result_type: 'recent'
    },
    function (err, data, response) {
      if (err) {
        return callback(err);
      }
      return callback(null, data.statuses);
    }
  );
}

var getTweets = memoize(getTweetsLive, { maxAge: 1000 * 60, async: true });

function fetchTweets (cb) {
  getTweets(process.env.TWITTER_RECENT_TWEETS, function (err, results) {
    if (err) {
      console.warn(err);
      return cb(err);
    } else {
      return cb(null, results);
    }
  });
}
