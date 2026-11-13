/* Optional Mewtwo episode. Every capture/receipt is an authoritative action;
 * this interface only chooses a target, a name and a destination. */
const CloneUI={
 async laboratory(n,input={}){
  Immersion.focus={npc:n,map:Game.mapId,original:n.dir,until:Game.time+.5};n.dir=Immersion.direction(n,Game.player);
  const result=await Coop.action('quest',{npc:n.id,...input}),lab=result?.dialog;if(!lab?.cloningLab)return;
  UI.open('clone-lab',UI.top('Laboratorio de Isla Nueva','DISPOSITIVO REMOTO')+`<div class="clone-lab-status"><span class="clone-ball" aria-hidden="true">M</span><div><b>${lab.charges} / ${lab.capacity} Clon Balls</b><small>₽ ${Coop.state.trainer.money.toLocaleString('es-CL')} disponibles</small></div></div><p>${esc(lab.text)}</p><div class="clone-rules"><p><b>Una copia fiel.</b> El clon conserva nivel, IV, EV, naturaleza, habilidad y movimientos. Llega con todos sus PS y PP. No copia objetos equipados.</p><p><b>Tú eliges el puesto.</b> Puedes dejarlo en el PC o recibirlo en tu equipo durante el combate. Si reemplazas al activo, entra a combatir; si reemplazas uno de la banca, queda en la banca.</p><p><b>El rival lo recuerda.</b> El original vuelve inmediatamente y puede actuar ese mismo turno. El NPC recordará lo ocurrido.</p></div><div class="save-options"><button id="cloneRecharge" class="primary" ${lab.charges>=lab.capacity||Coop.state.trainer.money<lab.cost?'disabled':''}>Recargar 1 · ₽ ${lab.cost.toLocaleString('es-CL')}</button><button data-action="close">Volver al laboratorio</button></div><small class="coop-note">Dos cargas como máximo. Necesitas una casilla libre en el PC.</small>`);
  $('cloneRecharge').onclick=()=>this.laboratory(n,{recharge:true,quantity:1});
 },
 use(b){
  if(!b||b.temporary||!['trainer','league'].includes(b.encounter))return UI.toast('La Clon Ball se usa contra entrenadores NPC.');
  if(!Coop.state.progress.clone_remote)return UI.toast('Activa el dispositivo en el laboratorio de Isla Nueva.');
  if(b.you?.cloneUsed)return UI.toast('Ya utilizaste el dispositivo en este combate.');
  const enemies=b.sides.filter(s=>!s.owner).flatMap(s=>s.active.filter(p=>!p.fainted).map(p=>({...p,side:s.id,trainer:s.trainer})));
  UI.open('clone-target',UI.top('Clon Ball','CAPTURA GARANTIZADA · CONSUME UN TURNO')+`<p>Elige el Pokémon que quieres clonar. El original vuelve intacto a su entrenador y conserva su acción.</p><div class="hg-party-list">${enemies.map(p=>`<button data-clone-target="${p.side}">${CloneAppearance.image(ASSETS.front[p.id],p.id,p.cloneVariant)}<span><b>${esc(p.name)}</b><small>Nv. ${p.level} · ${esc(p.trainer)}</small></span></button>`).join('')}</div><button class="hg-back" id="cloneTargetBack">Volver a la mochila</button>`);
  $('cloneTargetBack').onclick=()=>HGInterface.bag(b);
  document.querySelectorAll('[data-clone-target]').forEach(button=>button.onclick=async()=>{UI.close(true);await Coop.action('battle_item',{battle:b.id,turn:b.turn,forceSwitch:false,item:'cloneball',target:button.dataset.cloneTarget});});
 },
 receive(b){
  const pending=b.you?.pendingClone;if(!pending?.ready)return;
  const canReceive=!b.ended&&!b.you.ready&&!b.you.wait&&!b.you.forceSwitch;
  UI.open('clone-receive',UI.top('Tu clon está listo','EL ORIGINAL YA VOLVIÓ CON SU ENTRENADOR')+`<div class="clone-preview">${CloneAppearance.image(ASSETS.front[pending.species],pending.species,true)}<div><b>${esc(pending.name)} · Nv. ${pending.level}</b><small>Mismos datos de origen · PS y PP completos</small></div></div><label for="cloneNickname">Mote opcional · hasta 10 caracteres</label><input id="cloneNickname" class="hg-search" maxlength="10" autocomplete="off" placeholder="${esc(pending.name)}"><p class="coop-note">${b.ended?'El combate terminó. Tu clon queda guardado en el PC.':b.you.forceSwitch?'Elige primero un relevo para tu Pokémon debilitado. El clon espera seguro en el PC.':'Recibirlo en el equipo consume tu acción de este turno. El Pokémon enviado al PC conserva sus PS y PP, aunque esté debilitado.'}</p><div class="save-options"><button data-clone-mode="pc" class="primary">Guardar en el PC · sin gastar turno</button>${canReceive&&Coop.state.trainer.party.length<6?'<button data-clone-mode="add">Añadir a la banca · 1 turno</button>':''}</div>${canReceive?`<h3>O reemplaza un puesto del equipo</h3><div class="hg-party-list clone-slots">${b.you.team.map(m=>`<button data-clone-mode="replace" data-clone-mon="${m.uid}" ${m.active&&b.you.trapped?'disabled':''}>${HGInterface.monImage(m)}<span><b>${esc(m.name)}</b><small>${m.active?'ACTIVO → el clon entra en combate':'BANCA → el clon queda en la banca'}${m.fainted?' · Debilitado':''}</small><small>${m.hp} / ${m.maxHp} PS${m.active&&b.you.trapped?' · Atrapado':''}</small></span></button>`).join('')}</div>`:''}<button class="hg-back" data-action="close">Decidir después · sigue en el PC</button>`);
  document.querySelectorAll('[data-clone-mode]').forEach(button=>button.onclick=async()=>{
   const name=$('cloneNickname').value;UI.close(true);
   const result=await Coop.action('clone_receive',{battle:b.id,turn:b.turn,forceSwitch:!!b.you.forceSwitch,mode:button.dataset.cloneMode,mon:button.dataset.cloneMon,name});
   if(!result&&!Coop.playback&&Coop.state?.battle?.you?.pendingClone)this.receive(Coop.state.battle);
  });
 },
 journal(){
  const steps=Coop.state?.journal?.mewtwo;if(!steps||$('cloneJournal'))return;
  const section=document.createElement('details');section.id='cloneJournal';section.className='menu-details';
  section.innerHTML='<summary>Isla Nueva · historia opcional</summary><p>Una aventura que se abre después de la cuarta medalla y del Scope Silph. Puedes completarla antes de la Liga.</p>'+steps.map(s=>`<div class="compact-chapter"><span>${s.done?'✓':'○'}</span><span><b>${esc(s.title)}</b><small>${esc(Coop.placeName(s.map))}</small></span></div>`).join('');
  $('modal').append(section);
 }
};
(()=>{
 const talk=Game.talk,use=HGInterface.use,mon=Coop.mon,map=Coop.mapPanel,follow=Renderer.follow,challenge=Coop.challenge,image=HGInterface.image;
 HGInterface.image=function(group,key,cls=''){return group==='items'&&key==='cloneball'?'<span class="clone-ball" aria-hidden="true">M</span>':image.call(this,group,key,cls);};
 Game.talk=function(n){if(n.data?.key==='native_travel'){Immersion.focus={npc:n,map:Game.mapId,original:n.dir,until:Game.time+.5};n.dir=Immersion.direction(n,Game.player);}return n.data?.key==='clone_lab'?CloneUI.laboratory(n):talk.call(this,n);};
 HGInterface.use=function(item,b){return item?.cloneBall?CloneUI.use(b):use.call(this,item,b);};
 HGInterface.monImage=function(m){const id=m.species||m.id;return CloneAppearance.image(ASSETS.front[id],id,!!m.clone||m.cloneVariant);};
 Coop.mon=function(uid){mon.call(this,uid);const m=this.state.trainer.party.find(p=>p.uid===uid);if(!m?.clone)return;
  const profile=document.querySelector('.campaign-profile');if(!profile)return;profile.querySelector('img')?.remove();profile.insertAdjacentHTML('afterbegin',HGInterface.monImage(m));
  const note=document.createElement('p');note.className='clone-provenance';note.textContent='CLON · Origen: '+m.clone.donorName+'. El original continúa con su entrenador. La procedencia se conserva al cambiar de mote o intercambiarlo.';profile.after(note);
 };
 Coop.mapPanel=function(...args){map.apply(this,args);if(UI.kind==='map')CloneUI.journal();};
 Coop.challenge=function(kind,id){challenge.call(this,kind,id);if(kind==='pvp'||!UI.opened)return;const clone=this.state.trainer.party.find(p=>p.clone?.donorId===id);if(clone){const note=document.createElement('div');note.className='quest-card';note.textContent='¡No te bastó con llevarte a mi Pokémon para clonarlo y ahora quieres derrotarme con su copia!';$('modal').querySelector('.modal-top')?.after(note);if(!note.isConnected)$('modal').prepend(note);}};
 Renderer.follow=function(c,x,y,dir,moving){const id=Game.lead?.id,party=Coop.state?.trainer?.party,cloned=Coop.active&&party?.find(m=>!m.eggSteps)?.clone;if(!cloned)return follow.call(this,c,x,y,dir,moving);const original=ASSET.follow[id];try{ASSET.follow[id]=CloneAppearance.follower(original,id,true);return follow.call(this,c,x,y,dir,moving);}finally{ASSET.follow[id]=original;}};
 // Never offer bound laboratory charges as transferable gifts.
 const gift=Personal.giftTo;Personal.giftTo=function(...args){gift.apply(this,args);$('giftItem')?.querySelectorAll('option').forEach(option=>{if(Coop.state.catalog[option.value]?.bound)option.remove();});};
})();
