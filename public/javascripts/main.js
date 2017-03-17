/* global moment, $ */

if (window.location.hash) {
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
}

$('.clock').text(moment().format('h:mma'));

setInterval(function update () {
  $('.clock').text(moment().format('h:mma'));
}, 5 * 1000);

var rooms = ['nokomis', 'badabing', 'badaboom'];

rooms.forEach(function (room) {
  var roomPos = $('.' + room + '-room').position();
  var textPos = $('.' + room + '-text').position();
  document.body.appendChild(createLine(roomPos.left, roomPos.top, textPos.left, textPos.top));
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

