'use strict';

var express = require('express');
var router = express.Router();
var T = require('../lib/twitter_client').app;
var memoize = require('memoizee');

var getTweetsLive = function (query, callback) {
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
};
var getTweets = memoize(getTweetsLive, { maxAge: 1000 * 60, async: true });

router.get('/', function (req, res, next) {
  getTweets(process.env.TWITTER_RECENT_TWEETS, function (err, results) {
    if (err) {
      console.warn(err);
      res.status(500).send('Something went wrong');
    } else {
      res.json(results);
    }
  });
});

module.exports = router;
