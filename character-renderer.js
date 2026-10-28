// Preserve the source sheets. Frames are aligned at the character's feet at draw time.
(()=>{
 const person=Renderer.person;
 Renderer.person=function(c,x,y,dir,look,moving=false){
  if(look==='meowth'){
   const pic=ASSET.follow[52];if(!pic?.complete||!pic.naturalWidth)return;
   this.ellipse(c,x+16,y+28,10,4,'#1c3d324d');let frame=dir==='up'?2:dir==='left'||dir==='right'?4:0;
   c.save();c.translate(Math.round(x+16),Math.round(y+32));if(dir==='right')c.scale(-1,1);
   c.drawImage(pic,frame*32,0,32,32,-20,-35,40,40);c.restore();return;
  }
  const meta=CHARACTER_FRAMES[look];if(!meta)return person.call(this,c,x,y,dir,look,moving);
  const pic=ASSET.people[look];if(!pic?.complete||!pic.naturalWidth)return;
  const base=dir==='up'?1:dir==='left'||dir==='right'?2:0,frame=base+(moving&&Math.floor(Game.time*10)%2?3:0),scale=36/256;
  this.ellipse(c,x+16,y+28,11,4,'#1c3d324d');c.save();c.translate(Math.round(x+16),Math.round(y+32));if(dir==='right')c.scale(-1,1);
  c.drawImage(pic,0,frame*256,256,256,-128*scale,-meta[frame]*scale,36,36);c.restore();
 };
})();
