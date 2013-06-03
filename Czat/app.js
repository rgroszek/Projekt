var express = require('express')
  , app = express()
  , httpapp = express()
  , fs = require("fs")
  , klucz_prywatny = fs.readFileSync("privatekey.pem").toString()
  , certyfikat = fs.readFileSync("certificate.pem").toString()
  , opcjeHTTPS = { key: klucz_prywatny, cert: certyfikat, requestCert: true}
  //, http = require('http')
  //, https = require('https')
  , cookie = require('cookie')
  , connect = require('connect')
  //, server = http.createServer(app)
  //, io = require('socket.io').listen(httpss);
  , http = require('http').createServer(httpapp)
  , server = require('https').createServer(opcjeHTTPS, app)  
  , io = require('socket.io').listen(server);

httpapp.get('*',function(req,res){  
    res.redirect('https://localhost:1234'+req.url)
})

server.listen(1234);
http.listen(12345);

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

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! HTTPS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
/*
var httpss = https.createServer(opcjeHTTPS, app).listen(1234, function () {
console.log("Serwer nasłuchuje na szyfrowanym porcie 1234");
});


app.get('*',function(req,res){  
    res.redirect('https://localhost:1234'+req.url)
})
*/
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! HTTPS  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//server.listen(1234, function() {
  //console.log('Serwer wystartował na porcie 1234 !!!!!!!!!!!!!!!!!!!!!!!');
//});
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
/*
function Encrypt(dane){
  var actual = dane;
  var key = 100; //Any integer value
  var result = "";
  for(i=0; i<actual.length;i++){
    result += String.fromCharCode(key^actual.charCodeAt(i));
  }
  //alert(result);
  return result;
}

function Decrypt(dane){
  var actual= dane;
  var key = 100; //Any integer value
  var result="";    
  for(i=0; i<actual.length; i++){
    result += String.fromCharCode(key^actual.charCodeAt(i));
  }
  return result;
}
*/
// nazwy uzytkownikow 
var usernames = {};
//pokoje
var rooms = ['lobby','dzienny','nocny'];

io.sockets.on('connection', function (socket) {

  socket.on('addroom', function(wartosc, username){
    rooms.push(wartosc);
    //socket.username = username;
    //socket.emit('updaterooms', rooms, wartosc, username);
    socket.emit('updaterooms', rooms, wartosc, username);
  });

  socket.on('zapros', function(zaproszony){
    // socket = io.listen(port_number);
    var ID_zaproszonego = usernames[zaproszony+"ID"];
    //server.sockets.socket(ID_zaproszonego).emit("ZAPRASZAMY",ID_zaproszonego);
      //io.of(zaproszony).sockets[ID_zaproszonego].emit('updatechat', socket.username, " zaprasza do swojego stołu.");
    //io.clients[ID_zaproszonego].send('updatechat', "!!!!!!", " zaprasza do swojego stołu.");
    io.sockets.socket(ID_zaproszonego).emit('updatechat', socket.username , " zaprasza Cię do pokoju: " + socket.room);
    //console.log("zaproszono" + zaproszony + ".");
    //console.log("session ID zaproszonego "+ usernames[zaproszony+"ID"] + ".");
    //console.log("moje session ID"+ this.socket.handshake.sessionID + ".");
  });
  
  socket.on('adduser', function(username){
      for(var i=0;i<usernames.length;++i)
      {
        if(usernames[i] == username){
          console.log("JUŻ INSTNIEJE!!!!!!!!!!!!!!!!!!");
        }
        else{
          console.log("GIT");
        }
      }
      socket.username = username;
      clientid = socket.id;
      socket.room = 'lobby';
      usernames[username] = username;
      usernames[username+"ID"] = clientid;
      //console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" + usernames+ "!!!!!!!!!!!!!!!!!!!!!!!");
      socket.join('lobby');
      socket.emit('updatechat', 'SERVER', ' dołączyłeś/aś. Twoje ID: '+ clientid );
      socket.broadcast.to("lobby").emit('updatechat', 'SERVER', username + ' dołączył/a.');
      io.sockets.emit('updateusers', usernames);
      socket.emit('updaterooms', rooms, 'lobby', username);
  });

  socket.on('sendchat', function (data) {
    io.sockets.in(socket.room).emit('updatechat', socket.username, data);
  });

  socket.on('switchRoom', function(newroom){
    socket.leave(socket.room);
    socket.join(newroom);
    socket.emit('updatechat', 'SERVER', 'dolaczyles do '+ newroom);
    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' opuscil pokoj');
    socket.room = newroom;
    socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' dołączył/a do tego stołu');
    socket.emit('updaterooms', rooms, newroom, socket.username);
  });

  socket.on('disconnect', function(){
    io.sockets.emit('updateusers', usernames);
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' rozłączył/a się.');
    socket.leave(socket.room);
    delete usernames[socket.username];
  });
});