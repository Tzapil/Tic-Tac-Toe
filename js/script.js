function move(t, x, y) {
  $('.grid-cell[data-x=' + x + '][data-y=' + y + ']').append($('<div class="' + t + '">'));
}

var socket = null
function start_search () {
  // clear grid
  $('.cross, .circle').remove();
  // show waiting message
  $('.waiting').show();
  $('.message').hide();

  socket = new WebSocket("ws://" + window.location.host + "/ws");

  var type = "cross";
  socket.onmessage = function(event) {
    var message = JSON.parse(event.data);
    switch(message.event) {
      case 'move':
        move(message.type, message.x, message.y);
        $('.message').html("Player: " +
          '<span class="' + type + ' inline""></span>' +
          ". " +
          (message.type != type ? "You'r turn!" : "Opponents turn!"));
        break;
      case 'start':
        type = message.type;
        $('.waiting').hide();
        $('.message').html("Player: " +
        '<span class="' + type + ' inline"></span>' +
        ". " + (type == "cross" ? "You'r turn!" : "Opponents turn!")).show();
        break;
      case 'over':
        var msg = "You Win!";
        switch (message.result) {
          case "leave":
            msg = "You'r opponent leave! You Win this game!";
            break;
          case "even":
            msg = "Ties!";
            break;
          default:
            if (message.result != type) {
              msg = "You lose! Better luck next time!";
            }
        }

        BootstrapDialog.show({
          title: 'Game over',
          titleClass: 'center-block',
          message: msg,
          type: BootstrapDialog.TYPE_SUCCESS,
          onhidden: function () {
            start_search();
          },
          buttons: [{
            label: 'Close',
            cssClass: 'btn-primary center-block',
            action: function(dialog) {
              dialog.close();
            }
          }]
        });
        break;
    }
  };

  socket.onerror = function(error) {
    start_search();
  };
}

$(function () {
  start_search();

  $('.grid').click(function (e) {
    // OPEN == 1
    if (socket && socket.readyState == 1) {
      var
        x = $(e.target).attr('data-x'),
        y = $(e.target).attr('data-y');

      if (x && y) {
        socket.send(JSON.stringify({x: x, y: y}));
      }
    }
  })
})
