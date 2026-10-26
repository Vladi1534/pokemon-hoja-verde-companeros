// A coherent ground layer, quays and a top-down vessel; all art is canvas-native.
(function(){
 const tile=Renderer.tile,landmark=Renderer.landmark,prop=Renderer.prop;
 const water=(m,x,y)=>m.grid[y]?.[x]===3||m.buildings.some(b=>b.kind==='ship'&&x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h);
 Renderer.tile=function(c,m,x,y){const furniture=m.props?.find(p=>p.solid&&x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h),raw=furniture?9:m.grid[y][x],building=m.buildings.find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h),t=building?(building.kind==='ship'?3:0):raw,px=x*T,py=y*T,b=(a,d,w,h,col)=>this.box(c,px+a,py+d,w,h,col);
  if(m.theme==='ship'&&m.inside){const deck=m.id==='ssanne_deck';if(t===7){b(0,0,32,32,deck?'#397e99':'#445565');b(0,1,32,4,'#dbe3d6');b(0,25,32,5,'#7e6750');if(y<3){b(6,7,20,16,'#e9e4cc');b(9,9,14,12,'#51899b');b(11,10,3,9,'#a9d3d1');}}else{b(0,0,32,32,'#ba925e');for(let j=0;j<32;j+=8){b(0,j,32,1,'#987348');b(2,j+2,27,1,'#d4b37a');b((y+j)%3*10,j,1,8,'#9e7b50');}if(!deck&&x>=9&&x<=12){b(0,0,32,32,'#926167');b(x===9?2:28,0,2,32,'#ddb775');}if(t===8){b(4,4,24,24,'#795748');b(6,6,20,20,'#e2be82');}}return;}
  if(t===3&&m.theme){b(0,0,32,32,m.theme==='harbor'?'#3d819b':'#579fad');for(let i=0;i<3;i++){const xx=2+Math.floor(hash(x,y,i)*16),yy=6+i*9;b(xx,yy,11,2,'#80bec7');b(xx+3,yy+2,12,1,'#2d7691');}for(const [dx,dy]of [[0,-1],[-1,0],[1,0],[0,1]])if(m.grid[y+dy]?.[x+dx]!==undefined&&!water(m,x+dx,y+dy)&&m.grid[y+dy]?.[x+dx]!==8){b(dx<0?0:dx>0?29:0,dy<0?0:dy>0?29:0,dx?3:32,dy?3:32,'#96d1d2');}return;}
  if(t===11){b(0,0,32,32,m.theme==='lavender'?'#c0bbc5':m.theme==='harbor'?'#d0c7af':'#cfccbb');for(let yy=0;yy<32;yy+=8){b(0,yy,32,1,'#b0af9e');for(let xx=(yy%16?8:0);xx<32;xx+=16){b(xx,yy,1,8,'#b0af9e');b(xx+2,yy+2,12,1,'#e1dfcd');}}return;}
  if(building){const row=m.grid[y].slice();row[x]=0;const grid=m.grid.slice();grid[y]=row;tile.call(this,c,{...m,grid},x,y);return;}
  tile.call(this,c,m,x,y);
  if(m.theme&&!m.inside&&[0,2,5].includes(t)){const tint={stone:'#b4aa8b18',lavender:'#a68fc81a',garden:'#4e977018',volcanic:'#ad956b28',harbor:'#adbb6a13',river:'#69ac9810'}[m.theme];if(tint)b(0,0,32,32,tint);}
 };
 Renderer.landmark=function(c,b,ox,oy){if(b.kind!=='ship')return landmark.call(this,c,b,ox,oy);const x=b.x*T-ox,y=b.y*T-oy,w=b.w*T,h=b.h*T,B=(a,d,ww,hh,col)=>this.box(c,x+a,y+d,ww,hh,col),P=(pts,col)=>this.poly(c,pts.map(([a,d])=>[x+a,y+d]),col);
  // Waterline, shadow, metal hull and wooden deck use the same overhead perspective.
  P([[8,h*.44],[48,12],[w-28,12],[w-4,32],[w-4,h-27],[w-28,h-9],[49,h-9],[8,h*.66]],'#28667d');
  P([[4,h*.45],[49,5],[w-30,5],[w-9,26],[w-9,h-31],[w-31,h-13],[50,h-13],[4,h*.65]],'#344956');
  P([[10,h*.45],[52,10],[w-32,10],[w-16,29],[w-16,h-34],[w-34,h-19],[54,h-19],[10,h*.64]],'#f0edda');
  P([[18,h*.46],[56,19],[w-37,19],[w-26,32],[w-26,h-36],[w-40,h-29],[57,h-29],[18,h*.62]],'#bd9260');
  for(let yy=30;yy<h-29;yy+=8)B(56,yy,w-98,1,'#d8b982');
  // Stepped stern, bow cleats and rails; no house-style door or land foundation.
  for(let yy=38;yy<h-34;yy+=18){B(42,yy,5,8,'#eef0db');B(w-30,yy,5,8,'#eef0db');}
  B(59,18,w-99,4,'#f8f2d9');B(59,h-32,w-100,4,'#eee9d2');
  for(let xx=72;xx<w-48;xx+=27){B(xx,16,3,13,'#71878b');B(xx,h-39,3,13,'#71878b');}
  // Main superstructure with a continuous dark edge and pale roof.
  B(113,43,w-209,h-93,'#6a797e');B(108,37,w-209,h-93,'#e5e7dc');B(116,42,w-225,h-104,'#f4f0d9');
  B(111,h-61,w-215,9,'#557b91');for(let xx=120;xx<w-111;xx+=27){B(xx,h-61,18,7,'#264d64');B(xx+2,h-60,4,3,'#9ed2d5');}
  B(110,39,w-213,5,'#c0c9c6');B(117,49,24,h-123,'#b9c9c7');B(w-139,49,23,h-123,'#b9c9c7');
  for(const xx of [w*.39,w*.58]){B(xx-4,59,47,55,'#8d7c56');B(xx,52,39,55,'#cc9b4e');B(xx+4,48,31,9,'#f0c778');B(xx+4,57,31,9,'#354b58');B(xx+6,73,4,24,'#e9b85b');B(xx+33,67,4,35,'#a3733c');}
  for(const xx of [70,w-72]){B(xx,65,25,56,'#526673');B(xx+3,68,19,50,'#e6e4c9');B(xx+7,75,11,34,'#b7b39a');}
  B(64,h/2-5,15,6,'#456373');B(w-57,h/2-5,15,6,'#456373');
  // Gangway joins the quay to the deck at the actual collision/warp coordinate.
  const gx=b.door.x*T-ox-x;B(gx-1,-9,35,44,'#745d44');for(let yy=-8;yy<34;yy+=7){B(gx+2,yy,29,5,'#d0af79');B(gx+4,yy,2,5,'#e8cf96');}B(gx-4,-14,4,47,'#e5e4cf');B(gx+33,-14,4,47,'#e5e4cf');
  c.font='bold 10px monospace';c.textAlign='center';c.fillStyle='#314c60';c.fillText('S. S. ANNE',x+w*.52,y+h-40);c.textAlign='left';
 };
 Renderer.prop=function(c,x,y,kind){const b=(a,d,w,h,col)=>this.box(c,x+a,y+d,w,h,col);if(kind==='bed'){b(1,0,62,92,'#6b5142');b(4,4,56,80,'#eee9cf');b(7,7,50,22,'#faf6df');b(9,10,46,2,'#d2d4c5');b(4,34,56,49,'#749ca4');b(5,36,54,4,'#b8d2cb');b(8,43,2,34,'#99bebd');b(55,43,2,34,'#527681');b(2,84,60,7,'#b39466');return;}
 if(kind==='table'){b(5,8,54,54,'#684e3d');b(0,3,64,52,'#bf9565');b(4,6,56,45,'#d6b17a');b(7,10,50,2,'#e4c590');b(9,16,30,21,'#eee3be');b(12,18,23,2,'#b2b990');this.ellipse(c,x+47,y+35,7,5,'#ede8d2');b(45,28,5,5,'#70948c');return;}
 if(kind==='bookcase'){b(1,-21,94,52,'#795c45');b(4,-18,88,44,'#b18a56');for(let j=0;j<2;j++){b(6,-15+j*23,84,17,'#5e5945');for(let i=0;i<13;i++){b(8+i*6,-14+j*23,4,14,['#8fa18d','#a76c68','#ddd0a0','#72959e'][i%4]);}b(5,3+j*23,87,3,'#d1af75');}return;}
 if(kind==='plant'){b(9,16,16,14,'#b78459');b(7,15,20,5,'#d1aa6c');this.ellipse(c,x+15,y+4,11,13,'#3e735b');this.ellipse(c,x+9,y+7,8,10,'#63986c');this.ellipse(c,x+22,y+7,9,9,'#89ad74');return;}
 if(['stove','sink','counter'].includes(kind)){b(1,3,94,29,'#5b6c70');b(3,4,90,20,'#a6bab3');b(0,-3,96,9,'#e1e3d3');for(let xx=5;xx<90;xx+=30){b(xx,9,24,13,'#bfccc1');b(xx+8,10,8,3,'#536d73');}if(kind==='stove'){for(const xx of [18,46,74]){this.ellipse(c,x+xx,y-3,9,6,'#4c5c62');this.ellipse(c,x+xx,y-4,5,3,'#a4aaa2');}}if(kind==='sink'){b(27,-8,38,12,'#698c99');b(32,-6,28,8,'#aacdd0');b(46,-15,4,11,'#c7d6d0');b(49,-15,10,3,'#c7d6d0');}return;}
 if(kind==='bollard'){this.ellipse(c,x+16,y+24,11,4,'#3b596052');b(10,10,12,17,'#526b70');b(6,9,20,6,'#3d535d');b(8,9,16,2,'#a5b2a5');b(13,15,3,10,'#8c9f93');return;}if(kind==='crate'){b(2,5,28,26,'#79603f');b(4,3,24,24,'#bf995f');b(4,3,24,3,'#ddba7d');b(4,23,24,3,'#98733e');b(6,5,3,18,'#8a693f');b(23,5,3,18,'#e2bd7c');for(let i=0;i<18;i+=2)b(7+i,7+i,3,3,'#9b7746');return;}if(kind==='barrel'){b(7,5,19,25,'#77533d');b(5,7,22,19,'#ad804d');b(8,4,16,4,'#d1a768');b(5,11,22,3,'#5d6c64');b(5,23,22,3,'#5d6c64');b(9,8,3,18,'#c19456');return;}if(kind==='cabinDoor'){b(0,-28,32,58,'#3d5361');b(3,-26,26,53,'#c49a64');b(5,-23,22,47,'#d8b782');b(10,-18,13,13,'#4c8291');b(12,-17,3,10,'#bdd6cb');b(24,10,3,4,'#e8d392');b(0,28,32,4,'#e4cca0');return;}return prop.call(this,c,x,y,kind);};
 Renderer.explorationProps=function(sorted,m,ox,oy){for(const d of m.details||[])if(d.kind==='quay')sorted.push({y:d.y*T-1,draw:()=>{this.box(ctx,d.x*T-ox,d.y*T-oy-4,d.w*T,4,'#ebe0bf');this.box(ctx,d.x*T-ox,d.y*T-oy,d.w*T,7,'#707f7c');for(let x=0;x<d.w;x++){if(x+d.x===20||x+d.x===21||x+d.x===32||x+d.x===33)continue;this.box(ctx,(d.x+x)*T-ox+2,d.y*T-oy+7,28,6,'#4d6d73');}}});
  for(const o of m.blockers||[])if(!Game.flags[o.id])sorted.push({y:o.y*T+29,draw:()=>{const x=o.x*T-ox,y=o.y*T-oy;this.ellipse(ctx,x+16,y+25,14,5,'#284d4050');this.box(ctx,x+13,y+9,6,21,'#84633e');this.poly(ctx,[[x+2,y+17],[x+4,y+4],[x+12,y-8],[x+22,y-6],[x+30,y+8],[x+27,y+21],[x+8,y+22]],'#398a58');this.poly(ctx,[[x+6,y+9],[x+12,y-5],[x+20,y-3],[x+24,y+9],[x+16,y+15]],'#8ac16b');}});
 };
})();
