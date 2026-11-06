const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map(),node=()=>({hidden:false,setAttribute(){},append(el){nodes.set(el.id,el)},remove(){nodes.delete(this.id)}});
const screen=node();const timers=[];
const context=vm.createContext({crypto,structuredClone,TextEncoder,TextDecoder,console,performance,
 setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout(){},
 document:{createElement:node},$:id=>id==='screen'?screen:nodes.get(id),
 UI:{opened:false,close(){this.opened=false}},Audio:{effect(){}},Story:{update(){}},
 Game:{mode:'world',anim:null,map:{npcs:[]},move(dir){if(this.anim||this.mode!=='world')return;Coop.queue.push(dir);this.anim={};},stepEnd(){}},
 Coop:{active:true,queue:[],apply(data){this.state=data;this.applied=(this.applied||0)+1;},challenge(){this.challenges=(this.challenges||0)+1;context.UI.opened=true;},poll(){}},Personal:{install(){}}});
// Original movement enqueues locally; the wrapper under test supplies event barriers.
context.Game.move=function(dir){if(this.anim||this.mode!=='world')return;context.Coop.queue.push(dir);this.anim={};};
vm.runInContext(fs.readFileSync('personal-engine.js','utf8'),context);
vm.runInContext(fs.readFileSync('coop-world.js','utf8'),context);
vm.runInContext(fs.readFileSync('responsive-movement.js','utf8')+'\nthis.motion=MotionClient;',context);
const {game,initial}=vm.runInContext(`(()=>{
 const profile=PersonalEngine.newPersonal('Delayed client',1);
 const map=COOP_WORLD.maps.route4;let pos;for(let y=1;y<map.h-1&&!pos;y++)for(let x=1;x<map.w-2;x++)if(map.native.encounter[y][x+1]&&![2,3,7,10,8].includes(map.grid[y][x])&&![2,3,7,10,8].includes(map.grid[y][x+1])&&!map.npcs.some(n=>Math.abs(n.x-x)+Math.abs(n.y-y)<6)){pos={map:'route4',x,y,dir:'right'};break;}profile.trainer.position=pos;
 const game=new PersonalEngine.LocalGame(profile);
 for(let steps=0;steps<1000;steps++){game.member.steps=steps;const d=game.state();if(PersonalEngine.previewNavigation(d.navigation,'right',d.serverTime).event?.kind==='wild')break;}
 return {game,initial:game.state()};
})()`,context);
context.Coop.apply(initial,true);context.Game.move('right');assert.equal(context.motion.wait.kind,'wild');
context.Game.anim=null;context.Game.stepEnd();assert.equal(context.Game.mode,'encounter');assert(nodes.has('encounterTransition'));
for(let i=0;i<20;i++)context.Game.move('right');assert.equal(context.Coop.queue.length,1,'latency cannot let the player leave the encounter tile');
const serial=context.Coop.moveSerials[0],data=game.dispatch({action:'sync',seq:1,steps:['right'],times:context.Coop.moveTimes});
context.Coop.queue=[];context.motion.ack(serial,data);context.Coop.apply(data);
assert.equal(context.motion.wait,null);assert(!nodes.has('encounterTransition'));assert.equal(data.members[0].position.x,initial.members[0].position.x+1);
const applied=context.Coop.applied;context.Coop.apply(initial);assert.equal(context.Coop.applied,applied,'a late response cannot rewind accepted state');
console.log('PASS client under delayed network: immediate transition, locked encounter tile, acknowledgement, no stale rollback');
// Portal confirmation is held until its animation finishes, then cannot hang input.
const portal=vm.runInContext(`(()=>{const p=PersonalEngine.newPersonal('Portal',7);p.trainer.progress.fossils=true;const m=COOP_WORLD.maps.moon,door=m.portals.find(p=>p.to==='route4');p.trainer.position={map:m.id,x:door.x,y:door.y-1,dir:'down'};return new PersonalEngine.LocalGame(p);})()`,context);
context.Game.mode='world';context.Coop.state=null;context.UI.opened=false;context.Coop.apply(portal.state(),true);context.Game.move('down');assert.equal(context.motion.wait.kind,'portal');
const arrival=portal.dispatch({action:'sync',seq:1,steps:['down'],times:context.Coop.moveTimes});context.Coop.queue=[];context.motion.ack(context.Coop.moveSerials.at(-1),arrival);context.Coop.apply(arrival);assert(context.motion.wait);
context.Game.anim=null;context.Game.stepEnd();assert.equal(context.motion.wait,null);assert.equal(context.Game.mode,'world');assert.equal(context.Coop.state.members[0].position.map,'route4');
console.log('PASS portal acknowledgement cannot interrupt an unfinished step or leave a permanent movement lock');
