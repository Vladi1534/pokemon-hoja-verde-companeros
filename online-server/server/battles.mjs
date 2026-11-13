import {trainerChoice} from './trainer-ai.mjs';
import {Battle, Dex, Pokemon} from '@pkmn/sim';
import {createClone,donorKey,nameClone} from './clones.mjs';
import {createMon,initializeMember,toSet,heal,stats,gainXP,gainEV,autoLearn,species,threshold,move,addMon,catchRoll,captureAttempt,captureOdds,items,useItem} from './creatures.mjs';
import {victory,campaignFor,world,encounter} from './campaign.mjs';
for (const generation of [3,4]) if(!Dex.formats.get('gen'+generation+'companerosmulti').exists) Dex.formats.extend([
 {name:'[Gen '+generation+'] Companeros Multi',mod:'gen'+generation,gameType:'multi',ruleset:['Cancel Mod','Max Team Size = 6','Max Move Count = 4']},
 {name:'[Gen '+generation+'] Companeros Singles',mod:'gen'+generation,gameType:'singles',ruleset:['Cancel Mod','Max Team Size = 6','Max Move Count = 4']},
]);
export const pokemon=(id,level)=>toSet(createMon(id,level));
export function party(member){initializeMember(member,true);return member.party.filter(m=>!m.eggSteps).map(toSet);}
export function newBattle(state,proposal,now){
 const ids=proposal.players,humans=ids.map(id=>state.members.find(m=>m.id===id));for(const m of humans)initializeMember(m,true);
 const enc=proposal.encounter||{kind:'practice',name:'Guías de Ruta',team:[[19,7],[10,7]],flag:'training'};
 const temporary=proposal.kind==='pvp'||enc.kind==='practice',multi=proposal.kind!=='pvp'&&enc.kind!=='wild'&&ids.length===2;
 const rewardOwners=humans.filter(m=>{if(!state.personal||!enc.flag||temporary)return true;const ctx=campaignFor(state,m),n=world.maps[humans[0].position.map]?.npcs.find(n=>n.id===proposal.npc);if(n){try{const own=encounter(ctx,m,m.position,n);return own.flag===enc.flag&&(enc.kind!=='league'||own.round===enc.round);}catch{return false;}}return enc.repeatable?(ctx.progress['wins_'+enc.flag]??Number(!!ctx.progress[enc.flag]))<3:enc.kind==='league'?ctx.league===enc.round:!ctx.progress[enc.flag];}).map(m=>m.id);
 const owners={p1:ids[0],...(proposal.kind==='pvp'?{p2:ids[1]}:multi?{p3:ids[1]}:{})};
 const humanParty=m=>{const mons=m.party.filter(p=>!p.eggSteps).map(p=>structuredClone(p));if(temporary)mons.forEach(heal);if(!mons.some(p=>p.hp>0))throw Error('Tu equipo está debilitado. Vuelve a un Centro Pokémon.');return mons.sort((a,b)=>Number(a.hp<=0)-Number(b.hp<=0));};
 const model={p1:humanParty(humans[0]),p2:proposal.kind==='pvp'?humanParty(humans[1]):(multi&&enc.opponents?enc.opponents[0].team:enc.team).map(([id,l])=>createMon(id,Math.min(100,l+(multi?1:0))))};
 if(multi){model.p3=humanParty(humans[1]);model.p4=(enc.opponents?.[1]?.team||enc.team).map(([id,l])=>createMon(id,Math.min(100,l+1)));}
 const opts={formatid:multi?'gen4companerosmulti':'gen4companerossingles',seed:Array.from(crypto.getRandomValues(new Uint16Array(4)))};
 for(const [side,mons] of Object.entries(model))opts[side]={name:owners[side]?side+' '+state.members.find(m=>m.id===owners[side]).name:(multi&&enc.opponents?enc.opponents[side==='p4'?1:0].name:enc.name+(side==='p4'?' · refuerzo':'')),team:mons.map((m,i)=>({...toSet(m),campaignUid:m.uid,campaignSlot:i,cloneVariant:!!m.clone||!!enc.cloneTeam&&!owners[side]}))};
 const b=new Battle(opts);
 for(const side of b.sides){for(const mon of side.pokemon){const saved=model[side.id].find(m=>m.uid===mon.set.campaignUid);mon.hp=saved.hp;mon.fainted=mon.hp<=0;mon.status=saved.status;mon.statusState={id:mon.status,target:mon,...saved.statusState};for(const slots of [mon.moveSlots,mon.baseMoveSlots])for(const slot of slots){slot.maxpp=b.dex.moves.get(slot.id).pp;slot.pp=saved.moves.find(m=>move(m.id).slug.replaceAll('-','')===slot.id)?.pp??slot.maxpp;slot.ppUps=0;}}side.pokemonLeft=side.pokemon.filter(p=>!p.fainted).length;}
 if(enc.memory)b.add('message',enc.memory);
 b.makeRequest('move');state.battle={id:crypto.randomUUID(),kind:proposal.kind,npc:proposal.npc,encounter:enc,temporary,owners,rewardOwners,model,created:now,deadline:now+90000,revision:0,result:null,rewarded:false,participation:{},defeated:[],xp:{},evs:{},settled:false,xpImmediate:true,xpEvents:[],participationByFoe:{}};refreshBattle(state,b,now);return b;
}
function publicEvents(log,ownerSide,extra=[]){const out=[];for(let i=0;i<log.length;i++){let line=log[i];if(line.startsWith('|split|')){const privateSide=line.split('|')[2];i+=2;line=log[ownerSide===privateSide?i-1:i];}if(line&&!/^\|(debug|error|request|seed|teamsize|player|gametype|gen|tier|rule|start|t:|upkeep)\|/.test(line))out.push({seq:i,line});}return [...out,...extra.filter(e=>!ownerSide||e.side===ownerSide)].sort((a,b)=>a.seq-b.seq).slice(-100);}

function track(state,b){
 const st=state.battle;if(st.temporary)return;
 st.participationByFoe ||= {};st.xpEvents ||= [];
 for(const side of b.sides){if(st.owners[side.id])continue;
  for(const foe of side.pokemon){const uid=foe.set.campaignUid;if(st.defeated.includes(uid)||!foe.isActive&&!foe.fainted)continue;
   const facing=st.participationByFoe[uid] ||= {};
   for(const [sid,owner]of Object.entries(st.owners)){const part=facing[owner] ||= [];for(const mon of b.getSide(sid).active)if(mon&&!part.includes(mon.set.campaignUid))part.push(mon.set.campaignUid);}
  }
 }
 for(const side of b.sides){if(st.owners[side.id])continue;for(const foe of side.pokemon){
  const uid=foe.set.campaignUid;if(!foe.fainted||st.defeated.includes(uid))continue;st.defeated.push(uid);
  const yieldData=species(foe.baseSpecies.num);if(!yieldData)continue;
  const faintSeq=b.log.findLastIndex(line=>line.startsWith('|faint|'+side.id)&&line.endsWith(': '+foe.name));let offset=0;
  for(const [sid,owner]of Object.entries(st.owners)){
   if(st.rewardOwners&&!st.rewardOwners.includes(owner))continue;
   const member=state.members.find(m=>m.id===owner),alive=b.getSide(sid).pokemon.filter(p=>p.hp>0),facing=st.participationByFoe[uid]?.[owner]||st.participation[owner]||[];
   const participants=alive.filter(p=>facing.includes(p.set.campaignUid));
   const holder=member.bag.expShare&&alive.find(p=>p.set.campaignUid===member.expShareUid);
   const eligible=[...new Set([...participants,...holder?[holder]:[]])];
   for(const p of eligible){
    const id=p.set.campaignUid,m=member.party.find(m=>m.uid===id);if(!m||m.eggSteps)continue;
    let base=Math.floor(yieldData.baseExpYield*foe.level/7);
    const share=holder?.5:1;
    let xp=(participants.includes(p)?Math.floor(base*share/Math.max(1,participants.length)):0)+(p===holder?Math.floor(base*.5):0);
    if(!['wild','ghost'].includes(st.encounter.kind))xp=Math.floor(xp*1.5);
    if(m.ot!==owner)xp=Math.floor(xp*1.5);
    xp=Math.floor(xp/Object.keys(st.owners).length);
    if(m.level>=100)xp=0;
    st.xp[id]=(st.xp[id]||0)+xp;const ev=st.evs[id] ||= {};for(const [k,v]of Object.entries(yieldData.evYield))ev[k]=(ev[k]||0)+v;
    if(st.xpImmediate){
     copyBattleState(m,p);const oldLevel=m.level,oldMax=p.maxhp;
     gainEV(m,yieldData.evYield);gainXP(m,xp,{deferLearning:true});
     if(m.level!==oldLevel){const values=stats(m);p.level=p.set.level=m.level;p.maxhp=p.baseMaxhp=values.hp;p.hp=p.hp>0?p.hp+values.hp-oldMax:0;m.hp=p.hp;p.baseStoredStats={...values};if(!p.transformed)for(const k of ['atk','def','spa','spd','spe'])p.storedStats[k]=values[k];p.speed=p.storedStats.spe;}
    }
    const shown=structuredClone(m);if(!st.xpImmediate)gainXP(shown,st.xp[id]);
    st.xpEvents.push({side:sid,seq:(faintSeq<0?b.log.length-.5:faintSeq)+.001*(++offset),line:['','exp',sid,id,m.nickname||species(m.species).name,xp,shown.xp,shown.level,threshold(m.species,shown.level),shown.level<100?threshold(m.species,shown.level+1):'',p.hp,p.maxhp].join('|')});
   }
  }
 }}
}
function copyBattleState(m,p){m.hp=p.hp;m.status=p.status;m.statusState={};for(const k of ['time','startTime','duration'])if(Number.isFinite(p.statusState?.[k]))m.statusState[k]=p.statusState[k];for(const v of m.moves){const slot=p.baseMoveSlots.find(q=>q.id===move(v.id).slug.replaceAll('-',''));if(slot)v.pp=Math.min(slot.pp,move(v.id).pp);}}
function persistTeams(state,b){const st=state.battle;for(const [side,owner]of Object.entries(st.owners)){const member=state.members.find(m=>m.id===owner);for(const p of b.getSide(side).pokemon){const m=member.party.find(m=>m.uid===p.set.campaignUid);if(!m)continue;copyBattleState(m,p);if(!st.xpImmediate){gainEV(m,st.evs[m.uid]||{});gainXP(m,st.xp[m.uid]||0);}autoLearn(m);}}
}
export function refreshBattle(state,b,now){
 const st=state.battle;track(state,b);st.revision++;st.turn=b.turn;st.ended=b.ended;
 if(b.ended&&!st.settled){st.settled=true;const winning=b.sides.find(s=>s.name===b.winner),owner=winning&&st.owners[winning.id];if(!st.result)st.result=b.winner?(st.kind==='pvp'?'pvp':owner?'victory':'defeat'):'draw';st.winner=owner||null;
  if(!st.temporary){persistTeams(state,b);if(owner){victory(state,st);st.rewarded=true;if(!['wild','ghost'].includes(st.encounter.kind))for(const id of st.rewardOwners||Object.values(st.owners)){const m=state.members.find(m=>m.id===id);m.money+=Math.floor(st.encounter.team.at(-1)[1]*30*(st.encounter.rematch?1/3:1));}}else if(st.encounter.kind==='league')for(const id of Object.values(st.owners))campaignFor(state,state.members.find(m=>m.id===id)).league=0;}
  else if(st.encounter.kind==='practice'&&owner){for(const id of Object.values(st.owners))campaignFor(state,state.members.find(m=>m.id===id)).progress[st.encounter.flag||'training']=true;st.rewarded=true;}
 }
 st.common={id:st.id,rulesGeneration:b.gen,kind:st.kind,encounter:st.encounter.kind,title:st.encounter.name,temporary:st.temporary,revision:st.revision,turn:b.turn,ended:b.ended,result:st.result,winner:st.winner,rewarded:st.rewarded,deadline:st.deadline,log:publicEvents(b.log,null,st.xpEvents).map(e=>e.line),events:publicEvents(b.log,null,st.xpEvents),sides:b.sides.map(s=>({id:s.id,trainer:st.owners[s.id]?state.members.find(m=>m.id===st.owners[s.id]).name:s.name,owner:st.owners[s.id]||null,ready:s.isChoiceDone(),trainerLook:st.owners[s.id]?state.members.find(m=>m.id===st.owners[s.id]).avatar:st.encounter.trainerLook||'gentleman',trainerPic:st.owners[s.id]?null:st.encounter.trainerPic,trainerClass:st.owners[s.id]?null:st.encounter.trainerClass,roster:s.pokemon.map(p=>({fainted:p.fainted,status:p.status,active:p.isActive})),active:s.active.filter(Boolean).map(p=>({id:p.species.num,name:p.name,level:p.level,gender:p.gender,cloneVariant:!!p.set.cloneVariant,hp:Math.ceil(100*p.hp/p.maxhp),status:p.status,fainted:p.fainted}))}))};
 st.views={};for(const [side,id]of Object.entries(st.owners)){const s=b.getSide(side),r=s.activeRequest;const pending=st.pendingClones?.[id],clone=pending&&state.members.find(m=>m.id===id).box.find(m=>m.uid===pending.uid);st.views[id]={side,pendingClone:clone?{uid:clone.uid,name:clone.nickname||species(clone.species).name,species:clone.species,level:clone.level,ready:st.ended||st.turn>pending.turn}:null,cloneUsed:!!st.cloneUsed?.[id],events:publicEvents(b.log,side,st.xpEvents),ready:s.isChoiceDone(),forceSwitch:!!r?.forceSwitch,wait:!!r?.wait,moves:(r?.active?.[0]?.moves||[]).map(m=>({...m,type:b.dex.moves.get(m.id).type,category:b.dex.moves.get(m.id).category,power:b.dex.moves.get(m.id).basePower,accuracy:b.dex.moves.get(m.id).accuracy})),capture:st.encounter.kind==='wild'&&b.p2.active[0]?.hp>0?Object.fromEntries(['ball','superball','ultraball','masterball'].map(key=>[key,captureOdds(b.p2.active[0].species.num,b.p2.active[0].maxhp,b.p2.active[0].hp,b.p2.active[0].status,key).chance])):null,trapped:!!r?.active?.[0]?.trapped,team:s.pokemon.map(p=>({ ...battleProgress(state,st,id,p),uid:p.set.campaignUid,id:p.species.num,name:p.name,cloneVariant:!!p.set.cloneVariant,active:p.isActive,fainted:p.fainted,hp:p.hp,maxHp:p.maxhp,status:p.status,pp:p.moveSlots.map(m=>({id:m.id,pp:m.pp,maxpp:m.maxpp}))}))};}
 st.serialized=JSON.stringify(b.toJSON());
}
function battleProgress(state,st,id,p){
 const m=state.members.find(m=>m.id===id)?.party.find(m=>m.uid===p.set.campaignUid);
 if(!m)return {};
 return {level:m.level,gender:m.gender,xp:m.xp,levelXp:threshold(m.species,m.level),nextXp:m.level<100?threshold(m.species,m.level+1):null,xpEarned:st.xp[m.uid]||0};
}
export const resume=state=>Battle.fromJSON(state.battle.serialized);
export function computerChoices(state,b){for(let pass=0;pass<16&&!b.ended;pass++){let acted=false;for(const s of b.sides){if(state.battle.owners[s.id]||s.isChoiceDone())continue;const choice=trainerChoice(state,b,s),ok=b.choose(s.id,choice)||b.choose(s.id,'default');acted=ok||acted;if(b.ended)break;}if(!acted)break;}}

function ready(state,member,input){const st=state.battle;if(!st||st.ended)throw Error('El combate ya terminó.');if(input.battle!==st.id||input.turn!==st.turn)throw Error('El turno cambió. Espera la actualización.');const side=Object.keys(st.owners).find(s=>st.owners[s]===member.id);if(!side)throw Error('Estás observando este combate.');const b=resume(state),s=b.getSide(side);if(s.isChoiceDone())throw Error('Ya enviaste tu decisión.');if(!!input.forceSwitch!==!!s.activeRequest?.forceSwitch)throw Error('El turno cambió. Espera la actualización.');return {st,b,s,side};}
export function choose(state,member,input,now){const {st,b,side}=ready(state,member,input);const choice=String(input.choice||'');if(!/^(move [1-4]( -?[12])?|switch [1-6]|default)$/.test(choice))throw Error('Decisión no válida.');if(!b.choose(side,choice))throw Error('Esa acción no es válida ahora. Revisa el objetivo o cambia de Pokémon.');const prev=st.turn;computerChoices(state,b);if(b.turn!==prev)st.deadline=now+90000;if(b.turn>=150&&!b.ended)b.tie();refreshBattle(state,b,now);}
export function battleItem(state,member,input,now){const {st,b,s}=ready(state,member,input);if(st.temporary||s.activeRequest?.forceSwitch)throw Error('No puedes usar objetos en este combate o durante un cambio obligatorio.');const item=items[input.item];if(!item||!member.bag[input.item])throw Error('No tienes ese objeto.');if(item.rate){if(st.encounter.kind!=='wild'||b.gameType!=='singles')throw Error('Solo puedes capturar Pokémon salvajes en un encuentro individual.');if(member.party.length===6&&member.box.length>=180)throw Error('Tu PC está lleno.');member.bag[input.item]--;const target=b.p2.active[0];const attempt=captureAttempt(target.species.num,target.maxhp,target.hp,target.status,input.item);b.add('ball',input.item,target,attempt.shakes,attempt.caught?'caught':'escaped');if(attempt.caught){const caught=st.model.p2.find(m=>m.uid===target.set.campaignUid);copyBattleState(caught,target);caught.ot=member.id;addMon(member,caught);if(st.encounter.captureFlag)campaignFor(state,member).progress[st.encounter.captureFlag]=true;st.result='captured';b.add('message','¡Pokémon capturado!');b.win(s);refreshBattle(state,b,now);return;}b.add('message','El Pokémon escapó de la Ball.');}
 else if(item.escape){if(st.encounter.kind!=='wild')throw Error('El Poké Muñeco solo funciona contra Pokémon salvajes.');member.bag[input.item]--;st.result='escaped';b.add('message','Usaste un Poké Muñeco y escapaste.');b.win(s);refreshBattle(state,b,now);return;}
 else if(item.volatileCure){const active=s.active[0];if(!active.volatiles[item.volatileCure])throw Error('Tu Pokémon no está confuso.');active.removeVolatile(item.volatileCure);b.add('message','Usaste '+item.name+'. La flauta permanece en tu mochila.');}
 else if(item.boost||item.volatile||item.sideCondition){const active=s.active[0];if(input.mon&&input.mon!==active.set.campaignUid)throw Error('El objeto se usa sobre tu Pokémon activo.');if(item.boost&&(active.boosts[item.boost]||0)>=6||item.volatile&&active.volatiles[item.volatile]||item.sideCondition&&s.sideConditions[item.sideCondition])throw Error('Ese objeto ya no tendrá efecto.');member.bag[input.item]--;b.add('message','Usaste '+item.name+'.');if(item.boost)b.boost({[item.boost]:1},active);if(item.volatile)active.addVolatile(item.volatile);if(item.sideCondition)s.addSideCondition(item.sideCondition);}
 else if(item.cloneBall){
  if(!campaignFor(state,member).progress.clone_remote)throw Error('Activa primero el dispositivo en el laboratorio de Isla Nueva.');
  if(st.kind==='pvp'||!['trainer','league'].includes(st.encounter.kind)||!st.npc)throw Error('La Clon Ball solo funciona contra entrenadores NPC.');
  if(st.cloneUsed?.[member.id])throw Error('El dispositivo ya se utilizó en este combate.');
  if(member.box.length>=180)throw Error('Deja una casilla libre en el PC para recibir el clon.');
  const enemy=b.sides.find(q=>q.id===(input.target||s.foe.id)&&!st.owners[q.id]),target=enemy?.active[0];
  if(!target||target.fainted||target.hp<=0)throw Error('Elige un Pokémon rival que siga combatiendo.');
  const original=st.model[enemy.id].find(m=>m.uid===target.set.campaignUid),slot=target.set.campaignSlot??st.model[enemy.id].indexOf(original);
  const key=donorKey(st.npc,enemy.id,slot,original.species);
  if(member.rewards[key])throw Error('Ya clonaste este ejemplar. Su entrenador recuerda lo ocurrido.');
  const clone=createClone(original,{npc:st.npc,trainer:st.encounter.name,side:enemy.id,slot,owner:member.id});
  member.bag[input.item]--;member.rewards[key]=true;member.caught[clone.species]=true;member.box.push(clone);
  (st.cloneUsed||={})[member.id]=true;(st.pendingClones||={})[member.id]={uid:clone.uid,turn:b.turn};
  b.add('message','¡La Clon Ball capturó los datos de '+target.name+'! El original vuelve intacto a su entrenador.');
  b.add('message','El clon está a salvo en tu PC. Podrás ponerle un mote y recibirlo después de este turno.');
 }
 else{if(item.vitamin||item.teach||item.held||item.sourceItemId)throw Error('Usa ese objeto fuera del combate.');const p=s.pokemon.find(p=>p.set.campaignUid===input.mon);if(!p)throw Error('Elige un Pokémon de tu equipo.');const m=structuredClone(member.party.find(m=>m.uid===input.mon));m.hp=p.hp;m.status=p.status;const oldHp=p.hp,oldStatus=p.status;useItem(member,input.item,m);p.hp=m.hp;p.status=m.status;if(!p.status)p.statusState={};if(p.fainted&&p.hp>0){p.fainted=false;s.pokemonLeft++;}b.add('message','Usaste '+item.name+'.');if(p.hp>oldHp)b.add('-heal',p,p.getHealth,'[from] item: '+item.name);if(oldStatus&&!p.status)b.add('-curestatus',p,oldStatus,'[from] item: '+item.name);}
 // A bag action consumes this trainer's entire turn, before attacks.
 s.choice.actions.push({choice:'pass'});computerChoices(state,b);if(b.sides.every(q=>q.isChoiceDone()))b.commitChoices();st.deadline=now+90000;refreshBattle(state,b,now);
}
// Receiving a clone is a second bag action. The selected party and simulator
// slots are replaced by identity, never by the visually sorted battle index.
export function receiveClone(state,member,input,now){
 if(!['pc','add','replace'].includes(input.mode))throw Error('Elige un destino válido para tu clon.');
 const st=state.battle,pending=st?.pendingClones?.[member.id];
 if(!st||input.battle!==st.id||!pending)throw Error('No hay un clon pendiente de recibir.');
 const clone=member.box.find(m=>m.uid===pending.uid);if(!clone)throw Error('El clon ya no está en el PC.');
 if(input.mode==='pc'){
  if(!st.ended&&st.turn<=pending.turn)throw Error('Espera a que termine el turno de captura.');
  nameClone(clone,input.name);delete st.pendingClones[member.id];refreshBattle(state,resume(state),now);return;
 }
 const {b,s}=ready(state,member,input);
 if(st.turn<=pending.turn)throw Error('La recepción se realiza en el turno siguiente.');
 if(s.activeRequest?.forceSwitch)throw Error('Elige primero un relevo para tu Pokémon debilitado. El clon espera en el PC.');
 const old=s.pokemon.find(p=>p.set.campaignUid===input.mon),index=member.party.findIndex(m=>m.uid===input.mon),adding=input.mode==='add';
 if(adding&&member.party.length>=6||!adding&&(!old||index<0))throw Error('Elige un Pokémon de tu equipo para enviar al PC.');
 if(!adding&&old.isActive&&s.activeRequest?.active?.[0]?.trapped)throw Error('Tu Pokémon activo está atrapado. Puedes reemplazar uno de la banca.');
 if(!adding&&member.party[index].eggSteps)throw Error('No puedes enviar un huevo durante un combate.');
 nameClone(clone,input.name);
 const fresh=new Pokemon({...toSet(clone),campaignUid:clone.uid,cloneVariant:true},s);
 for(const slots of [fresh.moveSlots,fresh.baseMoveSlots])for(const moveSlot of slots){moveSlot.pp=moveSlot.maxpp=b.dex.moves.get(moveSlot.id).pp;moveSlot.ppUps=0;}
 const boxIndex=member.box.indexOf(clone);
 if(adding){fresh.position=s.pokemon.length;s.pokemon.push(fresh);s.pokemonLeft++;member.box.splice(boxIndex,1);member.party.push(clone);st.model[s.id].push(structuredClone(clone));}
 else{
  const saved=member.party[index];copyBattleState(saved,old);
  const position=s.pokemon.indexOf(old),wasActive=old.isActive;
  if(wasActive){
   fresh.position=s.pokemon.length;s.pokemon.push(fresh);
   if(!b.actions.switchIn(fresh,s.active.indexOf(old)))throw Error('No se pudo completar la recepción del clon.');
   s.pokemon.splice(s.pokemon.indexOf(old),1);old.position=position;
  }else{fresh.position=position;s.pokemon[position]=fresh;}
  // References such as Leech Seed and lastAttackedBy must serialize to an
  // existing battler after the original has been transferred out of the team.
  const visited=new WeakSet();function refs(obj){if(!obj||typeof obj!=='object'||visited.has(obj))return;visited.add(obj);for(const k of Object.keys(obj)){if(obj[k]===old)obj[k]=fresh;else if(Array.isArray(obj[k])||obj[k]?.constructor===Object)refs(obj[k]);}}
  for(const side of b.sides){for(const p of side.pokemon)refs(p);refs(side.sideConditions);refs(side.slotConditions);refs(side.choice);}refs(b.field);refs(b.queue.list);
  if(old.fainted)s.pokemonLeft++;
  member.box[boxIndex]=saved;member.party[index]=clone;
  const modelIndex=st.model[s.id].findIndex(m=>m.uid===saved.uid);st.model[s.id][modelIndex]=structuredClone(clone);
 }
 s.team=s.pokemon.map(p=>p.set);delete st.pendingClones[member.id];
 b.add('message',`${clone.nickname||species(clone.species).name} ocupa ${fresh.isActive?'el puesto activo':'el puesto en la banca'}. El envío conserva los PS y PP del Pokémon guardado.`);
 s.choice.actions.push({choice:'pass'});computerChoices(state,b);if(b.sides.every(q=>q.isChoiceDone()))b.commitChoices();st.deadline=now+90000;refreshBattle(state,b,now);
}
export function timeout(state,now){const st=state.battle;if(!st||st.ended||now<st.deadline)return false;const b=resume(state);if(st.kind==='pvp'){const missing=b.sides.filter(s=>!s.isChoiceDone());if(missing.length===1)b.win(missing[0].foe);else b.tie();}else{const turn=b.turn;for(const s of b.sides){if(b.turn!==turn||b.ended)break;if(!s.isChoiceDone())b.choose(s.id,'default');}computerChoices(state,b);}st.deadline=now+90000;refreshBattle(state,b,now);return true;}
export function concede(state,member,now){const st=state.battle;if(!st||st.ended)return;const side=Object.keys(st.owners).find(s=>st.owners[s]===member.id);if(!side)throw Error('Solo un participante puede retirarse.');const b=resume(state);if(st.encounter.kind==='wild')st.result='escaped';b.win(b.getSide(side).foe);refreshBattle(state,b,now);}

// Wild escape uses Gen 3 speed/attempt odds; a failed attempt consumes the turn.
export function flee(state,member,input,now,random=()=>crypto.getRandomValues(new Uint8Array(1))[0]){
 const {st,b,s}=ready(state,member,input);
 if(st.encounter.kind!=='wild')throw Error('¡No puedes huir de un combate contra un entrenador!');
 if(s.activeRequest?.forceSwitch)throw Error('Elige primero un Pokémon capaz de continuar.');
 if(s.activeRequest?.active?.[0]?.trapped&&!s.active[0].hasAbility('runaway')&&!s.active[0].hasItem('smokeball'))throw Error('Tu Pokémon está atrapado y no puede huir.');
 const mon=s.active[0],foe=s.foe.active[0],speed=mon.getStat('spe'),enemySpeed=foe.getStat('spe');
 st.escapeAttempts=(st.escapeAttempts||0)+1;
 const chance=Math.floor(speed*128/Math.max(1,enemySpeed))+30*st.escapeAttempts;
 if(speed>=enemySpeed||mon.hasAbility('runaway')||mon.hasItem('smokeball')||chance>255||random()<chance){st.result='escaped';b.add('message','¡Escapaste sin problemas!');b.win(s.foe);refreshBattle(state,b,now);return;}
 b.add('message','¡No pudiste escapar!');s.choice.actions.push({choice:'pass'});computerChoices(state,b);
 if(b.sides.every(q=>q.isChoiceDone()))b.commitChoices();st.deadline=now+90000;refreshBattle(state,b,now);
}
