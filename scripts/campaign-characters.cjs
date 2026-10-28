// Optional anime episodes enrich the route without replacing FRLG's main objectives.
module.exports=function applyCharacters(world){
 const looks=['brock','misty','surge','erika','koga','sabrina','blaine','giovanni'];
 for(const map of Object.values(world.maps))for(const n of map.npcs){
  if(n.role==='gym')n.look=looks[n.data.gym];
  else if(/giovanni/i.test(n.name))n.look='giovanni';
  else if(n.role==='league'){n.look='lorelei';n.name=world.league[0].name;}
  else if(n.look==='rocket'&&(n.x+n.y)%2)n.look='rocketF';
 }
 const add=(map,key,x,y,name,role,look,data)=>{
  const m=world.maps[map],id=map+'_'+key;
  // Never silently carve scenery for an NPC. These are existing open floor cells.
  if(![0,1,4,6,9,10].includes(m.grid[y]?.[x])||m.npcs.some(n=>n.x===x&&n.y===y))throw Error('Occupied character cell: '+id);
  m.npcs.push({id,x,y,homeX:x,homeY:y,dir:'down',name,role,look,data});return id;
 };
 add('route1','ash',23,28,'Ash Ketchum','practice','ash',{
  anime:true,team:[[25,7],[16,6]],flag:'anime_ash_training',
  quote:'¡Soy Ash, de Pueblo Paleta! Pikachu y yo estamos entrenando para nuestro próximo viaje. ¿Practicamos? Tu equipo quedará como estaba al terminar.',
  after:'¡Buen combate! Confía en tu compañero y observa los tipos de tus rivales. Nos volveremos a encontrar por Kanto.'
 });
 const episodes=[
  {map:'moon_b2',x:13,y:12,requires:['badge1'],level:14,jessie:23,james:109,title:'Rocket: los fósiles del Moon',quote:'Jessie: ¡Esos fósiles nos darán la recompensa que merecemos! James, vigila la salida. Meowth, deja de contar las monedas antes de tiempo.',after:'James: Ni fósiles ni recompensa… Jessie insiste en que el próximo plan sí funcionará.'},
  {map:'ssanne',x:6,y:11,requires:['bill'],level:21,jessie:23,james:109,title:'Rocket: polizones a bordo',quote:'James: El plan era viajar de incógnito. Jessie: ¡Y salir con todos los Pokémon del barco! Meowth: Creo que ya nos descubrieron…',after:'Jessie: ¡Tendremos que desembarcar antes de que venga el capitán! Esto no ha terminado.'},
  {map:'silph_3',x:13,y:12,requires:['flute'],level:34,jessie:24,james:110,title:'Rocket: una última oportunidad',quote:'Jessie: El jefe espera resultados. James: Esta vez Arbok y Weezing están preparados. Meowth: ¡Que nadie toque esos inventos de Silph!',after:'Meowth: Mejor nos vamos antes de que Giovanni se entere de otro fracaso…'}
 ];
 for(const e of episodes){
  const opponents=[{name:'Jessie',team:[[e.jessie,e.level],[52,e.level-1]]},{name:'James',team:[[e.james,e.level]]}];
  const id=add(e.map,'anime_rocket',e.x,e.y,'Jessie y James','trainer','jessie',{anime:true,requires:e.requires,sight:2,title:e.title,quote:e.quote,after:e.after,opponents,team:opponents.flatMap(o=>o.team)});
  add(e.map,'anime_james',e.x+1,e.y,'James','talk','james',{anime:true,challenge:id,lines:[e.quote],after:e.after});
  add(e.map,'anime_meowth',e.x+2,e.y,'Meowth','talk','meowth',{anime:true,challenge:id,lines:['Meowth: ¡Jessie y James están preparando otro de sus planes!'],after:e.after});
 }
};
