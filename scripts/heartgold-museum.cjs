// Exact HG geometry and collision; retain the LeafGreen campaign event identities.
const layout=require('../assets/heartgold-models/museum-collision.json');
module.exports=world=>{
 const m=world.maps.pewter_museum;
 m.w=layout.width;m.h=layout.height;m.worldRevision=6;
 m.grid=layout.walkMask.map(row=>row.map(pass=>pass?9:7));
 m.arrival={x:10,y:18};m.hgRoom={model:'museum-interior-complete',origin:[-256,-256]};
 m.props=[];m.details=[];m.rug=null;m.signs=[];
 const place=(n,x,y,look=n.look)=>Object.assign(n,{x,y,homeX:x,homeY:y,look,dir:'down'});
 place(m.npcs.find(n=>n.data.key==='curator'),12,15);
 place(m.npcs.find(n=>n.data.key==='fossil_case'),7,11,'museum-plaque');
 place(m.npcs.find(n=>n.data.key==='moon_case'),10,9,'museum-plaque');
 const people=[
  ['paleontology',26,9,'Investigador','scientist',['Conservamos fósiles y ámbar de otras épocas. En Isla Canela estudian cómo devolverles la vida.','Antes de partir, visita las exposiciones de la sala principal.']],
  ['visitor',6,5,'Visitante veterano','gentleman',['Cada vitrina muestra un descubrimiento distinto. Examínalas desde una casilla vecina.','Las rocas del Monte Moon guardan más de una sorpresa.']],
  ['student',17,8,'Estudiante de ciencias','youngster',['Un fósil puede contar cómo vivían los Pokémon hace mucho tiempo.','El camino hacia Monte Moon sale al este de Ciudad Plateada.']],
  ['guide',4,13,'Guía del museo','lass',['Bienvenido al Museo de Ciencias. La conservadora está cerca de la entrada.','El gimnasio de Brock está al sur de la ciudad. Los ataques de Agua y Planta te ayudarán contra la Roca.']]
 ];
 for(const [id,x,y,name,look,lines]of people)m.npcs.push({id:'pewter_museum_'+id,x,y,homeX:x,homeY:y,name,look,dir:'down',role:'talk',data:{lines}});
 m.signs.push({x:5,y:6,text:'COLECCIÓN PALEONTOLÓGICA · Fósiles hallados en distintas regiones. Examina las vitrinas desde el pasillo.'},{x:15,y:6,text:'LA HISTORIA EN LAS ROCAS · Los restos mineralizados permiten estudiar Pokémon que vivieron hace mucho tiempo.'},{x:15,y:11,text:'DEL FÓSIL AL LABORATORIO · Los científicos de Isla Canela investigan la restauración de Pokémon antiguos.'});
 const exit=m.portals[0];Object.assign(exit,{x:10,y:19,w:1,h:1});m.grid[19][10]=8;
 for(const parent of Object.values(world.maps))for(const d of parent.doors)if(d.to===m.id)Object.assign(d,{tx:10,ty:18});
};
