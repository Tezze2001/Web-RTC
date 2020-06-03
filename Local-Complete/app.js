// COMMON INCLUDES
var fs = require('fs');

// PEER SERVER
const { PeerServer } = require('peer');
const peerServer = PeerServer({ port: 9000, path: '/myapp' });

// client connection
peerServer.on('connection', (client) => { 
    console.log({'Client connesso': {Ping : client.lastPing, Id : client.id, Token : client.token}});
});

// client disconnect
peerServer.on('disconnect', (client) => {
    console.log({'Client disconnect': {Ping : client.lastPing, Id : client.id, Token : client.token}});
});


// WEB SERVER
var http = require('http'); // 1 - Import Node.js core module
var server = http.createServer(function (req, res) {   // 2 - creating server
    /*var req = req.url.split('/');
    console.log(req);
    if (req[1].localeCompare('richiesta'))
    {

    }
    else if(req[1].localeCompare('url'))
    {
        var risposta;
        for (let i=1; i<req.Length; i++)
        {
            risposta += req[i];
        }
        console.log(risposta);
        res.writeHead(200, { 'Content-Type': 'text/html' }); 
        res.write(
            risposta
        );
        res.end();
    }
    else
    {*/
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
    //}
    
}).listen(5000); //3 - listen for any incoming requests
