/* global moment, $ */
var faketime;
var LONGEST_TITLE = '';
var forceLongestTitle = false;
var MAX_TITLE_LENGTH = {
  now: 85,
  next: 105
};

var slots = [
  {name: 'Breakfast and Kickoff'},
  {name: '8:45am – 9:15am   Session 0'},
  {name: '9:25am – 10:15am   Session 1'},
  {name: '10:20am – 11:10am   Session 2'},
  {name: '11:15am – 12:05pm   Session 3'},
  {name: '12:10pm – 1:00pm   Session 4'},
  {name: '1:00pm – 2:00pm   Lunch'},
  {name: '2:00pm – 2:50pm   Session 5'},
  {name: '3:00pm – 3:50pm   Session 6'},
  {name: '4:00pm – 4:50pm   Session 7'},
  {name: '4:30pm – 7:00pm   Happy Hour'}
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

      var rawSlots = {};
      sessions.forEach(d => {
        rawSlots[d.starts_at] = true;
      });
      Object.keys(rawSlots).sort().forEach(function (s, i) {
        slots[i].time = s;
      });

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

      slots.forEach(function (slot, index) {
        var isLastSlot = index === (slots.length - 1);
        var slotTime = new Date(slot.time);
        var nextTime = isLastSlot ? slotTime : new Date(slots[index + 1].time);
        if (slotTime <= currentTime) {
          currentSlot = slot;
          nextSlot = isLastSlot ? slot : slots[index + 1];
        }
      });

      console.log('Current slot is %s, next slot is %s', currentSlot, nextSlot);

      document.getElementById('timeslotname').innerText = currentSlot.name;

      var table = document.createElement('table');
      var tableBody = document.createElement('tbody');

      var nextTable = document.createElement('table');
      var nextTableBody = document.createElement('tbody');
      sessions.forEach(function (session) {
        if (session.room_name === null) session.room_name = '???';
        var useTitle = (forceLongestTitle) ? LONGEST_TITLE : session.session_title;
        if (session.starts_at === currentSlot.time || session.starts_at === nextSlot.time) {
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

          if (session.starts_at === currentSlot.time) tableBody.appendChild(row);
          if (session.starts_at === nextSlot.time) nextTableBody.appendChild(row);
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

function setSlot (index) {
  if (index > slots.length - 1) index = slots.length - 1;
  var slot = slots[index];
  faketime = new Date(slot.time);
  console.log('faketime', faketime, slot.time);
  updateSessions();
  updateClock();
}

setInterval(updateSessions, 60 * 1000);
updateSessions();

if (window.demoMode) {
  window.slot = 0;
  setInterval(function () {
    setSlot(window.slot);
    window.slot = (window.slot + 1) % slots.length;
  }, 1000);
}
