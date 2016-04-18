'use strict';
require('dotenv').config();

var pkg = require('./package');
var express = require('express');
var session = require('express-session');
var flash = require('connect-flash');
var nunjucks = require('nunjucks');

var bodyParser = require('body-parser');
var logger = require('./lib/logger');
var fetchTweets = require('./lib/fetch-tweets');
var updateLayout = require('./lib/update_layout');

// Required early on see we can just shut it all down if there's
// no Twitter connection
require('./twitter/');

process.on('uncaughtException', function (err) {
  if (process.env.NODE_ENV === 'production') {
    console.log(err);
  } else {
    throw err;
  }
});

var app = express();
var port = process.env.PORT || 3000;

var http = require('http').Server(app);
app.io = require('socket.io')(http);
app.io.on('connection', function (socket) {
  // when a new client connects, immediately push tweets to them
  pushTweets(socket);

  if (process.env.NODE_ENV !== 'production') {
    socket.emit('message', {text: 'Websocket successfully connnected!', type: 'info'});
  }

  console.log('Connection received. Total connections: ', app.io.engine.clientsCount);

  socket.on('update layout', (data) => {
    updateLayout(data, (err) => {
      if (err) return socket.emit('message', err);
      socket.broadcast.emit('layout updated', data);
    });
  });
});

// push tweets to clients every 30 seconds
function pushTweets (dest) {
  if (app.io.engine.clientsCount > 0) {
    fetchTweets(function (err, data) {
      if (err) return;
      var ioTarget = dest || app.io;
      ioTarget.emit('recent tweets', data);
    });
  }
}
setInterval(pushTweets, 30 * 1000);

app.set('views', __dirname + '/views');
nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: (process.env.NODE_ENV !== 'production')
});
app.set('view engine', 'html');

app.use(session({
  secret: 'secret',
  cookie: { maxAge: 60000 },
  resave: true,
  saveUninitialized: true
}));
app.use(flash());

app.use('/robots.txt', express.static('public/robots.txt'));
app.use('/favicon.ico', express.static('public/favicon.ico'));
app.use('/scripts/jquery/', express.static('node_modules/jquery/dist'));
app.use('/scripts/lodash/', express.static('node_modules/lodash'));
app.use('/scripts/notifyjs/', express.static('node_modules/notifyjs-browser/dist'));
app.use('/scripts/moment/', express.static('node_modules/moment'));
app.use('/scripts/nunjucks/', express.static('node_modules/nunjucks/browser'));
app.use('/scripts/socket.io/', express.static('node_modules/socket.io-client'));
app.use(express.static('public'));

app.use(function (req, res, next) {
  res.locals.success_messages = req.flash('success');
  res.locals.error_messages = req.flash('error');
  next();
});

app.use(function (req, res, next) {
  req.log = function (type, message, meta) {
    if (typeof meta !== 'object') {
      meta = {};
    }
    meta.method = req.method;
    meta.url = req.originalUrl;
    meta.ip = req.ip;
    if (typeof logger[type] !== 'undefined') {
      logger[type](message, meta);
    } else {
      logger.error('Failed attempt to invoke logger with type "' + type + '"');
      logger.info(message, meta);
    }
  };
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(require('morgan')('combined', { 'stream': logger.stream }));
app.use(require('./controllers'));

app.use(function (err, req, res, next) {
  // jshint unused:false
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(function (req, res, next) {
  // jshint unused:false
  res.status(404).send('Sorry cant find that!');
});

http.listen(port, function () {
  console.log('Started %s. Listening on port %d', pkg.name, port);
});
