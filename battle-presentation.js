/* Replay authoritative simulator events in order. This never changes battle rules. */
var BattleReplay=(()=>{
 const copy=value=>JSON.parse(JSON.stringify(value));
 const sideOf=actor=>/^p[1-4]/.exec(actor||'')?.[0];
 function freshLines(previous,next){
  const cursor=previous.events?.at(-1)?.seq;
  if(Number.isInteger(cursor)&&next.events)return next.events.filter(e=>e.seq>cursor).map(e=>e.line);
  const old=previous.log||[],current=next.log||[];
  for(let overlap=Math.min(old.length,current.length);overlap>0;overlap--)
   if(old.slice(-overlap).every((line,i)=>line===current[i]))return current.slice(overlap);
  return current;
 }
 function condition(view,sideId,value){
  const mon=view.sides.find(s=>s.id===sideId)?.active[0];if(!mon)return;
  const match=/^(\d+)(?:\/(\d+))?(?:\s+(\w+))?/.exec(value||'');if(!match)return;
  mon.hp=match[2]?Math.ceil(100*Number(match[1])/Number(match[2])):0;
  mon.fainted=mon.hp===0;mon.status=['psn','tox','brn','par','slp','frz'].includes(match[3])?match[3]:'';
  if(view.you?.side===sideId){const own=view.you.team.find(p=>p.active);if(own){own.hp=Math.round(mon.hp*own.maxHp/100);own.fainted=mon.fainted;own.status=mon.status;}}
 }
 function frames(previous,next,translate){
  if(!previous||previous.id!==next.id||next.revision<=previous.revision)return [];
  const view=copy(previous),out=[];let messages=[];
  view.ended=false;view.result=null;view.rewarded=false;
  if(view.you){view.you.ready=true;view.you.wait=true;}
  const push=(actor=null,delay=650)=>out.push({view:copy(view),messages:[...messages],actor,delay});
  for(const line of freshLines(previous,next)){
   const p=line.split('|'),kind=p[1],id=sideOf(p[2]),text=translate(line);
   if(kind==='turn'){view.turn=Number(p[2]);continue;}
   if(kind==='move'){messages=[text];push(id,760);continue;}
   if(['switch','drag','replace'].includes(kind)){
    const side=view.sides.find(s=>s.id===id),target=next.sides.find(s=>s.id===id)?.active[0];
    if(side&&target)side.active=[copy(target)];condition(view,id,p[4]);
    messages=[text||'Un nuevo Pokémon entra al combate.'];push(null,650);continue;
   }
   if(kind==='-damage'||kind==='-heal'){
    condition(view,id,p[3]);if(text)messages.push(text);
    if(!messages.length)messages=[kind==='-damage'?'El Pokémon recibe daño.':'El Pokémon recupera PS.'];
    push(null,540);continue;
   }
   if(kind==='faint'){condition(view,id,'0 fnt');messages.push(text);push(null,700);continue;}
   if(kind==='-status'||kind==='-curestatus'){
    const mon=view.sides.find(s=>s.id===id)?.active[0];if(mon)mon.status=kind==='-status'?p[3]:'';
   }
   if(text){messages.push(text);messages=messages.slice(-3);push(null,520);}
  }
  return out;
 }
 return {frames,freshLines};
})();
if(typeof module==='object'&&module.exports)module.exports=BattleReplay;

if(typeof Coop!=='undefined')(()=>{
 const render=Coop.renderBattle,action=Coop.action;
 Coop.cancelPlayback=function(){clearTimeout(this.playbackTimer);this.playback=null;this.presentedBattle=null;};
 Coop.finishPlayback=function(){
  const latest=this.playback?.latest,notice=this.playback?.notice;if(!latest)return;
  clearTimeout(this.playbackTimer);this.playback=null;this.presentedBattle=structuredClone(latest);
  render.call(this,latest,true);$('coopBattle')?.classList.remove('playing-turn');if($('coopBattle'))delete $('coopBattle').dataset.phase;this.side();this.status();if(notice)UI.toast(notice);
 };
 Coop.playNextFrame=function(){
  const replay=this.playback;if(!replay)return;
  if(!this.active||this.dismissed===replay.latest.id||this.state?.battle?.id!==replay.latest.id){this.cancelPlayback();return;}
  const step=replay.queue.shift();if(!step){this.finishPlayback();return;}
  step.view.revision='animation-'+(++replay.serial);replay.frame=step.view;
  render.call(this,step.view,true);
  const el=$('coopBattle');if(!el){this.cancelPlayback();return;}
  el.classList.add('playing-turn');el.dataset.phase=step.actor?'attack-'+step.actor:'effect';
  if(step.actor)el.querySelector(`[data-side="${step.actor}"]`)?.classList.add('attacking');
  el.querySelector('.coop-combat-log').innerHTML=step.messages.map(t=>`<span>${esc(t)}</span>`).join('');
  el.querySelector('.coop-command-area').innerHTML='<p class="coop-resolving" role="status">Resolviendo el turno…</p><button id="coopReplaySkip">Mostrar resultado</button>';
  $('coopBattleExit').disabled=true;
  $('coopReplaySkip').onclick=()=>this.finishPlayback();
  this.side();
  this.playbackTimer=setTimeout(()=>this.playNextFrame(),step.delay);
 };
 Coop.renderBattle=function(b,force=false){
  if(!this.active||this.dismissed===b.id){this.cancelPlayback();return;}
  if(this.playback&&this.playback.latest.id!==b.id)this.cancelPlayback();
  if(this.playback){
   if(b.revision>this.playback.latest.revision){
    this.playback.queue.push(...BattleReplay.frames(this.playback.latest,b,line=>this.logText(line)));
    this.playback.latest=structuredClone(b);
   }
   return;
  }
  const frames=BattleReplay.frames(this.presentedBattle,b,line=>this.logText(line));
  if(frames.length){
   this.playback={latest:structuredClone(b),queue:frames,serial:0};this.playNextFrame();return;
  }
  this.presentedBattle=structuredClone(b);render.call(this,b,force);
  $('coopBattle')?.classList.remove('playing-turn');
 };
 Coop.action=async function(name,args={}){
  if(this.playback&&!['checkpoint','sync'].includes(name)){UI.toast('Espera a que termine la secuencia del turno.');return;}
  return action.call(this,name,args);
 };
})();
