/* globals $, window, io */
'use strict';

$.urlParam = function (name) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results == null) {
    return null;
  } else {
    return results[1] || 0;
  }
};

window.setupTVControl = function (tvConfig) {
  window.socket = io();

  window.socket.on('message', function (data) {
    $.notify(data.text, data.type);
  });

  function updateLayout () {
    var update = {
      id: tvConfig.id,
      layout: gridster.serialize(),
      code: $.urlParam('code'),
      admin: $.urlParam('admin')
    };
    window.socket.emit('update layout', update);
  }

  $.notify.addStyle('reloadbutton', {
    html: '<div>\n<span data-notify-text></span><br/><button class="reload">Reload</button></div>',
    classes: {
      base: {
        'font-weight': 'bold',
        'padding': '8px 15px 8px 14px',
        'text-shadow': '0 1px 0 rgba(255, 255, 255, 0.5)',
        'background-color': '#fcf8e3',
        'border': '1px solid #fbeed5',
        'border-radius': '4px',
        'white-space': 'nowrap',
        'padding-left': '25px',
        'background-repeat': 'no-repeat',
        'background-position': '3px 7px'
      }
    }
  });

  var isReloadShowing = false;

  // listen for click events from this style
  $(document).on('click', '.notifyjs-reloadbutton-base .reload', function () {
    // programmatically trigger propogating hide event
    window.location.reload(false);
  });

  window.socket.on('layout updated', function (data) {
    if (!isReloadShowing && data.id === tvConfig.id) {
      isReloadShowing = true;
      $.notify('Someone has modified the layout!', {
        style: 'reloadbutton',
        autoHide: false,
        clickToHide: false
      });
    }
  });

  var gridster = $('.gridster ul').gridster({
    widget_base_dimensions: [55, 55],
    widget_margins: [5, 5],
    max_cols: tvConfig.max_cols,
    min_cols: tvConfig.min_cols,
    draggable: {
      stop: updateLayout
    },
    resize: {
      stop: updateLayout,
      enabled: true
    },
    serialize_params: function ($w, wgd) {
      return {
        id: $w.prop('id'),
        col: wgd.col,
        row: wgd.row,
        size_x: wgd.size_x,
        size_y: wgd.size_y
      };
    }
  }).data('gridster');

  $.each(window.widgets, function (widgetId, widgetInfo) {
    var widgetEl = $('<li class="list-inline-item"><label><input type="checkbox" value="checked" id="' + widgetId + '-checkbox">' + widgetInfo.name + '</label></li>');
    widgetEl.on('change', function () {
      var isActive = $(this).find(':checked').length;
      if (isActive) {
        var size_x = widgetInfo.min_size ? widgetInfo.min_size[0] : 1;
        var size_y = widgetInfo.min_size ? widgetInfo.min_size[1] : 1;
        gridster.add_widget('<li id="' + widgetId + '">' + $(this).text() + '</li>', size_x, size_y);
        if (widgetInfo.min_size) gridster.set_widget_min_size($('#' + widgetId), widgetInfo.min_size);
        if (widgetInfo.max_size) gridster.set_widget_max_size($('#' + widgetId), widgetInfo.max_size);
      } else {
        gridster.remove_widget($('#' + widgetId));
      }
      updateLayout();
    });
    $('#widget-toggles').append(widgetEl);
  });

  // serialization = Gridster.sort_by_row_and_col_asc(serialization);

  var layouts = tvConfig.layouts;

  $(function () {
    var layoutType = 'current';
    var serialization = layouts[tvConfig.id];
    if (layoutType === 'current' && layouts.current) {
      serialization = layouts.current;
    }
    gridster.remove_all_widgets();

    $('#widget-toggles input').prop('checked', false);
    $.each(serialization, function () {
      var widgetInfo = window.widgets[this.id];
      if (!widgetInfo) return;
      var widgetHTML = '<li id="' + this.id + '">' + widgetInfo.name + '</li>';
      gridster.add_widget(widgetHTML, this.size_x, this.size_y, this.col, this.row);
      $('#' + this.id + '-checkbox').prop('checked', true);

      if (widgetInfo.min_size) gridster.set_widget_min_size($('#' + this.id), widgetInfo.min_size);
      if (widgetInfo.max_size) gridster.set_widget_max_size($('#' + this.id), widgetInfo.max_size);
    });
  });
};
