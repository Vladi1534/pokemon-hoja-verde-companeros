import {world,gate,done,challengeBlock} from './campaign.mjs';
import {nativeCell} from './native-state.mjs';
const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
export function walkable(map,x,y,state){const m=world.maps[map],t=state&&m?.native?nativeCell(m,x,y,state).grid:m?.grid[y]?.[x];return t!==undefined&&![2,3,7,10].includes(t)&&(!state||!(m.blockers||[]).some(b=>b.x===x&&b.y===y&&!state.progress[b.id]&&!state.sharedGates?.[b.id]))&&!m.npcs.some(n=>n.x===x&&n.y===y&&!(state&&n.hideWhen&&done(state,n.hideWhen)))&&!m.signs.some(n=>n.x===x&&n.y===y);}
export function nativeStep(p,dir,state={progress:{}}){
 const m=world.maps[p.map],[dx,dy]=dirs[dir];let x=p.x+dx,y=p.y+dy;
 const transition=m.nativeConnections?.find(c=>c.dir===dir&&c.x===p.x&&c.y===p.y)&&(x<0||y<0||x>=m.w||y>=m.h)?m.nativeConnections.find(c=>c.dir===dir&&c.x===p.x&&c.y===p.y):null;
 const moving={...p,dir};delete moving.notice;
 const arrive=d=>{const reason=gate(state,d.gate);if(reason)return {...moving,notice:reason};const dest=world.maps[d.to],nextDir=dest.inside&&!m.inside?'up':!dest.inside&&m.inside?'down':dir;const next={...moving,map:d.to,x:d.tx,y:d.ty,dir:nextDir,fx:d.tx,fy:d.ty,fdir:nextDir};if(dest.dynamicExit)next.returnWarp={to:p.map,tx:p.x,ty:p.y};else delete next.returnWarp;return next;};
 if(transition)return arrive(transition);
 if(m.dynamicWarps?.some(w=>w.x===x&&w.y===y)){const d=m.dynamicExit;return arrive(p.returnWarp||{to:d.map,tx:d.x,ty:d.y});}
 let warp=[...m.doors,...m.portals].find(w=>w.x===x&&w.y===y&&(!w.dir||w.dir===dir));
 const ledge=m.native.behavior[y]?.[x];
 if(!warp&&ledge>=0x38&&ledge<=0x3f){const required={56:'right',57:'left',58:'up',59:'down',60:'up',61:'up',62:'down',63:'down'}[ledge];if(dir!==required)return moving;x+=dx;y+=dy;warp=[...m.doors,...m.portals].find(w=>w.x===x&&w.y===y&&(!w.dir||w.dir===dir));}
 const t=nativeCell(m,x,y,state).grid;
 if(t===undefined||[2,7,10].includes(t)||t===3&&!done(state,'surf'))return t===3?{...moving,notice:gate(state,'surf')}:moving;
 if(m.blockers.some(b=>b.x===x&&b.y===y&&!state.progress[b.id]&&!state.sharedGates?.[b.id]))return moving;
 if(m.npcs.some(n=>n.x===x&&n.y===y&&!(n.hideWhen&&done(state,n.hideWhen))))return moving;
 if(warp)return arrive(warp);
 return {...moving,x,y,fx:p.x,fy:p.y,fdir:dir};
}
export function advance(position,steps,state){let p={...position};delete p.notice;for(const dir of steps){if(!dirs[dir])(()=>{throw Error('Dirección inválida.');})();if(world.maps[p.map]?.native){p=nativeStep(p,dir,state);continue;}p.dir=dir;const [dx,dy]=dirs[dir],x=p.x+dx,y=p.y+dy;if(!walkable(p.map,x,y,state))continue;const m=world.maps[p.map];const portal=m.portals.find(q=>x>=q.x&&x<q.x+q.w&&y>=q.y&&y<q.y+q.h),door=m.doors.find(d=>d.x===x&&d.y===y);let reason=state&&portal?gate(state,portal.gate):'';if(state&&door){if(door.to==='ssanne'&&!done(state,'bill'))reason='Necesitas el ticket del S. S. Anne que entrega Bill.';if(door.to==='silph_1'&&!done(state,'flute'))reason='Los Rocket bloquean Silph. Rescata primero a Fuji en la Torre Pokémon.';if(door.to==='cinnabar_gym'&&!done(state,'secret_key'))reason=gate(state,'secret_key');}
 if(reason){p.notice=reason;continue;}p={...p,x,y,fx:p.x,fy:p.y,fdir:dir};if(portal||door){const dest=portal?{map:portal.to,x:portal.tx??21,y:portal.ty??3}:{map:door.to,x:door.tx??10,y:door.ty??15};p={...p,...dest,dir:door?'up':dir,fx:dest.x,fy:dest.y+1,fdir:door?'up':dir};}}return p;}

export function trainerFacing(n,now){return ['down','left','up','right'][(Math.floor(now/1800)+n.x+n.y)%4];}
export function visibleTrainer(nav,now){
 if(!nav.enabled||!nav.healthy||nav.grace>0)return null;
 const p=nav.position,map=world.maps[p.map],state={progress:nav.progress};
 return map.npcs.find(n=>{
  if(n.role!=='trainer'||done(state,n.id)||challengeBlock(state,n))return false;
  const [dx,dy]=dirs[trainerFacing(n,now)];
  for(let i=1;i<=(n.data.sight??4);i++){
   const x=n.x+dx*i,y=n.y+dy*i;
   if(p.x===x&&p.y===y)return true;
   if(!walkable(p.map,x,y,state))return false;
  }
  return false;
 })?.id||null;
}
// Shared deterministic encounter check. The server still creates and owns battles.
// Prediction only lets the client begin a transition on the correct tile.
export function encounterRoll(id,step,p){
 let h=2166136261;
 for(const ch of id+':'+step+':'+p.map+':'+p.x+','+p.y){h=Math.imul(h^ch.charCodeAt(0),16777619);}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;
 return (h>>>0)/4294967296;
}
export function previewNavigation(nav,dir,now){
 const p=advance(nav.position,[dir],{progress:nav.progress,league:nav.league}),moved=p.map!==nav.position.map||p.x!==nav.position.x||p.y!==nav.position.y;
 const next={...nav,position:p,event:null,moved};
 if(!moved)return next;
 next.steps++;next.repel=Math.max(0,nav.repel-1);next.grace=Math.max(0,(nav.grace||0)-1);
 if(p.map!==nav.position.map){next.grace=2;next.event={kind:'portal',map:p.map};return next;}
 const trainer=visibleTrainer(next,now);
 if(trainer){next.event={kind:'trainer',npc:trainer};return next;}
 const map=world.maps[p.map];
 if(next.enabled&&next.healthy&&!next.grace&&!next.repel&&map.pool.length&&(map.native?map.native.encounter[p.y][p.x]!==0||map.grid[p.y][p.x]===3&&map.encounters?.water_mons?.length:[4,6].includes(map.grid[p.y][p.x])||map.encounters&&map.dungeon||map.kind==='sea')&&encounterRoll(next.id,next.steps,p)<.1)next.event={kind:'wild'};
 return next;
}
export function navigationState(ctx,m,enabled=true){return {version:1,id:m.id,league:ctx.league||0,position:{...m.position},steps:m.steps||0,repel:m.repel||0,grace:m.travelGrace||0,progress:{...ctx.progress,...ctx.sharedGates},enabled,healthy:m.party.some(p=>!p.eggSteps&&p.hp>0)};}
export function movementClock(now,sent){return Number.isFinite(sent)?Math.max(now-3000,Math.min(now,sent)):now;}
