import {rng} from './creatures.mjs';
export function encounterSlot(map,water=false,random=rng){
 const table=water?map.encounters?.water_mons:map.encounters?.land_mons||map.encounters?.water_mons;
 if(table?.length){let roll=random(table.reduce((sum,e)=>sum+e.weight,0));const selected=table.find(e=>(roll-=e.weight)<0);if(selected)return {id:selected.id,level:selected.min+random(selected.max-selected.min+1)};}
 if(!map.pool.length)throw Error('No hay encuentros en esta zona.');
 return {id:map.pool[random(map.pool.length)],level:map.levels[0]+random(map.levels[1]-map.levels[0]+1)};
}
