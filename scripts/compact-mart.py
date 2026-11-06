#!/usr/bin/env python3
"""Build a static HG Mart body for the four-cell FRLG plot.
The detached sign/post and ground shadow belong outside that plot; retain the
complete textured building instead of cropping half of it at draw time.
"""
import json,struct,hashlib,copy
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'assets/heartgold-models'
raw=(root/'models/poke-mart.glb').read_bytes();size=struct.unpack_from('<I',raw,12)[0]
doc=json.loads(raw[20:20+size]);binary=bytearray(raw[28+size:])
components={5126:('f',4),5123:('H',2),5125:('I',4),5121:('B',1)}
counts={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def read(i):
 a=doc['accessors'][i];v=doc['bufferViews'][a['bufferView']];fmt,s=components[a['componentType']];n=counts[a['type']];start=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',s*n)
 return [struct.unpack_from('<'+fmt*n,binary,start+j*stride)for j in range(a['count'])]
def write(rows,original):
 a=copy.deepcopy(original);fmt,s=components[a['componentType']];n=counts[a['type']]
 while len(binary)%4:binary.append(0)
 start=len(binary)
 for row in rows:binary.extend(struct.pack('<'+fmt*n,*row))
 v=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':start,'byteLength':len(binary)-start})
 a.update(bufferView=v,byteOffset=0,count=len(rows));a.pop('min',None);a.pop('max',None)
 if a['type']=='VEC3':a.update(min=[min(r[k]for r in rows)for k in range(3)],max=[max(r[k]for r in rows)for k in range(3)])
 doc['accessors'].append(a);return len(doc['accessors'])-1
primitives=[]
for p in doc['meshes'][0]['primitives']:
 indices=[r[0]for r in read(p['indices'])];pos=read(p['attributes']['POSITION']);joint=read(p['attributes']['JOINTS_0'])
 if doc['materials'][p['material']].get('alphaMode')=='BLEND' or any(joint[i][0] for i in indices) or min(pos[i][0]for i in indices)>35:continue
 used=sorted(set(indices));lookup={v:i for i,v in enumerate(used)};q=copy.deepcopy(p)
 q['attributes']={k:write([read(a)[i]for i in used],doc['accessors'][a])for k,a in p['attributes'].items()if k not in ['JOINTS_0','WEIGHTS_0']}
 q['indices']=write([(lookup[i],)for i in indices],doc['accessors'][p['indices']]);primitives.append(q)
assert len(primitives)==2,'Unexpected source model: inspect before adapting.'
doc['meshes']=[{'name':'HG Mart · compact plot','primitives':primitives}];doc['nodes']=[{'mesh':0}];doc['scenes']=[{'nodes':[0]}];doc['scene']=0;doc.pop('skins',None);doc.pop('animations',None)
doc['buffers']=[{'byteLength':len(binary)}]
while len(binary)%4:binary.append(0)
data=json.dumps(doc,separators=(',',':')).encode();data+=b' '*(-len(data)%4)
result=struct.pack('<III',0x46546c67,2,28+len(data)+len(binary))+struct.pack('<II',len(data),0x4e4f534a)+data+struct.pack('<II',len(binary),0x004e4942)+binary
file=root/'models/poke-mart-compact.glb';file.write_bytes(result)
manifest=json.loads((root/'manifest.json').read_text());asset=copy.deepcopy(next(a for a in manifest['assets']if a['key']=='poke-mart'))
asset.update(key='poke-mart-compact',file='models/poke-mart-compact.glb',bytes=len(result),sha256=hashlib.sha256(result).hexdigest(),adaptation='Complete main body; detached sign, post and shadow omitted to match FRLG four-cell storefront.',bounds={'min':[-32,2,-29],'max':[34,51.55078,15]})
manifest['assets']=[a for a in manifest['assets']if a['key']!=asset['key']]+[asset]
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Created compact HG Mart, preserving both body meshes and embedded textures.')
