(function(){
 const action=Coop.action,apply=Coop.apply;
 Coop.action=async function(name,args={}){
  const npc=name==='quest'?Game.map.npcs.find(n=>n.id===args.npc):null;
  const result=await action.call(this,name,args);
  if(result&&['heal','rest'].includes(npc?.role)){Audio.cue('heal');}
  if(result&&name==='explore')Audio.effect('item');
  if(result&&name==='decision')Audio.effect('level');
  return result;
 };
 Coop.apply=function(data,initial=false){const map=Game.mapId;const result=apply.call(this,data,initial);if(this.state===data){if(!initial&&map!==Game.mapId)Audio.effect('portal');Audio.update();}return result;};
 UI.credits=function(){UI.open('credits',UI.top('Créditos','KANTO COMPAÑEROS · 3.0.0')+`<p>Aventura fan con campaña adaptada, partidas personales y mundos privados para amigos.</p><p>Pokémon y gráficos originales © Nintendo, GAME FREAK y The Pokémon Company. Datos y sprites: PokéAPI, pret y comunidad de pokeemerald-expansion.</p><p><b>Música y efectos originales de Pokémon HeartGold:</b> secuencias, bancos e instrumentos convertidos del archivo aportado para este proyecto, con los bucles originales y niveles de volumen ajustados. © Nintendo, GAME FREAK y The Pokémon Company. No se distribuye la ROM.</p><p>Iconos de mochila, modelos de edificios y museo procedentes de HeartGold. La interfaz y la adaptación de Kanto son propias de este proyecto.</p><p>Motor de combate con reglas HeartGold (cuarta generación): pkmn/sim y Pokémon Showdown, MIT. Robustez incorpora la resistencia moderna a 1 PS desde vida completa. 159 especies, 467 movimientos y 76 habilidades disponibles. La historia conserva la adaptación de Verde Hoja; la conversión visual del mundo sigue en curso.</p><a href="./audio/CREDITS.md" target="_blank" rel="noopener">Atribución musical completa</a>`);};
})();
