#!/usr/bin/env python3
"""Extract the HG museum movement grid, native entrance and event positions."""
import os,collections,json,struct,sys
from pathlib import Path
from PIL import Image,ImageDraw
BASE=Path(os.environ.get('HG_WORK_DIR','hg-work')).resolve()
BASE.mkdir(parents=True,exist_ok=True)
from nitro import nitro_files,narc

def main():
    rom=Path(os.environ['HG_ROM']).read_bytes()
    fs=nitro_files(rom);s,e=fs['a/0/6/5'];land=narc(rom[s:e])[358]
    permissionsSize,propsSize,modelSize,terrainSize=struct.unpack_from('<4I',land)
    assert permissionsSize==2048 and land[16:18]==b'\x34\x12'
    # The HG extension is a 16-bit tag and 16-bit background-sound data length.
    soundsSize=struct.unpack_from('<H',land,18)[0]
    permissionsOffset=20+soundsSize
    vals=struct.unpack_from('<1024H',land,permissionsOffset)
    raw=[list(vals[z*32:(z+1)*32]) for z in range(32)]
    permissionMask=[[int(not(v&0x8000)) for v in row] for row in raw]
    # Unused area can have zero permissions. Restrict the playable floor to the
    # connected component containing the original doorway rather than marking
    # that outside space walkable.
    entry=(10,19);seen={entry};queue=collections.deque([entry])
    while queue:
        x,z=queue.popleft()
        for dx,dz in [(1,0),(-1,0),(0,1),(0,-1)]:
            nx,nz=x+dx,z+dz
            if 0<=nx<32 and 0<=nz<32 and permissionMask[nz][nx] and (nx,nz) not in seen:
                seen.add((nx,nz));queue.append((nx,nz))
    walk=[[int((x,z)in seen) for x in range(32)] for z in range(32)]
    source=json.loads((Path(os.environ['HG_DECOMP'])/'files/fielddata/eventdata/zone_event/424_T03R0101.json').read_text())
    def native(x,z):return [16*x-248,0,16*z-248]
    npcs=[]
    for n in source['objects']:
        n=dict(n);n['nativePosition']=native(n['x'],n['z']);n['onWalkableFloor']=bool(walk[n['z']][n['x']]);npcs.append(n)
    groups={}
    for bg in source['bgs']:
        k=bg['scriptId'];groups.setdefault(k,[]).append({'x':bg['x'],'z':bg['z'],'dir':bg['dir']})
    exhibits=[]
    for k,positions in groups.items():
        xs=[v['x']for v in positions];zs=[v['z']for v in positions]
        exhibits.append({'sourceInteraction':k,'approachTiles':positions,'tileBounds':[min(xs),min(zs),max(xs),max(zs)],'note':'Bounds of interaction tiles; not replacement collision boxes.'})
    result={'width':32,'height':32,'unitsPerTile':16,'axis':'X east, Y up, Z south','tileOrigin':[-256,0,-256],'tileCenterFormula':{'x':'x * 16 - 248','y':'0','z':'z * 16 - 248'},'inverseFormula':{'x':'floor((nativeX + 256) / 16)','z':'floor((nativeZ + 256) / 16)'},'permissionRaw':raw,'permissionType':[[v&255 for v in row]for row in raw],'collisionByte':[[v>>8 for v in row]for row in raw],'rawPassMask':permissionMask,'walkMask':walk,'walkableCount':len(seen),'reachableBoundsTiles':[min(x for x,z in seen),min(z for x,z in seen),max(x for x,z in seen),max(z for x,z in seen)],'entrance':{'x':10,'z':19,'nativePosition':native(10,19),'facingOnEnter':'north','preferredSpawn':{'x':10,'z':18},'targetHGMap':'MAP_PEWTER','targetHGAnchor':0,'permissionType':raw[19][10]&255},'npcSlots':npcs,'exhibitionInteractions':exhibits,'source':{'romGameCode':'IPKS','landArchive':'a/0/6/5','landMember':358,'permissionOffsetWithinMember':permissionsOffset,'permissionSize':permissionsSize,'matrixArchive':'a/0/4/1','matrixMember':242,'eventArchive':'a/0/3/2','eventMember':424,'eventReference':'https://github.com/pret/pokeheartgold/blob/master/files/fielddata/eventdata/zone_event/424_T03R0101.json','collisionReference':'https://ds-pokemon-hacking.github.io/docs/generation-iv/guides/mapping/'},'notes':['walkMask includes only the doorway-connected component, avoiding unused zero-filled cells outside the room.','Block active NPC positions dynamically; raw map collision data does not include walking NPCs.','HG conditional Steven/Cameron events are reference positions only; preserve the project LeafGreen story rather than copying HG flags or scripts.','Exhibition interaction bounds are not rectangular collider replacements. Use the exact walkMask.']}
    out=BASE/'deliverable';out.mkdir(exist_ok=True)
    (out/'museum-collision.json').write_text(json.dumps(result,indent=2)+'\n')
    size=22;off=36;im=Image.new('RGB',(off+32*size+10,off+32*size+64),'#eef3f6');d=ImageDraw.Draw(im)
    for z in range(32):
        d.text((4,off+z*size+5),str(z),fill='#17334a')
        for x in range(32):
            c='#bfe2ca' if walk[z][x] else ('#475769' if not permissionMask[z][x] else '#d3d9df')
            d.rectangle((off+x*size,off+z*size,off+(x+1)*size-1,off+(z+1)*size-1),fill=c,outline='#ffffff')
    for x in range(32):d.text((off+x*size+4,12),str(x),fill='#17334a')
    for n in npcs:
        x,z=n['x'],n['z'];d.ellipse((off+x*size+5,off+z*size+5,off+x*size+17,off+z*size+17),fill='#db9e3d')
    x,z=entry;d.rectangle((off+x*size+3,off+z*size+3,off+x*size+19,off+z*size+19),fill='#e65f66')
    d.text((off,off+32*size+12),'Green: connected floor  |  Dark: blocked  |  Gold: NPC  |  Red: exit',fill='#17334a')
    d.text((off,off+32*size+31),'Grey: unused disconnected cells. Native original 32 x 32 movement grid.',fill='#17334a')
    im.save(out/'museum-collision-preview.png')
    print(json.dumps({'walkable':len(seen),'npcCount':len(npcs),'allNPCsWalkable':all(n['onWalkableFloor']for n in npcs),'file':str(out/'museum-collision.json')}))

if __name__=='__main__':main()
