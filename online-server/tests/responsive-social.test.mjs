import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {socialExecute} from '../server/social.mjs';
import {execute,pureAction} from '../server/service.mjs';
import {newPersonal,validatePortable} from '../server/portable.mjs';
import {LocalGame} from '../browser/local-engine.mjs';
import {world} from '../server/campaign.mjs';
import {navigationState,previewNavigation,visibleTrainer,trainerFacing} from '../server/navigation.mjs';
const require=createRequire(import.meta.url),{Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
let passed=0;const test=async(name,fn)=>{await fn();console.log('PASS '+name);passed++;};
const now=Date.now(),profile=newPersonal('Navigation QA',1),m=profile.trainer;
const state={schema:2,worldRevision:4,personal:true,sharedGates:{},members:[m],progress:{},actions:[]};
m.position={...m.position,map:'route4',x:6,y:11,seq:0,seen:now-3000};
await test('predicted wild encounter stops authoritative movement on exactly the same grass tile',()=>{
 let nav;for(let steps=0;steps<1000;steps++){m.steps=steps;nav=previewNavigation(navigationState({progress:{}},m),'right',now);if(nav.event?.kind==='wild')break;}
 assert.equal(nav.event.kind,'wild');pureAction(state,m,{action:'sync',seq:1,steps:['right','right','right'],times:[now,now,now]},now+1400);
 assert.equal(m.position.x,7);assert.equal(m.steps,nav.steps);assert(Object.values(state.battles).some(b=>!b.ended));
});
await test('Mt Moon portal is a packet barrier; no later step or cave encounter can follow it',()=>{
 state.battles={};state.battle=null;m.progress={fossils:true};m.steps=0;m.position={map:'moon',x:42,y:18,dir:'right',seq:2,seen:now-3000};
 const nav=previewNavigation(navigationState({progress:m.progress},m),'right',now);assert.equal(nav.event.kind,'portal');
 pureAction(state,m,{action:'sync',seq:3,steps:['right','right','right'],times:[now,now,now]},now+1000);
 assert.equal(m.position.map,'route4');assert.equal(m.position.x,2);assert.equal(m.travelGrace,2);assert(!Object.values(state.battles).some(b=>!b.ended));assert.equal(m.steps,1);
});
await test('rotating trainer detection agrees with the timestamp sent by a delayed client',()=>{
 const n=world.maps.route3.npcs.find(n=>n.role==='trainer');let timestamp=now;
 while(trainerFacing(n,timestamp)!=='down')timestamp-=1800;
 m.position={map:'route3',x:n.x,y:n.y+1,seq:4,seen:timestamp};m.progress={};m.travelGrace=0;delete m.spotted;
 const nav=navigationState({progress:{}},m);assert.equal(visibleTrainer(nav,timestamp),n.id);
 pureAction(state,m,{action:'sync',lookTime:timestamp},timestamp+1200);assert.equal(m.spotted,n.id);
});
await test('old save on a sealed edge migrates once without losing sequence, party or story',()=>{
 const game=new LocalGame(newPersonal('Migration',7)),s=game.snapshot();s.row.state.worldRevision=3;
 const player=s.row.state.members[0];player.position={...player.position,map:'viridian',x:33,y:14,seq:21};player.progress.scope=true;
 const loaded=new LocalGame(null,s);assert.equal(loaded.member.position.seq,21);assert.equal(loaded.member.position.x,world.maps.viridian.arrival.x);assert(loaded.member.progress.scope);assert.deepEqual(loaded.member.party,player.party);assert.equal(loaded.row.state.worldRevision,6);
 const portable=structuredClone(profile);portable.trainer.position={map:'route4',x:21,y:31};assert.equal(validatePortable(portable).trainer.position.x,world.maps.route4.arrival.x);
});
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});
try{
 const db=await mf.getD1Database('DB');for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())for(const sql of fs.readFileSync('drizzle/'+file,'utf8').split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql).run();
 const req=new Request('https://test.local/api/coop'),keys=['a','b','c'].map(c=>c.repeat(36));
 const call=(i,action,args={},time=now)=>socialExecute(db,{action,...args},keys[i],req,time);
 const sync=(i,time=now)=>call(i,'social_sync',{name:['Amigo Uno','Amigo Dos','Ajeno'][i],starter:[1,7,4][i]},time);
 let a=await sync(0),b=await sync(1),c=await sync(2),host,invitation;
 await test('friendship needs recipient consent; private identities never appear in the address book',async()=>{
  assert.equal(a.code.length,10);a=await call(0,'social_request',{code:b.code});assert.equal(a.friends[0].status,'outgoing');
  await assert.rejects(()=>call(0,'social_reply',{code:b.code,accept:true}),/solicitud/);
  b=await sync(1);assert.equal(b.friends[0].status,'incoming');b=await call(1,'social_reply',{code:a.code,accept:true});assert.equal(b.friends[0].status,'friend');assert.equal(b.friends[0].online,true);
  assert(!JSON.stringify(b).includes(keys[0]));assert.deepEqual(Object.keys(b.friends[0]).sort(),['avatar','code','name','online','starter','status']);
 });
 await test('presence expires and survives re-opening the same saved trainer',async()=>{
  const late=await sync(0,now+40000);assert.equal(late.friends[0].online,false);const back=await sync(1,now+40000);assert.equal(back.code,b.code);assert.equal(back.friends[0].online,true);await sync(0);await sync(1);
 });
 await test('host can invite only an accepted online friend into its own open world',async()=>{
  host=await execute(db,{action:'host',key:keys[0],requestId:crypto.randomUUID(),portable:newPersonal('Amigo Uno',1)},keys[0],req);
  await assert.rejects(()=>call(2,'social_invite',{code:b.code,room:host.room}),/acepta/);
  await assert.rejects(()=>call(1,'social_invite',{code:a.code,room:host.room}),/propia/);
  await call(0,'social_invite',{code:b.code,room:host.room});b=await sync(1);assert.equal(b.invitations.length,1);invitation=b.invitations[0].id;
  await assert.rejects(()=>call(2,'social_invite_reply',{invitation,accept:true}),/caducó/);
  const accepted=await call(1,'social_invite_reply',{invitation,accept:true});assert.equal(accepted.invite,host.invite);
  assert.equal((await call(1,'social_invite_reply',{invitation,accept:true})).invite,host.invite,'retry after lost reply');
 });
 await test('joining from an invitation preserves the guest; friends persist after returning solo',async()=>{
  const guest=newPersonal('Amigo Dos',7);const joined=await execute(db,{action:'join',key:keys[1],invite:host.invite,portable:guest},keys[1],req);assert.equal(joined.me,guest.trainer.id);
  await call(1,'social_sync',{name:'Amigo Dos',starter:7,room:host.room});assert.equal((await call(1,'social_sync',{name:'Amigo Dos',starter:7,room:host.room})).invitations.length,0);
  await execute(db,{action:'depart',room:host.room,requestId:crypto.randomUUID()},keys[1],req);assert.equal((await sync(1)).friends[0].status,'friend');
 });
 await test('closed worlds and removed friendships invalidate outstanding invitations',async()=>{
  await call(0,'social_invite',{code:b.code,room:host.room});invitation=(await sync(1)).invitations[0].id;
  await execute(db,{action:'depart',room:host.room,requestId:crypto.randomUUID()},keys[0],req);
  await assert.rejects(()=>call(1,'social_invite_reply',{invitation,accept:true}),/mundo abierto/);
  await call(0,'social_remove',{code:b.code});const gone=await sync(1);assert.equal(gone.friends.length,0);assert.equal(gone.invitations.length,0);
 });
 console.log(JSON.stringify({passed,failed:0}));
}finally{await mf.dispose();}
