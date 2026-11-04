(function(){
 const action=Coop.action,apply=Coop.apply;
 Coop.action=async function(name,args={}){
  const npc=name==='quest'?Game.map.npcs.find(n=>n.id===args.npc):null;
  const result=await action.call(this,name,args);
  if(result&&['heal','rest'].includes(npc?.role)){Audio.effect('heal');Audio.cue('heal');}
  if(result&&name==='explore')Audio.effect('item');
  if(result&&name==='decision')Audio.effect('level');
  return result;
 };
 Coop.apply=function(data,initial=false){const map=Game.mapId;const result=apply.call(this,data,initial);if(this.state===data){if(!initial&&map!==Game.mapId)Audio.effect('portal');Audio.update();}return result;};
 UI.credits=function(){UI.open('credits',UI.top('Créditos','KANTO COMPAÑEROS · 2.6.0')+`<p>Aventura fan con campaña adaptada, partidas personales y mundos privados para amigos.</p><p>Pokémon y gráficos originales © Nintendo, GAME FREAK y The Pokémon Company. Datos y sprites: PokéAPI, pret y comunidad de pokeemerald-expansion.</p><p><b>Música chiptune:</b> AVGVSTA / Avgvst, <a href="https://opengameart.org/content/generic-8-bit-jrpg-soundtrack" target="_blank" rel="noopener">Generic 8-bit JRPG Soundtrack</a>, licencia <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC-BY 4.0</a>. Selección y conversión a mono para esta edición; no es la banda sonora oficial de Pokémon.</p><p><b>Efectos:</b> SubspaceAudio / Juhani Junkala, <a href="https://opengameart.org/content/512-sound-effects-8-bit-style" target="_blank" rel="noopener">512 Sound Effects</a>, CC0.</p><p>Motor de combate Gen3: pkmn/sim y Pokémon Showdown, MIT. La geometría y eventos conservan adaptaciones y límites propios.</p><a href="./audio/CREDITS.md" target="_blank" rel="noopener">Atribución musical completa</a>`);};
})();
