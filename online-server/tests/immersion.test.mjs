import assert from 'node:assert/strict';
import {Battle, Dex} from '@pkmn/sim';
import {LocalGame,newPersonal} from '../browser/local-engine.mjs';
import {createMon,heal,detail,data,ability} from '../server/creatures.mjs';
import {world,challengeBlock} from '../server/campaign.mjs';
import {newBattle,flee,battleItem,refreshBattle} from '../server/battles.mjs';
import {abilityDescription} from '../server/ability-rules.mjs';
import {visibleTrainer,navigationState} from '../server/navigation.mjs';
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
const battle=(first,second)=>new Battle({formatid:'gen4customgame',seed:[1,2,3,4],p1:{name:'QA',team:[first]},p2:{name:'Rival',team:[second]}});
const geodude={species:'Geodude',level:5,ability:'Sturdy',moves:['tackle']},blastoise={species:'Blastoise',level:100,ability:'Torrent',moves:['surf']};
test('Sturdy preserves exactly 1 HP at full health and works after battle serialization',()=>{
 let b=battle(geodude,blastoise);b=Battle.fromJSON(JSON.stringify(b.toJSON()));b.makeChoices('move 1','move 1');assert.equal(b.p1.active[0].hp,1);assert(b.log.some(l=>l.includes('|Sturdy')));b.makeChoices('move 1','move 1');assert(b.p1.active[0].fainted);

});
test('Sturdy does not protect an injured Pokémon, later multihits or residual damage',()=>{
 let b=battle(geodude,blastoise);b.p1.active[0].hp--;b.makeChoices('move 1','move 1');assert(b.p1.active[0].fainted);assert(!b.log.some(l=>l.includes('|Sturdy')));
 b=battle(geodude,{species:'Cloyster',level:100,ability:'Skill Link',moves:['iciclespear']});b.makeChoices('move 1','move 1');assert(b.p1.active[0].fainted);assert.equal(b.log.filter(l=>l.includes('|Sturdy')).length,1);
 b=battle({species:'Shedinja',level:5,ability:'Sturdy',moves:['splash']},{species:'Nidoking',level:100,ability:'Poison Point',moves:['sandstorm']});b.makeChoices('move 1','move 1');assert(b.p1.active[0].fainted);assert(!b.log.some(l=>l.includes('|Sturdy')));
});
test('Sturdy retains OHKO protection; Rock Head is a distinct Geodude ability',()=>{
 const b=battle(geodude,{species:'Lapras',level:100,ability:'Water Absorb',moves:['sheercold']});b.makeChoices('move 1','move 1');assert.equal(b.p1.active[0].hp,b.p1.active[0].maxhp);assert(b.log.some(l=>l.includes('|-immune|')));
 assert.equal(ability(createMon(74,5,'qa',{abilitySlot:0})),'Rock Head');assert.equal(ability(createMon(74,5,'qa',{abilitySlot:1})),'Sturdy');
});
test('Levitate, Water Absorb and Volt Absorb keep their immunity and healing effects',()=>{
 const cases=[['Gastly','Levitate','Golem','earthquake'],['Lapras','Water Absorb','Blastoise','surf'],['Jolteon','Volt Absorb','Raichu','thunderbolt']];
 for(const [species,ability,foe,move]of cases){const b=battle({species,ability,level:50,moves:['splash']},{species:foe,level:50,moves:[move]});const p=b.p1.active[0];p.hp=Math.floor(p.maxhp/2);const hp=p.hp;b.makeChoices('move 1','move 1');assert(ability==='Levitate'?p.hp===hp:p.hp>hp,ability);assert(!p.fainted);}
});
test('Intimidate lowers attack and Pressure consumes the extra PP',()=>{
 const b=battle({species:'Gyarados',level:50,ability:'Intimidate',moves:['tackle']},{species:'Aerodactyl',level:50,ability:'Pressure',moves:['splash']});assert.equal(b.p2.active[0].boosts.atk,-1);const pp=b.p1.active[0].moveSlots[0].pp;b.makeChoices('move 1','move 1');assert.equal(b.p1.active[0].moveSlots[0].pp,pp-2);
});
test('Run Away escapes a trapping wild opponent without awarding victory',()=>{
 const m=newPersonal('Fuga QA',7).trainer;m.party=[createMon(19,5,m.id,{abilitySlot:0})];const s={members:[m],progress:{}};
 const b=newBattle(s,{kind:'coop',players:[m.id],encounter:{kind:'wild',name:'Diglett',team:[[50,50]]}},Date.now());
 b.p2.active[0].setAbility('arenatrap');b.makeRequest('move');s.battle.serialized=JSON.stringify(b.toJSON());
 flee(s,m,{battle:s.battle.id,turn:s.battle.turn},Date.now(),()=>255);assert.equal(s.battle.result,'escaped');assert.equal(s.battle.rewarded,false);
});
test('battle medicine emits the healed HP before retaliation and consumes exactly one item and turn',()=>{
 const m=newPersonal('Mochila QA',7).trainer;m.party=[createMon(74,5,m.id,{abilitySlot:1})];m.bag.potion=3;const s={members:[m],progress:{}};
 const b=newBattle(s,{kind:'coop',players:[m.id],encounter:{kind:'wild',name:'Blastoise',team:[[9,80]]}},Date.now());b.p1.active[0].hp=1;refreshBattle(s,b,Date.now());
 battleItem(s,m,{battle:s.battle.id,turn:1,item:'potion',mon:m.party[0].uid},Date.now());assert.equal(m.bag.potion,2);assert.equal(s.battle.turn,2);
 const events=s.battle.views[m.id].events.map(e=>e.line),healed=events.findIndex(l=>l.startsWith('|-heal|p1'));assert(healed>=0);const max=detail(m.party[0]).maxHp;assert(events[healed].includes(max+'/'+max));assert(events.findIndex((l,i)=>i>healed&&l.startsWith('|move|p2'))>healed);
});
test('all available species expose real HeartGold ability slots and a readable description',()=>{
 const abilities=new Set();for(const [id,s]of Object.entries(data.species))for(const [slot,name]of Object.entries(Dex.mod('gen4').species.get(s.name).abilities)){if(slot==='H')continue;const mon=createMon(+id,5,'qa',{abilitySlot:+slot});assert.equal(ability(mon),name);assert(Dex.mod('gen4').abilities.get(name).exists);assert(abilityDescription(name),name);assert(detail(mon).abilityDescription);abilities.add(name);}assert.equal(abilities.size,76);
});
const ash=world.maps.route1.npcs.find(n=>n.look==='ash');
function nearAsh(g){g.member.position={...g.member.position,map:'route1',x:ash.x,y:ash.y+1,dir:'up',seen:Date.now()-5000};}
const act=(g,action,args={})=>g.dispatch({action,requestId:crypto.randomUUID(),...args});
function fight(g){nearAsh(g);let s=act(g,'propose',{kind:'coop',npc:ash.id});assert(s.battle&&!s.battle.temporary);for(let i=0;i<100&&!s.battle.ended;i++)s=act(g,'choose',{battle:s.battle.id,turn:s.battle.turn,forceSwitch:s.battle.you.forceSwitch,choice:'default'});assert(s.battle.ended);return s;}
test('Ash grants XP, EV, prize money and persistent PP, with two saved rematches',()=>{
 let g=new LocalGame(newPersonal('Ash QA',4));g.member.party=[createMon(6,30,g.member.id,{moves:[{id:53,pp:15}]})];g.member.progress.anime_ash_training=true;
 const before=structuredClone(g.member);const result=fight(g);assert.equal(result.battle.result,'victory');assert(g.member.party[0].xp>before.party[0].xp);assert(Object.values(g.member.party[0].evs).some(v=>v>0));assert(g.member.party[0].moves[0].pp<15);assert(g.member.money>before.money);assert.equal(g.member.progress.wins_route1_ash,1);
 for(let i=0;i<2;i++){g=new LocalGame(null,JSON.parse(JSON.stringify(g.snapshot())));g.member.party.forEach(heal);assert.equal(fight(g).battle.result,'victory');}
 assert.equal(g.member.progress.wins_route1_ash,3);assert.match(challengeBlock({progress:g.member.progress},ash),/tres/);nearAsh(g);assert.match(act(g,'propose',{kind:'coop',npc:ash.id}).message,/tres/);assert(!g.activeBattle);
});
test('losing to Ash recovers at the saved center, retains story and allows walking',()=>{
 const g=new LocalGame(newPersonal('Derrota QA',4));g.member.party=[createMon(4,1,g.member.id,{moves:[{id:45,pp:40}]})];g.member.progress.bill=true;const center={...g.member.lastCenter};assert.equal(fight(g).battle.result,'defeat');assert.equal(g.member.position.map,center.map);assert.equal(g.member.position.x,center.x);assert.equal(g.member.position.y,center.y);assert(g.member.progress.bill);assert(!g.member.progress.wins_route1_ash);assert(g.member.party.every(p=>p.hp===detail(p).maxHp));assert(!g.member.spotted);assert(g.member.travelGrace>0);
 const seq=g.member.position.seq;act(g,'sync',{seq:seq+1,steps:['right']});assert.equal(g.member.position.seq,seq+1);
});
test('Ash is a voluntary challenge and never blocks the Route 1 sight corridor',()=>{
 const g=new LocalGame(newPersonal('Ruta QA',7));nearAsh(g);const nav=navigationState({progress:{}},g.member);nav.grace=0;for(let t=0;t<7200;t+=1800)assert.notEqual(visibleTrainer(nav,t),ash.id);
});
console.log(JSON.stringify({passed,failed:0}));
