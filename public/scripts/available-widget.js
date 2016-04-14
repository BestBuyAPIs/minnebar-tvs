/* globals moment, window, nunjucks $ */
'use strict';

window.widgets = {
  'gsw_hub_map': {
    name: 'Hub Map',
    min_size: [2, 2],
    max_size: [3, 3],
    load: function ($el) {
      $el.css({background: '#929497'}).html('<img src="/maps/map_hub.svg" class="center" style="max-width:100%">');
    }
  },
  'gsw_b1_map': {
    name: 'B1 Map',
    min_size: [2, 2],
    max_size: [3, 3],
    load: function ($el) {
      $el.css({background: '#929497'}).html('<img src="/maps/map_b1.svg" class="center" style="max-width:100%;max-height:100%">');
    }
  },
  'gsw_session_list': {
    name: 'Session List',
    load: function ($el) {
      var sessionList = [];
      var templateLoaded = false;
      var currentDisplay = false;
      var displayInterval = 30;
      $el.html('<h2>Loading&hellip;</h2>');

      // Update session position once a minute
      var updateSessionView = function () {
        var newDisplay = (currentDisplay === 'now-block') ? 'next-block' : 'now-block';
        var newSessionLIs = [];
        var curTime = new Date();
        var curHour = parseInt(curTime.getHours() + '' + curTime.getMinutes(), 10);

        if (currentDisplay) {
          $('#' + currentDisplay).css({opacity: 0});
        }

        // Todo:
        // * How to handle start of day (breakfast)
        // * How to handle lunch
        // * How to handle happy hour
        // - Blocked by knowing what final version of session list looks like
        $.each(sessionList, function (i, session) {
          var push = false;
          if (newDisplay === 'now-block') {
            if (curHour >= session.start && curHour <= session.end) {
              push = true;
            }
          } else {
            // Next is just anything that hasn't yet started but starts within an hour
            if (curHour <= session.start && (curHour + 100) >= session.start) {
              push = true;
            }
          }
          if (push === true) {
            newSessionLIs.push('<tr><td>' + session.start_cosmetic + ' - ' + session.end_cosmetic + ' in ' + session.location +
              '<br><strong>' + session.name + '</strong></td></tr>');
          }
        });

        setTimeout(function () {
          if ($('#' + currentDisplay).length) {
            $('#' + currentDisplay).addClass('hide');
          }
          $('#' + newDisplay).removeClass('hide').css({opacity: 1}).find('table').html(newSessionLIs.join(''));
          currentDisplay = newDisplay;
        }, currentDisplay ? 1000 : 0);
      };
      setInterval(updateSessionView, displayInterval * 1000);

      // Get session data once every 5 minutes
      var getSession = function () {
        $.getJSON('/session-list.json', function (data) {
          sessionList = data;
          if (templateLoaded === false) {
            $el.html('<h2>Session Schedule</h2>' +
              '<div class="session-block" id="now-block"><h3>Now</h3><table class="table table-striped"></table></div>' +
              '<div class="session-block hide" id="next-block"><h3>Next</h3><table class="table table-striped"></table></div>');
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
        setTimeout(function () {
          $twitterBlock.html(nunjucks.renderString(twitterTemplate, currentTweet)).fitText(2.5).css({opacity: 1});

        }, 1000);
      };
      setInterval(tweetRotator, timePerTweet * 1000);

      // window.socket is defined in setup-tv.js
      window.socket.on('recent tweets', function (data) {
        recentTweets = data;
        tweetRotator();
      });

      return $twitterBlock.html('<p>Loading recent tweets&;</p>').fitText();
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
