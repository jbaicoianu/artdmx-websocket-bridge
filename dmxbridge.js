const dmxlib = require('dmxnet'),
    WebSocket = require('ws');

let wss = new WebSocket.Server({
  port: 8181,
});

let dmxnet = new dmxlib.dmxnet({});
let universes = 5,
    receivers = [],
    lastpackets = [],
    listeners = [];

for (let i = 0; i < universes; i++) {
  let receiver = dmxnet.newReceiver({universe: i});

  receiver.on('data', d => {
    //console.log('got dmx ' + i + ': ', d);
    lastpackets[i] = d;
    let packed = new ArrayBuffer(514);
    let arr = new Uint8Array(packed, 2).set(d);
    let dv = new DataView(packed);
    dv.setUint16(0, i);
    listeners.forEach(ws => {
      ws.send(packed);
    });
  });
  receivers.push(receiver);
}

wss.on('connection', ws => {
  console.log('new connection', listeners.length);
  listeners.push(ws);
  for (let i = 0; i < lastpackets.length; i++) {
    ws.send(lastpackets[i]);
  }
  ws.on('message', msg => {
    console.log('got message', msg);
  });
  ws.on('close', err => {
    let socketid = listeners.indexOf(ws);
    if (socketid > -1) {
      listeners.splice(socketid, 1);
      console.log('Client disconnected', socketid, listeners.length);
    } else {
      console.log('Error: unknown socket disconnected', socketid, ws);
    }
  });
});

