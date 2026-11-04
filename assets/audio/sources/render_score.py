"""Render CC0 northivanastan score with sample-free soft chip instruments.
No proprietary soundfont is used. Score pitches/rhythms/harmony are unchanged.
"""
from pathlib import Path
import xml.etree.ElementTree as X
import numpy as np, wave,json
root=Path(__file__).resolve().parent.parent;sr=44100
import zipfile
with zipfile.ZipFile(root/'sources/battle-score.mscz') as packed:
 score=X.fromstring(packed.read('Let_The_Battles_Begin!.mscx')).find('Score')
beat=1/float(score.find('.//Tempo/tempo').text);bar=4*beat;dur=bar*34;N=round(sr*dur)
D={'whole':4,'half':2,'quarter':1,'eighth':.5,'16th':.25,'32nd':.125,'measure':4}
out=np.zeros((N,2),dtype=np.float64)
for staff in score.findall('Staff'):
 sid=int(staff.attrib['id']);amp={1:.085,2:.15,3:.16,4:.065}[sid];pan={1:-.22,2:.12,3:0,4:.3}[sid]
 for mi,m in enumerate(staff.findall('Measure')):
  pos=mi*bar
  for el in m.find('voice'):
   if el.tag not in ['Chord','Rest']:continue
   ds=D[el.findtext('durationType')]*beat*(2-2**(-int(el.findtext('dots','0'))))
   if el.tag=='Chord':
    for note in el.findall('Note'):
     pitch=int(note.findtext('pitch'));f=440*2**((pitch-69)/12);length=round(ds*sr);t=np.arange(length)/sr
     vibrato=(.0015 if sid in [2,4] else 0)*np.sin(2*np.pi*5.3*t)*np.minimum(1,t/.13)
     phase=2*np.pi*np.cumsum(f*(1+vibrato))/sr
     if sid==3:w=np.sin(phase)+.12*np.sin(3*phase)+.04*np.sin(5*phase)
     elif sid==4:w=np.sin(phase)+.21*np.sin(2*phase)+.1*np.sin(3*phase)
     else:
      # Band-limited pulse character with a rounded top, avoiding harsh square edges.
      duty=.33 if sid==1 else .43
      w=sum((np.sin(np.pi*k*duty)/k)*np.sin(phase*k)*(.84**(k-1)) for k in range(1,9))
     env=np.minimum(1,t/(.006 if sid<4 else .025))*np.minimum(1,np.maximum(0,ds-t)/min(.04,ds*.16))
     if sid in [1,3]:env*=.55+.45*np.exp(-t*12)
     elif sid==2:env*=.8+.2*np.exp(-t*14)
     w*=env*amp/max(1,len(el.findall('Note')))**.5
     idx=round(pos*sr);l=min(length,N-idx)
     if l>0:out[idx:idx+l,0]+=w[:l]*np.sqrt((1-pan)/2);out[idx:idx+l,1]+=w[:l]*np.sqrt((1+pan)/2)
   pos+=ds
  assert abs(pos-(mi+1)*bar)<1e-7,(sid,mi,pos)
# A light original chip drum accompaniment supports the 120 BPM score.
rng=np.random.default_rng(273)
for b in range(136):
 at=round(b*beat*sr);t=np.arange(round(.12*sr))/sr
 if b%2==0:
  phase=2*np.pi*(55*t+(95-55)*.022*(1-np.exp(-t/.022)))
  w=np.sin(phase)*np.exp(-t*36)*.045
 else:
  w=np.convolve(rng.normal(0,1,len(t)),np.ones(4)/4,'same')*np.exp(-t*35)*.014
 w*=np.minimum(1,t/.003);out[at:at+len(w)]+=w[:,None]
# Circular room delay preserves seam continuity; no fade-out between loops.
for delay,gain in [(.073,.07),(.119,.045)]:out+=np.roll(out,round(delay*sr),axis=0)*gain
out*=.68/max(.68,np.max(abs(out)));out[:88]*=np.linspace(0,1,88)[:,None];out[-88:]*=np.linspace(1,0,88)[:,None]
p=root/'sources/trainer-render.wav'
with wave.open(str(p),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32767).astype('<i2').tobytes())
print('Score rendered:',dur,'seconds, 34 measures, 753 notated notes; peak',float(np.max(abs(out))))
