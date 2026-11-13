const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const world=require('../online-server/server/world.json'),catalogue=require('../assets/native-npcs/manifest.json');
const layout=require('../native-facade-layout.js'),models=require('../landmark-layout.js');
const previews=require('../assets/heartgold-models/previews/manifest.json'),openings=require('../assets/heartgold-models/door-openings.json');
const c={};vm.runInNewContext(['data.js','people-data.js','character-data.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+'\nthis.people=ASSETS.people;',c);
let npcs=0,doors=0;
for(const m of Object.values(world.maps).filter(m=>!m.aliasOf)){
 for(const n of m.npcs){if(n.staticObject||n.look==='meowth'||n.look.startsWith('pokemon_'))continue;npcs++;
  assert(c.people[n.look],m.id+': missing sprite '+n.id+' '+n.look);
  assert(!['red','leaf','bug'].includes(n.look),n.id+': player fallback');
  if(n.look.startsWith('native_'))assert.equal(catalogue.graphics[n.nativeGraphic]?.key,n.look,n.id+': wrong native identity');
 }
 for(const b of m.buildings.filter(b=>b.nativeFacade)){
  const key=b.kind==='shop'&&b.id!=='celadon_shop'?'poke-mart-compact':models.key(b,m.id),f=previews[key],o=openings[key];
  assert(f&&o,key+': missing measured doorway');
  const crop={x:0,y:0,w:f.width,h:f.height},p=layout.panels(b,{...f,nativePixelsPerUnit:f.scale,opening:o},crop);
  assert.equal(p.opening.w,32,m.id+': visible opening must be one native cell');
  assert.equal(p.x+p.opening.x,b.door.x*32);
  assert.equal(p.strips.reduce((sum,s)=>sum+s.w,0),b.w*32);
  assert(p.strips.every(s=>s.sw>0&&s.w>=0));
  const center=p.strips[1],screenX=p.mirror?p.w-center.x-center.w:center.x;
  assert.equal(screenX,p.opening.x,key+': mirrored opening must stay on warp');
  doors++;
 }
}
for(const g of Object.values(catalogue.graphics)){
 const p=Buffer.from(require('../assets/native-npcs/sprites.json')[g.file],'base64');
 assert(p.includes(Buffer.from('tRNS')),g.key+': missing transparent palette');
 assert(Number.isInteger(g.frames)&&g.frames>0&&g.rows===1,g.key+': frame geometry');
}
console.log(`PASS ${npcs} NPC appearances, ${Object.keys(catalogue.graphics).length} source sheets and ${doors} door openings aligned to native warp width`);
