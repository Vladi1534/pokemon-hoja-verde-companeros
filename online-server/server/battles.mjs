import {Battle, Dex} from '@pkmn/sim';
Dex.formats.extend([
  {name:'[Gen 3] Companeros Multi',mod:'gen3',gameType:'multi',ruleset:['Cancel Mod','Max Team Size = 2','Max Move Count = 4']},
  {name:'[Gen 3] Companeros Singles',mod:'gen3',gameType:'singles',ruleset:['Cancel Mod','Max Team Size = 2','Max Move Count = 4']},
]);
const species={1:['Bulbasaur','Overgrow',['Tackle','Vine Whip','Growl','Leech Seed']],4:['Charmander','Blaze',['Scratch','Ember','Growl','Smokescreen']],7:['Squirtle','Torrent',['Tackle','Bubble','Tail Whip','Withdraw']],16:['Pidgey','Keen Eye',['Tackle','Gust','Sand Attack']],19:['Rattata','Run Away',['Tackle','Quick Attack','Tail Whip']],10:['Caterpie','Shield Dust',['Tackle','String Shot']],13:['Weedle','Shield Dust',['Poison Sting','String Shot']]};
export function pokemon(id,level){const [name,ability,moves]=species[id];return {species:name,name,ability,moves,level,nature:'Hardy',evs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0},ivs:{hp:15,atk:15,def:15,spa:15,spd:15,spe:15}};}
export function party(member){return [pokemon(member.starter,8+member.levelBonus),pokemon(16,7+member.levelBonus)];}
export function newBattle(state,proposal,now){
  const ids=proposal.players,humans=ids.map(id=>state.members.find(m=>m.id===id));
  const multi=proposal.kind==='coop'&&ids.length===2;
  const sideOwners={p1:ids[0],...(proposal.kind==='pvp'?{p2:ids[1]}:multi?{p3:ids[1]}:{})};
  const level=multi?9:7;
  const opts={formatid:multi?'gen3companerosmulti':'gen3companerossingles',seed:Array.from(crypto.getRandomValues(new Uint16Array(4))),p1:{name:'p1 '+humans[0].name,team:party(humans[0])},p2:proposal.kind==='pvp'?{name:'p2 '+humans[1].name,team:party(humans[1])}:{name:'Guía Nico',team:[pokemon(19,level),pokemon(10,level)]}};
  if(multi){opts.p3={name:'p3 '+humans[1].name,team:party(humans[1])};opts.p4={name:'Guía Ana',team:[pokemon(16,level),pokemon(13,level)]};}
  const b=new Battle(opts);for(const side of b.sides)for(const mon of side.pokemon)for(const slots of [mon.moveSlots,mon.baseMoveSlots])for(const slot of slots){slot.pp=slot.maxpp=b.dex.moves.get(slot.id).pp;slot.ppUps=0;}b.makeRequest('move');state.battle={id:crypto.randomUUID(),kind:proposal.kind,owners:sideOwners,created:now,deadline:now+90000,revision:0,result:null,rewarded:false};refreshBattle(state,b,now);return b;
}
function publicLog(log){const out=[];for(let i=0;i<log.length;i++){if(log[i].startsWith('|split|')){i+=2;if(log[i])out.push(log[i]);}else if(!/^\|(debug|error|request|seed|teamsize|player|gametype|gen|tier|rule|start|t:|upkeep)\|/.test(log[i]))out.push(log[i]);}return out.filter(Boolean).slice(-100);}
export function refreshBattle(state,b,now){
  const stored=state.battle;stored.revision++;stored.turn=b.turn;stored.ended=b.ended;
  if(b.ended&&!stored.result){const winning=b.sides.find(s=>s.name===b.winner);const winOwner=winning&&stored.owners[winning.id];const won=!!winOwner;
    stored.result=b.winner?(stored.kind==='coop'?(won?'victory':'defeat'):'pvp'): 'draw';stored.winner=winOwner||null;
    if(stored.kind==='coop'&&won&&!state.progress.training){state.progress.training=true;for(const m of state.members)m.medals=(m.medals||0)+1;stored.rewarded=true;}
  }
  stored.common={id:stored.id,kind:stored.kind,revision:stored.revision,turn:b.turn,ended:b.ended,result:stored.result,winner:stored.winner,rewarded:stored.rewarded,deadline:stored.deadline,log:publicLog(b.log),sides:b.sides.map(s=>({id:s.id,trainer:stored.owners[s.id]?state.members.find(m=>m.id===stored.owners[s.id]).name:s.name,owner:stored.owners[s.id]||null,ready:s.isChoiceDone(),active:s.active.filter(Boolean).map(p=>({id:p.species.num,name:p.name,level:p.level,hp:Math.ceil(100*p.hp/p.maxhp),status:p.status,fainted:p.fainted}))}))};
  stored.views={};for(const [side,id] of Object.entries(stored.owners)){const s=b.getSide(side),r=s.activeRequest;stored.views[id]={side,ready:s.isChoiceDone(),forceSwitch:!!r?.forceSwitch,wait:!!r?.wait,moves:(r?.active?.[0]?.moves||[]).map(m=>({...m,type:Dex.moves.get(m.id).type})),trapped:!!r?.active?.[0]?.trapped,team:s.pokemon.map(p=>({id:p.species.num,name:p.name,active:p.isActive,fainted:p.fainted,hp:p.hp,maxHp:p.maxhp,status:p.status,pp:p.moveSlots.map(m=>({id:m.id,pp:m.pp,maxpp:m.maxpp}))}))};}
  stored.serialized=JSON.stringify(b.toJSON());
}
export function resume(state){return Battle.fromJSON(state.battle.serialized);}
export function computerChoices(state,b){for(let pass=0;pass<3&&!b.ended;pass++){const turn=b.turn;for(const s of b.sides){if(state.battle.owners[s.id]||s.isChoiceDone())continue;b.choose(s.id,'default');}if(b.turn===turn)break;}}
export function choose(state,member,input,now){const st=state.battle;if(!st||st.ended)throw Error('El combate ya terminó.');if(input.battle!==st.id||input.turn!==st.turn)throw Error('El turno cambió. Espera la actualización.');const side=Object.keys(st.owners).find(s=>st.owners[s]===member.id);if(!side)throw Error('Estás observando este combate.');const b=resume(state),s=b.getSide(side);if(s.isChoiceDone())throw Error('Ya enviaste tu decisión.');if(!!input.forceSwitch!==!!s.activeRequest?.forceSwitch)throw Error('El turno cambió. Espera la actualización.');const choice=String(input.choice||'');if(!/^(move [1-4]( -?[12])?|switch [12]|default)$/.test(choice))throw Error('Decisión no válida.');if(!b.choose(side,choice))throw Error('Esa acción no es válida ahora. Revisa el objetivo o cambia de Pokémon.');const prevTurn=st.turn;computerChoices(state,b);if(b.turn!==prevTurn)st.deadline=now+90000;if(b.turn>=100&&!b.ended)b.tie();refreshBattle(state,b,now);}
export function timeout(state,now){const st=state.battle;if(!st||st.ended||now<st.deadline)return false;const b=resume(state);if(st.kind==='pvp'){const missing=b.sides.filter(s=>!s.isChoiceDone());if(missing.length===1)b.win(missing[0].foe);else b.tie();}else{const turn=b.turn;for(const s of b.sides){if(b.turn!==turn||b.ended)break;if(!s.isChoiceDone())b.choose(s.id,'default');}computerChoices(state,b);}st.deadline=now+90000;refreshBattle(state,b,now);return true;}
export function concede(state,member,now){const st=state.battle;if(!st||st.ended)return;const side=Object.keys(st.owners).find(s=>st.owners[s]===member.id);if(!side)throw Error('Sólo un participante puede retirarse.');const b=resume(state);b.win(b.getSide(side).foe);refreshBattle(state,b,now);}
