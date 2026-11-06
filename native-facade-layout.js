/* Fit the complete facade to its verified native plot. Door remains the pivot;
 * two horizontal panels allow HG's entrance spacing to match FRLG exactly. */
var NativeFacade=(()=>{
 const crops=new WeakMap();
 function bounds(frame){if(crops.has(frame.image))return crops.get(frame.image);
  const im=frame.image,c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const p=g.getImageData(0,0,c.width,c.height).data;
  let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(p[(y*c.width+x)*4+3]>127){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}
  const b={x:x0,y:y0,w:x1-x0,h:Math.max(y1,frame.anchorY)-y0};crops.set(im,b);return b;
 }
 function panels(b,frame,crop,tile=32){
  const wanted=(b.door.x+.5-b.x)/b.w,ratio=(frame.anchorX-crop.x)/crop.w;
  const mirror=b.kind==='shop'&&Math.abs(1-ratio-wanted)<Math.abs(ratio-wanted),anchor=mirror?crop.w-(frame.anchorX-crop.x):frame.anchorX-crop.x;
  return {mirror,anchor,left:(b.door.x+.5-b.x)*tile,right:(b.x+b.w-b.door.x-.5)*tile,x:b.x*tile,y:b.y*tile,w:b.w*tile,h:b.h*tile};
 }
 function draw(c,b,frame,ox,oy,tile=32){const crop=bounds(frame),p=panels(b,frame,crop,tile);if(crop.w<=0||crop.h<=0||p.anchor<=0||p.anchor>=crop.w)return false;
  c.save();c.translate(p.x-ox,p.y-oy);
  if(p.mirror){c.translate(p.w,0);c.scale(-1,1);const a=crop.w-p.anchor;c.drawImage(frame.image,crop.x,crop.y,a,crop.h,0,0,p.right,p.h);c.drawImage(frame.image,crop.x+a,crop.y,crop.w-a,crop.h,p.right,0,p.left,p.h);}
  else{c.drawImage(frame.image,crop.x,crop.y,p.anchor,crop.h,0,0,p.left,p.h);c.drawImage(frame.image,crop.x+p.anchor,crop.y,crop.w-p.anchor,crop.h,p.left,0,p.right,p.h);}
  c.restore();return true;
 }
 return {draw,panels};
})();
if(typeof module==='object'&&module.exports)module.exports=NativeFacade;
