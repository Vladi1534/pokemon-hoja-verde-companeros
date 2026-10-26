// Hand-authored compact town plans. Shared by solo and server world generation.
// Coordinates describe playable geometry; buildings, doors and return warps move together.
const TOWN_PLANS={
 pallet:{w:32,h:28,theme:'meadow',hub:[21,18],roads:[[8,13,24,13],[21,0,21,25],[8,13,8,24]],buildings:{pallet_home:[4,6,5,4],pallet_rival:[23,6,5,4],pallet_lab:[13,19,7,5]},spots:[[12,14],[25,17],[7,21]],park:[3,17,6,7],clue:'Al oeste del laboratorio hay un jardín pequeño. Examina la esquina junto a las flores.',secret:[4,22,'potion'],people:[['Jardinera','mom','Los arbustos también esconden objetos. Ponte al lado, mira hacia ellos y pulsa Z o A.'],['Vecino de Paleta','gentleman','La Ruta 1 nace al norte. El laboratorio de Oak está en el extremo sur.']]},
 viridian:{w:34,h:28,theme:'meadow',hub:[18,16],roads:[[17,0,17,27],[2,16,31,16],[8,8,17,8]],buildings:{viridian_center:[4,3,5,4],viridian_shop:[11,3,5,4],viridian_gym:[23,4,7,5],viridian_house:[23,19,5,4]},spots:[[15,14],[24,12],[10,17]],pond:[4,20,7,5],park:[25,11,6,5],secret:[6,18,'antidote'],people:[['Vecina del estanque','mom','La tienda queda junto al Centro, al noroeste. Si llevas un paquete para Oak, vuelve por la salida sur.'],['Aprendiz de jardinero','youngster','Cerca del estanque crecen plantas medicinales. A veces queda un antídoto entre los arbustos.']]},
 pewter:{w:34,h:27,theme:'stone',hub:[17,15],roads:[[3,12,29,12],[17,7,17,26],[17,18,33,18]],buildings:{pewter_museum:[20,2,10,5],pewter_center:[3,4,5,4],pewter_shop:[3,17,5,4],pewter_gym:[21,17,7,5],pewter_house:[10,3,5,4]},spots:[[14,12],[25,9],[11,20]],park:[3,10,6,5],secret:[5,13,'potion'],pocket:[10,19,'repel','cut_use'],people:[['Estudiante del museo','scientist','El museo está en la terraza norte. Para ir al Monte Moon, toma la salida oriental de la ciudad.'],['Excursionista','hiker','Tras el pequeño árbol del jardín sur hay un sendero olvidado. Corte puede despejarlo.']]},
 cerulean:{w:36,h:28,theme:'river',hub:[18,16],roads:[[18,0,18,27],[3,16,33,16],[9,10,29,10]],buildings:{cerulean_center:[4,11,5,4],cerulean_shop:[4,20,5,4],cerulean_gym:[23,3,8,5],cerulean_house:[25,20,5,4]},spots:[[14,15],[22,11],[12,20]],river:[3,3,11,5],park:[27,10,6,5],secret:[5,9,'ball'],people:[['Vecina del puente','lass','El camino norte cruza el Puente Pepita. Al otro lado, sigue hacia el cabo para encontrar a Bill.'],['Nadador','sailor','Misty entrena en el edificio junto al río. Los paseos de la orilla tienen rincones que pasan desapercibidos.']]},
 cape:{w:30,h:24,theme:'river',hub:[17,16],roads:[[0,16,25,16],[17,7,17,20]],buildings:{bill_home:[19,4,8,5]},spots:[[11,16],[21,12]],pond:[3,3,10,7],park:[5,18,7,4],secret:[8,20,'repel'],people:[['Paseante del cabo','lass','Bill vive en la casa del este. Si oyes algo extraño dentro, quizá necesite ayuda con un experimento.'],['Pescador del cabo','fisher','Los bancos miran al estanque. Revisa las flores junto al sendero antes de regresar.']]},
 vermilion:{w:36,h:33,theme:'harbor',hub:[20,17],roads:[[18,0,18,9],[5,8,33,8],[7,8,7,18],[20,8,20,20],[27,8,27,18],[2,18,34,18]],buildings:{vermilion_center:[3,3,5,4],vermilion_shop:[26,3,5,4],vermilion_gym:[3,11,7,5],vermilion_house:[27,11,5,4],vermilion_fanclub:[12,3,6,4],vermilion_boathouse:[12,11,6,4],ssanne:[12,24,16,7]},spots:[[10,8],[25,18],[30,17]],secret:[3,19,'superpotion'],people:[['Marinera del puerto','sailor','El S. S. Anne está al final del muelle central. El capitán recibe a quienes llevan el billete de Bill.'],['Socio del club','gentleman','El Club de Fans está entre el Centro y la tienda. Si buscas Corte, visita primero el barco.'],['Estibador','hiker','Se cayó una Superpoción junto a las cajas del extremo oeste del muelle. ¡Mira bien entre ellas!']]},
 lavender:{w:30,h:26,theme:'lavender',hub:[16,17],roads:[[15,0,15,25],[0,17,27,17],[7,10,22,10]],buildings:{lavender_center:[3,3,5,4],lavender_shop:[3,19,5,4],lavender_house:[20,19,5,4],tower_1:[19,2,8,7]},spots:[[11,14],[20,12],[10,21]],park:[3,10,6,6],secret:[4,14,'antidote'],people:[['Cuidadora del jardín','mom','Fuji solía cuidar estas flores. Ha subido a la Torre Pokémon para ayudar a un espíritu.'],['Vecino de Lavanda','gentleman','Para identificar los espíritus necesitas el Scope Silph. Los Rocket de Azulona podrían saber dónde está.']]},
 celadon:{w:38,h:30,theme:'garden',hub:[19,14],roads:[[0,15,37,15],[19,7,19,29],[8,15,8,25],[28,8,28,24]],buildings:{celadon_center:[27,2,5,4],celadon_shop:[3,4,9,6],celadon_house:[14,7,6,4],casino:[26,19,9,5],celadon_gym:[3,20,7,5]},spots:[[14,15],[24,16],[12,23]],pond:[14,20,8,6],park:[3,11,9,3],secret:[18,27,'superpotion'],pocket:[28,8,'repel','cut_use'],people:[['Dependienta de los almacenes','clerk','Los grandes almacenes están al noroeste. El casino abre al sureste, junto a la plaza de los tilos.'],['Cliente del casino','gentleman','Vi a un Rocket esconder algo detrás de un cartel del casino. La anciana del norte también ayuda a viajeros.'],['Jardinera de Erika','lass','El jardín vallado al noreste guarda un objeto. Necesitas Corte para entrar sin dañar las flores.']]},
 saffron:{w:36,h:30,theme:'city',hub:[18,17],roads:[[18,0,18,29],[0,17,35,17],[7,9,29,9],[7,9,7,25],[28,9,28,25]],buildings:{saffron_center:[3,20,5,4],saffron_shop:[25,20,5,4],saffron_house:[3,2,5,4],silph_1:[12,2,10,7],saffron_gym:[25,2,8,5]},spots:[[12,17],[24,12],[10,23]],park:[12,20,9,6],secret:[13,24,'superpotion'],people:[['Empleada de Silph','scientist','Silph ocupa el edificio central. Los Rocket custodian los pisos superiores; buscamos una Tarjeta Llave.'],['Vecino de Azafrán','gentleman','La plaza central conecta las cuatro salidas. El gimnasio de Sabrina queda al noreste.']]},
 fuchsia:{w:36,h:29,theme:'safari',hub:[19,17],roads:[[0,17,35,17],[19,9,19,28],[7,10,29,10],[28,10,28,24]],buildings:{fuchsia_center:[3,20,5,4],fuchsia_shop:[3,3,5,4],fuchsia_house:[24,20,5,4],fuchsia_gym:[24,3,8,5]},spots:[[14,17],[24,12],[10,21]],pond:[3,10,8,5],park:[13,3,7,6],secret:[5,16,'antidote'],pocket:[12,21,'superpotion','cut_use'],people:[['Guarda de la entrada','camper','El Safari se alcanza por la salida oriental. La Casa Secreta está en su zona más apartada.'],['Vecina del guarda','mom','El guarda vive al sureste. Ha perdido su dentadura mientras recorría el Safari.'],['Exploradora','picnicker','Los senderos pequeños al sur del estanque también merecen una visita.']]},
 cinnabar:{w:34,h:28,theme:'volcanic',hub:[17,17],roads:[[17,0,17,23],[4,17,33,17],[7,10,27,10]],buildings:{cinnabar_center:[4,19,5,4],cinnabar_shop:[24,19,5,4],cinnabar_house:[3,3,5,4],mansion_1:[11,3,10,6],cinnabar_gym:[25,4,7,5],cinnabar_lab:[4,11,7,4]},spots:[[14,17],[23,12],[12,23]],secret:[24,11,'repel'],people:[['Científica de la isla','scientist','La mansión conserva diarios de antiguos experimentos. La llave del gimnasio podría seguir en su laboratorio.'],['Marinero de Canela','sailor','El mar rodea la isla. La salida norte llega a Paleta y la oriental vuelve hacia Fucsia.']]},
 indigo:{w:30,h:26,theme:'stone',hub:[16,17],roads:[[15,10,15,25],[5,17,25,17]],buildings:{indigo_arena:[10,2,11,7],indigo_center:[3,11,5,4],indigo_shop:[22,11,5,4],indigo_house:[3,19,5,4]},spots:[[11,17],[21,17],[21,22]],park:[22,19,6,5],secret:[25,22,'superpotion'],people:[['Entrenadora veterana','lass','La Liga son cinco combates consecutivos. Lleva objetos para recuperar PS y estados entre rondas.'],['Guardián de la Meseta','police','Aquí terminan los caminos y empieza la prueba final. El Centro y la tienda están junto a la escalinata.']]},
 oneisland:{w:30,h:26,theme:'volcanic',hub:[16,15],roads:[[15,0,15,25],[5,15,29,15]],buildings:{oneisland_center:[4,5,8,5]},spots:[[20,14],[11,17]],pond:[20,3,6,6],park:[3,18,7,5],secret:[5,21,'repel'],people:[['Excursionista de Prima','hiker','Monte Ascuas se encuentra al norte. Celio investiga una piedra en el Centro Pokémon.'],['Marinera de las islas','sailor','El paso oriental conduce a Quarta cuando Celio te entrega el Pase Arcoíris.']]},
 fourisland:{w:30,h:26,theme:'river',hub:[16,16],roads:[[0,16,26,16],[16,9,16,24]],buildings:{fourisland_center:[3,5,5,4],fourisland_daycare:[19,5,8,5]},spots:[[11,16],[21,14]],pond:[20,19,7,5],park:[3,19,7,4],secret:[5,21,'potion'],people:[['Criadora de Quarta','mom','La guardería está al noreste. Dos Pokémon compatibles pueden dejar un huevo.'],['Cuidador de huevos','youngster','Caminar con un huevo en el equipo ayuda a que eclosione. Puedes recorrer la orilla del estanque.']]}
};
function applyTownDesign(maps){
 // Optional rooms branch from the passenger hall; the captain's story stays intact.
 if(maps.ssanne&&!maps.ssanne_rest){
  const rooms=[['ssanne_rest','Camarote de descanso',3,4],['ssanne_guest','Camarote de pasajeros',7,4],['ssanne_kitchen','Cocina del S. S. Anne',14,4],['ssanne_deck','Cubierta del S. S. Anne',18,12]];
  for(const [id,name,x,y]of rooms){const room=dungeon(id,name,'vermilion','ship');room.theme='ship';room.grid=Array.from({length:18},(_,yy)=>Array.from({length:22},(_,xx)=>xx<2||xx>19||yy<3||yy>16?7:9));stairs('ssanne',x,y,id);maps.ssanne.props.at(-1).kind='cabinDoor';maps.ssanne.signs.push({x:x-1,y:y+1,text:name});}
  npc(maps.ssanne_rest,'host',10,7,'Pasajera hospitalaria','rest',{},'mom');
  npc(maps.ssanne_guest,'traveler',6,8,'Viajera','talk',{lines:['La cocina está al este del pasillo. En el camarote junto a la entrada puedes descansar.','No olvides explorar la cubierta antes de visitar al capitán.']},'lass');
  trainer('ssanne_guest','gentleman',15,10,'Caballero de a bordo',[[58,18],[58,18]],'gentleman','left');
  npc(maps.ssanne_kitchen,'chef',10,6,'Cocinero','talk',{lines:['¡La cena no se prepara sola! Hay provisiones junto a los barriles. Puedes quedarte con el antídoto que encuentres.']},'clerk');
  maps.ssanne_kitchen.items.push({id:'ssanne_kitchen_provisions',x:17,y:9,key:'antidote',qty:1,hidden:true});
  item(maps.ssanne_guest,'gift',5,12,'superpotion',1);
  trainer('ssanne_deck','sailor',15,9,'Marinero de cubierta',[[66,17],[72,17]],'sailor','left');
  npc(maps.ssanne_deck,'watch',5,7,'Vigía','talk',{lines:['Desde aquí se ve todo el muelle. El capitán está en su camarote, al final del pasillo principal.']},'sailor');
  for(const id of ['ssanne','ssanne_cabin','ssanne_rest','ssanne_guest','ssanne_kitchen','ssanne_deck'])maps[id].theme='ship';
 }

 // Additional enterable places, never decorative doors.
 const extra=[['vermilion','vermilion_fanclub','CLUB DE FANS','gentleman','Presidente del club',['Tu compañero disfruta al pasear contigo. Puedes cambiar quién te sigue desde el equipo.','Si has ganado a un entrenador normal, podrás pedirle dos revanchas. Después necesitará descansar.']],['vermilion','vermilion_boathouse','CASA DEL MAR','sailor','Contramaestre',['El muelle central lleva al S. S. Anne. Bill entrega el billete en el cabo, al norte de Ciudad Celeste.','El capitán está en el camarote del fondo. Azul también embarcó esta mañana.']]];
 for(const [parent,id,label,look,name,lines]of extra)if(maps[parent]&&!maps[id]){const r=house(maps[parent],id,2,2,6,4,label,'home');npc(r,'host',10,7,name,'talk',{lines},look);}
 const originals=Object.fromEntries(Object.entries(maps).map(([id,m])=>[id,{w:m.w,h:m.h}]));
 for(const [id,plan]of Object.entries(TOWN_PLANS)){
  const m=maps[id];if(!m)continue;
  const old=originals[id];m.w=plan.w;m.h=plan.h;m.theme=plan.theme;m.worldRevision=3;m.arrival={x:plan.hub[0],y:plan.hub[1]};m.props=[];m.signs=[];m.items=[];m.blockers=[];m.details=[];
  m.grid=Array.from({length:m.h},(_,y)=>Array.from({length:m.w},(_,x)=>x<2||y<2||x>=m.w-2||y>=m.h-2?2:0));
  if(plan.theme==='volcanic'){for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(x<2||x>=m.w-2||y>=m.h-2)m.grid[y][x]=3;}
  if(plan.pond||plan.river){const [x,y,w,h]=plan.pond||plan.river;rect(m,x,y,w,h,3);m.details.push({kind:'pond',x,y,w,h});}
  const roadTile=['stone','city','harbor','lavender'].includes(plan.theme)?11:1;
  for(const [x,y,xx,yy]of plan.roads)path(m,x,y,xx,yy,2,roadTile);
  if(plan.park){const [x,y,w,h]=plan.park;rect(m,x,y,w,h,5);path(m,x+Math.floor(w/2),y,x+Math.floor(w/2),y+h-1,1,1);m.props.push({x:x+1,y:y+2,kind:'bench'});}
  if(id==='vermilion'){
   rect(m,0,20,m.w,13,3);rect(m,1,17,34,3,11);rect(m,20,19,2,6,8);rect(m,32,18,2,15,8);
   for(const x of [2,6,10,16,25,29,34])m.props.push({x,y:19,kind:'bollard'});
   m.props.push({x:2,y:18,kind:'crate'},{x:4,y:19,kind:'barrel'},{x:29,y:19,kind:'crate'},{x:31,y:20,kind:'barrel'});
   m.details.push({kind:'quay',x:1,y:20,w:34,h:1});
  }
  for(const b of m.buildings){const v=plan.buildings[b.id];if(!v)continue;[b.x,b.y,b.w,b.h]=v;b.door={x:b.x+Math.floor(b.w/2),y:b.y+b.h-1};b.variant=({meadow:2,stone:0,river:2,harbor:0,lavender:1,garden:1,city:2,safari:0,volcanic:0})[plan.theme]||0;
   if(b.kind==='ship')b.door={x:20,y:24,side:'up'};
   rect(m,b.x,b.y,b.w,b.h,7);m.grid[b.door.y][b.door.x]=8;
   const d=m.doors.find(d=>d.to===b.id);Object.assign(d,{x:b.door.x,y:b.door.y});
   const r=maps[b.id],outside={x:b.door.x,y:b.door.y+(b.door.side==='up'?-1:1)};
   if(r){r.building=b;for(const p of r.portals.filter(p=>p.to===id)){p.tx=outside.x;p.ty=outside.y;}}
   if(m.grid[outside.y]?.[outside.x]!==undefined)m.grid[outside.y][outside.x]=b.kind==='ship'?8:roadTile;
  }
  // Existing topology is retained; exits get compact positions and explicit routes.
  const sideCount={up:0,down:0,left:0,right:0};
  for(const p of m.portals){const side=p.y===0?'up':p.y===old.h-1?'down':p.x===0?'left':'right';const k=sideCount[side]++;const off=side==='up'||side==='down'?Math.floor(m.w/2)+k*4:Math.floor(m.h/2)+k*4;
   Object.assign(p,side==='up'?{x:off,y:0,w:2,h:1}:side==='down'?{x:off,y:m.h-1,w:2,h:1}:side==='left'?{x:0,y:off,w:1,h:2}:{x:m.w-1,y:off,w:1,h:2});
   if(id==='saffron'&&side==='up')p.x=10;
   if(id==='vermilion'&&side==='down')Object.assign(p,{x:32,y:m.h-1,w:2,h:1});
   const end=side==='up'?[p.x,2]:side==='down'?[p.x,m.h-3]:side==='left'?[2,p.y]:[m.w-3,p.y];
   path(m,p.x,p.y,...end,2,id==='vermilion'&&side==='down'?8:roadTile);p.landing={x:end[0],y:end[1]};
  }
  for(const b of m.buildings){rect(m,b.x,b.y,b.w,b.h,7);m.grid[b.door.y][b.door.x]=8;}
  // Carve narrow footpaths around solid structures rather than through facades.
  const connect=(sx,sy)=>{const start=[sx,sy],q=[start],seen=new Map([[start.join(','),null]]);let found=null;for(let i=0;i<q.length;i++){const [x,y]=q[i];if(x===plan.hub[0]&&y===plan.hub[1]){found=[x,y];break;}for(const [dx,dy]of [[0,1],[1,0],[0,-1],[-1,0]]){const nx=x+dx,ny=y+dy,k=nx+','+ny,t=m.grid[ny]?.[nx];if(t===undefined||[2,3,7].includes(t)||seen.has(k))continue;seen.set(k,[x,y]);q.push([nx,ny]);}}if(!found)throw Error('No path in '+id+' from '+start);while(found){const [x,y]=found;if([0,5].includes(m.grid[y][x]))m.grid[y][x]=roadTile;found=seen.get(found.join(','));}};
  for(const b of m.buildings)connect(b.door.x,b.door.y+(b.door.side==='up'?-1:1));for(const p of m.portals)connect(p.landing.x,p.landing.y);
  // Relocate residents by stable ID; keep story and recovery identities intact.
  const positions=[...plan.spots,[plan.hub[0]+2,plan.hub[1]+2],[plan.hub[0]-3,plan.hub[1]+1]];
  m.npcs.forEach((n,i)=>{let pos=positions[i%positions.length];if(id==='pallet'&&n.id==='guide')pos=[26,14];if(id==='pallet'&&n.id==='oak')pos=[21,13];n.x=n.homeX=pos[0];n.y=n.homeY=pos[1];});
  for(let i=0;i<plan.people.length;i++){const [name,look,text]=plan.people[i],pos=positions[(m.npcs.length)%positions.length];m.npcs.push({id:id+'_town_'+i,x:pos[0],y:pos[1],homeX:pos[0],homeY:pos[1],name,look,dir:'down',role:'talk',data:{lines:[text]}});}
  // Place each NPC on an unoccupied path edge, with a reachable neighboring tile.
  const occupied=new Set(),forbidden=new Set([...m.doors,...m.portals].map(o=>o.x+','+o.y));
  for(const n of m.npcs){let placed=false;for(let radius=0;radius<12&&!placed;radius++)for(let dy=-radius;dy<=radius&&!placed;dy++)for(let dx=-radius;dx<=radius&&!placed;dx++){if(Math.abs(dx)+Math.abs(dy)!==radius)continue;const x=n.homeX+dx,y=n.homeY+dy,t=m.grid[y]?.[x],k=x+','+y;if(x<2||y<2||x>=m.w-2||y>=m.h-2||![0,1,5,11].includes(t)||occupied.has(k)||forbidden.has(k)||Math.abs(x-plan.hub[0])+Math.abs(y-plan.hub[1])<2)continue;Object.assign(n,{x,y,homeX:x,homeY:y});occupied.add(k);placed=true;}if(!placed)throw Error('Cannot place '+n.id);}
  for(const b of m.buildings.filter(b=>b.kind!=='ship')){const x=b.x+1,y=b.y+b.h;if(m.grid[y]?.[x]===0)m.grid[y][x]=5;}
  // A small optional enclosure has one Cut entrance and a reward behind it.
  if(plan.pocket){const [x,y,key,gate]=plan.pocket;rect(m,x,y,5,5,2);rect(m,x+1,y+1,3,3,0);m.grid[y+2][x+4]=1;m.blockers.push({id:id+'_garden_cut',x:x+4,y:y+2,kind:'cut',gate});m.items.push({id:id+'_garden_reward',x:x+2,y:y+2,key,qty:1,hidden:false});}
  const [ix,iy,key]=plan.secret;m.items.push({id:id+'_hidden_cache',x:ix,y:iy,key,qty:1,hidden:true});if(![0,1,5,11].includes(m.grid[iy]?.[ix]))m.grid[iy][ix]=0;
  const sx=Math.max(2,plan.hub[0]-2),sy=plan.hub[1]-1;if(!occupied.has(sx+','+sy)&&![2,3,7].includes(m.grid[sy][sx]))m.signs.push({x:sx,y:sy,text:m.name+' · '+(id==='vermilion'?'Puerto al sur · Club de Fans al norte · Gimnasio al oeste.':m.sub+' · Consulta M para ver las salidas y los edificios.')});
  // Furnish path edges with intentional clusters; leave road surfaces open.
  for(const [x,y]of [[plan.hub[0]-4,plan.hub[1]+2],[plan.hub[0]+4,plan.hub[1]-2]])if(m.grid[y]?.[x]===0&&!occupied.has(x+','+y))m.props.push({x,y,kind:'lamp'});
  // Trees frame blocks instead of occupying the center of empty lawns.
  for(let y=3;y<m.h-3;y++)for(let x=3;x<m.w-3;x++){if(m.grid[y][x]!==0)continue;const near=[...m.npcs,...m.items,...m.signs,...m.doors,...m.blockers].some(o=>Math.abs(o.x-x)+Math.abs(o.y-y)<3);if(!near&&hash(x,y,m.seed+71)>.88&&[[0,1],[1,0],[0,-1],[-1,0]].every(([dx,dy])=>![1,8,11].includes(m.grid[y+dy]?.[x+dx])))m.grid[y][x]=2;}
  // Stable safe arrival also supports saves from previous map dimensions.
  rect(m,plan.hub[0],plan.hub[1],2,2,roadTile);
 }
 for(const m of Object.values(maps))for(const p of m.portals){const dest=maps[p.to];if(!dest?.worldRevision||m.inside&&m.parent===p.to)continue;const back=dest.portals.find(q=>q.to===m.id);if(back?.landing){p.tx=back.landing.x;p.ty=back.landing.y;}else{p.tx=dest.arrival.x;p.ty=dest.arrival.y;}}
 // Each ship room has usable furnishings with matching solid footprints.
 const furniture={
  ssanne:[['plant',3,8,1,1],['bench',5,9,2,1],['table',14,8,2,2],['plant',18,8,1,1],['bench',4,15,2,1],['plant',16,15,1,1]],
  ssanne_cabin:[['bed',4,5,2,3],['bookcase',14,4,3,1],['table',13,9,2,2],['plant',5,13,1,1],['plant',17,13,1,1]],
  ssanne_rest:[['bed',4,5,2,3],['bed',4,11,2,3],['bookcase',14,4,3,1],['table',14,10,2,2],['plant',17,14,1,1]],
  ssanne_guest:[['bed',3,5,2,3],['bed',16,5,2,3],['table',10,9,2,2],['bookcase',16,13,3,1],['plant',3,14,1,1]],
  ssanne_kitchen:[['stove',4,5,3,1],['sink',13,5,3,1],['counter',5,10,3,1],['counter',11,10,3,1],['barrel',17,8,1,1],['crate',18,9,1,1],['barrel',17,10,1,1],['crate',3,14,1,1]],
  ssanne_deck:[['bench',6,11,2,1],['bench',16,13,2,1],['crate',3,13,1,1],['barrel',18,6,1,1]]
 };
 for(const [id,props]of Object.entries(furniture)){const m=maps[id];if(!m)continue;m.worldRevision=3;m.arrival={x:10,y:15};for(const [kind,x,y,w,h]of props){m.props.push({kind,x,y,w,h,solid:true});rect(m,x,y,w,h,7);}}
 if(maps.ssanne){const m=maps.ssanne;rect(m,2,3,18,1,7);rect(m,14,11,6,1,7);m.props.find(p=>p.x===18&&p.y===4).kind='cabinDoor';}
 // Every town's house contains a local clue, not the same generic directions.
 for(const [id,plan]of Object.entries(TOWN_PLANS)){const n=maps[id+'_house']?.npcs.find(n=>n.role==='talk');if(n)n.data.lines=plan.people.map(x=>x[2]);}
}
