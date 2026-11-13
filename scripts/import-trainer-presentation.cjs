/* Preserve transparent source PNGs, package portrait and bicycle sheets as text. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const src=path.resolve(process.argv[2]),read=p=>fs.readFileSync(path.join(src,p),'utf8'),out=path.join(__dirname,'../assets/trainer-presentation');fs.mkdirSync(out,{recursive:true});
const png=p=>'data:image/png;base64,'+fs.readFileSync(path.join(src,p)).toString('base64');
const data={source:'https://github.com/pret/pokefirered',commit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:src,encoding:'utf8'}).trim(),front:{},back:{},bicycle:{},byId:{}};
for(const f of fs.readdirSync(path.join(src,'graphics/trainers/front_pics')).filter(f=>f.endsWith('.png')))data.front[f.replace('_front_pic.png','')]=png('graphics/trainers/front_pics/'+f);
for(const [key,name]of [['red','red'],['leaf','leaf']])data.back[key]=png('graphics/trainers/back_pics/'+name+'_back_pic.png');
for(const [key,name]of [['red','red'],['leaf','green']])data.bicycle[key]=png('graphics/object_events/pics/people/'+name+'_bike.png');
const constants=read('include/constants/trainers.h'),graphics=read('src/data/graphics/trainers.h'),table=read('src/data/trainer_graphics/front_pic_tables.h');
for(const [,key,symbol]of table.matchAll(/TRAINER_SPRITE\((\w+), (\w+),/g)){
 const id=constants.match(new RegExp('#define\\s+TRAINER_PIC_'+key+'\\s+(\\d+)'))?.[1];
 const file=graphics.match(new RegExp(symbol+'\\[\\] = INCBIN_U32\\("graphics/trainers/front_pics/([^"/]+)_front_pic\\.'))?.[1];
 if(id&&file)data.byId[id]=file;
}
fs.writeFileSync(path.join(out,'sprites.json'),JSON.stringify(data)+'\n');console.log(Object.keys(data.front).length+' trainer portraits; '+Object.keys(data.byId).length+' ID mappings');
