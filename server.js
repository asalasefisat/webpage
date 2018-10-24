var _ = require('lodash');
var http = require('http');
var browserify = require('browserify-middleware');
// var debug = require('debug')('server');
var express = require('express');
var app = express();
var server = http.Server(app);
var io = require('socket.io')(server);

var DEFAULT_PEER_COUNT = 5;
app.use(express.static(__dirname));
app.get('/js/bundle.js', browserify(['debug', 'lodash', 'socket.io-client', 'simple-peer', {'./client.js': {run: true}}]));
app.get("/", (req, res) => {
    res.sendfile('./index.html')
})

var initiator = null;
var receptor = null;
io.on('connection', function (socket) {
    console.log('Connection with ID:', socket.id);
    if (initiator == null) {
        console.log("Se conecto el iniciador");
        initiator = socket;
    } else {
        console.log("Se conecto el receptor");
        receptor = socket;
        console.log('Advertising peer %s to %s', initiator.id, receptor.id);
        receptor.emit('peer', {
            peerId: initiator.id,
            initiator: false
        });
        initiator.emit('peer', {
            peerId: receptor.id,
            initiator: true
        });
    }
    socket.on('signal', function (data) {
        var socket2 = io.sockets.connected[data.peerId];
        if (!socket2) { return; }
        console.log('Proxying signal from peer %s to %s', socket.id, socket2.id);

        socket2.emit('signal', {
            signal: data.signal,
            peerId: socket.id
        });
    });
});

server.listen(process.env.PORT || '3213');