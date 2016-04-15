/* globals $, moment, io */

window.setupTv = function (tvConfig) {
  window.socket = io();

  window.socket.on('message', function (data) {
    $.notify(data.text, data.type);
  });

  window.socket.on('layout updated', function (data) {
    if (data.id === tvConfig.id) {
      window.location.reload(false);
    }
  });

  $(document).ready(function () {
    $.ajaxSetup({ cache: false }); // Makes our subsequent getJSON updates easier to write
  });

  // Only maintain the top-middle time block if its populated
  var $timeBlock = $('#updated-time');
  if ($timeBlock.length) {
    var updateTimeAgo = function () {
      var updateTime = $timeBlock.data('time');
      $timeBlock.html(moment(updateTime).fromNow());
    };
    updateTimeAgo();
    setInterval(updateTimeAgo, 5 * 1000);
  }

  // Layout and populare the grid
  var gridster = $('.gridster ul').gridster({
    widget_base_dimensions: [200, 200],
    widget_margins: [5, 5]
  }).data('gridster');

  var layouts = tvConfig.layouts;
  var serialization = layouts[tvConfig.id];
  if (layouts.current) {
    serialization = layouts.current;
  }

  $.each(serialization, function () {
    var widgetHTML = '<li class="styled" id="' + this.id + '"></li>';
    gridster.add_widget(widgetHTML, this.size_x, this.size_y, this.col, this.row);
    console.log('Widget %s, x %d, y %d, col %d, row %d', this.id, this.size_x, this.size_y, this.col, this.row);
  });

  gridster.disable();

  $.each(window.widgets, function (widgetId, widgetInfo) {
    if ($('#' + widgetId).length) {
      widgetInfo.load($('#' + widgetId));
    }
  });
};
