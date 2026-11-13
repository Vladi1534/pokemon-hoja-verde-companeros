export const CLONE_COST=6000,CLONE_CAPACITY=2;
export const cloneTrials=p=>['corey','fergus','neesha'].every(id=>p['clone_trial_'+id]);
export function mewtwoInteract(s,m,p,n,input={}){
 const f=s.progress,key=n.data?.key;
 if(key==='clone_clue'){f[n.data.clue]=true;return n.data.lines;}
 if(key==='clone_invitation'){
  if(!f.badge4||!f.scope)return 'Neesha: Mewtwo está invitando a entrenadores a Isla Nueva. Consigue la Medalla Arcoíris e investiga la guarida Rocket de Azulona; después podré confiarte la invitación.';
  f.clone_invitation=true;
  return 'Neesha: Esta invitación lleva tu nombre. La marinera de Ciudad Carmín, cerca del puerto, te llevará a Isla Nueva. Puedes ir antes de la Liga y regresar cuando quieras.';
 }
 if(key==='clone_briefing')return f.mewtwo_owned?'El laboratorio es tuyo. La puerta derecha da acceso al dispositivo remoto y a las Clon Balls. En la puerta central puedes curar a tu equipo.':cloneTrials(f)?'Los tres entrenadores confían en ti. Mewtwo espera en la puerta izquierda. Primero deberás superar a sus clones; después podrás capturarlo. Si lo debilitas, puedes volver a intentarlo.':'Corey, Fergus y Neesha quieren combatir contigo, una vez cada uno. Habla con ellos en el vestíbulo. La enfermería está en la puerta central; puedes salir y volver sin perder tus victorias.';
 if(key==='clone_lab'){
  if(!f.mewtwo_owned)return 'El terminal solo reconoce al entrenador que haya capturado a Mewtwo.';
  f.clone_remote=true;
  if(!m.rewards.clone_first_charge){m.rewards.clone_first_charge=true;m.bag.cloneball=(m.bag.cloneball||0)+1;}
  if(input.recharge){const quantity=Number(input.quantity||1);if(!Number.isInteger(quantity)||quantity<1||quantity>CLONE_CAPACITY)throw Error('Elige una o dos cargas.');if((m.bag.cloneball||0)+quantity>CLONE_CAPACITY)throw Error('El dispositivo admite dos Clon Balls.');if(m.money<CLONE_COST*quantity)throw Error('No tienes suficiente dinero para la recarga.');m.money-=CLONE_COST*quantity;m.bag.cloneball=(m.bag.cloneball||0)+quantity;}
  return {cloningLab:true,charges:m.bag.cloneball||0,cost:CLONE_COST,capacity:CLONE_CAPACITY,text:'El laboratorio queda a tu cargo. Cada Clon Ball copia un Pokémon de un entrenador con el mismo nivel, IV, EV, naturaleza, habilidad y movimientos, y devuelve el original intacto. La captura consume un turno; recibirlo en el equipo consume otro. Solo una captura por combate y una copia de cada ejemplar original.'};
 }
}
export function cloneMemory(n,party=[],rewards={}){
 if(party.some(p=>p.clone?.donorId===n.id))return '¡No te bastó con llevarte a mi Pokémon para clonarlo y ahora quieres derrotarme con su copia! El original volvió sano, pero no lo he olvidado.';
 if(Object.keys(rewards||{}).some(k=>k.startsWith('cloned_'+n.id+'_')))return 'Mi Pokémon volvió del laboratorio, pero recuerdo aquella Ball. Esta vez estaremos preparados.';
 return '';
}
export function cloneJournal(progress){
 const steps=[['clone_corey','Una Ball desconocida','route2','clone_corey_clue'],['clone_research','Los documentos del museo','pewter_museum','clone_research_clue'],['clone_fergus','La tormenta de Isla Nueva','route6','clone_fergus_clue'],['clone_invitation','La invitación de Neesha','celadon','clone_invitation'],['clone_guardians','Los tres clones de Mewtwo','clone_arena','clone_mewtwo'],['mewtwo_owned','Capturar a Mewtwo','clone_arena','clone_mewtwo'],['clone_remote','Tu laboratorio','clone_lab','clone_terminal']];
 return steps.map(([id,title,map,npc])=>({id,title,map,npc,done:!!progress[id]}));
}
