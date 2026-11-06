const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const world=require('../online-server/server/world.json'),source=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync(require('node:path').join(__dirname,'../assets/leafgreen-world/runtime-world.json.gz')))).maps;
for(const m of Object.values(world.maps).filter(m=>!m.aliasOf)){
 const n=source[m.native.id];assert(n);assert.equal(m.w,n.w);assert.equal(m.h,n.h);
 assert.deepEqual(m.native.blocks,n.blocks.map(row=>row.map(tile=>tile&1023)),m.id+' original tiles');
 assert.deepEqual(m.native.elevation,n.elevation,m.id+' elevations');
 assert.equal(m.nativeConnections.length,n.connections.reduce((sum,c)=>sum+c.contacts.length,0),m.id+' edge connections');
}
for(const id of ['moon','moon_b1','moon_b2','forest','rocktunnel','rocktunnel_b1'])assert(world.maps[id]?.native,id);
const native=cp.spawnSync(process.execPath,['online-server/tests/native-world.test.mjs'],{stdio:'inherit'});assert.equal(native.status,0);
console.log('PASS original geometry, all 425 map dimensions, metatiles, elevations and edge contacts');
