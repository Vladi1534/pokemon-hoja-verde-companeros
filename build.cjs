const fs=require('fs'),path=require('path');
const root=__dirname;
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.template.html').replace('</style>',read('coop.css')+'\n</style>').replace('/*__DATA__*/',['data.js','rules-data.js','people-data.js','campaign-extra.js'].map(read).join('\n')).replace('/*__WORLD__*/',['world.js','town-design.js','town-apply.js','coop-world.js'].map(read).join('\n')).replace('/*__ENGINE__*/',['mechanics.js','rules.js','game.js','battle.js','battle-rules.js','ui.js','adventure.js','adventure-ui.js','renderer.js','visual-details.js','urban-renderer.js','coop.js','campaign-client.js','exploration.js','input.js'].map(read).join('\n'));
fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/index.html'),html);console.log('Built '+Buffer.byteLength(html)+' bytes, self-contained HTML.');
