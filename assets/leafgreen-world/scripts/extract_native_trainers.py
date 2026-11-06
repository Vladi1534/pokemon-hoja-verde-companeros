#!/usr/bin/env python3
"""Extract Spanish trainer table/parties and link map objects to trainer scripts."""
import argparse,collections,json,re,struct
from pathlib import Path
from extract_leafgreen_maps import Rom,dump,BASE

def constants(path,prefix):
 return {n:int(v,0) for n,v in re.findall(r'#define\s+('+prefix+r'\w+)\s+(0x[0-9A-Fa-f]+|\d+)\b',path.read_text())}

def script_blocks(root):
 result={}
 for f in sorted((root/'data').rglob('*.inc')):
  text=f.read_text();matches=list(re.finditer(r'^(\w+)::?\s*$',text,re.M))
  for i,m in enumerate(matches):
   result[m.group(1)]={'file':str(f.relative_to(root)),'body':text[m.end():matches[i+1].start() if i+1<len(matches) else len(text)]}
 return result

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--rom',type=Path,required=True);ap.add_argument('--decomp',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
 rom=Rom(a.rom);root=a.decomp;out=a.out
 trainer_ids=constants(root/'include/constants/opponents.h','TRAINER_');species_ids=constants(root/'include/constants/species.h','SPECIES_')
 species_names={v:k for k,v in species_ids.items()};move_names={v:k for k,v in constants(root/'include/constants/moves.h','MOVE_').items()}
 classes={v:k for k,v in constants(root/'include/constants/trainers.h','TRAINER_CLASS_').items()}
 char_text=(root/'charmap.txt').read_text();chars={}
 # charmap.txt later defines a Japanese font page with the same byte values.
 # BPGS uses the FIRST (international) page; never overwrite it with that page.
 for c,v in re.findall(r"^'(.*?)'\s*=\s*([0-9A-F]{2})\s*$",char_text,re.M):chars.setdefault(int(v,16),c)
 enc={c:n for n,c in chars.items()};chars.update({0x53:'POKé',0x54:'MON',0x79:'↑',0x7a:'↓',0x7b:'←',0x7c:'→'})
 placeholders={1:'{PLAYER}',2:'{STR_VAR_1}',3:'{STR_VAR_2}',4:'{STR_VAR_3}',6:'{RIVAL}'}
 def text_at(p,limit=2048):
  if not(0<=p<len(rom.data)):return None
  result=[];i=p
  while i<min(p+limit,len(rom.data)):
   b=rom.u8(i);i+=1
   if b==0xff:return ''.join(result).replace('\\n','\n').replace('\\p','\n\n').replace('\\l','\n')
   if b in [0xfa,0xfb,0xfe]:result.append('\n\n' if b==0xfb else '\n');continue
   if b==0xfd:
    n=rom.u8(i);i+=1;result.append(placeholders.get(n,f'{{VAR_{n}}}'));continue
   if b==0xfc:return None  # skip formatted text rather than guess control lengths
   if b not in chars:return None
   result.append(chars[b])
  return None
 # Locate gTrainers with a stable named leader, then validate every party pointer.
 needle=bytes(enc[c] for c in 'BROCK')+b'\xff';count=max(trainer_ids.values())+1;candidates=[]
 for hit in rom.hits(needle):
  table=hit-4-trainer_ids['TRAINER_LEADER_BROCK']*40
  if table<0:continue
  try:
   for tid in range(1,count):
    p=table+tid*40;flags=rom.u8(p);size=rom.u8(p+32);pp=rom.ptr(p+36)
    if flags>3 or not(1<=size<=6):raise ValueError()
    stride=[8,16,8,16][flags]
    for j in range(size):
     q=pp+j*stride
     if not(1<=rom.u8(q+2)<=100) or not(1<=rom.u16(q+4)<=439):raise ValueError()
  except (ValueError,IndexError,struct.error):continue
  candidates.append(table)
 assert len(candidates)==1,candidates
 table=candidates[0];source=(root/'src/data/trainers.h').read_text();partysource=(root/'src/data/trainer_parties.h').read_text()
 partyblocks={name:body for typ,name,body in re.findall(r'static const struct (\w+) (sParty_\w+)\[\]\s*=\s*\{[ \t]*\n(.*?)^\};',partysource,re.S|re.M)}
 source_trainers={}
 for symbol,body in re.findall(r'^\s*\[(TRAINER_\w+)\]\s*=\s*\{(.*?)^\s*\},',source,re.S|re.M):
  name=re.search(r'\.trainerName\s*=\s*_\("([^"]*)"\)',body);party=re.search(r'\.party\s*=\s*(\w+)\((sParty_\w+)\)',body)
  source_trainers[symbol]={'nameEnglish':name.group(1) if name else None,'partySymbol':party.group(2) if party else None}
 reverse={v:k for k,v in trainer_ids.items()};trainers={};comparisons=0;differences=[]
 for tid in range(count):
  p=table+tid*40;flags=rom.u8(p);size=rom.u8(p+32);pp=rom.ptr(p+36,True);team=[]
  for j in range(size):
   q=pp+j*[8,16,8,16][flags];sid=rom.u16(q+4)
   mon={'speciesId':sid,'speciesSymbol':species_names.get(sid),'level':rom.u8(q+2),'ivScale255':rom.u16(q),
        'heldItemId':rom.u16(q+6) if flags&2 else 0}
   if flags&1:
    offset=q+(8 if flags&2 else 6);moves=[rom.u16(offset+i*2) for i in range(4)]
    mon['moves']=moves;mon['moveSymbols']=[move_names.get(n) for n in moves]
   else:mon['moves']='default-level-up'
   team.append(mon)
  symbol=reverse.get(tid);s=source_trainers.get(symbol,{})
  trainer={'id':tid,'symbol':symbol,'nameSpanish':text_at(p+4,12),'nameEnglish':s.get('nameEnglish'),
           'classId':rom.u8(p+1),'classSymbol':classes.get(rom.u8(p+1)),'genderFemale':bool(rom.u8(p+2)&128),
           'encounterMusicId':rom.u8(p+2)&127,'trainerPicId':rom.u8(p+3),
           'battleItems':[rom.u16(p+16+i*2) for i in range(4) if rom.u16(p+16+i*2)],
           'doubleBattle':bool(rom.u8(p+24)),'aiFlags':rom.u32(p+28),'partyFlags':flags,
           'team':team,'sourceOffset':p,'partyOffset':pp,'partySymbol':s.get('partySymbol')}
  body=partyblocks.get(s.get('partySymbol'))
  if body:
   expected=[(species_ids[sp],int(lvl)) for lvl,sp in re.findall(r'\.lvl\s*=\s*(\d+),\s*\.species\s*=\s*(SPECIES_\w+)',body)]
   actual=[(m['speciesId'],m['level']) for m in team]
   if expected:
    comparisons+=1
    if expected!=actual:differences.append({'id':tid,'expected':expected,'actual':actual})
  trainers[str(tid)]=trainer
 dump(out/'native-trainers.json',{'schema':'leafgreen-native-trainers/v1','source':'Supplied BPGS ROM',
      'tableOffset':table,'count':count,'partySpeciesAndLevelsComparedToSource':comparisons,'differences':differences,'trainers':trainers})
 assert not differences,differences[:5]
 # Script traversal is for IDs only; no script bytecode is executed.
 scripts=script_blocks(root)
 def collect_trainers(label,seen=None,depth=0):
  seen=set() if seen is None else seen
  if label in seen or label not in scripts or depth>10:return []
  seen.add(label);body=scripts[label]['body'];result=[]
  for symbol in re.findall(r'\btrainerbattle(?:_\w+)?\s+(TRAINER_\w+)',body):
   if symbol in trainer_ids:result.append(trainer_ids[symbol])
  for cmdline in body.splitlines():
   if re.match(r'^\s*(?:call|goto)(?:_\w+)?\s',cmdline):
    labels=[x for x in re.findall(r'\b[A-Za-z_]\w+\b',cmdline) if x in scripts]
    for nxt in labels:result.extend(collect_trainers(nxt,seen,depth+1))
  return list(dict.fromkeys(result))
 idx=json.loads((out/'index.json').read_text());objects=[];dialogs=[];unresolved=[]
 for brief in idx['maps']:
  m=json.loads((out/f'maps/{brief["id"]}.json').read_text())
  for e in m['events']['objects']:
   script=e.get('symbols',{}).get('script');addr=e.get('scriptAddress',0);sp=addr-BASE if addr>=BASE else None
   refs=collect_trainers(script);direct=None;intro=None;defeat=None;btype=None
   if sp is not None and rom.u8(sp)==0x5c:
    direct=rom.u16(sp+2);btype=rom.u8(sp+1)
    if direct>=count:direct=None
    if direct is not None:
     refs=[direct]+[i for i in refs if i!=direct]
     try:
      if btype==3:defeat=text_at(rom.ptr(sp+6))
      else:intro=text_at(rom.ptr(sp+6));defeat=text_at(rom.ptr(sp+10))
     except ValueError:pass
   if refs:
    obj={'nativeMapId':m['id'],'mapName':m['name'],'eventIndex':e['index'],'localId':e['localId'],
         'x':e['x'],'y':e['y'],'trainerType':e['trainerType'],'sight':e['trainerRange'],'script':script,
         'initialTrainerId':direct if direct is not None else refs[0],
         'trainerIds':refs,'resolution':'direct-ROM-opcode' if direct is not None else 'source-script-call-graph',
         'battleType':btype,'introSpanish':intro,'defeatSpanish':defeat}
    if direct is None and len(refs)>1:obj['conditionNote']='Multiple conditional trainer IDs; inspect referenced script before selecting (starter variant/rematch/etc).'
    objects.append(obj)
   elif e['trainerType'] in [1,2,3] and e['kind']!=255:unresolved.append({'map':m['name'],'event':e['index'],'trainerType':e['trainerType'],'script':script})
   if sp is not None:
    q=sp
    # Only exact simple prefix grammar: lock/lockall/faceplayer then loadword0.
    for _ in range(5):
     if rom.u8(q) in [0x69,0x6a,0x5a]:q+=1
     else:break
    if rom.data[q:q+2]==b'\x0f\x00' and rom.u8(q+6)==0x09:
     text=text_at(rom.ptr(q+2))
     if text is not None:dialogs.append({'nativeMapId':m['id'],'mapName':m['name'],'eventIndex':e['index'],
        'localId':e['localId'],'script':script,'x':e['x'],'y':e['y'],'textSpanish':text,'textOffset':rom.ptr(q+2),
        'messageMode':rom.u8(q+7),'resolution':'direct-ROM-simple-msgbox'})
 dump(out/'native-trainer-objects.json',{'objects':objects,'unresolvedTrainerObjects':unresolved},True)
 dump(out/'native-simple-dialogues-es.json',{'note':'Only exact direct initial msgbox text. Conditions/multi-page script branches are not interpreted. Placeholders are retained.',
      'objects':dialogs},True)
 print(json.dumps({'trainerTable':hex(table),'trainers':count,'sourcePartyComparisons':comparisons,'partyDifferences':len(differences),
    'mappedTrainerObjects':len(objects),'unresolvedTrainerObjects':len(unresolved),'simpleSpanishDialogues':len(dialogs),
    'trainerIntrosSpanish':sum(bool(o['introSpanish']) for o in objects)},indent=2))

if __name__=='__main__':main()
