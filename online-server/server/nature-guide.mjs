import {Dex} from '@pkmn/sim';
const dex=Dex.mod('gen4');
export const statLabels={hp:'PS',atk:'Ataque',def:'Defensa',spa:'Ataque Especial',spd:'Defensa Especial',spe:'Velocidad'};
// Names and +10% / −10% matrix checked against Pokéxperto NatureDex, 2026-11-06.
export const natureNames=['Hardy','Lonely','Brave','Adamant','Naughty','Bold','Docile','Relaxed','Impish','Lax','Timid','Hasty','Serious','Jolly','Naive','Modest','Mild','Quiet','Bashful','Rash','Calm','Gentle','Sassy','Careful','Quirky'];
export const natureES=['Fuerte','Huraña','Audaz','Firme','Pícara','Osada','Dócil','Plácida','Agitada','Floja','Miedosa','Activa','Seria','Alegre','Ingenua','Modesta','Afable','Mansa','Tímida','Alocada','Serena','Amable','Grosera','Cauta','Rara'];
export const natureSource='https://www.pokexperto.net/index2.php?seccion=advance/naturedex';
export function natureEffect(name){const n=dex.natures.get(name),plus=n.plus||null,minus=n.minus||null;return {name:natureES[natureNames.indexOf(n.name)]||n.name,plus,minus,description:plus?`Aumenta ${statLabels[plus]} un 10% y disminuye ${statLabels[minus]} un 10%.`:'Es neutra: no aumenta ni disminuye ninguna característica.'};}
export function natureAdvice(mon){
 const s=dex.species.all().find(s=>s.num===mon.species),base=s.baseStats;
 const damaging=(mon.moves||[]).map(m=>dex.moves.get(String(m.slug||m.id))).filter(m=>m.exists&&m.category!=='Status');
 // Imported numerical moves can be passed with their resolved category and power.
 const moves=damaging.length?damaging:(mon.moves||[]).filter(m=>['Physical','Special'].includes(m.category));
 const physical=moves.filter(m=>m.category==='Physical').reduce((n,m)=>n+(m.basePower||m.power||40),0),special=moves.filter(m=>m.category==='Special').reduce((n,m)=>n+(m.basePower||m.power||40),0);
 const physicalRole=physical&&!special||!physical&&!special&&base.atk>=base.spa,specialRole=special&&!physical||!physical&&!special&&base.spa>base.atk;
 const weights={atk:physicalRole?1.5:specialRole?.05:.9,spa:specialRole?1.5:physicalRole?.05:.9,def:.65,spd:.65,spe:base.spe>=60?1.25:.6};
 const ranked=natureNames.map(name=>{const n=natureEffect(name);return {id:name,...n,score:n.plus?Math.round(100*(base[n.plus]*weights[n.plus]-base[n.minus]*weights[n.minus])):0};}).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'es'));
 return {role:physicalRole?'atacante físico':specialRole?'atacante especial':'atacante mixto',explanation:'Orden orientativo para la aventura según estadísticas base y ataques actuales. Cambia con el equipo de movimientos; no es un ranking competitivo universal.',ranked};
}
