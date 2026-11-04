"""Original 24-bar theme and short musical cues; sample-free synthesis.
No existing Pokémon melody, ROM, sample, or soundfont is used.
"""
from pathlib import Path
import numpy as np, wave
sr=44100;root=Path(__file__).resolve().parent.parent;R=np.random.default_rng(27027)
NAMES={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
def midi(note):
 if note is None:return None
 s=note[:-1];acc=s[1:];return NAMES[s[0]]+(1 if acc=='#' else -1 if acc=='b' else 0)+(int(note[-1])+1)*12
def render_note(n,d,voice='lead'):
 t=np.arange(round(d*sr))/sr;f=440*2**((n-69)/12);p=2*np.pi*f*t
 if voice=='lead':w=np.sin(p)+.24*np.sin(2*p)+.11*np.sin(3*p)+.05*np.sin(4*p);decay=.82+.18*np.exp(-t*9)
 elif voice=='arp':w=np.sin(p+.16*np.sin(p*2))+.1*np.sin(p*3);decay=np.exp(-t*8)
 elif voice=='bass':w=np.sin(p)+.12*np.sin(3*p);decay=.5+.5*np.exp(-t*9)
 else:w=np.sin(p)+.18*np.sin(2*p);decay=np.exp(-t*3)
 envelope=np.minimum(1,t/.007)*np.minimum(1,np.maximum(0,d-t)/.025)*decay
 return w*envelope
chords=[['Eb3','G3','Bb3','D4'],['Ab2','C3','Eb3','G3'],['C3','Eb3','G3','Bb3'],['Bb2','D3','F3','Ab3'],['F3','Ab3','C4','Eb4'],['Bb2','D3','F3','Ab3'],['Eb3','G3','Bb3','D4'],['Bb2','D3','F3','Ab3'], ['Ab2','C3','Eb3','G3'],['Bb2','D3','F3','Ab3'],['G2','Bb2','D3','F3'],['C3','Eb3','G3','Bb3'],['F3','Ab3','C4','Eb4'],['Ab2','C3','Eb3','G3'],['Bb2','D3','F3','Ab3'],['Bb2','D3','F3','Ab3']]
# Phrases have anacrusis, held notes, call/response, and a descending bridge.
phrases=[ [('G4',.5),('Bb4',.5),('C5',.75),('Bb4',.25),('G4',1),('F4',.5),('Eb4',.5)], [('Eb4',.75),('F4',.25),('Ab4',1),('C5',.5),('Bb4',.5),('Ab4',1)], [('G4',1),('Eb4',.5),('G4',.5),('Bb4',1),('G4',.5),(None,.5)], [('F4',.5),('D4',.5),('F4',.5),('Ab4',.5),('Bb4',1.5),(None,.5)], [('Ab4',.75),('C5',.25),('Eb5',1),('C5',.5),('Bb4',.5),('Ab4',1)], [('F4',1),('Ab4',.5),('G4',.5),('F4',1),('D4',.5),('F4',.5)], [('G4',.5),('Bb4',.5),('Eb5',1.5),('D5',.5),('Bb4',.5),('G4',.5)], [('F4',1.5),('D4',.5),('Eb4',1),(None,.5),('G4',.5)], [('C5',1),('Eb5',.75),('D5',.25),('C5',.5),('Bb4',.5),('Ab4',1)], [('Bb4',.5),('F4',.5),('Ab4',1),('D5',.5),('C5',.5),('Bb4',1)], [('Bb4',.75),('D5',.25),('F5',1),('D5',.5),('Bb4',.5),('G4',1)], [('Eb5',1),('D5',.5),('C5',.5),('Bb4',.5),('G4',.5),('Eb4',1)], [('F4',.5),('Ab4',.5),('C5',1),('Eb5',.5),('C5',.5),('Ab4',1)], [('G4',.5),('Ab4',.5),('C5',.75),('Bb4',.25),('Ab4',1),('G4',.5),('F4',.5)], [('D4',.5),('F4',.5),('Ab4',.5),('Bb4',.5),('D5',1),('C5',.5),('Bb4',.5)], [('Ab4',.75),('F4',.25),('D4',1),('F4',1),(None,.5),('Bb4',.5)] ]

def theme(name,tempo,coast=False):
 beat=60/tempo;bars=24;length=bars*4*beat;n=round(length*sr);out=np.zeros((n,2))
 def add(at,pitch,dur,amp,voice='lead',pan=0):
  if pitch is None:return
  w=render_note(pitch,dur,voice)*amp;off=round(at*sr);l=min(len(w),n-off)
  if l>0:out[off:off+l,0]+=w[:l]*np.sqrt((1-pan)/2);out[off:off+l,1]+=w[:l]*np.sqrt((1+pan)/2)
 for bar in range(bars):
  idx=bar if bar<16 else bar-16;c=list(map(midi,chords[idx]));pos=bar*4*beat
  for note,d in phrases[idx]:
   add(pos,midi(note),d*beat*.94,.115 if not coast else .095,'lead',-.08);pos+=d*beat
  for i in range(8):
   p=c[[0,2,1,3,0,2,1,2][i]]+12
   add((bar*4+i*.5)*beat,p,.42*beat,.055,'arp',.4 if i%2 else -.4)
  for at,p in [(0,c[0]-12),(1.5,c[2]-12),(2,c[0]-12),(3.5,c[2]-12)]:add((bar*4+at)*beat,p,.43*beat,.1,'bass',0)
  if bar>=8:
   for at in [1,3]:
    t=np.arange(round(.08*sr))/sr;noise=np.convolve(R.normal(0,1,len(t)),np.ones(8)/8,'same')*np.exp(-t*50)*.008;off=round((bar*4+at)*beat*sr);out[off:off+len(t)]+=noise[:,None]
 for shift,vol in [(.075,.085),(.13,.05)]:out+=np.roll(out,round(shift*sr),axis=0)*vol
 out[:88]*=np.linspace(0,1,88)[:,None];out[-88:]*=np.linspace(1,0,88)[:,None]
 write(name,out)
 print(name,length)
def write(name,out):
 peak=np.max(abs(out));out*=min(1,.6/peak)
 with wave.open(str(root/'sources'/f'{name}.wav'),'wb') as w:w.setnchannels(2 if out.ndim==2 else 1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32767).astype('<i2').tobytes())
def cue(name,seq):
 N=round((sum(d for _,d in seq)+.45)*sr);out=np.zeros(N);pos=0
 for note,d in seq:
  w=render_note(midi(note),d+.25,'pad')*.2;off=round(pos*sr);out[off:off+len(w)]+=w;pos+=d
 write(name,out)
theme('center-original',108)
theme('coast-original',92,True)
cue('heal-original',[('Eb5',.16),('G5',.16),('Bb5',.16),('G5',.2),('C6',.2),('Bb5',.45)])
cue('capture-original',[('G4',.15),('Bb4',.15),('Eb5',.23),('G5',.3),('Eb5',.45)])
cue('loss-original',[('C5',.4),('Bb4',.3),('Ab4',.3),('G4',.4),('Eb4',.7)])
