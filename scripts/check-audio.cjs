const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const c=vm.createContext({console,performance,setInterval:()=>1,clearInterval(){},localStorage:{getItem(){return null},setItem(){}},document:{hidden:false,addEventListener(){}},window:{},$:()=>null,Game:{mode:'world',map:{id:'route1',natural:true}},Coop:{active:true,state:{}},COOP_WORLD:{maps:{}}});
vm.runInContext(fs.readFileSync('audio-data.js','utf8')+'\n'+fs.readFileSync('audio.js','utf8')+'\nthis.audio=Soundtrack;this.catalog=AUDIO_CATALOG;',c);
const a=c.audio;assert.equal(a.scene(),'route');c.Game.map={id:'pallet'};assert.equal(a.scene(),'town');c.Game.map={id:'moon',kind:'cave'};assert.equal(a.scene(),'cave');
c.Game.mode='coop-battle';for(const [encounter,title,key]of [['wild','Pidgey','wild'],['trainer','Jessie y James','rocket'],['gym','Giovanni','giovanni'],['gym','Brock','leader'],['league','Lance','champion']]){c.Coop.state.battle={encounter,title};assert.equal(a.scene(),key);}
let started=0,stopped=0;const gain=()=>({gain:{value:1,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}},connect(){},disconnect(){}});
a.ctx={currentTime:0,createGain:gain,createBufferSource:()=>({connect(){},disconnect(){},start(){started++},stop(){stopped++}})};a.musicGain=gain();a.effectsGain=gain();
(async()=>{
 const pending=new Map();a.buffer=(type,key)=>new Promise(resolve=>pending.set(key,resolve));a.musicKey=null;a.scene=()=> 'cave';const old=a.update();a.scene=()=> 'route';const latest=a.update();pending.get('cave')({duration:10});await old;assert.equal(started,0,'old decode cannot start stale theme');pending.get('route')({duration:10});await latest;assert.equal(started,1);await a.update();assert.equal(started,1,'opening menus does not restart the current track');
 a.scene=()=> 'leader';const decoding=a.update();a.toggle();pending.get('leader')({duration:10});await decoding;assert.equal(started,1,'mute cancels pending decode');assert(stopped>0);
 for(const group of ['music','sfx'])for(const asset of Object.values(c.catalog[group]))assert(fs.statSync('assets/audio/'+asset.file).size>100);
 console.log('PASS contextual soundtrack, stable loops, stale decoding cancellation, mute and all packaged audio assets');
})().catch(e=>{console.error(e);process.exitCode=1});
