// Permanent contacts use the portable save's private key, never a world invitation.
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const random=()=>crypto.randomUUID().replaceAll('-','');
const pair=(a,b)=>[a,b].sort().join(':');
const fail=(message,status=400)=>{const e=Error(message);e.status=status;throw e;};
const active=(row,now)=>now-row.seen<35000;
async function roomFor(db,id,secret){
 if(!id)return null;
 const row=await db.prepare('SELECT id,invite,state FROM rooms WHERE id=?').bind(id).first();
 if(!row)return null;
 const s=JSON.parse(row.state),member=s.members.find(m=>m.secret===secret&&!m.departed);
 return member&&s.open!==false?{id:row.id,invite:row.invite,host:s.hostId===member.id,state:s,member}:null;
}
async function contact(db,code){return db.prepare('SELECT * FROM social_trainers WHERE code=?').bind(String(code||'').toUpperCase().replace(/\s|-/g,'')).first();}
async function relationship(db,id,other){return db.prepare('SELECT * FROM friendships WHERE id=?').bind(pair(id,other)).first();}
async function snapshot(db,me,now){
 const links=(await db.prepare('SELECT * FROM friendships WHERE a=? OR b=?').bind(me.id,me.id).all()).results;
 const rows=await Promise.all(links.map(async link=>{
  const other=await db.prepare('SELECT * FROM social_trainers WHERE id=?').bind(link.a===me.id?link.b:link.a).first();
  if(!other)return null;
  return {code:other.code,name:other.name,avatar:other.avatar,starter:other.starter,status:link.status==='accepted'?'friend':link.sender===me.id?'outgoing':'incoming',online:link.status==='accepted'&&active(other,now)};
 }));
 const invitations=(await db.prepare('SELECT i.id,i.sender,i.room,i.expires,t.name,t.code FROM friend_invitations i JOIN social_trainers t ON t.id=i.sender WHERE i.recipient=? AND i.expires>? AND i.status IN (?,?)').bind(me.id,now,'pending','accepted').all()).results;
 const valid=[];
 for(const invitation of invitations){if(invitation.room===me.room)continue;if((await relationship(db,me.id,invitation.sender))?.status==='accepted')valid.push({id:invitation.id,code:invitation.code,name:invitation.name,expires:invitation.expires});}
 return {ok:true,code:me.code,friends:rows.filter(Boolean),invitations:valid,serverTime:now};
}
export async function socialExecute(db,v,token,request,now=Date.now()){
 if(!/^[a-f0-9]{36}$/.test(token||''))fail('Abre tu partida para usar la lista de amigos.',401);
 const id=await hash(token);let me=await db.prepare('SELECT * FROM social_trainers WHERE id=?').bind(id).first();
 if(v.action==='social_sync'){
  const name=String(v.name||'').trim();if(!/^[\p{L}\p{N} _-]{1,16}$/u.test(name)||![1,4,7].includes(v.starter))fail('El entrenador no es válido.');
  const room=await roomFor(db,v.room,id),avatar=v.avatar==='leaf'?'leaf':'red';
  if(!me){
   const hour=Math.floor(now/3600000),limitId='social:'+(await hash((request.headers.get('cf-connecting-ip')||'local')+':'+hour)).slice(0,32);
   const limit=await db.prepare('INSERT INTO limits(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(limitId,(hour+2)*3600000).first();
   if(limit.count>30)fail('Intenta registrar el entrenador más tarde.',429);
   await db.prepare('INSERT INTO social_trainers(id,code,name,avatar,starter,seen,room) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,random().slice(0,10).toUpperCase(),name,avatar,v.starter,now,room?.id||null).run();
  }
  await db.prepare('UPDATE social_trainers SET name=?,avatar=?,starter=?,seen=?,room=? WHERE id=?').bind(name,avatar,v.starter,now,room?.id||null,id).run();
  me=await db.prepare('SELECT * FROM social_trainers WHERE id=?').bind(id).first();
  return snapshot(db,me,now);
 }
 if(!me)fail('Conecta primero tu lista de amigos.',409);
 if(v.action==='social_away'){await db.prepare('UPDATE social_trainers SET seen=0,room=NULL WHERE id=?').bind(id).run();return {ok:true};}
 if(v.action==='social_invite_reply'){
  const invitation=await db.prepare('SELECT * FROM friend_invitations WHERE id=? AND recipient=?').bind(String(v.invitation||''),id).first();
  if(!invitation||invitation.expires<now||!['pending','accepted'].includes(invitation.status))fail('Esta invitación caducó. Pide otra desde Amigos.');
  if(!v.accept){await db.prepare('UPDATE friend_invitations SET status=? WHERE id=? AND recipient=?').bind('declined',invitation.id,id).run();return snapshot(db,me,now);}
  if((await relationship(db,id,invitation.sender))?.status!=='accepted')fail('La amistad ya no está activa.',403);
  const origin=await db.prepare('SELECT * FROM social_trainers WHERE id=?').bind(invitation.sender).first(),room=await roomFor(db,invitation.room,invitation.sender);
  if(!origin||!active(origin,now)||!room?.host)fail('Tu amigo ya no tiene ese mundo abierto.');
  if(room.state.members.filter(m=>!m.departed).length>=4&&!room.state.members.some(m=>m.secret===id&&!m.departed))fail('El mundo ya tiene cuatro entrenadores.');
  await db.prepare('UPDATE friend_invitations SET status=? WHERE id=? AND recipient=?').bind('accepted',invitation.id,id).run();
  return {ok:true,invite:room.invite,name:origin.name};
 }
 const other=await contact(db,v.code);if(!other||other.id===id)fail('Comprueba el código de amigo.');
 const link=await relationship(db,id,other.id),linkId=pair(id,other.id);
 if(v.action==='social_request'){
  if(link)return snapshot(db,me,now);
  for(const person of [id,other.id]){const count=await db.prepare('SELECT COUNT(*) AS n FROM friendships WHERE a=? OR b=?').bind(person,person).first();if(count.n>=50)fail('La lista de amigos está llena.');}
  const [a,b]=[id,other.id].sort();await db.prepare('INSERT INTO friendships(id,a,b,sender,status,created) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(linkId,a,b,id,'pending',now).run();
 }else if(v.action==='social_reply'){
  if(!link||link.status!=='pending'||link.sender===id)fail('No tienes esa solicitud pendiente.',403);
  if(v.accept)await db.prepare('UPDATE friendships SET status=? WHERE id=? AND sender<>?').bind('accepted',linkId,id).run();
  else await db.prepare('DELETE FROM friendships WHERE id=? AND sender<>?').bind(linkId,id).run();
 }else if(v.action==='social_remove'){
  await db.batch([db.prepare('DELETE FROM friendships WHERE id=?').bind(linkId),db.prepare('DELETE FROM friend_invitations WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)').bind(id,other.id,other.id,id)]);
 }else if(v.action==='social_invite'){
  if(link?.status!=='accepted')fail('Agrega y acepta a este amigo antes de invitarlo.',403);
  if(!active(other,now))fail('Tu amigo está desconectado.');
  const room=await roomFor(db,v.room,id);if(!room?.host)fail('Abre tu propia partida a amigos para invitar.');
  if(room.state.members.filter(m=>!m.departed).length>=4)fail('Tu mundo ya tiene cuatro entrenadores.');
  await db.prepare('INSERT INTO friend_invitations(id,sender,recipient,room,expires,status) VALUES(?,?,?,?,?,?) ON CONFLICT(sender,recipient) DO UPDATE SET id=excluded.id,room=excluded.room,expires=excluded.expires,status=excluded.status').bind(random(),id,other.id,room.id,now+180000,'pending').run();
 }else fail('Acción de amigos desconocida.');
 return snapshot(db,me,now);
}
