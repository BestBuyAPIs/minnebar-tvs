'use strict';

var request = require('request');
var express = require('express');
var router = express.Router();

var slots = ['09:40', '10:40', '11:40', '13:50', '14:50', '15:50', '16:50'];
var rooms = ['Harriet', 'Calhoun', 'Nokomis', 'Minnetonka', 'Theater', 'Proverb-Edison', 'Landres', 'Learn', 'Challenge'];

var currentSlot = 0;
var currentRoom = 0;

var sessions = {};
function loadSessions () {
  console.log('Loading sessions');
  currentSlot = 0;
  currentRoom = 0;
  request('http://sessions.minnestar.org/sessions.json', function (error, response, body) {
    if (typeof body === 'string') {
      try {
        sessions = JSON.parse(body);

        sessions.push({
          starts_at: 'BREAKFAST',
          session_title: 'Breakfast and Kickoff'
        });
      } catch (e) {
        console.warn('Unable to parse JSON response from Minnestar API');
      }
      if (process.env.FAKE_DATA) {
        console.log('Set fake data');
        sessions.forEach(function (session) {
          session.room_name = rooms[currentRoom];
          session.starts_at = slots[currentSlot];

          currentRoom++;
          if (currentRoom === rooms.length) {
            currentSlot++;
            currentRoom = 0;
          }
        });
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
