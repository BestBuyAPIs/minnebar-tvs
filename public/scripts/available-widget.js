'use strict';

window.widgets = {
  'gsw_hub_map': {
    name: 'Hub Map',
    load: function($el){
      $el.html('<img src="/maps/map_hub.jpg" style="width:100%">');
    }
  },
  'gsw_b1_map': {
    name: 'B1 Map',
    load: function($el){
      $el.html('<img src="/maps/map_b1.png" style="width:100%">');
    }
  },
  'gsw_session_list': {
    name: 'Session List',
    load: function($el){
      var getSession = function () {
        $.getJSON('/session-list.json', function (data) {
          var items = [];
          $.each( data, function( key, val ) {
            items.push( "<li id='" + key + "'>" + JSON.stringify(val) + "</li>" );
          });
          $el.html( "<ul>" + items.join( "" ) + "</ul>");
        });
      };
      getSession();
      setInterval(getSession, 30 * 1000);
    }
  },
  'gsw_recent_tweets': {
    name: 'Recent Tweets',
    load: function($el){
      var getTweets = function () {
        $.getJSON('/recent-tweets.json', function (data) {
          var items = [];
          $.each( data, function( key, val ) {
            items.push( "<li id='" + key + "'>" + JSON.stringify(val) + "</li>" );
          });
          $el.html( "<ul>" + items.join( "" ) + "</ul>");
        });
      };
      getTweets();
      setInterval(getTweets, 30 * 1000);
    }
  },
  'gsw_qr_codes': {
    name: 'QR Codes',
    load: function($el){
    }
  },
  'gsw_clock': {
    name: 'Clock',
    load: function($el){
      $el.fitText();
      setInterval(function update() {
        $el.html(moment().format('H:mm:ss'));
      });
    }
  }
};
