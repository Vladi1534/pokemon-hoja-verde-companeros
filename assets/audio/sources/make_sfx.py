"""Original, sample-free battle effects. All oscillator/noise source is below.
Project-original output; no third-party recording or melody is sampled.
"""
import numpy as np, wave, pathlib, hashlib, json
SR=44100;R=np.random.default_rng(27011);OUT=pathlib.Path(__file__).resolve().parent.parent/'sfx'
def axis(d):return np.arange(round(d*SR))/SR
def env(n,a=.006,r=.08):
 e=np.ones(n);na=min(n,round(a*SR));nr=min(n-na,round(r*SR));e[:na]=np.linspace(0,1,na)**1.3
 if nr:e[-nr:]=np.linspace(1,0,nr)**1.3
 return e
def tone(f,d,kind='sine',decay=0):
 t=axis(d);p=2*np.pi*f*t
 if kind=='bell':s=np.sin(p)+.26*np.sin(p*2)+.1*np.sin(p*3)
 elif kind=='triangle':s=sum(((-1)**((k-1)//2))*np.sin(k*p)/(k*k) for k in [1,3,5,7])
 elif kind=='warm':s=np.sin(p)+.18*np.sin(p*2)+.1*np.sin(p*3)
 else:s=np.sin(p)
 return s*env(len(t),r=min(.08,d*.3))*np.exp(-decay*t)
def softnoise(d,low=4):
 n=R.normal(0,1,len(axis(d)));n=np.convolve(n,np.ones(low)/low,'same');return n/max(.001,np.std(n))*env(len(n),.015,min(.1,d*.4))
def mix(d,parts):
 out=np.zeros(round(d*SR))
 for at,s,amp in parts:
  off=round(at*SR);end=min(len(out),off+len(s))
  if end>off:out[off:end]+=s[:end-off]*amp
 return out
def notes(seq,d=.11,start=0,kind='bell'):
 return [(start+i*d,tone(f,d*1.8,kind,8),.25) for i,f in enumerate(seq)]
def noise_puff(d,amp=1):
 t=axis(d);return softnoise(d,12)*np.exp(-t*15)*amp
fx={}
fx['normal']=mix(.25,[(0,tone(125,.16,'warm',24),.9),(.005,noise_puff(.13),.17)])
fx['fighting']=mix(.3,[(0,tone(110,.19,'warm',19),.9),(.06,tone(180,.12,'triangle',22),.28),(.008,noise_puff(.18),.2)])
fx['scratch']=mix(.32,[(t,softnoise(.075,7),.17) for t in (0,.095,.19)])
fx['bite']=mix(.28,[(0,tone(170,.1,'warm',28),.7),(.12,tone(110,.14,'warm',28),.65),(.12,noise_puff(.11),.15)])
fx['water']=mix(.52,[(0,softnoise(.46,24),.1)]+[(t,tone(f,.12,'sine',18),a) for t,f,a in [(0,620,.3),(.075,430,.26),(.15,780,.23),(.24,520,.2),(.34,880,.16)]])
fx['fire']=mix(.46,[(0,softnoise(.4,20),.2),(.03,tone(110,.24,'warm',15),.23),(.15,noise_puff(.18),.08)])
fx['grass']=mix(.42,[(0,softnoise(.3,12),.09),(.02,tone(440,.11,'triangle',19),.22),(.13,tone(660,.13,'triangle',19),.19),(.25,tone(880,.14,'bell',19),.13)])
fx['electric']=mix(.31,[(at,tone(f,.065,'triangle',28),.22) for at,f in [(0,880),(.075,1320),(.15,660),(.22,1760)]])
fx['psychic']=mix(.66,notes([523.25,659.25,783.99],.12,kind='bell')+[(.1,tone(261.63,.55,'warm',4),.1)])
fx['ice']=mix(.47,notes([1046.5,1318.5,1568],.075,kind='bell'))
fx['rock']=mix(.38,[(0,tone(82.4,.28,'warm',16),.7),(.015,softnoise(.28,20),.13),(.14,tone(123.5,.15,'triangle',25),.2)])
fx['ground']=mix(.5,[(0,tone(65.4,.42,'warm',9),.55),(.04,softnoise(.37,35),.1)])
fx['wind']=softnoise(.48,22)*np.sin(np.pi*np.linspace(0,1,len(axis(.48))))*.16
fx['poison']=mix(.5,[(0,tone(196,.17,'warm',12),.25),(.13,tone(233,.2,'warm',12),.2),(.28,tone(147,.2,'warm',12),.2)])
fx['ghost']=mix(.6,[(0,tone(261.6,.5,'sine',3),.18),(.13,tone(311.1,.43,'sine',3),.15),(.25,tone(196,.32,'sine',6),.13)])
fx['dragon']=mix(.55,[(0,tone(130.8,.36,'triangle',8),.2),(.12,tone(196,.32,'warm',7),.18),(.24,tone(261.6,.3,'bell',6),.15)])
fx['steel']=mix(.4,[(0,tone(740,.35,'bell',20),.22),(.025,tone(1110,.3,'bell',22),.13)])
fx['bug']=mix(.34,[(t,tone(f,.08,'triangle',24),.2) for t,f in [(0,415),(.09,622),(.18,415),(.26,830)]])
fx['dark']=mix(.42,[(0,tone(146.8,.3,'warm',10),.25),(.1,tone(174.6,.3,'triangle',10),.13),(.03,softnoise(.2,30),.05)])
fx['status']=mix(.35,notes([392,523.25],.1,kind='triangle'))
fx['heal']=mix(1.25,notes([523.25,659.25,783.99,1046.5],.17,kind='bell')+[(.65,tone(659.25,.55,'warm',5),.1)])
fx['faint']=mix(.45,notes([392,293.66,196],.1,kind='triangle'))
fx['menu']=tone(740,.055,'triangle',30)*.22
fx['confirm']=mix(.17,notes([659.25,987.77],.055,kind='triangle'))
fx['cancel']=mix(.19,notes([587.33,440],.065,kind='triangle'))
fx['denied']=mix(.23,notes([246.94,220],.07,kind='triangle'))
fx['item']=mix(.55,notes([659.25,783.99,1046.5],.09,kind='bell'))
fx['alert']=mix(.32,notes([523.25,783.99],.1,kind='triangle'))
fx['portal']=mix(.27,[(0,softnoise(.18,30),.05),(.05,tone(330,.18,'warm',20),.2)])
fx['capture']=mix(.46,notes([392,523.25,659.25],.09,kind='triangle'))
fx['escape']=mix(.36,notes([659.25,523.25,392],.075,kind='triangle'))
fx['hit']=fx['normal'].copy();fx['energy']=fx['psychic'].copy()
fx['critical']=fx['fighting'].copy()
fx['levelup']=mix(.65,notes([523.25,659.25,783.99,1046.5],.09,kind='bell'))
meta={}
for name,data in fx.items():
 data-=np.mean(data);peak=np.max(np.abs(data));data*=min(1,.23/max(1e-9,peak));data[0]=data[-1]=0
 pcm=(data*32767).astype('<i2');p=OUT/f'{name}.wav'
 with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
 meta[name]={'file':f'sfx/{name}.wav','title':f'Compañeros · {name}','author':'Original project synthesis','license':'Project-original','sourceFile':'sources/make_sfx.py','sampleRate':SR,'channels':1,'duration':len(data)/SR,'loop':False,'peakDbFS':round(20*np.log10(max(abs(data))),2),'rmsDbFS':round(20*np.log10(np.sqrt(np.mean(data**2))),2),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(OUT.parent/'sfx-manifest.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print('Generated',len(meta),'original effects;',sum(x['bytes'] for x in meta.values()),'bytes; max peak',max(x['peakDbFS'] for x in meta.values()))
