
  var socket = io.connect('http://localhost:1234');

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
            location.reload();
            //alert('Anulowałeś akcję');
        }
        return nick;
    }

  socket.on('connect', function(){
    socket.emit('adduser', 
      //prompt("Podaj swoje imię.", "Anonim")
      oknoPrompt()
      );
  });

  socket.on('updatechat', function (username, data) {
    $('#rozmowa').append('<b>'+username + ':</b> ' + data + '<br>');

     //wstawianie emotikonek
        var zamiana = $("#rozmowa").html().replace(emotikonki.smile1,'<img src="http://upload.wikimedia.org/wikipedia/commons/7/79/Face-smile.svg" width="30" height="30" border="0"/>').replace(emotikonki.smile2,'<img src="http://upload.wikimedia.org/wikipedia/commons/7/79/Face-smile.svg" width="30" height="30" border="0"/>').replace(emotikonki.sad1,'<img src="http://upload.wikimedia.org/wikipedia/commons/0/06/Face-sad.svg" width="30" height="30" border="0"/>').replace(emotikonki.sad2,'<img src="http://upload.wikimedia.org/wikipedia/commons/0/06/Face-sad.svg" width="30" height="30" border="0"/>').replace(emotikonki.scared1,'<img src="http://upload.wikimedia.org/wikipedia/commons/7/79/Face-surprise.svg" width="30" height="30" border="0"/>').replace(emotikonki.scared2,'<img src="http://upload.wikimedia.org/wikipedia/commons/7/79/Face-surprise.svg" width="30" height="30" border="0"/>').replace(emotikonki.wink1,'<img src="http://upload.wikimedia.org/wikipedia/commons/5/57/Face-wink.svg" width="30" height="30" border="0"/>').replace(emotikonki.wink2,'<img src="http://upload.wikimedia.org/wikipedia/commons/5/57/Face-wink.svg" width="30" height="30" border="0"/>');

        $("#rozmowa").html(zamiana);

  });

  socket.on('updateusers', function(data) {
    $('#users').empty();
    $.each(data, function(key, value) {
      $('#users').append('<div>' + key + '</div>');
    });
  });

  socket.on('updaterooms', function(rooms, current_room) {
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
    $('#aktualny_pokoj').html("Jesteś aktualnie w " + current_room + ".");
  });

  function switchRoom(room){
    socket.emit('switchRoom', room);
  }

  $(function(){
    
    

    $('#datasend').click( function() {
      var message = $('#data').val();
      $('#data').val('');
      socket.emit('sendchat', message);
      $('#data').focus();
    });

    $('#dodaj_pokoj').click(function(){
      var wartosc = $('input[id=pokoj]').val();
      socket.emit('addroom', wartosc);
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