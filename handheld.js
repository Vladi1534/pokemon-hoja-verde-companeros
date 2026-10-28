/* A complete handheld interface; menus live in the game screen on small displays. */
const Handheld={
 mobile:false,
 init(){
  this.media=matchMedia('(max-width:760px), (max-width:950px) and (max-height:520px)');this.media.addEventListener('change',()=>this.layout());
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe($('screen'));
  this.layout();
  const button=document.createElement('button');button.id='handheldAlert';button.hidden=true;button.onclick=()=>this.social();$('screen').append(button);
  const side=Coop.side;Coop.side=function(){side.call(this);Handheld.refresh();};
  const render=Coop.renderBattle;Coop.renderBattle=function(b,force=false){render.call(this,b,force);if(!this.playback&&!b.ended&&b.you&&!b.you.ready&&!b.you.wait&&!$('mobileBattleSwitch')){const button=document.createElement('button');button.id='mobileBattleSwitch';button.textContent=b.you.forceSwitch?'Elegir Pokémon':'Cambiar Pokémon';button.onclick=()=>Handheld.switches(b);$('coopBattle')?.querySelector('.coop-command-area')?.append(button);}};
  document.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='start')this.menu();if(action==='select')this.map();});
 },
 layout(){this.mobile=this.media.matches;document.body.classList.toggle('handheld',this.mobile);(this.mobile?$('screen'):document.body).append($('modalShade'));this.resize();},
 resize(){const box=$('screen'),w=this.mobile?Math.round(box.clientWidth*2):768,h=this.mobile?Math.round(box.clientHeight*2):480;if(w>0&&h>0&&(canvas.width!==w||canvas.height!==h)){canvas.width=w;canvas.height=h;ctx.imageSmoothingEnabled=false;}},
 refresh(){
  const alert=$('handheldAlert');if(!alert)return;const p=Coop.state?.proposal,invited=p&&p.players.includes(Coop.state.me)&&!p.accepted.includes(Coop.state.me);
  alert.hidden=!this.mobile||!invited;alert.textContent=invited?'Invitación · revisar':'';
  const start=$('startButton');if(start)start.dataset.notice=invited?'true':'false';
 },
 map(){if(Game.mode==='coop-battle'||Game.mode==='battle'){UI.toast('Termina el combate para consultar el mapa.');return;}UI.map();},
 menu(){
  if(!Coop.active)return Personal.title();if(Coop.playback){UI.toast('Espera a que termine el turno.');return;}
  if(UI.opened&&UI.kind==='start'){UI.close(true);return;}
  const battle=Coop.state.battle,active=Game.mode==='coop-battle'&&!battle?.ended,online=Personal.mode==='online',pending=Coop.state.trainer.party.reduce((n,p)=>n+p.pending.length,0);
  UI.open('start',UI.top('Tu aventura',online?'ONLINE · '+(Coop.state.host===Coop.state.me?'TU MUNDO':'VISITANTE'):'1 JUGADOR · PARTIDA PERSONAL')+`<div class="console-menu">${[
   ['team','◉',active?'Cambiar Pokémon':'Equipo',pending?pending+' decisiones pendientes':Coop.state.trainer.party.length+(Coop.state.trainer.party.length===1?' compañero':' compañeros')],
   ['bag','▣','Mochila',active?'Usar un objeto':'Objetos de tu viaje'],
   ['map','⌖','Mapa y diario','Tu próximo destino'],
   ['friends','♧','Amigos',online?Coop.state.members.length+' en este mundo':'Abrir o visitar un mundo'],
   ['save','◇','Guardar','Conservar tu progreso'],
   ['settings','⚙','Opciones','Sonido y controles']
  ].map(([id,icon,label,help])=>`<button data-console="${id}" ${active&&id==='map'?'disabled':''}><span aria-hidden="true">${icon}</span><b>${label}</b><small>${help}</small></button>`).join('')}</div><div class="console-objective"><small>TU PRÓXIMO PASO</small><p>${esc(Coop.state.journal.current[4])}</p></div><button class="primary console-resume" id="consoleResume">Volver al juego</button>`);
  $('consoleResume').onclick=()=>UI.close(true);
  document.querySelectorAll('[data-console]').forEach(b=>b.onclick=()=>{
   const id=b.dataset.console;
   if(id==='team'){if(active)this.switches(battle);else Coop.team();}
   if(id==='bag'){if(active&&battle.temporary)UI.toast('Los duelos y las prácticas no consumen objetos.');else Coop.bag(active?battle:null);}
   if(id==='map')this.map();if(id==='friends')this.social();
   if(id==='save')Personal.save();if(id==='settings')this.settings();
  });
 },
 switches(b){
  if(!b?.you||b.ended)return Coop.team();
  UI.open('switch',UI.top('Elige un compañero','CAMBIO DE POKÉMON')+`<div class="console-switches">${b.you.team.map((p,i)=>`<button data-console-switch="${i+1}" ${p.active||p.fainted||b.you.trapped?'disabled':''}><img src="${ASSETS.front[p.id]}" alt=""><span><b>${esc(p.name)}</b><small>${p.hp}/${p.maxHp} PS${p.active?' · en combate':''}</small></span></button>`).join('')}</div>`);
  document.querySelectorAll('[data-console-switch]').forEach(button=>button.onclick=()=>{UI.close(true);Coop.sendChoice(b,'switch '+button.dataset.consoleSwitch);});
 },
 social(){
  if(!Coop.active||Personal.mode!=='online')return Personal.menu();const s=Coop.state,p=s.proposal;
  UI.open('friends',UI.top('Con tus amigos',s.host===s.me?'ONLINE · TU MUNDO':'ONLINE · VISITANTE')+`${p&&p.players.includes(s.me)?`<div class="console-invite"><b>${esc(s.members.find(m=>m.id===p.from)?.name||'Un amigo')} propone ${p.kind==='gift'?'un regalo':p.kind==='trade'?'un intercambio':p.kind==='pvp'?'un duelo':esc(p.encounter.name)}</b><div class="save-options">${!p.accepted.includes(s.me)?'<button class="primary" id="consoleAccept">Revisar y aceptar</button>':'Esperando a tu compañero…'}<button id="consoleDecline">Cancelar invitación</button></div></div>`:''}<div class="console-friends">${s.members.map(m=>`<div><b>${esc(m.name)}${m.id===s.me?' · tú':''}</b><small>${esc(COOP_WORLD.maps[m.position.map]?.name||'Kanto')}</small></div>`).join('')}</div><div class="console-menu">${[['invite','Invitar'],['pvp','Duelo amistoso'],['gift','Regalar'],['trade','Intercambiar'],['world','Mi partida / salir']].map(([id,label])=>`<button data-social="${id}">${label}</button>`).join('')}</div>`);
  if($('consoleAccept'))$('consoleAccept').onclick=()=>{if(p.kind==='gift')Personal.reviewGift(p);else if(p.kind==='trade')Coop.trade(p);else Coop.action('respond',{proposal:p.id,accept:true}).then(r=>{if(r)UI.close(true);});};
  if($('consoleDecline'))$('consoleDecline').onclick=()=>Coop.action('respond',{proposal:p.id,accept:false}).then(()=>this.social());
  document.querySelectorAll('[data-social]').forEach(b=>b.onclick=()=>{const a=b.dataset.social;if(a==='invite')Personal.invite();if(a==='pvp')Coop.challenge('pvp');if(a==='gift')Personal.gift();if(a==='trade')Coop.trade();if(a==='world')Personal.menu();});
 },
 settings(){
  UI.open('console-settings',UI.top('Opciones','KANTO · 2.5.0')+`<div class="console-menu"><button id="consoleSound">${Audio.on?'Silenciar música':'Activar música'}</button><button id="consoleRun">${Game.settings.run?'Caminar':'Correr'}</button><button id="consoleCopy">Descargar partida</button><button id="consoleCredits">Créditos</button></div><p>Cruceta: moverte o elegir. A: hablar y confirmar. B: volver; en el mapa alterna caminar y correr. START: menú. SELECT: mapa.</p><p>Tu partida se guarda en este navegador. Puedes descargar una copia para conservarla.</p>`);
  $('consoleSound').onclick=()=>{Audio.toggle();this.settings();};$('consoleRun').onclick=()=>{Game.settings.run=!Game.settings.run;this.settings();};$('consoleCopy').onclick=()=>Personal.export();$('consoleCredits').onclick=()=>UI.credits();
 }
};
