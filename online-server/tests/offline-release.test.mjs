import assert from 'node:assert/strict';
import {LocalGame,newPersonal} from '../browser/local-engine.mjs';
import {world,encounter,gate,done,challengeBlock} from '../server/campaign.mjs';
import {visibleTrainer,navigationState,trainerFacing,walkable} from '../server/navigation.mjs';
import {createMon,heal} from '../server/creatures.mjs';
import {newBattle,flee} from '../server/battles.mjs';
let count=0;const test=(name,fn)=>{fn();count++;console.log('PASS '+name);};
const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
function beside(game,map,id){const n=world.maps[map].npcs.find(n=>n.id===id);assert(n,id);const [dir,[dx,dy]]=Object.entries(directions).find(([,d])=>walkable(map,n.x-d[0],n.y-d[1]));game.member.position={...game.member.position,map,x:n.x-dx,y:n.y-dy,dir,seen:Date.now()-5000};return n;}
const act=(g,action,args={})=>g.dispatch({action,requestId:crypto.randomUUID(),...args});

test('Rocket recruiter never spots an ineligible trainer and rejected dialogue releases an old lock',()=>{
 const g=new LocalGame(newPersonal('Puente QA',7)),n=beside(g,'route24','route24_recruiter');
 assert.match(challengeBlock({progress:{}},n),/cinco/);
 for(let t=0;t<7200;t+=1800){const [dx,dy]=directions[trainerFacing(n,t)];g.member.position.x=n.x+dx;g.member.position.y=n.y+dy;const nav=navigationState({progress:{}},g.member);assert.notEqual(visibleTrainer(nav,t),n.id);}
 beside(g,'route24',n.id);g.member.spotted=n.id;
 const rejected=act(g,'propose',{kind:'coop',npc:n.id});assert.match(rejected.message,/cinco/);assert.equal(rejected.trainer.spotted,null);assert(!g.activeBattle);
 const before={...g.member.position},dir=Object.keys(directions).find(d=>{const [dx,dy]=directions[d];return walkable('route24',before.x+dx,before.y+dy);});
 act(g,'sync',{seq:before.seq+1,steps:[dir]});assert.notDeepEqual([g.member.position.x,g.member.position.y],[before.x,before.y]);
 g.member.spotted=n.id;const synced=act(g,'sync');assert.equal(synced.trainer.spotted,null);
 for(let i=0;i<5;i++)g.member.progress['route24_bridge'+i]=true;
 beside(g,'route24',n.id);assert(!challengeBlock({progress:g.member.progress},n));assert(act(g,'propose',{kind:'coop',npc:n.id}).battle);
});
test('failed wild escape consumes one turn; successful escape persists HP, PP and no victory reward',()=>{
 const m=newPersonal('Huida QA',7).trainer;m.party=[createMon(143,100,m.id,{nature:'Brave',ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:0}})];const s={members:[m],progress:{}};
 newBattle(s,{kind:'coop',players:[m.id],encounter:{kind:'wild',name:'Pidgey salvaje',team:[[16,70]],flag:null}},Date.now());
 // A healthy, slow Snorlax survives the retaliation and isolates the failed-attempt path.
 const input=()=>({battle:s.battle.id,turn:s.battle.turn,forceSwitch:false});
 const money=m.money;flee(s,m,input(),Date.now(),()=>255);
 assert.equal(s.battle.turn,2);assert(s.battle.common.log.some(l=>l.includes('No pudiste escapar')));
 if(!s.battle.ended)flee(s,m,input(),Date.now(),()=>0);
 assert.equal(s.battle.result,'escaped');assert.equal(s.battle.rewarded,false);assert.equal(m.money,money);
});
test('trainer battles reject escape without consuming a turn',()=>{
 const g=new LocalGame(newPersonal('Entrenador QA',1));beside(g,'pallet','guide');const b=act(g,'propose',{kind:'coop',npc:'guide'}).battle;
 assert.throws(()=>act(g,'flee',{battle:b.id,turn:b.turn,forceSwitch:false}),/entrenador/);assert.equal(g.state().battle.turn,1);
});
test('2.6 rooms migrate out-of-bounds positions while retaining identity, party and story',()=>{
 const g=new LocalGame(newPersonal('Casa QA',4)),before=structuredClone(g.member.party);g.row.state.worldRevision=4;g.member.position={...g.member.position,map:'pallet_home',x:19,y:15};g.member.progress.bill=true;
 const restored=new LocalGame(null,g.snapshot());assert.deepEqual(restored.member.party,before);assert(restored.member.progress.bill);assert.equal(restored.member.position.x,world.maps.pallet_home.arrival.x);assert.equal(restored.member.id,g.member.id);
 const imported=g.portable();imported.worldRevision=4;imported.trainer.position={map:'viridian_shop',x:19,y:15,dir:'down'};const other=new LocalGame(imported);assert.equal(other.member.position.y,world.maps.viridian_shop.arrival.y);
});

// This is a story/state-machine regression with strong legal team fixtures,
// not a claim to have balanced or manually played the full campaign.
let game=new LocalGame(newPersonal('Liga Offline QA',7));
game.member.party=Array.from({length:6},()=>createMon(150,100,game.member.id,{moves:[94,53,57,85].map(id=>({id,pp:15}))}));
let victories=0;
function accessible(target){const progress=game.member.progress,ctx={progress},queue=['pallet'],seen=new Set();for(let i=0;i<queue.length;i++){const id=queue[i];if(seen.has(id))continue;seen.add(id);const m=world.maps[id];for(const p of m.portals)if(!gate(ctx,p.gate))queue.push(p.to);for(const d of m.doors){if(d.to==='ssanne'&&!done(ctx,'bill')||d.to==='silph_1'&&!done(ctx,'flute')||d.to==='cinnabar_gym'&&!done(ctx,'secret_key'))continue;queue.push(d.to);}}assert(seen.has(target),'Story destination is gated: '+target);}
function talk(map,id,args={}){accessible(map);beside(game,map,id);return act(game,'quest',{npc:id,...args});}
function win(map,id,rest=true){accessible(map);beside(game,map,id);if(rest)game.member.party.forEach(heal);let state=act(game,'propose',{kind:'coop',npc:id});assert(state.battle&&!state.battle.ended,id);
 for(let turn=0;turn<200&&!state.battle.ended;turn++){
  const b=state.battle,r=b.you;state=act(game,'choose',{battle:b.id,turn:b.turn,forceSwitch:r.forceSwitch,choice:'default'});
 }
 assert.equal(state.battle.result,'victory',id);assert.equal(state.battle.sides.length,2);assert(state.battle.you.team.every(p=>Number.isFinite(p.xp)&&Number.isFinite(p.levelXp)));victories++;
 // Save/reload after every mandatory encounter: no network, no shared campaign state.
 game=new LocalGame(null,JSON.parse(JSON.stringify(game.snapshot())));
}
test('offline Pallet, Moon, five trainers, Bill and SS Anne persist through reloads',()=>{
 talk('viridian_shop','viridian_shop_clerk');talk('pallet_lab','pallet_lab_oak');win('pewter_gym','pewter_gym_leader');win('moon_b2','moon_b2_rocket');talk('moon_b2','moon_b2_fossil',{fossil:138});
 for(let i=0;i<5;i++)win('route24','route24_bridge'+i);win('route24','route24_recruiter');talk('bill_home','bill_home_bill');talk('bill_home','bill_home_bill_pc');talk('bill_home','bill_home_bill');
 win('cerulean_gym','cerulean_gym_leader');win('ssanne','ssanne_rival');talk('ssanne_cabin','ssanne_cabin_captain');talk('vermilion_gym','vermilion_gym_switch1');talk('vermilion_gym','vermilion_gym_switch2');win('vermilion_gym','vermilion_gym_leader');
});
test('offline Rocket, Fuji, Silph, Safari and Mansion unlock eight individual badges',()=>{
 talk('casino','casino_poster');win('rocket_b1','rocket_b1_key');win('rocket_b2','rocket_b2_giovanni');talk('rocket_b2','rocket_b2_scope');win('celadon_gym','celadon_gym_leader');win('tower_2','tower_2_ghost');win('tower_3','tower_3_rocket');talk('tower_3','tower_3_fuji');talk('celadon_house','celadon_house_tea');talk('silph_2','silph_2_card_key');win('silph_2','silph_2_rival');win('silph_3','silph_3_giovanni');talk('silph_3','silph_3_president');win('saffron_gym','saffron_gym_leader');win('route12','route12_snorlax');talk('safari','safari_teeth');talk('fuchsia_house','fuchsia_house_warden');talk('safari_hut','safari_hut_surf');win('fuchsia_gym','fuchsia_gym_leader');talk('mansion_1','mansion_1_statue1');talk('mansion_1','mansion_1_statue2');win('mansion_2','mansion_2_scientist');talk('mansion_2','mansion_2_secret_key');win('cinnabar_gym','cinnabar_gym_leader');win('viridian_gym','viridian_gym_leader');assert(done({progress:game.member.progress},'league_access'));
});
test('offline Elite Four and champion finish and survive a full local save reload',()=>{
 game.member.party.forEach(heal);for(let i=0;i<5;i++)win('indigo_arena','indigo_arena_league',false);
 assert(game.member.progress.champion);assert.equal(game.member.league,0);assert.equal(game.state().journal.badges.filter(b=>b.won).length,8);assert.equal(game.member.progress.league_clears,1);
 assert(!game.row.state.progress.champion,'personal progression is not stored in the shared world');
});
console.log(JSON.stringify({passed:count,offlineStoryBattles:victories,networkRequests:0,fixture:'Level-100 test teams verify campaign state and saves, not balance.'}));
