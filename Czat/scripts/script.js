  var socket = io.connect('https://localhost:1234', {secure: true});

  var emotikonki = {
    smile1: ':-)',
    smile2: ':)',
    sad1: ':-(',
    sad2: ':(',
    wink1: ';-)',
    wink2: ';)',
    scared1: ':-o',
    scared2: ':o'    
  };

  function oknoPrompt() {
    var nick = prompt('Podaj swój nick:', 'Anonim');
        if (nick != null) {
            //alert('Witaj ' + nick);
        } else {
            //location.reload();
            //alert('Anulowałeś akcję');
        }
        return nick;
    }
    /*
    //pozyskanie dokładnej daty
    function DokładnaData() {
      var date = new Date();
      var hour = date.getHours();
      hour = (hour < 10 ? "0" : "") + hour;
      var min  = date.getMinutes();
      min = (min < 10 ? "0" : "") + min;
      var sec  = date.getSeconds();
      sec = (sec < 10 ? "0" : "") + sec;
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      month = (month < 10 ? "0" : "") + month;
      var day  = date.getDate();
      day = (day < 10 ? "0" : "") + day;
      return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
    }
    */
    /*
    var timerId // current timer if started
 
    function clockStart() { 
      if (timerId) return
      timerId = setInterval(update, 1000)
      update()  // (*)
    }
 
    function clockStop() {
      clearInterval(timerId)
      timerId = null
    }
    function update() {
      var h = new Date().getHours();
      var m = new Date().getMinutes();
      var s = new Date().getSeconds();
      $('#zegar').empty();
      $('#zegar').append('<b>'+h+':'+m+':'+s+'</b>');
    }
*/

    setInterval(function() { 
        var h = new Date().getHours();
        h = (h < 10 ? "0" : "") + h;
        var m = new Date().getMinutes();
        m = (m < 10 ? "0" : "") + m;
        var s = new Date().getSeconds();
        s = (s < 10 ? "0" : "") + s;
        $('#zegar').empty();
        $('#zegar').append('<b>'+h+':'+m+':'+s+'</b>');
      }, 1000);

  socket.on('connect', function(){
    socket.emit('adduser', 
      //prompt("Podaj swoje imię.", "Anonim")
      oknoPrompt()
      );
  });

  socket.on('updatechat', function (username, data) {
    var godzina = new Date().getHours();
    godzina = (godzina < 10 ? "0" : "") + godzina;
    var minuta = new Date().getMinutes();
    minuta = (minuta < 10 ? "0" : "") + minuta;
    var sekunda = new Date().getSeconds();
    sekunda = (sekunda < 10 ? "0" : "") + sekunda;
    //var odszyfrowane = Decrypt(data);
    $('#rozmowa').append('<b>'+'&nbsp'+username+':</b>'+'&nbsp'+data+"&nbsp &nbsp &nbsp &nbsp"+godzina+':'+minuta+':'+sekunda+'<br>');

     //wstawianie emotikonek
        var zamiana = $("#rozmowa").html().replace(emotikonki.smile1,'<img src="http://upload.wikimedia.org/wikipedia/commons/7/79/Face-smile.svg" width="30" height="30" border="0"/>').replace(emotikonki.smile2,'<img src="http://upload.wikimedia.org/wikipedia/commons/7/79/Face-smile.svg" width="30" height="30" border="0"/>').replace(emotikonki.sad1,'<img src="http://upload.wikimedia.org/wikipedia/commons/0/06/Face-sad.svg" width="30" height="30" border="0"/>').replace(emotikonki.sad2,'<img src="http://upload.wikimedia.org/wikipedia/commons/0/06/Face-sad.svg" width="30" height="30" border="0"/>').replace(emotikonki.scared1,'<img src="http://upload.wikimedia.org/wikipedia/commons/7/79/Face-surprise.svg" width="30" height="30" border="0"/>').replace(emotikonki.scared2,'<img src="http://upload.wikimedia.org/wikipedia/commons/7/79/Face-surprise.svg" width="30" height="30" border="0"/>').replace(emotikonki.wink1,'<img src="http://upload.wikimedia.org/wikipedia/commons/5/57/Face-wink.svg" width="30" height="30" border="0"/>').replace(emotikonki.wink2,'<img src="http://upload.wikimedia.org/wikipedia/commons/5/57/Face-wink.svg" width="30" height="30" border="0"/>');

        $("#rozmowa").html(zamiana);
  });

  socket.on('updateusers', function(data) {
    $('#users').empty();
    $.each(data, function(key, value) {
      //$('#users').append('<div>' + key + '</div>');
      $('#users').append('<div><a href="#" onclick="zapros(\''+key+'\')">' + key + ' </a></div>');
    });
    $('#users div:odd').remove();
  });

  socket.on('updaterooms', function(rooms, current_room, username) {
    $('#rooms').empty();
    $.each(rooms, function(key, value) {
      if(value == current_room){
        $('#rooms').append('<div>' + value + '</div>');
      }
      else {
        $('#rooms').append('<div><a href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a></div>' + '');
        $('#rooms').append('<div><input type="button" id=\''+value+'\' + value="usuń" /></div>');
      }
    });
    $('#aktualny_pokoj').empty();
    $('#aktualny_pokoj').html("Twój nick :&nbsp"+ username+" &nbsp jesteś aktualnie w :&nbsp"+"(" + current_room + ")");
  });

  function switchRoom(room){
    socket.emit('switchRoom', room);
  }
  function zapros(key){
    socket.emit('zapros', key);
  }

  $(function(){
    
    $('#datasend').click( function() {
      /*
      var message = $('#data').val();
      $('#data').val('');
      socket.emit('sendchat', message);
      $('#data').focus();
      */
      var message = $('#data').val();
      $('#data').val('');
      socket.emit('sendchat', message);
      $('#data').focus();
    });

    $('#dodaj_pokoj').click(function(){
      var wartosc = $('input[id=pokoj]').val();
      var username = socket.username;
      socket.emit('addroom', wartosc, username);
      //return wartosc;
    });

    $('#przycisk_zaproszenie').click(function(){
      var zaproszony = $('input[id=zaproszenie]').val();
      socket.emit('zapros', zaproszony);
      
      //socket.emit('addroom', wartosc);
      //return wartosc;
    });

    $('#wyjdz').click( function() {
      socket.disconnect();
      location.reload();
    });

    $('#data').keypress(function(e) {
      if(e.which == 13) {
        $(this).blur();
        $('#datasend').focus().click();
      }
    });
  });