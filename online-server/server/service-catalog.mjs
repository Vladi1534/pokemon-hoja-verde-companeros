// FRLG shop departments, with prices and useful item effects kept in one place.
export const NATURE_PRICE=5000;
export const serviceItems={
 paralyzeheal:{name:'Antiparalizador',price:200,status:['par']},awakening:{name:'Despertar',price:250,status:['slp']},burnheal:{name:'Antiquemar',price:250,status:['brn']},iceheal:{name:'Antihielo',price:250,status:['frz']},
 superrepel:{name:'Superrepelente',price:500,steps:200},maxrepel:{name:'Repelente Máximo',price:700,steps:250},
 freshwater:{name:'Agua Fresca',price:200,heal:50},sodapop:{name:'Refresco',price:300,heal:60},lemonade:{name:'Limonada',price:350,heal:80},
 pokedoll:{name:'Poké Muñeco',price:1000,escape:true,pocket:'items',description:'Permite huir de un encuentro salvaje. No funciona contra entrenadores.'},
 hpup:{name:'Más PS',price:9800,vitamin:'hp'},protein:{name:'Proteína',price:9800,vitamin:'atk'},iron:{name:'Hierro',price:9800,vitamin:'def'},calcium:{name:'Calcio',price:9800,vitamin:'spa'},zinc:{name:'Zinc',price:9800,vitamin:'spd'},carbos:{name:'Carburante',price:9800,vitamin:'spe'},
 xattack:{name:'Ataque X',price:500,boost:'atk'},xdefend:{name:'Defensa X',price:550,boost:'def'},xspeed:{name:'Velocidad X',price:350,boost:'spe'},xspecial:{name:'Especial X',price:350,boost:'spa'},xaccuracy:{name:'Precisión X',price:950,boost:'accuracy'},direhit:{name:'Directo',price:650,volatile:'focusenergy'},guardspec:{name:'Protección Especial',price:700,sideCondition:'mist'},
 yellowflute:{name:'Flauta Amarilla',price:0,volatileCure:'confusion',pocket:'items',description:'Elimina la confusión del Pokémon activo. No se consume; usarla ocupa un turno.'},
 smokeball:{name:'Bola Humo',price:0,held:'Smoke Ball',pocket:'items',description:'Equipada, permite huir de Pokémon salvajes.'},miracleseed:{name:'Semilla Milagro',price:0,held:'Miracle Seed',pocket:'items',description:'Equipada, potencia los ataques de tipo Planta.'},charcoal:{name:'Carbón',price:0,held:'Charcoal',pocket:'items',description:'Equipado, potencia los ataques de tipo Fuego.'},mysticwater:{name:'Agua Mística',price:0,held:'Mystic Water',pocket:'items',description:'Equipada, potencia los ataques de tipo Agua.'}
};
const machines=[[5,46,'Rugido',1000],[15,63,'Hiperrayo',7500],[28,91,'Excavar',2000],[31,280,'Demolición',3000],[43,290,'Daño Secreto',3000],[45,213,'Atracción',3000],[16,113,'Pantalla Luz',0],[20,219,'Velo Sagrado',0],[33,115,'Reflejo',0],[13,58,'Rayo Hielo',0],[23,231,'Cola Férrea',0],[24,85,'Rayo',0],[30,247,'Bola Sombra',0],[35,53,'Lanzallamas',0]];
for(const [num,teach,name,price]of machines)serviceItems['tm'+String(num).padStart(2,'0')]={name:'MT'+String(num).padStart(2,'0')+' · '+name,price,teach,pocket:'machines',description:'Enseña '+name+' a un Pokémon compatible. Se consume al aprender; tú eliges qué movimiento olvidar.'};
for(const item of Object.values(serviceItems)){item.pocket ||= item.heal||item.status||item.vitamin?'medicine':'items';if(item.vitamin)item.description='Añade hasta 10 EV en esta característica, hasta 100 por vitamina y 510 EV totales. No cambia los IV.';if(item.boost||item.volatile||item.sideCondition)item.description='Se usa en combate sobre tu Pokémon activo. Su efecto termina al cambiar o finalizar el combate.';}
export const shopStocks={
 early:['ball','potion','antidote','paralyzeheal'],pewter:['ball','potion','antidote','paralyzeheal','awakening','repel'],cerulean:['ball','superpotion','antidote','paralyzeheal','awakening','burnheal','repel'],
 standard:['ball','superball','superpotion','antidote','paralyzeheal','awakening','iceheal','repel','superrepel'],late:['superball','ultraball','superpotion','hyperpotion','fullheal','revive','superrepel','maxrepel'],
 department_items:['superball','superpotion','revive','antidote','paralyzeheal','awakening','burnheal','iceheal','superrepel'],department_tm:['tm05','tm15','tm28','tm31','tm43','tm45'],
 department_stones:['pokedoll','firestone','thunderstone','waterstone','leafstone'],department_vitamins:['hpup','protein','iron','calcium','zinc','carbos'],department_battle:['xattack','xdefend','xspeed','xspecial','xaccuracy','guardspec','direhit'],vending:['freshwater','sodapop','lemonade']
};
export const shopTitles={department_items:'2.º piso · Objetos de aventura',department_tm:'2.º piso · Máquinas técnicas',department_stones:'4.º piso · Piedras evolutivas',department_vitamins:'5.º piso · Vitaminas',department_battle:'5.º piso · Objetos de combate',vending:'Azotea · Bebidas'};
export const casinoPrizes={
 pokemon:[{key:'abra',species:63,level:7,coins:120},{key:'clefairy',species:35,level:12,coins:750},{key:'pinsir',species:127,level:18,coins:2500},{key:'dratini',species:147,level:24,coins:4600},{key:'porygon',species:137,level:18,coins:6500}],
 machines:[{key:'tm13',coins:4000},{key:'tm23',coins:3500},{key:'tm24',coins:4000},{key:'tm30',coins:4500},{key:'tm35',coins:4000}],
 items:[{key:'smokeball',coins:800},{key:'miracleseed',coins:1000},{key:'charcoal',coins:1000},{key:'mysticwater',coins:1000},{key:'yellowflute',coins:1600}]
};
