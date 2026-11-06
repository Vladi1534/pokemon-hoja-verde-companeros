// Native HG geometry. One WebGL context serves cached exterior views and rooms.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {fallbackFrame,fallbackRoom} from './model-fallback.mjs';
const models=new Map(),frames=new Map(),loading=new Map(),loader=new GLTFLoader();
let renderer,failed=false,roomScene,roomKey,roomModel;
const actors=new Map();
function engine(){
 if(failed)return null;if(renderer)return renderer;
 try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;frames.clear();});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{failed=false;renderer=null;roomKey=null;});
  return renderer;
 }catch{failed=true;return null;}
}
export async function load(key){
 if(models.has(key))return models.get(key);if(loading.has(key))return loading.get(key);
 const promise=loader.loadAsync('./models/'+key+'.glb').then(g=>{
  g.scene.traverse(o=>{if(!o.isMesh)return;const convert=m=>{
   if(m.map){m.map.magFilter=THREE.NearestFilter;m.map.minFilter=THREE.NearestFilter;m.map.generateMipmaps=false;m.map.colorSpace=THREE.SRGBColorSpace;}
   // DS vertex colors and textures already contain the authored lighting.
   return new THREE.MeshBasicMaterial({map:m.map,color:m.color,vertexColors:!!o.geometry.attributes.color,side:THREE.DoubleSide,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest||(m.transparent?0:.25),depthWrite:!m.transparent});
  };o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);});
  models.set(key,g.scene);return g.scene;
 }).catch(()=>null);loading.set(key,promise);return promise;
}
const vector=a=>new THREE.Vector3(...a);
export function frame(key,meta={}){
 if(meta.environment)return fallbackFrame(meta);
 if(failed)return fallbackFrame(meta);
 if(frames.has(key))return frames.get(key);
 const model=models.get(key);if(!model){load(key);return fallbackFrame(meta);}const r=engine();if(!r)return fallbackFrame(meta);
 const scene=new THREE.Scene(),object=model.clone(true);scene.add(object);
 const box=new THREE.Box3().setFromObject(object),center=box.getCenter(new THREE.Vector3());
 const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,4000);
 const angle=(meta.elevation||42)*Math.PI/180;
 camera.position.set(center.x,center.y+1000*Math.sin(angle),center.z+1000*Math.cos(angle));camera.lookAt(center);camera.updateMatrixWorld();
 const corners=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
 const projected=new THREE.Box3().setFromPoints(corners),pad=2;
 camera.left=projected.min.x-pad;camera.right=projected.max.x+pad;camera.top=projected.max.y+pad;camera.bottom=projected.min.y-pad;camera.updateProjectionMatrix();
 const ratio=(camera.top-camera.bottom)/(camera.right-camera.left),w=768,h=Math.ceil(w*ratio);
 r.setSize(w,h,false);r.render(scene,camera);
 const image=document.createElement('canvas');image.width=w;image.height=h;image.getContext('2d').drawImage(r.domElement,0,0);
 const anchor=vector(meta.doorNative||meta.anchor||[0,box.min.y,box.max.z]).project(camera);
 const value={image,nativePixelsPerUnit:w/(camera.right-camera.left),anchorX:(anchor.x+1)/2*w,anchorY:(1-anchor.y)/2*h,bounds:box};frames.set(key,value);return value;
}
export function room(key,placements,{width,height,player,origin=[0,0],zoom=1.4,meta={}}){
 const options={width,height,player,origin,zoom,meta};if(failed)return fallbackRoom(placements,options);
 const model=models.get(key);if(!model){load(key);return fallbackRoom(placements,options);}const r=engine();if(!r)return fallbackRoom(placements,options);
 if(roomKey!==key){
  for(const a of actors.values()){a.material.map.dispose();a.material.dispose();}actors.clear();
  roomScene=new THREE.Scene();roomScene.background=new THREE.Color('#172d38');roomModel=model.clone(true);roomScene.add(roomModel);roomKey=key;
 }
 const visible=new Set();for(const p of placements){
  visible.add(p.id);let sprite=actors.get(p.id);
  if(!sprite){const texture=new THREE.CanvasTexture(p.image);texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,alphaTest:.3,transparent:true,depthWrite:true}));sprite.center.set(.5,0);actors.set(p.id,sprite);roomScene.add(sprite);}
  sprite.material.map.image=p.image;sprite.material.map.needsUpdate=true;
  sprite.position.set(origin[0]+(p.x+.5)*16,.25,origin[1]+(p.y+.5)*16);
  sprite.scale.set(p.image.width/2,p.image.height/2,1);
 }
 for(const [id,a]of actors)if(!visible.has(id)){roomScene.remove(a);a.material.map.dispose();a.material.dispose();actors.delete(id);}
 const camera=new THREE.OrthographicCamera(-width/4/zoom,width/4/zoom,height/4/zoom,-height/4/zoom,.1,3000);
 const target=new THREE.Vector3(origin[0]+(player.x+.5)*16,8,origin[1]+(player.y+.5)*16-32);
 camera.position.copy(target).add(new THREE.Vector3(0,800,800));camera.lookAt(target);
 if(r.domElement.width!==width||r.domElement.height!==height)r.setSize(width,height,false);r.render(roomScene,camera);return r.domElement;
}
export const status=()=>({webgl:!!renderer&&!failed,failed,loaded:models.size,cached:frames.size});
export const preview=meta=>fallbackFrame(meta);
