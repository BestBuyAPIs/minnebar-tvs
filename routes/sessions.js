'use strict';

var request = require('request');
var express = require('express');
var router = express.Router();

var slots = ['09:40', '10:40', '11:40', '13:50', '14:50', '15:50', '16:50'];
var rooms = ['Harriet', 'Calhoun','Nokomis', 'Minnetonka', 'Theater', 'Proverb-Edison', 'Landers', 'Learn', 'Challenge'];

var sessions = {};
function loadSessions () {
	console.log('Loading sessions');
	request('http://sessions.minnestar.org/sessions.json', function (error, response, body) {
		if (typeof body === 'string') {
			sessions = JSON.parse(body);
			if (process.env.FAKE_DATA) {
				console.log('Set fake data');
			}
		}
	});
}
loadSessions();
setInterval(loadSessions, 60 * 1000);

/* GET home page. */
router.get('/', function (req, res, next) {
	res.json(sessions);
});

module.exports = router;
