/* Explicit tile families, not a flood fill of collision: adjacent trees, signs,
 * fences and terraced houses may all share the same solid row. Unknown facades
 * keep their complete native artwork until their footprint is verified. */
module.exports=function facade(n,d,kind){
 const x=d.x,y=d.y,t=(dx,dy)=>(n.blocks[y+dy]?.[x+dx]??-1)&1023;
 const region=n.tilesetPair.split('__')[1];let left,width,height;
 if(t(0,0)===98&&t(0,-1)===90){left=x-2;width=5;height=5;}
 else if(t(0,0)===98&&t(0,-1)===58){left=x-2;width=4;height=4;}
 else if(kind==='gym'&&t(0,-2)===330){
  left=x;let right=x;
  while(left>0&&[329,330].includes((n.blocks[y-2][left-1]&1023)))left--;
  while(right<n.w-1&&[330,331].includes((n.blocks[y-2][right+1]&1023)))right++;
  width=right-left+1;height=5;
 }else if(t(0,0)===61&&t(0,-1)===53){
  left=x;while(left>0&&![60].includes(n.blocks[y][left]&1023)&&x-left<5)left--;
  let right=x;while(right<n.w-1&&(n.blocks[y][right]&1023)!==63&&right-x<5)right++;
  if((n.blocks[y][left]&1023)!==60||(n.blocks[y][right]&1023)!==63)return null;
  width=right-left+1;height=3;
 }else if(region==='CeruleanCity'&&t(0,0)===664){
  if(t(-2,0)===764){left=x-2;width=5;height=5;}
  else{left=x;while(left>0&&(n.blocks[y][left]&1023)!==696&&x-left<5)left--;let right=x;while(right<n.w-1&&(n.blocks[y][right]&1023)!==698&&right-x<6)right++;if((n.blocks[y][left]&1023)!==696||(n.blocks[y][right]&1023)!==698)return null;width=right-left+1;height=4;}
 }else{
  const shape={PalletTown:{675:[1,5,5],684:[3,7,5]},ViridianCity:{665:[1,5,4]},PewterCity:{718:[1,5,4]},CeruleanCity:{664:[2,7,4]},LavenderTown:{674:[2,5,4]},SeviiIslands123:{663:[1,5,4]},SeviiIslands45:{666:[1,5,4],697:[1,4,4]},SeviiIslands67:{780:[1,5,4]}}[region]?.[t(0,0)];
  if(shape){left=x-shape[0];width=shape[1];height=shape[2];}
  else if(region==='VermilionCity'&&t(0,0)===670){
   left=x;while(left>=0&&(n.blocks[y][left]&1023)!==696&&x-left<5)left--;
   let right=x;while(right<n.w&&![684,756].includes(n.blocks[y][right]&1023)&&right-x<5)right++;
   if(left<0||(n.blocks[y][left]&1023)!==696||![684,756].includes(n.blocks[y][right]&1023))return null;
   width=right-left+1;height=4;
  }else return null;
 }
 const top=y-height+1;
 if(left<0||top<0||left+width>n.w||width<3||width>9)return null;
 // A replacement may never cover a second doorway or a side entrance.
 if(n.warps.some(w=>w.index!==d.nativeWarp&&w.x>=left&&w.x<left+width&&w.y>=top&&w.y<=y))return null;
 return {x:left,y:top,w:width,h:height,nativeFacade:true};
};
