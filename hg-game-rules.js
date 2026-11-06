/* HG metadata and readable outcomes; all outcomes still come from the simulator. */
var BattleClarity=(()=>{
 const who=s=>String(s||'El Pokémon').replace(/^p[1-4][ab]: /,'');
 function message(line,abilityName,moveName){
  const p=line.split('|'),kind=p[1],name=who(p[2]),source=p.find(v=>v.startsWith('[from] ability: '));
  if(source){const ability=abilityName(source.slice(16));
   if(kind==='-immune')return name+(['Vital Spirit','Insomnia'].includes(source.slice(16))?' no puede dormirse gracias a ':' está protegido por ')+ability+'.';
   if(kind==='-fail')return name+' impide el efecto con '+ability+'.';
  }
  if(kind==='-immune')return name+' es inmune a ese efecto.';
  if(kind==='-miss')return 'El movimiento no acertó a '+who(p[3]||p[2])+'.';
  if(kind==='-fail')return ({slp:name+' ya está dormido.',psn:name+' ya tiene un problema de estado.',tox:name+' ya tiene un problema de estado.',par:name+' ya tiene un problema de estado.',brn:name+' ya tiene un problema de estado.',unboost:'No puede bajar más esa característica.',boost:'No puede subir más esa característica.'})[p[3]]||'El movimiento no produjo efecto esta vez.';
  if(kind==='cant')return ({slp:name+' está dormido.',frz:name+' está congelado.',par:name+' está paralizado y no puede moverse.',flinch:name+' retrocedió y no pudo actuar.',recharge:name+' necesita recargar energía.'})[p[3]]||name+' no puede usar '+moveName(p[4]||'ese movimiento')+'.';
  if(kind==='-curestatus')return name+' se recuperó de '+({slp:'su sueño',psn:'su envenenamiento',tox:'su envenenamiento',brn:'su quemadura',frz:'la congelación',par:'la parálisis'}[p[3]]||'su problema de estado')+'.';
  if(kind==='-activate'&&p[3]?.includes('Substitute'))return 'El Sustituto de '+name+' recibió el efecto.';
  return null;
 }
 return {message};
})();
if(typeof module==='object'&&module.exports)module.exports=BattleClarity;
if(typeof Coop!=='undefined')(()=>{
 Object.assign(KANTO_RULES.abilities,HG_RULES.abilities);
 for(const m of Object.values(HG_RULES.moves)){
  const key=KANTO_RULES.moves[m.id]?.key||m.slug.replaceAll('-','_');
  MOVES[key]={...MOVES[key],...m,id:key,numericId:m.id,flags:MOVES[key]?.flags||[],modernTags:MOVES[key]?.modernTags||[]};
 }
 const prior=Coop.logText,abilityName=name=>Object.values(HG_RULES.abilities).find(a=>a.slug.replaceAll('-','')===String(name).toLowerCase().replace(/[^a-z]/g,''))?.name||name;
 Coop.logText=function(line){return BattleClarity.message(line,abilityName,s=>this.moveName(s))??prior.call(this,line);};
 Coop.battleJournal=function(b){
  const events=b.you?.events||b.events||[],lines=events.map(e=>this.logText(e.line)).filter(Boolean).slice(-16);
  UI.open('battle-journal',UI.top('Registro del combate','TURNO '+b.turn)+`<ol class="hg-battle-journal">${lines.map(l=>'<li>'+esc(l)+'</li>').join('')}</ol><details class="menu-details"><summary>Reglas de esta aventura</summary><p>${b.rulesGeneration===3?'Este combate guardado conserva las reglas de la versión anterior. Los siguientes usarán HeartGold.':'Combates basados en HeartGold: cada movimiento tiene su categoría física, especial o de estado.'}</p><p>Espíritu Vital e Insomnio impiden dormir. En estas reglas, ser de tipo Planta no da inmunidad a Somnífero. El tipo Veneno sí impide el envenenamiento.</p><p>Robustez incluye la mejora de esta edición: desde todos los PS, resiste un golpe fulminante con 1 PS.</p></details><button id="battleJournalBack" class="primary">Volver al combate</button>`);
  $('battleJournalBack').onclick=()=>UI.close(true);
 };
})();
