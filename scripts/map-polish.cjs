// Geometry changes are generated identically for the browser and authoritative server.
module.exports=function(world){
 const maps=world.maps,dirs=[[0,1],[0,-1],[1,0],[-1,0]];
 const rect=(m,x,y,w,h,t)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(m.grid[yy]?.[xx]!==undefined)m.grid[yy][xx]=t;};
 // A horizontal foothill route: clear destination, grass detours and a lookout.
 const m=maps.route4;m.worldRevision=4;m.arrival={x:4,y:18};
 m.grid=Array.from({length:m.h},()=>Array(m.w).fill(2));m.props=[];m.items=[];m.signs=[];m.npcs=[];
 rect(m,2,9,40,16,0);rect(m,0,18,44,2,1);
 rect(m,5,10,9,6,4);rect(m,27,20,12,4,4);
 rect(m,17,9,8,7,3);rect(m,17,9,8,2,2); // rocky pool below the mountains
 rect(m,8,14,2,10,1);rect(m,8,23,15,2,1);rect(m,22,18,2,7,1);
 rect(m,32,12,2,8,1);rect(m,32,12,7,2,1);
 m.props.push({x:35,y:11,kind:'bench'},{x:38,y:11,kind:'lamp'});
 m.items.push({id:'route4_cache',x:5,y:23,key:'potion',qty:2},{id:'route4_lookout_cache',x:38,y:12,key:'ball',qty:1,hidden:true});
 m.signs.push({x:4,y:17,text:'Monte Moon ← · Ciudad Celeste →. La senda principal bordea la montaña.'},{x:31,y:17,text:'Mirador ↑ · Un excursionista perdió una Poké Ball junto al banco.'});
 m.npcs.push({id:'route4_walker',x:12,y:17,homeX:12,homeY:17,dir:'down',role:'talk',look:'hiker',name:'Excursionista del mirador',data:{lines:['¡Ya se ve Ciudad Celeste! Sigue el camino hacia el este.','La hierba del sur y el mirador tienen pequeños desvíos. Si sales de la senda, mira junto a las flores.']}});
 for(const p of m.portals){p.y=18;p.h=2;p.w=1;p.x=p.to==='moon'?0:m.w-1;p.landing={x:p.x?m.w-3:2,y:18};}
 for(const source of Object.values(maps))for(const p of source.portals)if(p.to==='route4'){const back=m.portals.find(q=>q.to===source.id);if(back)Object.assign(p,{tx:back.landing.x,ty:back.landing.y});}
 // Restore purposeful rewards in old cul-de-sacs, with stable one-time IDs.
 for(const id of ['route1','forest','route3','moon','route24','route6','route9','rocktunnel','route8','route12','safari','sea20','victory']){
  const map=maps[id];if(!map)continue;
  const key=['moon','rocktunnel','victory'].includes(id)?'repel':'potion';
  if(![...map.npcs,...map.items,...map.signs].some(n=>n.x===5&&n.y===23)){
   map.items.push({id:id+'_cache',x:5,y:23,key,qty:1});map.grid[23][5]=map.kind==='cave'?6:0;
  }
  if(![...map.npcs,...map.items,...map.signs].some(n=>Math.abs(n.x-38)+Math.abs(n.y-12)<=3)){
   map.items.push({id:id+'_lookout_cache',x:38,y:12,key:'antidote',qty:1,hidden:true});map.grid[12][38]=map.kind==='cave'?6:0;
  }
 }
 // Seal authored paths at missing links. Only real transitions reach the boundary.
 for(const map of Object.values(maps))if(!map.inside){
  for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++){
   if(x!==0&&y!==0&&x!==map.w-1&&y!==map.h-1)continue;
   if(map.portals.some(p=>x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h))continue;
   if(![2,3,7,10].includes(map.grid[y][x]))map.grid[y][x]=map.kind==='cave'?7:map.kind==='sea'?3:2;
  }
  map.worldRevision=4;map.arrival ||= {x:21,y:18};
  // Direction signs next to exits make gates and destinations readable on foot.
  for(const p of map.portals.filter(p=>p.x===0||p.y===0||p.x===map.w-1||p.y===map.h-1)){
   const x=p.x===0?3:p.x===map.w-1?map.w-4:p.x+2,y=p.y===0?3:p.y===map.h-1?map.h-4:p.y-1;
   if([0,1,4,5,6,8,11].includes(map.grid[y]?.[x])&&![...map.npcs,...map.items,...map.signs,...map.doors].some(n=>Math.abs(n.x-x)+Math.abs(n.y-y)<2)&&dirs.filter(([dx,dy])=>![undefined,2,3,7,10].includes(map.grid[y+dy]?.[x+dx])).length>=3)
    map.signs.push({x,y,text:maps[p.to].name+' '+(p.x===0?'←':p.x===map.w-1?'→':p.y===0?'↑':'↓')});
  }
 }
};
