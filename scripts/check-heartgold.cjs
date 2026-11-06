const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const clarity=require('../hg-game-rules.js');
const name=s=>({'Vital Spirit':'Espíritu Vital',Insomnia:'Insomnio'})[s]||s;
assert.match(clarity.message('|-immune|p2a: Mankey|[from] ability: Vital Spirit',name,String),/Mankey no puede dormirse gracias a Espíritu Vital/);
assert.match(clarity.message('|-immune|p1a: Drowzee|[from] ability: Insomnia',name,String),/Insomnio/);
assert.match(clarity.message('|-miss|p1a: Venusaur|p2a: Mankey',name,String),/no acertó a Mankey/);
assert.match(clarity.message('|cant|p1a: Venusaur|slp',name,String),/está dormido/);
assert.equal(clarity.message('|move|p1a: Venusaur|Sleep Powder',name,String),null);
const root='assets/heartgold-models/',manifest=JSON.parse(fs.readFileSync(root+'manifest.json')),previews=JSON.parse(fs.readFileSync(root+'previews/manifest.json'));
for(const a of manifest.assets){const b=fs.readFileSync(root+a.file);assert.equal(b.subarray(0,4).toString(),'glTF');assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,a.key);}
for(const [key,p]of Object.entries(previews)){const b=fs.readFileSync(root+'previews/'+key+'.png');assert.equal(b.readUInt32BE(16),p.width);assert.equal(b.readUInt32BE(20),p.height);assert(p.anchorX>=0&&p.anchorX<=p.width,key);if(p.depth)assert(fs.existsSync(root+'previews/'+key+'-depth.png'));}
const world=JSON.parse(fs.readFileSync('online-server/server/world.json'));const museum=world.maps.pewter.buildings.find(b=>b.kind==='museum');assert.equal(world.maps.pewter.grid[5][20],0,'old invisible museum wall is released');assert.equal(world.maps.pewter.grid[museum.door.y][museum.door.x],8,'door remains usable');
(async()=>{const {project}=await import('../model-fallback.mjs'),f=previews['museum-interior-complete'];const a=project(f,-88,0,40),east=project(f,-72,0,40),south=project(f,-88,0,56),raised=project(f,-88,16,40);assert(Math.abs(east.x-a.x-16*f.scale)<1e-8);assert(Math.abs((south.y-a.y)-16*f.scale*f.sin)<1e-8);assert(south.depth<a.depth);assert(raised.y<a.y);console.log('PASS readable immunity, all 62 native model hashes, 26 compatible views and orthographic depth projection');})().catch(e=>{console.error(e);process.exitCode=1});
