/* HeartGold-inspired touch menus, backed by the same personal/online actions. */
const HGInterface={
 pocket:'medicine',pages:{},selected:{},battle:null,
 pockets:[['items','Objetos'],['medicine','Medicina'],['balls','Poké Balls'],['machines','MT / MO'],['key','Clave']],
 image(group,key,cls=''){const src=typeof HG_UI!=='undefined'?HG_UI[group]?.[key]:null;return src?`<img class="${cls}" src="${src}" alt="">`:'<span class="hg-placeholder" aria-hidden="true">◇</span>';},
 init(){
  document.body.classList.add('hg-edition');
  const layout=Handheld.layout;Handheld.layout=function(){layout.call(this);$('screen').append($('modalShade'));};
  $('screen').append($('modalShade'));
  const open=UI.open;UI.open=function(kind,html){HGInterface.collapse();$('modal').dataset.menu=kind;return open.call(this,kind,html);};
  const status=Coop.status,refresh=UI.refresh;
  Coop.status=function(){status.call(this);HGInterface.objective();};
  UI.refresh=function(){refresh.call(this);HGInterface.objective();};
  $('mapHud').innerHTML='<button id="objectiveToggle" aria-expanded="false" aria-controls="objectiveDetails"><span class="hg-location"><b id="place">Kanto</b><i aria-hidden="true">⌄</i></span><span id="placeSub">Tu próximo objetivo</span></button><div id="objectiveDetails" hidden><small>OBJETIVO ACTUAL</small><b id="objectiveTitle"></b><p id="objectiveText"></p><button id="objectiveMap">Ver en el Pokégear ›</button></div>';
  $('objectiveToggle').onclick=()=>{const expanded=$('objectiveToggle').getAttribute('aria-expanded')!=='true';$('objectiveToggle').setAttribute('aria-expanded',String(expanded));$('objectiveDetails').hidden=!expanded;Input.clear();Audio.effect('menu');};
  $('objectiveMap').onclick=()=>{this.collapse();Handheld.map();};
  const menu=document.createElement('button');menu.id='screenMenu';menu.textContent='MENÚ';menu.onclick=()=>Handheld.menu();document.querySelector('.canvas-tools').prepend(menu);
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#mapHud'))this.collapse();});
  Handheld.menu=()=>this.menu();Coop.bag=b=>this.bag(b);Coop.team=()=>this.team();
 },
 collapse(){if($('objectiveDetails'))$('objectiveDetails').hidden=true;$('objectiveToggle')?.setAttribute('aria-expanded','false');},
 objective(){
  const q=Coop.active?Coop.state?.journal?.current:null;
  $('place').textContent=Game.map.name;$('placeSub').textContent=q?.[1]||'Tu aventura comienza aquí';
  $('objectiveTitle').textContent=q?.[1]||'Elige a tu compañero';$('objectiveText').textContent=q?.[4]||'Crea tu entrenador y empieza el viaje por Kanto.';
  $('mapHud').hidden=['battle','coop-battle','title','encounter'].includes(Game.mode);
 },
 menu(){
  if(!Coop.active)return Personal.title();if(Coop.playback)return UI.toast('Espera a que termine el turno.');
  if(UI.opened&&UI.kind==='start')return UI.close(true);
  const t=Coop.state.trainer,b=Coop.state.battle,active=Game.mode==='coop-battle'&&!b?.ended,pending=t.party.reduce((n,p)=>n+p.pending.length,0);
  UI.open('start',UI.top('Menú del entrenador',Personal.mode==='online'?'ONLINE · MUNDO COMPARTIDO':'MI AVENTURA · 1 JUGADOR')+`<div class="hg-menu-grid">${[
   ['team','◉','Pokémon',pending?'Decisiones pendientes':t.party.length+(t.party.length===1?' compañero':' compañeros')],['bag',this.image('pockets','items'),'Mochila','Objetos y MO'],['dex','▣','Pokédex','Hábitats y horarios'],['trainer','▤','Entrenador','Tu tarjeta y medallas'],['map',this.image('items','map'),'Pokégear','Mapa y objetivos'],['friends','♧','Amigos','Invitar y conectar'],['settings','⚙','Opciones','Sonido y partida']
  ].map(([key,icon,label,sub])=>`<button data-hg-menu="${key}"><span class="hg-menu-icon" aria-hidden="true">${icon}</span><span><b>${label}</b><small ${key==='friends'?'id="friendsCount"':''}>${sub}</small></span></button>`).join('')}</div><div class="hg-menu-footer"><span>₽ ${t.money.toLocaleString('es-CL')}</span><button id="hgSave">Guardar</button><button data-action="close">Volver al juego</button></div>`);
  Friends.refresh();$('hgSave').onclick=async()=>{if(await Personal.save())UI.close(true);};
  document.querySelectorAll('[data-hg-menu]').forEach(el=>el.onclick=()=>{
   const key=el.dataset.hgMenu;
   if(key==='team')return active?Handheld.switches(b):this.team();
   if(key==='bag')return active&&b.temporary?UI.toast('En duelos y prácticas no se consumen objetos.'):this.bag(active?b:null);
   if(key==='dex')return this.dex();if(key==='trainer')return this.trainer();if(key==='map')return Handheld.map();if(key==='friends')return Handheld.social();if(key==='settings')return Handheld.settings();
  });
 },
 entries(){
  const t=Coop.state.trainer,catalog=Coop.state.catalog||{},p=Coop.state.progress;
  const entries=Object.entries(t.bag).filter(([,qty])=>qty>0).map(([key,qty])=>({key,qty,...catalog[key],name:catalog[key]?.name||key,pocket:Immersion.pocket(catalog[key]||{})}));
  const special=[
   ['cut','Corte','machines','Corta los árboles que bloquean caminos al conseguir la Medalla Cascada.'],
   ['fly','Vuelo','machines','MO de Vuelo obtenida en Kanto. Consulta en el mapa las conexiones disponibles.'],
   ['surf_lesson','Surf','machines','Cruza el agua cuando tengas la Medalla Alma.'],
   ['strength','Fuerza','machines','Permite mover las rocas señaladas en tu aventura.'],
   ['bill','Ticket del S. S. Anne','key','Billete entregado por Bill. Permite entrar al S. S. Anne en Ciudad Carmín.'],
   ['scope','Scope Silph','key','Identifica al fantasma de la Torre Pokémon.'],['flute','Poké Flauta','key','Despierta a los Snorlax que bloquean las rutas.'],
   ['tea','Té','key','La bebida que permite acceder a Ciudad Azafrán.'],['card_key','Tarjeta Llave','key','Abre las puertas señaladas de Silph S. A.'],['secret_key','Llave Secreta','key','Abre el gimnasio de Isla Canela.'],['rainbow','Pase Arcoíris','key','Acceso a las islas de la aventura posterior a la Liga.']
  ];
  for(const [key,name,pocket,description]of special)if(p[key])entries.push({key,name,pocket,description,qty:1,passive:true});
  if(p.parcel&&!p.delivery)entries.push({key:'parcel',name:'Paquete de Oak',pocket:'key',description:'Llévalo al laboratorio de Pueblo Paleta.',qty:1,passive:true});
  entries.push({key:'map',name:'Mapa de Kanto',pocket:'key',description:'Consulta tu ubicación, los caminos y el siguiente objetivo.',qty:1,passive:true});
  return entries;
 },
 description(item){if(!item)return 'Elige un objeto para ver su descripción.';return item.description||(item.heal?'Recupera '+item.heal+' PS de un Pokémon.':item.revive?'Revive a un Pokémon debilitado con la mitad de sus PS.':item.status?'Cura '+(item.key==='antidote'?'el envenenamiento.':'los problemas de estado.'):item.rate?'Sirve para capturar un Pokémon salvaje. Se utiliza durante el combate.':item.steps?'Evita encuentros salvajes durante '+item.steps+' pasos.':item.sourceItemId?'Puede hacer evolucionar a ciertos Pokémon. Elige un compañero compatible.':'Un objeto para tu aventura.');},
 bag(battle=null){
  if(battle&&(battle.ended||battle.you?.ready||battle.you?.wait||battle.you?.forceSwitch))return UI.toast('Espera al siguiente turno para usar la mochila.');
  this.battle=battle;const all=this.entries(),list=all.filter(i=>i.pocket===this.pocket),pages=Math.max(1,Math.ceil(list.length/6));
  this.pages[this.pocket]=Math.min(this.pages[this.pocket]||0,pages-1);
  const page=this.pages[this.pocket],visible=list.slice(page*6,page*6+6);
  if(!visible.some(i=>i.key===this.selected[this.pocket]))this.selected[this.pocket]=visible[0]?.key;
  const selected=visible.find(i=>i.key===this.selected[this.pocket]),title=this.pockets.find(p=>p[0]===this.pocket)[1];
  const bag=typeof HG_UI!=='undefined'?HG_UI[Game.settings.avatar==='leaf'?'bagFemale':'bag']:null;
  UI.open('hg-bag',UI.top('Mochila',battle?'COMBATE · UN OBJETO CONSUME UN TURNO':'OBJETOS DEL ENTRENADOR')+`<div class="hg-bag-overview"><div class="hg-bag-art">${bag?`<img src="${bag}" alt="Mochila de aventura">`:''}<span>${esc(title)}</span></div><div class="hg-item-description" aria-live="polite"><b>${esc(selected?.name||title)}</b><p>${esc(this.description(selected))}</p></div></div><div class="hg-pockets" role="tablist" aria-label="Bolsillos">${this.pockets.map(([key,label])=>`<button role="tab" id="pocket-${key}" aria-controls="bagItems" aria-selected="${key===this.pocket}" data-pocket="${key}" title="${label}">${this.image('pockets',key)}<span>${label}</span></button>`).join('')}</div><div id="bagItems" class="hg-bag-items" role="tabpanel" aria-labelledby="pocket-${this.pocket}">${visible.length?visible.map(i=>`<button data-hg-item="${i.key}" class="${selected?.key===i.key?'selected':''}" aria-pressed="${selected?.key===i.key}">${this.image('items',i.key)}<span><b>${esc(i.name)}</b>${i.pocket==='machines'?'<small>MO</small>':''}</span><small>${i.passive?'':'×'+i.qty}</small></button>`).join(''):'<p class="hg-empty">No tienes objetos en este bolsillo.</p>'}${visible.length?Array.from({length:6-visible.length},()=>'<div class="hg-empty-slot" aria-hidden="true"></div>').join(''):''}</div><div class="hg-bag-footer"><button id="bagPrev" aria-label="Página anterior" ${page===0?'disabled':''}>◀</button><span>${page+1} / ${pages}</span><button id="bagNext" aria-label="Página siguiente" ${page===pages-1?'disabled':''}>▶</button><button class="primary" id="bagUse" ${!selected||selected.passive&&selected.key!=='map'?'disabled':''}>${selected?.key==='map'?'Ver mapa':'Usar'}</button><button id="bagExit">Salir</button></div>`);
  document.querySelectorAll('[data-pocket]').forEach(el=>el.onclick=()=>{this.pocket=el.dataset.pocket;Audio.effect('menu');this.bag(battle);});
  document.querySelectorAll('[data-hg-item]').forEach(el=>el.onclick=()=>{this.selected[this.pocket]=el.dataset.hgItem;this.bag(battle);});
  $('bagPrev').onclick=()=>{this.pages[this.pocket]--;this.bag(battle);};$('bagNext').onclick=()=>{this.pages[this.pocket]++;this.bag(battle);};
  $('bagUse').onclick=()=>this.use(selected,battle);$('bagExit').onclick=()=>battle?UI.close(true):this.menu();
 },
 async use(item,battle){
  if(!item)return;if(item.key==='map')return Handheld.map();
  if(item.rate){if(!battle||battle.encounter!=='wild')return UI.toast('Las Balls se usan en un combate contra un Pokémon salvaje.');UI.close(true);return Coop.action('battle_item',{battle:battle.id,turn:battle.turn,item:item.key});}
  if(item.steps){if(battle)return UI.toast('Usa el Repelente fuera del combate.');if(await Coop.action('item',{item:item.key}))this.bag();return;}
  if(battle&&item.sourceItemId)return UI.toast('Las piedras evolutivas se usan fuera del combate.');
  const mons=battle?battle.you.team:Coop.state.trainer.party;
  UI.open('hg-item-target',UI.top('¿En qué Pokémon?',item.name)+`<div class="hg-party-list">${mons.map(m=>`<button data-item-mon="${m.uid}" ${!Immersion.canUse(item,m)?'disabled':''}>${this.monImage(m)}<span><b>${esc(m.name)}</b><small>${m.hp} / ${m.maxHp} PS${m.status?' · '+({psn:'ENV',tox:'ENV',brn:'QUE',par:'PAR',slp:'DOR',frz:'CON'}[m.status]||m.status):''}</small></span></button>`).join('')}</div><button class="hg-back" id="itemBack">Volver a la mochila</button>`);
  $('itemBack').onclick=()=>this.bag(battle);
  document.querySelectorAll('[data-item-mon]').forEach(el=>el.onclick=async()=>{UI.close(true);const result=await Coop.action(battle?'battle_item':'item',{...(battle?{battle:battle.id,turn:battle.turn}:{}),item:item.key,mon:el.dataset.itemMon});if(!battle)this.bag();else if(!result&&!Coop.playback)this.bag(Coop.state.battle);});
 },
 monImage(m){return `<img src="${ASSETS.front[m.species||m.id]||''}" alt="">`;},
 team(){
  const t=Coop.state.trainer;
  UI.open('hg-team',UI.top('Tus Pokémon','EQUIPO · '+t.party.length+' / 6')+`<div class="hg-party-list">${t.party.map((m,i)=>`<button data-hg-mon="${m.uid}" class="${i?'':'leader'}">${this.monImage(m)}<span><b>${m.eggSteps?'Huevo':esc(m.name)} ${!m.eggSteps&&m.gender!=='N'?(m.gender==='F'?'♀':'♂'):''}</b><small>${m.eggSteps?'Camina para ayudarlo a eclosionar':'Nv. '+m.level+(i?'':' · Líder')}</small><i class="hg-hp"><i style="width:${Math.max(0,m.hp/m.maxHp*100)}%;background:${m.hp/m.maxHp<.25?'#dc6664':m.hp/m.maxHp<.5?'#e5bc4c':'#6dcc8a'}"></i></i><small>${m.eggSteps?'':m.hp+' / '+m.maxHp+' PS'}${m.pending.length?' · ¡Revisar aprendizaje!':''}</small></span></button>`).join('')}</div><div class="hg-menu-footer"><small>Tu líder camina contigo.</small><button id="teamBack">Menú</button></div>`);
  document.querySelectorAll('[data-hg-mon]').forEach(el=>el.onclick=()=>Coop.mon(el.dataset.hgMon));$('teamBack').onclick=()=>this.menu();
 },
 trainer(){
  const s=Coop.state,t=s.trainer,me=s.members.find(m=>m.id===s.me),badges=s.journal.badges,minutes=Math.floor(Game.playTime/60),id=String(me.id).replace(/[^0-9]/g,'').slice(-5).padStart(5,'0');
  UI.open('hg-trainer',UI.top('Tarjeta de entrenador','KANTO · '+(s.progress.champion?'CAMPEÓN':'LIGA POKÉMON'))+`<div class="hg-trainer-card"><div class="hg-card-heading"><b>${esc(me.name)}</b><span>ID ${id}</span></div><div class="hg-card-body"><div class="hg-card-data"><p>Dinero <b>₽ ${t.money.toLocaleString('es-CL')}</b></p><p>Pokédex <b>${t.caught} ${t.caught===1?'especie':'especies'}</b></p><p>Medallas <b>${badges.filter(b=>b.won).length} / 8</b></p><p>Sesión <b>${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,'0')}</b></p></div><div class="hg-card-partner"><canvas id="trainerPortrait" width="96" height="112" aria-label="${me.avatar==='leaf'?'Hoja':'Rojo'}, tu entrenador"></canvas><small>${esc(Game.map.name)}</small></div></div><div class="hg-card-badges">${badges.map((b,i)=>`<span class="${b.won?'earned':''}" title="${esc(b.name)}${b.won?' · conseguida':''}"><b>${b.won?'◆':'◇'}</b><small>${i+1}</small></span>`).join('')}</div></div><div class="hg-menu-footer"><span>${Personal.mode==='online'?'● Online':'● Partida personal'}</span><button id="trainerBack">Menú</button></div>`);
  const c=$('trainerPortrait').getContext('2d');c.imageSmoothingEnabled=false;c.scale(3,3);Renderer.person(c,0,0,'down',me.avatar||'red',false);$('trainerBack').onclick=()=>this.menu();
 }
};
HGInterface.init();
