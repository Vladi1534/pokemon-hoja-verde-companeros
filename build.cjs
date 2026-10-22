const fs=require('fs'),path=require('path');
const root=__dirname;
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.template.html').replace('/*__DATA__*/',read('data.js')).replace('/*__WORLD__*/',read('world.js')).replace('/*__ENGINE__*/',['mechanics.js','game.js','battle.js','ui.js','renderer.js','input.js'].map(read).join('\n'));
fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/index.html'),html);console.log('Built '+Buffer.byteLength(html)+' bytes, self-contained HTML.');
