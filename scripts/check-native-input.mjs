import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {world} from '../online-server/server/campaign.mjs';
import {previewNavigation} from '../online-server/server/navigation.mjs';
// Execute the real client input wrapper against the shared movement engine.
// A server-only reachability test misses the old client's grid veto entirely.
function client(map,x,y,dir,progress={}){
 const game={mapId:map,player:{x,y,px:x,py:y,dir},follower:{x,y:y+1,px:x,py:y+1,dir:'up'},settings:{run:false},busy:false,mode:'world',move(){throw Error('Legacy collision was consulted for a native map');},stepEnd(){},get map(){return world.maps[this.mapId]}};
 const coop={active:true,state:{trainer:{}},queue:[],apply(){},poll(){}},personal={install(){},pending(){return null}},panel={hidden:true,remove(){}};
 const context={Game:game,Coop:coop,Personal:personal,PersonalEngine:{previewNavigation},Story:{update(){}},Input:{shift:false},UI:{opened:false},Audio:{effect(){}},COOP_WORLD:world,$:()=>panel,performance:{now:()=>0},setTimeout:()=>1,clearTimeout(){},structuredClone};
 vm.runInNewContext(fs.readFileSync(new URL('../responsive-movement.js',import.meta.url),'utf8')+'\nthis.motion=MotionClient;',context);
 context.motion.nav={position:{map,x,y,dir},progress,league:4,steps:0,grace:3,repel:999,enabled:false,healthy:true,id:'input'};
 return {game,coop,motion:context.motion};
}
const edge=world.maps.route1.nativeConnections.find(c=>c.dir==='up'),c=client('route1',edge.x,edge.y,'up',{delivery:true});
c.game.move('up');assert.equal(c.coop.queue.length,1);assert.equal(c.motion.wait.kind,'portal');assert.equal(c.motion.nav.position.map,edge.to,'holding the same direction crosses a map edge');
const gate=client('vermilion_gym',5,7,'up',{circuit:true});gate.game.move('up');assert.equal(gate.game.player.y,6,'opened barriers animate immediately without legacy-grid rejection');
const exit=client('viridian_shop',4,7,'down');exit.game.move('down');assert.equal(exit.coop.queue.length,1);assert.equal(exit.motion.nav.position.map,'viridian','old saves on exit arrows are not trapped by the client');

let tested=0;for(const m of Object.values(world.maps).filter(m=>!m.aliasOf))for(const e of m.nativeConnections){const t=client(m.id,e.x,e.y,e.dir,new Proxy({},{get:()=>true}));t.game.move(e.dir);assert.equal(t.coop.queue.length,1,m.id+' edge queued');assert.equal(t.motion.nav.position.map,e.to);tested++;}
console.log('PASS native client input: '+tested+' same-direction edge crossings, standing exits and opened barriers');
