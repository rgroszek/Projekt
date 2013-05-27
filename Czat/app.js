var express = require('express')
  , app = express()
  , http = require('http')
  , cookie = require('cookie')
  , connect = require('connect')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);


// Configure Express app with:
// * Cookie parser
// * Session manage
app.configure(function () {
    app.use(express.cookieParser());
    app.use(express.session({secret: 'secret', key: 'express.sid'}));
  });


app.get('/scripts/:url[.js]', function (req, res) {
    res.sendfile(__dirname + req.url);
});
app.get('/style/:url[.css]', function (req, res) {    
    res.sendfile(__dirname + req.url);
});
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

server.listen(1234, function() {
  console.log('Serwer wystartował na porcie 1234 !!!!!!!!!!!!!!!!!!!!!!!');
});
//AUTORYZACJA !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
io.set('authorization', function (handshakeData, accept) {
    // check if there's a cookie header
    if (handshakeData.headers.cookie) {
        // if there is, parse the cookie
        handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
        // the cookie value should be signed using the secret configured above (see line 17).
        // use the secret to to decrypt the actual session id.
      handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], 'secret');
      // if the session id matches the original value of the cookie, this means that
      // we failed to decrypt the value, and therefore it is a fake. 
        if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
          // reject the handshake
          return accept('Cookie is invalid.', false);
        }
    } else {
       // if there isn't, turn down the connection with a message
       // and leave the function.
       return accept('No cookie transmitted.', false);
    } 
    // accept the incoming connection
    accept(null, true);
}); 
//KONIEC AUTORYZACJI !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// nazwy uzytkownikow 
var usernames = {};
//pokoje
var rooms = ['lobby','dzienny','nocny'];

io.sockets.on('connection', function (socket) {

  socket.on('addroom', function(wartosc){
    rooms.push(wartosc);
    socket.emit('updaterooms', rooms, wartosc);
  });

  socket.on('zapros', function(zaproszony){
    //io.of('zaproszony').sockets[handshakeData.socketID].emit("ZAPRASZAMY DO STOŁU");
    console.log("zaproszono" + zaproszony + ".");
    console.log("session ID zaproszonego "+ zaproszony.socket.handshake.sessionID + ".");
    console.log("moje session ID"+ this.socket.handshake.sessionID + ".");
  });
  
  socket.on('adduser', function(username){
    socket.username = username;
    socket.room = 'lobby';
    usernames[username] = username;
    socket.join('lobby');
    socket.emit('updatechat', 'SERVER', 'dołączyłeś/aś.');
    socket.broadcast.to("lobby").emit('updatechat', 'SERVER', username + ' dołączył/a.');
    io.sockets.emit('updateusers', usernames);
    socket.emit('updaterooms', rooms, 'lobby');
  });

  socket.on('sendchat', function (data) {
    io.sockets.in(socket.room).emit('updatechat', socket.username, data);
  });

  socket.on('switchRoom', function(newroom){
    socket.leave(socket.room);
    socket.join(newroom);
    socket.emit('updatechat', 'SERVER', 'dolaczyles do '+ newroom);
    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' opuscil pokoj');
    socket.room = newroom;
    socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' dołączył/a do tego stołu');
    socket.emit('updaterooms', rooms, newroom);
  });

  socket.on('disconnect', function(){
    delete usernames[socket.username];
    io.sockets.emit('updateusers', usernames);
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' rozłączył/a się.');
    socket.leave(socket.room);
  });
});