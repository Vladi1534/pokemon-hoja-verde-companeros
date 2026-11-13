// A bounded heuristic inspired by FRLG/CFRU's scoring approach. It never reads
// the player's submitted choice, and never rolls or mutates the battle to score.
const stage=n=>n>=0?(2+n)/2:2/(2-n);
const stat=(p,k)=>Math.max(1,p.storedStats[k]*stage(p.boosts[k]||0));
function knownAbility(b,p){return b.log.some(l=>l.includes(p.name)&&l.includes('ability:'))?p.ability:'';}
function immune(b,move,target){
 if(move.category!=='Status'&&!b.dex.getImmunity(move.type,target))return true;
 const a=knownAbility(b,target);
 return move.type==='Ground'&&a==='levitate'||move.type==='Water'&&['waterabsorb','dryskin'].includes(a)||move.type==='Electric'&&['voltabsorb','motordrive'].includes(a)||move.type==='Fire'&&a==='flashfire';
}
export function estimateDamage(b,user,target,move){
 if(!target||immune(b,move,target))return 0;
 if(move.damage==='level')return user.level;
 if(typeof move.damage==='number')return move.damage;
 if(move.ohko)return target.hp*.25;
 if(!move.basePower)return 0;
 const physical=move.category==='Physical',attack=stat(user,physical?'atk':'spa'),defense=stat(target,physical?'def':'spd');
 let power=move.basePower;if(Array.isArray(move.multihit))power*=3;else if(typeof move.multihit==='number')power*=move.multihit;
 let value=((2*user.level/5+2)*power*attack/defense/50+2)*(user.hasType(move.type)?1.5:1)*2**b.dex.getEffectiveness(move.type,target)*.925;
 if(physical&&user.status==='brn'&&user.ability!=='guts')value*=.5;
 if(physical&&target.side.sideConditions.reflect||!physical&&target.side.sideConditions.lightscreen)value*=.5;
 return value;
}
function statusPossible(b,m,t){
 if(t.status||t.volatiles.substitute||t.side.sideConditions.safeguard)return false;
 if(['psn','tox'].includes(m.status)&&(t.hasType('Poison')||t.hasType('Steel')))return false;
 if(m.status==='brn'&&t.hasType('Fire'))return false;
 if(m.id==='thunderwave'&&!b.dex.getImmunity('Electric',t))return false;
 const a=knownAbility(b,t);return !(m.status==='slp'&&['insomnia','vitalspirit'].includes(a)||m.status==='psn'&&a==='immunity'||m.status==='par'&&a==='limber'||m.status==='brn'&&a==='waterveil');
}
export function scoreMove(b,user,target,move){
 if(!target)return -100;
 if(user.status==='slp'&&!['sleeptalk','snore'].includes(move.id))return -80;
 if(user.status!=='slp'&&['sleeptalk','snore'].includes(move.id))return -100;
 if(move.id==='sleeptalk')return 120;
 if(move.id==='rest')return user.status==='slp'||user.hp===user.maxhp?-100:user.hp/user.maxhp<.4?95:user.status?38:-15;
 if(move.heal)return user.hp/user.maxhp<.45?90:user.hp/user.maxhp<.7?35:-100;
 if(move.category==='Status'){
  if(move.status)return statusPossible(b,move,target)?(move.status==='slp'?48:36):-100;
  if(move.boosts){
   const self=['self','allies','allySide'].includes(move.target),p=self?user:target;
   let useful=0;for(const [key,amount]of Object.entries(move.boosts)){if(amount>0&&p.boosts[key]<3||amount<0&&p.boosts[key]>-3)useful+=Math.abs(amount);}
   if(!useful)return -80;
   if(self&&(user.hp/user.maxhp<.45||b.turn>10))return -20;
   return useful*(self?17:12)+(self&&b.turn<=2?12:0);
  }
  if(move.volatileStatus){if(target.volatiles[move.volatileStatus]||user.volatiles[move.volatileStatus])return -70;
   if(move.volatileStatus==='leechseed')return target.hasType('Grass')?-100:35;
   if(move.volatileStatus==='confusion')return 25;
   if(move.volatileStatus==='protect')return user.status==='tox'||target.volatiles.leechseed?18:-20;
  }
  if(move.sideCondition){const side=move.target==='foeSide'?target.side:user.side;if(side.sideConditions[move.sideCondition])return -80;return b.turn<=3?32:8;}
  if(move.weather)return b.field.weather===move.weather?-80:15;
  if(move.id==='splash'||move.id==='teleport')return -100;
  return 0;
 }
 if(immune(b,move,target))return -100;
 const damage=estimateDamage(b,user,target,move),accuracy=move.accuracy===true?1:move.accuracy/100;
 let score=Math.min(150,100*damage/Math.max(1,target.hp))*accuracy;
 if(damage>=target.hp){score+=45;if(move.priority>0)score+=18;}
 if(move.drain&&user.hp<user.maxhp*.6)score+=15;
 if(move.recoil&&user.hp<=user.maxhp*.2)score-=20;
 if(move.selfdestruct&&user.hp>user.maxhp*.4)score-=60;
 if(move.flags.charge&&!user.volatiles[move.id])score*=.62;
 if(move.flags.recharge&&damage<target.hp)score*=.6;
 if(move.id==='fakeout'&&user.activeMoveActions>0)return -100;
 return score;
}
function available(b,user,foes,request){return (request||user.moveSlots).map((slot,i)=>{const move=b.dex.moves.get(slot.id);if(slot.disabled||slot.pp<=0)return {i,score:-Infinity};const options=foes.map(target=>({i,move,target,score:scoreMove(b,user,target,move)}));return options.sort((a,b)=>b.score-a.score)[0]||{i,score:-Infinity};}).sort((a,b)=>b.score-a.score);}
function switchScore(b,p,foes){const attack=available(b,p,foes).find(o=>Number.isFinite(o.score))?.score??-100;const threat=Math.max(0,...foes.map(t=>Math.max(0,...t.types.map(type=>2**b.dex.getEffectiveness(type,p)*(b.dex.getImmunity(type,p)?1:0)))));return attack+p.hp/p.maxhp*12-threat*12;}
export function trainerChoice(state,b,side){
 const user=side.active[0],foes=side.foes().filter(p=>p.hp>0),request=side.activeRequest;
 if(!user||!request)return 'default';
 const bench=side.pokemon.map((p,i)=>({p,i})).filter(x=>!x.p.isActive&&x.p.hp>0).map(x=>({...x,score:switchScore(b,x.p,foes)})).sort((a,c)=>c.score-a.score);
 if(request.forceSwitch)return bench[0]?'switch '+(bench[0].i+1):'default';
 const options=available(b,user,foes,request.active?.[0]?.moves),best=options[0];
 // Wild Pokémon do not switch. At most one voluntary switch every three turns.
 const memory=(state.battle.aiMemory||={})[side.id]||{switchTurn:-10};
 if(state.battle.encounter.kind!=='wild'&&!request.active?.[0]?.trapped&&bench.length&&b.turn-memory.switchTurn>=3){
  const current=switchScore(b,user,foes),doom=user.volatiles.perishsong?.duration===1;
  if(doom||best?.score<=0&&bench[0].score>current+30){state.battle.aiMemory[side.id]={switchTurn:b.turn};return 'switch '+(bench[0].i+1);}
 }
 if(!best||!Number.isFinite(best.score))return 'default';
 let choice='move '+(best.i+1);
 if(b.gameType==='multi'&&['normal','any','adjacentFoe'].includes(best.move.target))choice+=' '+user.getLocOf(best.target);
 return choice;
}
