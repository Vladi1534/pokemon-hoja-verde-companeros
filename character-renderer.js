// Preserve the source sheets. Frames are aligned at the character's feet at draw time.
(()=>{
 const person=Renderer.person;
 Renderer.person=function(c,x,y,dir,look,moving=false,cloneVariant=false){
  const native=typeof NATIVE_NPC_FRAMES!=='undefined'&&NATIVE_NPC_FRAMES[look];
  if(native){
   const pic=ASSET.people[look];if(!pic?.complete||!pic.naturalWidth)return;
   const base=dir==='up'?1:dir==='left'||dir==='right'?2:0;
   let frame=base;if(moving&&native.frames>=9)frame=(base===0?3:base===1?5:7)+Math.floor(Game.time*10)%2;
   frame=Math.min(frame,native.frames-1);
   const scale=1.5,w=native.width*scale,h=native.height*scale;
   this.ellipse(c,x+16,y+28,Math.min(13,w*.4),4,'#1c3d324d');
   c.save();c.translate(Math.round(x+16),Math.round(y+32));if(dir==='right')c.scale(-1,1);
   c.drawImage(pic,frame*native.width,0,native.width,native.height,-w/2,-h+5,w,h);c.restore();return;
  }
  if(look==='meowth'||look?.startsWith('pokemon_')){
   const id=look==='meowth'?52:Number(look.slice(8)),pic=CloneAppearance.follower(ASSET.follow[id],id,cloneVariant);if(!pic?.complete||!pic.naturalWidth)return;
   this.ellipse(c,x+16,y+28,10,4,'#1c3d324d');let frame=dir==='up'?2:dir==='left'||dir==='right'?4:0;const special=pic.width>=256;if(dir==='right'&&special)frame=6;if(moving)frame+=Math.floor(Game.time*10)%2;
   c.save();c.translate(Math.round(x+16),Math.round(y+32));if(dir==='right'&&!special)c.scale(-1,1);
   c.drawImage(pic,frame*32,0,32,32,-20,-35,40,40);c.restore();return;
  }
  const meta=CHARACTER_FRAMES[look];if(!meta)return person.call(this,c,x,y,dir,look,moving);
  const pic=ASSET.people[look];if(!pic?.complete||!pic.naturalWidth)return;
  const base=dir==='up'?1:dir==='left'||dir==='right'?2:0,frame=base+(moving&&Math.floor(Game.time*10)%2?3:0),scale=36/256;
  this.ellipse(c,x+16,y+28,11,4,'#1c3d324d');c.save();c.translate(Math.round(x+16),Math.round(y+32));if(dir==='right')c.scale(-1,1);
  c.drawImage(pic,0,frame*256,256,256,-128*scale,-meta[frame]*scale,36,36);c.restore();
 };
})();
