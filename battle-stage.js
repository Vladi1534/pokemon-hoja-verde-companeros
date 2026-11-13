/* Trainer entrances, team counters and bag effects; no battle rules live here. */
var BattleStage=(()=>{
 const pics=new Map();
 const image=src=>{if(!pics.has(src)){const im=new Image();im.src=src;pics.set(src,im);}return pics.get(src);};
 const allies=(b,s)=>['p1','p3'].includes(s.id)===['p1','p3'].includes(b.you?.side||'p1');
 function portrait(side,back=false){
  if(back)return `<span class="trainer-back" style="background-image:url('${TRAINER_ART.back[side.trainerLook==='leaf'?'leaf':'red']}')"></span>`;
  let key=TRAINER_ART.byId[side.trainerPic];
  const look=(side.trainerLook||'').replace('native_',''),names={brock:'leader_brock',misty:'leader_misty',surge:'leader_lt_surge',erika:'leader_erika',koga:'leader_koga',sabrina:'leader_sabrina',blaine:'leader_blaine',giovanni:'leader_giovanni',blue:'rival_late',lorelei:'elite_four_lorelei',bruno:'elite_four_bruno',agatha:'elite_four_agatha',lance:'elite_four_lance',red:'red',leaf:'leaf',bugcatcher:'bug_catcher',rocket:'rocket_grunt_m',rocketF:'rocket_grunt_f',gentleman:'gentleman'};
  key=key||names[look]||look;
  if(look==='ash'||look==='jessie'||look==='james')return `<span class="trainer-anime" style="background-image:url('${ASSETS.people[look]}')"></span>`;
  if(look.startsWith('pokemon_'))return `<img src="${ASSETS.front[+look.slice(8)]}" alt="">`;
  return `<img src="${TRAINER_ART.front[key]||TRAINER_ART.front.gentleman}" alt="">`;
 }
 function balls(side){return `<span class="trainer-balls" aria-label="${(side.roster||[]).filter(p=>!p.fainted).length} de ${(side.roster||[]).length} Pokémon disponibles">${(side.roster||[]).map(p=>`<i class="${p.fainted?'lost':p.status?'status':''} ${p.active?'active':''}" title="${p.fainted?'Debilitado':p.status?'Con problema de estado':'Preparado'}"></i>`).join('')}</span>`;}
 function rosters(b){return `<div class="battle-rosters">${b.sides.map(s=>`<div class="battle-roster ${allies(b,s)?'ours':'theirs'}"><small>${esc(s.trainer)}</small>${balls(s)}</div>`).join('')}</div>`;}
 function lowHealth(b){if(!b||b.ended||!b.you)return false;return b.you.team.some(m=>m.active&&!m.fainted&&m.hp>0&&Math.floor(m.hp*48/m.maxHp)<=9);}
 function frame(step,previous,el){
  for(const s of step.view.sides){const current=s.active[0],before=previous?.sides.find(v=>v.id===s.id)?.active[0],bar=el.querySelector(`[data-side="${s.id}"] .hpbar i`);if(bar&&before?.hp!==current?.hp){bar.style.transition='none';bar.style.width=(before?.hp||0)+'%';requestAnimationFrame(()=>{bar.style.transition='width .45s linear';bar.style.width=current.hp+'%';});}}
  if(step.capture){const c=step.capture;el.dataset.capture=c.phase;const arena=el.querySelector('.coop-arena'),ball=document.createElement('div');ball.className='capture-ball '+(c.phase==='throw'?'throwing':c.phase==='shake'?'shaking':c.phase==='caught'?'caught':'');ball.innerHTML='<i></i>';arena.append(ball);const target=el.querySelector(`[data-side="${c.side}"]`);if(target&&c.phase!=='escaped')target.classList.add('inside-ball');}
  if(step.sfx&&step.actor&&step.target){const target=el.querySelector(`[data-side="${step.target}"]`),fx=document.createElement('div');fx.className='move-flare '+step.sfx;fx.innerHTML='<i></i><i></i><i></i>';target?.append(fx);}
 }
 function bicycle(c,x,y,dir,avatar,moving){const im=image(TRAINER_ART.bicycle[avatar==='leaf'?'leaf':'red']);if(!im.complete||!im.naturalWidth)return;const base=dir==='up'?1:dir==='left'||dir==='right'?2:0,frame=moving?(base===0?3:base===1?5:7)+Math.floor(Game.time*12)%2:base;Renderer.ellipse(c,x+16,y+29,17,4,'#1c3d324d');c.save();c.translate(Math.round(x+16),Math.round(y+32));if(dir==='right')c.scale(-1,1);c.drawImage(im,frame*32,0,32,32,-24,-43,48,48);c.restore();}
 return {portrait,balls,rosters,lowHealth,frame,bicycle,allies};
})();
if(typeof module==='object'&&module.exports)module.exports=BattleStage;
if(typeof Coop!=='undefined')(()=>{
 const render=Coop.renderBattle,cancel=Coop.cancelPlayback,action=Coop.action,seen=new Set();
 function cleanup(){clearTimeout(Coop.introTimer);Coop.battleIntro=null;$('coopBattle')?.classList.remove('trainer-intro');$('trainerEntrance')?.remove();}
 Coop.finishEntrance=function(){const b=this.battleIntro?.latest;cleanup();if(b)render.call(this,b,true);};
 Coop.cancelPlayback=function(){cleanup();return cancel.call(this);};
 Coop.renderBattle=function(b,force=false){
  if(this.battleIntro){if(this.battleIntro.latest.id!==b.id||!this.active||this.dismissed===b.id)cleanup();else{this.battleIntro.latest=structuredClone(b);return;}}
  render.call(this,b,force);
  if(!this.active||!$('coopBattle')||this.playback||b.ended||b.turn>1||seen.has(b.id))return;
  seen.add(b.id);if(seen.size>100)seen.delete(seen.values().next().value);
  const own=b.sides.find(s=>s.id===(b.you?.side||'p1')),foes=b.sides.filter(s=>!BattleStage.allies(b,s)),wild=b.encounter==='wild'||b.encounter==='ghost';
  if(!own||!foes.length)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  this.battleIntro={latest:structuredClone(b)};
  const el=$('coopBattle'),arena=el.querySelector('.coop-arena');el.classList.add('trainer-intro');el.dataset.entrance='trainers';
  const overlay=document.createElement('div');overlay.id='trainerEntrance';overlay.innerHTML=`<div class="trainer-entrance ally-trainer">${BattleStage.portrait(own,true)}</div>${wild?'':foes.map((s,i)=>`<div class="trainer-entrance enemy-trainer enemy-${i}">${BattleStage.portrait(s)}<b>${esc(s.trainer)}</b></div>`).join('')}`;arena.append(overlay);
  const message=text=>{el.querySelector('.coop-combat-log').innerHTML='<span>'+esc(text)+'</span>';};
  message(wild?'¡Un '+foes[0].active[0].name+' salvaje ha aparecido!':'¡'+foes.map(s=>s.trainer).join(' y ')+' te desafía!');
  el.querySelector('.coop-command-area').innerHTML='<p class="coop-resolving">Preparando el combate…</p><button id="skipEntrance">Saltar presentación</button>';$('skipEntrance').onclick=()=>this.finishEntrance();
  const stageTwo=()=>{if(!this.battleIntro)return;el.dataset.entrance='enemy';message(wild?'¡Prepárate para el encuentro!':foes.map(s=>s.trainer+' envía a '+s.active[0].name).join('. ')+'.');Audio.effect('capture');this.introTimer=setTimeout(()=>{if(!this.battleIntro)return;el.dataset.entrance='ally';message('¡Adelante, '+own.active[0].name+'!');Audio.effect('capture');this.introTimer=setTimeout(()=>this.finishEntrance(),850);},850);};
  this.introTimer=setTimeout(stageTwo,wild?500:1150);
 };
 Coop.action=async function(name,args={}){if(this.battleIntro&&!['checkpoint','sync'].includes(name)){UI.toast('Espera la entrada de los Pokémon o salta la presentación.');return;}return action.call(this,name,args);};
})();
