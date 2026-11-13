/* The visible opening is exactly the warp's width. Stretch only the two side
 * panels, never the doorway. The entrance baseline is the native tile edge. */
var NativeFacade=(()=>{
 const crops=new WeakMap();
 function bounds(frame){if(crops.has(frame.image))return crops.get(frame.image);
  const im=frame.image,c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const p=g.getImageData(0,0,c.width,c.height).data;
  let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(p[(y*c.width+x)*4+3]>127){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}
  const b={x:x0,y:y0,w:x1-x0,h:frame.anchorY-y0};crops.set(im,b);return b;
 }
 function panels(b,frame,crop,tile=32){
  const door=frame.opening||{left:frame.anchorX-10*frame.nativePixelsPerUnit,right:frame.anchorX+10*frame.nativePixelsPerUnit};
  const center=(door.left+door.right)/2,wanted=(b.door.x+.5-b.x)/b.w,ratio=(center-crop.x)/crop.w;
  const mirror=b.kind==='shop'&&Math.abs(1-ratio-wanted)<Math.abs(ratio-wanted);
  const widths=[(b.door.x-b.x)*tile,(b.door.w||1)*tile,(b.x+b.w-b.door.x-(b.door.w||1))*tile];
  const src=[crop.x,door.left,door.right,crop.x+crop.w];
  const dest=mirror?[widths[2],widths[1],widths[0]]:widths;
  let x=0;const strips=dest.map((w,i)=>{const s={sx:src[i],sw:src[i+1]-src[i],x,w};x+=w;return s;});
  return {mirror,strips,opening:{x:(b.door.x-b.x)*tile,w:(b.door.w||1)*tile},x:b.x*tile,y:b.y*tile,w:b.w*tile,h:b.h*tile};
 }
 function draw(c,b,frame,ox,oy,tile=32){const crop=bounds(frame),p=panels(b,frame,crop,tile);if(crop.w<=0||crop.h<=0||p.strips.some(s=>s.sw<=0||s.w<0))return false;
  c.save();c.translate(p.x-ox,p.y-oy);
  if(p.mirror){c.translate(p.w,0);c.scale(-1,1);}
  for(const s of p.strips)if(s.w)c.drawImage(frame.image,s.sx,crop.y,s.sw,crop.h,s.x,0,s.w,p.h);
  c.restore();return true;
 }
 return {draw,panels};
})();
if(typeof module==='object'&&module.exports)module.exports=NativeFacade;
