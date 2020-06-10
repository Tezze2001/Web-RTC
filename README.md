# Web-RTC
---
## Questo progetto è stato svolto per la Maturità
## Funzionamento
Questo progetto si basa sulla tecnologia WebRTC ([per maggiori informazioni](https://docs.google.com/presentation/d/1it7Ii2G2cgAdgBr-aEk-OKq7BTjUEyPIJHsqIb6RRCg/edit?usp=sharing)).
L'applicazione si basa sul funzionamento di una libreria WebRTC: [PeerJs](https://peerjs.com/)
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
![Hello World](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAiQAAAFVCAYAAADfZfSJAAAIF3RFWHRteGZpbGUAJTNDbXhmaWxlJTIwaG9zdCUzRCUyMmFwcC5kaWFncmFtcy5uZXQlMjIlMjBtb2RpZmllZCUzRCUyMjIwMjAtMDYtMTBUMTQlM0ExNSUzQTE2Ljk1M1olMjIlMjBhZ2VudCUzRCUyMjUuMCUyMChNYWNpbnRvc2glM0IlMjBJbnRlbCUyME1hYyUyME9TJTIwWCUyMDEwXzE1XzQpJTIwQXBwbGVXZWJLaXQlMkY1MzcuMzYlMjAoS0hUTUwlMkMlMjBsaWtlJTIwR2Vja28pJTIwQ2hyb21lJTJGODMuMC40MTAzLjk3JTIwU2FmYXJpJTJGNTM3LjM2JTIyJTIwZXRhZyUzRCUyMmVJQjdzazVSOS1JSTR1eUtCRlJPJTIyJTIwdmVyc2lvbiUzRCUyMjEzLjIuMSUyMiUyMHR5cGUlM0QlMjJnb29nbGUlMjIlM0UlM0NkaWFncmFtJTIwaWQlM0QlMjJTbG43WElUWlk3bU04NHF2UUZ3aSUyMiUyMG5hbWUlM0QlMjJQYWdlLTElMjIlM0U3WnBkYjZNNEZJWiUyRlRTNkwlMkZJSDV1R3lUZG5ha0dXM1Y3bWgyOTg0QmwxZ0RPQUtuVGZycjF3NkdBQ1pwMDAxQ3RWb3VLbnl3RGJ6bjRlV1lkSUtuMmZwTFFaZUw3eUptNlFTQmVEM0Jzd2xDQVNUcXJ3NXNxb0FMJTJGQ3FRRkR5dVFuQVhlT1N2ekFTQmlhNTR6TXBPUnlsRUt2bXlHNHhFbnJOSWRtSzBLTVJMdDl1VFNMdG5YZEtFV1lISGlLWjI5Q2VQNWNMY0Z2SjM4ZDhZVHhiMW1hRVhWa2N5V25jMmQxSXVhQ3hlV2lGOE84SFRRZ2haN1dYcktVdTFkclV1MWJpN1BVZWJDeXRZTHQ4ejRBdDRuY20lMkZaNDglMkZhUEw5OTF1UXVSR09yMGhRVGZOTTA1VzU0NTlzJTJGdkRIMUZ5ejNOUkNxTXRmNnQxVmx0NFZORk83Tnk4TEx0bmpra1k2JTJGcUxTcjJJTG1hV3FCZFd1bVprVmtxMzNYak5zbEZBRU1aRXhXV3hVRnpPZ3djRFE0NXZteXk0VnJtZGlpMVlhc0d1QzFLUSUyRmFhYmVLYVIyakVoSENBWXR2WDVJZFRQc2tGN1hrUlNGRWtSTHdSVmEzJTJCaWNwZmVpNUpLTFhIV1pDeWxGcGpxayUyQnNBTmpYNGxoVmpsOFZTa2VweWFEVDl0dDlZYzF5bFA5RmdwZXFxTGxVeDV6cWJOOHdCT2t3cEl1cW1BbnAwTFBKQUs3MXlaOEsxTVRCZWNadFRLaEpwTHVjVmxnTVdncHhLeVZZSmdRS2F6QVl1UnBkTURqOWlyUW85cDM5eHFKaiUyQlhhczFqUDVwcTljUXQxYjdtejF4b1kyZGxTWk9FajZxWUclMkZZNEczREdDeXRHTE1YdVdWR0szRWJyUDJlTnVJZnYyTmJvZWxZdXZvbUU1JTJCTSUyQjVORHRxalElMkJzdllyNUlFbHZKUUZyZTJSUnBIQ1RZNHNYQmN2ak1jV2p0aFZrSzFRSGwlMkZyJTJCbHUxY3EzbGdDb3N0bXJ2bmlacVJyRXFJdllPMzVHMFNKaDg4Nkd3Vlc2cFNBWkVyR01GUzZua3o5MExIbExXbk9GZWNNMU40eEZlenlOQUx6blZqWnBSN1RLJTJCTnhIcW0wMSUyRm9rb0lhNkp0b3B2YiUyRmhlNXQlMkJ1SjQzS3ZNbHhzJTJGalR1dTIzODFXN00xcDNXcG1QVEZ5YkdINVVZZjA5UmREUXg3aHNUblpzWWZCUXg4MVJFdjNySXJMbmNFdVA0eERTM3pEajF3UjAwdXJGcE5WUU53dFVOc0tLaEtyN2olMkJ2cEhvMnFQMlk4REZRYlFBUmg3d0FjdUJrRlFmNTA1bWpHaWNvTkNqSWtidWhqNWdkODdqZWVRMEhPeGkwa1lBT0pkRmtEM0tBQ2psSllsanhRZU1TMFhMRFlRRHZBSU96Q1N3ekEyNEozNEJlaSUyRjE4M0FaRVR3UE93Nkh0aHRzTU1IZEpFRGd0Wmg5Mk1ZRW9VaGdRQ2p3UFZoZ0R6WE9rdEFBQXdCQVY1QUFuaGhETzBWMGdSNU5OTVZZeXEzVUhSYjRHc2VwYXRZMTZITm9hVFQwYlQ2TEN1c3RndXBMclhVcklzaSUyRmIycXZlaXFGMHdaajJNOXgwM0JTdjVLNTl2NU5MdExMY2xXSkhJekliTkRaYTM1RG1zR1Q1cXZuMjJ5RHp5a2U0dmdLJTJCQmczdzlPWTRLb2c4VlYlMkYzMG9ucDVLZGg0RTdJWFppWnpJQVlybXRoc3BKejdDajRaZWxTZjBxUG9qMUdjM0tSUTZRZGphdW5VVFFvN2ZzNHgzRzVOMzBKakl1TVprcjRQJTJGTjZiZU0zc1JZN3FDMkVFdzNFdmdKWjBxUE1xcEJwWjVnelVTN20wZnFOOEhWNDlWOFhXWjlXUDlNJTJCUmJYdmFwVm8lMkI2MEllJTJCaHlGMmZSQVFGSkNQR1psYUtqZ2hKaGhEZ0VKVjUzdmRzMERQZ1c3bzZSVUZDSWx5MUlzYVdmMk41ZFRmSmo0alhkVXJkVFM4Z2g1ZThFUjQlMkJRZnhRbWZDU3pWM1A4UlgzWGYlMkZ6WUJ2JTJGd0UlM0QlM0MlMkZkaWFncmFtJTNFJTNDJTJGbXhmaWxlJTNFikabEgAAIABJREFUeF7tnQm4VWP7/5+3NCBKpJFKkqj01q9kTqYkyViUhBClyDzPM6GSKXozZZYkmZIhkgyNKKEUTYYSRYb/9bnfd/Xfbfucs6dn77XX/t7Xda7YZ61nrfV51tnru+7nHv71999//+1kXgjsu+++btKkSV7GDuOgDRo0cF9//XUYT03nJAIiIAIiEGIC7du3d/+SIPE3Q//6179cMem9Yrtef3eORhYBERCB4iLA80OCxOOcF9sDutiu1+Oto6FFQAREoKgISJB4nu5ie0AX2/V6vn00vAiIgAgUDQEJEs9TXWwP6GK7Xs+3j4YXAREQgaIhIEHieaqL7QFdbNfr+fbR8CIgAiJQNAQkSDxPdbE9oIvtej3fPhpeBERABIqGgASJ56kutgd0sV2v59tHw4uACIhA0RCQIPE81cX2gC626/V8+2h4ERABESgaAhIknqe62B7QxXa9nm8fDS8CIiACRUNAgsTzVPt+QK9bt85VqFDB61X88MMPbunSpW6bbbZxVapUKfVYvq/X64VqcBEQAREQgbwRkCDxjD7RA/rdd991e+yxh5s7d65r3LixncHJJ5/sHnzwQffLL7+4TTbZxD7bc889XfPmzd3dd9+d8CwXLVpkImHNmjWucuXKG2zz559/uo022miDzzbbbDNHad477rjDffDBB6579+4Jxz344IPd+PHj3Zw5c9zxxx/vPvroo/XbDRgwwN16660liiAJEs83lIYXAREQgYgSkCDxPLGJHtBr1651G2+8sXv44Yddz549rbR8rVq13LJly9xrr73m9ttvPxMZCJPHHnvMHXvssWkLkqeeesrtvffetv/333/vOnfu7Og3M27cOPfjjz/a5/fdd5+dy9tvv23/X6lSJTun7bbbzgTJ9ddf7zbddFM3depU17FjR3fWWWe5q6++OuE5SZB4vqE0vAiIgAhElIAEieeJLekBzYO9UaNG7q677nIzZ850LVq0cCeddJLbeuut3Q033OACL8rChQvNC/Kf//zH3X777W716tUmYi677DK3ZMkS+93ll1/u7rnnHletWjXb94gjjnCBhyQQOMFlIiTuv/9+980336y/cjwmfDZ79uz1n11zzTUmVL788ssNvCHPP/+8eU4uuugiCRLP946GFwEREIFiIiBB4nm2SxIkN998sxs1apSJgKFDh7pXX33V9e7d21111VVu+vTptqzC5/Pnz3cvvfSS69SpkxsyZIhr2rSpO/HEE90pp5xiAgZB0qZNG3fJJZe4MWPGmHD56quv7HOWbJ5++mm3zz77mMfjs88+c3369DEPzPDhw0sVJN26dTMPzciRI1MiJA9JSri0sQiIgAiIwP8ISJB4vhVKekBPmTLF7bbbbrZsctxxx5ngIKajRo0a7rvvvnPEavDfeFC6dOlinpMRI0bY2RJrctNNN7nXX3/dhAdiZv/993d//fWXeUnwpCBu4mNIgkv94osvzDsTWCIPyYEHHmji584770yaEOKqf//+7o033kh6H20oAiIgAiIgAhCQIPF8H5QkSH7//XeL1Rg7dqwJjhkzZlgAa+vWrd15553nTj31VPfAAw+4o48+2jVp0sQCYGONAFWWThAkLOMQ44EhJBAn55xzjgkSYkgCDwnLPx06dHA9evTYIFA2kSA5/fTTbdkIb02sccxJkya5M8444x/kWIbi+IMGDfJMVcOLgAiIgAhEjYAEiecZLW0JgwBTAk2J0yAehG1Zepk4caLDg4KnhGBXPCmICmJFMLwqbF+zZk0TJMSD1KtXz37HZ0888YTba6+9TJDEx5BceOGF7p133rGf0jwkeGbwdgTHCbZluahixYru3nvv3YAcXpkJEya4l19+2TNRDS8CIiACIhBFAhIknme1NEEyePBg82SccMIJFvuBsQyDh2OHHXZwn3/+uX1GAOuTTz5pqbh4RvCekKVzyy23mCA5//zzLeuFjBziSsjQoTZJIkHCEgxLPrGej0QeEtKPd9xxR7fLLrtYLAtLRo8//rjFoHz44YeuVatW68mxVNOsWTM3a9Yst/POO3smquFFQAREQASiSECCxPOsliZIpk2bZgGpQfovp/Lrr7/a8guptXgdsJ9++skdeeSR5jnB2Idg1XLlypkgobYIyyjYsGHDXL9+/dZn2SBwWKYJ7JFHHrFUXgJfSf/FEgkSPuf8WN6JXS4iGwdREmtaqvF8E2l4ERABESgCAhIknic5W1knZMksWLDA/fbbb+Y9YdxYY9lmiy22KLOSaqqXy3EXL15sXpeGDRv+I1BWSzWpEtX2IiACIiACiQhIkHi+L7IlSDyfZlrDa6kmLWzaSQREQAREIAEBCRLPt0WUBYmWajzfPBpeBERABIqIgASJ58mOqiAhIJeMGmXVeL6BNLwIiIAIFAkBCRLPEx1FQaKlGs83jYYXAREQgSIkIEHiedKjKEi0VOP5ptHwIiACIlCEBCRIPE961ASJlmo83zAaXgREQASKlIAEieeJj5Ig0VKN55tFw4uACIhAEROQIPE8+VESJFqq8XyzaHgREAERKGICEiSeJz8qgkRLNZ5vFA0vAiIgAkVOQILE8w1AddOvv/7a81H8D09zPxruqVeNf9Y6ggiIgAgUIwEJEs+zHhUPiWdMGl4EREAERKDICUiQeL4BJEg8A9bwIiACIiACkSAgQeJ5GiVIPAPW8CIgAiIgApEgIEHieRolSDwD1vAiIAIiIAKRICBB4nkaJUg8A9bwIiACIiACkSAgQeJ5GiVIPAPW8CIgAiIgApEgIEHieRolSDwD1vAiIAIiIAKRICBB4nkaJUg8A9bwIiACIiACkSAgQeJ5GiVIPAPW8CIgAiIgApEgIEHieRolSDwD1vAiIAIiIAKRICBB4nkaJUg8A9bwIiACIiACkSAgQeJ5GiVIPAPW8CIgAiIgApEgIEHieRolSDwD1vAiIAIiIAKRICBB4nkaJUg8A9bwIiACIiACkSAgQeJ5GiVIPAPW8CIgAiIgApEgIEHieRolSDwD1vAiIAIiIAKRICBB4nkaJUg8A9bwIiACIiACkSAgQeJ5GiVIPAPW8CIgAiIgApEgIEHieRolSDwD1vAiIAIiIAKRICBB4nkaJUg8Aw7h8IsXL3bffPONW7Rokfvuu+/c0qVL3fLly92KFSvcjz/+6FauXOl+/vlnt3r1ardmzRr322+/uXXr1rk///zT/f333457pnz58q5ChQquUqVKbuONN3ZVqlRxm222matatarbYost3FZbbeVq1Kjhatas6WrXru3q1avnttlmG1e3bt0QEtEpiYAIiEDZBCRIymaU0RYSJBnhC+3OCIeZM2e6WbNmuU8//dR9/vnnbt68eW7+/PkmIurXr79eINSqVcuEAyJiyy23dNWqVXObb765iQzERuXKlU2AxBsCZe3atSZaEC+rVq1yP/30k/v+++9N3CB0lixZ4gIBtGDBAhM3jRo1co0bN3ZNmjRxTZs2dc2aNXPNmzc3oSMTAREQgbASkCDxPDMSJJ4B52j4r776yk2ZMsVNnTrVTZs2zX300UfmlWjRooXbeeed3U477WQCYIcddjCRkS9DvMydO9cE0pw5c9zs2bPdjBkzzFvTqlUr93//93+ubdu2rl27dq5hw4b5Ok0dVwREQAT+QUCCxPNNIUHiGbCn4Vlaef31193EiRPdpEmTzCOxxx57uN13393tuuuurk2bNnkVHqleNkLlgw8+cO+//75799133eTJk81j0759e9ehQwe333772VKQTAREQATyRUCCxDN5CRLPgLM4/LfffuvGjh3rXnjhBTd+/HjXsWNHd+CBB7r999/fljyiZiw5vfbaa+6VV15xEyZMcJ06dXKHHnqo69Kli6tTp07ULlfXIwIiEHICEiSeJ0iCxDPgLAz/+OOPuyeeeMJEyFFHHeUOP/xw17VrV7fRRhtlYfTCGOKPP/5wY8aMcc8995x7+umnTZx069bNde/evTAuQGcpAiJQ8AQkSDxPoQSJZ8BpDk8WzIgRI9yDDz7odtxxR9erVy/Xs2dPBX465/766y/3yCOPuIceesjiUU488UTXp08fC9KViYAIiIAvAhIkvsj+b1wJEs+AUxyeLJg777zTDR061PXr18+dfvrpFpQqS0yAoNi7777bDR8+3J155pluwIABlsUjEwEREIFsE5AgyTbRuPEkSDwDTnJ40mavv/56d8MNN7gLLrjAnXfeeZaCK0uOAKnGt9xyi7vpppvcRRdd5C655BK36aabJrezthIBERCBJAhIkCQBKZNNJEgyoZedfUePHu0uvvhiC069+uqrrZCYLD0CFHq7/PLLLRgWgXfsscemN5D2EgEREIEEL/D/+psqTzIvBCRIvGBNalCKhLHEQJrrHXfcYamtsuwQICV64MCBlgrN8lfFihWzM7BGEQERKFoC8pB4nnoJEs+ASxie6qkEY7Zs2dLdc889+TmJIjhq37593fTp093IkSMtOFgmAiIgAukSkCBJl1yS+0mQJAkqi5tRAIz03bPOOsudffbZWRxZQyUicPvtt5sH6plnnrFKsDIREAERSIeABEk61FLYR4IkBVhZ2JSS6RQzI87h5JNPzsKIGiIZAg888IC75pprrMga5fNlIiACIpAqAQmSVImluL0ESYrAMtx87733docddpg755xzMhxJu6dK4NZbb7VKt2+99Vaqu2p7ERABEbA6UApq9XgjSJB4hBs3NF6RL774wj322GO5O+j/jkSlUxrw0ViPsuvlypWz3xAvTtfeYqn6StYNHpKrrroq53OgA4qACBQ2AQkSz/MnQeIZ8P+GX7x4sdt2223d119/ndOKoggRapsghgLbbrvt3MMPP2yN+EiPJbiWyrDxduWVV9r5/uc//8kNpBwchets0KCBW7hwoatbt24OjqhDiIAIRIWABInnmZQg8Qz4f8MjCngIUlU0l4YngCqm9H/Zc8893dKlS911113nRo0aZd6aGTNmlChI8KiQmhy17BSq3yIOKaAWNcPbxd904AGL2vXpekQgnwQkSDzTlyDxDPh/w++zzz7usssus+JnubJffvnFValSxfrh4AUJ7Ndff3WXXnqp6927t1u2bJnr0aOHBdjiNdl6663dvffea9koBIIuWbLEqp5+9NFHVmjs7bffdm3atLFqsnvttZebOnWqu/baa13r1q2t9w6/I3uIQm/z5s2zOivsjz3//PPutttuc0Fg74033pgXL8Wrr75q5/zmm2/mZCrIqmrbtq0tj6VqcKWVAGIyGRs0aJDDA9a/f/9kNtc2IiACKRCQIEkBVjqbSpCkQy31fapVq+YWLFjgqlatmvrOae4xa9Ys17x5cxMG22+/fcJRWLI54IADrIPwSSed5EiRpXndG2+84a644gqLO6GJXZMmTVz79u3dKaec4ug+/NJLLznGpwAZ+x955JHWfZcHISKHNFsMccIyCUKH5ncsHe26664mWOjRw/FybT/99JMt2/BvLixTQQJLxF8yJkGSDCVtIwLpEZAgSY9b0ntJkCSNKuUNf/75Z/fcc8/Zz48//ugmTZqU8hiZ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3cmCufPOO93QoUNdv3793Omnn25BqbLEBAiKvfvuu93w4cPdmWee6QYMGGBZPDIREAERKImABInne0OCxDNgz8OTNnv99de7G264wV1wwQXu/PPPd9TQkSVHgFTjW265xd10003uoosucpdcconbdNNNk9tZW4mACBQVAQkSz9MtQeIZsMfhR48e7S6++GILTr366qutkJgsPQIUerv88sstGBaBd+yxx6Y3kPYSARGILIEyBclVV13lrrzyypwD4JhXXHFFzo+b7QNKkGSbqP/xKBLGEgNprnfccYeltsqyQ4CU6IEDB1oqNMtfFStWzM7AGkUERKDgCZQpSDK5Qj2MFdSayf2Tj32pnkowZsuWLd0999yTj1MoimP27dvXTZ8+3Y0cOdKCg2UiIAIiIEHi+R6QKPMMOIvDUwCM9N2zzjrLnX322VkcWUMlInD77bebB+qZZ56xSrAyERCB4iYgQeJ5/iVIPAPO0vCUTKeYGXEOJ598cpZG1TBlEXjggQfcNddcY0XWKJ8vEwERKF4CEiSe516CxDPgLA2/9957u8MOO8ydc845WRpRwyRL4NZbb7VKt2+99Vayu2g7ERCBCBKQIPE8qRIkngFnYXi8Il988YV77LHHsjCahkiHAFk3eEgIopeJgAgUJwEJEs/zLkHiGXCGwy9evNhtu+227uuvvw5FRdGaNWu62267zaq/Zmq//vqr1fyYN2+e23777TMdzuv+VMBt0KCBW7hwoatbt67XY2lwERCBcBKQIPE8LxIkngFnODwFz3gIUlU0DIYgYQnj+OOPz/h0KOX+zjvvWMDoJptskvF4vgeg+i3ikAJqMhEQgeIjIEHiec4lSDwDznD4ffbZx1122WVW/CwMVpogIc6ChzXehA4dOjgaWdarV8/9+eefVmyMPjJNmzZ1bdq0ceXLl7dMoQMOOMCWouhIjOeFcvf333+/23rrrd1dd93l2rVrF4bLtnN49dVX3bXXXuvefPPN0JyTTkQERCB3BCRIPLOWIPEMOMPh6UbNck3VqlUzHCk7u5ckSObMmWNigpRkOumSmfLTTz+5t99+240bN8716NHDkbHy2WefWabQcccdZ8KDJRsa3S1YsMDECR2JzzjjDCt2WK5cuVAFknI9DRs2tC7hMhEQgeIjEFpBkq8KscV3CxT3FeMhmTRpUmgglCRIKGH/xhtvuPfee8/OFeGBNwShwbJT48aN3aBBg+x3nTt3NoGVSJD8/PPPrkqVKm7ChAnumGOOcatWrQrNtXMiVGdWYGuopkQnIwI5IxBaQZIzAp4PJA+JZ8AZDl8oHpJu3bpZsOfgwYPtitesWWNxIdOmTXOdOnVyDz74oDvkkEPsd9ddd53DoxIvSPCiLF261LahLD7l2//+++8MCWZvd3lIssdSI4lAIRKQIPE8axIkngFnOHyhxJAQW/HJJ5+4p59+2q545syZrkWLFm7t2rVup512svopLMVgZ555pvvhhx/+IUgoiU/8SVgFiWJIMryZtbsIFDiB0AoS3vyiUE5agiTcfyFhzLLp37+/FWkLjDiQlStXuvbt27vx48e7Pffc04JbZ8+ebQXFqCyLQHniiSdMiOy7777u0EMPLThBoiybcP+t6OxEwDeB0AqS8847zxpv8QbLD5U0aXhWaCZBEu4ZC2MdkmXLlm0AjWDUl19+2QJVH3/8cbfZZpu5jTfe2L3wwguubdu27rvvvnNXX321NQMke4Z4En7IognqkBC4G2YPieqQhPvvRGcnArkgEFpBwsWTqkgKIEGH/MtbYiBO+Jesg7CbBEnYZ8hZVkqhVGrlb4LA1EaNGrmNNtrI4E6ePNlVq1bNip9VqlTJ9e7d2zVr1syde+654Yf/vzNEbHH+CCuZCIhAcRIItSCJnxIyChAmgUhZt26deU4CL0oYm3NJkBTGH1Yh97LBa4JHkZRgAkPvvPNOy8YpBMHO3UF9lOeffz5UKciFcdfqLEUgWgQKSpDEo+etNlag8MYYiBP+paZBvk2CJN8zkNzxC7nbLxVZiS3Bk0jWUJcuXVzz5s2Tu/A8b0XtFLwidPtt0qRJns9GhxcBEcgngYIWJPHgPv300/UCBaHCWnusQKGqZa5NgiTXxNM/3gcffOCOOuoo8zRQ5VTml8Dtt9/u7rjjDsscorqsTAREoLgJREqQxE/ljBkzNhAoFJ2KFSj8v2+TIPFNOLvjI2oJ/iSAmiBRmR8Cffv2tTRmAtcp8CYTAREQAW+C5MMPP7S3Td5+WrduHQrSnFOwxMO/LOnECpTq1atn/TwlSLKO1PuAv/32mxswYIAVD+MNfr/99vN+zGI5wOuvv24eqN13390NGTLEgnBlIiACIgABb4KEGiK8+fDGSU2RMNqUKVM2ECgEAcamGW+++eYZn7YEScYI8zbA6NGjHSXbabxHnEPt2rXzdi6FfmBSk8lmeu2116ySLFk1MhEQARGIJeBFkJx22ml2jHvvvdfF/nfY0dOqPUgxxoPCunZsmjG1H1I1CZJUiYVr+9WrV1snXQqoXXDBBZbNsuWWW4brJEN8NhRqu/nmm91NN91kxdwQePTSkYmACIhAPIGsC5L77rvP8RPrFcFbcuqpp9pPoRiZC7E1UPjvWHHCfwd1IEq7JgmSQpnx0s9z/vz5lk47dOhQ169fP0dV0UJJq83HDFBF9u6777bibJSyHzhwoNVOkYmACIhASQSyKkiI0UB8IEZi40ZK+ryQpoW4gtgUYzIyYgUKdSwSmQRJIc1y2edKRdERI0ZYM7sdd9zR9erVy/Xs2dPWPovdaNT3yCOPuIceesi6EZ900kmuT58+bptttil2NLp+ERCBJAhkVZCU5glJ5DlJ4vxCuwmu/FiBMmvWrA0CZHfbbTc7dwmS0E5hxidGQTL6x1ADhADuww8/3HXt2jUpz1nGBw/JAH/88YcbM2aMe+655yyAnc7DdCbu3r17SM5QpyECIlAoBLImSJKJFUlmm0IBF3+eP/744wYBsrj48aDQbwRvShQaBRbq3Pg+b8q50+SOuUacdOzY0R144IEWDFsoBcpSYUQjP4JTKWY2YcIEEyE086MgW506dVIZStuKgAiIwHoCWREkqXg/CjGeJJ37hQZpeFCOOeYY6ytClkFsivEuu+ySzrDaJ+QEEKaktk6cONECpFesWOH22GMPS3PdddddLVA6neDofF32mjVrTFC///77lgZN35ytttrKOg936NDBUqKpDisTAREQgUwJZCxIUo0PSXX7TC8w3/sHSzZ0lY2tgRI0CgxEyk477ZTvU9XxPRD46quvHOnlU6dOtdiqjz76yFExuEWLFhYUy7xTMp0+TPkUKgiPuXPnOkroz5kzxxGUSmHBRYsWuVatWpmHj87C7dq1C0VLBg9TpSFFQATyTCBjQZKOxyMVj0qe+WR8+JJiSGgHHytQaBQYWwMljI0CM4ahARyBnyx5EHNEjR4EwLx58xxLfBQJq1+/vgWB1q1b19WqVctRTRiPBKnGdPSlNg5ps4iXypUru/Lly/+D6p9//unWrl3rEBnEOq1atcqa7n3//ffmsVm6dKlbsmSJQyQTpEvTSoK2yYJp3LixCSRqCOHZY8lJAbu6cUVABHJBICNBkklMSCb75gJMto6RbFArD6VYgVKhQoUNsnjC0CgwW0w0TmICgUDAK8ESH8Jh+fLlJiJYCsKr9vPPP5vIQGwgIhCyCBCEDvcaAoV7B3GDaEG80NOpatWqtrSCuKlRo4YJHQq94a0JBJDmRQREQATySSBtQZINL0c63pV8wkrn2MkKkvixeXuOLdLGA4XU4sCLko9Ggelcv/bxS4B6OfGCpFy5cn4PqtFFQAREwAOBtARJtuJAsjWOBy5ZGzJdQRJ/AqznBwLlrbfesjfcXDcKzBoUDSQCIiACIiACcQTSEiTZ9Gxkw9MS5lnNliCJv8Z8NAoMM2edmwiIgAiIQGETSFmQ+Ij98DFmWKbFlyCJv77SGgXiSSGOQCYCIiACIiACYSWQkiDx6c3IptclTLBzJUjir/ntt9/eIEg2aBQYLPOQoSETAREQAREQgbAQSFqQ+I738D1+voDnS5DEXi9Bj7EZPEGjwNg042QaBeaLoY4rAiIgAiIQfQJJC5JceDB8emDyNZVhECTx106NiliBEjQKDJoFltQoMF8MdVwREAEREIHoE0hKkOQyxiOXx8rF9IZRkMRfN7UtYgUKVTpjOxkHjQJzwUvHEAEREAERKE4CZQqSfHgtcuGNydV0F4IgiWdBEa7YGihffvnlBinGahSYq7tHxxEBERCB4iFQpiC58sorrZNn69atc0aFeBI6p3LsQrdCFCTxzGkUGFsDRY0CC/2u1PmLgAiIQPgIlClIwnfKhXVGURAk8cQpcY5AoUAbSz1qFFhY96TOVgREQATCSECCxPOsRFGQxCMrrVEgsSg0bJOJgAiIgAiIQGkEJEg83x/FIEjiEZbUKDBIM27QoIFn6hpeBERABESg0AhIkHiesWIUJPFI58yZs0EWD40CY2ugqFGg55tQw4uACIhAARCQIPE8SRIk/wQ8ffr0DQRK7dq1N+hkTONAmQiIgAiIQHERkCDxPN8SJGUDnjZt2nqBQqBsw4YNN0gzrl69etmDaAsREAEREIGCJiBB4nn6JEhSB/zee++ZQAmyeHbeeecNBIoaBabOVHuIgAiIQNgJSJB4niEJkswBI0wCcYJQUaPAzJlqBBEQAREIG4H1gmTPPfd0kydPXn9+BBr27t3bXXjhhW7TTTcN23kXzPlIkGR3qspqFEiwbPny5bN7UI0mAiIgAiLgncAGgoSmameddZb7+++/3eeff25u8hEjRriTTz7Z+4lE9QASJH5ntrRGgdy/e+21l98TyGB0Csx98803btGiRY7qt0uXLnXLly93K1ascJTvp+AcfYZWr17t1qxZ43777Te3bt06hyjjb5R7C/FVoUIFV6lSJbfxxhu7KlWqOJa0yGTaYost3FZbbeVq1KjhCBQmeJgXjW222cbVrVs3gzPXriIgAiKQfQIbCJJDDjnEXXTRReuPctRRR9l/P/30027JkiVu4MCBVqFzl112cTfddJP797//7UaOHOm++uorx5crLexvvPFGK/n++OOP25ch/0/peb5Eb7jhBnfvvfe633//3fXo0cNdd9119iXap08fG4vjkCJ6zDHHuDvuuMO+bD/66CN3/fXXu7fffttc9RdccEGoHzLxUyRBkv2btrQRS2oUGKQZt2vXLqcnhHCYOXOmmzVrlvv0009N6FOnZf78+SYi6tevv14g1KpVy4QDfzdbbrmlq1atmtt8881NZPB3Urly5YTeH/62EGaIFsTLqlWr3E8//eS+//57EzcIHf5+AwG0YMECEzeNGjWyonVNmjRxTZs2dc2aNXPNmzc3oSMTAREQgVwT2ECQHHDAAe68884z8YAQQEjcdtttJhh23XVX+4I8//zz3euvv25Cg7e4u+66y1166aXuoIMOMrFAH5rXXnvNxMaECRPsd3xZPvTQQ+6cc84xUcKXHoKEJaFrrrnGBctFDz/8sH2Bnn322e6NN95w7du3ty9L/j3llFNM5Lz00kv25V4oX5oSJLm+pTc83g8//LBBijHiObaTcbYbBTL+lClT3NSpUx3ZQ/wd4ZVo0aKFIzh3p512snt6hx12MJGRL0O8zJ071wQSLwF0eJ4xY4Z5a1q1auXg0rZtW4eAI+tJJgIiIAK+CZQYQ8KBTz/9dBMWdHvlC4ovW6ps8tbH29zw4cPdZ5995oYMGWIu53Llyrl+/frZF/KoUaPsC5i4FL7gEBWIFgQIxlLQVVddZS5rBMmBBx7oLr/8cvsdX4SnnnqqCSFESKdOnUyAPP/88+7444+3N0HeFgvBJEjCNUt4CwiMDX7wHATeE/7F+5eKIcoR6BMnTjTvIYJ6jz32cLvvvruJeLx6+RQeqVwL2/K39cEHH7j333/fvfvuu/b3i8eGv98OHTq4/fbbz5aCZCIgAiKQbQIbCBK+QM844ww7xtZbb21r0dhTTz1lyyjxdvfdd5tbmDesRx991H7NG1b37t3ti2y77bYzb0f//v3N9YwH5LDDDrPt+BLff//9TdwgSBAfeEywjh07mncGcYPoQbjQcZbxEEcSJNm+DYp3PO7XQJyQyZNMo8Bvv/3WjR071jpSjx8/3u5XBDX3M96/qBlLTng9X3nlFfN68oLA32eXLl1cnTp1ona5uh4REIE8ESg1hiQ4J76I8G7wNhmIFEQI69/33XffBoKE5RRcvAgVPBoDBgyw3yN0iElBZGCIGX7PFxyCpG/fvq5nz54bCBK+6LfffnvztiCIcDHzBitBkqe7pQgOixcwtgYKQaSBB4X4DH6HCOFePvzww13Xrl0tdqpY7I8//nBjxoxxzz33nMV8IU66detmLyEyERABEciEQFKCBDc0kfq33HKLCYxXX33Vde7c2WI5+HKK9ZDwBc16+WWXXWYZAgTnsY7O2ydeFJZgWFPnbfKII46wrJ6SBAnubrw2BOMxzplnnunuv/9+98svv7hNNtkkk+vO2b5asskZai8H4r7lvmdJhiVI7kGEc6HEMHmB8r9B//rrL/fII49YfBgvCyeeeKJ5OsnikYmACIhAqgSSEiQM+sQTT2zwFkTmCxk5/Ev2AMsxGMGorDUHnhQ8G8SL4F3By0LgHIbYGDdunC0NlSRI8KrgGn7xxRdtH8TLY489ZmImWCJK9YJzvb0ESa6JZ+d4ZMHceeedbujQoebVI54KQSJLTICgWLyeLLEi2nhxIYtHJgIiIALJEkipUiueCVza1DAoLbCNtMOvv/7avpBii6qRvcP+FStWtLeoZN8yCXylnwljkbHDDxk/hWASJIUwS///HFmWQWSTDUbWGFlneOdkyRFgqRaPEmUBeGG55JJLVFgxOXTaSgSKnkBKgqToaaUBQIIkDWh52mX06NHu4osvNg/c1VdfbYXEAiNolaXKWMPLh3hh+3Ts119/tYc1dUmIlUpk1AvBG0iMRjaWKQlOJeWebCOfRtYdWXMcD0bHHnusz8NpbBEQgQgQkCDxPIkSJJ4BZ2F4HvosMZDmSkE+Ulvjjc9atmxpXhMMbyFtFZ588kmHsEgntZcYjHfeecdS6ksSG9RRwUNDHFU2MlpIU6b2SK4KxJFNR0FFUqFZ/sI7KhMBERCBRAQkSDzfFxIkngFnODzxTwRjIjbuueeeEkdDkFCGnirEgVF3ZN9997XlSTLOKIZ27rnn2gOfeKnbb7/dxARLlXgJCAClIiqeFaoQkxJPMULiogj0ZpnjwQcfNIFz2mmn2XIH8Vgch0Dxl19+2VJtiWe59dZbLaCcwPFElYw5FvWBYo2YLKqxsv2zzz5bYvVk7lnaSHAOgwcPtiVSll8IWMVKus7SpoIsuunTp1tl5x133DHDWdPuIiACUSQgQeJ5ViVIPAPOYHgKgJG+S7A04qA0Q5DQ3gCvCEYtkmuvvdYqExMAyxIIxQIJ6GTMm2++2Uq4k6VDvRKWSR544AErJMhSxnHHHWcZYyzZkKGCJwSxQSo8AofCgCx3UAIecYOA4F+2J2Ac4YPngSKCiSoZf/HFF1Z9FUPIILb4l+KFwZINx09UPRnxwXGoJotXAy8Q5066PXVaSrrOsqYCgYYH6plnnjGvkEwEREAEYglIkHi+HyRIPANOc3i8GEF14GSaRyJISP2NN+JOiO/gQUubhYULF1qwNuPjCSCWgsJ+9IwZNGiQ7U7KPM3vYgXJJ598YrV2WOLAO0EqPan29LsJlmzISKORHl6GoIhgWZWMKfxGuXpEF3ExsTEkiJlE1ZM5dwQJ14sHCC8MhQ3xJlE3qKTrRKiUZQgbqjVT2wjBIxMBERCBgIAEied7QYLEM+A0h+ehT9VgPATJWBBDEnhI8GjQX4nYDjwkeEaGDRv2j6Gocsq+LMXQvBKjHQOCI1aQUIUYYUQRQDwgLCOR6cNySbwgYV+WfrDSKhnTxJKiboxHMTcKuMUKkpKqJxMfEx9sy32M3nMjlAAADGlJREFUaCKFv6TrZDkoGWO5iUq3eI9kIiACIiBBkqN7QIIkR6BTOAxLJixpELuRrCWKIaE+Dt4OljIQGSyJEO+BUeGVwoHEiyAeED5BWwbEC4ImVpAQ7Ik3hB9EA+0WWBI68sgj/yFI8FTgfUEIlVbJmCUdPCiIIrwrWKwgwfuRqHoyy0MIEto0BI31AkFCddaSrjOVgFWybvCQ4D2SiYAIiAAE5CHxfB9IkHgGnOLweDS23XZbi9NIpaJoIkFCBeLWrVtbQz1iSVj+oLQ8IoRaHHTC5ngEhyIKKC6IEEEIUPAvVpDgwaCTNUtALOcQF3L00UdbM0lq/iBu6BLMkk0gSAguLamSMR4IHvr0oaLRH0YmDx2IgxgSCr8lqp5M/EpJgoRYmZKuM5US+tQWolEnS1zUNZKJgAiIgASJ53tAgsQz4BSHZxmEhyBVRVMxBAnLPFdcccX63Sjyx1ILXgj6ueAFISsFwyOBuCBLhjgS4jcILOVz4kn4QbAESyMsqxDoScwH/01WDaKCgoBUMqZZ5YIFCyybh8BYxAmNKUuqZExl5PiYF7JzaNcQCJKSqidXqVIloSAhS4bzKuk6U+HJtpwP4pAgWpkIiIAISJB4vgckSDwDTnF4Yiros5RuMbOyDrd8+XLLuGEppXLlyrY5YoLKwnzGkgwBqcRbkCkTa9RDYZkEj0h8gCj1Q0qqjpxJJeN0qycnus6y2MT/nkJzLEvhVZKJgAiIgASJ53tAgsQz4BSH56GOZyOXrQfwoFCCnkwX0nhZKnnvvfeKvjcOLIhRQWzJREAERECCxPM9IEHiGXCKw7PkkutASiqyEiNCwCuCiHojzZs3T/HMo7l5PuYjmiR1VSJQ+AQkSDzPoQSJZ8ApDo8gIKCVwFFZfgngISEGh0BfmQiIgAhIkHi+ByRIPANOcXhiSC699FIr2S7LLwHFkOSXv44uAmEjIEHieUYkSDwDTnH4G2+80bJVUs2ySfEwBbM5LEgfJsU416Ysm1wT1/FEINwEJEg8z48EiWfAKQ5PXRBSZwlsTaUOSYqHKZjN6bNDsC1F1nJpqkOSS9o6lggUBgEJEs/zJEHiGXAaw6dTqTWNw2ywC03z6AET9NDBU0NBsD/++MNSX/HYbLXVVlabgyqtJX1Omi61VO69915HaXhqilAllsBZCq7RAbhOnTpu9erVVgOFarKIL4698847WzE2aqFQA6VmzZqW/kyqMRVhqcKaK1Ol1lyR1nFEoHAISJB4nisJEs+A0xw+1V42aR7GdkM44I1BCFFZ9eKLLzZxQPdbhAUpwRRRI/2VyqwIBJrPJfqc0u+JOvRS04RU5qDcOwGjBPDiEaL3DTEzhx9+uJWvv/LKK63rL43ySEGmMSBVYlu1apXJZSa9r3rZJI1KG4pAURGQIPE83RIkngGnOXyq3X7TPIztRhYJKb9USaWgGFVbP/74Y/fOO+84Ou7SDwexglHNle68CIySPk/UoZfS8mUJErr2UoUVIUJn4VWrVrlcL9mo228md5L2FYFoE5Ag8Ty/EiSeAWcw/AcffGDN5YihOPvsszMYqfRdqcDKsgzeCERBvXr1LI4FQULHXR7S8UGlpX3+8MMPW6di7PXXX7dlFzwisYKE/jo1atRY7yEJysWzz7vvvuv22GMPKz2fS0GCRwhvzDPPPGNl8mUiIAIiEEtAgsTz/SBB4hlwhsPTqO7EE090LVu2NO+ED3vuuefMO0JjO47DMg2dhhEkLB0Rv0FnXoxOu/R3GTRoUMLPWcZJ1KGXxn0Iknnz5lmJejwwLMEESzZcI4Gk+RIkffv2dfTCGTlypHUqlomACIhAPAEJEs/3hASJZ8BZGB4PxoABA8xzwBs8jfSyaTTcwwvCA5nlm4MPPthVrFjRysfjNXjkkUfMa/DLL79Yj5u5c+e6cePGJfyciq+JOvQiaCj2RnzKmWeeaQKHY5YlSAh6Pemkk2y7VLr1JssHDw7ngkdm6NChdt0yERABEUhEQILE830hQeIZcBaHJ7CUBzpLIMR51K5dOyujf/vtt26vvfay+BGsX79+jiwbPCVdu3Y1gfLRRx9Zl18e3tdcc41btmxZws9L6tBL5gznHHQjJjiWpZ2yBAnn9u9//9u8K8TVZMvocExcDEG4119/vSOrRiYCIiACpRGQIPF8f0iQeAac5eFJl+UBSmrtBRdcYJkuW265ZcZHIV6DWh8NGjQwT8TKlSvNW7Dxxhvb2IsWLbJ03HgPQqLPS+vQy7hYKqXxSTFes2aNCaJM7fvvv3e33HKLu+mmm9xFF13kLrnkErfppptmOqz2FwERKAICEiSeJ1mCxDNgT8MjHghCZZkBjwb1QUjVlSUmMHv2bKulMnz4cFsyYgmsUaNGwiUCIiACSROQIEkaVXobSpCkxy0sexEIOmLECPfggw9aMGavXr1cz549HfNa7EYxNuJfHnroIYt7IXC2T58+qoBb7DeGrl8E0iQgQZImuGR3kyBJllT4t3v88ccd2SwElpLpQqExYkB8BIOGlQbLO1SDJXOIyq6dOnVy3bp1c927dw/rKeu8REAECoSABInniZIg8Qw4D8MTCDp27Fir4YE46dixozvwwAMtGLZ58+Z5OCO/h5w5c6YFp1I9lqJqiJBDDz3UdenSxcrUy0RABEQgGwQkSLJBsZQxJEg8A87z8JR7J7V14sSJVo2VgmSkuO6+++5WJr5NmzbrA1fzfKpJHZ7gVgrGvf/++5YGPXnyZOux0759e+uNQ0o0JellIiACIpBtAhIk2SYaN54EiWfAIRueRnZTpkxxU6dOtUJopPNSmbVFixYWFEtZ+CZNmrgddtghr0IF4UHcB6m+9LohKHXGjBmW7UNBNSqpUta+Xbt2rmHDhiGjrNMRARGIIgEJEs+zKkHiGXDIhyfdlyUPes1QFRYBQDVVsngqVapkJeRpvEfn31q1alkHXjwSpBpTG4QS8vSfIT24cuXKrnz58v+4YtKA165da6m7pC3To4ZS8qTg4rFZunSpo34JNUkI0l2wYIGjGBxZMI0bNzaB1LRpUyvKxpKTAnZDflPp9EQgogQkSDxPrASJZ8AFPHwgEPBKUEgM4UDxNEQES0HUFKH3DSIDsYGIWLdunUOAIHS4txAoFSpUMHGDaEG8UE+EOiQsrSBu6GmD0KHQG96aQAAVMDqdugiIQAQJSJB4nlQJEs+Ai2x4Um3jBUm5cuWKjIIuVwREIIoEJEg8z6oEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxPowSJZ8AaXgREQAREIBIEJEg8T6MEiWfAGl4EREAERCASBCRIPE+jBIlnwBpeBERABEQgEgQkSDxP47777usmTZrk+SgaXgREQAREQAQKm0D79u3d/wNuTl4yYOfC9wAAAABJRU5ErkJggg=)
