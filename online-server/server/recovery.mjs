import {heal} from './creatures.mjs';

// A rest point is a location, never a copy of transport state (seq/seen).
export const restPoint=p=>({map:p.map,x:p.x,y:p.y,dir:p.dir||'down'});
export function recoverAtCenter(member){
 const point=restPoint(member.lastCenter);
 member.party.forEach(heal);
 member.lastCenter=point;
 member.position={...member.position,...point,fx:point.x,fy:point.y+1,fdir:point.dir,
  notice:'Tu equipo se recuperó en el último Centro Pokémon.'};
 delete member.spotted;delete member.motion;
}
