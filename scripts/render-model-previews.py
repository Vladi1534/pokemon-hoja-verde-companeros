#!/usr/bin/env python3
"""Render checked-in GLB assets for devices without WebGL; no ROM required.
Requires numpy, trimesh, pyrender and Pillow. EGL/Mesa is sufficient.
"""
import os
os.environ.setdefault('PYOPENGL_PLATFORM','egl')
import sys,json,math
from pathlib import Path
if os.getenv('HG_RENDER_DEPS'):sys.path.insert(0,os.environ['HG_RENDER_DEPS'])
import numpy as np
import trimesh,pyrender
from PIL import Image
root=Path(__file__).resolve().parents[1]/'assets/heartgold-models'
out=root/'previews';out.mkdir(exist_ok=True)
manifest=json.loads((root/'manifest.json').read_text())
keys={'museum-exterior','pokemon-center','poke-mart','oak-laboratory','pokemon-league','silph-company','celadon-casino','red-house','blue-house','pewter-house','viridian-house','cerulean-house','vermilion-house','bills-house','celadon-department-store','pewter-gym','cerulean-gym','vermilion-gym','celadon-gym','fuchsia-gym','saffron-gym','viridian-gym','museum-display-case','museum-bookcase','museum-table','museum-interior-complete'}
keys.update(a['key'] for a in manifest['assets'] if a.get('environment'))
only=os.getenv('HG_RENDER_KEYS')
if only:keys=set(only.split(','))
metadata=json.loads((out/'manifest.json').read_text()) if (out/'manifest.json').exists() else {}
for asset in manifest['assets']:
 key=asset['key']
 if key not in keys:continue
 source=trimesh.load(root/asset['file'],force='scene')
 scene=pyrender.Scene(bg_color=[0,0,0,0],ambient_light=[1,1,1]);transparent=[]
 for name in source.graph.nodes_geometry:
  transform,geo=source.graph[name];original=source.geometry[geo]
  mesh=pyrender.Mesh.from_trimesh(original,smooth=False)
  for primitive in mesh.primitives:
   primitive.material.alphaMode=original.visual.material.alphaMode or 'OPAQUE'
   if primitive.material.baseColorTexture:primitive.material.baseColorTexture.sampler=pyrender.Sampler(magFilter=9728,minFilter=9728)
  node=scene.add(mesh,pose=transform)
  if all(p.material.alphaMode=='BLEND' for p in mesh.primitives):transparent.append(node)
 bounds=source.bounds;center=bounds.mean(axis=0);room=key=='museum-interior-complete'
 angle=math.radians(45 if room else 42);direction=np.array([0,math.sin(angle),math.cos(angle)]);up=np.array([0,math.cos(angle),-math.sin(angle)])
 corners=np.array([[x,y,z] for x in bounds[:,0] for y in bounds[:,1] for z in bounds[:,2]])-center
 halfX=(np.ptp(corners[:,0])+4)/2;halfY=(np.ptp(corners@up)+4)/2
 width=2048 if room else 768;height=math.ceil(width*halfY/halfX);halfY=halfX*height/width
 distance=2000;pose=np.eye(4);pose[:3,0]=[1,0,0];pose[:3,1]=up;pose[:3,2]=direction;pose[:3,3]=center+direction*distance
 scene.add(pyrender.OrthographicCamera(xmag=halfX,ymag=halfY,znear=.1,zfar=4000),pose=pose)
 renderer=pyrender.OffscreenRenderer(width,height)
 color,depth=renderer.render(scene,flags=pyrender.RenderFlags.RGBA|pyrender.RenderFlags.FLAT)
 Image.fromarray(color).save(out/(key+'.png'),optimize=True)
 scale=width/(2*halfX);anchor=np.array(asset.get('doorNative',[0,bounds[0,1],bounds[1,2]]))-center
 entry={'image':'model-previews/'+key+'.png','width':width,'height':height,'anchorX':float(anchor[0]*scale+width/2),'anchorY':float(height/2-anchor@up*scale),'scale':scale,'center':center.tolist(),'sin':float(direction[1]),'cos':float(direction[2]),'distance':distance}
 if room:
  for node in transparent:scene.remove_node(node)
  _,depth=renderer.render(scene,flags=pyrender.RenderFlags.RGBA|pyrender.RenderFlags.FLAT)
  # Pyrender reports perspective-linearized depth even for an orthographic
  # camera. Undo that mapping before packing camera-space distances.
  valid=depth>0;linear=np.zeros_like(depth);linear[valid]=4000.1-400/depth[valid]
  packed=np.clip(np.round(linear*16),0,65535).astype(np.uint16)
  encoded=np.zeros((height,width,4),dtype=np.uint8);encoded[:,:,0]=packed>>8;encoded[:,:,1]=packed&255;encoded[:,:,3]=255
  Image.fromarray(encoded).save(out/(key+'-depth.png'),optimize=True);entry['depth']='model-previews/'+key+'-depth.png'
 renderer.delete();metadata[key]=entry;print(key,flush=True)
(out/'manifest.json').write_text(json.dumps(metadata,indent=2)+'\n')
