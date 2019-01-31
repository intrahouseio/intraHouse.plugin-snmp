const Plugin = require('./lib/plugin');
const Trap = require('./lib/trap');

const snmp = require ('net-snmp');

const plugin = new Plugin();



plugin.on('start', () => {
  const trap = new Trap({ port: 162 });
  trap.on('data', data => console.log(data))

  /*
  const session = snmp.createSession ('192.168.0.144', 'public', { sourcePort: 161 });

  session.subtree('1.3.6.1.4.1.40418.2.6.2.1', (varbinds) => {
    varbinds.forEach(item => console.log(item.oid, item.value.toString()))
  }, () => {});


  session.get(['1.3.6.1.4.1.40418.2.6.1.1.1.1.3.519134465'], (err, val) => {
    console.log(err, val)
  });

*/

});
