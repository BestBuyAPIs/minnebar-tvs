'use strict';

var T = require('../lib/twitter_client').user;
var async = require('async');
var _ = require('lodash');
var db = require('../lib/db');
var randomString = require('../lib/random');

var timeBetweenTweetScans = 10;
var sendWarningTweet = function (userId) {
  var warnedUser = db('user_warnings').find({ id: userId });
  if (!warnedUser) {
    var tweetText = '@' + userId + ", sorry I can't send you a code unless you follow me. DM me again once that is fixed.";

    db('user_warnings').push({id: userId});
    db.write().then(function () {
      T.post('statuses/update',
        { status: tweetText },
        function (err, data, response) {
          if (err) {
            return console.warn(err);
          }
          // console.log(data);
          console.log('Warning tweet successfully sent to %s', userId);
        }
      );
    });
  } else {
    console.log('Skipping warning tweet to %s since we already warned them once', userId);
  }
};

var sendTVCode = function (userId, tvId, tvCode, callback) {
  var controlUrl = 'https://tvcontrolco.de/tv/' + tvId + '/control?code=' + tvCode;
  var tweetText = 'You can control TV #' + tvId + ' via ' + controlUrl;
  T.post('direct_messages/new',
    { screen_name: userId,
      text: tweetText
    },
    function (err, data, response) {
      if (err) {
        console.warn(err);
        return callback();
      }

      // console.log(data);
      if (data.errors && data.errors[0].code === 150) {
        console.log('Telling %s that they are not following us', userId);
        sendWarningTweet(userId);
      } else {
        console.log('DM successfully sent to %s', userId);
      }
      return callback();
    }
  );
};

var processTweet = function (status, callback) {
  var tweetUser = status.user.screen_name;
  var idExtract = /\d/.exec(status.text);
  if (!idExtract) {
    console.log('Ignoring tweet: %s', status.text);
    return callback();
  }
  var tvId = idExtract[0];
  var user = db('users').find({ id: tweetUser, tv: tvId });
  if (user) {
    // Most likely the user forgot...
    return sendTVCode(user.id, tvId, user.code, callback);
  } else {
    var tvCode = randomString(12);
    db('users').push({id: tweetUser, tv: tvId, code: tvCode});
    db.write().then(function () {
      return sendTVCode(tweetUser, tvId, tvCode, callback);
    });
  }
};

var dbSinceStorage = db('meta').find({ key: 'since_tweet' }) || {'key': 'since_tweet', 'value': 0};
var sinceId = dbSinceStorage.value;
async.forever(
  function (next) {
    T.get('search/tweets',
      { q: 'to:' + process.env.TWITTER_HANDLE,
        count: 100,
        result_type: 'recent',
        since_id: sinceId
      },
      function (err, data, response) {
        if (err) {
          return setTimeout(next, 30 * 1000);
        }

        async.each(data.statuses, function (status, next) {
          processTweet(status, next);
        }, function () {
          sinceId = data.search_metadata.max_id_str;
          dbSinceStorage.value = sinceId;
          db.write().then(function () {
            setTimeout(next, timeBetweenTweetScans * 1000);
          });
        });
      }
    );
  },
  function (err) {
    // We never get here.
    console.warn(err);
  }
);
