/* globals moment, window, nunjucks $ */
'use strict';

var fontSizeAdjuster = function ($el, maxHeight, maxWidth) {
  var baseFont = 8;
  for (var i = 0; i < 200; i += 4) {
    $el.css({fontSize: baseFont + i});
    if ($el.height() > maxHeight || $el.width() > maxWidth) {
      $el.css({fontSize: baseFont + i - 4});
      break;
    }
  }
};

// I'm sure there's a way to do this with just CSS, but I couldn't find it.
var imageSizeAdjuster = function ($el, ratio, maxHeight, maxWidth) {
  var baseSize = 8;
  var incAmount = 10;
  for (var i = 0; i < 2000; i += incAmount) {
    $el.find('img').css({height: Math.floor(ratio * (baseSize + i)), width: baseSize + i});
    if ($el.height() > maxHeight || $el.width() > maxWidth) {
      $el.find('img').css({height: Math.floor(ratio * (baseSize + i - incAmount)), width: baseSize + i - incAmount});
      break;
    }
  }
};

window.widgets = {
  'gsw_hub_map': {
    name: 'Hub Map',
    min_size: [2, 2],
    max_size: [8, 8],
    load: function ($el, tvId) {
      var mapSrc = '/maps/map_hub.svg';
      if (tvId <= 5) {
        mapSrc = '/maps/map_hub_' + tvId + '.svg';
      }
      $el.css({background: '#929497'}).html('<div class="center-map"><img src="' + mapSrc + '"></div>');
      imageSizeAdjuster($el.find('div'), .8, $el.height(), $el.width());
    }
  },
  'gsw_b1_map': {
    name: 'B1 Map',
    min_size: [2, 2],
    max_size: [4, 8],
    load: function ($el, tvId) {
      var mapSrc = '/maps/map_b1.svg';
      if (tvId >= 6) {
        mapSrc = '/maps/map_b1_' + tvId + '.svg';
      }
      $el.css({background: '#929497'}).html('<div class="center-map"><img src="' + mapSrc + '"></div>');
      imageSizeAdjuster($el.find('div'), 2, $el.height(), $el.width());
    }
  },
  'gsw_session_list': {
    name: 'Session List',
    load: function ($el) {
      var mockTime = false; //'Sat Apr 23 2016 16:35:00 GMT-0500 (CDT)';
      var sessionLength = 54;
      var sessionList = [];
      var templateLoaded = false;
      var currentDisplay = false;
      var displayInterval = 30;
      $el.html('<div class="session-block">' +
        '<h5>Session Schedule - <span class="session-timing">Loading</span></h5>' +
        '<table class="table table-striped">' +
        '<tbody></tbody></table></div>');
      var listHeight = $el.height() - $el.find('.session-block').height(); // Exclude the H5
      var listWidth = $el.width();

      // Update session position once a minute
      var updateSessionView = function () {
        var newDisplay = (currentDisplay === 'Now') ? 'Next' : 'Now';
        var displayMode = 'showSessions';
        var newSessionLIs = [];
        var curTime = mockTime ? new Date(mockTime) : new Date();
        if (newDisplay === 'Next') {
          curTime.setMinutes(curTime.getMinutes() + sessionLength + 1);
        }
        var curTimeNumber = (curTime.getHours() * 100) + curTime.getMinutes();

        // Lunch: 12:35 -  1:45
        // Beer Me!: 4:35 -  7:00
        if (curTimeNumber >= 1635) {
          displayMode = 'showHappyHour';
        } else if (curTimeNumber >= 1235 && curTimeNumber < 1345) {
          displayMode = 'showLunch';
        }

        if (currentDisplay) {
          $('.session-block table').css({opacity: 0});
        }

        // If the day hasn't started, put us in "Next" mode for the first session
        if (curTime.getHours() < 9) {
          curTimeNumber = 901;
          newDisplay = 'Next';
        }

        if (displayMode === 'showHappyHour') {
            newSessionLIs.push('<tr><td><strong>Beer Me!</strong> at Sandy\'s</td></tr>');
        } else if (displayMode === 'showLunch') {
            newSessionLIs.push('<tr><td><strong>Lunch from 12:35 until 1:45</strong> at Sandy\'s</td></tr>');
        } else {
          $.each(sessionList, function (i, session) {
            var startTime = new Date(session.starts_at);
            if (!startTime) {
              return;
            }
            var startTimeNumber = (startTime.getHours() * 100) + startTime.getMinutes();
            var endTime = new Date(startTime.getTime() + (sessionLength * 60 * 1000));
            var endTimeNumber = (endTime.getHours() * 100) + endTime.getMinutes();

            if (startTimeNumber <= curTimeNumber && curTimeNumber <= endTimeNumber) {
              newSessionLIs.push('<tr><td>' + 'In ' + session.room_name + ' at ' + moment(startTime).format('h:mma') +
                ' - <strong>' + session.session_title + '</strong></td></tr>');
            }
          });
        }

        if (false && newSessionLIs.length === 0 && $('body').hasClass('development')) {
          $.each(sessionList, function (i, session) {
            if (newSessionLIs.length < 10) {
              var startTime = new Date(session.starts_at);
              newSessionLIs.push('<tr><td>' + 'In <u>' + session.room_name + '</u> ' + moment(startTime).format('h:mma') +
                ' - <strong>' + session.session_title + '</strong></td></tr>');
            }
          });
        }

        setTimeout(function () {
          if (newSessionLIs.length === 0) {
            newSessionLIs.push('<tr><td>No sessions found. Is the day over?</td></tr>');
          }
          $('.session-block .session-timing').text(newDisplay);
          $('.session-block').find('tbody').html(newSessionLIs.join(''));
          $('.session-block table').css({opacity: 1});
          fontSizeAdjuster($('.session-block').find('tbody'), listHeight, listWidth);

          currentDisplay = newDisplay;
        }, currentDisplay ? 1000 : 0);
      };

      // Get session data once every 5 minutes
      var getSession = function () {
        $.getJSON('/session-list.json', function (data) {
          sessionList = data;
          if (templateLoaded === false) {
            templateLoaded = true;
            setInterval(updateSessionView, displayInterval * 1000);
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
      var initialDimensions = {
        top: { width: 0, height: 0 },
        middle: { width: 0, height: 0 },
        bottom: { width: 0, height: 0 }
      };
      var intervalTracker = false;

      $el.addClass('twitter-block').html(
        '<div class="tweet-top"><span></span></div>' +
        '<div class="tweet-middle"><span></span></div>' +
        '<div class="tweet-bottom"><span></span></div>');

      var $topTweet = $el.find('.tweet-top span');
      initialDimensions.top.height = $el.find('.tweet-top').height();
      initialDimensions.top.width = $el.find('.tweet-top').width();
      $topTweet.html('Tweets including <strong>#minnebar</strong>');
      fontSizeAdjuster($topTweet, initialDimensions.top.height, initialDimensions.top.width);

      var $bottomTweet = $el.find('.tweet-bottom span');
      initialDimensions.bottom.height = $el.find('.tweet-bottom').height();
      initialDimensions.bottom.width = $el.find('.tweet-bottom').width();
      $bottomTweet.html('Loading recent tweets&hellip;');
      fontSizeAdjuster($bottomTweet, initialDimensions.bottom.height, initialDimensions.bottom.width);

      var $middleTweet = $el.find('.tweet-middle span');
      initialDimensions.middle.height = $el.find('.tweet-middle').height();
      initialDimensions.middle.width = $el.find('.tweet-middle').width();
      var timePerTweet = 15;
      var recentTweets = [];
      var currentTweetPosition = 0;
      var middleTwitterTemplate = '{{ text | safe }}';
      var bottomTwitterTemplate = '{{ user.name }} (@{{ user.screen_name }}) - {{ time_ago }}';
      var tweetRotator = function () {
        if (recentTweets.length === 0) {
          $middleTweet.text('No tweets available for search terms.');
          fontSizeAdjuster($middleTweet, initialDimensions.middle.height, initialDimensions.middle.width);
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
          fontSizeAdjuster($middleTweet, initialDimensions.middle.height, initialDimensions.middle.width);
          fontSizeAdjuster($bottomTweet, initialDimensions.bottom.height, initialDimensions.bottom.width);
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
      $el.html('<div style="text-align:center"><img src="/images/minnebar-logo.png"><img src="/images/ios-code.png"><img src="/images/android-code.png"></div>');
      imageSizeAdjuster($el.find('div'), 1, $el.height(), $el.width());
    }
  },
  'gsw_clock': {
    name: 'Clock',
    load: function ($el) {
      $el.html('<div class="clock-block"><span>00:00pm</span></div>');
      var $clockBlock = $el.find('.clock-block span');

      fontSizeAdjuster($clockBlock, $el.height(), $el.width());

      $clockBlock.text(moment().format('h:mma'));
      setInterval(function update () {
        $clockBlock.text(moment().format('h:mma'));
      }, 5 * 1000);
    }
  }
};
