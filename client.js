var Peer = require('simple-peer');
var io = require('socket.io-client');
// var debug = require('debug')('client');
var socket = io.connect();
var peers = {};
var useTrickle = true;

socket.on('connect', function () {
  console.log('Connected to signalling server, Peer ID: %s', socket.id);
});

socket.on('peer', function (data) {
  var peerId = data.peerId;

  var peer = new Peer({ initiator: data.initiator, trickle: useTrickle });

  console.log('Peer available for connection discovered from signalling server, Peer ID: %s', peerId);

  socket.on('signal', function (data) {
    if (data.peerId == peerId) {
      console.log('Received signalling data', data, 'from Peer ID:', peerId);
      peer.signal(data.signal);
    }
  });

  peer.on('signal', function (data) {
    console.log('Advertising signalling data', data, 'to Peer ID:', peerId);
    socket.emit('signal', {
      signal: data,
      peerId: peerId
    });
  });
  peer.on('error', function (e) {
    console.log('Error sending connection to peer %s:', peerId, e);
  });
  peer.on('connect', function () {
    console.log('Peer connection established');
    peer.send("hey peer");
  });
  peer.on('data', function (data) {
    console.log('Recieved data from peer:', data);

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      peer.addStream(stream);
    });
  });
  peer.on('stream', function (stream) {
    document.getElementById('remoteVideo').srcObject  = stream;
  });
  peers[peerId] = peer;
});
