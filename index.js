const Plugin = require('./lib/plugin');
const Trap = require('./lib/trap');

const snmp = require ('net-snmp');

const plugin = new Plugin();

const REVERSE_TRAP_ORIGIN = 1
const REVERSE_TRAP_EXTRA = 2

const STORE = {
  parents: [],
  childs: {},
  workers: {
    listener: {},
    polling: {},
  },
  links: {},
};


function setChild(item) {
  STORE.childs[item.parentid].push(item);
}

function setParent(item) {
  STORE.childs[item.id] = [];
  STORE.parents.push(item);
}

function setWorkerP({ host, port }, type, oid, interval) {
  if (!STORE.workers.polling[port]) {
    STORE.workers.polling[port] = {}
  }
  STORE
    .workers
    .polling[port][`${oid}_${interval}`] = { host, port, type, oid, interval };
}

function setWorkerL({ host, trap_port}) {
  STORE
    .workers
    .listener[`${trap_port}`] = { host, port: trap_port};
}

function setLink(oid, dn) {
  if (!STORE.links[oid]) {
    STORE.links[oid] = {};
  }
  STORE.links[oid][dn] = { dn };
}

function mappingGet(parent, child) {
  if (child.get_oid !== '') {
    setWorkerP(parent, 'get', child.get_oid, child.interval);
    setLink(child.get_oid, child.dn);
  }
}

function mappingTable(parent, child) {
  if (child.get_oid !== '') {
    setWorkerP(parent, 'table', child.table_oid, child.interval);
    setLink(child.get_oid, child.dn);
  }
}

function mappingTrap(type, item) {
  if (type === REVERSE_TRAP_EXTRA && item.trap_oid  !== '') {
    setLink(item.trap_oid, item.dn);
  }

  if (type === REVERSE_TRAP_ORIGIN && item.get_oid !== '') {
    setLink(item.get_oid, item.dn);
  }
}

function mappingLinks(parent, child) {
  switch (child.type) {
    case 'trap':
      mappingTrap(REVERSE_TRAP_ORIGIN, child);
      break;
    case 'get':
      mappingGet(parent, child);
      mappingTrap(REVERSE_TRAP_EXTRA, child);
      break;
    case 'table':
      mappingTable(parent, child);
      mappingTrap(REVERSE_TRAP_EXTRA, child);
      break;
    default:
      break;
  }
}

function createStruct() {
  STORE.parents
    .forEach(parent => {
      const childs = STORE.childs[parent.id];

      setWorkerL(parent);
      childs
        .forEach(child => mappingLinks(parent, child));
    })

    Object
      .keys(STORE.links)
      .forEach(key => {
        STORE.links[key] = Object.keys(STORE.links[key]).map(k => STORE.links[key][k]);
      })
}

function initStore(data = []) {
  data
    .forEach(item => {
      if (item.parentid) {
        setChild(item);
      } else {
        setParent(item);
      }
    });
    createStruct();
}

function messageTrap(data) {
  if (STORE.links[data.oid]) {
    STORE.links[data.oid]
      .forEach(i => plugin.setDeviceValue(i.dn, data.value))
  }
}

function workerListener(item) {
  const trap = new Trap({ port: item.port });
  trap.on('data', messageTrap);
}

function workerPolling(port, pool) {
    const session = snmp.createSession (null, 'public', { sourcePort: 161, version: snmp.Version2c, });

/*
    session.get('192.168.0.144', ['1.3.6.1.2.1.1.5.0'], (varbinds, item) => {
      console.log(item[0].value.toString())
    });

    session.get('192.168.0.142', ['1.3.6.1.2.1.1.5.0'], (varbinds, item) => {
      console.log(item[0].value.toString())
    });
*/


   session.subtree('192.168.0.142', '1.3.6.1.2.1.6.13.1', (varbinds) => {
       varbinds.forEach(item => console.log(item.oid, item.value.toString()))
   }, () => {});


}

function startWorkers(data = []) {
  Object
    .keys(STORE.workers.listener)
    .forEach(key => workerListener(STORE.workers.listener[key]));

  Object
    .keys(STORE.workers.polling)
    .forEach(key => workerPolling(key, STORE.workers.polling[key]));
}


plugin.on('start', () => {
  initStore(plugin.getChannels());
  startWorkers();
});






 /*
const trap1 = new Trap({ port: 162 });
const trap2 = new Trap({ port: 162 });


trap1.on('data', data => console.log(1, data))
trap2.on('data', data => console.log(2, data))




 const session2 = snmp.createSession ('192.168.0.144', 'public', { sourcePort: 161 });


 session.subtree('1.3.6.1.4.1.40418.2.6.2.1', (varbinds) => {
     varbinds.forEach(item => console.log(2, item.oid, item.value.toString()))
   }, () => {});


 session2.subtree('1.3.6.1.4.1.40418.2.6.2.1', (varbinds) => {
   varbinds.forEach(item => console.log(2, item.oid, item.value.toString()))
 }, () => {});



 session.get(['1.3.6.1.4.1.40418.2.6.1.1.1.1.3.519134465'], (err, val) => {
   console.log(err, val)
 });

 */
