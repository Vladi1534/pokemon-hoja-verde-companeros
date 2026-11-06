"""Render the supplied HeartGold sound archive; no game executable is run."""
from pathlib import Path
import concurrent.futures,json,sys
BASE=Path(__file__).resolve().parent
sys.path[:0]=[str(BASE/'python-deps'),str(BASE/'DualRip')]
from dualrip.formats.sdat import SdatFile
from dualrip.export import render_one,write_wav
MUSIC={
 'town':(1039,'Ciudad Azafrán'), 'route':(1048,'Ruta 1'), 'forest':(1083,'Bosque Verde'), 'cave':(1082,'Túnel Roca'),
 'wild':(1125,'Combate contra Pokémon salvaje · Kanto'), 'trainer':(1126,'Combate contra entrenador · Kanto'),
 'leader':(1127,'Combate contra líder de gimnasio · Kanto'), 'rocket':(1120,'Combate contra el Team Rocket'),
 'champion':(1124,'Combate contra Lance / Rojo'), 'center':(1063,'Centro Pokémon'), 'coast':(1038,'Ciudad Carmín'),
 'victory':(1128,'Victoria contra entrenador'), 'fanfare':(1189,'Medalla obtenida'), 'heal':(1183,'Descanso y recuperación'),
 'capture':(1187,'Pokémon capturado'), 'loss':(1796,'Pokémon debilitado'), 'title':(1005,'Título HeartGold'),
 'cycling':(1013,'Bicicleta'), 'giovanni':(1120,'Combate contra el Team Rocket'),
 'pallet':(1046,'Pueblo Paleta'),'viridian':(1045,'Ciudad Verde'),'pewter':(1044,'Ciudad Plateada'),
 'cerulean':(1040,'Ciudad Celeste'),'lavender':(1041,'Pueblo Lavanda'),'celadon':(1042,'Ciudad Azulona'),
 'fuchsia':(1043,'Ciudad Fucsia'),'cinnabar':(1047,'Isla Canela'),'route3':(1051,'Ruta 3'),
 'route24':(1061,'Ruta 24'),'gym':(1065,'Gimnasio Pokémon'),'lab':(1103,'Laboratorio del Profesor Oak'),
 'league':(1085,'Liga Pokémon'),'victoryWild':(1129,'Victoria contra Pokémon salvaje'),'victoryLeader':(1131,'Victoria contra líder')
}
SFX={
 'normal':1790,'fighting':1905,'scratch':1908,'bite':1934,'water':1941,'fire':1937,'grass':1955,
 'electric':1968,'psychic':1985,'ice':1946,'rock':1972,'ground':1973,'wind':1914,'poison':1929,
 'ghost':1994,'dragon':1965,'steel':2038,'bug':1963,'dark':2016,'status':1928,
 'heal':1516,'faint':1796,'menu':1500,'confirm':1501,'cancel':2368,'denied':1536,
 'item':1185,'alert':1389,'portal':1539,'capture':1801,'escape':1791,'hit':1790,'energy':1985,'critical':1788,'levelup':1184
}
def render(sid):
 import numpy as np
 s=SdatFile(str(BASE/'gs_sound_data.sdat'));arc=s.sequence(sid);entry=arc.entries[0]
 r=render_one(s,arc,entry,32000)
 if r.status not in ('ok','loop'):raise RuntimeError((sid,r.status,r.error,r.reason))
 data=r.audio;loop=None;start=None;end=None
 if r.loop_start is not None:
  # DualRip marks the second, steady-state pass. Retain the intro and that full loop.
  a=round(r.loop_start*32000);b=round(r.loop_end*32000);intro=max(0,2*a-b)
  data=np.concatenate([data[:intro],data[a:b]])
  # Bridge only the end of the intro; leave the repeated loop samples unmodified.
  blend=min(160,intro,a)
  if blend:
   fade=np.linspace(0,1,blend,endpoint=False)[:,None]
   data[intro-blend:intro]=np.round(data[intro-blend:intro]*(1-fade)+r.audio[a-blend:a]*fade).astype(np.int16)
  loop=(intro,len(data));start=intro/32000;end=len(data)/32000
 else:
  active=np.flatnonzero(np.any(data!=0,axis=1))
  if len(active):data=data[:min(len(data),int(active[-1])+2561)]
 out=BASE/'raw';out.mkdir(exist_ok=True)
 write_wav(str(out/f'{sid}.wav'),data,32000,loop)
 result={'sequenceId':sid,'sequenceName':arc.name,'bank':entry.bank_id,'sourceEntryVolume':entry.volume,'duration':len(data)/32000,'loop':bool(loop),'loopStart':start,'loopEnd':end,'peak':int(np.abs(data.astype(np.int32)).max()),'clippedSamples':int((np.abs(data.astype(np.int32))>=32767).sum()),'originalRenderDuration':r.duration,'originalLoopStart':r.loop_start,'originalLoopEnd':r.loop_end}
 (out/f'{sid}.json').write_text(json.dumps(result,indent=2))
 return result
if __name__=='__main__':
 (BASE/'selection.json').write_text(json.dumps({'music':MUSIC,'sfx':SFX},indent=2,ensure_ascii=False))
 ids=sorted(set(v[0] for v in MUSIC.values())|set(SFX.values()))
 missing=[i for i in ids if not (BASE/'raw'/f'{i}.json').exists()]
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
  for r in pool.map(render,missing):print(json.dumps(r),flush=True)
