import {world,done} from './campaign.mjs';
export function nativeTiles(id,state){
 const result={},m=typeof id==='string'?world.maps[id]:id;if(!m?.nativeChanges)return result;
 for(const rule of m.nativeChanges)if(rule.requires.every(k=>done(state,k))&&rule.unless.every(k=>!done(state,k)))for(const [x,y,tile,collision]of rule.cells)result[x+','+y]={tile,grid:collision?7:0};
 return result;
}
export function nativeCell(m,x,y,state){
 let cell={tile:m.native?.blocks[y]?.[x],grid:m.grid[y]?.[x]};
 for(const rule of m.nativeChanges||[])if(rule.requires.every(k=>done(state,k))&&rule.unless.every(k=>!done(state,k))){const row=rule.cells.find(c=>c[0]===x&&c[1]===y);if(row)cell={tile:row[2],grid:row[3]?7:0};}
 return cell;
}
