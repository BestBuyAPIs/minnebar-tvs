'use strict';

var T = require('../lib/twitter_client').user;
var async = require('async');
var _ = require('lodash');
var db = require('../lib/db');
var randomString = require('../lib/random');

var sendWarningTweet = function (user) {
  var warnedUser = db('user_warnings').find({ id: user.id });
  if (!warnedUser) {
    var tweetText = '@' + user.id + ', sorry I can\'t send you a code unless you follow me';
    db('user_warnings')
    .push({id: user.id})
    .then(function (warnedUser) {
      T.post('statuses/update',
        { status: tweetText },
        function (err, data, response) {
          if (err) {
            return console.warn(err);
          }
          // console.log(data);
          console.log('Warning tweet successfully sent to %s', user.id);
        }
      );
    });
  } else {
    console.log('Skipping warning tweet to %s since we already warned them once', user.id);
  }
};

var sendTVCode = function (user) {
  var controlUrl = 'https://tvcontrolco.de/tv1/control?code=' + user.code;
  var tweetText = 'You can control TV #' + user.tv + ' via ' + controlUrl;
  T.post('direct_messages/new',
    { screen_name: user.id,
      text: tweetText
    },
    function (err, data, response) {
      if (err) {
        return console.warn(err);
      }

      // console.log(data);
      if (data.errors && data.errors[0].code === 150) {
        console.log('Telling %s that they are not following us', user.id);
        sendWarningTweet(user);
      } else {
        console.log('DM successfully sent to %s', user.id);
      }
    }
  );
};

var processTweet = function (status) {
  var tweetUser = status.user.screen_name;
  var idExtract = /\d/.exec(status.text);
  if (!idExtract) {
    console.log('Ignoring tweet: %s', status.text);
    return;
  }
  var tvId = idExtract[0];
  var user = db('users').find({ id: tweetUser, tv: tvId });
  if (user) {
    // Most likely the user forgot...
    return sendTVCode(user);
  } else {
    db('users')
    .push({id: tweetUser, tv: tvId, code: randomString(12)})
    .then(function (user) {
      return sendTVCode(user);
    });
  }
};

var sinceId = false;
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
          console.warn(err);
          return setTimeout(next, 30 * 1000);
        }
        sinceId = data.search_metadata.max_id_str;
        _.each(data.statuses, function (status) {
          processTweet(status);
        });
        setTimeout(next, 5 * 1000);
      }
    );
  },
  function (err) {
    // We never get here.
    console.warn(err);
  }
);
