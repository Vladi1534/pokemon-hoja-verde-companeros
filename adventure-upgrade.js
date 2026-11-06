/* Personal Pokémon details and pockets; every edit uses the shared game action. */
(()=>{
 const oldMon=Coop.mon,oldUse=HGInterface.use,oldLog=Coop.logText;
 const labels={hp:'PS',atk:'Ataque',def:'Defensa',spa:'At. especial',spd:'Def. especial',spe:'Velocidad'};
 Coop.logText=function(line){const p=line.split('|');return p[1]==='exp'?`${p[4]} ganó ${p[5]} puntos de experiencia.`:oldLog.call(this,line);};
 HGInterface.entries=function(){return Object.entries(Coop.state.trainer.bag).filter(([,n])=>n>0).map(([key,qty])=>{const item=Coop.state.catalog[key]||{};return {...item,key,qty,name:item.name||key,pocket:item.pocket||Immersion.pocket(item),passive:item.keyItem&&!['expShare','map','flute'].includes(key)};});};
 HGInterface.use=async function(item,battle){
  if(item?.key==='expShare')return this.expShare();
  if(item?.key==='flute'){
   if(battle)return UI.toast('La Poké Flauta se usa junto a un Snorlax en el mapa.');
   const npc=Game.map.npcs.find(n=>['snorlax','snorlax16'].includes(n.data?.key)&&Math.abs(Game.player.x-n.x)+Math.abs(Game.player.y-n.y)<=3);
   if(!npc)return UI.toast('Acércate a un Snorlax dormido para tocar la Poké Flauta.');
   return Coop.challenge('coop',npc.id);
  }
  return oldUse.call(this,item,battle);
 };
 HGInterface.expShare=function(){
  if(Game.mode==='coop-battle')return UI.toast('Cambia el portador de Repartir Exp. fuera del combate.');
  const t=Coop.state.trainer;
  UI.open('hg-exp-share',UI.top('Repartir Exp.','ELIGE UN PORTADOR')+`<p>El portador recibe la mitad de la experiencia de cada rival. La otra mitad se divide entre los Pokémon que participaron. Si el portador también participa, recibe ambas partes.</p><div class="hg-party-list">${t.party.filter(m=>!m.eggSteps).map(m=>`<button data-exp-holder="${m.uid}" aria-pressed="${m.uid===t.expShareUid}">${this.monImage(m)}<span><b>${esc(m.name)}</b><small>Nv. ${m.level} · ${m.hp?'Preparado':'Debilitado: no recibe EXP'}</small>${m.uid===t.expShareUid?'<small>● Portador actual</small>':''}</span></button>`).join('')}</div><div class="hg-menu-footer"><button data-exp-holder="">Guardar en la mochila</button><button id="expBack">Volver</button></div>`);
  document.querySelectorAll('[data-exp-holder]').forEach(el=>el.onclick=async()=>{if(await Coop.action('exp_share',{mon:el.dataset.expHolder}))this.team();});$('expBack').onclick=()=>this.team();
 };
 Coop.mon=function(uid){
  oldMon.call(this,uid);const m=this.state.trainer.party.find(m=>m.uid===uid);if(!m||m.eggSteps)return;
  const effect=m.natureEffect||{},advice=PersonalEngine.natureAdvice(m),holder=this.state.trainer.expShareUid===uid;
  const section=document.createElement('section');section.className='nature-guide';
  section.innerHTML=`<div class="nature-heading"><b>Naturaleza ${esc(m.natureName)}</b><span>${holder?'Repartir Exp. equipado':''}</span></div><p>${esc(effect.description||'')}</p><details><summary>Recomendaciones · ${esc(advice.role)}</summary><p class="coop-note">${esc(advice.explanation)}</p><ol class="nature-ranking">${advice.ranked.map(n=>`<li class="${n.id===m.nature?'current':''}"><b>${esc(n.name)}${n.id===m.nature?' · actual':''}</b><span>${n.plus?`<i class="nature-up">↑ ${labels[n.plus]}</i> <i class="nature-down">↓ ${labels[n.minus]}</i>`:'Neutra'}</span></li>`).join('')}</ol></details><small>Tabla de efectos: <a href="${PersonalEngine.natureSource}" target="_blank" rel="noopener">Pokéxperto</a>. El orden orientativo lo calcula este juego.</small>`;
  document.querySelector('.campaign-profile').after(section);
  document.querySelectorAll('.campaign-stats tbody tr').forEach((row,i)=>{const key=Object.keys(labels)[i];if(key===effect.plus||key===effect.minus){const up=key===effect.plus;row.classList.add(up?'nature-up':'nature-down');row.querySelector('td').append(document.createTextNode(up?' ↑ +10%':' ↓ −10%'));}});
  const note=document.createElement('p');note.className='coop-note';note.textContent='Los colores indican el efecto sobre el valor final. La naturaleza no cambia tus IV ni tus EV.';document.querySelector('.campaign-stats')?.after(note);
  const actions=document.querySelector('#campaignBack')?.parentElement;
  const rename=document.createElement('button');rename.textContent='Cambiar mote';rename.onclick=()=>this.rename(uid);actions?.prepend(rename);
  if(this.state.trainer.bag.expShare){const share=document.createElement('button');share.textContent=holder?'Repartir Exp. · equipado':'Equipar Repartir Exp.';share.onclick=async()=>{if(await this.action('exp_share',{mon:holder?'':uid}))this.mon(uid);};actions?.prepend(share);}
 };
 Coop.rename=function(uid){
  const m=this.state.trainer.party.find(m=>m.uid===uid);if(!m)return;
  UI.open('hg-nickname',UI.top('Un nombre para tu compañero',m.speciesName||SPECIES[m.species]?.name||m.name)+`<form id="nicknameForm" class="nickname-form"><img src="${ASSETS.front[m.species]}" alt=""><label for="pokemonNickname">Mote · hasta 10 caracteres</label><input id="pokemonNickname" value="${esc(m.nickname||'')}" maxlength="10" autocomplete="off" placeholder="${esc(m.speciesName||m.name)}"><small>Déjalo vacío para recuperar el nombre de la especie.</small><div class="save-options"><button class="primary" type="submit">Guardar mote</button><button type="button" id="nicknameBack">Cancelar</button></div></form>`);
  $('nicknameForm').onsubmit=async e=>{e.preventDefault();if(await this.action('nickname',{mon:uid,name:$('pokemonNickname').value}))this.mon(uid);};$('nicknameBack').onclick=()=>this.mon(uid);$('pokemonNickname').focus();
 };
 HGInterface.dex=function(selected=null){
  const caught=new Set(Coop.state.trainer.caughtIds||[]);
  UI.open('hg-dex',UI.top('Pokédex de Kanto',caught.size+' ESPECIES CAPTURADAS')+`<label class="dex-search-label" for="dexSearch">Buscar por nombre o número</label><input id="dexSearch" class="hg-search" autocomplete="off" placeholder="Nidoran, Abra, 032…"><div class="hg-dex-layout"><div id="dexList" class="hg-dex-list"></div><section id="dexHabitat" class="hg-dex-habitat" aria-live="polite"></section></div><div class="hg-menu-footer"><small>Hábitats de esta aventura · día y noche</small><button id="dexBack">Menú</button></div>`);
  const show=id=>{const mon=SPECIES[id];if(!mon)return;selected=id;const habitats=[];
   for(const m of Object.values(COOP_WORLD.maps)){
    for(const [field,method]of [['land_mons',m.dungeon?'Cueva':'Hierba'],['water_mons','Surf']]){
     const rows=(m.encounters?.[field]||[]).filter(e=>e.id===id);if(!rows.length)continue;
     habitats.push({map:m,label:method,min:Math.min(...rows.map(r=>r.min)),max:Math.max(...rows.map(r=>r.max)),time:'Día y noche'});
    }
    if(!m.encounters&&m.pool?.includes(id))habitats.push({map:m,label:m.dungeon?'Cueva':m.kind==='sea'?'Surf':'Hierba',min:m.levels[0],max:m.levels[1],time:'Día y noche'});
    if(id===143&&m.npcs.some(n=>['snorlax','snorlax16'].includes(n.data?.key)))habitats.push({map:m,label:'Poké Flauta · encuentro único',min:30,max:30,time:'Día y noche'});
   }
   habitats.sort((a,b)=>(/^route(\d+)$/.exec(a.map.id)?.[1]||999)-(/^route(\d+)$/.exec(b.map.id)?.[1]||999)||a.map.name.localeCompare(b.map.name,'es'));
   $('dexHabitat').innerHTML=`<div class="dex-species-heading"><img src="${ASSETS.front[id]}" alt=""><div><small>#${String(id).padStart(3,'0')} ${caught.has(id)?'● Capturado':''}</small><h3>${esc(mon.name)}</h3><span>${mon.types.map(t=>TYPE_NAMES[t]||t).join(' / ')}</span></div></div><h4>Dónde encontrarlo</h4>${habitats.length?habitats.map(h=>`<article><b>${esc(Coop.placeName(h.map.id))}</b><span>${h.label} · Nv. ${h.min}${h.min!==h.max?'–'+h.max:''}</span><small>☀ / ☾ ${h.time}</small></article>`).join(''):'<p>No tiene encuentros salvajes en las tablas actuales. Consulta evoluciones, regalos, restauración de fósiles o intercambios.</p>'}<p class="coop-note">Las tablas actuales de Verde Hoja no cambian entre el día y la noche. La Pokédex consulta los mismos datos que generan los encuentros.</p>`;
   document.querySelectorAll('[data-dex-id]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.dexId===id)));
  };
  const render=()=>{const q=$('dexSearch').value.trim().toLowerCase(),list=Object.values(SPECIES).filter(s=>s.name.toLowerCase().includes(q)||String(s.id).padStart(3,'0').includes(q));$('dexList').innerHTML=list.map(s=>`<button data-dex-id="${s.id}"><small>${String(s.id).padStart(3,'0')}</small><img src="${ASSETS.front[s.id]}" alt="" loading="lazy"><span>${esc(s.name)}</span><i>${caught.has(s.id)?'●':'○'}</i></button>`).join('')||'<p>No hay coincidencias.</p>';document.querySelectorAll('[data-dex-id]').forEach(b=>b.onclick=()=>show(+b.dataset.dexId));if(list.length)show(list.some(s=>s.id===selected)?selected:list[0].id);};$('dexSearch').oninput=render;$('dexBack').onclick=()=>this.menu();render();
 };
 UI.dex=()=>HGInterface.dex();
 UI.settings=()=>Handheld.settings();
})();
