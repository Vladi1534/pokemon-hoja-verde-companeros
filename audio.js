/* Licensed, loopable chiptune score; decoded lazily after a user gesture. */
const Soundtrack={
 ctx:null,on:true,musicVolume:.34,effectsVolume:.45,buffers:new Map(),loading:new Map(),sources:new Set(),musicKey:null,generation:0,
 init(){
  if(!this.on)return;
  try{
   if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.musicGain=this.ctx.createGain();this.effectsGain=this.ctx.createGain();this.musicGain.connect(this.ctx.destination);this.effectsGain.connect(this.ctx.destination);this.levels();this.warmEffects();}
   if(this.ctx.state==='suspended')this.ctx.resume().then(()=>this.update()).catch(()=>{});
   if(!this.timer)this.timer=setInterval(()=>this.update(),250);
  }catch{}
 },
 warmEffects(){const keys=Object.keys(AUDIO_CATALOG.sfx);const next=()=>{const key=keys.shift();if(key)this.buffer('sfx',key).catch(()=>{}).finally(next);};for(let i=0;i<3;i++)next();},
 levels(){if(this.ctx){this.musicGain.gain.setTargetAtTime(this.on?this.musicVolume:0,this.ctx.currentTime,.05);this.effectsGain.gain.setTargetAtTime(this.on?this.effectsVolume:0,this.ctx.currentTime,.03);}},
 remember(){try{localStorage.setItem('KANTO_AUDIO_V1',JSON.stringify({on:this.on,music:this.musicVolume,effects:this.effectsVolume}));}catch{}},
 volume(which,value){value=Math.max(0,Math.min(1,value));this[which==='music'?'musicVolume':'effectsVolume']=value;this.levels();this.remember();},
 toggle(){this.on=!this.on;this.remember();if(this.on){this.init();this.update();}else this.stop();this.levels();this.button();return this.on;},
 button(){const b=$('soundButton');if(b){b.textContent=this.on?'♫':'♪';b.setAttribute('aria-label',this.on?'Silenciar sonido':'Activar sonido');}},
 async buffer(type,key){
  const id=type+':'+key,asset=AUDIO_CATALOG[type]?.[key];if(!asset)throw Error('Audio desconocido');
  if(this.buffers.has(id)){const b=this.buffers.get(id);this.buffers.delete(id);this.buffers.set(id,b);return b;}
  if(this.loading.has(id))return this.loading.get(id);
  const pending=(async()=>{const response=await fetch('./audio/'+asset.file);if(!response.ok)throw Error('Audio no disponible');const b=await this.ctx.decodeAudioData(await response.arrayBuffer());this.buffers.set(id,b);const music=[...this.buffers.keys()].filter(k=>k.startsWith('music:'));while(music.length>3)this.buffers.delete(music.shift());return b;})();
  this.loading.set(id,pending);try{return await pending;}finally{this.loading.delete(id);}
 },
 stop(){
  this.generation++;this.musicKey=null;clearInterval(this.fallbackTimer);this.fallbackTimer=null;
  for(const node of this.sources)try{node.stop();}catch{}this.sources.clear();
 },
 scene(){
  if(typeof Game==='undefined'||!Coop.active)return 'title';
  const battle=Coop.playback?.frame||Coop.state?.battle;
  if(Game.mode==='encounter')return 'wild';
  if(Game.mode==='coop-battle'&&battle){
   if(battle.ended)return ['victory','pvp'].includes(battle.result)?'victory':battle.result==='captured'?'capture':battle.result==='defeat'?'loss':'route';
   if(battle.encounter==='wild')return 'wild';
   if(/giovanni/i.test(battle.title))return 'giovanni';
   if(/rocket|jessie|james/i.test(battle.title))return 'rocket';
   if(battle.encounter==='league'||/lorelei|bruno|agatha|lance|azul/i.test(battle.title))return 'champion';
   if(battle.encounter==='gym'||/brock|misty|surge|erika|koga|sabrina|blaine/i.test(battle.title))return 'leader';
   return 'trainer';
  }
  const map=Game.map,parent=map.inside?COOP_WORLD.maps[map.parent]||map:map,id=map.id;
  if(/center|daycare/.test(id))return 'center';
  if(/rocket|silph/.test(id))return 'rocket';
  if(/ssanne/.test(id)||parent.kind==='sea'||['vermilion','oneisland','fourisland','cinnabar'].includes(parent.id))return 'coast';
  if(map.kind==='cave'||map.dungeon||/tower/.test(id))return 'cave';
  if(/route1[678]/.test(id))return 'cycling';
  if(/forest/.test(id)||parent.id==='lavender')return 'forest';
  return parent.natural?'route':'town';
 },
 async update(){
  if(!this.ctx||!this.on)return;
  if(document.hidden){if(this.musicKey)this.stop();return;}
  const urgent=['coop-battle','encounter'].includes(Game.mode);if(urgent)this.jingle=null;
  const key=this.jingle&&performance.now()<this.jingle.until?this.jingle.key:this.scene();
  if(key===this.musicKey)return;
  this.musicKey=key;const generation=++this.generation;
  clearInterval(this.fallbackTimer);this.fallbackTimer=null;
  try{
   const buffer=await this.buffer('music',key);if(generation!==this.generation||!this.on||document.hidden)return;
   const t=this.ctx.currentTime,source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=!!AUDIO_CATALOG.music[key].loop&&!['victory'].includes(key);source.loopStart=AUDIO_CATALOG.music[key].loopStart||0;source.loopEnd=Math.min(buffer.duration,AUDIO_CATALOG.music[key].loopEnd||buffer.duration);source.connect(gain);gain.connect(this.musicGain);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(1,t+.22);
   const old=this.current;if(old){old.gain.gain.cancelScheduledValues(t);old.gain.gain.setValueAtTime(old.gain.gain.value,t);old.gain.gain.linearRampToValueAtTime(0,t+.22);try{old.source.stop(t+.24);}catch{}}
   this.current={source,gain};this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();gain.disconnect();};source.start();
  }catch{if(generation===this.generation)this.fallback(key);}
 },
 cue(key){if(!AUDIO_CATALOG.music[key])return;this.jingle={key,until:performance.now()+AUDIO_CATALOG.music[key].duration*1000};this.update();},
 async effect(kind){
  if(!this.on||document.hidden)return;this.init();if(!this.ctx)return;
  const aliases={select:'menu',notice:'alert',encounter:'alert',win:'levelup',level:'levelup',capture:'capture',faint:'faint'},key=aliases[kind]||kind;
  if(!AUDIO_CATALOG.sfx[key])return this.tone(440,.06,'triangle',.018);
  const cached=this.buffers.get('sfx:'+key);if(!cached){this.buffer('sfx',key).catch(()=>{});this.tone(kind==='hit'?110:660,.07,'triangle',.025);return;}
  try{const b=cached;if(!this.on||document.hidden)return;const s=this.ctx.createBufferSource();s.buffer=b;s.connect(this.effectsGain);s.start();s.onended=()=>s.disconnect();}catch{this.tone(kind==='hit'?110:660,.09,'triangle',.025);}
 },
 tone(f,d=.1,kind='triangle',volume=.035,bus='effects'){
  if(!this.ctx||!this.on||document.hidden)return;
  const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime;o.type=kind;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(bus==='music'?this.musicGain:this.effectsGain);o.start();o.stop(t+d+.02);o.onended=()=>{o.disconnect();g.disconnect();};
 },
 fallback(key){
  if(this.current)try{this.current.source.stop();}catch{}
  let step=0;const tense=['wild','trainer','leader','rocket','giovanni','champion'].includes(key),notes=tense?[220,261.63,329.63,440,392,329.63,293.66,261.63]:[392,493.88,587.33,493.88,440,523.25,659.25,587.33];
  this.fallbackTimer=setInterval(()=>{if(!this.on||document.hidden)return;const n=notes[step++%notes.length];this.tone(n,.18,'triangle',.05,'music');if(step%2===0)this.tone(n/2,.24,'square',.018,'music');},tense?190:260);
 }
};
try{const p=JSON.parse(localStorage.getItem('KANTO_AUDIO_V1')||'null');if(p){Soundtrack.on=p.on!==false;Soundtrack.musicVolume=Math.max(0,Math.min(1,Number(p.music)||0));Soundtrack.effectsVolume=Math.max(0,Math.min(1,Number(p.effects)||0));}}catch{}
document.addEventListener('pointerdown',()=>{Soundtrack.init();Soundtrack.button();Soundtrack.update();},{capture:true});
document.addEventListener('keydown',()=>{Soundtrack.init();Soundtrack.update();},{capture:true});
document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#soundButton,#consoleSound'))Soundtrack.effect('select');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)Soundtrack.stop();else Soundtrack.update();});
