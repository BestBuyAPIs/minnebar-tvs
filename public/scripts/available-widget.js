/* globals moment, window, nunjucks $ */
'use strict';

var fontSizeAdjuster = function ($el, maxHeight) {
  var baseFont = 8;
  for (var i = 0; i < 200; i += 4) {
    $el.css({fontSize: baseFont + i});
    if ($el.height() > maxHeight) {
      $el.css({fontSize: baseFont + i - 4});
      console.log('Setting size to %d for block with text %s', baseFont, $el.text());
      break;
    }
  }
};

window.widgets = {
  'gsw_hub_map': {
    name: 'Hub Map',
    min_size: [2, 2],
    max_size: [5, 5],
    load: function ($el) {
      $el.css({background: '#929497'}).html('<img src="/maps/map_hub.svg" class="center" style="max-width:100%;max-height:100%">');
    }
  },
  'gsw_b1_map': {
    name: 'B1 Map',
    min_size: [2, 2],
    max_size: [5, 5],
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
      var initialHeight = { top: 0, middle: 0, bottom: 0 };
      var intervalTracker = false;

      $el.addClass('twitter-block').html(
        '<div class="tweet-top"><span></span></div>' +
        '<div class="tweet-middle"><span></span></div>' +
        '<div class="tweet-bottom"><span></span></div>');

      var $topTweet = $el.find('.tweet-top span');
      initialHeight.top = $el.find('.tweet-top').height();
      $topTweet.html('Tweets including <strong>#minnebar</strong>');
      fontSizeAdjuster($topTweet, initialHeight.top);

      var $bottomTweet = $el.find('.tweet-bottom span');
      initialHeight.bottom = $el.find('.tweet-bottom').height();
      $bottomTweet.html('Loading recent tweets&hellip;');
      fontSizeAdjuster($bottomTweet, initialHeight.bottom);

      var $middleTweet = $el.find('.tweet-middle span');
      initialHeight.middle = $el.find('.tweet-middle').height();
      var timePerTweet = 15;
      var recentTweets = [];
      var currentTweetPosition = 0;
      var middleTwitterTemplate = '{{ text | safe }}';
      var bottomTwitterTemplate = '{{ user.name }} (@{{ user.screen_name }}) - {{ time_ago }}';
      var tweetRotator = function () {
        if (recentTweets.length === 0) {
          $middleTweet.text('No tweets available for search terms.');
          fontSizeAdjuster($middleTweet, initialHeight.middle);
          $bottomTweet.text('');
          return;
        }

        $el.find('.tweet-bottom, .tweet-middle').css({opacity: 0});

        if (currentTweetPosition >= recentTweets.length) {
          currentTweetPosition = 0;
        }
        var currentTweet = recentTweets[currentTweetPosition];
        currentTweetPosition++;
        currentTweet.time_ago = moment(currentTweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').fromNow();
        setTimeout(function () {
          var htmlText = nunjucks.renderString(middleTwitterTemplate, currentTweet);
          htmlText = htmlText.replace('#minnebar', '<span class="tweet-highlight">#minnebar</span>');
          $middleTweet.html(htmlText);
          $bottomTweet.html(nunjucks.renderString(bottomTwitterTemplate, currentTweet));
          fontSizeAdjuster($middleTweet, initialHeight.middle);
          $el.find('.tweet-bottom, .tweet-middle').css({opacity: 1});
        }, 1000);
      };

      // window.socket is defined in setup-tv.js
      window.socket.on('recent tweets', function (data) {
        recentTweets = data;
        // Let the system rotate on schedule if timer is already present
        if (intervalTracker === false) {
          intervalTracker = setInterval(tweetRotator, timePerTweet * 1000);
          tweetRotator();
        }
      });
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
      $el.html('<div class="clock-block"><span>00:00pm</span></div>');
      var $clockBlock = $el.find('.clock-block span');

      fontSizeAdjuster($clockBlock, $el.height());

      $clockBlock.text(moment().format('H:mma'));
      setInterval(function update () {
        $clockBlock.text(moment().format('H:mma'));
      }, 5 * 1000);
    }
  }
};
