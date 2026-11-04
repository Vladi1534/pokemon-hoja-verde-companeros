const assert=require('node:assert/strict');
const world=require('../online-server/server/world.json'),D=[[0,1],[0,-1],[1,0],[-1,0]],key=(m,x,y)=>m+':'+x+':'+y;
const walkable=(m,x,y,cut=true)=>m.grid[y]?.[x]!==undefined&&![2,3,7,10].includes(m.grid[y][x])&&![...m.npcs,...m.signs].some(n=>n.x===x&&n.y===y)&&(cut||!(m.blockers||[]).some(n=>n.x===x&&n.y===y));
function reach(cut){const q=[world.spawn],seen=new Set();for(let i=0;i<q.length;i++){const p=q[i],k=key(p.map,p.x,p.y);if(seen.has(k))continue;seen.add(k);const m=world.maps[p.map];for(const [dx,dy]of D){const x=p.x+dx,y=p.y+dy;if(!walkable(m,x,y,cut))continue;const t=m.portals.find(p=>x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h),d=m.doors.find(p=>x===p.x&&y===p.y);q.push(t?{map:t.to,x:t.tx??21,y:t.ty??3}:d?{map:d.to,x:d.tx??10,y:d.ty??15}:{map:p.map,x,y});}}return seen;}
const seen=reach(true),closed=reach(false),adjacent=(set,m,x,y)=>D.some(([dx,dy])=>set.has(key(m,x+dx,y+dy)));
assert.equal(new Set([...seen].map(k=>k.split(':')[0])).size,Object.keys(world.maps).length);
for(const [id,m]of Object.entries(world.maps)){
 for(const p of [...m.npcs,...m.items,...m.signs,...m.blockers||[]])assert(adjacent(seen,id,p.x,p.y),id+': unreachable '+(p.id||p.text));
 for(const p of m.portals){assert(adjacent(seen,id,p.x,p.y),id+': portal '+p.to);assert(walkable(world.maps[p.to],p.tx??21,p.ty??3),id+': unsafe landing '+p.to);}
 if(!m.inside)for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if((x===0||y===0||x===m.w-1||y===m.h-1)&&walkable(m,x,y))assert(m.portals.some(p=>x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h),id+': false exit '+x+','+y);
}
const student=world.maps.pewter.npcs.find(n=>n.id==='pewter_town_0');assert(adjacent(closed,'pewter',student.x,student.y));
for(const id of ['pewter','celadon','fuchsia']){const item=world.maps[id].items.find(i=>i.id===id+'_garden_reward');assert(!adjacent(closed,id,item.x,item.y),id+': Cut reward must remain gated');}
assert.equal(world.maps.saffron.portals.find(p=>p.to==='route5').y,0);
assert(world.maps.route4.npcs.length&&world.maps.route4.signs.length&&world.maps.route4.items.length);
console.log('PASS all '+Object.keys(world.maps).length+' maps, portals, landings, NPCs and items reachable; no false boundary exits; optional Cut gardens stay gated');
