export const RULES_VERSION='heartgold-gen4-sturdy';
// The only HG reductions concern Recover. Keep already chosen moves and never
// refill spent PP when opening an old save. Serialized battles keep their format.
export const legacyMovePP={22:10,71:20,72:10,105:20,202:5,254:10};
export function migrateRules(state){
 if(state.rulesVersion===RULES_VERSION)return false;
 for(const m of state.members||[]){
  for(const mon of [...m.party||[],...m.box||[],...m.daycare?.mons||[],...(m.daycare?.egg?[m.daycare.egg]:[])])
   for(const slot of mon.moves||[])if(slot.id===105&&slot.pp>10)slot.pp=10;
 }
 state.rulesVersion=RULES_VERSION;return true;
}
