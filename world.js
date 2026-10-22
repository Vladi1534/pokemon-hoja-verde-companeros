'use strict';
const T=32, VW=768, VH=480;
const DIR={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]};
const TYPE_NAMES={normal:'Normal',fire:'Fuego',water:'Agua',grass:'Planta',electric:'Eléctrico',ice:'Hielo',fighting:'Lucha',poison:'Veneno',ground:'Tierra',flying:'Volador',psychic:'Psíquico',bug:'Bicho',rock:'Roca',ghost:'Fantasma',dragon:'Dragón',dark:'Siniestro',steel:'Acero',fairy:'Hada'};
const TYPE_COLORS={normal:'#92907d',fire:'#d8794b',water:'#5488bd',grass:'#739956',electric:'#c49f3e',ice:'#65a7ab',fighting:'#ad6252',poison:'#9461a5',ground:'#b89b5e',flying:'#919ec5',psychic:'#b96c8e',bug:'#95a547',rock:'#a69664',ghost:'#7c70a2',dragon:'#7378b4',dark:'#72655d',steel:'#839894',fairy:'#c18da7'};
const GYMS=[
 {town:'pewter',name:'Brock',title:'La firmeza de la roca',type:'rock',badge:'Roca',team:[[74,12],[95,14]],quote:'Mis Pokémon tienen una defensa impenetrable. ¡Veamos tu estrategia!'},
 {town:'cerulean',name:'Misty',title:'La fuerza de la corriente',type:'water',badge:'Cascada',team:[[120,18],[121,21]],quote:'¡Un buen combate debe fluir como el agua!'},
 {town:'vermilion',name:'Lt. Surge',title:'Una descarga de energía',type:'electric',badge:'Trueno',team:[[100,21],[25,22],[26,24]],quote:'¡Prepárate para una batalla electrizante!'},
 {town:'celadon',name:'Erika',title:'El jardín de los sueños',type:'grass',badge:'Arcoíris',team:[[71,28],[114,27],[45,29]],quote:'Bienvenido a mi jardín. Las flores también saben defenderse.'},
 {town:'fuchsia',name:'Koga',title:'El arte de la paciencia',type:'poison',badge:'Alma',team:[[109,32],[89,33],[110,35]],quote:'La paciencia y el veneno son armas de un maestro ninja.'},
 {town:'saffron',name:'Sabrina',title:'Más allá de lo visible',type:'psychic',badge:'Pantano',team:[[64,36],[122,37],[65,39]],quote:'He sentido que llegarías. Muéstrame el vínculo con tu equipo.'},
 {town:'cinnabar',name:'Blaine',title:'Un corazón encendido',type:'fire',badge:'Volcán',team:[[58,40],[78,41],[59,43]],quote:'¡La llama del conocimiento nunca se apaga!'},
 {town:'viridian',name:'Giovanni',title:'La última medalla',type:'ground',badge:'Tierra',team:[[51,43],[31,44],[34,44],[112,46]],quote:'Has llegado lejos. Esta será la prueba definitiva de tus ocho medallas.'}
];
const LEAGUE=[{name:'Lorelei',team:[[87,47],[91,48],[131,49]]},{name:'Bruno',team:[[95,48],[107,49],[68,50]]},{name:'Agatha',team:[[94,49],[42,50],[94,51]]},{name:'Lance',team:[[130,50],[142,51],[149,53]]},{name:'Azul',team:[[18,52],[65,52],[112,53],[130,53],[6,55]]}];
const REGIONS=[
 {id:'pallet',name:'Pueblo Paleta',sub:'Donde comienza tu historia',kind:'village',north:'route1',pool:[],levels:[2,3]},
 {id:'route1',name:'Ruta 1',sub:'El sendero de los primeros pasos',kind:'route',north:'viridian',south:'pallet',pool:[16,19,10,13],levels:[2,5]},
 {id:'viridian',name:'Ciudad Verde',sub:'Entre el bosque y el horizonte',kind:'town',north:'forest',south:'route1',pool:[],levels:[4,6]},
 {id:'forest',name:'Bosque Verde',sub:'El rumor de las hojas',kind:'forest',north:'pewter',south:'viridian',pool:[10,11,13,14,25,16,43],levels:[4,8]},
 {id:'pewter',name:'Ciudad Plateada',sub:'Firme como la roca',kind:'town',north:'moon',south:'forest',gate:1,pool:[],levels:[8,12]},
 {id:'moon',name:'Monte Moon',sub:'Secretos bajo la montaña',kind:'cave',north:'cerulean',south:'pewter',pool:[41,74,46,35,27,39],levels:[10,16]},
 {id:'cerulean',name:'Ciudad Celeste',sub:'Una ciudad de aguas cristalinas',kind:'waterTown',north:'route6',south:'moon',gate:2,pool:[],levels:[14,18]},
 {id:'route6',name:'Sendero del Río',sub:'Un camino hacia el mar',kind:'river',north:'vermilion',south:'cerulean',pool:[43,69,52,56,63,17,21,23],levels:[15,21]},
 {id:'vermilion',name:'Ciudad Carmín',sub:'La brisa que trae nuevas historias',kind:'port',north:'celadon',south:'route6',gate:3,pool:[],levels:[18,23]},
 {id:'celadon',name:'Ciudad Azulona',sub:'Jardines en el corazón de Kanto',kind:'garden',north:'fuchsia',south:'vermilion',gate:4,pool:[37,58,133,44,70],levels:[23,29]},
 {id:'fuchsia',name:'Ciudad Fucsia',sub:'Donde la naturaleza se siente en casa',kind:'safari',north:'saffron',south:'celadon',gate:5,pool:[29,32,102,111,115,123,127,128,84,48],levels:[27,34]},
 {id:'saffron',name:'Ciudad Azafrán',sub:'Mil caminos, un mismo destino',kind:'city',north:'cinnabar',south:'fuchsia',gate:6,pool:[],levels:[33,38]},
 {id:'cinnabar',name:'Isla Canela',sub:'El fuego que duerme bajo el mar',kind:'island',north:'viridian',south:'saffron',gate:7,pool:[77,88,109,126,132,114],levels:[36,42]},
 {id:'indigo',name:'Meseta Añil',sub:'El camino a la cima',kind:'league',pool:[66,67,75,95,105,112],levels:[40,46]},
 {id:'reserve',name:'Reserva de Kanto',sub:'Cada encuentro es una nueva historia',kind:'reserve',pool:[],levels:[35,50]}
];
const MAPS={};
function hash(x,y,s=1){const n=Math.sin(x*127.1+y*311.7+s*91.3)*43758.5453;return n-Math.floor(n)}
function rect(m,x,y,w,h,t){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(m.grid[j]&&m.grid[j][i]!==undefined)m.grid[j][i]=t}
function path(m,x1,y1,x2,y2,width=2){const s=Math.sign(x2-x1),v=Math.sign(y2-y1);for(let x=x1;;x+=s){rect(m,x,y1,width,width,1);if(x===x2)break}for(let y=y1;;y+=v){rect(m,x2,y,width,width,1);if(y===y2)break}}
function npc(m,id,x,y,name,role,data={},look='person'){m.npcs.push({id:m.id+'_'+id,x,y,name,role,data,look,dir:'down'})}
function item(m,id,x,y,key,qty){m.items.push({id:m.id+'_'+id,x,y,key,qty});m.grid[y][x]=0}
function house(m,id,x,y,w,h,label,kind,extra={}){const door={x:x+Math.floor(w/2),y:y+h-1};rect(m,x,y,w,h,7);m.grid[door.y][door.x]=8;path(m,door.x,door.y+1,21,door.y+2,1);m.buildings.push({id,x,y,w,h,label,kind,door,...extra});m.doors.push({x:door.x,y:door.y,to:id});return door}
function makeRegion(c,idx){const m={...c,w:44,h:c.kind==='forest'?42:34,grid:[],buildings:[],npcs:[],items:[],doors:[],portals:[],signs:[],inside:false,seed:idx+1};
 m.grid=Array.from({length:m.h},(_,y)=>Array.from({length:m.w},(_,x)=>x<2||y<2||x>m.w-3||y>m.h-3?2:0));
 const natural=['route','forest','cave','river','reserve'].includes(c.kind);
 if(natural){for(let y=2;y<m.h-2;y++)for(let x=2;x<m.w-2;x++){const n=hash(Math.floor(x/3),Math.floor(y/3),idx);m.grid[y][x]=n>.65?2:n>.25?4:0}path(m,21,0,21,m.h-1,2);path(m,7,8,34,8);path(m,7,m.h-10,34,m.h-10);path(m,7,8,7,m.h-10);path(m,34,8,34,m.h-10);rect(m,18,4,8,5,0);path(m,21,0,21,m.h-1,2)}
 else {for(let y=3;y<m.h-3;y++)for(let x=3;x<m.w-3;x++)if(hash(x,y,idx)>.988)m.grid[y][x]=5;path(m,21,0,21,m.h-1,2);path(m,4,17,39,17,3);}
 if(['forest','route','river','safari','reserve'].includes(c.kind)){rect(m,27,14,9,7,4);rect(m,5,21,10,7,4);rect(m,28,14,6,4,3);if(c.kind==='river'){rect(m,2,15,40,4,3);rect(m,20,14,4,6,8);path(m,7,8,7,13);path(m,34,20,34,30)}if(c.kind==='forest'){rect(m,6,11,5,8,2);rect(m,12,22,5,8,2)}}
 if(c.kind==='cave'){for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){if(m.grid[y][x]===0)m.grid[y][x]=6;if(m.grid[y][x]===4)m.grid[y][x]=6;if(m.grid[y][x]===2)m.grid[y][x]=7}rect(m,26,14,7,5,3);npc(m,'rocket',21,15,'Recluta Rocket','trainer',{team:[[41,12],[23,13]],quote:'¡Los fósiles del Monte Moon serán nuestros!',reward:500},'rocket');npc(m,'fossil',31,8,'Investigador','giftmon',{id:138,level:12,text:'Rescataste este fósil de las manos del Team Rocket. ¡Cuida de Omanyte!'},'oak');item(m,'moonstone',8,8,'candy',2)}
 if(!natural){if(c.id==='pallet'){house(m,'pallet_home',12,8,5,4,'TU CASA','home');house(m,'pallet_rival',27,8,5,4,'CASA DE AZUL','home');house(m,'pallet_lab',27,21,7,5,'LABORATORIO OAK','lab');rect(m,3,23,10,7,3);rect(m,7,18,8,3,5);npc(m,'neighbor',15,15,'Vecina','talk',{lines:['Tu compañero camina detrás de ti. Date la vuelta y pulsa Z para hablarle.','En Equipo puedes elegir qué Pokémon te acompaña.']},'leaf');m.signs.push({x:19,y:18,text:'Pueblo Paleta · Tu aventura empieza con un pequeño paso.'});}
 else{house(m,c.id+'_center',5,9,5,4,'CENTRO POKÉMON','center');house(m,c.id+'_shop',32,9,5,4,'TIENDA','shop');const gi=GYMS.findIndex(g=>g.town===c.id);if(gi>=0)house(m,c.id+'_gym',28,22,7,5,'GIMNASIO','gym',{gym:gi});house(m,c.id+'_house',6,23,5,4,c.kind==='port'?'CASA DEL PESCADOR':'CASA','home');rect(m,7,15,5,2,5);rect(m,33,15,4,2,5);npc(m,'guide',18,18,'Guía local','guide',{},'person');m.signs.push({x:24,y:18,text:c.name+' · Centro Pokémon al oeste, Tienda al este.'});}
 if(['waterTown','port','island'].includes(c.kind)){rect(m,4,3,12,4,3);rect(m,27,3,13,4,3);if(c.kind==='port'){rect(m,13,23,12,9,3);rect(m,20,22,3,11,8);npc(m,'fisher',20,23,'Pescador','rod',{},'person')}}
 if(c.kind==='garden'){rect(m,5,3,12,4,5);rect(m,28,3,12,4,5);rect(m,5,28,12,3,4);npc(m,'rocket',22,7,'Recluta Rocket','trainer',{team:[[20,25],[109,26]],quote:'¡Azulona es territorio Rocket!',reward:1000},'rocket');npc(m,'eevee',8,18,'Criadora','giftmon',{id:133,level:20,text:'Eevee necesita un hogar. Sé que contigo vivirá muchas aventuras.'},'leaf')}
 if(c.kind==='safari'){rect(m,4,3,13,4,4);rect(m,27,3,13,4,4);rect(m,3,28,14,4,4);npc(m,'warden',25,18,'Guarda Safari','surf',{},'person')}
 if(c.kind==='island'){rect(m,3,3,14,5,6);rect(m,28,3,13,5,6);rect(m,3,28,13,4,4);npc(m,'scientist',18,8,'Científica','giftmon',{id:140,level:32,text:'¡La restauración del fósil ha funcionado! Kabuto te acompañará.'},'oak')}
 if(c.kind==='league'){house(m,'indigo_arena',17,4,11,7,'LIGA POKÉMON','league');path(m,21,11,21,23,3);rect(m,3,28,14,4,4)}
 }
 if(c.id==='route1'){npc(m,'rival',25,8,'Azul','rival',{},'person');npc(m,'gift',18,26,'Ayudante de Oak','gift',{key:'potion',qty:3,text:'Los primeros pasos son importantes. ¡Llévate estas tres pociones!'},'oak');item(m,'ball',7,10,'ball',5)}
 if(c.id==='forest'){npc(m,'bugcatcher',20,12,'Cazabichos Leo','trainer',{team:[[10,5],[13,6]],quote:'¡Mira los Pokémon que encontré en el bosque!',reward:260},'person');npc(m,'bugcatcher2',33,30,'Cazabichos Nico','trainer',{team:[[11,7],[12,8]],quote:'¡Mis bichos no dejan de evolucionar!',reward:360},'person');item(m,'potion',8,30,'potion',2);item(m,'balls',34,8,'ball',5)}
 if(c.id==='route6'){npc(m,'camper',20,10,'Campista Ana','trainer',{team:[[52,18],[56,19]],quote:'¡Un combate antes de llegar a Ciudad Carmín!',reward:600},'leaf');npc(m,'camper2',34,27,'Entrenador Luis','trainer',{team:[[63,19],[17,20]],quote:'Combinar tipos abre muchas posibilidades.',reward:700},'person');item(m,'super',8,8,'superball',5)}
 if(c.id==='cerulean'){npc(m,'caveguard',10,7,'Guardián de la cueva','mewtwo',{},'person')}
 if(c.id==='saffron'){npc(m,'lapras',10,18,'Empleado de Silph','giftmon',{id:131,level:30,text:'Gracias por frenar al Team Rocket. ¡Lapras estará feliz contigo!'},'oak')}
 if(c.id==='reserve'){m.pool=Object.keys(SPECIES).map(Number);rect(m,15,11,14,13,4);path(m,0,17,21,17);m.portals.push({x:0,y:17,w:1,h:2,to:'viridian',tx:41,ty:20});npc(m,'researcher',23,16,'Prof. Oak','talk',{lines:['Esta reserva reúne a los 151 Pokémon de Kanto. Busca en la hierba para completar tu Pokédex.','Es una zona especial de esta adaptación. Aquí puedes encontrar también otros iniciales y Pokémon legendarios.']},'oak');item(m,'master',7,8,'masterball',1)}
 if(c.north){rect(m,21,0,2,3,1);m.portals.push({x:21,y:0,w:2,h:1,to:c.north,entry:'south',badge:c.gate||0,rocket:c.id==='celadon'});m.signs.push({x:24,y:3,text:'↑ '+REGIONS.find(r=>r.id===c.north).name+(c.gate?' · Requiere la medalla '+GYMS[c.gate-1].badge:'')})}
 if(c.south){rect(m,21,m.h-3,2,3,1);m.portals.push({x:21,y:m.h-1,w:2,h:1,to:c.south,entry:'north'})}
 if(c.id==='viridian'){path(m,0,20,43,20);m.portals.push({x:0,y:20,w:1,h:2,to:'indigo',tx:41,ty:17,badge:8});m.portals.push({x:43,y:20,w:1,h:2,to:'reserve',tx:2,ty:17,champion:true});m.signs.push({x:3,y:19,text:'← Meseta Añil · Solo entrenadores con ocho medallas.'})}
 if(c.id==='indigo'){path(m,21,17,43,17);m.portals.push({x:43,y:17,w:1,h:2,to:'viridian',tx:2,ty:20})}
 if(!natural){for(let y=3;y<m.h-3;y++)for(let x=3;x<m.w-3;x++){if(m.grid[y][x]!==0)continue;const protectedSpot=[...m.npcs,...m.signs,...m.items,...m.doors].some(p=>Math.abs(x-p.x)+Math.abs(y-p.y)<3);if(protectedSpot)continue;const nearHouse=m.buildings.some(b=>x>=b.x-1&&x<=b.x+b.w&&y>=b.y-1&&y<=b.y+b.h+1);if(nearHouse)continue;if(hash(x,y,17+m.seed)>.915)m.grid[y][x]=2;else if(hash(x,y,41+m.seed)>.98)m.grid[y][x]=5}}
 m.npcs.forEach(n=>{m.grid[n.y][n.x]=c.kind==='cave'?6:0});m.signs.forEach(s=>{m.grid[s.y][s.x]=0});MAPS[m.id]=m;return m;
}
function makeInterior(parent,b){const m={id:b.id,name:b.label,sub:parent.name,kind:b.kind,inside:true,w:22,h:18,grid:[],buildings:[],npcs:[],items:[],doors:[],portals:[],signs:[],pool:[],levels:[1,1],seed:19,parent:parent.id,building:b};m.grid=Array.from({length:m.h},(_,y)=>Array.from({length:m.w},(_,x)=>x===0||y<3||x===m.w-1||y===m.h-1?7:9));rect(m,10,17,2,1,8);m.portals.push({x:10,y:17,w:2,h:1,to:parent.id,tx:b.door.x,ty:b.door.y+1});
 if(b.kind==='center'){rect(m,4,5,14,2,7);rect(m,10,6,2,1,9);npc(m,'nurse',10,5,'Enfermera Joy','heal',{},'nurse');npc(m,'pc',17,8,'PC de Bill','pc',{},'pc');npc(m,'visitor',5,11,'Entrenadora','talk',{lines:['La curación es gratuita. Se restauran los PS, los PP y los estados de todo tu equipo.','El PC guarda los Pokémon cuando llevas seis. Puedes intercambiarlos aquí.']},'leaf')}
 if(b.kind==='shop'){rect(m,4,5,14,2,7);rect(m,10,6,2,1,9);npc(m,'clerk',10,5,'Dependiente','shop',{},'person');npc(m,'visitor',5,11,'Compradora','talk',{lines:['Debilita a un Pokémon antes de lanzar una Poké Ball. Dormirlo o paralizarlo facilita la captura.']},'leaf')}
 if(b.kind==='lab'){rect(m,3,4,6,3,7);rect(m,14,4,5,3,7);npc(m,'oak',10,7,'Profesor Oak','oak',{},'oak');npc(m,'assistant',5,10,'Ayudante','talk',{lines:['El primer Pokémon de tu equipo te sigue por el mapa. Puedes acariciarlo con Z cuando estés frente a él.','Tu partida se guarda automáticamente al terminar un combate, entrar en otra zona o cambiar el equipo.']},'person')}
 if(b.kind==='home'){npc(m,'mom',10,7,parent.id==='pallet'?'Mamá':'Vecina','rest',{},'leaf');rect(m,3,4,3,3,7);rect(m,15,5,3,3,7)}
 if(b.kind==='gym'){m.gym=b.gym;rect(m,8,4,6,3,8);npc(m,'leader',10,6,GYMS[b.gym].name,'gym',{gym:b.gym},b.gym===0?'brock':b.gym===1?'misty':'person');npc(m,'coach',7,13,'Consejero','coach',{gym:b.gym},'person');rect(m,3,8,3,2,7);rect(m,16,8,3,2,7)}
 if(b.kind==='league'){rect(m,8,4,6,5,8);npc(m,'league',10,7,'Guardián de la Liga','league',{},'oak')}
 MAPS[m.id]=m;return m;
}
REGIONS.forEach((c,i)=>makeRegion(c,i));Object.values(MAPS).forEach(m=>m.buildings.forEach(b=>makeInterior(m,b)));
