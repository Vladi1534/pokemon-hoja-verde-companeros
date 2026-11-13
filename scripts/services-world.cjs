// Give imported residents their services without changing native map geometry.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
module.exports=function(world){
 const source=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'../assets/leafgreen-world/runtime-world.json.gz')))).maps;
 const maps=Object.values(world.maps).filter(m=>!m.aliasOf&&!m.extension),byName=Object.fromEntries(maps.map(m=>[m.native.name,m]));
 const assign=(m,index,role,name,data)=>{const n=m.npcs.find(n=>n.nativeIndex===index);if(!n)throw Error('Missing service '+m.id+':'+index);Object.assign(n,{role,name,data:{...n.data,...data}});return n;};
 for(const m of maps){
  const name=m.native.name;
  const floor=/DepartmentStore_(\d)F/.exec(name);if(floor)m.name='Grandes Almacenes · '+floor[1]+'.º piso';if(name==='CeladonCity_DepartmentStore_Roof')m.name='Grandes Almacenes · Azotea';if(name==='CeladonCity_GameCorner_PrizeRoom')m.name='Casino · Sala de premios';if(name==='CeruleanCity_BikeShop')m.name='Tienda de bicicletas';
  for(const n of m.npcs){const obj=source[m.native.id]?.events.objects[n.nativeIndex];if(obj)n.nativeScript=obj.symbols?.script;}
  if(/PokemonCenter_1F$/.test(name)){
   const joy=m.npcs.find(n=>n.role==='heal');if(!joy)throw Error('Center has no nurse '+m.id);
   let x=joy.x+2,y=joy.y;if(m.npcs.some(n=>n.x===x&&n.y===y))x=joy.x-2;
   if(m.npcs.some(n=>n.x===x&&n.y===y))throw Error('Nature nurse cell occupied '+m.id);
   m.npcs.push({id:m.id+'_nature_nurse',x,y,homeX:x,homeY:y,dir:'down',name:'Enfermera Iris',look:'native_nurse',nativeGraphic:'OBJ_EVENT_GFX_NURSE',role:'nature',data:{key:'nature'}});
  }
  for(const n of m.npcs.filter(n=>n.role==='shop')){
   n.data.stock=/ViridianCity/.test(name)?'early':/PewterCity/.test(name)?'pewter':/CeruleanCity/.test(name)?'cerulean':/Fuchsia|Cinnabar|Saffron|Indigo|Island/.test(name)?'late':'standard';
  }
  if(name==='Route1'){
   const native=m.npcs.find(n=>n.nativeIndex===0),old=m.npcs.find(n=>n.id==='route1_gift');
   if(old&&old!==native)m.npcs.splice(m.npcs.indexOf(old),1);
   Object.assign(native,{id:'route1_gift',role:'service',name:'Empleado de la Tienda',data:{key:'route1_potion'}});
  }
  if(name==='CeruleanCity_BikeShop')assign(m,0,'service','Dueño de la tienda de bicicletas',{key:'bicycle'});
  if(name==='VermilionCity_PokemonFanClub')assign(m,0,'service','Presidente del Club Pokémon',{key:'bike_voucher'});
  if(name==='CeladonCity_DepartmentStore_1F')assign(m,0,'service','Recepcionista',{key:'department_guide'});
  if(name==='CeladonCity_DepartmentStore_2F'){assign(m,1,'shop','Dependiente · Objetos',{stock:'department_items'});assign(m,2,'shop','Dependiente · MT',{stock:'department_tm'});}
  if(name==='CeladonCity_DepartmentStore_3F')assign(m,0,'tutor','Tutor de Contraataque',{move:68,key:'counter_tutor'});
  if(name==='CeladonCity_DepartmentStore_4F')assign(m,2,'shop','Dependiente · Piedras',{stock:'department_stones'});
  if(name==='CeladonCity_DepartmentStore_5F'){assign(m,2,'shop','Dependiente · Combate',{stock:'department_battle'});assign(m,3,'shop','Dependiente · Vitaminas',{stock:'department_vitamins'});}
  if(name==='CeladonCity_DepartmentStore_Roof'){
   assign(m,1,'service','Niña sedienta',{key:'thirsty_girl'});
   for(const b of source[m.native.id].events.background.filter(b=>b.symbols?.script?.endsWith('VendingMachine')))m.npcs.push({id:m.id+'_vending_'+b.x,x:b.x,y:b.y,homeX:b.x,homeY:b.y,name:'Máquina de bebidas',role:'shop',look:'pc',dir:'down',staticObject:true,data:{stock:'vending'}});
  }
  if(name==='CeladonCity_Restaurant')assign(m,3,'service','Cliente del restaurante',{key:'coin_case'});
  if(name==='CeladonCity_GameCorner'){
   assign(m,0,'service','Información del casino',{key:'casino_info'});assign(m,1,'casino','Vendedor de fichas',{service:'coins'});
   for(const [index,amount]of [[4,10],[7,20],[9,20]])assign(m,index,'service','Cliente del casino',{key:'coin_gift',amount});
   for(const b of source[m.native.id].events.background.filter(b=>/_SlotMachine\d+$/.test(b.symbols?.script||'')))m.npcs.push({id:m.id+'_slot_'+b.x+'_'+b.y,x:b.x,y:b.y,homeX:b.x,homeY:b.y,name:'Tragaperras',role:'casino',look:'pc',dir:'down',staticObject:true,data:{service:'slots'}});
  }
  if(name==='CeladonCity_GameCorner_PrizeRoom'){assign(m,2,'casino','Premios · Pokémon',{service:'prizes',prizeGroup:'pokemon'});assign(m,3,'casino','Premios · MT',{service:'prizes',prizeGroup:'machines'});assign(m,4,'casino','Premios · Objetos',{service:'prizes',prizeGroup:'items'});}
 }
 // The original voucher gives the bicycle before the cycling road is reached.
 for(const m of maps)for(const d of [...m.portals,...m.doors,...m.nativeConnections])if(world.maps[d.to]?.native?.name==='Route17')d.gate='bicycle';
 world.servicesRevision=1;
 world.storyAnchors=Object.fromEntries(Object.values(world.maps).filter(m=>!m.aliasOf).flatMap(m=>m.npcs.map(n=>[n.id,{map:m.id,x:n.x,y:n.y}])));
};
