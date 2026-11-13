import {items,stats,species,move,createMon,addMon,rng} from './creatures.mjs';
import {natureNames,natureEffect} from './nature-guide.mjs';
import {NATURE_PRICE,shopStocks,shopTitles,casinoPrizes} from './service-catalog.mjs';
import tutors from './data/tutors.json' with {type:'json'};
export {NATURE_PRICE,shopStocks,shopTitles,casinoPrizes};
export function naturePreview(mon,nature){if(!natureNames.includes(nature))throw Error('Naturaleza desconocida.');return {nature,...natureEffect(nature),before:stats(mon),after:stats({...mon,nature}),price:NATURE_PRICE};}
export function canTeach(mon,id,tutor=false){return !mon.eggSteps&&(tutor?(tutors[String(id)]||[]).includes(mon.species):species(mon.species).machines.includes(id))&&!mon.moves.some(m=>m.id===id);}
export function shopStock(n){return shopStocks[n.data?.stock]||shopStocks.standard;}
export function canCycle(map,position){return !!map&&!map.inside&&!map.dungeon&&map.grid[position.y]?.[position.x]!==3;}
const grant=(m,key,qty=1)=>m.bag[key]=(m.bag[key]||0)+qty;
export function serviceInteract(s,m,p,n,input={}){
 const progress=s.progress,key=n.data?.key;
 if(n.role==='nature')return {service:'nature',npc:n.id,text:'Soy Iris. Por ₽5.000 puedo cambiar la naturaleza de tu compañero. Sus IV, EV, ataques y experiencia se conservan. Puedes comparar las estadísticas antes de decidir.'};
 if(n.role==='casino')return {service:'casino',npc:n.id,mode:n.data.service,text:'Tus fichas quedan guardadas en el Monedero.'};
 if(n.role==='tutor')return {service:'tutor',npc:n.id,move:n.data.move,text:'Puedo enseñar Contraataque una vez, sin costo. Elige con cuidado a tu compañero.'};
 if(n.role!=='service')return undefined;
 if(key==='route1_potion'){if(m.rewards.route1_gift)return 'La poción que te regalé está en tu mochila. En la tienda de Ciudad Verde puedes reponer tus objetos.';grant(m,'potion');m.rewards.route1_gift=true;return 'Trabajo en la Tienda Pokémon de Ciudad Verde. ¡Toma esta Poción de muestra! La guardaste en Medicina; recupera 20 PS.';}
 if(key==='bike_voucher'){if(progress.bicycle)return '¡Ya tienes tu bicicleta! Visita el Camino de Bicis cuando puedas despertar a Snorlax.';progress.bike_voucher=true;return 'Mi Rapidash es un compañero maravilloso. ¡Gracias por escucharme! Toma este Bono Bici y cámbialo por una bicicleta en Ciudad Celeste.';}
 if(key==='bicycle'){if(progress.bicycle)return 'Disfruta de tu bicicleta. Usa el botón Bici o la tecla B para subir y bajar al aire libre.';if(!progress.bike_voucher)return 'Aceptamos el Bono Bici del presidente del Club Pokémon de Ciudad Carmín. Visítalo y escucha su historia.';progress.bicycle=true;return '¡Bono canjeado! Recibiste la Bicicleta. Está en Objetos Clave y también puedes activarla con B.';}
 if(key==='department_guide')return 'Bienvenido a los grandes almacenes de Azulona. 2.º: objetos y MT. 3.º: tutor de Contraataque. 4.º: piedras evolutivas. 5.º: vitaminas y objetos de combate. Azotea: bebidas. Usa las escaleras o el ascensor.';
 if(key==='coin_case'){if(progress.coin_case)return 'Tus fichas estarán seguras en el Monedero. Los premios se canjean en el edificio junto al casino.';progress.coin_case=true;return 'He terminado de jugar por hoy. Quédate con mi Monedero; guarda hasta 9.999 fichas. El casino y su sala de premios están en Azulona.';}
 if(key==='casino_info')return 'Compra fichas en el mostrador y úsalas en las tragaperras. Cada tirada cuesta 3 fichas. También puedes canjear fichas directamente por Pokémon, MT y objetos en la sala de premios. Necesitas el Monedero del cliente del restaurante.';
 if(key==='coin_gift'){if(!progress.coin_case)return 'Consigue primero un Monedero en el restaurante de Azulona.';if(m.rewards[n.id])return 'Ya te compartí unas fichas. Revisa los premios antes de gastarlas.';if((m.coins||0)+n.data.amount>9999)throw Error('Tu Monedero está lleno.');m.coins=(m.coins||0)+n.data.amount;m.rewards[n.id]=true;return '¡Toma '+n.data.amount+' fichas! Las guardaste en tu Monedero.';}
 if(key==='thirsty_girl')return {service:'drinks',npc:n.id,text:'Tengo sed. Por cada bebida diferente que me compartas te daré una MT. Solo puedo darte cada regalo una vez.'};
 return undefined;
}
const actionNames=new Set(['nature_change','buy','bicycle','teach_move','equip_item','casino_buy','casino_spin','casino_prize','give_drink']);
export function serviceAction(ctx,m,p,v,world){
 if(!actionNames.has(v.action))return undefined;
 const find=role=>{const n=world.maps[p.map].npcs.find(n=>(!v.npc||n.id===v.npc)&&role.includes(n.role)&&Math.abs(p.x-n.x)+Math.abs(p.y-n.y)<=3);if(!n)throw Error('Acércate al personaje o servicio correspondiente.');return n;};
 const mon=()=>{const q=m.party.find(q=>q.uid===v.mon);if(!q||q.eggSteps)throw Error('Elige un Pokémon de tu equipo, sin huevos.');if(q.pending.length)throw Error('Resuelve primero sus aprendizajes o evoluciones pendientes.');return q;};
 if(v.action==='nature_change'){
  find(['nature']);const q=mon();naturePreview(q,v.nature);
  if(q.nature===v.nature)throw Error('Ya tiene esa naturaleza. No se cobró nada.');
  if(m.money<NATURE_PRICE)throw Error('Necesitas ₽'+NATURE_PRICE+' para el tratamiento.');
  q.nature=v.nature;m.money-=NATURE_PRICE;return 'Iris: '+(q.nickname||species(q.species).name)+' ahora tiene naturaleza '+natureEffect(q.nature).name+'. Se descontaron ₽'+NATURE_PRICE+'.';
 }
 if(v.action==='buy'){
  const n=find(['shop']),i=items[v.item];if(!shopStock(n).includes(v.item)||!i?.price)throw Error('Ese mostrador no vende ese objeto.');
  if(!Number.isInteger(v.qty)||v.qty<1||v.qty>99||(m.bag[v.item]||0)+v.qty>9999)throw Error('Cantidad de compra inválida.');
  const total=i.price*v.qty;if(m.money<total)throw Error('No tienes suficiente dinero.');m.money-=total;grant(m,v.item,v.qty);return 'Guardaste '+v.qty+' × '+i.name+' en tu mochila.';
 }
 if(v.action==='bicycle'){
  if(!ctx.progress.bicycle)throw Error('Canjea el Bono Bici en Ciudad Celeste.');
  if(!m.cycling&&!canCycle(world.maps[p.map],p))throw Error('Aquí no puedes montar en bicicleta.');
  if(m.cycling&&world.maps[p.map].native?.name==='Route17')throw Error('Debes ir en bicicleta por el Camino de Bicis.');
  m.cycling=!m.cycling;return m.cycling?'¡A pedalear!':'Bajaste de la bicicleta.';
 }
 if(v.action==='teach_move'){
  const q=mon(),tutor=v.npc?find(['tutor']):null,id=tutor?tutor.data.move:items[v.item]?.teach;
  if(!id||!canTeach(q,id,!!tutor))throw Error('Ese Pokémon no puede aprender el movimiento o ya lo conoce.');
  if(tutor&&m.rewards[tutor.id])throw Error('Este tutor ya enseñó su movimiento.');if(!tutor&&!m.bag[v.item])throw Error('No tienes esa MT.');
  if(q.moves.length===4&&(!Number.isInteger(v.slot)||v.slot<0||v.slot>3))throw Error('Elige qué movimiento olvidar.');
  if(q.moves.length<4)q.moves.push({id,pp:move(id).pp});else q.moves[v.slot]={id,pp:move(id).pp};
  if(tutor)m.rewards[tutor.id]=true;else m.bag[v.item]--;return (q.nickname||species(q.species).name)+' aprendió '+move(id).name+'.';
 }
 if(v.action==='equip_item'){
  const q=mon();if(v.item&&(!items[v.item]?.held||!m.bag[v.item]))throw Error('No puedes equipar ese objeto.');
  if(q.heldItem)grant(m,q.heldItem);q.heldItem=v.item||null;if(v.item)m.bag[v.item]--;return v.item?'Objeto equipado.':'Objeto devuelto a la mochila.';
 }
 if(v.action==='give_drink'){
  const n=find(['service']);if(n.data.key!=='thirsty_girl')throw Error('Esta persona no pidió una bebida.');
  const reward={freshwater:'tm16',sodapop:'tm20',lemonade:'tm33'}[v.item],key=n.id+'_'+v.item;
  if(!reward||!m.bag[v.item])throw Error('No tienes esa bebida.');if(m.rewards[key])throw Error('Ya recibiste el regalo por esa bebida.');
  m.bag[v.item]--;grant(m,reward);m.rewards[key]=true;return '¡Gracias! Recibiste '+items[reward].name+'.';
 }
 const n=find(['casino']);if(!ctx.progress.coin_case)throw Error('Consigue el Monedero del cliente del restaurante de Azulona.');m.coins ||= 0;
 if(v.action==='casino_buy'){
  if(n.data.service!=='coins'||![50,500].includes(v.qty))throw Error('Compra de fichas inválida.');const cost=v.qty*20;
  if(m.coins+v.qty>9999)throw Error('El Monedero admite 9.999 fichas.');if(m.money<cost)throw Error('No tienes suficiente dinero.');m.money-=cost;m.coins+=v.qty;return 'Compraste '+v.qty+' fichas por ₽'+cost+'.';
 }
 if(v.action==='casino_prize'){
  if(n.data.service!=='prizes')throw Error('Visita el mostrador de premios.');const prize=casinoPrizes[n.data.prizeGroup]?.find(p=>p.key===v.prize);
  if(!prize||m.coins<prize.coins)throw Error('No tienes las fichas necesarias.');
  if(prize.species){if(m.party.length===6&&m.box.length>=180)throw Error('Deja un espacio en tu equipo o PC.');addMon(m,createMon(prize.species,prize.level,m.id));}
  else{if((m.bag[prize.key]||0)>=9999)throw Error('No cabe otro objeto en la mochila.');grant(m,prize.key);}
  m.coins-=prize.coins;return 'Recibiste '+(prize.species?species(prize.species).name:items[prize.key].name)+'.';
 }
 if(n.data.service!=='slots')throw Error('Acércate a una tragaperras.');if(m.coins<3)throw Error('Necesitas 3 fichas para jugar.');
 // Our compact slot adaptation is explicit: one 3-coin line, no real-money purchases.
 const roll=rng(1000),prize=roll<1?300:roll<11?50:roll<41?20:roll<121?10:roll<301?3:0;
 const symbols=prize===300?['7','7','7']:prize===50?['BAR','BAR','BAR']:prize===20?['★','★','★']:prize===10?['●','●','●']:prize===3?['♥','♥','◆']:['◆','★','●'];
 const credited=Math.min(prize,9999-(m.coins-3));m.coins=m.coins-3+credited;return {service:'slot_result',npc:n.id,symbols,prize:credited,cost:3,coins:m.coins,text:credited?'¡Premio de '+credited+' fichas!':'Esta vez no hubo premio.'};
}
