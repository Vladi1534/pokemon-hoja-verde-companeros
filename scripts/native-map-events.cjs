// Scripted geometry is separate from the immutable ROM layout.
module.exports=function({world,maps,source,ids,byName,safe,read}){
 const operations=read('scripted-map-operations.json').operations;
 const map=name=>maps[ids[byName[name]?.id]];
 const rule=(m,script,requires=[],unless=[])=>{if(!m)return;const cells=operations.filter(o=>o.script===script&&o.command==='setmetatile').map(o=>o.resolved);if(cells.length)(m.nativeChanges||=[]).push({requires,unless,cells});};
 const npc=(m,key,position,data={})=>{const old=m.npcs.find(n=>n.x===position.x&&n.y===position.y);if(old)Object.assign(old,{role:'quest',staticObject:true,data:{key,...data}});else m.npcs.push({id:m.id+'_'+key+'_'+position.x+'_'+position.y,...position,name:data.name||'Interruptor',look:'scientist',dir:'down',role:'quest',staticObject:true,data:{key,...data}});};
 for(const m of Object.values(maps)){
  const name=m.native.name,n=source[m.native.id];
  if(name==='SSAnne_2F_Corridor'){const rival=m.npcs.find(n=>n.id==='ssanne_rival');if(rival)rival.hideWhen='ssanne_rival';}
  if(name==='MtEmber_Exterior'){
   rule(m,name+'_EventScript_OpenCave',['national']);
   for(const guard of m.npcs.filter(n=>n.role==='trainer'&&n.y===40&&[41,42].includes(n.x)))guard.hideWhen=guard.id;
  }
  if(name==='VermilionCity_Gym')rule(m,name+'_EventScript_SetBeamsOff',['circuit']);
  if(name==='CeladonCity_GameCorner'){const guard=m.npcs.find(n=>n.role==='trainer'&&n.y===2);if(guard)guard.hideWhen=guard.id;rule(m,name+'_EventScript_HideRocketHideout',[],['poster']);rule(m,name+'_EventScript_OpenRocketHideout',['poster']);for(const d of m.portals)if(/RocketHideout/.test(maps[d.to]?.native.name))d.gate='poster';}
  if(name==='RocketHideout_B1F')rule(m,name+'_EventScript_RemoveBarrier',['lift_key']);
  if(name==='RocketHideout_B4F'){
   const guards=n.events.objects.filter(o=>/Grunt[23]$/.test(o.symbols?.script||'')).map(o=>m.npcs.find(t=>t.nativeIndex===o.index)?.id).filter(Boolean);
   rule(m,name+'_EventScript_RemoveBarrier',guards.length===2?guards:['lift_key']);
  }
  if(name==='CinnabarIsland_Gym')for(const [i,who]of ['Quinn','Avery','Ramon','Derek','Dusty','Zac'].entries()){
   const obj=n.events.objects.find(o=>o.symbols?.script.endsWith('_'+who)),trainer=m.npcs.find(t=>t.nativeIndex===obj?.index);
   if(trainer)rule(m,name+'_EventScript_OpenDoor'+(i+1),[trainer.id]);
  }
  if(name.startsWith('SilphCo_')&&!name.includes('Elevator')){const floor=name.split('_')[1];for(const script of new Set(operations.filter(o=>o.script.startsWith('EventScript_Open'+floor+'Door')).map(o=>o.script)))rule(m,script,['card_key']);}
  if(name.startsWith('PokemonMansion_')){
   const floor=name.split('_')[1];rule(m,'PokemonMansion_EventScript_ResetSwitch_'+floor,[],['mansion_switch']);rule(m,'PokemonMansion_EventScript_PressSwitch_'+floor,['mansion_switch']);
   for(const bg of n.events.background)if(/Statue/.test(bg.symbols?.script))npc(m,'native_statue',{x:bg.x,y:bg.y},{name:'Estatua de la Mansión'});
  }
  if(name.startsWith('PokemonLeague_')){
   const round=['LoreleisRoom','BrunosRoom','AgathasRoom','LancesRoom','ChampionsRoom'].indexOf(name.split('_')[1]);
   if(round>=0)rule(m,'PokemonLeague_EventScript_SetDoorOpen'+(round===3?'Lance':''),['league'+round]);
  }
  // The original pressure plates remain in place; activate them with Fuerza.
  if(name.startsWith('VictoryRoad_'))for(const event of n.events.coordinates){const script=event.symbols?.script;if(!script?.includes('FloorSwitch'))continue;const flag=m.id+'_switch_'+event.index;rule(m,script,[flag]);npc(m,'native_plate',{x:event.x,y:event.y},{flag,name:'Placa de presión'});}
  if(name==='Route23')for(const obj of n.events.objects){const match=obj.symbols?.script?.match(/(Cascade|Thunder|Rainbow|Soul|Marsh|Volcano|Earth)Badge/);if(match){const guard=m.npcs.find(t=>t.nativeIndex===obj.index);if(guard)guard.hideWhen='badge'+({Cascade:2,Thunder:3,Rainbow:4,Soul:5,Marsh:6,Volcano:7,Earth:8}[match[1]]);}}
 }
 // Elevators keep their original destinations and require the original lift key.
 const elevators=[['RocketHideout_Elevator',[['RocketHideout_B1F',24,25],['RocketHideout_B2F',28,16],['RocketHideout_B4F',20,23]],'lift_key'],['CeladonCity_DepartmentStore_Elevator',[1,2,3,4,5].map(i=>['CeladonCity_DepartmentStore_'+i+'F',6,1]),null],['SilphCo_Elevator',Array.from({length:11},(_,i)=>['SilphCo_'+(i+1)+'F',i===0?20:24,i===0?1:1]),null]];
 for(const [name,floors,gate]of elevators){const m=map(name);if(!m)continue;const nativeOptions=operations.filter(o=>o.sourceFile.includes('/'+name+'/')&&o.command==='setdynamicwarp').map(o=>{const dest=Object.values(source).find(n=>n.symbol===o.args[0]);return dest?[dest.sourceName,o.resolved[2],o.resolved[3]]:null;}).filter(Boolean);const options=(nativeOptions.length?nativeOptions:floors).filter(([name])=>map(name)).map(([name,x,y])=>{const dest=map(name),p=safe(dest,x,y);return {map:dest.id,...p,label:dest.name,gate};});npc(m,'native_travel',{x:0,y:2},{name:'Panel del ascensor',options});m.dynamicExit=options[0];m.dynamicWarps=source[m.native.id].warps.filter(w=>w.dynamic).map(w=>({x:w.x,y:w.y}));}
 // Ferries are explicit journeys, never invented land connections.
 const ports=[['VermilionCity','Ciudad Carmín',24,30],['OneIsland_Harbor','Isla Prima',8,8],['FourIsland_Harbor','Isla Quarta',8,8]];
 for(const [name,label,x,y]of ports){const m=map(name);if(!m)continue;const p=safe(m,x,y),options=ports.filter(v=>v[0]!==name).map(([dest,label,x,y])=>{const d=map(dest),at=safe(d,x,y);return {map:d.id,...at,label,gate:dest==='FourIsland_Harbor'?'rainbow':dest==='OneIsland_Harbor'?'badge7':null};});m.npcs.push({id:m.id+'_ferry',...p,name:'Marinero del ferry',look:'sailor',dir:'down',role:'quest',data:{key:'native_travel',options}});}
 // Import supported native pickups once; story items keep their quest interaction.
 for(const item of read('native-map-items.json').pickups){const m=maps[ids[item.nativeMapId]];if(!m||!item.engineKeyHint||m.npcs.some(n=>n.x===item.x&&n.y===item.y))continue;m.items.push({id:item.id.replaceAll(':','_'),x:item.x,y:item.y,key:item.engineKeyHint,qty:item.quantity,hidden:item.kind==='hidden'});}
};
