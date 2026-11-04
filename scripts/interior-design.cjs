// Authored, compact rooms. Furniture footprints and visual props share one definition.
module.exports=function furnishInteriors(world){
 const maps=world.maps;
 const solid=new Set([2,3,7,10]);
 const rect=(m,x,y,w,h,t)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(m.grid[yy]?.[xx]!==undefined)m.grid[yy][xx]=t;};
 function prop(m,kind,x,y,w=1,h=1){
  if(x<1||y<2||x+w>=m.w||y+h>=m.h)return;
  const landings=Object.values(maps).flatMap(r=>r.portals.filter(p=>p.to===m.id).map(p=>({x:p.tx??21,y:p.ty??3})));
  const occupied=[...m.npcs,...m.signs,...m.items,...m.portals,...landings,m.arrival];
  if(occupied.some(n=>n&&n.x>=x&&n.x<x+w&&n.y>=y&&n.y<y+h))return;
  if(m.props.some(p=>p.solid&&p.x<x+w&&p.x+p.w>x&&p.y<y+h&&p.y+p.h>y))return;
  m.props.push({kind,x,y,w,h,solid:true});rect(m,x,y,w,h,7);
 }
 function room(m,w,h,style){
  m.w=w;m.h=h;m.roomStyle=style;m.worldRevision=5;m.arrival={x:Math.floor(w/2),y:h-3};
  m.grid=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x===0||x===w-1||y<3||y===h-1?7:9));
  m.props=[];m.details=[];
  const exit=m.portals.find(p=>p.to===m.parent)||m.portals[0];
  if(exit){Object.assign(exit,{x:m.arrival.x,y:h-1,w:2,h:1});rect(m,exit.x,h-1,2,1,8);}
  const spots=style==='center'?[[7,4],[12,5],[3,7]]:style==='shop'?[[3,4],[8,7]]:style==='lab'?[[8,5],[4,7],[12,8],[13,4]]:[[8,5],[4,7],[9,7],[3,5]];
  m.npcs.forEach((n,i)=>{const [x,y]=spots[i%spots.length];Object.assign(n,{x,y,homeX:x,homeY:y,dir:'down'});});
  m.signs.forEach((s,i)=>Object.assign(s,{x:2+i*2,y:h-3}));
  m.items.forEach((s,i)=>Object.assign(s,{x:w-3,y:h-3-i}));
 }
 for(const m of Object.values(maps)){
  if(!m.inside||!['home','shop','center','lab'].includes(m.kind))continue;
  if(m.kind==='home'){
   room(m,13,11,'home');
   m.rug={x:4,y:5,w:5,h:4,color:['#7ba987','#75a2b5','#b18caa','#c49470'][m.seed%4]};
   prop(m,'sink',1,3,3);prop(m,'fridge',4,3);prop(m,'tv',1,6,2);prop(m,'table',5,6,2,2);
   prop(m,'chair',4,6);prop(m,'chair',7,7);prop(m,'bookcase',9,3,3);prop(m,'plant',1,9);prop(m,'plant',11,9);
   if(m.id==='pallet_rival')m.npcs.push({id:'pallet_rival_daisy',x:8,y:5,homeX:8,homeY:5,name:'Dalia',look:'lass',dir:'left',role:'talk',data:{lines:['Mi hermano Azul ya salió a entrenar. El laboratorio del profesor Oak está al sur.','Descansa en casa cuando tu equipo lo necesite. Tu mamá estará encantada de ayudarte.']}});
   if(/daycare/.test(m.id)){m.props=m.props.filter(p=>p.kind!=='tv');rect(m,1,6,2,1,9);prop(m,'bed',1,6,2,3);}
   if(m.id==='vermilion_boathouse'){m.rug.color='#78a7bc';prop(m,'barrel',10,7);}
  }else if(m.kind==='center'){
   room(m,15,12,'center');m.rug={x:4,y:7,w:7,h:3,color:'#ac8079'};
   prop(m,'healMachine',6,3,3);prop(m,'counter',4,5,3);prop(m,'counter',8,5,3);
   // The nurse has a clear reachable tile immediately south of the counter gap.
   prop(m,'bench',2,7,2);prop(m,'bench',10,8,2);prop(m,'plant',1,10);prop(m,'plant',13,10);
   prop(m,'bookcase',1,3,3);prop(m,'noticeboard',12,3,2);
  }else if(m.kind==='shop'){
   room(m,11,11,'shop');m.rug={x:4,y:7,w:4,h:3,color:'#76a7b8'};
   prop(m,'shelf',1,3,3);prop(m,'counter',1,5,3);prop(m,'shelf',7,3,3);prop(m,'shelf',7,5,3);prop(m,'shelf',7,7,3);prop(m,'plant',1,9);
  }else{
   room(m,17,12,'lab');m.rug={x:6,y:6,w:5,h:4,color:'#86abb3'};
   prop(m,'bookcase',1,3,3);prop(m,'bookcase',12,3,3);prop(m,'labDesk',2,5,3,2);prop(m,'labDesk',11,5,3,2);prop(m,'plant',1,10);prop(m,'plant',15,10);prop(m,'computerDesk',6,3,3);
   if(m.id==='bill_home'){const pc=m.npcs.find(n=>n.id==='bill_home_bill_pc');Object.assign(pc,{x:13,y:8,homeX:13,homeY:8});prop(m,'teleporter',2,8,2,2);prop(m,'teleporter',10,8,2,2);}
  }
 }
 const home=maps.pallet_home;
 if(home&&!maps.pallet_bedroom){
  const bedroom={...structuredClone(home),id:'pallet_bedroom',name:'Tu habitación',kind:'home',parent:'pallet_home',npcs:[],items:[],signs:[],doors:[],portals:[],buildings:[],props:[],pool:[],building:null};
  room(bedroom,12,10,'bedroom');bedroom.arrival={x:9,y:4};bedroom.rug={x:4,y:5,w:5,h:3,color:'#78a7b5'};
  prop(bedroom,'bed',1,4,2,3);prop(bedroom,'computerDesk',4,3,3);prop(bedroom,'bookcase',1,3,3);prop(bedroom,'plant',10,8);
  bedroom.portals=[{x:9,y:3,w:1,h:1,to:home.id,tx:10,ty:4}];rect(bedroom,9,3,1,1,8);bedroom.props.push({kind:'stairsDown',x:9,y:3,w:2,h:1});
  home.props=home.props.filter(p=>p.kind!=='bookcase');rect(home,9,3,3,1,9);home.portals.push({x:10,y:3,w:1,h:1,to:bedroom.id,tx:9,ty:4});home.props.push({kind:'stairsUp',x:10,y:3,w:2,h:1});rect(home,10,3,1,1,8);
  bedroom.signs.push({x:7,y:3,text:'Tu PC personal. Guarda una copia de tu aventura desde START → Opciones → Descargar partida. La caja Pokémon está en los Centros.'});maps[bedroom.id]=bedroom;
 }
 // Larger story rooms keep their routes, but gain distinct places and furniture.
 for(const m of Object.values(maps)){
  if(!m.inside||m.roomStyle||m.kind==='cave'||m.theme==='ship')continue;
  m.roomStyle=m.kind;m.worldRevision=5;m.arrival={x:10,y:15};
  if(m.kind==='gym'||m.kind==='league'){
   m.rug={x:8,y:5,w:6,h:10,color:m.kind==='league'?'#73869f':'#a19a79'};
   prop(m,'gymStatue',3,13);prop(m,'gymStatue',18,13);prop(m,'plant',3,4);prop(m,'plant',18,4);
   if(m.id==='cerulean_gym'){prop(m,'pool',3,6,4,4);prop(m,'pool',16,6,4,3);}
   if(m.id==='celadon_gym'){for(const x of [3,5,17,19])for(const y of [7,11])prop(m,'plant',x,y);}
  }else if(m.kind==='tower'){for(const x of [3,5,16,18])for(const y of [5,9,13])prop(m,'memorial',x,y);m.rug={x:9,y:5,w:3,h:11,color:'#9a92ae'};}
  else if(m.kind==='museum'){prop(m,'fossilDisplay',3,5,3,2);prop(m,'fossilDisplay',14,9,3,2);prop(m,'bookcase',3,12,3);}
  else if(m.kind==='casino'){for(const x of [3,5,7,13,15])prop(m,'arcade',x,6);for(const x of [4,6,12,14])prop(m,'arcade',x,10);}
  else{prop(m,'bookcase',3,3,3);prop(m,'computerDesk',12,4,3);prop(m,'table',4,10,2,2);prop(m,'plant',18,14);prop(m,'crate',3,14);}
 }
 // Door landings are authored data; both prediction and authority use them.
 for(const m of Object.values(maps))for(const d of m.doors){const r=maps[d.to];if(r?.roomStyle){d.tx=r.arrival.x;d.ty=r.arrival.y;}}
 // Never silently ship inaccessible furniture or characters.
 for(const m of Object.values(maps).filter(m=>m.roomStyle)){
  const p=m.arrival;if(solid.has(m.grid[p.y]?.[p.x])||m.npcs.some(n=>n.x===p.x&&n.y===p.y))throw Error('Unsafe room arrival '+m.id);
 }
};
