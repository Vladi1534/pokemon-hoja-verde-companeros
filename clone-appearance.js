/* A runtime skin material: source sprite sheets stay untouched. Dark organic
 * markings are clipped to coloured skin, never to transparency or highlights. */
var CloneAppearance=(()=>{
 const images=new Map(),urls=new Map(),sheets=new WeakMap();
 function marked(r,g,b,x,y,id){
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  if(max-min<32||max<65||min>205)return false;
  // The three original guardians keep their characteristic skin colours.
  const skin=id===3?g>r*1.15&&b>r*1.15:id===6?r>g*1.25&&g>b*1.25:id===9?b>r*1.2&&g>r*1.05:id===25?r>b*1.7&&g>b*1.5:true;
  if(!skin)return false;
  const stripe=Math.sin(x*.21+y*.37+Math.sin(y*.17)*1.4+id*.73);
  return stripe>.77&&Math.sin(x*.16-y*.11+id)>-.35;
 }
 function material(source,id,frame=0){
  const c=document.createElement('canvas');c.width=source.naturalWidth||source.width;c.height=source.naturalHeight||source.height;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
  const data=ctx.getImageData(0,0,c.width,c.height),pixels=data.data;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
   const i=(y*c.width+x)*4;if(pixels[i+3]<180)continue;
   const sx=frame?(x%frame)*3:x,sy=frame?y*3:y;
   if(marked(pixels[i],pixels[i+1],pixels[i+2],sx,sy,id)){
    pixels[i]=Math.round(pixels[i]*.48);pixels[i+1]=Math.round(pixels[i+1]*.43);pixels[i+2]=Math.round(pixels[i+2]*.61);
   }
  }
  ctx.putImageData(data,0,0);return c;
 }
 function sprite(source,id,enabled=false){
  if(!enabled||!source)return source;
  const key=id+':'+source;if(urls.has(key))return urls.get(key);
  if(!images.has(key)){const image=new Image();images.set(key,image);image.onload=()=>{urls.set(key,material(image,Number(id)).toDataURL());document.querySelectorAll('img[data-clone-source]').forEach(el=>{if(el.dataset.cloneSource===source&&+el.dataset.cloneSpecies===Number(id))el.src=urls.get(key);});};image.src=source;}
  const image=images.get(key);if(image.complete&&image.naturalWidth){const value=material(image,Number(id)).toDataURL();urls.set(key,value);return value;}
  return source;
 }
 function follower(source,id,enabled=false){
  if(!enabled||!source?.complete||!source.naturalWidth)return source;
  let variants=sheets.get(source);if(!variants){variants=new Map();sheets.set(source,variants);}
  if(!variants.has(id)){const c=material(source,Number(id),32);c.complete=true;c.naturalWidth=c.width;c.naturalHeight=c.height;variants.set(id,c);}
  return variants.get(id);
 }
 function image(source,id,enabled=false,alt=''){
  const attrs=enabled?` data-clone-source="${esc(source||'')}" data-clone-species="${id}"`:'';
  return `<img src="${sprite(source,id,enabled)||''}"${attrs} alt="${esc(alt)}">`;
 }
 return {sprite,follower,image,marked};
})();
if(typeof module==='object'&&module.exports)module.exports=CloneAppearance;
