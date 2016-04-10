'use strict';

var crypto = require('crypto');

module.exports = function (len) {
  return crypto.randomBytes(Math.ceil(len * 3 / 4))
    .toString('base64')
    .slice(0, len)
    .replace(/[^a-zA-Z0-9]/g, '0');
};
