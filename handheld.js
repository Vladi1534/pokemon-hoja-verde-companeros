/* A complete handheld interface; menus live in the game screen on small displays. */
const Handheld={
 mobile:false,
 init(){
  this.media=matchMedia('(max-width:760px), (max-width:950px) and (max-height:520px)');this.media.addEventListener('change',()=>this.layout());
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe($('screen'));
  this.layout();
  const button=document.createElement('button');button.id='handheldAlert';button.hidden=true;button.onclick=()=>this.social();$('screen').append(button);
  const side=Coop.side;Coop.side=function(){side.call(this);Handheld.refresh();};
  const render=Coop.renderBattle;Coop.renderBattle=function(b,force=false){render.call(this,b,force);if(!$('coopBattle')?.classList.contains('classic-battle')&&!this.playback&&!b.ended&&b.you&&!b.you.ready&&!b.you.wait&&!$('mobileBattleSwitch')){const button=document.createElement('button');button.id='mobileBattleSwitch';button.textContent=b.you.forceSwitch?'Elegir Pokémon':'Cambiar Pokémon';button.onclick=()=>Handheld.switches(b);$('coopBattle')?.querySelector('.coop-command-area')?.append(button);}};
  document.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='start')this.menu();if(action==='select')this.map();});
 },
 layout(){this.mobile=this.media.matches;document.body.classList.toggle('handheld',this.mobile);(this.mobile?$('screen'):document.body).append($('modalShade'));this.resize();},
 resize(){const box=$('screen'),w=this.mobile?Math.round(box.clientWidth*2):768,h=this.mobile?Math.round(box.clientHeight*2):480;if(w>0&&h>0&&(canvas.width!==w||canvas.height!==h)){canvas.width=w;canvas.height=h;ctx.imageSmoothingEnabled=false;}},
 refresh(){
  const alert=$('handheldAlert');if(!alert)return;const p=Coop.state?.proposal,invited=p&&p.players.includes(Coop.state.me)&&!p.accepted.includes(Coop.state.me);
  const social=typeof Friends!=='undefined'?(Friends.invitations().length+(Friends.data?.friends||[]).filter(f=>f.status==='incoming').length):0;
  alert.hidden=!this.mobile||(!invited&&!social);alert.textContent=invited?'Invitación · revisar':social?'Amigos · '+social+' aviso'+(social===1?'':'s'):'';
  const start=$('startButton');if(start)start.dataset.notice=invited||social?'true':'false';
 },
 map(){if(Game.mode==='coop-battle'||Game.mode==='battle'){UI.toast('Termina el combate para consultar el mapa.');return;}Coop.mapPanel();},
 menu(){
  if(!Coop.active)return Personal.title();if(Coop.playback){UI.toast('Espera a que termine el turno.');return;}
  if(UI.opened&&UI.kind==='start'){UI.close(true);return;}
  const battle=Coop.state.battle,active=Game.mode==='coop-battle'&&!battle?.ended,online=Personal.mode==='online',pending=Coop.state.trainer.party.reduce((n,p)=>n+p.pending.length,0);
  UI.open('start',UI.top('Tu aventura',online?'ONLINE':'1 JUGADOR')+`<div class="console-list">${[
   ['team','◉',active?'Cambiar Pokémon':'Equipo',pending?pending+' por revisar':Coop.state.trainer.party.length+' / 6'],
   ['bag','▣','Mochila',''],['friends','♧','Amigos',''],['settings','⚙','Opciones','']
  ].map(([id,icon,label,help])=>`<button data-console="${id}"><span aria-hidden="true">${icon}</span><b>${label}</b><small ${id==='friends'?'id="friendsCount"':''}>${help}</small><i aria-hidden="true">›</i></button>`).join('')}</div><button class="primary console-resume" id="consoleSave">Guardar y volver</button><p class="console-shortcut">SELECT · mapa &nbsp; B · volver</p>`);
  Friends.refresh();$('consoleSave').onclick=async()=>{if(await Personal.save())UI.close(true);};
  document.querySelectorAll('[data-console]').forEach(b=>b.onclick=()=>{
   const id=b.dataset.console;
   if(id==='team'){if(active)this.switches(battle);else Coop.team();}
   if(id==='bag'){if(active&&battle.temporary)UI.toast('Los duelos y las prácticas no consumen objetos.');else Coop.bag(active?battle:null);}
   if(id==='friends')this.social();if(id==='settings')this.settings();
  });
 },
 switches(b){
  if(!b?.you||b.ended)return Coop.team();
  UI.open('switch',UI.top('Elige un compañero','CAMBIO DE POKÉMON')+`<div class="console-switches">${b.you.team.map((p,i)=>`<button data-console-switch="${i+1}" ${p.active||p.fainted||b.you.trapped?'disabled':''}><img src="${ASSETS.front[p.id]}" alt=""><span><b>${esc(p.name)}</b><small>${p.hp}/${p.maxHp} PS${p.active?' · en combate':''}</small></span></button>`).join('')}</div>`);
  document.querySelectorAll('[data-console-switch]').forEach(button=>button.onclick=()=>{UI.close(true);Coop.sendChoice(b,'switch '+button.dataset.consoleSwitch);});
 },
 social(){return Friends.menu();},
 settings(){
  UI.open('console-settings',UI.top('Opciones','KANTO · 3.0.1')+`<button class="console-resume" id="consoleSound">${Audio.on?'Sonido activado':'Activar sonido'}</button><label class="audio-setting">Música<input id="musicVolume" type="range" min="0" max="100" value="${Math.round((Audio.musicVolume??.4)*100)}"></label><label class="audio-setting">Efectos<input id="effectsVolume" type="range" min="0" max="100" value="${Math.round((Audio.effectsVolume??.6)*100)}"></label><button class="console-resume" id="consoleRun">${Game.settings.run?'Movimiento: correr':'Movimiento: caminar'}</button><details class="menu-details"><summary>Partida y créditos</summary><div class="save-options"><button id="consoleCopy">Descargar partida</button><button id="consoleCredits">Créditos</button></div><p class="coop-note">Importa tu copia desde la pantalla inicial para recuperar el entrenador y sus amigos.</p></details>`);
  $('consoleSound').onclick=()=>{Audio.toggle();this.settings();};$('consoleRun').onclick=()=>{Game.settings.run=!Game.settings.run;this.settings();};$('consoleCopy').onclick=()=>Personal.export();$('consoleCredits').onclick=()=>UI.credits();
  $('musicVolume').oninput=e=>Audio.volume?.('music',+e.target.value/100);$('effectsVolume').oninput=e=>Audio.volume?.('effects',+e.target.value/100);

 }
};
