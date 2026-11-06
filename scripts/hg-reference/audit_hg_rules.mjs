import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url));
const {Dex,Battle}=require('@pkmn/sim');
const hg=JSON.parse(readFileSync(process.argv[2]||new URL('../../assets/heartgold-rules/hg-rules.json',import.meta.url)));
const old=JSON.parse(readFileSync(process.argv[3]||new URL('../../online-server/server/data/kanto.json',import.meta.url)));
const gen3=Dex.mod('gen3'),gen4=Dex.mod('gen4');
const audit={speciesMismatches:[],moveMismatches:[],gen3AbilityChanges:[],gen3MoveChanges:[],statusTests:[]};
for(const s of Object.values(hg.species)){
 const d=gen4.species.get(s.name);
 for(const key of ['types','baseStats'])if(JSON.stringify(key==='baseStats'?Object.entries(d[key]).sort():d[key])!==JSON.stringify(key==='baseStats'?Object.entries(s[key]).sort():s[key]))audit.speciesMismatches.push({species:s.name,key,dex:d[key],rom:s[key]});
 const abilities=Object.values(d.abilities).map(x=>gen4.abilities.get(x).num);
 if(JSON.stringify(abilities)!==JSON.stringify(s.abilityIds))audit.speciesMismatches.push({species:s.name,key:'abilities',dex:abilities,rom:s.abilityIds});
 const prev=Object.values(gen3.species.get(s.name).abilities).map(x=>gen3.abilities.get(x).num);
 if(JSON.stringify(prev)!==JSON.stringify(s.abilityIds))audit.gen3AbilityChanges.push({id:s.id,name:s.name,old:prev,hg:s.abilityIds});
}
for(const m of Object.values(hg.moves)){
 const d=gen4.moves.get(m.slug),before=gen3.moves.get(m.slug);
 for(const [a,b] of [['type','type'],['category','category'],['power','basePower'],['accuracy','accuracy'],['pp','pp'],['priority','priority']]){
   let actual=a==='type'?d[b].toLowerCase():d[b],expected=m[a];
   if(actual!==expected)audit.moveMismatches.push({move:m.name,id:m.id,key:a,dex:actual,rom:expected});
   if(old.moves[m.id]){
    let prev=a==='type'?before[b].toLowerCase():before[b];
    if(prev!==expected)audit.gen3MoveChanges.push({move:m.name,id:m.id,key:a,old:prev,hg:expected});
   }
 }
}
function attempt({gen=4,attacker='Tangela',defender,ability,move='sleeppowder',expectedStatus='',immune}){
 const b=new Battle({formatid:`gen${gen}customgame`,seed:[1,2,3,4],p1:{name:'A',team:[{species:attacker,ability:gen4.species.get(attacker).abilities[0],level:50,moves:[move]}]},p2:{name:'B',team:[{species:defender,ability,level:50,moves:['splash']}]}});
 if(!b.p1.active[0]){b.choose('p1','team 1');b.choose('p2','team 1');}
 b.p1.active[0].boosts.accuracy=6;
 b.choose('p1','move 1');b.choose('p2','move 1');
 assert.equal(b.p2.active[0].status,expectedStatus);
 if(immune)assert(b.log.some(x=>x.startsWith('|-immune|p2a:')));
 audit.statusTests.push({gen,attacker,defender,ability,move,status:b.p2.active[0].status,events:b.log.filter(x=>/\|-immune\||\|-status\||\|-fail\|/.test(x))});
}
attempt({defender:'Mankey',ability:'Vital Spirit',immune:true});
attempt({defender:'Mankey',ability:'Anger Point',expectedStatus:'slp'});
attempt({defender:'Venusaur',ability:'Overgrow',expectedStatus:'slp'});
attempt({attacker:'Venusaur',defender:'Tangela',ability:'Chlorophyll',expectedStatus:'slp'});
attempt({defender:'Drowzee',ability:'Insomnia',immune:true});
attempt({gen:6,defender:'Venusaur',ability:'Overgrow',immune:true});
attempt({defender:'Venusaur',ability:'Overgrow',move:'poisonpowder',immune:true});
audit.representationDifferences=audit.moveMismatches.filter(x=>x.key==='power'&&x.rom===1&&x.dex===0);
audit.functionalMismatches=audit.moveMismatches.filter(x=>!audit.representationDifferences.includes(x));
audit.typeChartMismatches=[];for(const [attack,row] of Object.entries(hg.typeChart))for(const [defense,expected]of Object.entries(row)){const actual=gen4.getImmunity(attack,defense)?2**gen4.getEffectiveness(attack,defense):0;if(actual!==expected)audit.typeChartMismatches.push({attack,defense,actual,expected});}
const summary={typeMatchups:289,typeChartMismatches:audit.typeChartMismatches.length,representationDifferences:audit.representationDifferences.length,functionalMismatches:audit.functionalMismatches.length,species:Object.keys(hg.species).length,moves:Object.keys(hg.moves).length,abilities:Object.keys(hg.abilities).length,speciesMismatches:audit.speciesMismatches.length,moveFieldMismatches:audit.moveMismatches.length,gen3AbilityChanges:audit.gen3AbilityChanges.length,gen3MoveChanges:audit.gen3MoveChanges.length,statusTestsPassed:audit.statusTests.length};
audit.summary=summary;
writeFileSync(process.argv[4]||'hg-audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
console.log(JSON.stringify({speciesMismatches:audit.speciesMismatches,moveMismatches:audit.moveMismatches},null,2));
