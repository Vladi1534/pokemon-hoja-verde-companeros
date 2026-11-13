import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {Battle,Dex} from '@pkmn/sim';
import {world,interact} from '../server/campaign.mjs';
import {createMon,stats,toSet,captureOdds,captureAttempt,catchRoll,items,detail} from '../server/creatures.mjs';
import {newPersonal,validatePortable} from '../server/portable.mjs';
import {LocalGame} from '../browser/local-engine.mjs';
import {natureNames} from '../server/nature-guide.mjs';
import {naturePreview,canTeach,shopStocks,casinoPrizes} from '../server/trainer-services.mjs';
import {encounterSlot} from '../server/encounters.mjs';
import {newBattle,resume,refreshBattle,battleItem,choose,flee} from '../server/battles.mjs';
import {trainerChoice,estimateDamage,scoreMove} from '../server/trainer-ai.mjs';
import {walkable} from '../server/navigation.mjs';
const require=createRequire(import.meta.url),stage=require('../../battle-stage.js'),replay=require('../../battle-presentation.js');
let count=0;function test(name,fn){fn();console.log('PASS '+name);count++;}
const mapByName=name=>Object.values(world.maps).find(m=>!m.aliasOf&&m.native?.name===name);
function game(){const g=new LocalGame(newPersonal('Servicios',1));g.member.money=200000;g.member.progress.delivery=true;return g;}
function near(g,map,n){g.member.position={map:map.id,x:n.x,y:n.y+1,dir:'up',seq:0,seen:Date.now()-1000};return n;}
function visit(g,name,role,index=0){const map=world.maps[name]||mapByName(name),n=map.npcs.filter(n=>n.role===role)[index];assert(n,name+' '+role);return near(g,map,n);}
function battle(species='Snorlax',moves=['tackle','rest'],foe='Gengar',foeMoves=['splash']){return new Battle({formatid:'gen4companerossingles',seed:[1,2,3,4],p1:{name:'Jugador',team:[{species:foe,moves:foeMoves,level:30}]},p2:{name:'Entrenador',team:[{species,moves,level:30},{species:'Pikachu',moves:['thunderbolt'],level:30}]}});}
test('Nidoran male is selectable in all three early routes, retains male identity and distinct sprite ID',()=>{
 for(const id of ['route1','route2','route22']){const map=world.maps[id],total=map.encounters.land_mons.reduce((n,e)=>n+e.weight,0),counts={};for(let roll=0;roll<total;roll++){let call=0;const e=encounterSlot(map,false,()=>call++?0:roll);counts[e.id]=(counts[e.id]||0)+1;}assert(counts[32]>=10,id);assert(counts[29]>=10,id);const mon=createMon(32,4);assert.equal(mon.gender,'M');assert.equal(Dex.species.get(toSet(mon).species).num,32);}
});
test('Snorlax capture matches FRLG integer thresholds, status bonuses and all four random checks',()=>{
 assert.equal(captureOdds(143,139,1,'slp','superball').threshold,49931);assert.equal(captureOdds(143,139,1,'slp','ultraball').threshold,52428);
 assert(captureOdds(143,139,1,'slp','superball').chance>captureOdds(143,139,1,'','superball').chance);
 let calls=0;assert(catchRoll(143,139,1,'slp','superball',()=>{calls++;return 49930;}));assert.equal(calls,4);
 const failed=captureAttempt(143,139,1,'slp','superball',()=>49931);assert(!failed.caught);assert.equal(failed.shakes,0);
 assert(catchRoll(143,139,139,'','masterball',()=>65535));assert.throws(()=>catchRoll(143,139,0,'','ball'));
 let seed=7,wins=0;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};for(let i=0;i<30000;i++)wins+=catchRoll(143,139,1,'slp','superball',random);assert(Math.abs(wins/30000-.3369468)<.015);
});
test('every native Pokémon Center has a reachable nature nurse beside Joy',()=>{
 const centers=Object.values(world.maps).filter(m=>!m.aliasOf&&/PokemonCenter_1F$/.test(m.native?.name));assert.equal(centers.length,19);
 for(const map of centers){const joy=map.npcs.find(n=>n.role==='heal'),n=map.npcs.find(n=>n.role==='nature');assert(n,map.id);assert(Math.abs(n.x-joy.x)+Math.abs(n.y-joy.y)<=2);const state={progress:{}},seen=new Set(),q=[map.arrival];while(q.length){const p=q.shift(),key=p.x+','+p.y;if(seen.has(key))continue;seen.add(key);for(const [dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]]){const x=p.x+dx,y=p.y+dy;if(walkable(map.id,x,y,state)&&!seen.has(x+','+y))q.push({x,y});}}assert([...seen].some(k=>{const [x,y]=k.split(',').map(Number);return Math.abs(x-n.x)+Math.abs(y-n.y)<=3;}),map.id+' nurse unreachable');}
});
test('all 74 service points can be reached and interacted with from their native entrances',()=>{
 let total=0;for(const m of Object.values(world.maps).filter(m=>!m.aliasOf&&m.native)){
  const ns=m.npcs.filter(n=>['nature','service','tutor','casino','shop'].includes(n.role));if(!ns.length)continue;
  const seen=new Set(),q=[m.arrival];while(q.length){const p=q.shift(),k=p.x+','+p.y;if(seen.has(k))continue;seen.add(k);for(const [dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]]){const x=p.x+dx,y=p.y+dy;if(!seen.has(x+','+y)&&walkable(m.id,x,y,{progress:{}}))q.push({x,y});}}
  for(const n of ns){total++;const ok=[[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>seen.has((n.x+dx)+','+(n.y+dy))||(m.native.behavior[n.y+dy]?.[n.x+dx]===128||m.grid[n.y+dy]?.[n.x+dx]===7)&&seen.has((n.x+2*dx)+','+(n.y+2*dy)))||(n.staticObject&&seen.has(n.x+','+n.y));assert(ok,n.id);}
 }assert.equal(total,74);
});
test('all 25 nature previews match actual stats; changing costs money, preserves the mon, and survives both save paths',()=>{
 const g=game(),n=visit(g,'viridian_center','nature'),m=g.member.party[0],before=structuredClone(m);m.nature='Hardy';m.hp=2;m.status='psn';
 for(const nature of natureNames)assert.deepEqual(naturePreview(m,nature).after,stats({...m,nature}));
 g.dispatch({action:'nature_change',npc:n.id,mon:m.uid,nature:'Adamant'});const changed=g.member.party[0];assert.equal(g.member.money,195000);assert.equal(changed.nature,'Adamant');assert.equal(changed.hp,2);assert.equal(changed.status,'psn');for(const key of ['uid','pid','level','xp','ivs','evs','moves','abilitySlot'])assert.deepEqual(changed[key],before[key]);
 assert.equal(validatePortable(g.portable()).trainer.party[0].nature,'Adamant');assert.equal(new LocalGame(null,g.snapshot()).member.party[0].nature,'Adamant');
 assert.throws(()=>g.dispatch({action:'nature_change',npc:n.id,mon:m.uid,nature:'Adamant'}));assert.equal(g.member.money,195000);
 g.member.money=4999;assert.throws(()=>g.dispatch({action:'nature_change',npc:n.id,mon:m.uid,nature:'Modest'}));assert.equal(g.member.party[0].nature,'Adamant');
});
test('Route 1 sample, bicycle voucher and exchange are functional and cannot be farmed',()=>{
 const g=game(),potion=visit(g,'route1','service'),before=g.member.bag.potion;assert.equal(potion.x,6);assert.equal(potion.y,28);g.dispatch({action:'quest',npc:potion.id});g.dispatch({action:'quest',npc:potion.id});assert.equal(g.member.bag.potion,before+1);
 const owner=visit(g,'CeruleanCity_BikeShop','service');g.dispatch({action:'quest',npc:owner.id});assert(!g.member.progress.bicycle);
 const president=visit(g,'VermilionCity_PokemonFanClub','service');g.dispatch({action:'quest',npc:president.id});assert.equal(g.state().trainer.bag.bike_voucher,1);
 visit(g,'CeruleanCity_BikeShop','service');g.dispatch({action:'quest',npc:owner.id});assert.equal(g.state().trainer.bag.bicycle,1);assert(!g.state().trainer.bag.bike_voucher);assert.throws(()=>g.dispatch({action:'bicycle'}));
 g.member.position={...g.member.position,map:'pallet',x:6,y:8};g.dispatch({action:'bicycle'});assert(g.member.cycling);assert(validatePortable(g.portable()).trainer.cycling);g.dispatch({action:'bicycle'});assert(!g.member.cycling);
});
test('departments enforce their actual stock, sell working evolution stones and reject remote purchases',()=>{
 const g=game(),store=mapByName('CeladonCity_DepartmentStore_4F'),n=visit(g,store.id,'shop');
 for(const key of shopStocks.department_stones)assert(items[key]?.price);
 g.dispatch({action:'buy',npc:n.id,item:'waterstone',qty:1});assert.equal(g.member.bag.waterstone,1);g.member.party.push(createMon(133,20,g.member.id));const eevee=g.member.party.at(-1);g.dispatch({action:'item',item:'waterstone',mon:eevee.uid});assert.equal(g.member.party.at(-1).species,134);
 assert.throws(()=>g.dispatch({action:'buy',npc:n.id,item:'tm15',qty:1}));visit(g,'viridian_shop','shop');assert.throws(()=>g.dispatch({action:'buy',item:'waterstone',qty:1}));
 for(const map of Object.values(world.maps).filter(m=>!m.aliasOf))for(const shop of map.npcs.filter(n=>n.role==='shop')){assert(shopStocks[shop.data.stock],shop.id);for(const key of shopStocks[shop.data.stock])assert(items[key]?.price,shop.id+' '+key);}
});
test('TM choice, Counter tutor, vitamins and drink gifts have persistent, limited effects',()=>{
 const g=game();g.member.party=[createMon(143,30,g.member.id)];const m=g.member.party[0];g.member.bag.tm15=1;const old=m.moves.map(m=>m.id);g.dispatch({action:'teach_move',item:'tm15',mon:m.uid,slot:1});assert.equal(g.member.party[0].moves[1].id,63);assert.equal(g.member.bag.tm15,0);assert.equal(g.member.party[0].moves[0].id,old[0]);
 const tutor=visit(g,'CeladonCity_DepartmentStore_3F','tutor');g.dispatch({action:'teach_move',npc:tutor.id,mon:m.uid,slot:2});assert.equal(g.member.party[0].moves[2].id,68);assert(g.member.rewards[tutor.id]);assert.throws(()=>g.dispatch({action:'teach_move',npc:tutor.id,mon:m.uid,slot:2}));
 g.member.bag.protein=11;for(let i=0;i<10;i++)g.dispatch({action:'item',item:'protein',mon:m.uid});assert.equal(g.member.party[0].evs.atk,100);assert.throws(()=>g.dispatch({action:'item',item:'protein',mon:m.uid}));assert.equal(g.member.bag.protein,1);
 const child=visit(g,'CeladonCity_DepartmentStore_Roof','service');g.member.bag.freshwater=2;g.dispatch({action:'give_drink',npc:child.id,item:'freshwater'});assert.equal(g.member.bag.tm16,1);assert.throws(()=>g.dispatch({action:'give_drink',npc:child.id,item:'freshwater'}));assert.equal(g.member.bag.freshwater,1);
});
test('casino wallet, purchases, prizes and receipts survive reload without duplicating an action',()=>{
 const g=game(),seller=visit(g,'casino','casino');assert.throws(()=>g.dispatch({action:'casino_buy',npc:seller.id,qty:50}));
 const caseNpc=visit(g,'CeladonCity_Restaurant','service');g.dispatch({action:'quest',npc:caseNpc.id});visit(g,'casino','casino');const request={action:'casino_buy',npc:seller.id,qty:500,requestId:'casino-purchase-0001'};g.dispatch(request);g.dispatch(request);assert.equal(g.member.coins,500);assert.equal(g.member.money,190000);
 const clerk=visit(g,'CeladonCity_GameCorner_PrizeRoom','casino');g.dispatch({action:'casino_prize',npc:clerk.id,prize:'abra'});assert.equal(g.member.party.at(-1).species,63);assert.equal(g.member.party.at(-1).level,7);assert.equal(g.member.coins,380);
 const slot=visit(g,'casino','casino',1),r=g.dispatch({action:'casino_spin',npc:slot.id});assert.equal(r.dialog.cost,3);assert.equal(g.member.coins,377+r.dialog.prize);assert.equal(validatePortable(g.portable()).trainer.coins,g.member.coins);assert.equal(new LocalGame(null,g.snapshot()).member.coins,g.member.coins);
});
test('NPC AI avoids immune attacks, selects useful healing and chooses a legal replacement',()=>{
 let b=battle('Snorlax',['tackle','crunch','rest'],'Gengar'),s={battle:{owners:{p1:'human'},encounter:{kind:'trainer'}}};assert.equal(trainerChoice(s,b,b.p2),'move 2');assert(scoreMove(b,b.p2.active[0],b.p1.active[0],b.dex.moves.get('rest'))<0);
 b.p2.active[0].hp=1;assert.equal(trainerChoice(s,b,b.p2),'move 3');
 b=battle('Snorlax',['tackle'],'Gengar');s={battle:{owners:{p1:'human'},encounter:{kind:'trainer'}}};assert.equal(trainerChoice(s,b,b.p2),'switch 2');
 b=battle('Alakazam',['psychic','psycho cut'],'Machamp');assert(estimateDamage(b,b.p2.active[0],b.p1.active[0],b.dex.moves.get('psychic'))>estimateDamage(b,b.p2.active[0],b.p1.active[0],b.dex.moves.get('psychocut')));
 const before=trainerChoice({battle:{encounter:{kind:'wild'}}},b,b.p2);b.p1.choice.actions=[{choice:'switch',pokemon:b.p1.active[0]}];assert.equal(trainerChoice({battle:{encounter:{kind:'wild'}}},b,b.p2),before);
});
test('Yellow Flute cures confusion without consumption and Smoke Ball guarantees wild escape',()=>{
 const m=newPersonal('Objetos',1).trainer;m.party=[createMon(143,30,m.id)];m.bag.yellowflute=1;m.party[0].heldItem='smokeball';const s={members:[m],progress:{}};
 newBattle(s,{players:[m.id],kind:'coop',encounter:{kind:'wild',name:'Prueba',team:[[129,5]]}},Date.now());let b=resume(s);b.p1.active[0].addVolatile('confusion');refreshBattle(s,b,Date.now());
 battleItem(s,m,{battle:s.battle.id,turn:s.battle.turn,item:'yellowflute'},Date.now());assert.equal(m.bag.yellowflute,1);assert(!resume(s).p1.active[0].volatiles.confusion);assert.equal(s.battle.turn,2);
 assert.throws(()=>battleItem(s,m,{battle:s.battle.id,turn:s.battle.turn,item:'yellowflute'},Date.now()),/confuso/);
 flee(s,m,{battle:s.battle.id,turn:s.battle.turn},Date.now(),()=>255);assert.equal(s.battle.result,'escaped');
});
test('team counters, capture replay and low-HP warning follow actual conscious player HP',()=>{
 const m=newPersonal('Captura',1).trainer;m.bag.masterball=1;const s={members:[m],progress:{}};newBattle(s,{players:[m.id],kind:'coop',encounter:{name:'Snorlax',kind:'wild',team:[[143,30]]}},Date.now());const first={...structuredClone(s.battle.common),you:structuredClone(s.battle.views[m.id])};assert.equal(first.sides[1].roster.length,1);assert(!stage.lowHealth(first));
 const low=structuredClone(first);low.you.team[0].hp=1;assert(stage.lowHealth(low));low.you.team[0].hp=0;assert(!stage.lowHealth(low));low.you.team[0].hp=1;low.ended=true;assert(!stage.lowHealth(low));
 battleItem(s,m,{battle:s.battle.id,turn:s.battle.turn,item:'masterball'},Date.now());const last={...s.battle.common,you:s.battle.views[m.id]},frames=replay.frames(first,last,()=>null);assert.equal(s.battle.result,'captured');assert(frames.some(f=>f.capture?.phase==='caught'));assert.equal(m.bag.masterball,0);assert.equal(m.party.at(-1).species,143);
});
console.log(JSON.stringify({passed:count,failed:0}));
