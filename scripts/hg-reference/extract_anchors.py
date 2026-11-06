#!/usr/bin/env python3
"""Verify building doorway anchors against native world props and warp tiles."""
import os,json,re,struct,sys,math
from pathlib import Path
BASE=Path(os.environ.get('HG_WORK_DIR','hg-work')).resolve()
BASE.mkdir(parents=True,exist_ok=True)
from nitro import nitro_files,narc
from build_assets import FIELD

TARGET={
 'museum-exterior':r'^MAP_PEWTER_MUSEUM_OF_SCIENCE$',
 'pokemon-center':r'POKECENTER_1F$', 'poke-mart':r'POKEMART$',
 'pewter-gym':r'^MAP_PEWTER_GYM$', 'oak-laboratory':r'^MAP_PALLET_TOWN_OAKS_LAB$',
 'pokemon-league':r'^MAP_POKEMON_LEAGUE_ENTRANCE$', 'silph-company':r'^MAP_SAFFRON_SILPH_CO_HQ$',
 'celadon-casino':r'^MAP_CELADON_GAME_CORNER(?:_JP)?$',
 'lavender-radio-tower':r'^MAP_LAVENDER_RADIO_STATION$',
 'lavender-memorial':r'^MAP_LAVENDER_HOUSE_OF_MEMORIES$',
 'celadon-mansion':r'^MAP_CELADON_CONDOMINIUMS_1F$',
 'red-house':r'^MAP_PALLET_TOWN_REDS_HOUSE_1F$',
 'blue-house':r'^MAP_PALLET_TOWN_BLUES_HOUSE_1F$',
 'pewter-house':r'^MAP_PEWTER_(?:NORTHEAST|SOUTHWEST)_HOUSE$',
 'viridian-house':r'^MAP_VIRIDIAN_.*HOUSE',
 'cerulean-house':r'^MAP_CERULEAN_.*HOUSE',
 'vermilion-house':r'^MAP_VERMILION_.*HOUSE',
 'celadon-department-store':r'^MAP_CELADON_DEPARTMENT_STORE_1F$',
 'bills-house':r'^MAP_ROUTE_25_SEA_COTTAGE$',
 'fuchsia-gym':r'^MAP_FUCHSIA_GYM$', 'celadon-gym':r'^MAP_CELADON_GYM$',
 'viridian-gym':r'^MAP_VIRIDIAN_GYM$', 'cerulean-gym':r'^MAP_CERULEAN_GYM$',
 'vermilion-gym':r'^MAP_VERMILION_GYM$', 'saffron-gym':r'^MAP_SAFFRON_GYM$',
}

def main():
 rom=Path(os.environ['HG_ROM']).read_bytes();fs=nitro_files(rom)
 def arc(path):a,b=fs[path];return narc(rom[a:b])
 ids={name:int(v)for name,v in re.findall(r'#define\s+(MAP_\w+)\s+(\d+)',(Path(os.environ['HG_DECOMP'])/'include/constants/maps.h').read_text())}
 names={v:k for k,v in ids.items()};headers={}
 for name,body in re.findall(r'\[(MAP_\w+)\]\s*=\s*\{(.*?)\n\s*\},',(Path(os.environ['HG_DECOMP'])/'src/data/map_headers.h').read_text(),re.S):
  e=re.search(r'\.eventsBank\s*=\s*NARC_zone_event_(\d+)_',body)
  if e and name in ids:headers[ids[name]]=int(e.group(1))
 events=arc('a/0/3/2');lands=arc('a/0/6/5');m=arc('a/0/4/1')[0]
 w,h,hasheads,hasalts,nlen=m[:5];p=5+nlen
 heads=struct.unpack_from('<'+str(w*h)+'H',m,p);p+=2*w*h
 if hasalts:p+=w*h
 maps=struct.unpack_from('<'+str(w*h)+'H',m,p)
 def warps(eventID):
  e=events[eventID];p=0
  for size in (20,32):n=struct.unpack_from('<I',e,p)[0];p+=4+n*size
  n=struct.unpack_from('<I',e,p)[0];p+=4
  return [struct.unpack_from('<4HI',e,p+i*12)for i in range(n)]
 candidates={k:[]for k in TARGET}
 for i,head in enumerate(heads):
  if head not in headers or maps[i]>=len(lands):continue
  b=lands[maps[i]];h0,h1=struct.unpack_from('<II',b);start=b.find(b'BMD0')-h1
  if start<0:continue
  cellx,cellz=i%w,i//w
  for o in range(start,start+h1,48):
   v=struct.unpack_from('<10i',b,o);pos=[x/4096 for x in v[1:4]]
   keys=[k for k in TARGET if FIELD[k]==v[0]]
   if not keys or any(v[4:7]):continue
   for key in keys:
    for wi,(x,z,target,anchor,y) in enumerate(warps(headers[head])):
     if not re.search(TARGET[key],names.get(target,'')):continue
     native=[x*16+8-(cellx*512+256+pos[0]),0,z*16+8-(cellz*512+256+pos[2])]
     # Nearby relevant warp on the front half of the building.
     if abs(native[0])>150 or not -16<=native[2]<=180:continue
     candidates[key].append({'native':native,'sourceMap':names.get(head,str(head)),'sourceMapId':head,'eventMember':headers[head],'warpIndex':wi,'warpTile':[x,z],'target':names.get(target,str(target)),'landMember':maps[i],'worldCell':[cellx,cellz],'propTranslation':pos,'sourceMember':FIELD[key],'distance':math.hypot(native[0],native[2])})
 result={}
 for key,cs in candidates.items():
  if not cs:result[key]={'verified':False,'note':'No matched world-matrix entrance; use visual inspection before integration.'};continue
  cs.sort(key=lambda c:(abs(c['native'][0]),c['distance']))
  c=cs[0];c.pop('distance',None)
  result[key]={'verified':True,'doorNative':c['native'],'basis':'Original warp tile center minus original model placement; Y=0 is local logical floor.','evidence':c,'matches':len(cs)}
 (BASE/'deliverable/door-anchors.json').write_text(json.dumps(result,indent=2)+'\n')
 manifestPath=BASE/'deliverable/manifest.json'
 if manifestPath.exists():
  manifest=json.loads(manifestPath.read_text())
  for a in manifest['assets']:
   anchor=result.get(a['key'],{})
   if anchor.get('verified'):
    a['doorNative']=anchor['doorNative'];a['doorVerified']=True;a['doorEvidence']='door-anchors.json'
  manifest['doorAnchors']='door-anchors.json'
  manifest['museumCollision']='museum-collision.json'
  manifestPath.write_text(json.dumps(manifest,indent=2)+'\n')
 print(json.dumps({k:v.get('doorNative','UNRESOLVED')for k,v in result.items()}))

if __name__=='__main__':main()
