// LOGS
var log4js = require('log4js');
log4js.configure('log_config.json');
var logger = log4js.getLogger('main-log');

var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

var Game = require('./game.js');

function filter_connections (a) {
  return a.filter(function (ws) {
    return ws.readyState == 1; // OPEN
  });
}

// WS
var connections = [];
app.ws('/ws', function(ws, req) {
  logger.info('New connection!');
  connections.push(ws);

  connections = filter_connections(connections);
  if (connections.length >= 2) {
    var game = Game.create(connections.shift(), connections.shift());
    game.start();
  }
});

// Static
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/img', express.static(__dirname + '/img'));

// Index
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Start
app.listen(process.env.PORT || 3000, function () {
  logger.info('Tic Tac Toe listening on port 3000!');
});
