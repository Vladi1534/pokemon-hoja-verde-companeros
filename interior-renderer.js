/* Canvas-native pixel furniture and floor plans, in the world's own perspective. */
(()=>{
 const tile=Renderer.tile,prop=Renderer.prop;
 Renderer.tile=function(c,m,x,y){
  if(!m.roomStyle)return tile.call(this,c,m,x,y);
  const px=x*T,py=y*T,B=(a,b,w,h,col)=>this.box(c,px+a,py+b,w,h,col);
  const furniture=m.props.some(p=>p.solid&&x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h);
  const floor=furniture||![7,10].includes(m.grid[y][x]);
  const home=['home','bedroom'].includes(m.roomStyle),old=['tower','mansion','base'].includes(m.roomStyle);
  if(!floor){
   B(0,0,32,32,old?'#5d6870':'#5b756e');
   if(y<3&&x>0&&x<m.w-1){
    B(0,0,32,32,old?'#a1a5a6':home?'#e3dfb9':'#d6e7d9');
    for(let xx=0;xx<32;xx+=8)B(xx,0,1,32,home?'#c8c89f':'#bed5c8');
    if(y===0){B(0,0,32,9,'#536c63');B(0,9,32,3,'#8b9e80');B(0,12,32,2,'#eff0ce');}
    if(y===1&&[2,3,m.w-4,m.w-3].includes(x)){
     B(0,1,32,29,'#846e4e');B(2,3,28,24,'#eff1d7');B(4,5,24,19,'#75b1c7');B(6,7,20,4,'#bde3e1');B(2,26,28,3,'#bca47b');
    }
    if(y===2){B(0,13,32,18,home?'#b59b68':'#94b2a5');B(0,13,32,3,home?'#d5bb82':'#bdd2b8');B(0,29,32,3,home?'#836d4b':'#658d81');}
   }else{B(x===0?26:0,0,6,32,'#8c9c87');B(x===0?29:0,0,3,32,'#b5c6a3');if(y===m.h-1){B(0,0,32,4,'#8ca083');B(0,4,32,3,'#425f54');}}
   return;
  }
  if(home){
   B(0,0,32,32,'#c9b075');
   for(let yy=0;yy<32;yy+=8){const n=(x+y+yy/8)%3;B(0,yy,32,7,['#c9ad71','#d2b77b','#c3a66a'][n]);B(0,yy,32,1,'#e4cc91');B(0,yy+7,32,1,'#a38a59');const seam=((y*3+yy/8)%3)*11;B(seam,yy,1,7,'#a89262');B(seam+3,yy+4,6,1,'#d9bd80');}
  }else{
   const colors=old?['#a9a9ab','#b4b4b2']:m.roomStyle==='center'?['#e6dfcc','#e9e8d6']:['#d1ded3','#dee7da'];
   B(0,0,32,32,colors[(x+y)%2]);B(0,0,32,1,old?'#969ca0':'#b1c8b9');B(0,0,1,32,old?'#969ca0':'#b1c8b9');B(2,2,28,1,'#ffffff30');
   if(m.roomStyle==='center'){this.poly(c,[[px+16,py+2],[px+30,py+16],[px+16,py+30],[px+2,py+16]],(x+y)%2?'#e4d6c6':'#d2dbcd');}
  }
  const rug=m.rug;
  if(rug&&x>=rug.x&&x<rug.x+rug.w&&y>=rug.y&&y<rug.y+rug.h){
   B(0,0,32,32,rug.color);B(0,0,32,1,'#ffffff0c');
   if(x===rug.x){B(0,0,3,32,'#f0e8b3');B(5,0,2,32,'#cbd3a1');}
   if(x===rug.x+rug.w-1){B(29,0,3,32,'#f0e8b3');B(25,0,2,32,'#cbd3a1');}
   if(y===rug.y){B(0,0,32,3,'#f0e8b3');B(0,5,32,2,'#cbd3a1');}
   if(y===rug.y+rug.h-1){B(0,29,32,3,'#f0e8b3');B(0,25,32,2,'#cbd3a1');}
   if((x+y)%2===0){B(13,12,5,3,'#d5e4ae72');B(15,10,2,7,'#d5e4ae72');}
  }
  if(m.grid[y][x]===8&&y===m.h-1){B(0,0,32,32,'#a86454');B(1,2,30,2,'#edbd8f');B(1,28,30,2,'#edbd8f');B(1,2,2,28,'#edbd8f');B(29,2,2,28,'#edbd8f');}
 };
 Renderer.prop=function(c,x,y,kind){
  const B=(a,b,w,h,col)=>this.box(c,x+a,y+b,w,h,col),E=(a,b,rx,ry,col)=>this.ellipse(c,x+a,y+b,rx,ry,col);
  if(kind==='fridge'){B(1,-18,30,49,'#657e7c');B(3,-17,26,44,'#f5f0d9');B(5,-15,22,13,'#d3e0d1');B(4,0,24,2,'#8daca2');B(5,4,22,21,'#e2e9d5');B(23,5,2,9,'#6a8b82');B(23,-11,2,6,'#6a8b82');return;}
  if(kind==='tv'){B(1,14,62,18,'#816647');B(3,15,58,13,'#ba965d');B(5,-15,53,30,'#4d6d6b');B(9,-12,42,23,'#bed2c6');B(12,-10,36,18,'#578e9d');B(14,-8,14,3,'#99cfce');B(52,0,3,3,'#dfa76b');B(22,11,19,4,'#5d6d61');B(7,20,22,1,'#dcc18a');return;}
  if(kind==='chair'){B(6,22,4,10,'#745a40');B(24,22,4,10,'#745a40');B(4,10,26,17,'#9a784b');B(6,12,22,11,'#bad3b7');B(5,-3,24,16,'#ae8e5d');B(8,0,18,9,'#d9c593');return;}
  if(kind==='stairsUp'||kind==='stairsDown'){B(0,-8,64,40,'#655a46');for(let j=0;j<6;j++){B(3,27-j*6,55,5,kind==='stairsUp'?'#c4b181':'#b5bba2');B(3,27-j*6,55,1,'#ece4b9');}B(0,-9,4,41,'#ddd3ac');B(59,-9,5,41,'#b29868');B(59,-9,3,41,'#ead6a5');return;}
  if(kind==='shelf'){B(1,-15,94,46,'#667f7a');B(3,-13,90,40,'#9ab7a5');for(let j=0;j<2;j++){B(5,-9+j*22,86,15,'#627e75');for(let i=0;i<8;i++){B(8+i*10,-7+j*22,6,11,['#d37368','#e4ce80','#89c2c6','#8ead73'][i%4]);B(9+i*10,-7+j*22,4,2,'#eee5c6');}B(3,6+j*21,90,3,'#d3e0c7');}return;}
  if(kind==='healMachine'){B(0,-18,96,48,'#937b72');B(3,-18,90,43,'#ebdcd0');B(5,-16,86,12,'#b96164');B(8,-13,80,5,'#d59187');B(13,-2,70,24,'#bed7c9');B(40,0,17,17,'#659e9c');B(43,3,11,11,'#a6ded5');for(const a of [16,25,65,74]){E(a,8,4,4,'#bd6263');B(a-3,8,6,2,'#fff2cd');}return;}
  if(kind==='noticeboard'){B(0,-21,63,52,'#8c7652');B(3,-18,57,45,'#c6b88a');for(let i=0;i<3;i++){B(7+i*17,-13,13,30,'#eee9c9');B(9+i*17,-10,9,2,'#96aa8a');B(9+i*17,-5,7,1,'#adba99');}return;}
  if(kind==='computerDesk'||kind==='labDesk'){B(0,8,96,24,'#698c85');B(3,9,90,19,'#b4c7b1');B(0,3,96,7,'#e2e5cc');B(20,-20,49,28,'#718e89');B(23,-17,43,21,'#e9e7cb');B(27,-14,35,15,'#487c8c');B(30,-12,17,3,'#94d2cf');B(23,9,43,10,'#94b0a8');for(let i=0;i<8;i++)B(26+i*5,11,3,2,'#e3e5cd');if(kind==='labDesk'){B(3,34,90,26,'#b2c6b2');B(3,34,90,4,'#e1e3cb');for(const a of [18,72]){E(a,44,7,5,'#6c9fa8');B(a-3,35,6,9,'#a8d6ce');}}return;}
  if(kind==='teleporter'){B(2,0,60,64,'#658d88');B(5,3,54,56,'#d4e2cb');B(9,8,46,44,'#8cc7be');E(32,32,18,17,'#cee9d2');E(32,32,13,12,'#7db7bd');B(30,19,4,27,'#d2f1d8');return;}
  if(kind==='gymStatue'){B(4,21,25,10,'#8e9d91');B(6,17,21,7,'#d0d5be');B(10,-1,13,19,'#97aaa1');E(17,-5,12,10,'#c5d1bc');B(12,-9,5,5,'#ecedcb');B(21,-5,3,3,'#5c7c74');B(2,28,29,4,'#657e72');return;}
  if(kind==='pool'){B(0,0,128,96,'#93b6a9');B(3,3,122,90,'#e3e6cf');B(8,8,112,80,'#6eb5c5');for(let j=12;j<86;j+=18)for(let i=14;i<115;i+=27){B(i,j,18,2,'#b7e5dd');B(i+4,j+3,14,1,'#4b97af');}return;}
  if(kind==='memorial'){B(5,17,23,14,'#7a858d');B(6,-4,21,25,'#b7bac0');B(9,-8,15,8,'#cbd0cd');B(12,0,9,2,'#858a93');B(12,5,9,2,'#90969b');B(2,28,29,4,'#62747c');return;}
  if(kind==='arcade'){B(2,-12,29,42,'#657c7a');B(5,-10,23,17,'#c8d6bb');B(8,-7,17,11,'#b08075');for(let i=0;i<3;i++)B(9+i*5,-4,3,6,'#eee1ac');B(5,12,23,4,'#dbba6d');B(9,20,15,4,'#4b6665');return;}
  if(kind==='fossilDisplay'){B(2,34,92,27,'#80928d');B(4,37,88,20,'#c2c4a8');B(1,2,94,35,'#a1c9c6');B(4,5,88,29,'#d8e9d8');E(46,20,20,12,'#a8996f');E(46,19,13,8,'#c5b38a');E(46,19,7,5,'#8e805d');B(8,8,26,3,'#f7f3da');return;}
  return prop.call(this,c,x,y,kind);
 };
})();
