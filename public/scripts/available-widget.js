'use strict';

window.widgets = {
  'gsw_hub_map': {
    name: 'Hub Map',
    load: function(){
    }
  },
  'gsw_b1_map': {
    name: 'B1 Map',
    load: function(){
    }
  },
  'gsw_session_list': {
    name: 'Session List',
    load: function(){
    }
  },
  'gsw_recent_tweets': {
    name: 'Recent Tweets',
    load: function(){
    }
  },
  'gsw_qr_codes': {
    name: 'QR Codes',
    load: function(){
    }
  },
  'gsw_clock': {
    name: 'Clock',
    load: function(){
      $('#gsw_clock').fitText(1.3);
      setInterval(function update() {
        $('#gsw_clock').html(moment().format('D. MMMM YYYY H:mm:ss'));
      });
    }
  }
};
