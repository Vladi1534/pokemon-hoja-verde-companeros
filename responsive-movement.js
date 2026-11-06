/* Predict only movement events; all battles and rewards remain authoritative. */
const MotionClient={
 nav:null,wait:null,serial:0,clockAt:0,serverTime:0,
 clock(){return this.serverTime+performance.now()-this.clockAt;},
 reset(data){this.nav=data.navigation?structuredClone(data.navigation):null;this.clockAt=performance.now();this.serverTime=data.serverTime;},
 schedule(){clearTimeout(Coop.timer);if(!Coop.polling)Coop.timer=setTimeout(()=>Coop.poll(),0);},
 ack(serial,data){if(this.wait&&Number.isFinite(serial)&&serial>=this.wait.serial)this.wait.confirmed=data;},
 cover(label){
  let el=$('encounterTransition');if(!el){el=document.createElement('div');el.id='encounterTransition';el.setAttribute('role','status');$('screen').append(el);}
  el.textContent=label;el.hidden=false;
 },
 clear(){this.wait=null;$('encounterTransition')?.remove();if(Game.mode==='encounter')Game.mode='world';},
 finish(){
  const pending=this.wait;if(!pending)return false;pending.finished=true;
  if(pending.confirmed){const data=pending.confirmed;this.clear();Coop.apply(data,true);return true;}
  if(pending.kind==='trainer'){
   if(!UI.opened){Audio.effect('notice');Coop.challenge('coop',pending.npc);pending.shown=true;}
  }else{if(pending.kind==='wild'){Game.mode='encounter';Audio.effect('encounter');}this.cover(pending.kind==='wild'?'¡Un Pokémon salvaje!':'Entrando en '+(COOP_WORLD.maps[pending.map]?.name||'la siguiente zona')+'…');}
  this.schedule();return true;
 },
 rebase(data){
  this.reset(data);
  if(!this.nav)return;
  for(let i=0;i<Coop.queue.length;i++)this.nav=PersonalEngine.previewNavigation(this.nav,Coop.queue[i],Coop.moveTimes?.[i]||this.clock());
 },
 look(){
  if(!this.nav||this.wait||Game.mode!=='world'||Game.anim||UI.opened||Coop.queue.length||Coop.flight||Coop.requestBusy)return;
  const npc=PersonalEngine.visibleTrainer(this.nav,this.clock());
  if(npc){this.wait={kind:'trainer',npc,serial:this.serial,finished:true};Audio.effect('notice');Coop.challenge('coop',npc);this.wait.shown=true;this.schedule();}
 }
};
(function(){
 const move=Game.move,stepEnd=Game.stepEnd,apply=Coop.apply,update=Story.update,install=Personal.install;
 Personal.install=function(data,session){MotionClient.clear();MotionClient.serial=0;return install.call(this,data,session);};
 Game.move=function(dir){
  if(!Coop.active)return move.call(this,dir);
  if(MotionClient.wait||Coop.queue.length>=4)return;
  const before=Coop.queue.length,clock=MotionClient.clock();let predicted;
  if(this.map.native&&MotionClient.nav){
   if(this.busy||Coop.offline||Coop.requestBusy||Coop.state?.trainer.spotted||Personal.changing||Personal.pending())return;
   const previous=this.player.dir;predicted=PersonalEngine.previewNavigation(MotionClient.nav,dir,clock);this.player.dir=dir;
   if(!predicted.moved&&previous===dir&&(!predicted.position.notice||Coop.flight||Coop.queue.length))return;
   // Native steps, jumps, changed tiles and edge transitions have exactly the
   // same rules as the server. The legacy grid must never veto this request.
   Coop.queue.push(dir);
   if(predicted.moved&&predicted.position.map===this.mapId){
    const from={x:this.player.x,y:this.player.y},to={x:predicted.position.x,y:predicted.position.y},f=this.follower;
    this.anim={elapsed:0,duration:(Input.shift||this.settings.run)?.105:.17,from,to,ffrom:{x:f.px,y:f.py},fto:{...from}};
    const fx=from.x-f.x,fy=from.y-f.y;if(fx||fy)f.dir=Math.abs(fx)>Math.abs(fy)?(fx>0?'right':'left'):(fy>0?'down':'up');f.x=from.x;f.y=from.y;Object.assign(this.player,to);
   }
  }else move.call(this,dir);
  if(Coop.queue.length>before){
   Coop.moveTimes ||= [];Coop.moveSerials ||= [];Coop.moveTimes.push(clock);Coop.moveSerials.push(++MotionClient.serial);
   if(MotionClient.nav){
    MotionClient.nav=predicted||PersonalEngine.previewNavigation(MotionClient.nav,dir,clock);
    const event=MotionClient.nav.event;
    if(event){MotionClient.wait={...event,serial:MotionClient.serial,finished:!Game.anim};if(!Game.anim)MotionClient.finish();}
   }
   MotionClient.schedule();
  }
 };
 Game.stepEnd=function(){if(Coop.active&&MotionClient.finish())return;return stepEnd.call(this);};
 Coop.apply=function(data,initial=false){
  if(!this.active||!initial&&this.state&&(data.revision<this.state.revision||data.revision===this.state.revision&&data.serverTime<this.state.serverTime))return false;
  const pending=MotionClient.wait,battle=data.battle&&!data.battle.ended&&!!data.battle.you;
  // An idle look response confirms the locally displayed trainer's facing.
  if(pending?.kind==='trainer'&&!Coop.flight&&!Coop.queue.length&&data.trainer.spotted===pending.npc)pending.confirmed=data;
  if(battle||data.trainer.spotted){MotionClient.clear();this.queue=[];this.moveTimes=[];this.moveSerials=[];}
  else if(pending?.confirmed&&(!Game.anim||pending.finished)){
   if(pending.shown&&UI.opened)UI.close(true);
   MotionClient.clear();initial=true;
  }
  const result=apply.call(this,data,initial);MotionClient.rebase(data);
  return result;
 };
 Story.update=function(dt){update.call(this,dt);if(Coop.active&&MotionClient.nav){for(const n of Game.map.npcs)if(n.role==='trainer')n.dir=PersonalEngine.trainerFacing(n,MotionClient.clock());MotionClient.look();}};
})();
