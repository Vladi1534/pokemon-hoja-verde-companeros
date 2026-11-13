import assert from 'node:assert/strict';
import {world,chapters,done,interact} from '../server/campaign.mjs';
import {advance} from '../server/navigation.mjs';
import {nativeCell} from '../server/native-state.mjs';
import {items} from '../server/creatures.mjs';
export function unlockedReach(){
 const queue=[],seen=new Set(),tiles=new Set(),add=p=>{const key=p.map+':'+p.x+','+p.y+':'+!!p.switch;if(seen.has(key))return;seen.add(key);tiles.add(p.map+':'+p.x+','+p.y);queue.push(p);};add(world.spawn);
 for(let i=0;i<queue.length;i++){
  const p=queue[i],state={progress:new Proxy({}, {get:(_,k)=>k==='mansion_switch'?p.switch:true}),league:4};
  for(const dir of ['up','down','left','right'])add(advance(p,[dir],state));
  for(const n of world.maps[p.map].npcs)if(Math.abs(n.x-p.x)+Math.abs(n.y-p.y)<=2){if(n.data?.key==='native_statue')add({...p,switch:!p.switch});if(n.data?.key==='native_travel')for(const d of n.data.options)add({...p,map:d.map,x:d.x,y:d.y});}
 }
 return {tiles,maps:new Set(queue.map(p=>p.map)),states:seen.size};
}
const native=Object.values(world.maps).filter(m=>!m.aliasOf&&!m.extension);assert.equal(native.length,425);assert.equal(new Set(native.map(m=>m.native.id)).size,425);
for(const m of native){assert.equal(m.grid.length,m.h);assert(m.grid.every(row=>row.length===m.w));for(const p of [...m.doors,...m.portals,...m.nativeConnections]){const d=world.maps[p.to];assert(d,m.id);assert(p.tx>=0&&p.tx<d.w&&p.ty>=0&&p.ty<d.h,m.id+' → '+d.id);}for(const i of m.items)assert(items[i.key],i.key);}
const reach=unlockedReach(),near=p=>[[0,-1],[0,1],[-1,0],[1,0],[0,-2],[0,2],[-2,0],[2,0]].some(([dx,dy])=>reach.tiles.has(p.map+':'+(p.x+dx)+','+(p.y+dy)));
for(const chapter of chapters){const p=world.storyAnchors[chapter[3]];assert(p,chapter[3]);assert(near(p),'No walking route to '+chapter[3]);}
assert(near(world.storyAnchors.ember_ruby),'Ruby chamber is accessible after National Dex');
const gym=world.maps.vermilion_gym;assert.equal(nativeCell(gym,5,6,{progress:{}}).grid,7);assert.equal(nativeCell(gym,5,6,{progress:{circuit:true}}).grid,0);
const mansion=Object.values(world.maps).find(m=>m.native.name==='PokemonMansion_1F');assert.equal(nativeCell(mansion,23,10,{progress:{}}).grid,7);assert.equal(nativeCell(mansion,23,10,{progress:{mansion_switch:true}}).grid,0);
assert(world.maps.route2.encounters.land_mons.some(p=>p.id===32));
console.log('PASS 425 native maps, all destinations, '+reach.maps.size+' connected maps, every campaign objective, door conditions and original-coordinate pickups');
