'use strict';
module.exports = updateLayout;

var db = require('./db');

function updateLayout (data, cb) {
  var user = db('users').find({ tv: data.id, code: data.code });

  if (data.admin === process.env.SUPERADMIN_CODE) {
    user = {id: 'Best Buy'};
  }

  if (!user) return cb({type: 'error', text: 'No user found'});

  var tv = db('tvs').find({id: data.id});

  if (tv) {
    tv.user = user.id;
    tv.timestamp = (new Date()).toString();
    tv.layout = data.layout;
  } else {
    db('tvs').push({
      id: '' + data.id,
      user: user.id,
      timestamp: (new Date()).toString(),
      layout: data.layout
    });
  }
  db.write().then(function () {
    cb(null);
  });
}
