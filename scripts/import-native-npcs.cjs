/* Extract the graphics catalogue, without repainting or resampling source art.
 * Usage: node scripts/import-native-npcs.cjs /path/to/pret/pokefirered */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const source=path.resolve(process.argv[2]||''),root=path.resolve(__dirname,'..'),out=path.join(root,'assets/native-npcs');
const read=f=>fs.readFileSync(path.join(source,f),'utf8');
const pointers=read('src/data/object_events/object_event_graphics_info_pointers.h');
const infos=read('src/data/object_events/object_event_graphics_info.h');
const pics=read('src/data/object_events/object_event_graphics.h');
const tables=read('src/data/object_events/object_event_pic_tables.h');
const catalogue={source:'https://github.com/pret/pokefirered',commit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),graphics:{}};
fs.mkdirSync(out,{recursive:true});const sprites={};
for(const [,symbol,info]of pointers.matchAll(/\[(OBJ_EVENT_GFX_\w+)\]\s*=\s*&gObjectEventGraphicsInfo_(\w+)/g)){
 if(/OBJ_EVENT_GFX_(RED|GREEN|RS_BRENDAN|RS_MAY)(_|$)/.test(symbol))continue;
 const body=infos.match(new RegExp('gObjectEventGraphicsInfo_'+info+' = \\{([\\s\\S]*?)\\};'))?.[1];if(!body)continue;
 const table=body.match(/\.images\s*=\s*(\w+)/)?.[1];
 const image=tables.match(new RegExp(table+'\\[\\] = \\{[\\s\\S]*?overworld_frame\\((\\w+)'))?.[1];if(!image)continue;
 const file=pics.match(new RegExp(image+'\\[\\] = INCBIN_U16\\("([^"\\n]+)\\.4bpp"'))?.[1];
 if(!file||!/(people|pokemon)\//.test(file))continue;
 const png=fs.readFileSync(path.join(source,file+'.png')),width=Number(body.match(/\.width\s*=\s*(\d+)/)[1]),height=Number(body.match(/\.height\s*=\s*(\d+)/)[1]);
 const key='native_'+symbol.replace('OBJ_EVENT_GFX_','').toLowerCase();
 sprites[key+'.png']=png.toString('base64');
 catalogue.graphics[symbol]={key,file:key+'.png',width,height,frames:png.readUInt32BE(16)/width,rows:png.readUInt32BE(20)/height,creature:file.includes('/pokemon/'),source:file+'.png'};
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(catalogue,null,2)+'\n');
fs.writeFileSync(path.join(out,'sprites.json'),JSON.stringify(sprites)+'\n');
console.log('Extracted '+Object.keys(catalogue.graphics).length+' original NPC graphics with frame dimensions.');
