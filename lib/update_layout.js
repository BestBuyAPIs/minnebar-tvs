'use strict';
module.exports = updateLayout;

var db = require('./db');

function updateLayout (data, cb) {
  var user = db('users').find({ tv: data.id, code: data.code });

  if (data.admin === process.env.SUPERADMIN_CODE) {
    user = {id: 'Best Buy'};
  }

  if (!user) return cb({type: 'error', text: 'No user found'});

  var blah = {
    id: '' + data.id,
    user: user.id,
    timestamp: (new Date()).toString(),
    layout: data.layout
  };

  db('tvs').remove({id: data.id})
    .then(_ => db('tvs').push(blah))
    .then(_ => {
      db.write();
      cb(null);
    });
}
