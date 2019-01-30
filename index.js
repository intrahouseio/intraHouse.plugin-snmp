 const Plugin = require('./lib/plugin');
// const snmp =  require ('snmp-native');
const snmp = require ("net-snmp");

const ASN1 = require ('@lapo/asn1js');



const plugin = new Plugin();


const dgram = require('dgram');
const server = dgram.createSocket('udp4');

function parseVaribleValue(data) {
  return data.content();
}

function parseVarible(data) {
  if (data.length == 2) {
    return { oid: data[0].content(), value: parseVaribleValue(data[1])}
  }
  return null;
}


function parseTrap(data) {
  if (data.sub !== null) {
    const item1 = data.sub[data.sub.length - 1]
    if (item1.sub !== null) {
      const item2 = item1.sub[item1.sub.length - 1]
      if (item2.sub !== null) {
        item2.sub.forEach(v => {
          if (v.sub !== null) {
            const temp = parseVarible(v.sub)
            console.log(temp.oid, '-->', temp.value)
          }
        })
      }
    }
  }
}



server.on('error', (err) => {
  server.close();
});

server.on('message', (msg, rinfo) => {
  parseTrap(ASN1.decode(msg))
});

server.on('listening', () => {
});

server.bind(162);
var a = new Buffer('305602010004067075626c6963a449060a2b0601040182bb6202064004c0a800900201060201014304009f118c30293027060c2b0601040182bb62020602010417534e522d4552442d343a20414c41524d2d31204641494c', 'hex')
var b = new Buffer('304102010104067075626c6963a7340201030201000201003029300e06082b06010201010300430201313017060a2b06010603010104010006092b0601060301010501', 'hex')

parseTrap(ASN1.decode(b))

plugin.on('start', () => {
/*
  const session = snmp.createSession ('192.168.0.144', 'public', { sourcePort: 162 });


  session.subtree('1.3.6.1.4.1.40418.2.6.1.1.1', (varbinds) => {
    varbinds.forEach(item => console.log(item.oid, item.type, item.value))
  }, () => {});
*/

});




/*

const session = new snmp.Session({ host: '192.168.0.144', port: 161, community: 'public' })
session.getSubtree({ oid: '.1.3.6.1.4.1.40418.2.6.1.1.1' }, function (error, varbinds) {
  if (error) {
      console.log('Fail');
  } else {
    console.log(varbinds)
  }
});
*/
