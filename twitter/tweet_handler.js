'use strict';

var T = require('../lib/twitter_client').user;
var async = require('async');
var _ = require('lodash');

var sinceId = false;
async.forever(
  function (next) {
    T.get('search/tweets',
      { q: 'to:bestbuy',
        count: 1,
        result_type: 'recent',
        since_id: sinceId
      },
      function (err, data, response) {
        if (err) {
          return next(err);
        }
        sinceId = data.search_metadata.max_id_str;
        _.each(data.status, function (status) {

        });
        setTimeout(next, 5000);
      }
    );
  },
  function (err) {
    console.log(err);
  }
);
