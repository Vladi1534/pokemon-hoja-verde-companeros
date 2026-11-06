import {world,gate} from './campaign.mjs';
import {items} from './creatures.mjs';
export function explore(state,member,position,id){
 const map=world.maps[position.map],obstacle=map?.blockers?.find(b=>b.id===id),item=map?.items.find(i=>i.id===id),target=obstacle||item;
 if(!target||Math.abs(position.x-target.x)+Math.abs(position.y-target.y)!==1)throw Error('Acércate al objeto y examínalo desde una casilla vecina.');
 if(obstacle){if(state.progress[target.id]||state.sharedGates?.[target.id])return 'El sendero ya está despejado.';const reason=gate(state,target.gate);if(reason)throw Error(reason);state.progress[target.id]=true;if(state.sharedGates)state.sharedGates[target.id]=true;return target.gate==='strength_use'?'Usaste Fuerza. El paso queda despejado.':'Usaste Corte. El sendero queda abierto.';}
 if(member.rewards[target.id])return 'Ya recogiste este objeto.';
 if(!items[target.key])throw Error('Objeto no disponible.');member.bag[target.key]=(member.bag[target.key]||0)+target.qty;member.rewards[target.id]=true;
 return `${item.hidden?'¡Encontraste un objeto oculto! ':''}${target.qty} × ${items[target.key].name}. Lo guardaste en tu mochila.`;
}
export function migrateTownPositions(state){
 const previous=state.worldRevision||0;if(previous>=7)return false;
 const blocked=(map,p)=>!map||map.grid[p.y]?.[p.x]===undefined||[2,3,7,10].includes(map.grid[p.y][p.x])||[...map.npcs,...map.signs].some(n=>n.x===p.x&&n.y===p.y);
 for(const member of state.members){const map=world.maps[member.position.map];if(map?.arrival&&(previous<7||blocked(map,member.position))){const {x,y}=map.arrival;Object.assign(member.position,{x,y,fx:x,fy:y+1,notice:'El camino se ha renovado. Tu equipo y progreso se conservan; apareces en una zona segura.'});delete member.spotted;delete member.motion;member.travelGrace=3;}
  const c=world.maps[member.lastCenter?.map];if(c?.arrival&&(previous<7||blocked(c,member.lastCenter))){const b=c.buildings.find(b=>b.kind==='center');member.lastCenter={map:c.id,x:b?b.door.x:c.arrival.x,y:b?b.door.y+1:c.arrival.y};}
 }
 state.proposal=null;state.worldRevision=7;return true;
}
