/* A permanent address book belongs to the portable trainer, across private worlds. */
const Friends={
 data:null,key:null,busy:false,syncing:false,error:'',hiddenInvites:new Set(),
 async start(){
  clearTimeout(this.timer);
  if(this.key!==Personal.record?.key){this.key=Personal.record?.key;this.data=null;this.hiddenInvites=new Set();}
  await this.sync();
 },
 async sync(){
  if(!Personal.record||this.syncing)return;
  const key=Personal.record.key,trainer=Personal.record.portable?.trainer;
  if(!trainer)return;
  this.syncing=true;
  try{
   const data=await Personal.remote({action:'social_sync',name:trainer.name,starter:trainer.starter,avatar:trainer.avatar,room:Personal.mode==='online'?Coop.session?.room:null},key);
   if(key!==Personal.record?.key)return;
   this.error='';this.receive(data);
   try{localStorage.setItem('KANTO_CONTACTS_'+trainer.id,JSON.stringify(data));}catch{}
  }catch(e){
   if(key!==Personal.record?.key)return;this.error='Sin conexión con Amigos';
   if(!this.data)try{this.data=JSON.parse(localStorage.getItem('KANTO_CONTACTS_'+trainer.id)||'null');}catch{}
   this.refresh();
  }finally{this.syncing=false;clearTimeout(this.timer);if(key===Personal.record?.key&&!document.hidden)this.timer=setTimeout(()=>this.sync(),12000);}
 },
 receive(data){
  const before=JSON.stringify([this.data?.friends,this.data?.invitations]),after=JSON.stringify([data.friends,data.invitations]);
  this.data=data;this.refresh();
  if(before!==after&&UI.opened&&UI.kind==='friends'&&!this.busy)this.menu(false);
  const code=$('myFriendCode');if(code)code.textContent=data.code;const copy=$('friendCopy');if(copy)copy.disabled=false;
 },
 invitations(){return (this.data?.invitations||[]).filter(x=>x.expires>Date.now()&&!this.hiddenInvites.has(x.id));},
 refresh(){
  const incoming=this.invitations().length+(this.data?.friends||[]).filter(f=>f.status==='incoming').length;
  const count=(this.data?.friends||[]).filter(f=>f.status==='friend'&&f.online&&!this.error).length;
  const entry=document.querySelector('[data-personal=menu]');if(entry)entry.textContent='Amigos'+(count?' · '+count+' conectado'+(count===1?'':'s'):'');
  const badge=$('friendsCount');if(badge)badge.textContent=count?count+' conectado'+(count===1?'':'s'):'Tu lista permanente';
  if(typeof Handheld!=='undefined')Handheld.refresh();
  const button=$('handheldAlert');
  if(incoming&&button&&Handheld.mobile&&!Coop.state?.proposal){button.hidden=false;button.textContent='Amigos · '+incoming+' aviso'+(incoming===1?'':'s');button.onclick=()=>this.menu();}
 },
 async act(action,args={}){
  if(this.busy)return null;this.busy=true;
  try{if(!this.data||this.error)await this.sync();const data=await Personal.remote({action,...args},Personal.record.key);if(data.friends)this.receive(data);return data;}
  catch(e){UI.toast(e.message);return null;}
  finally{this.busy=false;}
 },
 menu(refresh=true){
  if(!Coop.active)return Personal.title();
  const pr=Coop.state.proposal,invited=pr?.players.includes(Coop.state.me);
  const friends=(this.data?.friends||[]).filter(f=>f.status==='friend'),pending=(this.data?.friends||[]).filter(f=>f.status!=='friend'),invites=this.invitations();
  UI.open('friends',UI.top('Amigos',this.error||'SIEMPRE EN TU LISTA')+
   `${invited?'<div class="friend-invite"><b>'+esc(pr.kind==='gift'?'Regalo pendiente':pr.kind==='trade'?'Intercambio pendiente':pr.kind==='pvp'?'Invitación a duelo':'Combate cooperativo')+'</b><div class="save-options">'+(!pr.accepted.includes(Coop.state.me)?'<button id="friendProposalAccept" class="primary">Revisar</button>':'Esperando respuesta…')+'<button id="friendProposalDecline">Cancelar</button></div></div>':''}`+
   `${Personal.pending()?'<button class="primary" id="friendsRetry">Completar conexión pendiente</button>':''}`+
   invites.map(i=>`<div class="friend-invite"><b>${esc(i.name)} te invita a su mundo</b><div class="save-options"><button class="primary" data-world-accept="${i.id}">${Personal.mode==='online'?'Guardar e ir':'Ir a su mundo'}</button><button data-world-decline="${i.id}">Ahora no</button></div></div>`).join('')+
   `<div class="friend-list">${friends.map(f=>`<button class="friend-row" data-friend="${f.code}"><img src="${ASSETS.front[f.starter]}" alt=""><span><b>${esc(f.name)}</b><small class="${f.online&&!this.error?'friend-online':''}">${f.online&&!this.error?'● Conectado':'○ Desconectado'}</small></span><span aria-hidden="true">›</span></button>`).join('')||'<p class="menu-empty">Agrega a tus amigos una vez.<br>Después podrás invitarlos desde aquí.</p>'}</div>`+
   `${pending.length?'<details class="menu-details" open><summary>Solicitudes · '+pending.length+'</summary>'+pending.map(f=>`<div class="friend-request"><b>${esc(f.name)}</b>${f.status==='incoming'?`<button data-friend-accept="${f.code}">Aceptar</button><button data-friend-remove="${f.code}">Rechazar</button>`:`<small>Solicitud enviada</small><button data-friend-remove="${f.code}">Cancelar</button>`}</div>`).join('')+'</details>':''}`+
   `<div class="menu-footer"><button id="friendAdd">+ Añadir amigo</button><button id="friendWorld">${Personal.mode==='online'?'Este mundo · '+Coop.state.members.length+'/4':'Abrir mi mundo'}</button></div>`);
  if($('friendProposalAccept'))$('friendProposalAccept').onclick=()=>pr.kind==='gift'?Personal.reviewGift(pr):pr.kind==='trade'?Coop.trade(pr):Coop.action('respond',{proposal:pr.id,accept:true}).then(v=>{if(v)UI.close(true);});
  if($('friendProposalDecline'))$('friendProposalDecline').onclick=async()=>{if(await Coop.action('respond',{proposal:pr.id,accept:false}))this.menu(false);};
  $('friendAdd').onclick=()=>this.add();$('friendWorld').onclick=()=>this.world();
  if($('friendsRetry'))$('friendsRetry').onclick=()=>Personal.retryTransfer();
  document.querySelectorAll('[data-friend]').forEach(b=>b.onclick=()=>this.card(b.dataset.friend));
  document.querySelectorAll('[data-friend-accept]').forEach(b=>b.onclick=async()=>{if(await this.act('social_reply',{code:b.dataset.friendAccept,accept:true}))this.menu(false);});
  document.querySelectorAll('[data-friend-remove]').forEach(b=>b.onclick=async()=>{if(await this.act('social_remove',{code:b.dataset.friendRemove}))this.menu(false);});
  document.querySelectorAll('[data-world-accept]').forEach(b=>b.onclick=()=>this.accept(b.dataset.worldAccept));
  document.querySelectorAll('[data-world-decline]').forEach(b=>b.onclick=async()=>{if(await this.act('social_invite_reply',{invitation:b.dataset.worldDecline,accept:false}))this.menu(false);});
  if(refresh)this.sync();
 },
 add(){
  UI.open('friend-add',UI.top('Añadir amigo','SOLO HACE FALTA UNA VEZ')+`<p>Tu código de amigo</p><div class="personal-code friend-code" id="myFriendCode">${esc(this.data?.code||'Conectando…')}</div><button id="friendCopy" ${this.data?'':'disabled'}>Copiar mi código</button><label class="coop-label">Código de tu amigo<input id="friendCode" maxlength="14" placeholder="10 letras y números" autocapitalize="characters" spellcheck="false"></label><button class="primary console-resume" id="friendSend">Enviar solicitud</button><p class="coop-note">Tu amigo debe aceptarla. La lista viaja contigo al importar tu partida.</p>`);
  $('friendCopy').onclick=()=>this.data?.code&&Coop.copy(this.data.code,'Código de amigo copiado.');
  $('friendSend').onclick=async()=>{const code=$('friendCode').value.trim();if(!/^[a-f0-9 -]{10,14}$/i.test(code))return UI.toast('Revisa el código de amigo.');if(await this.act('social_request',{code})){this.menu(false);UI.toast('Solicitud enviada.');}};
 },
 card(code){
  const friend=this.data?.friends.find(f=>f.code===code);if(!friend)return this.menu();
  UI.open('friend-card',UI.top(friend.name,friend.online&&!this.error?'CONECTADO':'DESCONECTADO')+`<div class="friend-profile"><img src="${ASSETS.front[friend.starter]}" alt=""><p>${friend.online&&!this.error?'Invítalo a explorar tu partida contigo.':'Aparecerá conectado cuando abra su partida con internet.'}</p></div><button class="primary console-resume" id="friendInvite" ${friend.online&&!this.error?'':'disabled'}>Invitar a mi mundo</button><button class="console-resume" id="friendBack">Volver a Amigos</button><details class="menu-details"><summary>Gestionar amistad</summary><button id="friendDelete">Quitar de mi lista</button></details>`);
  $('friendBack').onclick=()=>this.menu(false);$('friendInvite').onclick=()=>this.invite(code);
  $('friendDelete').onclick=()=>UI.ask('Quitar a '+esc(friend.name),'Dejaréis de aparecer en vuestras listas de amigos.',[{label:'Quitar amigo',fn:async()=>{if(await this.act('social_remove',{code}))this.menu(false);}},{label:'Conservar',fn:()=>this.card(code)}]);
 },
 async invite(code){
  if(Personal.pending()||Personal.changing)return UI.toast('Espera a que termine la conexión.');
  if(Personal.mode==='solo'){this.inviting=true;try{await Personal.connect('host');}finally{this.inviting=false;}}
  if(Personal.mode!=='online')return;
  if(Coop.state.host!==Coop.state.me)return UI.toast('Vuelve a tu partida personal para abrir tu propio mundo.');
  await this.sync();if(await this.act('social_invite',{code,room:Coop.session.room})){this.menu(false);UI.toast('Invitación enviada. Tu amigo puede aceptarla desde Amigos.');}
 },
 async accept(id){
  if(Coop.state.battle&&!Coop.state.battle.ended&&Coop.state.battle.you)return UI.toast('Termina el combate antes de viajar.');
  if(Personal.mode==='online'){await Personal.leave();if(Personal.mode==='online')return;}
  const data=await this.act('social_invite_reply',{invitation:id,accept:true});if(!data)return;
  await Personal.connect('join',data.invite);
  if(Personal.mode==='online'){this.hiddenInvites.add(id);this.sync();UI.close(true);}
 },
 world(invite=''){
  const online=Personal.mode==='online',s=Coop.state;
  UI.open('friend-world',UI.top(online?(s.host===s.me?'Tu mundo':'Mundo de un amigo'):'Tu partida',''+(online?'ONLINE · '+s.members.length+'/4':'1 JUGADOR'))+
   (Personal.pending()?'<button class="primary" id="worldRetry">Reintentar conexión</button>':online?`<div class="friend-list">${s.members.filter(m=>m.id!==s.me).map(m=>`<button class="friend-row" data-world-player="${m.id}"><img src="${ASSETS.front[m.leader||m.starter]}" alt=""><span><b>${esc(m.name)}</b><small>${esc(Coop.placeName(m.position.map))}</small></span><span>›</span></button>`).join('')||'<p class="menu-empty">Todavía no hay invitados.</p>'}</div><button class="primary console-resume" id="worldLeave">Guardar y seguir solo</button>`:'<p>Abre este mundo para recibir a tus amigos.</p><button class="primary console-resume" id="worldOpen">Abrir a amigos</button>')+
   `<button class="console-resume" id="worldFriends">Ver mis amigos</button><details class="menu-details" ${invite?'open':''}><summary>Usar un código de mundo</summary>${online?`<div class="personal-code">${esc(s.invite)}</div><button id="worldCopy">Copiar código</button>`:`<input id="worldCode" placeholder="Código de 8 caracteres" value="${esc(invite)}" autocapitalize="characters"><button id="worldJoin">Unirme</button>`}</details>`);
  $('worldFriends').onclick=()=>this.menu();if($('worldRetry'))$('worldRetry').onclick=()=>Personal.retryTransfer();
  if($('worldOpen'))$('worldOpen').onclick=()=>Personal.connect('host');if($('worldLeave'))$('worldLeave').onclick=()=>Personal.leave();
  if($('worldCopy'))$('worldCopy').onclick=()=>Coop.copy(s.invite,'Código de mundo copiado.');
  if($('worldJoin'))$('worldJoin').onclick=()=>{let code=$('worldCode').value.trim();try{code=new URLSearchParams(new URL(code).hash.slice(1)).get('sala')||code;}catch{}if(!/^(?:[a-f0-9]{8}|[a-f0-9]{36})$/i.test(code))return UI.toast('Revisa el código del mundo.');Personal.connect('join',code);};
  document.querySelectorAll('[data-world-player]').forEach(b=>b.onclick=()=>this.player(b.dataset.worldPlayer));
 },
 player(id){
  const m=Coop.state.members.find(m=>m.id===id);if(!m)return this.world();
  UI.ask(m.name,'Acercaos en el mismo mapa para interactuar.',[
   {label:'Duelo amistoso',fn:async()=>{if(await Coop.action('propose',{kind:'pvp',other:id}))UI.close(true);}},
   {label:'Regalar',fn:()=>Personal.giftTo(m)},
   {label:'Intercambiar',fn:()=>Coop.trade()},
   {label:'Volver',fn:()=>this.world()}
  ]);
 }
};
(function(){
 const install=Personal.install;
 Personal.install=function(data,session){install.call(this,data,session);Friends.start();};
 Personal.menu=function(invite=''){if(!Coop.active){this.invitation=invite||this.invitation;return this.title();}return invite?Friends.world(invite):Friends.menu();};
 Personal.invite=function(){if(Friends.inviting)return;Friends.world();};
 document.addEventListener('visibilitychange',()=>{
  if(!Personal.record)return;
  if(document.hidden){clearTimeout(Friends.timer);Personal.remote({action:'social_away'},Personal.record.key).catch(()=>{});}
  else Friends.start();
 });
})();
