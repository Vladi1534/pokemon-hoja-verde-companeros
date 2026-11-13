import assert from 'node:assert/strict';
import {newBattle,battleItem,receiveClone,resume,refreshBattle,computerChoices,choose} from '../server/battles.mjs';
import {createMon,stats,move,heal} from '../server/creatures.mjs';
import {newPersonal,validatePortable,portable} from '../server/portable.mjs';
import {world,encounter,interact,campaignFor,done} from '../server/campaign.mjs';
import {cloneMemory} from '../server/mewtwo-story.mjs';
import {LocalGame} from '../browser/local-engine.mjs';
import {advance} from '../server/navigation.mjs';
import {validateClone} from '../server/clones.mjs';
const now=Date.now();
function fixture(count=6){
 const m=newPersonal('Clones QA').trainer;m.progress={clone_remote:true,mewtwo_owned:true};m.party=Array.from({length:count},()=>createMon(143,80,m.id,{moves:[{id:150,pp:40}]}));m.bag.cloneball=2;
 const s={personal:true,members:[m],progress:{},sharedGates:{}};
 const b=newBattle(s,{kind:'coop',npc:'agatha_test',players:[m.id],encounter:{kind:'trainer',name:'Agatha',team:[[94,54],[94,56]],flag:'test'}},now);
 for(const p of b.p2.pokemon){const original=s.battle.model.p2.find(m=>m.uid===p.set.campaignUid);original.moves=[{id:150,pp:40}];original.evs.atk=100;p.moveSlots=p.baseMoveSlots=[{id:'splash',move:'Splash',pp:40,maxpp:40,target:'self',disabled:false,used:false}];}
 refreshBattle(s,b,now);return {s,m,b};
}
const input=s=>({battle:s.battle.id,turn:s.battle.turn});
function capture(s,m){battleItem(s,m,{...input(s),item:'cloneball'},now);return m.box.at(-1);}
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('guaranteed cloning preserves the donor, exact genotype and consumes one turn',()=>{
 const {s,m,b}=fixture(),original=structuredClone(s.battle.model.p2[0]);b.p2.active[0].hp=7;refreshBattle(s,b,now);
 const control=resume(s);control.p1.choice.actions.push({choice:'pass'});computerChoices(s,control);
 const clone=capture(s,m),after=resume(s);assert.equal(s.battle.turn,2);assert.equal(m.bag.cloneball,1);assert.equal(after.p2.active[0].hp,control.p2.active[0].hp);assert.equal(after.p2.active[0].moveSlots[0].pp,control.p2.active[0].moveSlots[0].pp);
 for(const key of ['species','level','xp','nature','abilitySlot','gender','ivs','evs','pid'])assert.deepEqual(clone[key],original[key],key);
 assert.notEqual(clone.uid,original.uid);assert.equal(clone.hp,stats(clone).hp);assert.equal(clone.moves[0].pp,40);assert.equal(clone.status,'');assert.equal(clone.clone.slot,0);assert.equal(s.battle.result,null);
});
test('a fainted bench slot is replaced on the bench and its original state reaches the PC',()=>{
 const {s,m,b}=fixture();const old=m.party[3],active=m.party[0].uid;old.hp=0;const bp=b.p1.pokemon.find(p=>p.set.campaignUid===old.uid);bp.hp=0;bp.fainted=true;b.p1.pokemonLeft--;refreshBattle(s,b,now);
 const clone=capture(s,m);receiveClone(s,m,{...input(s),mode:'replace',mon:old.uid,name:'Sombra'},now);
 assert.equal(s.battle.turn,3);assert.equal(m.party[3].uid,clone.uid);assert.equal(m.party[3].nickname,'Sombra');assert.equal(m.box[0].uid,old.uid);assert.equal(m.box[0].hp,0);
 const restored=resume(s);assert.equal(restored.p1.active[0].set.campaignUid,active);assert(!restored.p1.pokemon.find(p=>p.set.campaignUid===clone.uid).isActive);assert.equal(restored.p1.pokemon.length,6);assert.equal(restored.p1.pokemonLeft,6);
 assert.equal(restored.p2.active[0].moveSlots[0].pp,38,'opponent acts on both capture and receipt turns');
});
test('replacing the active Pokémon enters that position and remains valid after serialization',()=>{
 const {s,m}=fixture(),old=m.party[0],clone=capture(s,m);receiveClone(s,m,{...input(s),mode:'replace',mon:old.uid,name:'Espectro'},now);
 const b=resume(s);assert.equal(b.p1.active[0].set.campaignUid,clone.uid);assert.equal(b.p1.pokemon.length,6);assert.equal(m.party[0].uid,clone.uid);assert.equal(m.box[0].uid,old.uid);
 assert.equal(s.battle.views[m.id].team.find(p=>p.active).name,'Espectro');assert.equal(s.battle.turn,3);
 choose(s,m,{...input(s),choice:'move 1'},now);assert.equal(s.battle.turn,4);assert.equal(resume(s).p1.active[0].set.campaignUid,clone.uid);
});
test('PC receipt and nickname are free, and one clone per battle prevents chaining replacements',()=>{
 const {s,m}=fixture(),clone=capture(s,m);receiveClone(s,m,{...input(s),mode:'pc',name:'Niebla'},now);assert.equal(s.battle.turn,2);assert.equal(clone.nickname,'Niebla');assert.equal(m.party.length,6);
 assert.throws(()=>capture(s,m),/ya se utilizó/);assert.equal(m.bag.cloneball,1);
 const saved=validatePortable(portable(s,m));assert.deepEqual(saved.trainer.box[0].clone,clone.clone);assert.equal(saved.trainer.box[0].nickname,'Niebla');
 assert.match(cloneMemory({id:'agatha_test'},[clone],m.rewards),/ahora quieres derrotarme/);
});
test('PC full rejects before spending; a free team slot receives the clone on the bench',()=>{
 const f=fixture();f.m.box=Array.from({length:180},()=>createMon(19,5));assert.throws(()=>capture(f.s,f.m),/PC/);assert.equal(f.m.bag.cloneball,2);assert.equal(f.s.battle.turn,1);
 const {s,m}=fixture(1),active=m.party[0].uid,clone=capture(s,m);receiveClone(s,m,{...input(s),mode:'add'},now);assert.equal(m.party.length,2);assert.equal(m.party[1].uid,clone.uid);assert.equal(resume(s).p1.active[0].set.campaignUid,active);
});
test('total defeat on the capture turn preserves the clone in the PC',()=>{
 const {s,m,b}=fixture(1);b.p1.active[0].hp=1;m.party[0].hp=1;
 const p=b.p2.active[0];p.moveSlots=p.baseMoveSlots=[{id:'nightshade',move:'Night Shade',pp:15,maxpp:15,target:'normal',disabled:false,used:false}];
 // Snorlax is immune to Night Shade; use a damaging neutral move instead.
 p.moveSlots=p.baseMoveSlots=[{id:'psychic',move:'Psychic',pp:10,maxpp:10,target:'normal',disabled:false,used:false}];refreshBattle(s,b,now);
 const clone=capture(s,m);assert.equal(s.battle.result,'defeat');assert(m.box.some(p=>p.uid===clone.uid));receiveClone(s,m,{...input(s),mode:'pc',name:'Rescate'},now);assert.equal(clone.nickname,'Rescate');assert.equal(m.party[0].hp,0);
});
test('the invitation, three trials, capture and laboratory unlock happen before the League',()=>{
 const m=newPersonal('Isla QA').trainer,s={progress:m.progress,members:[m]},n=id=>Object.values(world.maps).flatMap(m=>m.npcs).find(n=>n.id===id);
 assert.match(interact(s,m,m.position,n('clone_invitation')),/Medalla Arcoíris/);m.progress.badge4=m.progress.scope=true;
 interact(s,m,m.position,n('clone_invitation'));assert(m.progress.clone_invitation);assert(!m.progress.champion);
 assert.throws(()=>encounter(s,m,m.position,n('clone_mewtwo')),/Corey/);
 for(const id of ['corey','fergus','neesha'])m.progress['clone_trial_'+id]=true;assert(done(s,'clone_trials'));
 assert(encounter(s,m,m.position,n('clone_mewtwo')).cloneTeam);m.progress.clone_guardians=true;
 const enc=encounter(s,m,m.position,n('clone_mewtwo'));assert.equal(enc.kind,'wild');assert.equal(enc.team[0][0],150);
 m.party=[createMon(143,100,m.id)];m.bag.masterball=1;newBattle(s,{kind:'coop',npc:'clone_mewtwo',players:[m.id],encounter:enc},now);battleItem(s,m,{...input(s),item:'masterball'},now);
 assert(m.progress.mewtwo_owned);assert(!m.progress.champion);assert(m.party.some(p=>p.species===150));
 const terminal=n('clone_terminal');interact(s,m,m.position,terminal);assert(m.progress.clone_remote);assert.equal(m.bag.cloneball,1);interact(s,m,m.position,terminal);assert.equal(m.bag.cloneball,1);
 m.money=6000;interact(s,m,m.position,terminal,{recharge:true});assert.equal(m.money,0);assert.equal(m.bag.cloneball,2);assert.throws(()=>interact(s,m,m.position,terminal,{recharge:true}),/dos/);
});
test('local action replay does not duplicate a clone or charge',()=>{
 const {s,m}=fixture();const g=new LocalGame(portable(s,m));g.row.state.battle=s.battle;
 const payload={action:'battle_item',...input(s),item:'cloneball',requestId:crypto.randomUUID()};g.dispatch(payload);g.dispatch(payload);assert.equal(g.member.box.length,1);assert.equal(g.member.bag.cloneball,1);
 const restored=new LocalGame(null,JSON.parse(JSON.stringify(g.snapshot())));assert.equal(restored.member.box.length,1);assert.equal(restored.state().battle.you.pendingClone.species,94);
});
test('two trainers capture and receive independently, with one shared turn per pair of choices',()=>{
 const first=newPersonal('Primero').trainer,second=newPersonal('Segundo').trainer;
 for(const m of [first,second]){m.progress={clone_remote:true};m.bag.cloneball=2;m.party=[createMon(143,90,m.id),createMon(6,80,m.id)];}
 const s={personal:true,members:[first,second],progress:{},sharedGates:{}};
 const b=newBattle(s,{kind:'coop',npc:'agatha_test',players:[first.id,second.id],encounter:{kind:'trainer',name:'Agatha',team:[[94,54]]}},now);
 for(const side of [b.p2,b.p4])side.active[0].moveSlots=side.active[0].baseMoveSlots=[{id:'splash',move:'Splash',pp:40,maxpp:40,target:'self',disabled:false,used:false}];refreshBattle(s,b,now);
 battleItem(s,first,{...input(s),item:'cloneball',target:'p2'},now);assert.equal(s.battle.turn,1);assert(!s.battle.views[first.id].pendingClone.ready);
 assert.throws(()=>receiveClone(s,first,{...input(s),mode:'pc'},now),/termine/);
 battleItem(s,second,{...input(s),item:'cloneball',target:'p4'},now);assert.equal(s.battle.turn,2);
 const one=first.box[0],two=second.box[0];assert.notEqual(one.uid,two.uid);assert.equal(one.clone.side,'p2');assert.equal(two.clone.side,'p4');
 receiveClone(s,first,{...input(s),mode:'replace',mon:first.party[1].uid},now);assert.equal(s.battle.turn,2);
 receiveClone(s,second,{...input(s),mode:'replace',mon:second.party[0].uid},now);assert.equal(s.battle.turn,3);
 const after=resume(s);assert.notEqual(after.p1.active[0].set.campaignUid,one.uid);assert.equal(after.p3.active[0].set.campaignUid,two.uid);
 assert.equal(first.bag.cloneball,1);assert.equal(second.bag.cloneball,1);
});
test('PvP cannot clone another player, and a copied NPC original cannot be farmed across rematches',()=>{
 const {s,m}=fixture(),opponent=newPersonal('Amigo').trainer;opponent.party=[createMon(143,80,opponent.id)];s.members.push(opponent);
 newBattle(s,{kind:'pvp',players:[m.id,opponent.id]},now);assert.throws(()=>capture(s,m),/objetos/);assert.equal(m.bag.cloneball,2);
 newBattle(s,{kind:'coop',npc:'agatha_test',players:[m.id],encounter:{kind:'trainer',name:'Agatha',team:[[94,54],[94,56]]}},now);capture(s,m);
 const b=newBattle(s,{kind:'coop',npc:'agatha_test',players:[m.id],encounter:{kind:'trainer',name:'Agatha',team:[[94,54],[94,56]]}},now);
 assert.throws(()=>capture(s,m),/Ya clonaste/);assert.equal(m.bag.cloneball,1);
 b.actions.switchIn(b.p2.pokemon[1],0);b.makeRequest('move');refreshBattle(s,b,now);const second=capture(s,m);assert.equal(second.clone.slot,1,'two Gengar on one NPC team remain distinct originals');
});
test('forced switches and trapping cannot be bypassed by remote receipt',()=>{
 const {s,m,b}=fixture();b.p1.active[0].hp=1;b.p2.active[0].moveSlots=b.p2.active[0].baseMoveSlots=[{id:'psychic',move:'Psychic',pp:10,maxpp:10,target:'normal',disabled:false,used:false}];refreshBattle(s,b,now);
 capture(s,m);assert(s.battle.views[m.id].forceSwitch);
 assert.throws(()=>receiveClone(s,m,{...input(s),forceSwitch:true,mode:'replace',mon:m.party[1].uid},now),/relevo|siguiente/);
 choose(s,m,{...input(s),forceSwitch:true,choice:'switch 2'},now);
 const trapped=resume(s);trapped.p1.active[0].trapped=true;trapped.makeRequest('move');refreshBattle(s,trapped,now);
 assert(s.battle.views[m.id].trapped);
 const uid=s.battle.views[m.id].team.find(p=>p.active).uid;
 assert.throws(()=>receiveClone(s,m,{...input(s),mode:'replace',mon:uid},now),/atrapado/);
 receiveClone(s,m,{...input(s),mode:'replace',mon:m.party[0].uid},now);assert.equal(resume(s).p1.active[0].set.campaignUid,uid);
});
test('serialized effects keep valid actor references after an active replacement',()=>{
 const {s,m}=fixture(),cloned=capture(s,m),b=resume(s),old=b.p1.active[0];
 b.p2.active[0].addVolatile('leechseed',old);b.p2.active[0].lastAttackedBy=[{source:old,damage:1,move:'tackle',thisTurn:false}];refreshBattle(s,b,now);
 receiveClone(s,m,{...input(s),mode:'replace',mon:old.set.campaignUid},now);
 const restored=resume(s);assert.equal(restored.p1.active[0].set.campaignUid,cloned.uid);assert(restored.p2.active[0].volatiles.leechseed);assert.equal(restored.p2.active[0].volatiles.leechseed.source,restored.p1.active[0]);
 choose(s,m,{...input(s),choice:'move 1'},now);assert.equal(s.battle.turn,4);
});
test('all island rooms and NPCs are reachable and the lab remains locked until capture',()=>{
 const reach=progress=>{const start={map:'clone_island',...world.maps.clone_island.arrival},queue=[start],key=p=>`${p.map}:${p.x},${p.y}`,seen=new Set([key(start)]);
  for(let i=0;i<queue.length;i++)for(const dir of ['up','down','left','right']){const p=advance(queue[i],[dir],{progress});if(!p.map.startsWith('clone_'))continue;const k=key(p);if(!seen.has(k)){seen.add(k);queue.push(p);}}return seen;};
 const locked=reach({clone_invitation:true});assert(![...locked].some(k=>k.startsWith('clone_lab:')));assert([...locked].some(k=>k.startsWith('clone_rest:')));
 const unlocked=reach({clone_invitation:true,mewtwo_owned:true});
 for(const map of Object.values(world.maps).filter(m=>m.extension==='mewtwo'))for(const n of map.npcs)assert([[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>unlocked.has(`${map.id}:${n.x+dx},${n.y+dy}`)),n.id+' has a walkable interaction tile');
 assert.throws(()=>validateClone({version:1,donorId:'<script>'}),/inválida/);
});
console.log(JSON.stringify({passed}));
