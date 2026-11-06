#!/usr/bin/env python3
"""Extract all layouts, encounter slots and source-labelled dynamic map operations."""
import argparse,hashlib,json,re,struct
from pathlib import Path
from extract_leafgreen_maps import Rom,dump,source_metadata

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--rom',type=Path,required=True);ap.add_argument('--decomp',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
 rom=Rom(a.rom);root=a.decomp;out=a.out
 idx=json.loads((out/'index.json').read_text());maps=idx['maps'];by_symbol={m['symbol']:m for m in maps}
 layouts=json.loads((root/'data/layouts/layouts.json').read_text())['layouts'];pallet=next(m for m in maps if m['name']=='PalletTown')
 pm=json.loads((out/f'maps/{pallet["id"]}.json').read_text());lp=pm['source']['layoutOffset'];candidates=[]
 for ref in rom.refs(lp):
  base=ref-(pm['layoutId']-1)*4
  try:
   for i,l in enumerate(layouts):
    if 'id' not in l:continue
    p=rom.ptr(base+i*4)
    if (rom.u32(p),rom.u32(p+4))!=(l['width'],l['height']):raise ValueError()
  except (ValueError,IndexError,struct.error):continue
  candidates.append(base)
 assert len(candidates)==1,candidates
 table=candidates[0];extracted=[]
 used={m['layoutId'] for m in maps}
 for i,l in enumerate(layouts):
  if 'id' not in l:continue
  p=rom.ptr(table+i*4);w,h=rom.u32(p),rom.u32(p+4);bp,mp=rom.ptr(p+8),rom.ptr(p+12)
  raw=rom.data[mp:mp+w*h*2];blocks=list(struct.unpack('<'+'H'*(w*h),raw));bw,bh=rom.u8(p+24),rom.u8(p+25)
  e={'layoutId':i+1,'symbol':l['id'],'name':l['name'],'w':w,'h':h,
     'primaryTileset':l['primary_tileset'],'secondaryTileset':l['secondary_tileset'],
     'blocks':[blocks[y*w:(y+1)*w] for y in range(h)],
     'border':{'w':bw,'h':bh,'blocks':list(struct.unpack_from('<'+'H'*(bw*bh),rom.data,bp))},
     'defaultForMap':i+1 in used,'sourceOffset':p,'blockOffset':mp,'sha256':hashlib.sha256(raw).hexdigest(),
     'matchesReference':raw==(root/l['blockdata_filepath']).read_bytes()}
  extracted.append(e)
 dump(out/'all-layouts.json',{'tableOffset':table,'layoutCount':len(extracted),'nullSlots':len(layouts)-len(extracted),'layouts':extracted})

 wg=json.loads((root/'src/data/wild_encounters.json').read_text())['wild_encounter_groups'][0]
 refs=[e for e in wg['encounters'] if 'FireRed' not in e['base_label']]
 code=bytes([by_symbol[refs[0]['map']]['bank'],by_symbol[refs[0]['map']]['number'],0,0]);hits=[]
 for p in rom.hits(code):
  try:
   for i,e in enumerate(refs):
    h=p+i*20;m=by_symbol[e['map']]
    if rom.u8(h)!=m['bank'] or rom.u8(h+1)!=m['number']:raise ValueError()
    for j,field in enumerate(['land_mons','water_mons','rock_smash_mons','fishing_mons']):
     q=rom.ptr(h+4+j*4,True)
     if field in e:
      if q is None or rom.u8(q)!=e[field]['encounter_rate']:raise ValueError()
      rom.ptr(q+4)
     elif q is not None:raise ValueError()
  except (ValueError,IndexError,struct.error):continue
  hits.append(p)
 assert len(hits)==1,hits
 encs=[];species={int(v,0):n for n,v in re.findall(r'#define\s+(SPECIES_\w+)\s+(\d+|0x[0-9A-Fa-f]+)\b',(root/'include/constants/species.h').read_text())}
 for i,e in enumerate(refs):
  h=hits[0]+i*20;m=by_symbol[e['map']];entry={'mapId':m['id'],'mapName':m['name'],'sourceLabel':e['base_label'],'tableIndex':i,'sourceOffset':h,'time':'all'}
  for j,field in enumerate(wg['fields']):
   q=rom.ptr(h+4+j*4,True)
   if q is None:continue
   mp=rom.ptr(q+4);slots=[]
   for slot,weight in enumerate(field['encounter_rates']):
    p=mp+slot*4;sid=rom.u16(p+2)
    n={'minLevel':rom.u8(p),'maxLevel':rom.u8(p+1),'speciesId':sid,'speciesSymbol':species.get(sid),'weightPercent':weight}
    if 'groups' in field:n['rod']=next(k for k,v in field['groups'].items() if slot in v)
    slots.append(n)
   entry[field['type']]={'encounterRate':rom.u8(q),'infoOffset':q,'monsOffset':mp,'slots':slots}
  encs.append(entry)
 dump(out/'wild-encounters-leafgreen.json',{'source':'Supplied BPGS ROM','tableOffset':hits[0],
      'timeNote':'LeafGreen has no day/night encounter split. Any added day/night pools must be labelled as game adaptation.',
      'entries':encs},True)

 constants={}
 for f in [root/'include/constants/metatile_labels.h']:
  constants.update({n:int(v,0) for n,v in re.findall(r'#define\s+(\w+)\s+(0x[0-9a-fA-F]+|\d+)\b',f.read_text())})
 constants.update({l['symbol']:l['layoutId'] for l in extracted})
 operations=[];files=list((root/'data/maps').glob('*/scripts.inc'))+list((root/'data/scripts').glob('*.inc'))
 for f in sorted(files):
  label=None
  for lineno,line in enumerate(f.read_text().splitlines(),1):
   match=re.match(r'^(\w+)::?\s*$',line)
   if match:label=match[1]
   match=re.match(r'^\s*(setmetatile|setmaplayoutindex|setwarp|setdynamicwarp|setobjectxyperm|setobjectmovementtype)\s+(.+?)\s*(?:@.*)?$',line)
   if not match:continue
   command,args=match.groups();params=[s.strip() for s in args.split(',')]
   values=[]
   for param in params:
    try:values.append(int(param,0))
    except ValueError:values.append(constants.get(param))
   operations.append({'sourceFile':str(f.relative_to(root)),'line':lineno,'script':label,'command':command,'args':params,'resolved':values})
 dump(out/'scripted-map-operations.json',{'source':'pret/pokefirered at index.json reference.commit',
     'note':'Commands labelled for reimplementation. This is not an event interpreter; conditions/calls must be carried over from referenced scripts.',
     'operations':operations},True)
 print(json.dumps({'layoutTable':hex(table),'layouts':len(extracted),'allMatchReference':all(x['matchesReference'] for x in extracted),
   'alternateOrUnusedLayouts':sum(not x['defaultForMap'] for x in extracted),'encounterTable':hex(hits[0]),'encounterEntries':len(encs),'scriptedOperations':len(operations)},indent=2))

if __name__=='__main__':main()
