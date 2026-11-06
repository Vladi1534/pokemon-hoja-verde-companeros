/* Visual attention never changes authoritative NPC positions or trainer sight. */
var Immersion = (() => {
 const direction=(npc,player)=>Math.abs(player.x-npc.x)>Math.abs(player.y-npc.y)?(player.x>npc.x?'right':'left'):(player.y>npc.y?'down':'up');
 const pocket=item=>item.rate?'balls':item.heal||item.revive||item.status?'medicine':'items';
 const canUse=(item,mon)=>!mon.eggSteps&&(item.revive?mon.hp===0:item.heal?mon.hp>0&&mon.hp<mon.maxHp:item.status?item.status.includes(mon.status):!!item.sourceItemId);
 return {direction,pocket,canUse,focus:null};
})();
if(typeof module==='object'&&module.exports)module.exports=Immersion;
if(typeof Game!=='undefined')(()=>{
 const talk=Game.talk,update=Story.update,say=Game.say;
 Game.say=function(speaker,lines,after){const focus=Immersion.focus;if(speaker==='TU AVENTURA'&&focus?.map===this.mapId)speaker=focus.npc.name;return say.call(this,speaker,lines,after);};
 Game.talk=function(n){
  const old=Immersion.focus;if(old&&old.npc!==n)old.npc.dir=old.original;
  Immersion.focus={npc:n,map:this.mapId,original:old?.npc===n?old.original:n.dir,until:this.time+.5};
  n.dir=Immersion.direction(n,this.player);n.walkUntil=0;
  return talk.call(this,n);
 };
 Story.update=function(dt){
  update.call(this,dt);
  const f=Immersion.focus;
  if(f){
   if(f.map===Game.mapId&&(Game.mode==='dialog'||UI.opened||Coop.requestBusy||Game.time<f.until)){
    f.npc.dir=Immersion.direction(f.npc,Game.player);f.npc.walkUntil=0;
   }else{f.npc.dir=f.original;f.npc.restUntil=Game.time+2;Immersion.focus=null;}
  }
  if(Game.mode!=='world'||UI.opened)return;
  for(const n of Game.map.npcs){
   if(n===Immersion.focus?.npc||n.restUntil>Game.time||!['talk','gift','guide','coach','rod','surf'].includes(n.role)||n.data?.challenge)continue;
   n.idleDirection??=n.dir;
   const dirs=['down','left','up','right'],base=Math.max(0,dirs.indexOf(n.idleDirection)),phase=Math.floor((Game.time+n.x*.73+n.y*.31)/3.6)%4;
   n.dir=dirs[(base+[0,1,0,3][phase])%4];
  }
 };
 const translate=Coop.logText;
 const abilityName=name=>Object.values(KANTO_RULES.abilities).find(a=>a.slug.replaceAll('-','')===String(name).toLowerCase().replace(/[^a-z]/g,''))?.name||name;
 Coop.logText=function(line){
  const p=line.split('|'),who=(p[2]||'').replace(/^p[1-4][ab]: /,''),source=p.find(v=>v.startsWith('[from] ability: '));
  if(p[1]==='-ability')return p[3]==='Sturdy'?who+' resiste gracias a Robustez.':who+' activa '+abilityName(p[3])+'.';
  if(source){const name=abilityName(source.slice(16));if(p[1]==='-immune')return who+' está protegido por '+name+'.';if(p[1]==='-heal')return who+' recupera PS gracias a '+name+'.';if(p[1]==='-activate')return who+' activa '+name+'.';}
  return translate.call(this,line);
 };
})();
