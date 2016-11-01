function Player (ws, type, game, active) {
  this.ws = ws;
  this.type = type;
  this.active = !!active;
  this.game = game;
}

Player.prototype.toggle = function () {
  this.active = !this.active;
}

Player.prototype.send = function (message) {
  try {
    this.ws.send(message);
  } catch(e) {}
}

Player.prototype.close = function (result) {
  this.send(JSON.stringify({
    event: 'over',
    result: result
  }));

  try {
    this.ws.close();
  } catch(e) {}
}

Player.prototype.move = function (t, x, y) {
  this.send(JSON.stringify({
    event: 'move',
    type: t,
    x: x,
    y: y
  }));
}
Player.prototype.start = function () {
  this.send(JSON.stringify({
    event: 'start',
    type: this.type
  }));

  var self = this;
  this.ws.on('message', function (msg) {
    if (self.active) {
      var
        message = JSON.parse(msg),
        x = message.x,
        y = message.y;
      self.game.move(self.type, x, y);
    }
  });
  this.ws.on('close', function (msg) {
    self.game.playerLeave(self);
  });
  this.ws.on('error', function (msg) {
    self.game.playerLeave(self);
  });
}

function Game() {
  this.players = [];
  this.moves = 0;
  // GRID 3 x 3
  this.grid = Array.apply(null, new Array(3)).map(function () {
    return Array.apply(null, new Array(3)).map(function () {
      return null;
    });
  });
}

Game.prototype.addPlayers = function (p) {
  this.players = this.players.concat(p);
}

Game.prototype.start = function () {
  for (var i = 0; i < this.players.length; i++) {
    this.players[i].start();
  }
}

Game.prototype.playerLeave = function (player) {
  this.close("leave");
}

Game.prototype.close = function (result) {
  for (var i = 0; i < this.players.length; i++) {
    this.players[i].close(result);
  }
}

Game.prototype.check = function () {
  var result = null;
  if (this.moves == 9) {
    result = "even";
  }

  for (var i = 0; i < 3; i++) {
    if (this.grid[i][0] != null && this.grid[i][0] == this.grid[i][1] && this.grid[i][0] == this.grid[i][2]) {
      result = this.grid[i][0];
      break;
    }
    if (this.grid[0][i] != null && this.grid[0][i] == this.grid[1][i] && this.grid[0][i] == this.grid[2][i]) {
      result = this.grid[0][i];
      break;
    }
  }

  if (!result && this.grid[0][0] != null && this.grid[0][0] == this.grid[1][1] && this.grid[0][0] == this.grid[2][2]) {
    result = this.grid[1][1];
  }

  if (!result && this.grid[2][0] != null && this.grid[2][0] == this.grid[1][1] && this.grid[2][0] == this.grid[0][2]) {
    result = this.grid[1][1];
  }

  if (result) {
    this.close(result)
  }
}

Game.prototype.move = function (t, x, y) {
  if (this.grid[x][y] == null) {
    this.grid[x][y] = t;
    this.moves++;

    for (var i = 0; i < this.players.length; i++) {
      this.players[i].move(t, x, y);
      this.players[i].toggle();
    }
    this.check();
  }
}

function create(ws1, ws2) {
  var game = new Game();
  game.addPlayers([new Player(ws1, "cross", game, true), new Player(ws2, "circle", game)]);
  return game;
}

module.exports.create = create;
