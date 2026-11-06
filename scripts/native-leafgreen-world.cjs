/* Keep original FRLG coordinates. Presentation never rewrites native collision. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/leafgreen-world');
const read=f=>JSON.parse(f==='runtime-world.json'?require('node:zlib').gunzipSync(fs.readFileSync(path.join(dir,f+'.gz'))).toString():fs.readFileSync(path.join(dir,f),'utf8'));
module.exports=function nativeLeafGreen(world){
 const source=read('runtime-world.json').maps,links=read('legacy-map-correspondence.json').maps,anchors=read('legacy-story-anchors.json').anchors,old=world.maps;
 const ids={};for(const n of Object.values(source))ids[n.id]=links.find(l=>l.nativeId===n.id)?.legacyId||n.id;
 const tables=read('encounters.json'),overrides=JSON.parse(fs.readFileSync(path.join(root,'campaign-encounter-overrides.json'),'utf8'));
 const alias=Object.fromEntries(links.map(l=>[l.legacyId,ids[l.nativeId]])),byName=Object.fromEntries(Object.values(source).map(m=>[m.sourceName,m]));
 const translation={PalletTown:'Pueblo Paleta',ViridianCity:'Ciudad Verde',PewterCity:'Ciudad Plateada',CeruleanCity:'Ciudad Celeste',LavenderTown:'Pueblo Lavanda',VermilionCity:'Ciudad Carmín',CeladonCity:'Ciudad Azulona',FuchsiaCity:'Ciudad Fucsia',CinnabarIsland:'Isla Canela',IndigoPlateau:'Meseta Añil',SaffronCity:'Ciudad Azafrán',ViridianForest:'Bosque Verde',MtMoon:'Monte Moon',RockTunnel:'Túnel Roca',DiglettsCave:'Cueva Diglett',PokemonTower:'Torre Pokémon',RocketHideout:'Guarida Rocket',SilphCo:'Silph S. A.',PokemonMansion:'Mansión Pokémon',VictoryRoad:'Calle Victoria',SeafoamIslands:'Islas Espuma',SafariZone:'Zona Safari',SSAnne:'S. S. Anne',PokemonLeague:'Liga Pokémon'};
 function title(name){let out=name;for(const [a,b]of Object.entries(translation))out=out.replace(a,b);return out.replace(/Route(\d+)/g,'Ruta $1').replace(/PokemonCenter_1F/,'Centro Pokémon').replace(/PokemonCenter_2F/,'Centro Pokémon · 2.º piso').replace(/Mart/,'Tienda Pokémon').replace(/Gym/,'Gimnasio').replace(/_B(\d)F/,' · Sótano $1').replace(/_(\d)F/,' · Piso $1').replaceAll('_',' · ').replace(/\bEast\b/g,'Este').replace(/\bWest\b/g,'Oeste').replace(/\bNorth\b/g,'Norte').replace(/\bSouth\b/g,'Sur').replace(/\bHouse(\d*)/g,'Casa $1').replace(/\bRoom(\d*)/g,'Habitación $1');}
 const maps={};
 for(const n of Object.values(source)){
  const id=ids[n.id],o=old[id],grid=n.suggestedGrid.map(r=>[...r]);
  const m=maps[id]={id,name:o?.name||title(n.sourceName),sub:'Kanto · trazado de Verde Hoja',kind:o?.kind||(n.cave?'cave':n.inside?'home':/Forest/.test(n.sourceName)?'forest':/^Route/.test(n.sourceName)?'route':'town'),w:n.w,h:n.h,seed:o?.seed||17,inside:n.inside,natural:!n.inside&&!/Town|City|Island$|Plateau/.test(n.sourceName),dungeon:n.cave,levels:o?.levels||[3,7],pool:o?.pool||[],encounters:o?.encounters,atlas:o?.atlas,parent:null,grid,portals:[],doors:[],buildings:[],props:[],npcs:[],items:[],signs:[],blockers:[],roomStyle:n.inside?'native':undefined,worldRevision:7,native:{id:n.id,name:n.sourceName,tileset:n.tilesetPair,blocks:n.blocks.map(r=>r.map(b=>b&1023)),behavior:n.behavior,elevation:n.elevation,encounter:n.encounterType,semantic:n.semantic},nativeConnections:[]};
  for(const w of n.warps){
   if(w.dynamic||!w.destinationId)continue;
   if(!w.arrival){const dst=source[w.destinationId],at=dst.warps[w.destinationWarp];if(!dst.sourceName.startsWith('PokemonLeague_')||!at)continue;w.arrival={x:at.x,y:at.y-2};}
   if(!w.activeWarpBehaviorByDefault&&!n.sourceName.startsWith('PokemonLeague_')&&n.sourceName!=='MtEmber_Exterior')continue;
   const d={x:w.x,y:w.y,w:1,h:1,to:ids[w.destinationId],tx:w.arrival.x,ty:w.arrival.y,nativeWarp:w.index,dir:w.entryDirection||null,gate:null};
   m.grid[w.y][w.x]=8;
   if(w.trigger==='approach')m.doors.push(d);else m.portals.push(d);
  }
  for(const c of n.connections)for(const contact of c.contacts)m.nativeConnections.push({dir:c.direction,x:contact.from[0],y:contact.from[1],to:ids[c.destination.id],tx:contact.to[0],ty:contact.to[1],gate:contact.requiresSurf?'surf':null});
  m.encounters=overrides[id]?{...tables[n.symbol],...overrides[id],adapted:true}:tables[n.symbol];m.pool=[...new Set(Object.values(m.encounters||{}).filter(Array.isArray).flatMap(t=>t.map(e=>e.id)))];if(m.pool.length){const rows=Object.values(m.encounters).filter(Array.isArray).flat();m.levels=[Math.min(...rows.map(e=>e.min)),Math.max(...rows.map(e=>e.max))];}
  const point=n.warps.find(w=>w.preferredContact&&!w.preferredContact.requiresSurf)?.preferredContact;
  m.arrival=point?{x:point.x,y:point.y}:null;
 }
 const safe=(m,x,y,avoid=true)=>{
  const valid=(x,y)=>m.grid[y]?.[x]!==undefined&&![2,3,7,10,8].includes(m.grid[y][x])&&(!avoid||!m.npcs.some(n=>n.x===x&&n.y===y))&&!m.blockers.some(n=>n.x===x&&n.y===y);
  x=Math.max(0,Math.min(m.w-1,Math.round(x)));y=Math.max(0,Math.min(m.h-1,Math.round(y)));
  if(valid(x,y))return {x,y};for(let r=1;r<Math.max(m.w,m.h);r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(Math.abs(dx)+Math.abs(dy)===r&&valid(x+dx,y+dy))return {x:x+dx,y:y+dy};for(let yy=0;yy<m.h;yy++)for(let xx=0;xx<m.w;xx++)if(m.grid[yy][xx]===3)return {x:xx,y:yy};throw Error('No safe floor '+m.id);
 };
 const trainers=read('native-trainers.json').trainers,trainerObjects=read('native-trainer-objects.json').objects,dialogues=read('native-simple-dialogues-es.json').objects;
 const used=new Set(),anchored=new Map(anchors.map(a=>[a.legacyNpcId,a]));
 for(const o of Object.values(old))for(const original of o.npcs){
  const n=structuredClone(original);let a=anchored.get(n.id);if(!a&&n.role==='trainer'&&!n.data?.anime){const nativeId=links.find(l=>l.legacyId===o.id)?.nativeId,match=trainerObjects.filter(t=>t.nativeMapId===nativeId&&!used.has(nativeId+':objects:'+t.eventIndex)).sort((a,b)=>Math.abs(a.x-n.x/o.w*source[nativeId].w)+Math.abs(a.y-n.y/o.h*source[nativeId].h)-Math.abs(b.x-n.x/o.w*source[nativeId].w)-Math.abs(b.y-n.y/o.h*source[nativeId].h))[0];if(match)a={nativeId,x:match.x,y:match.y,nativeEventKind:'objects',nativeEventIndex:match.eventIndex};}
  const m=maps[a?ids[a.nativeId]:alias[o.id]];if(!m)continue;
  // The outdoor Oak is only an introduction; the lab owns the ongoing quest.
  if(n.id==='oak')continue;
  let pos;if(a){pos={x:a.x,y:a.y};used.add(a.nativeId+':'+a.nativeEventKind+':'+a.nativeEventIndex);n.nativeEvent=a.nativeEventKind;n.nativeIndex=a.nativeEventIndex;}
  else pos=safe(m,n.x/o.w*m.w,n.y/o.h*m.h);
  if(m.npcs.some(p=>p.x===pos.x&&p.y===pos.y))pos=safe(m,pos.x,pos.y);
  Object.assign(n,pos,{homeX:pos.x,homeY:pos.y});
  if(['snorlax','snorlax16'].includes(n.data?.key)||n.id==='ssanne_rival')n.hideWhen=n.id;
  if(a?.nativeEventKind!=='objects'&&a)n.staticObject=true;
  if(n.role==='league')n.data.round=0;
  m.npcs.push(n);
 }
 // Populate everyday residents, services and removable native obstacles.
 const looks=s=>/NURSE/.test(s)?'nurse':/CLERK/.test(s)?'clerk':/SCIENTIST/.test(s)?'scientist':/LASS|WOMAN|GIRL/.test(s)?'lass':/HIKER/.test(s)?'hiker':/ROCKET/.test(s)?'rocket':/BUG_CATCHER/.test(s)?'bug':/YOUNGSTER|BOY/.test(s)?'youngster':'gentleman';
 for(const n of Object.values(source)){const m=maps[ids[n.id]];
  for(const obj of n.events.objects){const sym=obj.symbols||{},g=sym.graphics_id||'',id=m.id+'_native_'+obj.localId;
   if(used.has(n.id+':objects:'+obj.index))continue;
   if(/CUT_TREE|BREAKABLE_ROCK|PUSHABLE_BOULDER/.test(g)){m.blockers.push({id,x:obj.x,y:obj.y,kind:/TREE/.test(g)?'cutTree':'boulder',gate:/TREE/.test(g)?'cut_use':'strength_use'});continue;}
   const battle=trainerObjects.find(t=>t.nativeMapId===n.id&&t.eventIndex===obj.index),trainer=battle&&trainers[battle.initialTrainerId];
   if(trainer&&trainer.team.length&&trainer.team.every(p=>p.speciesId<=151)){if(m.npcs.some(p=>p.x===obj.x&&p.y===obj.y))continue;m.npcs.push({id,x:obj.x,y:obj.y,homeX:obj.x,homeY:obj.y,dir:'down',look:looks(g),name:trainer.nameSpanish||'Entrenador',role:'trainer',nativeIndex:obj.index,data:{team:trainer.team.map(p=>[p.speciesId,p.level]),nativeTrainer:trainer.id,maxWins:1,quote:battle.introSpanish,after:battle.defeatSpanish,sight:battle.sight}});continue;}
   if(sym.flag!=='0'||!obj.scriptAddress||/POKE_BALL|FOSSIL|SNORLAX|LAPRAS|BIRD|POKEMON|ROCK|BALL/.test(g)||obj.trainerType)continue;
   if(m.npcs.some(p=>p.x===obj.x&&p.y===obj.y))continue;
   const role=/NURSE/.test(g)?'heal':/CLERK/.test(g)&&/Mart|DepartmentStore/.test(n.sourceName)?'shop':'talk';
   m.npcs.push({id,x:obj.x,y:obj.y,homeX:obj.x,homeY:obj.y,dir:'down',look:looks(g),name:role==='heal'?'Enfermera Joy':role==='shop'?'Dependiente':'Habitante de Kanto',role,data:{lines:[dialogues.find(d=>d.nativeMapId===n.id&&d.eventIndex===obj.index)?.textSpanish||'Explora '+m.name+'. Consulta el Pokégear para seguir tu objetivo y la Pokédex para buscar Pokémon.']},nativeIndex:obj.index});
  }
  if(/PokemonCenter_1F/.test(n.sourceName)&&!m.npcs.some(n=>n.role==='pc')){const p=safe(m,m.w-3,3);m.npcs.push({id:m.id+'_pc',...p,homeX:p.x,homeY:p.y,name:'PC de Bill',role:'pc',look:'pc',dir:'down',data:{},staticObject:true});}
 }
 // Four additional League rooms retain their native stairs and opponent positions.
 for(const [round,name,look]of [[1,'PokemonLeague_BrunosRoom','bruno'],[2,'PokemonLeague_AgathasRoom','agatha'],[3,'PokemonLeague_LancesRoom','lance'],[4,'PokemonLeague_ChampionsRoom','blue']]){
  const n=byName[name];if(!n)continue;const m=maps[ids[n.id]],p=n.events.objects.find(o=>o.trainerType||/BRUNO|AGATHA|LANCE|RIVAL/.test(o.symbols?.graphics_id))||{x:6,y:5};m.npcs=m.npcs.filter(o=>o.x!==p.x||o.y!==p.y);m.npcs.push({id:m.id+'_league',x:p.x,y:p.y,homeX:p.x,homeY:p.y,name:world.league[round].name,role:'league',look,dir:'down',data:{round}});
 }
 require('./native-map-events.cjs')({world,maps,source,ids,byName,safe,read});
 // Original gate conditions stay attached to the corresponding native destination.
 for(const m of Object.values(maps)){
  for(const d of [...m.portals,...m.doors,...m.nativeConnections]){
   const target=maps[d.to],name=target?.native.name||'';
   if(m.id==='viridian'&&d.to==='route2')d.gate='delivery';
   if(name==='MtEmber_RubyPath_1F'&&m.native.name==='MtEmber_Exterior')d.gate='national';
   if(d.to==='cinnabar_gym')d.gate='secret_key';
   if(name==='SSAnne_Exterior')d.gate='bill';
   if(d.to==='saffron'&&/^Route/.test(m.native.name))d.gate='tea';
   if(d.to==='silph_1')d.gate='flute';
   if(d.to==='indigo_arena')d.gate='league_access';
   const rounds={'PokemonLeague_BrunosRoom':1,'PokemonLeague_AgathasRoom':2,'PokemonLeague_LancesRoom':3,'PokemonLeague_ChampionsRoom':4};
   if(rounds[name])d.gate='league_round_'+rounds[name];
   if(name==='PokemonLeague_HallOfFame')d.gate='champion';
  }
  if(!m.arrival)m.arrival=safe(m,m.w/2,m.h/2);
  else m.arrival=safe(m,m.arrival.x,m.arrival.y);
 }
 // Parent regions are derived from the native graph, never an invented shortcut.
 for(const m of Object.values(maps))if(m.inside){const seen=new Set([m.id]),q=[m.id];while(q.length&&!m.parent){const cur=maps[q.shift()];for(const d of [...cur.doors,...cur.portals,...cur.nativeConnections]){const next=maps[d.to];if(!next||seen.has(next.id))continue;if(!next.inside){m.parent=next.id;break;}seen.add(next.id);q.push(next.id);}}}
 // Anchor HG facades at the ROM's door. Native collision and clear paths remain intact.
 for(const n of Object.values(source)){const m=maps[ids[n.id]];if(m.inside||m.dungeon)continue;
  for(const d of [...m.doors,...m.portals]){const target=maps[d.to];if(!target?.inside)continue;
   const original=Object.values(old).flatMap(m=>m.buildings).find(b=>alias[b.id]===d.to);
   const kind=original?.kind||(/PokemonCenter/.test(target.native.name)?'center':/Mart/.test(target.native.name)?'shop':/Gym/.test(target.native.name)?'gym':/House/.test(target.native.name)?'home':null);if(!kind)continue;
   let left=d.x,right=d.x,top=d.y;const solid=(x,y)=>n.collision[y]?.[x]===1;
   while(left>0&&solid(left-1,d.y))left--;while(right<m.w-1&&solid(right+1,d.y))right++;
   while(top>0&&Array.from({length:right-left+1},(_,i)=>solid(left+i,top-1)).some(Boolean)&&d.y-top<8)top--;
   let width=right-left+1;
   if(kind==='shop'){left=d.x-2;right=d.x+1;top=d.y-3;}
   else if(kind==='center'){left=d.x-2;right=d.x+2;top=d.y-4;}
   else if(kind==='gym'){const row=n.blocks[d.y-2];left=d.x;right=d.x;while(left>0&&((row[left-1]&1023)>=313&&(row[left-1]&1023)<=350))left--;while(right<m.w-1&&((row[right+1]&1023)>=313&&(row[right+1]&1023)<=350))right++;top=d.y-4;}
   else if(d.to==='pewter_museum'){if(d.x!==17)continue;left=12;right=27;top=0;}
   else if(['home','lab'].includes(kind))top=Math.max(0,top-1);
   width=right-left+1;if(width<3||width>24)continue;
   m.buildings.push({id:d.to,x:left,y:top,w:width,h:d.y-top+1,door:{x:d.x,y:d.y},kind,label:target.name,native:true});
  }
 }
 for(const [name,id]of Object.entries(alias))if(name!==id)maps[name]={...maps[id],id:name,aliasOf:id};
 world.maps=maps;world.spawn={map:'pallet',x:6,y:8};world.nativeAliases=alias;world.nativeMapCount=Object.keys(source).length;world.revision=7;
 world.storyAnchors=Object.fromEntries(Object.values(maps).filter(m=>!m.aliasOf).flatMap(m=>m.npcs.map(n=>[n.id,{map:m.id,x:n.x,y:n.y}])));
 // Updated objectives follow roles that moved to their correct floor.
 fs.writeFileSync(path.join(root,'native-map-audit.json'),JSON.stringify({nativeMaps:world.nativeMapCount,runtimeMaps:Object.keys(maps).length,warps:Object.values(maps).reduce((n,m)=>n+m.portals.length+m.doors.length,0),storyAnchors:Object.keys(world.storyAnchors).length},null,2));
};
