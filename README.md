# Web-RTC
---
## Questo progetto è stato svolto per la Maturità
## Funzionamento
Questo progetto si basa sulla tecnologia WebRTC ([per maggiori informazioni](https://docs.google.com/presentation/d/1it7Ii2G2cgAdgBr-aEk-OKq7BTjUEyPIJHsqIb6RRCg/edit?usp=sharing)).

L'applicazione si basa sul funzionamento di una libreria: [PeerJs](https://peerjs.com/).
Il Funzionamento dell'applicazione si può riassumere in delle semplici sezioni:

### Connessione al server

Connessione al webserver (NodeJs) che restituisce il form di login

Codice Backend:
```javascript
// WEB SERVER
var http = require('http'); // 1 - Import Node.js core module
var server = http.createServer(function (req, res) {   // 2 - creating server
    var html = {
        head :  '<!DOCTYPE html> <html lang="it"><head> <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>WEB RTC</title><link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous"><script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script></head>',
        body : '',
        end :  '</html>'
    }

    // read index.html and put it in the response
    fs.readFile('./html/index.html', 'utf8',function(err, data) {
        if (err) {
            return console.log(err);
        }
        else
        {
            res.writeHead(200, { 'Content-Type': 'text/html' }); 
            res.write(
                html.head + data + html.end
            );
            res.end();
        }
    });
}).listen(5000); //3 - listen for any incoming requests 
```


### Identificazione 

Gli utenti vengo inseriti nel form precedente e vengono gestiti dal server Apache su altervista

Backend:
```php

<?php
header("Access-Control-Allow-Origin: *");
require('Credenziali.php');
if (!empty($_POST['Nome']) && !empty($_POST['Password']) && !empty($_POST['Id']) && isset($_POST['Tipo']))
{
    	/* CONNESIONE AL DB */
        $conn = new mysqli($nomehost, $nomeuser, $password, $dbname);	
        // Check connection
        if ($conn->connect_error) 
        {
          die("Connection failed: " . $conn->connect_error);
        }
		switch($_POST['Tipo'])
        {
            // insert
        	case 0:
            	//preg_match()
            	$result = $conn -> query("SELECT Nome FROM Esame_WebRTC WHERE Nome = '".$_POST['Nome']."';");
            	if ($result->num_rows > 0)
                {
                	echo -1;
                }
                else
                {
                    $stmt = $conn -> prepare("INSERT INTO Esame_WebRTC (Nome, Password, Id_Peer) VALUES (?, ?, ?)");
                    $pass = password_hash ($_POST['Password'], PASSWORD_BCRYPT);
                    $stmt -> bind_param("sss", $_POST['Nome'], $pass, $_POST['Id']);
                    $stmt -> execute();
                    $stmt -> close();
                    echo 0;
                }
            	break;
            // select
        	case 1:
            	$result = $conn -> query("SELECT Password FROM Esame_WebRTC WHERE Nome = '".$_POST['Nome']."';");
            	if ($result->num_rows > 0)
                {
                	$row=$result->fetch_assoc();
                    if (password_verify ($_POST['Password'], $row['Password']))
                    {
                        $stmt = $conn -> prepare("UPDATE Esame_WebRTC SET Id_Peer=? WHERE Nome=?");
                        $stmt -> bind_param("ss", $_POST['Id'], $_POST['Nome']);
                        $stmt -> execute();
                        $stmt -> close();
                    	echo 0;
                    }
                    else
                    {
                    	echo -1;
                    }
                }
                else
                {
                    echo -1;
                }
            	break;
        }
	
    } 
    else if (!empty($_POST['Nome']) && isset($_POST['Tipo']) && $_POST['Tipo']==2)
    {
    	$conn = new mysqli($nomehost, $nomeuser, $password, $dbname);
        if ($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error);
        }
        $stmt = $conn -> prepare("SELECT Id_Peer FROM Esame_WebRTC WHERE Nome=?");
        $stmt -> bind_param("s", $_POST['Nome']);
      	$stmt -> execute();
    	$stmt -> bind_result($Id);
        $stmt->fetch();
        if (isset($Id))
        {
        	echo $Id;
        }
        else
        {
        	echo -1;
        }
    }
    else
    {
    	echo -2;
    }
?>
```

La base dati non è per niente complicata, esiste solo una tabella con i seguenti campi: 
|  | Id       | Nome           | Password       | Id_Peer       |
| - | -------- | -------------- | -------------- | -------------- | 
| Tipo | int(11) | text | varchar(62) | text | 
| Constrain | PK | NOT NULL, UNIQUE | NOT NULL | NOT NULL |
| Descrizione | Valore univoco che identifica l'utente | Nome dell'utente | Hash della password (PASSWORD_BCRYPT) | Valore univoco ottenuto dalla connessione alla rete P2P | 

### Connessione alla rete P2P

La connessione alla rete P2P avviene appena viene caricata la pagina html

Codice Frontend:
```javascript
/**
 * Funzione per la connessione alla rete p2p
 * 
 * @return {object} io oggetto di tipo Peer appena creato
 * */
function CreaPeer()
{
    // peer creation
    let io = new Peer({
        host: '...', // indirizzo del server P2P
        port: ..., // porta del server P2P
        path: '/myapp'  
    }); 
    return io;
}

const peer = CreaPeer();
```
Codice backend:
```javascript
// PEER SERVER
const { PeerServer } = require('peer');
const peerServer = PeerServer({ port: 9000, path: '/myapp' });

/*Debug*/
// client connection
peerServer.on('connection', (client) => { 
    console.log({'Client connesso': {Ping : client.lastPing, Id : client.id, Token : client.token}});
});

// client disconnect
peerServer.on('disconnect', (client) => {
    console.log({'Client disconnect': {Ping : client.lastPing, Id : client.id, Token : client.token}});
});
```
Appena il client si connette al server viene eseguita questa funzione:
```javascript
// Evento della creazione del peer
peer.on('open', function(id) {
    console.log('My peer ID is: ' + id);
});
```
L'id che viene assegnato al peer viene poi sovrascritto nel DB in modo da avere una perfetta associazione Nome-Id, in questo modo basta solo sapere il nome dell'utente per effettuare la chiamata.

### Collegamento tra i Peer

La connessione tra i due Peer viene creata con questa funzione che serve anche per gestire i dati da inviare e quelli che riceve lato MITTENTE. (jQuery serviva solo per gestire la grafica e le chiamate Ajax fatte ad Altervista)
```javascript
/**
 * Funzione per la connessione tra i 2 peers
 * 
 * @param {string} data id del peer destinatario
 * */
function connect(data)
{

    conn = peer.connect(data);

    // evento connessione aperta
    conn.on('open', function() {
        console.log('connessione aperta');
        $('#form-connessione').hide();
        $('#form-chat').show();

        // evento del bottone send
        var messaggio;
        $('#send').click(function (){
            if ($('#messaggio').val() !== "")
            {   
                // Send messages
                messaggio = SendAllMessage($('#messaggio').val(), 0);
                conn.send(messaggio);
                $('#chatting').append('<p>Me: </p>');
                $('#chatting').append(messaggio);
            }
            else if ($('#multimedia').prop('files')[0].size > 0)
            {
                // Send messages
                messaggio = SendAllMessage($('#multimedia').prop('files'), 1);
                conn.send(messaggio);
                $('#chatting').append('<p>Me: </p>');
                $('#chatting').append('<img src="'+ URL.createObjectURL($('#multimedia').prop('files')[0]) +'" style="height: 100px; width:100px;">');
            }   
            console.log({Mandato: messaggio});
            $("#chatting").scrollTop($("#chatting").prop("scrollHeight"));
        });

        // evento ricezione dati 
        conn.on('data', function(data) {
            console.log ({Ricevuto: data});
            $('#chatting').append('<p>Guest: </p>');
            $('#chatting').append(RecieveAllMessage(data));
            $("#chatting").scrollTop($("#chatting").prop("scrollHeight"));
        });
    });
}
```
Lato destinatario troviamo questo che essenzialmente gestisce una connessione in entrata e gli eventuali dati scambiati lato DESTINATARIO
```javascript
// evento di ricezione connessione
peer.on('connection', function(conn) {
    // evento connessione aperta
    conn.on('open', function() {
        $('#form-connessione').hide();
        $('#form-chat').show();
        console.log('connessione aperta');

        // evento del bottone send
        var messaggio;
        $('#send').click(function (){
            if ($('#messaggio').val() !== "")
            {   
                // Send messages
                messaggio = SendAllMessage($('#messaggio').val(), 0);
                conn.send(messaggio);
                $('#chatting').append('<p>Me: </p>');
                $('#chatting').append(messaggio);
            }
            else if ($('#multimedia').prop('files')[0].size > 0)
            {
                // Send messages
                messaggio = SendAllMessage($('#multimedia').prop('files'), 1);
                conn.send(messaggio);
                $('#chatting').append('<p>Me: </p>');
                $('#chatting').append('<img src="'+ URL.createObjectURL($('#multimedia').prop('files')[0]) +'" style="height: 100px; width:100px;">');
            }   
            console.log({Mandato: messaggio});
            $("#chatting").scrollTop($("#chatting").prop("scrollHeight"));
        });

        // evento ricezione dati 
        conn.on('data', function(data) {
            console.log ({Ricevuto: data});
            $('#chatting').append('<p>Guest: </p>');
            $('#chatting').append(RecieveAllMessage(data));
            $("#chatting").scrollTop($("#chatting").prop("scrollHeight"));
        });

    });
});
```

### Trasmissione e ricezione dati
Grazie alla libreria che ho utilizzato posso inviare qualsiasi tipo di dato:
```javascript
conn.send({
  strings: 'hi!',
  numbers: 150,
  arrays: [1,2,3],
  evenBinary: new Blob([1,2,3]),
  andMore: {bool: true}
});
```
Nel mio esempio ho implementato la possibilità di inviare delle immagini le quali vengono essenzialmente serializzate e codificate in Base64 per la visualizzazione nella pagina.
Nel seguente estratto di codice possiamo trovare le funzioni che formattano i dati prima di inviarli e prima di riceverli:

```javascript
/**
 * Funzione per mandare un qualsiasi tipo di messaggio
 * 
 * @param {obj} messaggio da inviare
 * @param {int} tipo di messaggio da inviare 
 *          0 testo
 *          1 immagine
 *          2 video (DA IMPLEMENTARE)
 * 
 * */
function SendAllMessage(messaggio, tipo)
{
    switch (tipo)
    {
        case 0:
            return messaggio;
            break;
        case 1:
            let file = messaggio[0];

            blob = new Blob(messaggio, {type: file.type});
            console.log(blob);
            return {file: blob, filename: file.name, filetype: file.type };
            break;
        case 2:
            break;
    }
}
/**
 * Funzione per ricevere un qualsiasi tipo di messaggio
 * 
 * @param {obj} messaggio da inviare
 * @param {int} tipo di messaggio da inviare 
 *          0 testo
 *          1 immagine
 *          2 video (DA IMPLEMENTARE)
 * 
 * */
function RecieveAllMessage(messaggio)
{
    if (typeof messaggio !== "string")
    {
        if (messaggio.filetype.includes('image'))
        {
            console.log ('img'); 
            const bytes = new Uint8Array(messaggio.file);
            const img = document.createElement('img');
            img.src = 'data:image/png;base64,' + encode(bytes);
            img.style.height= "100px";
            img.style.width= "100px";
            return img;
        }
    }
    else
    {
        return messaggio;
    }
}

/**
 * Funzione per convertire blob -> base 64
 * 
 * @param {obj} input da inviare
 * */
const encode = input => {
    const keyStr =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    let output = ''
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4
    let i = 0
    while (i < input.length) {
        chr1 = input[i++]
        chr2 = i < input.length ? input[i++] : Number.NaN // Not sure if the index
        chr3 = i < input.length ? input[i++] : Number.NaN // checks are needed here
        enc1 = chr1 >> 2
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
        enc4 = chr3 & 63
        if (isNaN(chr2)) {
        enc3 = enc4 = 64
        } else if (isNaN(chr3)) {
        enc4 = 64
        }
        output +=
        keyStr.charAt(enc1) +
        keyStr.charAt(enc2) +
        keyStr.charAt(enc3) +
        keyStr.charAt(enc4)
    }
    return output
}
```
Le seguenti funzioni invece sono della libreria che ho utilizzato che servono per mandare e ricevere i dati:
```javascript
messaggio = SendAllMessage($('#multimedia').prop('files'), 1);  //formattazione dei dati
conn.send(messaggio); //invio dei dati

// evento ricezione dati 
conn.on('data', function(data) {
    console.log ({Ricevuto: data});
    $('#chatting').append('<p>Guest: </p>');
    $('#chatting').append(RecieveAllMessage(data));
    $("#chatting").scrollTop($("#chatting").prop("scrollHeight"));
});
```
---
## Diagramma casi d'uso

Ecco il diagramma dei casi d'uso dell'applicazione

![UML](http://tezze20.altervista.org/WebRTC/Uml.png)

---
## Function Points

Ecco il calcolo dei [Function Points](https://docs.google.com/spreadsheets/d/1M1lvGJNqLAfyBW4cOUL9Z8jWAp4Q0IMQSXs8J7TPPjs/edit?usp=sharing)
