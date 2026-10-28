const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Replay=require('../battle-presentation.js');
const root=path.resolve(__dirname,'..');
const memory=new Map(),nodes=new Map();
const node=()=>({dataset:{},classList:{add(){},remove(){},toggle(){}},append(){},prepend(){},remove(){},querySelector(){return node()},innerHTML:''});
const getNode=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const context=vm.createContext({crypto,structuredClone,TextEncoder,TextDecoder,console,URLSearchParams,
 setTimeout:()=>1,clearTimeout(){},localStorage:storage,sessionStorage:storage,
 location:{hostname:'test.local',protocol:'http:',pathname:'/',search:'',hash:''},navigator:{},window:{},
 document:{querySelector:()=>node(),querySelectorAll:()=>[],createElement:()=>node(),addEventListener(){},body:{classList:{add(){},remove(){},toggle(){}}}},
 $:getNode,esc:v=>String(v),Game:{move(){},save(){},map:{pool:[],grid:[]},player:{},settings:{}},UI:{toast(){},close(){},refresh(){}},Story:{},Renderer:{},
 ASSETS:{front:{1:'front',19:'rat'},back:{1:'back'}},TYPE_NAMES:{},MOVES:{}});
vm.runInContext(fs.readFileSync(path.join(root,'personal-engine.js'),'utf8'),context);
vm.runInContext('window.PersonalEngine=PersonalEngine;',context);
for(const file of ['coop.js','personal-client.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);

(async()=>{
 await vm.runInContext(`(async()=>{
  const profile=PersonalEngine.newPersonal('Client QA',1);
  const game=new PersonalEngine.LocalGame(profile);
  Object.assign(game.member.position,{map:'viridian_center',x:10,y:8,seq:10,seen:Date.now()-5000});
  Personal.engine=game;Personal.mode='solo';Personal.record={format:'kanto-player',version:1,key:'1'.repeat(36),portable:profile};
  Coop.active=true;Coop.session={room:'local',key:Personal.record.key};Coop.state=game.state();
  Coop.apply=function(data){this.state=data;this.offline=false;};
  Coop.seq=25;Coop.flight={seq:26,steps:['down']};Coop.queue=['down'];Game.anim={elapsed:1};
  await Coop.poll();
  this.resynced={seq:Coop.seq,flight:Coop.flight,queued:Coop.queue.length,anim:Game.anim};
  Coop.queue=['down'];await Coop.flushMovement();
  this.moved={seq:Coop.seq,y:game.member.position.y};
  Personal.remote=async payload=>{this.hostPayload=payload;return {...game.state(),room:'test-room',invite:'1234ABCD'};};
  Personal.install=(data,session)=>{Coop.state=data;Coop.session=session;};
  Personal.invite=()=>{this.invited=true};
  await Personal.connect('host');
  this.connected={mode:Personal.mode,pending:Personal.pending(),id:Personal.record.portable.trainer.id,original:profile.trainer.id};
 })()`,context);
 assert.equal(context.resynced.seq,10);assert.equal(context.resynced.flight,null);
 assert.equal(context.resynced.queued,0);assert.equal(context.resynced.anim,null);
 assert.equal(context.moved.seq,11);assert.equal(context.moved.y,9);
 assert.equal(context.hostPayload.action,'host');assert.equal(context.hostPayload.portable.trainer.position.seq,11);
 assert.equal(context.connected.mode,'online');assert.equal(context.connected.pending,null);
 assert.equal(context.connected.id,context.connected.original);assert(context.invited);
 console.log('PASS actual client: repair old movement sequence, walk, flush and open the same trainer to friends');

 const battles=vm.runInContext(`(()=>{
  const profile=PersonalEngine.newPersonal('Replay QA',4);const mon=profile.trainer.party[0];
  mon.level=50;mon.xp=117360;mon.moves=[{id:45,pp:40}];
  const game=new PersonalEngine.LocalGame(profile);game.dispatch({action:'sync',seq:1,steps:['right','right']});
  const before=game.dispatch({action:'propose',kind:'coop',npc:'guide',requestId:crypto.randomUUID()}).battle;
  const after=game.dispatch({action:'choose',battle:before.id,turn:1,choice:'move 1',requestId:crypto.randomUUID()}).battle;
  return {before,after};
 })()`,context);
 const before=JSON.parse(JSON.stringify(battles.before)),after=JSON.parse(JSON.stringify(battles.after));
 const saved=JSON.stringify({before,after});
 const frames=Replay.frames(before,after,line=>line.includes('|move|')?'Ataque':line.includes('|-unboost|')?'Baja ataque':'');
 const moves=Replay.freshLines(before,after).filter(l=>l.startsWith('|move|')).map(l=>/^p\d/.exec(l.split('|')[2])[0]);
 assert.deepEqual(frames.filter(f=>f.actor).map(f=>f.actor),moves);assert.equal(moves.length,2);
 for(const frame of frames)assert.equal(frame.view.ended,false);
 const enemyMove=frames.findIndex(f=>f.actor==='p2'),damage=frames.findIndex(f=>f.view.sides[0].active[0].hp<before.sides[0].active[0].hp);
 assert(enemyMove>=0&&damage>enemyMove,'damage is shown after its own attacker, never on the first snapshot');
 assert.equal(JSON.stringify({before,after}),saved,'presentation cannot mutate battle authority');
 assert.equal(Replay.frames(after,after,()=>'' ).length,0);
 const repeated={...after,revision:after.revision+1,events:[...after.events,{seq:after.events.at(-1).seq+1,line:'|move|p1a: Charmander|Growl|p2a: Rattata'}]};
 assert.equal(Replay.freshLines(after,repeated).length,1,'identical moves on later turns remain distinct events');
 console.log('PASS actual simulator replay: action order, delayed HP, repeated moves and immutable snapshots');

 vm.runInContext(`Personal.mode='solo';Coop.dismissed=null;Coop.state.members=[];
 const outcome={...${JSON.stringify(after)},ended:true,result:'victory',rewarded:true};
 Coop.renderBattle(outcome,true);`,context);
 assert(getNode('coopBattle').innerHTML.includes('¡Has ganado el combate!'));
 assert(!getNode('coopBattle').innerHTML.includes('¡Victoria en equipo!'));
 vm.runInContext(`outcome.sides.push({...outcome.sides[0],id:'p3',owner:'other'});Coop.renderBattle(outcome,true);`,context);
 assert(getNode('coopBattle').innerHTML.includes('¡Victoria en equipo!'));
 console.log('PASS victory text follows combat participants, including solo battles in an online world');

 const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'coop-world.js'),'utf8')+';this.world=COOP_WORLD',c);
 for(const map of ['route1','route2','route22']){const table=c.world.maps[map].encounters.land_mons;assert.equal(table.reduce((n,e)=>n+e.weight,0),100);assert(table.every(e=>e.min>=2&&e.max<=7));}
 assert(c.world.maps.route22.pool.includes(29)&&c.world.maps.route22.pool.includes(32));
 assert.equal(c.world.maps.route2.encounters.land_mons.find(e=>e.id===63).weight,5);
 console.log('PASS early encounters: Nidoran pair, rare Abra and bounded starting levels');
})().catch(e=>{console.error(e);process.exitCode=1});
