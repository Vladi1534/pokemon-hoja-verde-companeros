// Expand only checked-in, hash-verified artwork. No cartridge is required to build.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/world-bundles');
for(const entry of JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'))){
 const file=path.join(dir,entry.file),data=fs.readFileSync(file);
 if(crypto.createHash('sha256').update(data).digest('hex')!==entry.sha256)throw Error('Artwork package hash mismatch: '+entry.file);
 const names=cp.execFileSync('tar',['-tzf',file],{encoding:'utf8'}).trim().split('\n');
 if(names.length!==entry.files||names.some(n=>!/^assets\/(leafgreen-world\/atlases|heartgold-environment\/(textures|models))\//.test(n)||n.includes('..')))throw Error('Unexpected artwork package path: '+entry.file);
 cp.execFileSync('tar',['-xzf',file,'-C',root]);
}
console.log('Verified and expanded LeafGreen / HeartGold artwork packages.');
