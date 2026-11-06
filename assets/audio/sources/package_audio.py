"""Package rendered HeartGold tracks, loops, family cues and provenance."""
from pathlib import Path
import json,subprocess,re,hashlib,shutil,os
BASE=Path(__file__).resolve().parent;OUT=BASE/'deliverable'
SEL=json.loads((BASE/'selection.json').read_text())
for x in ['music','sfx','sources']:(OUT/x).mkdir(parents=True,exist_ok=True)
source_sha=hashlib.sha256((BASE/'gs_sound_data.sdat').read_bytes()).hexdigest()
archive_sha=hashlib.sha256((BASE/'heartgold.nds').read_bytes()).hexdigest()
manifest={'schema':1,'created':'2026-11-06','edition':'2.8 · HeartGold, secuencias y muestras originales','source':{'kind':'user-supplied-ROM','game':'Pokémon Edición Oro HeartGold (España)','gameCode':'IPKS','romSha256':archive_sha,'nitroFSPath':'data/sound/gs_sound_data.sdat','sdatSha256':source_sha,'renderer':'DualRip','rendererCommit':'f69e23c63a7d0985a474d0cbaeb2b364174748ac','rendererSource':'https://github.com/TetraSsky/DualRip','rendererLicense':'MIT'},'music':{},'sfx':{}}
processed={}
def volume(path):
 p=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True)
 vals={k:float(v) for k,v in re.findall(r'(mean_volume|max_volume): ([\-0-9.]+) dB',p.stderr)}
 return vals['mean_volume'],vals['max_volume']
def encode(sid,kind,key):
 if (kind,sid) in processed:return processed[kind,sid]
 meta=json.loads((BASE/'raw'/f'{sid}.json').read_text());src=BASE/'raw'/f'{sid}.wav'
 mean,peak=volume(src);gain=min((-20 if kind=='music' else -23)-mean,(-3 if kind=='music' else -11)-peak)
 rel=f'{kind}/{key}.'+('ogg' if kind=='music' else 'wav');target=OUT/rel;temporary=target.with_name(target.stem+'.partial'+target.suffix)
 af=f'volume={gain:.6f}dB'
 if kind=='sfx':af+=f',afade=t=out:st={max(0,meta["duration"]-.025):.6f}:d=0.025'
 args=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(src),'-af',af,'-ar','32000']
 args+=['-c:a','libvorbis','-q:a','0'] if kind=='music' else ['-ac','1','-c:a','pcm_s16le']
 subprocess.run(args+[str(temporary)],check=True);os.replace(temporary,target)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=sample_rate,channels','-of','json',str(target)],text=True))
 data=target.read_bytes();res={'file':rel,'duration':float(probe['format']['duration']),'loop':meta['loop'] if kind=='music' else False,'loopStart':(meta['loopStart'] or 0) if kind=='music' else 0,'loopEnd':meta['loopEnd'] if kind=='music' else None,'sampleRate':32000,'channels':2 if kind=='music' else 1,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'sourceSequenceId':sid,'sourceSequenceName':meta['sequenceName'],'sourceBankId':meta['bank'],'author':'GAME FREAK / Nintendo / Creatures','license':'User-supplied game resource; original copyright retained','licenseUrl':None,'sourceUrl':None,'gainDb':round(gain,4),'sourceRmsDbFS':mean,'sourcePeakDbFS':peak,'processing':'Original SSEQ events and SBNK/SWAR samples rendered at 32000 Hz. Mixer attenuated before PCM conversion; constant mastering gain; no tempo or pitch change. Intro and one complete steady-state loop; 5 ms bridge before loop entry. Ogg Vorbis quality 0 stereo.' if kind=='music' else 'Original HeartGold sequence and samples, 32000 Hz mono PCM; constant gain and 25 ms ending fade; no tempo or pitch change. Native rests and releases kept, trailing digital silence capped at 80 ms.'}
 _,outpeak=volume(target);res['peakDbFS']=outpeak
 processed[kind,sid]=res;return res
for key,(sid,title) in SEL['music'].items():
 res=dict(encode(sid,'music',key));res['title']=title;manifest['music'][key]=res
for key,sid in SEL['sfx'].items():
 res=dict(encode(sid,'sfx',key));res['title']=f'HeartGold · {key}';manifest['sfx'][key]=res
for alias,base in {'red':'champion','vermilion':'coast','saffron':'town'}.items():manifest['music'][alias]=dict(manifest['music'][base])
unique={v['file']:v for g in ['music','sfx'] for v in manifest[g].values()}
manifest['totals']={'musicBytes':sum(v['bytes'] for k,v in unique.items() if k.startswith('music/')),'sfxBytes':sum(v['bytes'] for k,v in unique.items() if k.startswith('sfx/')),'largestFileBytes':max(v['bytes'] for v in unique.values()),'uniqueMusicFiles':len([k for k in unique if k.startswith('music/')]),'uniqueSfxFiles':len([k for k in unique if k.startswith('sfx/')])}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
keys=['file','duration','loop','loopStart','loopEnd'];cat={kind:{key:{k:v[k] for k in keys} for key,v in manifest[kind].items()} for kind in ['music','sfx']}
(OUT/'audio-data.js').write_text('const AUDIO_CATALOG='+json.dumps(cat,separators=(',',':'),ensure_ascii=False)+';\n')
for fn in ['render_selected.py','package_audio.py','extract_hg.py','selection.json']:shutil.copy2(BASE/fn,OUT/'sources'/fn)
shutil.copy2(BASE/'DualRip/LICENSE',OUT/'sources/DualRip-LICENSE.txt')
shutil.copy2(BASE/'CREDITS.md',OUT/'CREDITS.md')
shutil.copy2(BASE/'INTEGRATION.md',OUT/'INTEGRATION.md')
print(json.dumps(manifest['totals']))
