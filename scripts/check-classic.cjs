const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const Classic=require('../classic-battle.js');
assert.equal(Classic.experience({xp:150,levelXp:100,nextXp:300}),25);
assert.equal(Classic.experience({xp:300,nextXp:null,level:100}),100);
assert.equal(Classic.family('Water Gun','Water','Special'),'water');
assert.equal(Classic.family('Tail Whip','Normal','Status'),'status');
assert.equal(Classic.family('Scratch','Normal','Physical'),'scratch');
assert.equal(Classic.family('Thunderbolt','Electric','Special'),'electric');
const nodes=new Map();let buttons=[];
function element(id=''){
 const node={id,dataset:{},classList:{add(){},remove(){},toggle(){}},append(child){nodes.set(child.id,child);},querySelectorAll(selector){const attr=/\[([^\]]+)\]/.exec(selector)?.[1];return buttons.filter(b=>attr in b.attrs);}};
 Object.defineProperty(node,'innerHTML',{set(html){this.html=html;if(this.id!=='coopBattle')return;buttons=[];for(const tag of html.matchAll(/<button\b([^>]*)>/g)){
  const b={attrs:{},dataset:{}};for(const a of tag[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)){b.attrs[a[1]]=a[2]??'';if(a[1].startsWith('data-'))b.dataset[a[1].slice(5).replace(/-([a-z])/g,(_,s)=>s.toUpperCase())]=a[2];}buttons.push(b);if(b.attrs.id)nodes.set(b.attrs.id,b);
 }},get(){return this.html||'';}});return node;
}
nodes.set('screen',element('screen'));
const calls=[],notices=[];
const c=vm.createContext({console,Audio:{effect(){}},UI:{toast:s=>notices.push(s),ask(){},close(){}},Game:{map:{kind:'route'}},
 document:{createElement:()=>element(),body:{classList:{add(){}}}},$:id=>nodes.get(id),esc:String,
 ASSETS:{front:{7:'front7',19:'front19'},back:{7:'back7'}},TYPE_NAMES:{water:'Agua',normal:'Normal'},
 Coop:{active:true,moveName:m=>m,logText(){return ''},state:{members:[]},sendChoice:(b,s)=>calls.push(s),action:(a,s)=>calls.push([a,s]),bag:b=>calls.push(['bag',b.id])}});
vm.runInContext(fs.readFileSync('classic-battle.js','utf8'),c);
const b={id:'battle-test',revision:1,turn:1,kind:'coop',encounter:'wild',title:'Rattata salvaje',log:[],sides:[{id:'p1',owner:'me',trainer:'Vladimir',active:[{id:7,name:'Squirtle',level:5,hp:100,gender:'M'}]},{id:'p2',trainer:'Salvaje',active:[{id:19,name:'Rattata',level:3,hp:100}]}],you:{side:'p1',moves:[{move:'Water Gun',type:'Water',pp:25,maxpp:25}],team:[{uid:'squirtle',id:7,name:'Squirtle',active:true,hp:20,maxHp:20,level:5,xp:150,levelXp:100,nextXp:300,gender:'M'}]}};
const choose=menu=>buttons.find(b=>b.dataset.battleMenu===menu).onclick();
c.Coop.renderBattle(b);let html=nodes.get('coopBattle').innerHTML;
for(const text of ['LUCHA','MOCHILA','POKÉMON','HUIDA','EXP','20 / 20'])assert(html.includes(text),text);
assert(html.includes('aria-valuenow="25"'));
nodes.get('battleRun').onclick();assert.equal(calls.at(-1)[0],'flee');assert.equal(calls.at(-1)[1].turn,1);
choose('moves');assert(nodes.get('coopBattle').innerHTML.includes('25/25 PP'));buttons.find(b=>b.dataset.move==='0').onclick();assert.equal(calls.at(-1),'move 1');
choose('root');nodes.get('onlineBattleBag').onclick();assert.equal(calls.at(-1)[0],'bag');
choose('party');assert(nodes.get('coopBattle').innerHTML.includes('data-switch="1"'));choose('root');
b.encounter='trainer';c.Coop.renderBattle(b,true);const before=calls.length;nodes.get('battleRun').onclick();assert.equal(calls.length,before);assert.match(notices.at(-1),/No puedes huir/);
b.you.forceSwitch=true;c.Coop.renderBattle(b,true);assert(!nodes.get('coopBattle').innerHTML.includes('id="battleRun"'));assert(nodes.get('coopBattle').innerHTML.includes('data-switch'));
const sprites=vm.runInNewContext(fs.readFileSync('battle-sprites.js','utf8')+';BATTLE_SPRITES');
assert.equal(Object.keys(sprites.back).length,159);for(const set of ['front','back'])for(const [id,pic]of Object.entries(sprites[set])){const png=Buffer.from(pic.split(',')[1],'base64');assert.equal(png.readUInt32BE(16),96);assert.equal(png.readUInt32BE(20),96);const box=sprites.bounds[set][id];assert(box[2]<=96&&box[3]<=96&&box[3]>box[1]);}
assert(sprites.bounds.back[7][3]<96,'Squirtle has bottom clearance, not a cropped source edge');
console.log('PASS classic commands, move choice, bag, party, forced switch, wild-only escape, XP and all 318 full-body sprite frames');
