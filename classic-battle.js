/* Presentation only: every choice still goes through the shared simulator. */
var ClassicBattle = (() => {
 const clamp=n=>Math.max(0,Math.min(100,Number(n)||0));
 function experience(mon){return !mon?.nextXp?(mon?.level>=100?100:0):clamp(100*(mon.xp-mon.levelXp)/(mon.nextXp-mon.levelXp));}
 function family(name,type,category){
  const id=String(name).toLowerCase().replace(/[^a-z]/g,'');
  if(/growl|tailwhip|leer|harden|defensecurl|withdraw|swordsdance|agility|focusenergy/.test(id))return 'status';
  if(/recover|rest|softboiled|synthesis|moonlight|morningsun/.test(id))return 'heal';
  if(/bite|crunch/.test(id))return 'bite';
  if(/scratch|slash|cut|claw|fury/.test(id))return 'scratch';
  if(category==='Status'||category==='status')return ['Psychic','Ghost'].includes(type)?'psychic':'status';
  return ({Water:'water',Fire:'fire',Grass:'grass',Electric:'electric',Psychic:'psychic',Ghost:'ghost',Ice:'ice',Ground:'ground',Rock:'rock',Flying:'wind',Bug:'bug',Poison:'poison',Dragon:'dragon',Fighting:'fighting',Steel:'steel',Dark:'dark'})[type]||(/scratch|slash|cut|claw|fury/.test(id)?'scratch':'normal');
 }
 return {experience,family};
})();
if(typeof module==='object'&&module.exports)module.exports=ClassicBattle;
if(typeof Coop!=='undefined')(()=>{
 const gender=p=>p.gender==='F'?'<em class="female">♀</em>':p.gender==='M'?'<em class="male">♂</em>':'';
 const status=p=>p.fainted?'DEB':({psn:'ENV',tox:'ENV',brn:'QUE',par:'PAR',slp:'DOR',frz:'CON'})[p.status]||'';
 Coop.battleMenu='root';
 Coop.renderBattle=function(b,force=false){
  if(!this.active||this.dismissed===b.id)return;
  let el=$('coopBattle');
  if(!el){el=document.createElement('div');el.id='coopBattle';$('screen').append(el);document.body.classList.add('online-battle');}
  const stamp=b.id+':'+b.revision;
  if(!force&&el.dataset.stamp===stamp)return;
  el.dataset.stamp=stamp;
  const you=b.you,ours=s=>you?['p1','p3'].includes(you.side)===['p1','p3'].includes(s.id):['p1','p3'].includes(s.id);
  const key=b.id+':'+b.turn+':'+!!you?.forceSwitch;
  if(this.commandTurn!==key){this.commandTurn=key;this.battleMenu=you?.forceSwitch?'party':'root';}
  const own=you?.team.find(p=>p.active),multi=b.sides.length>2;
  const map=typeof Game!=='undefined'?Game.map:{};
  const terrain=map?.kind==='cave'?'cave':map?.kind==='sea'?'water':map?.inside?'hall':map?.kind==='forest'?'forest':'meadow';
  el.className='coop-battle classic-battle '+(multi?'doubles':'singles');
  el.dataset.terrain=terrain;
  const count={ally:0,enemy:0};
  const fighters=b.sides.slice().sort((a,c)=>Number(ours(a))-Number(ours(c))).map(s=>s.active.map(p=>{
   const ally=ours(s),side=ally?'ally':'enemy',slot=count[side]++,active=you?.side===s.id?you.team.find(m=>m.active):null;
   const mine=active?{...this.state.trainer?.party.find(m=>m.uid===active.uid),...active}:null;
   const mon=mine?{...p,...mine}:p,progress=mine?ClassicBattle.experience(mine):0;
   const sprites=typeof BATTLE_SPRITES!=='undefined'?BATTLE_SPRITES:ASSETS;
   const pic=(ally?sprites.back:sprites.front)[p.id]||ASSETS.front[p.id];
   const bounds=sprites.bounds?.[ally?'back':'front']?.[p.id];
   const pad=bounds?(96-bounds[3])/96*100:0;
   const scale=bounds?96/Math.max(1,bounds[3]-bounds[1]):1;
   const hp=mine?Math.ceil(mine.hp/mine.maxHp*100):p.hp;
   return `<div data-side="${s.id}" class="coop-fighter ${side} slot-${slot} ${p.fainted?'fainted':''}">
    <div class="battle-platform"></div><img class="battle-sprite" style="--sprite-pad:${pad}%;--sprite-scale:${scale}" src="${pic}" alt="${esc(p.name)} ${ally?'de espaldas':'rival'}">
    <section class="coop-fighter-card" aria-label="${esc(p.name)}: ${mine?mine.hp+' de '+mine.maxHp:hp+'%'} PS">
     <div class="classic-name"><b>${esc(p.name)}${gender(mon)}</b><span>Nv. ${mon.level||p.level}</span></div>
     <div class="battle-health"><strong>${status(p)||'PS'}</strong><div class="hpbar"><i style="width:${hp}%;--health:${hp<25?'#ed6564':hp<50?'#efc958':'#5fd7a0'}"></i></div></div>
     ${mine?`<div class="battle-hp-number">${mine.hp} / ${mine.maxHp}</div><div class="battle-exp" role="progressbar" aria-label="Experiencia de ${esc(p.name)}" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100"><small>EXP</small><div><i style="width:${progress}%"></i></div></div>`:''}
     ${multi?`<small class="battle-trainer">${esc(s.trainer)}</small>`:''}
    </section></div>`;
  }).join('')).join('');
  const gains=b.ended?(you?.team||[]).filter(p=>p.xpEarned).map(p=>`${p.name} +${p.xpEarned} EXP`).join(' · '):'';
  const result=b.result==='victory'?(new Set(b.sides.filter(s=>s.owner).map(s=>s.owner)).size>1?'¡Victoria en equipo!':'¡Has ganado el combate!'):b.result==='captured'?'¡Pokémon capturado!':b.result==='escaped'?'¡Escapaste sin problemas!':b.result==='defeat'?'Tu equipo necesita descansar.':b.result==='draw'?'El combate termina en empate':b.result==='pvp'?`Gana ${this.state.members.find(m=>m.id===b.winner)?.name||'tu rival'}`:'';
  const logs=(b.log||[]).map(l=>this.logText(l)).filter(Boolean).slice(-1);
  let message=b.ended?result:you?.forceSwitch?'Elige otro Pokémon para continuar.':you?.ready||you?.wait?(logs.at(-1)||'Esperando el siguiente turno…'):`¿Qué hará ${own?.name||'tu Pokémon'}?`;
  const menu=this.battleMenu;
  let commands='';
  if(b.ended)commands=`<button class="battle-continue" id="coopBattleDone">${b.result==='defeat'?'Continuar la aventura':'Volver al mapa'} <span>▶</span></button>${gains?`<small class="battle-reward">${esc(gains)}</small>`:''}`;
  else if(!you)commands='<p>Observando el combate.</p><button id="coopBattleDone">Volver al mapa</button>';
  else if(you.ready||you.wait)commands='<p class="coop-wait">Esperando la decisión del otro entrenador…</p>';
  else if(menu==='moves'&&!you.forceSwitch)commands=`<div class="battle-move-grid">${you.moves.map((m,i)=>`<button data-online-choice data-move="${i}" ${m.disabled||m.pp===0?'disabled':''} style="--move-color:${typeof TYPE_COLORS!=='undefined'?TYPE_COLORS[(m.type||'normal').toLowerCase()]||'#829273':'#829273'}"><b>${esc(this.moveName(m.move))}</b><small>${esc(TYPE_NAMES[(m.type||'').toLowerCase()]||m.type||'')} · ${{Physical:'Físico',Special:'Especial',Status:'Estado'}[m.category]||''} <span>${m.pp===undefined?'Preparado':m.pp+'/'+m.maxpp+' PP'}</span></small></button>`).join('')}</div><button class="battle-back" data-battle-menu="root">‹ Volver</button>`;
  else if(menu==='party'||you.forceSwitch)commands=`<div class="battle-party-grid">${you.team.map((p,i)=>`<button data-online-choice data-switch="${i+1}" ${p.active||p.fainted||you.trapped?'disabled':''}><img src="${ASSETS.front[p.id]}" alt=""><span><b>${esc(p.name)}</b><small>${p.hp}/${p.maxHp} PS</small></span></button>`).join('')}</div>${!you.forceSwitch?'<button class="battle-back" data-battle-menu="root">‹ Volver</button>':''}`;
  else commands='<div class="battle-command-grid"><button class="fight" data-battle-menu="moves"><span>⚔</span> LUCHA</button><button class="bag" id="onlineBattleBag"><span>▣</span> MOCHILA</button><button class="party" data-battle-menu="party"><span>◉</span> POKÉMON</button><button class="run" id="battleRun"><span>➜</span> HUIDA</button></div>';
  el.innerHTML=`<div class="coop-battle-top"><span>${esc(b.title||'Combate Pokémon')}</span><b>Turno ${b.turn} <small id="coopDeadline"></small></b><button id="coopBattleExit" aria-label="Opciones del combate">•••</button></div><div class="coop-arena"><div class="battle-scenery" aria-hidden="true"></div>${fighters}</div><div class="coop-combat-log" role="status"><span>${esc(message)}</span>${b.ended&&b.result==='defeat'?'<small>Tu progreso se conserva.</small>':''}</div><div class="coop-command-area">${commands}</div>`;
  const done=()=>{this.dismissed=b.id;this.battleMenu='root';this.apply(this.state);this.side();};
  if($('coopBattleDone'))$('coopBattleDone').onclick=done;
  $('coopBattleExit').onclick=()=>{if(b.ended||!you)return done();UI.ask('Combate en curso','La partida se guarda automáticamente. Puedes continuar o retirarte del combate.',[{label:'Seguir combatiendo',fn:()=>UI.close(true)},{label:'Registro y reglas',fn:()=>this.battleJournal(b)},{label:b.encounter==='wild'?'Huir':'Rendirme',fn:async()=>{UI.close(true);await this.action('concede');}}]);};
  el.querySelectorAll('[data-battle-menu]').forEach(button=>button.onclick=()=>{this.battleMenu=button.dataset.battleMenu;Audio.effect('menu');this.renderBattle(b,true);});
  if($('onlineBattleBag'))$('onlineBattleBag').onclick=()=>{if(b.temporary)return UI.toast('En duelos y prácticas no se usan objetos.');this.bag(b);};
  if($('battleRun'))$('battleRun').onclick=()=>{if(b.encounter!=='wild'){UI.toast('¡No puedes huir de un combate contra un entrenador!');return;}this.action('flee',{battle:b.id,turn:b.turn,forceSwitch:false});};
  el.querySelectorAll('[data-move]').forEach(button=>button.onclick=()=>{
   const i=+button.dataset.move,m=you.moves[i];
   if(multi&&['normal','any','adjacentFoe'].includes(m.target)){
    const targets=b.sides.filter(s=>!ours(s)).flatMap((s,j)=>s.active.filter(p=>!p.fainted).map(p=>({label:p.name+' · '+s.trainer,loc:j+1})));
    UI.ask('Elige el objetivo',this.moveName(m.move),targets.map(t=>({label:t.label,fn:()=>{UI.close(true);this.sendChoice(b,'move '+(i+1)+' '+t.loc);}})));
   }else this.sendChoice(b,'move '+(i+1));
  });
  el.querySelectorAll('[data-switch]').forEach(button=>button.onclick=()=>this.sendChoice(b,'switch '+button.dataset.switch));
 };
 const translate=Coop.logText;
 Coop.logText=function(line){const p=line.split('|');if(p[1]==='message')return p[2];if(p[1]==='-fail')return '¡Pero falló!';if(p[1]==='-immune')return 'No afecta al rival…';return translate.call(this,line);};
})();
