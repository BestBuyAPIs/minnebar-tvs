/* global moment, $ */
var rooms = {
  'nokomis': {
    'room': [490, 580],
    'text': [510, 600]
  },
  'harriet': {
    'room': [550, 490],
    'text': [580, 470]
  },
  'calhoun': {
    'room': [640, 610],
    'text': [660, 630]
  },
  'minnetonka': {
    'room': [580, 700],
    'text': [600, 720]
  },
  'theater': {
    'room': [1020, 860],
    'text': [1020, 900]
  },
  'proverb-edison': {
    'room': [590, 1550],
    'text': [610, 1570]
  },
  'landers': {
    'room': [80, 1760],
    'text': [100, 1780]
  },
  'learn': {
    'room': [920, 1820],
    'text': [980, 1760]
  },
  'challenge': {
    'room': [820, 1800],
    'text': [820, 1700]
  },
};

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
setInterval(checkVersion, 5000);

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
  $('.clock').text(moment().format('h:mma'));
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
  textEl.innerHTML = roomName;
  textEl.className = 'absolute';
  textEl.id = roomName + '-text';
  textEl.style.top = room.text[0] + 'px';
  textEl.style.left = room.text[1] + 'px';
  document.getElementById('map').appendChild(textEl);

  document.body.appendChild(createLine(room.room[1], room.room[0], room.text[1], room.text[0]));
});

function createLineElement (x, y, length, angle) {
  var line = document.createElement('div');
  var styles = 'border: 1px solid yellow; '
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
