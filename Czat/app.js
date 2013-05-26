var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

app.get('/scripts/:url[.js]', function (req, res) {
    res.sendfile(__dirname + req.url);
});
app.get('/style/:url[.css]', function (req, res) {    
    res.sendfile(__dirname + req.url);
});
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

server.listen(1234);
// nazwy uzytkownikow 
var usernames = {};
//pokoje
var rooms = ['lobby','dzienny','nocny'];

io.sockets.on('connection', function (socket) {

  socket.on('addroom', function(wartosc){
    rooms.push(wartosc);
    socket.emit('updaterooms', rooms, wartosc);
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