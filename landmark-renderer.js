/* Align real model entrances with the existing authoritative tile grid. */
(()=>{
 const building=Renderer.building,prop=Renderer.prop,world=Renderer.world,story=Renderer.storyObject;

 const meta=key=>typeof HG_LANDMARKS!=='undefined'?HG_LANDMARKS[key]||{}:{};
 function draw(c,key,x,y,width,space=null){
  const frame=typeof HGModels!=='undefined'?HGModels.frame(key,meta(key)):null;if(!frame)return false;
  const scale=Math.min(width/frame.image.width,...(space?[space.left/Math.max(1,frame.anchorX),space.right/Math.max(1,frame.image.width-frame.anchorX)]:[]));
  c.drawImage(frame.image,Math.round(x-frame.anchorX*scale),Math.round(y-frame.anchorY*scale),Math.round(frame.image.width*scale),Math.round(frame.image.height*scale));return true;
 }
 Renderer.building=function(c,b,ox,oy){
  const key=b.hgModel||HGLayout.key(b,Game.mapId),frame=key&&typeof HGModels!=='undefined'?HGModels.frame(key,meta(key)):null;
  if(!frame)return building.call(this,c,b,ox,oy);
  const r=HGLayout.placement(b,frame,T);c.drawImage(frame.image,Math.round(r.x-ox),Math.round(r.y-oy),Math.round(r.w),Math.round(r.h));
 };

 const propModels={museumCase:'museum-display-case',museumBookcase:'museum-bookcase',museumTable:'museum-table'};
 Renderer.prop=function(c,x,y,kind){const key=propModels[kind];if(key&&draw(c,key,x+T,y+T,kind==='museumTable'?3*T:2*T))return;return prop.call(this,c,x,y,kind);};
 Renderer.storyObject=function(c,n,ox,oy){if(n.look==='museum-plaque'){this.box(c,n.x*T-ox+8,n.y*T-oy+15,16,8,'#355564');this.box(c,n.x*T-ox+10,n.y*T-oy+17,12,2,'#e5ddbc');return true;}return story.call(this,c,n,ox,oy);};
 const actorCanvases=new Map();
 function actor(id,x,y,draw,name=''){let image=actorCanvases.get(id);if(!image){image=document.createElement('canvas');image.width=name?128:64;image.height=64;actorCanvases.set(id,image);}const c=image.getContext('2d');c.clearRect(0,0,image.width,64);c.imageSmoothingEnabled=false;c.save();c.translate((image.width-64)/2,0);draw(c);c.restore();if(name){c.font='bold 9px sans-serif';c.textAlign='center';c.fillStyle='#173d45';const w=Math.min(124,c.measureText(name).width+8);c.fillRect((image.width-w)/2,0,w,13);c.fillStyle='#fff5c9';c.fillText(name,image.width/2,10,120);}return {id,x,y,image};}
 Renderer.world=function(){
  const m=Game.map;if(!m.hgRoom||typeof HGModels==='undefined')return world.call(this);
  const placements=[],p=Game.player;
  for(const n of m.npcs)if(n.look!=='museum-plaque')placements.push(actor(n.id,n.x,n.y,c=>this.person(c,16,32,n.dir,n.look,false)));
  if(Game.lead)placements.push(actor('follower',Game.follower.px,Game.follower.py,c=>this.follow(c,16,32,Game.follower.dir,!!Game.anim)));
  placements.push(actor('player',p.px,p.py,c=>this.person(c,16,32,p.dir,Game.settings.avatar,!!Game.anim)));
  if(Coop.active)for(const member of Coop.state.members){if(member.id===Coop.state.me||member.position.map!==m.id||Coop.state.serverTime-member.position.seen>20000)continue;const remote=Coop.remotes[member.id];if(!remote)continue;const q=RemoteMotion.sample(remote,performance.now());placements.push(actor(member.id,q.x,q.y,c=>this.person(c,16,32,q.dir,member.avatar,q.moving),member.name));placements.push(actor(member.id+'-follow',q.fx,q.fy,c=>{const pic=ASSET.follow[member.leader||member.starter];if(!pic?.complete)return;let frame=q.fdir==='up'?2:['left','right'].includes(q.fdir)?4:0;const special=pic.width>=256;if(q.fdir==='right'&&special)frame=6;if(q.moving)frame+=Math.floor(Game.time*10)%2;c.save();c.translate(32,63);if(q.fdir==='right'&&!special)c.scale(-1,1);c.drawImage(pic,frame*32,0,32,32,-22,-39,44,44);c.restore();}));}
  const scene=HGModels.room(m.hgRoom.model,placements,{width:canvas.width,height:canvas.height,player:{x:p.px,y:p.py},origin:m.hgRoom.origin,zoom:Handheld.mobile?2.4:1.35,meta:meta(m.hgRoom.model)});
  if(!scene)return world.call(this);ctx.drawImage(scene,0,0);this.hint();const mini=$('minimap');if(mini){mini.hidden=UI.opened;if(!mini.hidden&&this.frames%15===0)UI.drawLocal(mini);}
 };
})();
