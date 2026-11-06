/* Shared visual/collision placement, in canvas coordinates before camera offset. */
var HGLayout=(()=>{
 function key(b,map){return ({pallet_home:'red-house',pallet_rival:'blue-house',pallet_lab:'oak-laboratory',bill_home:'bills-house',pewter_gym:'pewter-gym',cerulean_gym:'cerulean-gym',vermilion_gym:'vermilion-gym',celadon_gym:'celadon-gym',fuchsia_gym:'fuchsia-gym',saffron_gym:'saffron-gym',viridian_gym:'viridian-gym'})[b.id]||({center:'pokemon-center',shop:b.id==='celadon_shop'?'celadon-department-store':'poke-mart',museum:'museum-exterior',silph:'silph-company',casino:'celadon-casino',league:'pokemon-league',lab:'oak-laboratory',gym:'pewter-gym',home:({pewter:'pewter-house',viridian:'viridian-house',cerulean:'cerulean-house',vermilion:'vermilion-house'})[map]||'red-house'})[b.kind];}
 function placement(b,frame,tile=32){const width=frame.image?.width||frame.width,height=frame.image?.height||frame.height;
  const scale=Math.min(b.w*tile/width,(b.door.x+.5-b.x)*tile/Math.max(1,frame.anchorX),(b.x+b.w-b.door.x-.5)*tile/Math.max(1,width-frame.anchorX));
  return {x:(b.door.x+.5)*tile-frame.anchorX*scale,y:(b.door.y+1)*tile-frame.anchorY*scale,w:width*scale,h:height*scale};
 }
 return {key,placement};
})();
if(typeof module==='object'&&module.exports)module.exports=HGLayout;
