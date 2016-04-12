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

window.setupGridster = function (tvConfig) {
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


  var gridster = $('.gridster ul').gridster({
    widget_base_dimensions: [100, 55],
    widget_margins: [5, 5],
    max_cols: tvConfig.max_cols,
    min_cols: tvConfig.min_cols,
    min_rows: 8,
    helper: 'clone',
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

  $.each(window.widgets, function (widgetId, widget) {
    var widgetEl = $('<li class="list-inline-item"><label><input type="checkbox" value="checked" id="' + widgetId + '-checkbox">' + widget.name + '</label></li>');
    widgetEl.on('change', function () {
      var isActive = $(this).find(':checked').length;
      if (isActive) {
        gridster.add_widget('<li id="' + widgetId + '">' + $(this).text() + '</li>');
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
    $('.js-seralize').on('click', function () {
      var layoutType = $(this).data('layout');
      var serialization = layouts[tvConfig.id];
      if (layoutType === 'current' && layouts.current) {
        serialization = layouts.current;
      }
      gridster.remove_all_widgets();

      $('#widget-toggles input').prop('checked', false);
      $.each(serialization, function () {
        var widgetHTML = '<li id="' + this.id + '">' + window.widgets[this.id].name + '</li>';
        gridster.add_widget(widgetHTML, this.size_x, this.size_y, this.col, this.row);
        $('#' + this.id + '-checkbox').prop('checked', true);
      });
      updateLayout();
    });
    $('#load-current-layout').trigger('click');
  });
};
