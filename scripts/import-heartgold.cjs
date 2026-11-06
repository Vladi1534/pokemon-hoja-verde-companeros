// Reproducible adapter: ROM-derived HG tables, existing Kanto campaign roster.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const hg=read('assets/heartgold-rules/hg-rules.json'),data=read('online-server/server/data/kanto.json');
for(const [id,s] of Object.entries(hg.species)){
 const old=data.species[id];if(!old)throw Error('Unexpected roster entry '+id);
 Object.assign(old,{types:s.types.map(t=>t.toLowerCase()),stats:{hp:s.baseStats.hp,attack:s.baseStats.atk,defense:s.baseStats.def,specialAttack:s.baseStats.spa,specialDefense:s.baseStats.spd,speed:s.baseStats.spe},genderRatio:s.genderRatio,baseFriendship:s.friendship,captureRate:s.captureRate,baseExpYield:s.baseExpYield,evYield:s.evYield,eggCycles:s.eggCycles,eggGroups:[...new Set(s.eggGroups)],levelUp:s.levelUp,eggMoves:s.eggMoves,machines:s.machines,hgAbilities:s.abilityIds,abilitySlots:s.abilitySlots});
}
data.moves=hg.moves;Object.assign(data.abilities,hg.abilities);data.rulesProfile='heartgold-gen4-sturdy';
fs.writeFileSync(path.join(root,'online-server/server/data/kanto.json'),JSON.stringify(data));
fs.writeFileSync(path.join(root,'hg-data.js'),'const HG_RULES='+JSON.stringify({profile:hg.profile,moves:hg.moves,abilities:hg.abilities})+';\n');
console.log('HeartGold tables: '+Object.keys(hg.species).length+' species, '+Object.keys(hg.moves).length+' moves.');
