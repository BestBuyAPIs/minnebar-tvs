/* global moment, $ */
var faketime, LONGEST_TITLE = '';
var forceLongestTitle = false;
var MAX_TITLE_LENGTH = {
  now: 85,
  next: 100
};
var rooms = {
  'Nokomis': {
    'room': [486, 500],
    'text': [10, 10],
    lineColor: '#0a2666'
  },
  'Harriet': {
    'room': [534, 432],
    'text': [190, 10],
    lineColor: '#0a2696'
  },
  'Calhoun': {
    'room': [640, 530],
    'text': [660, 30],
    lineColor: '#0a5666'
  },
  'Minnetonka': {
    'room': [580, 700],
    'text': [190, 850],
    lineColor: '#3a2666',
    specialCss: 'max-width: 640px;'
  },
  'Theater': {
    'room': [1020, 860],
    'text': [960, 3],
    lineColor: '#3a5666',
    specialCss: 'max-width: 780px;font-size:20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'
  },
  'Proverb-Edison': {
    'room': [590, 1550],
    'text': [370, 800],
    lineColor: '#0a5696',
    specialCss: 'max-width: 700px;'
  },
  'Landers': {
    'room': [80, 1760],
    'text': [10, 880],
    lineColor: '#3a2696'
  },
  'Learn': {
    'room': [920, 1820],
    'text': [830, 1030],
    lineColor: '#3a5696',
    specialCss: 'max-width: 600px;'
  },
  'Challenge': {
    'room': [820, 1800],
    'text': [600, 1000],
    lineColor: '#0a2666',
    specialCss: 'max-width: 500px;'
  },
};
var slots = ['09:40', '10:40', '11:40', '13:50', '14:50', '15:50', '16:50'];

/* Check the version of the page, and refresh if the version changes */
var version;
function checkVersion () {
  $.ajax({
    url: '/version'
  })
  .done(function( data ) {
    if (typeof data !== 'object' || !data.version) {
      return console.log('Did not get a valid version');
    }
    if (!version) {
      version = data.version;
      return;
    }
    if (version !== data.version) {
      console.log('Version change - reloading page');
      location.reload();
    }
  });
}
setInterval(checkVersion, 60 * 1000);

/* Define the 'YOU ARE HERE' marker on the page */
function setMarker () {
  var markerSpots = window.location.hash.substring(1).split(',');
  if (isNaN(parseInt(markerSpots[0])) || isNaN(parseInt(markerSpots[1]))) {
    console.log('Invalid marker location. Not placing marker.');
    return;
  }

  if (!document.getElementById('imageMarkerLocation')) {
    var marker = document.createElement('img');
    marker.setAttribute('id', 'imageMarkerLocation');
    marker.setAttribute('src', '/images/youarehere.png');
    marker.setAttribute('class', 'youarehere-marker');
    document.body.appendChild(marker);
  }
  document.getElementById('imageMarkerLocation').style.top =  markerSpots[0] + 'px';
  document.getElementById('imageMarkerLocation').style.left =  markerSpots[1] + 'px';
};
setMarker();
window.onhashchange = function() { setMarker(); }

/* Keep the clock up to date */
function updateClock () {
  $('.clock').text(moment(faketime).format('h:mma'));
  setTimeout(updateClock, 5 * 1000);
}
updateClock();

/* Draw the rooms on the page */
Object.keys(rooms).forEach(function (roomName) {
  var room = rooms[roomName];

  var roomEl = document.createElement('div');
  roomEl.className = 'absolute';
  roomEl.id = roomName + '-room';
  roomEl.style.top = room.room[0] + 'px';
  roomEl.style.left = room.room[1] + 'px';
  document.getElementById('map').appendChild(roomEl);

  var textEl = document.createElement('div');
  textEl.className = 'roomtext absolute';
  textEl.id = roomName + '-text';
  if (room.specialCss) textEl.style.cssText = room.specialCss;
  textEl.style.top = room.text[0] + 'px';
  textEl.style.left = room.text[1] + 'px';
  document.getElementById('map').appendChild(textEl);

  var lineEl = createLine(room.room[1], room.room[0], room.text[1] +5 , room.text[0] + 5);
  lineEl.id = roomName + '-line';
  if (room.lineColor) lineEl.style.borderColor = room.lineColor;
  document.body.appendChild(lineEl);
});

function createLineElement (x, y, length, angle) {
  var line = document.createElement('div');
  var styles = 'border: 1px solid white; '
               + 'box-shadow: 1px 1px 1px rgba(255, 255, 255, .5); '
               + 'width: ' + length + 'px; '
               + 'height: 0px; '
               + '-moz-transform: rotate(' + angle + 'rad); '
               + '-webkit-transform: rotate(' + angle + 'rad); '
               + '-o-transform: rotate(' + angle + 'rad); '
               + '-ms-transform: rotate(' + angle + 'rad); '
               + 'position: absolute; '
               + 'top: ' + y + 'px; '
               + 'left: ' + x + 'px; '
               + 'z-index: 1';
  line.setAttribute('style', styles);
  return line;
}

function createLine (x1, y1, x2, y2) {
  var a = x1 - x2,
      b = y1 - y2,
      c = Math.sqrt(a * a + b * b);

  var sx = (x1 + x2) / 2,
      sy = (y1 + y2) / 2;

  var x = sx - c / 2,
      y = sy;

  var alpha = Math.PI - Math.atan2(-b, a);

  return createLineElement(x, y, c, alpha);
}

/* Update the sessions attached to each room */
function updateSessions () {
  console.log('Session update triggered');
  $.ajax({
    url: '/sessions'
  })
  .done(function( sessions ) {
    if (typeof sessions !== 'object' || sessions.length === 0) {
      return console.log('Did not get a valid version');
    }
    var currentTime = (!faketime) ? new Date() : faketime;
    var currentSlot, nextSlot;

    if (forceLongestTitle) {
      sessions.forEach(function (session) {
        console.log('Comparing %s and %s', session.session_title, LONGEST_TITLE);
        if (session.session_title.length > LONGEST_TITLE.length) LONGEST_TITLE = session.session_title;
      })
    }

    // If we're before the first session
    var times = slots[0].split(':');
    var firstSession = new Date();
    firstSession.setHours(parseInt(times[0]));
    firstSession.setMinutes(parseInt(times[1]));

    times = slots[slots.length - 1].split(':');
    var lastSession = new Date();
    lastSession.setHours(parseInt(times[0]));
    lastSession.setMinutes(parseInt(times[1]));

    if (currentTime < firstSession) {
      currentSlot = 'BREAKFAST';
      nextSlot = slots[0];
    } else if (currentTime > lastSession) {
      currentSlot = slots[slots.length - 1];
      nextSlot = 'HAPPYHOUR';
    } else {
      slots.forEach(function (slot, index) {
        if (currentSlot) return;

        if (index + 1 === slots.length) {
          currentSlot = slot;
          nextSlot = 'HAPPYHOUR';
        } else {
          var times = slot.split(':');
          var slotTime = new Date();
          slotTime.setHours(parseInt(times[0]));
          slotTime.setMinutes(parseInt(times[1]));
          times = slots[index + 1].split(':');
          var nextTime = new Date();
          nextTime.setHours(parseInt(times[0]));
          nextTime.setMinutes(parseInt(times[1]));
          if (slotTime <= currentTime && currentTime <= nextTime) {
            currentSlot = slot;
            nextSlot = slots[index + 1];
          }
        }
      });
    }
    console.log('Current slot is %s, next slot is %s', currentSlot, nextSlot);

    var roomText = {};
    // Make sure every room's HTML gets reset
    Object.keys(rooms).forEach(function (roomName) {
      roomText[roomName] = {
        now: (currentSlot === 'BREAKFAST') ? '<strong>Now</strong> Breakfast & kickoff' : '',
        next: (nextSlot === 'HAPPYHOUR') ? '<strong>5:30pm</strong> Happy Hour at Sandy\'s' : ''
      };
    });

    sessions.forEach(function (session) {
      var useTitle = (forceLongestTitle) ? LONGEST_TITLE : session.session_title;
      if (session.starts_at === currentSlot) {
        if (useTitle.length > MAX_TITLE_LENGTH.now) {
          useTitle = useTitle.substring(0, MAX_TITLE_LENGTH.now) + '&hellip;';
        }
        roomText[session.room_name].now = '<strong>Now</strong> ' + useTitle;
      }
      if (session.starts_at === nextSlot) {
        if (useTitle.length > MAX_TITLE_LENGTH.next) {
          useTitle = useTitle.substring(0, MAX_TITLE_LENGTH.next) + '&hellip;';
        }
        roomText[session.room_name].next = '<strong>At ' + makeSlotPretty(session.starts_at) + '</strong> ' + useTitle;
      }
    });

    Object.keys(rooms).forEach(function (roomName) {
      if (!roomText[roomName].now && !roomText[roomName].next) {
        document.getElementById(roomName + '-room').style.display = 'none';
        document.getElementById(roomName + '-text').style.display = 'none';
        document.getElementById(roomName + '-line').style.display = 'none';
      }
      document.getElementById(roomName + '-room').style.display = 'block';
      document.getElementById(roomName + '-line').style.display = 'block';
      document.getElementById(roomName + '-text').style.display = 'block';
      document.getElementById(roomName + '-text').innerHTML =
        '<h2 class="name">Sessions happening in ' + roomName + '</h2>' +
        '<div class="now">' + roomText[roomName].now + '</div>' +
        '<div class="next">' + roomText[roomName].next + '</div>';
    });
  });
}

function makeSlotPretty (slot) {
  var parts = slot.split(':');
  var hour = parseInt(parts[0]);
  if (hour > 12) return (hour - 12) + ':' + parts[1] + 'pm';
  else return hour + ':' + parts[1] + 'pm';
}
function setSlot (index) {
  var slot = (index > 6) ? '17:00' : slots[index];
  var times = slot.split(':');
  faketime = new Date();
  faketime.setHours(parseInt(times[0]));
  faketime.setMinutes(parseInt(times[1]));
  updateSessions();
  updateClock();
}

setInterval(updateSessions, 60 * 1000);
updateSessions();