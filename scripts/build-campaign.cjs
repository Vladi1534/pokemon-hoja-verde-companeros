// Our map geometry and dialogue. Reference: FRLG progression, not ROM assets/scripts.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),c=vm.createContext({});
for(const f of ['data.js','world.js','town-design.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
vm.runInContext(`
// Remove invented mandatory errands; preserve optional residents and landmarks.
for(const m of Object.values(MAPS)){
 m.items=[];
 for(const p of m.portals)if(['forest_rescue','lantern'].includes(p.gate))p.gate=null;
 for(const n of m.npcs){if(n.role==='heal')n.y=n.homeY=7;if(n.role==='shop')n.y=n.homeY=7;}
}
const removeLink=(a,b)=>{MAPS[a].portals=MAPS[a].portals.filter(p=>p.to!==b);MAPS[b].portals=MAPS[b].portals.filter(p=>p.to!==a);};
removeLink('viridian','forest');
region('route2','Ruta 2','route',80,215,[3,5],[16,19,10,13]);
link('viridian','up','route2','delivery');link('route2','up','forest');
removeLink('moon','cerulean');region('route4','Ruta 4','route',305,130,[8,12],[19,21,27,23]);
link('moon','right','route4','fossils');link('route4','right','cerulean');
removeLink('cerulean','route6');removeLink('saffron','cerulean');
region('route5','Ruta 5','route',355,175,[12,16],[16,52,69]);
link('cerulean','down','route5','bill');link('route5','down','route6');link('route5','right','saffron','tea');
MAPS.route6.name='Ruta 6 · Paso subterráneo';
const daycare=house(MAPS.route5,'route5_daycare',27,4,8,5,'GUARDERÍA','home');npc(daycare,'daycare',10,7,'Cuidador','daycare',{slots:1},'gentleman');
for(const p of MAPS.cerulean.portals)if(p.to==='route9')p.gate='cut_use';
removeLink('viridian','victory');region('route22','Ruta 22','route',30,250,[2,5],[19,21,56]);link('viridian','left','route22');link('route22','up','victory','league_access');
removeLink('fuchsia','sea20');region('route19','Ruta 19','sea',465,450,[25,35],[72,73]);link('fuchsia','down','route19','surf');link('route19','left','sea20');
region('route16','Ruta 16','route',200,225,[20,26],[16,84,19]);region('route17','Ruta 17 · Camino de Bicis','route',200,310,[24,30],[84,20,21]);region('route18','Ruta 18','route',300,400,[25,29],[84,20,22]);link('celadon','left','route16');link('route16','down','route17','snorlax16');link('route17','down','route18');link('route18','right','fuchsia');storyNpc('route16','snorlax16',32,12,'Snorlax dormido','gentleman');
const fly=house(MAPS.route16,'route16_house',27,3,8,5,'CASA DEL BOSQUE','home');storyNpc(fly.id,'fly',10,7,'Entrenadora viajera','lass');
const fossilLab=house(MAPS.cinnabar,'cinnabar_lab',5,2,8,5,'LABORATORIO','lab');storyNpc(fossilLab.id,'restore_fossil',10,7,'Paleontólogo de Canela','scientist');
region('route11','Ruta 11','route',450,350,[12,17],[21,23,27,96]);region('diglett','Cueva Diglett','cave',220,290,[15,22],[50,51]);link('vermilion','right','route11');link('route11','up','diglett');link('diglett','left','route2');link('route11','right','route12','snorlax');
// Five bridge trainers and the recruiter, matching the original event count.
for(const n of MAPS.route24.npcs)n.data.reward=n.data.team?.at(-1)[1]*16;
trainer('route24','bridge3',31,10,'Entrenadora del puente 4',[[16,16],[29,16]],'lass');trainer('route24','bridge4',21,6,'Entrenador del puente 5',[[56,18]],'camper');trainer('route24','recruiter',27,4,'Reclutador Rocket',[[23,15],[41,15]],'rocket');
MAPS.route1.npcs=MAPS.route1.npcs.filter(n=>n.id!=='route1_rival');
trainer('pallet_lab','rival',15,11,'Azul',[[4,5]],'blue');
trainer('route22','rival',10,25,'Azul',[[16,9],[4,9]],'blue');
// Fix original leader levels, retain their complete parties.
GYMS[2].team=[[100,21],[25,18],[26,24]];GYMS[3].team=[[71,29],[114,24],[45,29]];
// The practice guides remain available; old 2.1 trainers keep their location.
MAPS.pallet.npcs=MAPS.pallet.npcs.filter(n=>n.id!=='pallet_youngster');
const oak=npc(MAPS.pallet,'legacy_oak',21,13,'Profesor Oak','story',{key:'oak'},'oak');oak.id='oak';
const guide=npc(MAPS.pallet,'training',26,14,'Guías de Ruta','practice',{},'youngster');guide.id='guide';
// Optional post-League island route to the original breeding unlock.
region('oneisland','Isla Prima','island',680,100,[30,40],[21,22,74,77]);region('ember','Monte Ascuas','cave',680,40,[35,42],[66,67,74,75,77]);region('fourisland','Isla Quarta','island',680,200,[25,35],[79,54,86]);
for(const id of ['oneisland','fourisland']){const m=MAPS[id],center=house(m,id+'_center',5,8,6,5,'CENTRO POKÉMON','center');npc(center,'nurse',10,7,'Enfermera Joy','heal',{},'nurse');npc(center,'pc',17,8,'PC de Bill','pc',{},'pc');}
storyNpc('oneisland_center','celio',5,10,'Celio','scientist');
const nursery=house(MAPS.fourisland,'fourisland_daycare',28,9,8,5,'GUARDERÍA','home');npc(nursery,'daycare',10,7,'Pareja de cuidadores','daycare',{slots:2},'mom');
link('vermilion','down','oneisland','badge7');link('oneisland','up','ember','national');link('oneisland','right','fourisland','rainbow');trainer('ember','rocket',10,25,'Rocket de Monte Ascuas',[[104,37],[105,37]],'rocket');storyNpc('ember','ruby',38,12,'Rubí del volcán','scientist');
// Fix floors and exits after NPC relocation. All coordinates are validated by the server.
for(const m of Object.values(MAPS))for(const n of m.npcs){n.homeX=n.x;n.homeY=n.y;m.grid[n.y][n.x]=m.inside?9:m.kind==='cave'?6:0;}
applyTownDesign(MAPS);
this.result={maps:MAPS,spawn:{map:'pallet',x:21,y:14},gyms:GYMS,league:LEAGUE};
`,c);
const world=JSON.parse(JSON.stringify(c.result));
const encounters=JSON.parse(fs.readFileSync(path.join(root,'campaign-encounters.json'),'utf8'));
// Intentional early-game variety, kept separate from the imported FRLG tables.
const encounterOverrides=JSON.parse(fs.readFileSync(path.join(root,'campaign-encounter-overrides.json'),'utf8'));
for(const [id,table]of Object.entries(encounterOverrides))encounters[id]={...encounters[id],...table,adapted:true};
for(const [id,table]of Object.entries(encounters)){const m=world.maps[id];if(!m)continue;m.encounters=table;m.pool=[...new Set((table.land_mons||table.water_mons||[]).map(x=>x.id))];}
world.maps.viridian.npcs.find(n=>n.id==='viridian_resident').data.lines.push('Al oeste, en Ruta 22, viven Nidoran hembra y macho. Al norte, en Ruta 2, a veces se deja ver un Abra.');
// The invented reserve is not part of the canonical campaign.
world.maps.viridian.portals=world.maps.viridian.portals.filter(p=>p.to!=='reserve');delete world.maps.reserve;

// The online renderer only uses our static geometry; all interactions are server owned.
fs.writeFileSync(path.join(root,'coop-world.js'),'const COOP_WORLD='+JSON.stringify(world)+';\n');
console.log('Campaign geometry: '+Object.keys(world.maps).length+' maps');
