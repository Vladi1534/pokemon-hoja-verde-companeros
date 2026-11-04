/* SELECT opens the current map immediately; longer journal details stay folded. */
Coop.mapPanel=function(tab='local'){
 if(!this.active||Game.mode==='coop-battle'||Game.mode==='battle')return;
 const j=this.state.journal;
 UI.open('map',UI.top(tab==='local'?Game.map.name:'Kanto','MAPA · SELECT')+`<div class="map-tabs"><button id="mapLocal" class="${tab==='local'?'primary':''}">Zona</button><button id="mapRegion" class="${tab==='region'?'primary':''}">Kanto</button></div><canvas class="console-map" id="mapView" width="${tab==='local'?640:760}" height="${tab==='local'?480:540}"></canvas><div class="map-next"><small>PRÓXIMO OBJETIVO</small><b>${esc(j.current[1])}</b><span>${esc(j.current[4])}</span></div><details class="menu-details"><summary>Diario · ${j.chapters.filter(c=>c.done).length}/${j.chapters.length}</summary>${j.chapters.map(c=>`<div class="compact-chapter"><span>${c.done?'✓':'○'}</span><span>${esc(c.title)}</span></div>`).join('')}<p class="coop-note">Objetos clave: ${j.keys.map(k=>({cut:'Corte',surf_lesson:'Surf',strength:'Fuerza',scope:'Scope Silph',flute:'Poké Flauta',tea:'Té',card_key:'Tarjeta Llave',secret_key:'Llave Secreta',national:'Pokédex Nacional',rainbow:'Pase Arcoíris'}[k]||k)).join(' · ')||'Ninguno todavía'}</p></details>`);
 $('mapLocal').onclick=()=>this.mapPanel('local');$('mapRegion').onclick=()=>this.mapPanel('region');
 if(tab==='local'){UI.drawLocal($('mapView'),true);return;}
 const c=$('mapView').getContext('2d'),maps=Object.values(COOP_WORLD.maps).filter(m=>m.atlas);c.fillStyle='#153c35';c.fillRect(0,0,760,540);c.lineWidth=3;
 for(const m of maps)for(const p of m.portals){const d=COOP_WORLD.maps[p.to];if(!d?.atlas)continue;c.strokeStyle=this.can(p.gate)?'#72957c':'#4c655c';c.beginPath();c.moveTo(...m.atlas);c.lineTo(...d.atlas);c.stroke();}
 for(const m of maps){const town=!m.natural;c.fillStyle=town?'#ebcb80':'#88b68c';c.beginPath();c.arc(...m.atlas,town?6:3,0,Math.PI*2);c.fill();if(town){c.fillStyle='#f5efd9';c.font='11px sans-serif';c.fillText(m.name,m.atlas[0]+9,m.atlas[1]+4);}}
 const target=COOP_WORLD.maps[j.current[2]],goal=target?.atlas?target:COOP_WORLD.maps[target?.parent];if(goal?.atlas){c.fillStyle='#fff1a0';c.font='24px sans-serif';c.fillText('★',goal.atlas[0]-11,goal.atlas[1]-12);}
 const here=Game.map.atlas?Game.map:COOP_WORLD.maps[Game.map.parent];if(here?.atlas){c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.arc(...here.atlas,10,0,Math.PI*2);c.stroke();}
};
Coop.journal=function(){return this.mapPanel();};
UI.map=function(){return Coop.active?Coop.mapPanel():null;};
