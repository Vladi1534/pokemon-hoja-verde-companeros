#!/usr/bin/env python3
"""Reproducible selection and GLB packaging of owner-supplied HG model data."""
import os,copy, hashlib, json, shutil, struct, subprocess, sys
from pathlib import Path

BASE=Path(os.environ.get('HG_WORK_DIR','hg-work')).resolve()
BASE.mkdir(parents=True,exist_ok=True)
from nitro import nitro_files,narc

FIELD={
    'museum-exterior':293,'pewter-gym':294,'pokemon-center':40,'poke-mart':39,
    'oak-laboratory':314,'pokemon-league':146,'silph-company':257,
    'celadon-casino':241,'lavender-radio-tower':281,'lavender-memorial':282,
    'celadon-mansion':244,'red-house':313,'blue-house':313,'pewter-house':292,
    'viridian-house':315,'cerulean-house':276,'vermilion-house':215,
    'celadon-department-store':242,'bills-house':279,'fuchsia-gym':300,'celadon-gym':245,
    'viridian-gym':318,'cerulean-gym':284,'vermilion-gym':219,
    'saffron-gym':250,'pallet-lab-door':311,'pallet-house-door':310,
    'pokemon-center-door':15,'gym-door':220,'museum-area-door':301,
    'ss-aqua-reference':168,
}
ROOM={
    'museum-display-case':74,'museum-bookcase':67,'museum-table':95,
    'plant':23,'entry-mat':1,'lab-pokemon-machine':27,'lab-computer-machine':28,
    'lab-research-machine':29,'lab-bookcase':30,'lab-chair':32,
    'healing-machine':35,'pokemon-center-counter':33,'pokemon-center-pc':34,
    'pokemon-center-bench':57,'shop-counter':43,'shop-shelves':45,
    'home-bed':17,'home-console':18,'home-tv':19,'home-kitchen':20,
    'home-fridge':21,'home-clock':16,'home-window':5,'home-table':89,
    'home-chair':53,'home-sofa':101,'home-bookshelf':64,'gym-statue':78,
    'oak-starter-display':210,
}

def read_glb(path):
    b=path.read_bytes(); assert b[:4]==b'glTF'
    p=12;doc=None;data=b''
    while p<len(b):
        n,kind=struct.unpack_from('<II',b,p);c=b[p+8:p+8+n];p+=8+n
        if kind==0x4e4f534a:doc=json.loads(c)
        elif kind==0x004e4942:data=c
    return doc,data

def write_glb(doc,data,path):
    data=bytearray(data)
    while len(data)%4:data.append(0)
    doc['buffers']=[{'byteLength':len(data)}]
    text=json.dumps(doc,separators=(',',':'),ensure_ascii=True).encode()
    text+=b' '*((-len(text))%4)
    blob=struct.pack('<4sII',b'glTF',2,12+8+len(text)+8+len(data))+struct.pack('<II',len(text),0x4e4f534a)+text+struct.pack('<II',len(data),0x004e4942)+data
    path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(blob)

def embed(path,out):
    doc,data=read_glb(path);data=bytearray(data)
    for im in doc.get('images',[]):
        if 'uri' not in im:continue
        while len(data)%4:data.append(0)
        payload=(path.parent/im.pop('uri')).read_bytes()
        im['bufferView']=len(doc['bufferViews']);im['mimeType']='image/png'
        doc['bufferViews'].append({'buffer':0,'byteOffset':len(data),'byteLength':len(payload)})
        data.extend(payload)
    # Keep the original texel sampling, unlit materials and native model axes.
    for sampler in doc.get('samplers',[]):
        sampler['magFilter']=9728;sampler['minFilter']=9728
    doc.setdefault('extras',{})['source']='Owner-supplied Pokémon HeartGold Spanish ROM; original model and textures.'
    write_glb(doc,data,out)
    return doc

def merge(instances,out):
    dst={'asset':{'version':'2.0','generator':'HeartGold native scene composition'},'scene':0,'scenes':[{'nodes':[]}],'extensionsUsed':['KHR_materials_unlit']}
    fields=['bufferViews','accessors','images','samplers','textures','materials','meshes','nodes','skins']
    for f in fields:dst[f]=[]
    binary=bytearray()
    for path,translation,label in instances:
        src,data=read_glb(path);src=copy.deepcopy(src)
        offsets={f:len(dst[f]) for f in fields}
        while len(binary)%4:binary.append(0)
        bo=len(binary);binary.extend(data)
        for v in src.get('bufferViews',[]):v['byteOffset']=v.get('byteOffset',0)+bo;v['buffer']=0
        for a in src.get('accessors',[]):
            if 'bufferView' in a:a['bufferView']+=offsets['bufferViews']
        for i in src.get('images',[]):
            if 'bufferView' in i:i['bufferView']+=offsets['bufferViews']
        for t in src.get('textures',[]):
            if 'source' in t:t['source']+=offsets['images']
            if 'sampler' in t:t['sampler']+=offsets['samplers']
        for m in src.get('materials',[]):
            pbr=m.get('pbrMetallicRoughness',{})
            for key in ('baseColorTexture','metallicRoughnessTexture'):
                if key in pbr:pbr[key]['index']+=offsets['textures']
            for key in ('normalTexture','emissiveTexture','occlusionTexture'):
                if key in m:m[key]['index']+=offsets['textures']
        for mesh in src.get('meshes',[]):
            for p in mesh['primitives']:
                p['attributes']={k:v+offsets['accessors'] for k,v in p['attributes'].items()}
                if 'indices' in p:p['indices']+=offsets['accessors']
                if 'material' in p:p['material']+=offsets['materials']
        for n in src.get('nodes',[]):
            if 'mesh' in n:n['mesh']+=offsets['meshes']
            if 'skin' in n:n['skin']+=offsets['skins']
            if 'children' in n:n['children']=[v+offsets['nodes'] for v in n['children']]
        for s in src.get('skins',[]):
            s['joints']=[j+offsets['nodes'] for j in s['joints']]
            if 'skeleton' in s:s['skeleton']+=offsets['nodes']
            if 'inverseBindMatrices' in s:s['inverseBindMatrices']+=offsets['accessors']
        roots=[n+offsets['nodes'] for n in src['scenes'][src.get('scene',0)]['nodes']]
        for f in fields:dst[f].extend(src.get(f,[]))
        wrapper={'name':label,'translation':translation,'children':roots}
        dst['scenes'][0]['nodes'].append(len(dst['nodes']));dst['nodes'].append(wrapper)
    write_glb(dst,binary,out)

def main():
    rompath=Path(sys.argv[1]) if len(sys.argv)>1 else Path(os.environ['HG_ROM'])
    rom=rompath.read_bytes();fs=nitro_files(rom)
    arcs={name:narc(rom[a:b]) for name,(a,b) in fs.items() if name in ['a/0/4/0','a/1/4/8','a/0/6/5','a/0/4/4']}
    out=BASE/'deliverable';(out/'models').mkdir(parents=True,exist_ok=True)
    convert=Path(os.environ['APICULA_BIN'])
    work=BASE/'converted';work.mkdir(exist_ok=True)
    manifests=[]
    def one(key,arc,idx,extra=None,raw=None):
        source=BASE/'nitro/selected'/f'{key}.nsbmd';source.parent.mkdir(parents=True,exist_ok=True)
        source.write_bytes(arcs[arc][idx] if raw is None else raw)
        folder=work/key
        if folder.exists():shutil.rmtree(folder)
        cmd=[str(convert),'convert','-f=glb',str(source)]
        if extra:cmd.append(str(extra))
        cmd+=['-o',str(folder)]
        p=subprocess.run(cmd,capture_output=True,text=True)
        if p.returncode:raise RuntimeError(p.stdout+p.stderr)
        glbs=list(folder.glob('*.glb'))
        if len(glbs)!=1:raise RuntimeError(f'Expected one model: {key}')
        target=out/'models'/f'{key}.glb';doc=embed(glbs[0],target)
        verts=[a for a in doc['accessors'] if a.get('type')=='VEC3' and 'min' in a and 'max' in a]
        item={'key':key,'file':'models/'+target.name,'sourceArchive':arc,'sourceMember':idx,'sourceModel':glbs[0].stem,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'texturesEmbedded':len(doc.get('images',[])),'bounds':{'min':[min(a['min'][j] for a in verts) for j in range(3)],'max':[max(a['max'][j] for a in verts) for j in range(3)]},'unitsPerTile':16,'axis':'Y up; +Z front/south; +X east; native origin preserved'}
        manifests.append(item)
    for key,idx in FIELD.items():one(key,'a/0/4/0',idx)
    for key,idx in ROOM.items():one(key,'a/1/4/8',idx)
    land=arcs['a/0/6/5'][358];p=land.index(b'BMD0');n=struct.unpack_from('<I',land,p+8)[0]
    tx=BASE/'nitro/selected/museum-textures.nsbtx';tx.write_bytes(arcs['a/0/4/4'][44])
    one('museum-interior-base','a/0/6/5',358,tx,land[p:p+n])
    h=struct.unpack_from('<4I',land);props=[]
    keys={v:k for k,v in ROOM.items()}
    for p in range(20+h[0],20+h[0]+h[1],48):
        vals=struct.unpack_from('<10i',land,p)
        props.append({'key':keys[vals[0]],'modelID':vals[0],'translation':[x/4096 for x in vals[1:4]],'rotationRaw':list(vals[4:7]),'scale':[x/4096 for x in vals[7:10]]})
    (out/'museum-props.json').write_text(json.dumps(props,indent=2)+'\n')
    instances=[(out/'models/museum-interior-base.glb',[0,0,0],'museum-room')]+[(out/'models'/f'{p["key"]}.glb',p['translation'],p['key']) for p in props]
    complete=out/'models/museum-interior-complete.glb'
    merge(instances,complete)
    cdoc,_=read_glb(complete)
    manifests.append({'key':'museum-interior-complete','file':'models/museum-interior-complete.glb','sourceArchive':'a/0/6/5','sourceMember':358,'sourceModel':'m_museum01_00_00 + 11 original placed props','propSourceArchive':'a/1/4/8','propPlacements':'museum-props.json','bytes':complete.stat().st_size,'sha256':hashlib.sha256(complete.read_bytes()).hexdigest(),'texturesEmbedded':len(cdoc.get('images',[])),'bounds':next(a['bounds']for a in manifests if a['key']=='museum-interior-base'),'unitsPerTile':16,'axis':'Y up; +Z front/south; +X east; native origin preserved'})
    manifest={'romSha256':hashlib.sha256(rom).hexdigest(),'romGameCode':rom[12:16].decode(),'converter':'Apicula 3d4e91e14045392a49c89e86dab8cb936225588c (0BSD), headless build','assets':manifests,'museumInterior':{'matrixArchive':'a/0/4/1','matrixMember':242,'name':'m_museum01_','landMember':358,'textureArchive':'a/0/4/4','textureMember':44,'propCount':len(props),'complete':'models/museum-interior-complete.glb','props':'museum-props.json'},'note':'HG Lavender tower is the later radio tower; no claim that this is FRLG Pokémon Tower. Celadon mansion is not Cinnabar Pokémon Mansion.'}
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({'count':len(manifests),'bytes':sum(p.stat().st_size for p in (out/'models').glob('*.glb')),'output':str(out)}))

if __name__=='__main__':main()
