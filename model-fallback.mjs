// Native geometry prerendered with the same orthographic projection. Depth masks
// keep actors behind walls/exhibits on devices without hardware WebGL.
const images=new Map(),depths=new Map();let canvas,actorCanvas;
function image(url){if(!url)return null;if(!images.has(url)){const im=new Image();im.src='./'+url;images.set(url,im);}const im=images.get(url);return im.complete&&im.naturalWidth?im:null;}
export function fallbackFrame(meta){const f=meta.preview;if(!f)return null;const im=image(f.image);return im?{image:im,nativePixelsPerUnit:f.scale,anchorX:f.anchorX,anchorY:f.anchorY}:null;}
export function project(f,x,y,z){return {x:(x-f.center[0])*f.scale+f.width/2,y:(-(y-f.center[1])*f.cos+(z-f.center[2])*f.sin)*f.scale+f.height/2,depth:f.distance-(y-f.center[1])*f.sin-(z-f.center[2])*f.cos};}
export function fallbackRoom(placements,{width,height,player,origin,zoom,meta}){
 const f=meta?.preview;if(!f)return null;const im=image(f.image),di=image(f.depth);if(!im||!di)return null;
 if(!depths.has(f.depth)){const c=document.createElement('canvas');c.width=di.width;c.height=di.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(di,0,0);depths.set(f.depth,g.getImageData(0,0,c.width,c.height).data);}
 const depth=depths.get(f.depth);canvas||=document.createElement('canvas');if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#172d38';c.fillRect(0,0,width,height);
 const screenScale=2*zoom,ratio=screenScale/f.scale,target=project(f,origin[0]+(player.x+.5)*16,8,origin[1]+(player.y+.5)*16-32),ox=width/2-target.x*ratio,oy=height/2-target.y*ratio;
 c.drawImage(im,ox,oy,im.width*ratio,im.height*ratio);
 const sorted=placements.map(p=>({...p,projection:project(f,origin[0]+(p.x+.5)*16,.25,origin[1]+(p.y+.5)*16)})).sort((a,b)=>b.projection.depth-a.projection.depth);
 for(const p of sorted){const point=p.projection,w=p.image.width,h=p.image.height,x=ox+point.x*ratio-w/4*screenScale,y=oy+point.y*ratio-h/2*screenScale;
  if(x>width||y>height||x+w/2*screenScale<0||y+h/2*screenScale<0)continue;
  actorCanvas||=document.createElement('canvas');actorCanvas.width=w;actorCanvas.height=h;
  const a=actorCanvas.getContext('2d',{willReadFrequently:true});a.drawImage(p.image,0,0);const pixels=a.getImageData(0,0,w,h);
  for(let py=0;py<h;py++)for(let px=0;px<w;px++){const idx=(py*w+px)*4;if(!pixels.data[idx+3])continue;const sx=Math.floor(point.x+(px-w/2)/2*f.scale),sy=Math.floor(point.y+(py-h)/2*f.scale);if(sx<0||sy<0||sx>=f.width||sy>=f.height)continue;const d=(sy*f.width+sx)*4,nearest=(depth[d]*256+depth[d+1])/16;if(nearest>0&&nearest<point.depth-1)pixels.data[idx+3]=0;}
  a.putImageData(pixels,0,0);c.drawImage(actorCanvas,x,y,w/2*screenScale,h/2*screenScale);
 }
 return canvas;
}
