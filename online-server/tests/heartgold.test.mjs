import assert from 'node:assert/strict';
import {Battle,Dex} from '@pkmn/sim';
import {createMon,ability,detail,learnset,data,makeEgg,walked} from '../server/creatures.mjs';
import {newPersonal,validatePortable} from '../server/portable.mjs';
import {LocalGame} from '../browser/local-engine.mjs';
import {world} from '../server/campaign.mjs';
import {newBattle,resume,refreshBattle} from '../server/battles.mjs';
import {RULES_VERSION} from '../server/rules-migration.mjs';
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
function encounter(target,ability,move='sleeppowder',source='Venusaur'){
 const b=new Battle({formatid:'gen4customgame',seed:[1,2,3,4],p1:{name:'Uno',team:[{species:source,ability:'No Guard',moves:[move],level:50}]},p2:{name:'Dos',team:[{species:target,ability,moves:['splash'],level:50}]}});
 b.makeChoices('move 1','move 1');return b;
}
test('Sleep Powder fails because of Vital Spirit or Insomnia, not Fighting type',()=>{
 for(const a of ['Vital Spirit','Insomnia']){const b=encounter('Mankey',a);assert.equal(b.p2.active[0].status,'');assert(b.log.some(l=>l.includes('ability: '+a)));}
 assert.equal(encounter('Mankey','Anger Point').p2.active[0].status,'slp');
});
test('HG Grass targets can sleep in both directions; Poison targets cannot be poisoned',()=>{
 assert.equal(encounter('Venusaur','Overgrow','sleeppowder','Tangela').p2.active[0].status,'slp');
 assert.equal(encounter('Tangela','Chlorophyll').p2.active[0].status,'slp');
 assert.equal(encounter('Venusaur','Overgrow','poisonpowder','Tangela').p2.active[0].status,'');
});
test('new battles use HG categories, types, priorities and native PP',()=>{
 const m=newPersonal('Reglas HG',1).trainer,s={members:[m],progress:{}};
 const b=newBattle(s,{players:[m.id],kind:'coop',encounter:{kind:'wild',team:[[56,5]],name:'Mankey'}},Date.now());
 assert.equal(b.gen,4);assert.equal(b.dex.moves.get('bite').category,'Physical');assert.equal(b.dex.moves.get('shadowball').category,'Special');assert.equal(b.dex.moves.get('endure').priority,3);
 assert.equal(data.moves[22].pp,15);assert.equal(data.moves[105].pp,10);assert.equal(data.moves[19].power,90);
 assert.equal(detail(createMon(56,5,'QA',{abilitySlot:1})).ability,'Anger Point');assert(learnset(1,13).includes(79));
});
test('the complete HG roster and move metadata match the shared battle engine',()=>{
 const dex=Dex.mod('gen4');assert.equal(Object.keys(data.species).length,159);assert.equal(Object.keys(data.moves).length,467);
 for(const [id,s]of Object.entries(data.species)){const d=dex.species.get(s.name);assert.deepEqual(s.types,d.types.map(t=>t.toLowerCase()));for(const [slot,aid]of Object.entries(s.abilitySlots))assert.equal(ability(createMon(+id,5,'QA',{abilitySlot:+slot})),dex.abilities.get(data.abilities[aid].slug).name);for(const [,mid]of s.levelUp)assert(data.moves[mid]);for(const mid of [...s.eggMoves,...s.machines])assert(data.moves[mid]);}
 for(const m of Object.values(data.moves)){const d=dex.moves.get(m.slug);assert(d.exists,m.slug);assert.equal(m.pp,d.pp,m.slug);assert.equal(m.category,d.category,m.slug);assert.equal(m.type,d.type.toLowerCase(),m.slug);assert.equal(m.priority,d.priority,m.slug);assert.equal(m.accuracy||true,d.accuracy,m.slug);if(m.power!==1)assert.equal(m.power,d.basePower,m.slug);}
});
test('old saves retain identities, chosen moves and spent PP while adapting Recover',()=>{
 const old=newPersonal('Migracion HG',1);delete old.rulesVersion;const m=createMon(65,40,old.trainer.id,{moves:[{id:105,pp:17},{id:94,pp:3}]});old.trainer.party=[m];const imported=validatePortable(old);
 assert.equal(imported.rulesVersion,RULES_VERSION);assert.equal(imported.trainer.party[0].uid,m.uid);assert.deepEqual(imported.trainer.party[0].moves,[{id:105,pp:10},{id:94,pp:3}]);
 const g=new LocalGame(imported),saved=g.snapshot();delete saved.row.state.rulesVersion;saved.row.state.members[0].party[0].moves[0].pp=17;
 assert.equal(new LocalGame(null,saved).member.party[0].moves[0].pp,10);
});
test('serialized Gen 3 battles remain resumable and finish under their original rules',()=>{
 const old=new Battle({formatid:'gen3companerossingles',seed:[1,2,3,4],p1:{name:'A',team:[{species:'Pikachu',moves:['growl']}]},p2:{name:'B',team:[{species:'Rattata',moves:['tailwhip']}]}});
 const b=resume({battle:{serialized:JSON.stringify(old.toJSON())}});assert.equal(b.gen,3);b.makeChoices('move 1','move 1');assert.equal(b.turn,2);
});
test('HG eggs hatch at level 1, use real gender thresholds, and warmth accelerates hatching',()=>{
 const a=createMon(1,20,'A',{gender:'F'}),b=createMon(1,20,'B',{gender:'M'}),egg=makeEgg(a,b,'C',()=>0);
 assert.equal(egg.level,1);assert.equal(egg.friendship,120);assert.equal(egg.eggSteps,5100);
 const profile=newPersonal('Crianza HG',1).trainer;profile.party=[createMon(126,20),egg];walked(profile,10);assert.equal(egg.eggSteps,5080);
});
test('museum entrance, exhibits and migration use the original collision map',()=>{
 const m=world.maps.pewter_museum;assert.equal(m.hgRoom.model,'museum-interior-complete');assert.equal(m.grid[19][10],8);assert.equal(m.grid[18][10],9);assert.equal(m.grid[9][10],7);assert(m.npcs.length>=7);
 const g=new LocalGame(newPersonal('Museo HG',1));const saved=g.snapshot();saved.row.state.worldRevision=5;Object.assign(saved.row.state.members[0].position,{map:m.id,x:20,y:17});const reload=new LocalGame(null,saved);assert.equal(reload.member.position.x,10);assert.equal(reload.member.position.y,18);
});
console.log(JSON.stringify({passed,failed:0}));
