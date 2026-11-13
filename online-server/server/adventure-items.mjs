// Story objects are a real, personal pocket, reconstructed for older saves.
export const adventureItems={
 clone_invitation:{name:'Invitación de Isla Nueva',description:'Neesha te invita a Isla Nueva. Habla con la marinera de Ciudad Carmín.'},
 clone_remote:{name:'Dispositivo de clonación',description:'Transporta una copia idéntica desde tu laboratorio. Dos Clon Balls como máximo; recarga en Isla Nueva. Una captura consume un turno y recibir el clon en tu equipo consume otro.'},
 map:{name:'Mapa de Kanto',description:'Muestra tu ubicación y los caminos de Kanto.'},
 parcel:{name:'Paquete de Oak',description:'Un pedido para el profesor Oak. Entrégalo en el laboratorio de Paleta.'},
 bill:{name:'Ticket del S. S. Anne',description:'El billete que Bill te entregó. Permite embarcar en Ciudad Carmín.'},
 scope:{name:'Scope Silph',description:'Identifica a los fantasmas de la Torre Pokémon.'},
 flute:{name:'Poké Flauta',description:'Despierta a los Snorlax de las rutas 12 y 16. Úsala junto a uno de ellos.'},
 tea:{name:'Té',description:'Permite atravesar los accesos vigilados de Ciudad Azafrán.'},
 lift_key:{name:'Llave del Ascensor',description:'Abre el ascensor del escondite Rocket.'},
 card_key:{name:'Tarjeta Llave',description:'Abre las puertas electrónicas de Silph S. A.'},
 secret_key:{name:'Llave Secreta',description:'Abre el gimnasio de Isla Canela.'},
 teeth:{name:'Dientes de Oro',description:'El guarda de Fucsia los perdió en la Zona Safari.'},
 helix:{name:'Fósil Helix',description:'El laboratorio de Isla Canela puede restaurarlo como Omanyte.'},
 dome:{name:'Fósil Domo',description:'El laboratorio de Isla Canela puede restaurarlo como Kabuto.'},
 ruby:{name:'Rubí',description:'Una piedra roja para la investigación de Celio, en Isla Prima.'},
 rainbow:{name:'Pase Arcoíris',description:'Permite viajar a Isla Quarta tras ayudar a Celio.'},
 cut:{name:'MO01 · Corte',pocket:'machines',description:'Corta los árboles señalados al conseguir la Medalla Cascada.'},
 fly:{name:'MO02 · Vuelo',pocket:'machines',description:'MO de Vuelo. El viaje rápido todavía no está habilitado.'},
 surf_lesson:{name:'MO03 · Surf',pocket:'machines',description:'Cruza el agua al conseguir la Medalla Alma.'},
 strength:{name:'MO04 · Fuerza',pocket:'machines',description:'Mueve las rocas señaladas con la Medalla Arcoíris.'},
 expShare:{name:'Repartir Exp.',pocket:'items',description:'El portador recibe la mitad de la experiencia; quienes participaron comparten la otra mitad. No funciona con huevos o Pokémon debilitados.'}
};
for(const item of Object.values(adventureItems))Object.assign(item,{keyItem:true,price:0,pocket:item.pocket||'key'});
export function syncAdventureItems(m,p={}){
 m.bag ||= {};m.rewards ||= {};
 const own={...p,map:true,parcel:p.parcel&&!p.delivery,lift_key:p.rocket_b1_key,teeth:p.teeth&&!p.strength,ruby:p.ruby&&!p.rainbow,helix:p.fossils&&p.fossil!==140&&!m.rewards.fossil,dome:p.fossils&&p.fossil===140&&!m.rewards.fossil,expShare:!!p.delivery};
 for(const key of Object.keys(adventureItems)){if(own[key])m.bag[key]=1;else delete m.bag[key];}
 if(!m.bag.expShare||!m.party.some(p=>p.uid===m.expShareUid))m.expShareUid=null;
}
