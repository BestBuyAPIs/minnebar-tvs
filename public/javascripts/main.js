/* global moment, $ */
var faketime;
var LONGEST_TITLE = '';
var forceLongestTitle = false;
var MAX_TITLE_LENGTH = {
  now: 85,
  next: 105
};

var slots = [
  '2017-03-25 08:45:00 -0500',
  '2017-03-25 09:25:00 -0500',
  '2017-03-25 10:20:00 -0500',
  '2017-03-25 11:15:00 -0500',
  '2017-03-25 12:10:00 -0500',
  '2017-03-25 14:00:00 -0500',
  '2017-03-25 15:00:00 -0500',
  '2017-03-25 16:00:00 -0500'
];

/* Check the version of the page, and refresh if the version changes */
var version;
function checkVersion () {
  $.ajax({
    url: '/version'
  })
  .done(function (data) {
    if (typeof data !== 'object' || !data.version) {
      return console.log('Did not get a valid version');
    }
    if (!version) {
      version = data.version;
      return;
    }
    if (version !== data.version) {
      console.log('Version change - reloading page');
      window.location.reload();
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
  document.getElementById('imageMarkerLocation').style.top = markerSpots[0] + 'px';
  document.getElementById('imageMarkerLocation').style.left = markerSpots[1] + 'px';
}
setMarker();
window.onhashchange = function () { setMarker(); };

/* Keep the clock up to date */
function updateClock () {
  $('.clock').text(moment(faketime).format('h:mma'));
  setTimeout(updateClock, 5 * 1000);
}
updateClock();

/* Update the sessions attached to each room */
function updateSessions () {
  console.log('Session update triggered');
  $.ajax({
    url: '/sessions'
  })
  .done(function (sessions) {
    if (typeof sessions !== 'object' || sessions.length === 0) {
      return console.log('Did not get a valid version');
    }

    var currentTime = (!faketime) ? new Date() : faketime;
    var currentSlot, nextSlot;

    if (forceLongestTitle) {
      sessions.forEach(function (session) {
        if (session.session_title.length > LONGEST_TITLE.length) LONGEST_TITLE = session.session_title;
      });
    }

    sessions.sort(function (a, b) {
      if (a.room_name < b.room_name) return -1;
      if (a.room_name > b.room_name) return 1;
      return 0;
    });

    // If we're before the first session
    var firstSession = new Date(slots[0]);

    var lastSession = new Date(slots[7]);

    console.log('firstSession', firstSession);
    console.log('lastSession', lastSession);

    if (currentTime < firstSession) {
      currentSlot = 'BREAKFAST';
      nextSlot = slots[0];
    } else if (currentTime > lastSession) {
      console.log('detected last session', currentTime, lastSession);
      currentSlot = slots[slots.length - 1];
      nextSlot = 'HAPPYHOUR';
    } else {
      slots.forEach(function (slot, index) {
        if (currentSlot) return;

        if (index + 1 === slots.length) {
          console.log('whoops');
          currentSlot = slot;
          nextSlot = 'HAPPYHOUR';
        } else {
          var slotTime = new Date(slot);
          var nextTime = new Date(slots[index + 1]);
          if (slotTime <= currentTime && currentTime <= nextTime) {
            currentSlot = slot;
            nextSlot = slots[index + 1];
          }
        }
      });
    }
    console.log('Current slot is %s, next slot is %s', currentSlot, nextSlot);

    var table = document.createElement('table');
    var tableCap = document.createElement('caption');
    tableCap.appendChild(document.createTextNode(new Date(currentSlot).toTimeString()));
    table.appendChild(tableCap);
    var tableBody = document.createElement('tbody');

    var nextTable = document.createElement('table');
    var nextTableBody = document.createElement('tbody');
    sessions.forEach(function (session) {
      if (session.room_name === null) return;
      var useTitle = (forceLongestTitle) ? LONGEST_TITLE : session.session_title;
      if (session.starts_at === currentSlot || session.starts_at === nextSlot) {
        if (useTitle.length > MAX_TITLE_LENGTH.now) {
          useTitle = useTitle.substring(0, MAX_TITLE_LENGTH.now) + '...';
        }

        var row = document.createElement('tr');

        var roomCell = document.createElement('th');
        roomCell.appendChild(document.createTextNode(session.room_name));
        row.appendChild(roomCell);

        var titleCell = document.createElement('td');
        titleCell.appendChild(document.createTextNode(useTitle));
        row.appendChild(titleCell);

        if (session.starts_at === currentSlot) {
          tableBody.appendChild(row);
        } else {
          nextTableBody.appendChild(row);
        }
      }
    });

    table.appendChild(tableBody);
    nextTable.appendChild(nextTableBody);

    var sesDiv = document.getElementById('sessions');
    sesDiv.removeChild(sesDiv.firstChild);
    sesDiv.appendChild(table);

    var nextSesDiv = document.getElementById('nextsessions');
    nextSesDiv.removeChild(nextSesDiv.firstChild);
    nextSesDiv.appendChild(nextTable);
  });
}

function makeSlotPretty (slot) {
  var parts = slot.split(':');
  var hour = parseInt(parts[0]);
  if (hour > 12) return (hour - 12) + ':' + parts[1] + 'pm';
  else return hour + ':' + parts[1] + 'pm';
}

function setSlot (index) {
  var slot = (index > 6) ? '2017-03-25 17:00:00 -0500' : slots[index];
  faketime = new Date(slot);
  updateSessions();
  updateClock();
}

setInterval(updateSessions, 60 * 1000);
updateSessions();

if (window.demoMode) {
  window.slot = 0;
  setInterval(function () {
    window.slot = (window.slot + 1) % 8;
    console.log(window.slot);
    setSlot(window.slot);
  }, 3000);
}
