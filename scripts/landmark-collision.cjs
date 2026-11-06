const layout=require('../landmark-layout.js');
const previews=require('../assets/heartgold-models/previews/manifest.json');
module.exports=world=>{
 for(const m of Object.values(world.maps))for(const b of m.buildings||[]){const key=layout.key(b,m.id),frame=previews[key];if(!frame||m.inside)continue;b.hgModel=key;const r=layout.placement(b,frame),left=Math.floor(r.x/32),right=Math.ceil((r.x+r.w)/32),top=Math.floor(r.y/32);
  // Only release old building cells outside the new visible footprint. Keep
  // doors, NPCs, neighboring obstacles and every story gate untouched.
  for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)if((x<left||x>=right||y<top)&&m.grid[y]?.[x]===7)m.grid[y][x]=0;
 }
};
