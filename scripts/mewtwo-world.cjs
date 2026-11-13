/* Optional fan episode. Original Kanto geometry is retained unchanged. The
 * annex reuses verified native interiors and their original collision grids. */
module.exports=function mewtwoWorld(world){
 const maps=world.maps;
 function add(map,id,x,y,name,look,role,data={},extra={}){
  const m=maps[map],valid=(x,y)=>m.grid[y]?.[x]!==undefined&&![2,3,7,8,10].includes(m.grid[y][x])&&!m.npcs.some(n=>n.x===x&&n.y===y)&&![...m.doors,...m.portals].some(w=>Math.abs(w.x-x)+Math.abs(w.y-y)<2);
  const cells=[];for(let yy=1;yy<m.h-1;yy++)for(let xx=1;xx<m.w-1;xx++)if(valid(xx,yy))cells.push([xx,yy]);
  cells.sort((a,b)=>Math.abs(a[0]-x)+Math.abs(a[1]-y)-Math.abs(b[0]-x)-Math.abs(b[1]-y));
  if(!cells.length)throw Error('No safe cell for '+id);[x,y]=cells[0];
  m.npcs.push({...(look.startsWith('native_')?{nativeGraphic:'OBJ_EVENT_GFX_'+look.slice(7).toUpperCase()}:{}),id,x,y,homeX:x,homeY:y,dir:'down',name,look,role,data:{anime:true,...data},...extra});
 }
 function room(source,id,name){const m=maps[id]=structuredClone(maps[source]);Object.assign(m,{id,name,sub:'Isla Nueva · el origen de los clones',extension:'mewtwo',parent:'clone_island',npcs:[],items:[],blockers:[],props:[],signs:[],buildings:[],nativeChanges:[],nativeConnections:[],encounters:null,pool:[],levels:[36,50]});return m;}
 const island=room('frlg_02_00','clone_island','Isla Nueva · costa');island.parent=null;
 const hall=room('frlg_12_01','clone_hall','Isla Nueva · vestíbulo');
 const arena=room('cinnabar_house','clone_arena','La cámara de Mewtwo');
 const rest=room('frlg_12_03','clone_rest','Isla Nueva · enfermería');
 const lab=room('cinnabar_lab','clone_lab','Tu laboratorio de clonación');
 function link(m,w,to,x,y,gate=null){Object.assign(w,{to,tx:x,ty:y,gate});}
 for(const w of island.portals)link(island,w,w.y===8?'clone_hall':'vermilion',w.y===8?4:18,w.y===8?8:25);
 for(const w of hall.portals){if(w.y===9)link(hall,w,'clone_island',9,10);else link(hall,w,({13:'clone_arena',19:'clone_rest',25:'clone_lab'})[w.x],7,8,w.x===25?'mewtwo_owned':null);}
 for(const [m,x]of [[arena,13],[rest,19],[lab,25]])for(const w of m.portals)link(m,w,'clone_hall',x,6);
 island.arrival={x:9,y:14};hall.arrival={x:4,y:8};for(const m of [arena,rest,lab])m.arrival={x:7,y:8};
 add('route2','clone_corey_clue',6,70,'Corey','native_cooltrainer_m','story',{key:'clone_clue',clue:'clone_corey',lines:'Una Ball oscura intentó llevarse a mi Venusaur. Volvió ileso, pero aquella máquina guardó una copia. El museo de Plateada investiga algo parecido.'});
 add('pewter_museum','clone_research_clue',20,7,'Investigadora','native_scientist','story',{key:'clone_clue',clue:'clone_research',lines:'Los fósiles nos enseñan a reconstruir la vida. Un antiguo proyecto de Isla Nueva fue más allá: copiar un Pokémon vivo. Estas notas mencionan a Mewtwo.'});
 add('route6','clone_fergus_clue',16,12,'Fergus','native_sailor','story',{key:'clone_clue',clue:'clone_fergus',lines:'Soy Fergus. Una tormenta rodea Isla Nueva. Neesha está en Azulona reuniendo entrenadores; busca su invitación cuando consigas la cuarta medalla.'});
 add('celadon','clone_invitation',24,22,'Neesha','native_cooltrainer_f','story',{key:'clone_invitation'});
 add('vermilion','clone_ferry',18,24,'Marinera de Isla Nueva','native_picnicker','story',{key:'native_travel',options:[{label:'Isla Nueva · invitación de Mewtwo',map:'clone_island',x:9,y:14,gate:'clone_invitation'}]});
 // The return trip always remains available, including after defeat.
 const ferry=maps.vermilion.npcs.find(n=>n.id==='clone_ferry');
 const returnCell=[[-1,0],[1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:ferry.x+dx,y:ferry.y+dy})).find(p=>![2,3,7,8,10].includes(maps.vermilion.grid[p.y]?.[p.x])&&!maps.vermilion.npcs.some(n=>n.x===p.x&&n.y===p.y));
 if(!returnCell)throw Error('Ferry has no landing');for(const w of island.portals.filter(w=>w.to==='vermilion'))Object.assign(w,{tx:returnCell.x,ty:returnCell.y});
 add('clone_island','clone_return',7,14,'Marinera','native_picnicker','story',{key:'native_travel',options:[{label:'Regresar a Ciudad Carmín',map:'vermilion',...returnCell}]});
 const rivals=[['corey',10,'Corey','native_cooltrainer_m',[[3,36],[18,35]]],['fergus',16,'Fergus','native_sailor',[[130,36],[31,35]]],['neesha',22,'Neesha','native_cooltrainer_f',[[9,36],[87,35]]]];
 for(const [id,x,name,look,team]of rivals)add('clone_hall','clone_trial_'+id,x,7,name,look,'trainer',{team,sight:0,maxWins:3,quote:name+': Mewtwo nos ha convocado para enfrentar a nuestros Pokémon con sus copias. Antes, comprobemos que estamos preparados.',after:'Hemos probado nuestra fuerza. Los otros dos entrenadores también quieren asegurarse de que estás preparado. La cámara de Mewtwo está en la puerta izquierda.'});
 add('clone_hall','clone_briefing',6,6,'Investigador de Isla Nueva','native_scientist','story',{key:'clone_briefing'});
 add('clone_arena','clone_mewtwo',7,3,'Mewtwo','pokemon_150','trainer',{key:'mewtwo',team:[[3,42],[6,42],[9,42]],sight:0,requires:['clone_trials'],quote:'He creado Pokémon a imagen de los vuestros. Demuestra qué significa combatir junto a un compañero.'},{hideWhen:'mewtwo_owned'});
 for(const [id,x,y]of [[3,2,4],[6,12,4],[9,12,7]])add('clone_arena','clone_guard_'+id,x,y,'Clon de '+({3:'Venusaur',6:'Charizard',9:'Blastoise'})[id],'pokemon_'+id,'talk',{lines:['Las marcas de su piel distinguen a este Pokémon. Observa a Mewtwo, esperando su decisión.']},{cloneVariant:true});
 add('clone_rest','clone_nurse',5,3,'Enfermera','native_nurse','heal');
 add('clone_rest','clone_pc',10,3,'PC del laboratorio','native_scientist','pc');
 add('clone_lab','clone_terminal',6,3,'Terminal de clonación','native_scientist','story',{key:'clone_lab'});
 add('clone_lab','clone_lab_pc',10,3,'Archivo de Pokémon','native_scientist','pc');
 for(const m of Object.values(maps))for(const n of m.npcs)world.storyAnchors[n.id]={map:m.id,x:n.x,y:n.y};
};
