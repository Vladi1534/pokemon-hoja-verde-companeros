"""Read NitroFS from a user-provided HeartGold .nds/.zip; extract only the SDAT."""
from pathlib import Path
import zipfile,struct,json,sys
src=Path(sys.argv[1]);out=Path(sys.argv[2] if len(sys.argv)>2 else '.');out.mkdir(parents=True,exist_ok=True)
if src.suffix.lower()=='.zip':
 with zipfile.ZipFile(src) as z:
  names=[n for n in z.namelist() if n.lower().endswith('.nds')];assert len(names)==1,'Expected one NDS image'
  r=z.read(names[0])
else:r=src.read_bytes()
assert r[:12].startswith(b'POKEMON HG') and r[12:16]==b'IPKS','Expected supplied Spanish HeartGold image'
(out/'heartgold.nds').write_bytes(r)
a,l,f,n=struct.unpack_from('<IIII',r,0x40);assert a+l<=len(r) and f+n<=len(r)
fnt=r[a:a+l];fat=r[f:f+n];files=[]
def visit(folder,index,depth=0):
 assert depth<32
 off,start,parent=struct.unpack_from('<IHH',fnt,index*8)
 while fnt[off]:
  v=fnt[off];off+=1;name=fnt[off:off+(v&127)].decode();off+=v&127
  if v&128:
   child=struct.unpack_from('<H',fnt,off)[0];off+=2;visit(folder+name+'/',child&4095,depth+1)
  else:
   x,y=struct.unpack_from('<II',fat,start*8);assert 0<=x<=y<=len(r)
   files.append({'path':folder+name,'fileId':start,'offset':x,'size':y-x});start+=1
visit('',0);(out/'rom-files.json').write_text(json.dumps(files,indent=2))
s=next(x for x in files if x['path']=='data/sound/gs_sound_data.sdat')
b=r[s['offset']:s['offset']+s['size']];assert b[:4]==b'SDAT';(out/'gs_sound_data.sdat').write_bytes(b)
print('Extracted data only:',len(b),'bytes')
