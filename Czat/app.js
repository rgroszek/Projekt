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
function Encrypt(dane){
  var actual = dane;
  var key = 10; //Any integer value
  var result = "";
  for(i=0; i<actual.length;i++){
    result += String.fromCharCode(key^actual.charCodeAt(i));
  }
  //alert(result);
  return result;
}
function Decrypt(dane){
  var actual= dane;
  var key = 10; //Any integer value
  var result="";    
  for(i=0; i<actual.length; i++){
    result += String.fromCharCode(key^actual.charCodeAt(i));
  }
  return result;
}
// nazwy uzytkownikow 
var usernames = {};
//pokoje
var rooms = ['lobby','dzienny','nocny'];

io.sockets.on('connection', function (socket) {

  socket.on('addroom', function(wartosc){
    rooms.push(wartosc);
    socket.username = username;
    socket.emit('updaterooms', rooms, wartosc, username);
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
    socket.emit('updatechat', 'SERVER', Encrypt(' dołączyłeś/aś.'));
    socket.broadcast.to("lobby").emit('updatechat', 'SERVER', Encrypt(username) + Encrypt(' dołączył/a.'));
    io.sockets.emit('updateusers', usernames);
    socket.emit('updaterooms', rooms, 'lobby', username);
  });

  socket.on('sendchat', function (data) {
    io.sockets.in(socket.room).emit('updatechat', socket.username, data);
  });

  socket.on('switchRoom', function(newroom){
    socket.leave(socket.room);
    socket.join(newroom);
    socket.emit('updatechat', 'SERVER', Encrypt('dolaczyles do ')+ Encrypt(newroom));
    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', Encrypt(socket.username) + Encrypt(' opuscil pokoj'));
    socket.room = newroom;
    socket.broadcast.to(newroom).emit('updatechat', 'SERVER', Encrypt(socket.username)+Encrypt(' dołączył/a do tego stołu'));
    socket.emit('updaterooms', rooms, newroom, socket.username);
  });

  socket.on('disconnect', function(){
    io.sockets.emit('updateusers', usernames);
    socket.broadcast.emit('updatechat', 'SERVER', Encrypt(socket.username) + Encrypt(' rozłączył/a się.'));
    socket.leave(socket.room);
    delete usernames[socket.username];
  });
});