import assert from 'node:assert/strict';
import {world} from '../server/campaign.mjs';
import {advance} from '../server/navigation.mjs';
import {nativeCell} from '../server/native-state.mjs';
import {newPersonal,validatePortable} from '../server/portable.mjs';
const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const open={progress:new Proxy({},{get:(_,k)=>k==='mansion_switch'?false:true}),league:4};
const maps=Object.values(world.maps).filter(m=>!m.aliasOf),same=(a,b)=>a.map===b.to&&a.x===b.tx&&a.y===b.ty;
let portals=0,arrows=0,edges=0,obstacles=0,facades=0;
for(const m of maps){
 for(const w of [...m.doors,...m.portals]){
  const contact=Object.entries(dirs).filter(([dir,[dx,dy]])=>(!w.dir||w.dir===dir)&&m.grid[w.y-dy]?.[w.x-dx]!==undefined&&![2,7,10].includes(nativeCell(m,w.x-dx,w.y-dy,open).grid));
  if(contact.length){assert(contact.some(([dir,[dx,dy]])=>same(advance({map:m.id,x:w.x-dx,y:w.y-dy},[dir],open),w)),m.id+' warp '+w.nativeWarp);portals++;}
  if(w.dir&&m.native.behavior[w.y][w.x]>=98&&m.native.behavior[w.y][w.x]<=101){assert(same(advance({map:m.id,x:w.x,y:w.y},[w.dir],open),w),m.id+' standing exit');arrows++;}
 }
 for(const c of m.nativeConnections){assert(same(advance({map:m.id,x:c.x,y:c.y},[c.dir],open),c),m.id+' edge '+c.dir);edges++;}
 for(const b of m.blockers){
  assert(b.x>=0&&b.x<m.w&&b.y>=0&&b.y<m.h,m.id+' off-map obstacle');
  const contacts=Object.entries(dirs).filter(([dir,[dx,dy]])=>m.grid[b.y-dy]?.[b.x-dx]!==undefined&&![2,7,10].includes(nativeCell(m,b.x-dx,b.y-dy,open).grid));
  assert(contacts.some(([dir,[dx,dy]])=>{const from={map:m.id,x:b.x-dx,y:b.y-dy},closed=advance(from,[dir],{progress:{}}),cleared=advance(from,[dir],open);return !(closed.x===b.x&&closed.y===b.y)&&cleared.x===b.x&&cleared.y===b.y;}),m.id+' obstacle '+b.id);obstacles++;
 }
 for(const b of m.buildings.filter(b=>b.nativeFacade)){
  facades++;assert(b.x>=0&&b.y>=0&&b.x+b.w<=m.w&&b.y+b.h<=m.h);
  assert(b.door.x>=b.x&&b.door.x<b.x+b.w&&b.door.y===b.y+b.h-1);
  assert(!m.buildings.some(a=>a!==b&&a.nativeFacade&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),m.id+' overlapping facades');
  assert(![...m.doors,...m.portals].some(w=>(w.x!==b.door.x||w.y!==b.door.y)&&w.x>=b.x&&w.x<b.x+b.w&&w.y>=b.y&&w.y<b.y+b.h),m.id+' erased door');
 }
}
const mart=world.maps.viridian.doors.find(w=>w.to==='viridian_shop');
const inside=advance({map:'viridian',x:mart.x,y:mart.y+1},['up'],open);
assert.equal(inside.map,'viridian_shop');assert.equal(inside.y,6);
assert.equal(advance(inside,['down'],open).map,'viridian','enter and immediately leave without turning around');
const mansion=newPersonal('Test');Object.assign(mansion.trainer.position,{map:'mansion_1',x:23,y:10});mansion.trainer.progress.mansion_switch=true;
assert.equal(validatePortable(mansion).trainer.position.x,23,'save/import preserves opened tiles');
const swimmer=newPersonal('Surf');swimmer.trainer.progress={surf_lesson:true,badge5:true};
const sea=world.maps.cerulean,sy=sea.grid.findIndex(r=>r.includes(3)),sx=sea.grid[sy].indexOf(3);
swimmer.trainer.position={map:sea.id,x:sx,y:sy,dir:'down'};
assert.deepEqual(validatePortable(swimmer).trainer.position.map,sea.id);
assert.equal(validatePortable(swimmer).trainer.position.x,sx,'Surf saves retain their valid water position');
assert.equal(validatePortable(swimmer).trainer.position.y,sy);
const plate=world.maps.victory.npcs.find(n=>n.data?.key==='native_plate');
assert(plate.staticObject);assert(Object.entries(dirs).some(([dir,[dx,dy]])=>{const r=advance({map:'victory',x:plate.x-dx,y:plate.y-dy},[dir],open);return r.x===plate.x&&r.y===plate.y;}),'interaction markers never add invisible walls');

console.log(`PASS ${maps.length} maps: ${portals} usable warps, ${arrows} standing exits, ${edges} edge contacts, ${obstacles} removable obstacles, ${facades} nonoverlapping facades and opened-tile saves`);
