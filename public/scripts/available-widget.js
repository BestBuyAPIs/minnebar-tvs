/* globals moment, window $ */
'use strict';

window.widgets = {
  'gsw_hub_map': {
    name: 'Hub Map',
    load: function ($el) {
      $el.html('<img src="/maps/map_hub.jpg" style="width:100%">');
    }
  },
  'gsw_b1_map': {
    name: 'B1 Map',
    load: function ($el) {
      $el.html('<img src="/maps/map_b1.png" style="width:100%">');
    }
  },
  'gsw_session_list': {
    name: 'Session List',
    load: function ($el) {
      var sessionList = [];
      var templateLoaded = false;
      var currentDisplay = false;
      $el.html('<h2>Loading&hellip;</h2>');

      // Update session position once a minute
      var updateSessionView = function () {
        var newDisplay;
        var newSessionLIs = [];
        var curTime = new Date();
        var curHour = parseInt(curTime.getHours() + '' + curTime.getMinutes(), 10);
        var minHour;
        var maxHour;

        if (currentDisplay) {
          $('#' + currentDisplay).css({opacity: 0});
        }

        if (!currentDisplay || currentDisplay === 'then-block') {
          newDisplay = 'now-block';
        } else if (currentDisplay === 'now-block') {
          newDisplay = 'next-block';
        } else {
          newDisplay = 'then-block';
        }
        setTimeout(function(){
          if ($('#' + currentDisplay).length) {
            $('#' + currentDisplay).addClass('hide');
          }
          $('#' + newDisplay).removeClass('hide').css({opacity:1}).find('ul').html(newSessionLIs.join(''));
          currentDisplay = newDisplay;
        }, currentDisplay ? 1000 : 0);
      }
      setInterval(updateSessionView, 5 * 1000);

      // Get session data once every 5 minutes
      var getSession = function () {
        $.getJSON('/session-list.json', function (data) {
          sessionList = data;
          if (templateLoaded === false) {
            $el.html('<h2>Session Schedule</h2>' +
              '<div class="session-block" id="now-block"><h3>Now</h3><ul></ul></div>' +
              '<div class="session-block hide" id="next-block"><h3>Next</h3><ul></ul></div>' +
              '<div class="session-block hide" id="then-block"><h3>Then</h3><ul></ul></div>');
            templateLoaded = true;
            updateSessionView();
          }
        });
      };
      getSession();
      setInterval(getSession, 5 * 60 * 1000);
    }
  },
  'gsw_recent_tweets': {
    name: 'Recent Tweets',
    load: function ($el) {
      $el.html('<div class="twitter-tweet"></div>');
      var timePerTweet = 15;
      var $twitterBlock = $el.find('.twitter-tweet');
      var recentTweets = [];
      var currentTweetPosition = 0;
      var twitterTemplate = '<p>{{ text }} </p> — {{ user.name }} (@{{ user.screen_name }})<br>{{ time_ago }}';
      var tweetRotator = function () {
        if (recentTweets.length === 0) {
          $el.html('No tweets available for search terms.');
          return;
        }

        if (currentTweetPosition >= recentTweets.length) {
          currentTweetPosition = 0;
        }
        var currentTweet = recentTweets[currentTweetPosition];
        currentTweetPosition++;
        currentTweet.time_ago = moment(currentTweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').fromNow();
        $twitterBlock.css({opacity: 0});
        setTimeout(function(){
          $twitterBlock.html(nunjucks.renderString(twitterTemplate, currentTweet)).fitText(2.5).css({opacity: 1});
        }, 1000);
      };
      setInterval(tweetRotator, timePerTweet * 1000);

      // window.socket is defined in setup-tv.js
      window.socket.on('recent tweets', function (data) {
        recentTweets = data;
        tweetRotator();
      });

      return $twitterBlock.html('<p>Loading recent tweets&hellip;</p>').fitText();
    }
  },
  'gsw_qr_codes': {
    name: 'QR Codes',
    load: function ($el) {
      $el.html('<img src="/images/qr.png" style="max-width:100%;max-height:100%">');
    }
  },
  'gsw_clock': {
    name: 'Clock',
    load: function ($el) {
      $el.fitText();
      setInterval(function update () {
        $el.html(moment().format('H:mm:ss'));
      });
    }
  }
};
