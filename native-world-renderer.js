/* FRLG map layers and HG artwork share one authoritative 16-unit tile grid. */
(()=>{
 const prior=Renderer.world,images=new Map();
 const image=path=>{if(!images.has(path)){const im=new Image();im.src='./'+path;images.set(path,im);}const im=images.get(path);return im.complete&&im.naturalWidth?im:null;};
 function texture(c,key,x,y,px,py){const atlas=image('environment/environment-atlas.png'),r=HG_ENV.textures[key];if(!atlas||!r)return false;const sx=r[0]+((x*16)%r[2]+r[2])%r[2],sy=r[1]+((y*16)%r[3]+r[3])%r[3];c.drawImage(atlas,sx,sy,16,16,px,py,T,T);return true;}
 function model(c,key,x,y,width){const meta=HG_LANDMARKS[key],f=meta&&HGModels.preview(meta);if(!f)return false;const natural=T/16/(f.nativePixelsPerUnit||meta.preview?.scale||8),scale=width?Math.min(natural,width/f.image.width):natural;c.drawImage(f.image,Math.round(x-f.anchorX*scale),Math.round(y-f.anchorY*scale),Math.round(f.image.width*scale),Math.round(f.image.height*scale));return true;}
 Renderer.world=function(){
  const m=Game.map;if(!m.native)return prior.call(this);
  const zoom=typeof Handheld!=='undefined'&&Handheld.mobile?1.7:1.25,VW=canvas.width/zoom,VH=canvas.height/zoom,p=Game.player;
  const maxX=m.w*T-VW,maxY=m.h*T-VH,ox=Math.round(maxX<0?maxX/2:Math.max(0,Math.min(maxX,p.px*T+T/2-VW/2))),oy=Math.round(maxY<0?maxY/2:Math.max(0,Math.min(maxY,p.py*T+T/2-VH/2)));
  this.camera={x:ox,y:oy};ctx.save();ctx.scale(zoom,zoom);ctx.imageSmoothingEnabled=false;ctx.fillStyle=m.dungeon?'#171b25':m.inside?'#20354b':'#457b56';ctx.fillRect(0,0,VW,VH);
  const under=image('native-maps/'+m.native.tileset+'.under.png'),over=image('native-maps/'+m.native.tileset+'.over.png');
  if(!under||!over){ctx.fillStyle='#f4f1d7';ctx.font='14px sans-serif';ctx.fillText('Preparando '+m.name+'…',24,VH/2);ctx.restore();return;}
  const x0=Math.max(0,Math.floor(ox/T)-4),x1=Math.min(m.w,Math.ceil((ox+VW)/T)+4),y0=Math.max(0,Math.floor(oy/T)-6),y1=Math.min(m.h,Math.ceil((oy+VH)/T)+5),upper=[],actors=[];
  const changes=PersonalEngine.nativeTiles(m.id,{progress:Game.flags,league:Coop.state?.journal?.leagueRound||0});
  const forest=m.kind==='forest'||/Forest/.test(m.native.name),cave=m.dungeon,region=HG_ENV.regions[cave?'cave':forest?'forest':'kanto'];
  const facades=m.buildings.filter(b=>b.nativeFacade).map(b=>{const key=b.kind==='shop'&&b.id!=='celadon_shop'?'poke-mart-compact':HGLayout.key(b,m.id);return {b,key,frame:key&&HG_LANDMARKS[key]&&HGModels.preview(HG_LANDMARKS[key])};}).filter(a=>a.frame);
  const covered=(x,y)=>facades.some(({b})=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<=b.door.y);
  // Retain complete native canopy/trunk pairs: forest edge pieces do not all
  // have a standalone tree anchor. Erasing those pieces creates invisible woods.
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const tile=changes[x+','+y]?.tile??m.native.blocks[y][x],px=x*T-ox,py=y*T-oy,sem=m.native.semantic[y][x],behavior=m.native.behavior[y][x],hide=covered(x,y);
   ctx.drawImage(under,tile%32*16,Math.floor(tile/32)*16,16,16,px,py,T,T);
   let replaceOver=false;
   if(changes[x+','+y]){upper.push(()=>ctx.drawImage(over,tile%32*16,Math.floor(tile/32)*16,16,16,px,py,T,T));continue;}
   if(hide){texture(ctx,region.floor,x,y,px,py);replaceOver=true;}
   else if(sem===1){texture(ctx,region.floor,x,y,px,py);texture(ctx,region.tall_grass||HG_ENV.regions.kanto.tall_grass,x,y,px,py);replaceOver=true;}
   else if(cave&&sem===0){texture(ctx,region.floor,x,y,px,py);replaceOver=true;}
   else if(cave&&sem===5&&behavior>=0x62&&behavior<=0x65){texture(ctx,region.floor,x,y,px,py);ctx.save();ctx.translate(px+T/2,py+T/2);ctx.rotate(({98:-Math.PI/2,99:Math.PI/2,100:Math.PI,101:0})[behavior]);ctx.strokeStyle='#d8d5ad';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-T*.18,-T*.05);ctx.lineTo(0,T*.15);ctx.lineTo(T*.18,-T*.05);ctx.stroke();ctx.restore();replaceOver=true;}
   else if(forest&&sem===0&&behavior===0){texture(ctx,region.floor,x,y,px,py);}
   else if(!m.inside&&[0,1,8,9,13,16,17].includes(tile)||!m.inside&&m.id==='pallet'&&tile===662){texture(ctx,region.floor,x,y,px,py);}
   else if(sem===2&&behavior!==0x11){texture(ctx,region.water||HG_ENV.regions.kanto.water,x,y,px,py);}
   if(cave&&sem===3){const below=m.native.semantic[y+1]?.[x],above=m.native.semantic[y-1]?.[x],left=m.native.semantic[y]?.[x-1],right=m.native.semantic[y]?.[x+1];const open=t=>[0,2,5].includes(t),edge=[below,above,left,right].some(open);texture(ctx,region.cliffTop,x,y,px,py);if(edge){const face=open(below)?'north':open(above)?'south':open(right)?'west':'east';texture(ctx,region.wallTexture[face],x,y,px,py);}replaceOver=true;}
   if(!replaceOver)upper.push(()=>ctx.drawImage(over,tile%32*16,Math.floor(tile/32)*16,16,16,px,py,T,T));
  }
  for(const {b,frame}of facades)actors.push({y:(b.door.y+1)*T,draw:()=>{ctx.fillStyle='#24384a';ctx.fillRect(b.door.x*T-ox,(b.door.y+.15)*T-oy,T,.85*T);NativeFacade.draw(ctx,b,frame,ox,oy,T);}});
  for(const n of m.npcs){if(n.hideWhen&&Game.flags[n.hideWhen])continue;if(n.staticObject&&n.look!=='pc')continue;actors.push({y:n.y*T+31,draw:()=>{
   if(n.staticObject)return;const f=Math.max(0,Math.min(1,1-((n.walkUntil||0)-Game.time)/.3)),nx=(n.fromX??n.x)+(n.x-(n.fromX??n.x))*f,ny=(n.fromY??n.y)+(n.y-(n.fromY??n.y))*f;
   if(this.storyObject(ctx,n,ox,oy))return;this.person(ctx,nx*T-ox,ny*T-oy,n.dir,n.look,(n.walkUntil||0)>Game.time,n.cloneVariant);
  }});}
  for(const b of m.blockers)if(!Game.flags[b.id])actors.push({y:b.y*T+29,draw:()=>{if(model(ctx,b.kind==='cutTree'?'kanto-tree':'cave-stalagmite',(b.x+.5)*T-ox,(b.y+1)*T-oy,b.kind==='cutTree'?1.3*T:T))return;const x=b.x*T-ox,y=b.y*T-oy;this.ellipse(ctx,x+T/2,y+T*.8,T*.4,T*.2,'#314530');if(b.kind==='cutTree'){this.box(ctx,x+T*.43,y+T*.48,T*.15,T*.45,'#88613d');this.ellipse(ctx,x+T/2,y+T*.3,T*.43,T*.5,'#44894e');this.ellipse(ctx,x+T*.42,y+T*.18,T*.28,T*.3,'#8abc55');}else this.ellipse(ctx,x+T/2,y+T*.5,T*.4,T*.4,'#8d8577');}});
  for(const i of m.items)if(!i.hidden&&!Game.flags[i.id])actors.push({y:i.y*T+25,draw:()=>this.item(ctx,i.x*T-ox,i.y*T-oy)});
  if(Game.lead)actors.push({y:Game.follower.py*T+30,draw:()=>this.follow(ctx,Game.follower.px*T-ox,Game.follower.py*T-oy,Game.follower.dir,!!Game.anim)});
  actors.push({y:p.py*T+31,draw:()=>this.person(ctx,p.px*T-ox,p.py*T-oy,p.dir,Game.settings.avatar+(Coop.state?.trainer.cycling?'_bike':''),!!Game.anim)});
  Coop.drawActors(actors,ctx,ox,oy);actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());upper.forEach(draw=>draw());
  ctx.restore();if(this.frames%15===0){this.hint();const mini=$('minimap');if(mini){mini.hidden=UI.opened;if(!mini.hidden)UI.drawLocal(mini);}}
 };
 const talk=Game.talk;
 Game.talk=function(n){if(n.data?.key==='native_travel'){Coop.action('quest',{npc:n.id}).then(r=>{if(r?.dialog?.travel)UI.ask(n.name,r.dialog.text,r.dialog.travel.map(d=>({label:d.label,fn:async()=>{UI.close(true);await Coop.action('quest',{npc:n.id,destination:d.map});}})));});return;}return talk.call(this,n);};
 const interact=Game.interact;
 Game.interact=function(){if(this.map.native&&this.mode==='world'&&!this.busy&&!UI.opened){const p=this.player,[dx,dy]=DIR[p.dir],x=p.x+dx,y=p.y+dy;
  const n=this.map.npcs.find(n=>!(n.hideWhen&&this.flags[n.hideWhen])&&(n.x===x&&n.y===y||this.map.native.behavior[y]?.[x]===0x80&&n.x===x+dx&&n.y===y+dy));
  if(n){this.talk(n);return;}
  const underfoot=this.map.npcs.find(n=>n.staticObject&&n.x===p.x&&n.y===p.y&&!(n.hideWhen&&this.flags[n.hideWhen]));if(underfoot){this.talk(underfoot);return;}
  if(this.map.npcs.some(n=>n.x===x&&n.y===y&&n.hideWhen&&this.flags[n.hideWhen]))return;
 }return interact.call(this);};
})();
