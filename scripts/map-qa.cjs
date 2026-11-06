/* Local-only QA surface: exercises the actual game renderer and movement engine. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=process.argv[2];
if(!dest)throw Error('Pass the absolute preview public directory.');
const base=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const ui=`<script>
Personal.storage='KANTO_MAP_QA_V31';
const qa=document.createElement('div');qa.style='position:fixed;bottom:8px;left:8px;z-index:99999;background:#132b40;padding:8px;color:white;max-width:94vw;display:flex;gap:6px;flex-wrap:wrap';
qa.innerHTML='<label>Mapa <input id="qaMap" list="qaMaps"><datalist id="qaMaps">'+Object.values(COOP_WORLD.maps).filter(m=>!m.aliasOf).map(m=>'<option value="'+m.id+'">'+m.id+' · '+m.name+'</option>').join('')+'</datalist></label><label>X <input id="qaX" type="number" value="36" style="width:55px"></label><label>Y <input id="qaY" type="number" value="20" style="width:55px"></label><button id="qaLoad">Cargar zona</button><label><input type="checkbox" id="qaCollision"> Colisiones</label><output id="qaPosition"></output>';
document.body.append(qa);document.getElementById('qaMap').value='viridian';
document.getElementById('qaLoad').onclick=()=>{const profile=PersonalEngine.newPersonal('Auditoría',7,'red'),m=COOP_WORLD.maps[document.getElementById('qaMap').value];Object.assign(profile.trainer.position,{map:m.id,x:+document.getElementById('qaX').value,y:+document.getElementById('qaY').value});profile.worldRevision=COOP_WORLD.revision;profile.trainer.progress={parcel:true,delivery:true,badge1:true,badge2:true,cut:true,...Object.fromEntries(Object.values(COOP_WORLD.maps).flatMap(m=>m.npcs.filter(n=>n.role==='trainer').map(n=>[n.id,true])))};profile.trainer.repel=999;profile.trainer.travelGrace=3;Personal.resume({format:'kanto-player',version:1,key:'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',portable:profile});};
const renderQA=Renderer.world;Renderer.world=function(){renderQA.call(this);if(Game.map?.native&&document.getElementById('qaCollision').checked){const zoom=Handheld.mobile?1.7:1.25;ctx.save();ctx.scale(zoom,zoom);for(let y=0;y<Game.map.h;y++)for(let x=0;x<Game.map.w;x++){const t=PersonalEngine.nativeTiles(Game.map.id,{progress:Game.flags})[x+','+y]?.grid??Game.map.grid[y][x];if([2,7,10].includes(t)){ctx.fillStyle='#ff204755';ctx.fillRect(x*T-this.camera.x,y*T-this.camera.y,T,T);}}ctx.restore();}document.getElementById('qaPosition').textContent=Game.mapId+' '+Game.player.x+','+Game.player.y;};
</script>`;
fs.writeFileSync(path.join(dest,'qa-map.html'),base.replace('</body>',ui+'</body>'));
console.log('Local map QA created. Remove qa-map.html before packaging.');
