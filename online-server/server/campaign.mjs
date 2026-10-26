import world from './world.json' with {type:'json'};
import {createMon,addMon,heal,species} from './creatures.mjs';
export {world};
export const chapters=[
 ['parcel','El pedido de Oak','viridian_shop','viridian_shop_clerk','Recoge el paquete del profesor en la tienda de Ciudad Verde.'],
 ['delivery','La Pokédex','pallet_lab','pallet_lab_oak','Vuelve al laboratorio de Paleta. Oak entregará las Pokédex y las primeras Poké Balls.'],
 ['badge1','La Medalla Roca','pewter_gym','pewter_gym_leader','Cruza Ruta 2 y Bosque Verde. Entrena y desafía a Brock (niveles 12 y 14).'],
 ['fossils','Los fósiles del Monte Moon','moon_b2','moon_b2_fossil','Recorre las galerías del Monte Moon, derrota al Rocket y conserva un fósil.'],
 ['bill','El inventor de Ruta 25','bill_home','bill_home_bill','Supera los cinco entrenadores del Puente Pepita y al reclutador. Ayuda a Bill con su máquina.'],
 ['badge2','La Medalla Cascada','cerulean_gym','cerulean_gym_leader','Misty te espera. Su medalla permite utilizar Corte fuera del combate.'],
 ['cut','El capitán del S. S. Anne','ssanne_cabin','ssanne_cabin_captain','Embarca en Carmín con el ticket de Bill, enfrenta a Azul y ayuda al capitán.'],
 ['badge3','El circuito de Surge','vermilion_gym','vermilion_gym_leader','Resuelve los interruptores del gimnasio de Carmín. Surge tiene Pokémon de niveles 18–24.'],
 ['scope','La guarida bajo el casino','rocket_b2','rocket_b2_scope','Cruza Túnel Roca, Lavanda y Ruta 8. Investiga el casino de Azulona y recupera el Scope Silph.'],
 ['badge4','El jardín de Erika','celadon_gym','celadon_gym_leader','Consigue la Medalla Arcoíris. Permitirá utilizar Fuerza fuera del combate.'],
 ['flute','El espíritu de la Torre','tower_3','tower_3_fuji','Con el Scope, calma al espíritu de Marowak y rescata a Fuji de los Rocket.'],
 ['tea','Los accesos a Azafrán','celadon_house','celadon_house_tea','Lleva el té de la anciana de Azulona a los guardias de Azafrán.'],
 ['silph','Liberar Silph S. A.','silph_3','silph_3_president','Tras rescatar a Fuji, entra en Silph, encuentra la tarjeta y derrota a Giovanni.'],
 ['badge6','El desafío de Sabrina','saffron_gym','saffron_gym_leader','El gimnasio de Azafrán vuelve a aceptar desafíos después del rescate de Silph.'],
 ['snorlax','Una melodía en Ruta 12','route12','route12_snorlax','Usa la Poké Flauta para despertar a Snorlax. También puedes tomar la ruta occidental desde Azulona.'],
 ['strength','La dentadura del guarda','fuchsia_house','fuchsia_house_warden','Busca los Dientes de Oro en Safari y devuélvelos al guarda de Fucsia.'],
 ['surf_lesson','La Casa Secreta','safari_hut','safari_hut_surf','Explora la Zona Safari hasta su Casa Secreta para obtener Surf.'],
 ['badge5','La Medalla Alma','fuchsia_gym','fuchsia_gym_leader','Koga permite utilizar Surf fuera del combate. Prepara tu equipo para el veneno.'],
 ['secret_key','La Mansión de Canela','mansion_2','mansion_2_secret_key','Llega a Canela usando Surf. Investiga las estatuas y el laboratorio de la Mansión.'],
 ['badge7','La Medalla Volcán','cinnabar_gym','cinnabar_gym_leader','La Llave Secreta abre el gimnasio de Blaine.'],
 ['badge8','El regreso a Ciudad Verde','viridian_gym','viridian_gym_leader','Con siete medallas, regresa al gimnasio de Giovanni.'],
 ['champion','El Alto Mando','indigo_arena','indigo_arena_league','Con las ocho medallas, Surf y Fuerza, atraviesa Calle Victoria. Supera la Liga sin abandonar la sala.'],
 ['national','La Pokédex Nacional','pallet_lab','pallet_lab_oak','Visita Isla Prima desde Carmín. Después de la Liga, muestra a Oak 60 especies capturadas.'],
 ['rainbow','El Rubí de Celio','oneisland_center','oneisland_center_celio','Investiga Monte Ascuas, recupera el Rubí y entrégalo a Celio para viajar a Isla Quarta.'],
];
// Personal stories travel with their trainer. Only cleared physical obstacles belong to the world.
export function campaignFor(s,m){
 if(!s.personal)return s;
 m.progress ||= {}; m.league ||= 0;
 return {members:[m],progress:m.progress,sharedGates:s.sharedGates||{},
  get league(){return m.league},set league(v){m.league=v}};
}
export function done(s,k){if(!k)return true;if(k==='bridge')return [0,1,2,3,4].every(i=>s.progress['route24_bridge'+i])&&s.progress.route24_recruiter;if(k==='cut_use')return done(s,'cut')&&done(s,'badge2');if(k==='surf')return done(s,'surf_lesson')&&done(s,'badge5');if(k==='strength_use')return done(s,'strength')&&done(s,'badge4');if(k==='league_access')return Array.from({length:8},(_,i)=>done(s,'badge'+(i+1))).every(Boolean)&&done(s,'surf')&&done(s,'strength_use');if(k==='snorlax16')return done(s,'route16_snorlax16');if(k==='snorlax')return done(s,'route12_snorlax');if(k==='ghost')return done(s,'tower_2_ghost');if(k==='lift_key')return done(s,'rocket_b1_key');return !!s.progress[k];}
export function gate(s,key){if(done(s,key))return '';return ({delivery:'Entrega el paquete a Oak en Paleta para recibir la Pokédex.',fossils:'Explora el piso inferior del Monte Moon y protege los fósiles.',bridge:'Quedan entrenadores del Puente Pepita. Revisa tu diario.',circuit:'Activa los dos interruptores del gimnasio de Carmín.',silph:'Libera primero Silph S. A. para desafiar a Sabrina.',secret_key:'Encuentra la Llave Secreta en la Mansión Pokémon.',bill:'Ayuda primero a Bill en el cabo, al norte de Ciudad Celeste.',cut_use:'Necesitas Corte del capitán y la Medalla Cascada para despejar el camino.',tea:'La anciana de Azulona tiene té para los guardias de Azafrán.',scope:'Necesitas el Scope Silph del casino de Azulona.',poster:'Examina el cartel del casino.',lift_key:'El Rocket del almacén tiene la Llave del Ascensor.',ghost:'Identifica y calma al espíritu de Marowak.',flute:'Fuji puede darte la Poké Flauta al rescatarlo de la Torre.',snorlax:'Snorlax bloquea el paso. Despiértalo con la Poké Flauta.',snorlax16:'Snorlax bloquea el Camino de Bicis. Despiértalo con la Poké Flauta.',card_key:'Encuentra la Tarjeta Llave de Silph.',statues:'Activa las estatuas siguiendo el diario de la Mansión.',surf:'Necesitas Surf de la Casa Secreta y la Medalla Alma.',league_access:'La Liga requiere las ocho medallas, Surf y Fuerza.',champion:'Este paso se abre después del Salón de la Fama.',national:'Oak debe actualizar la Pokédex Nacional.',rainbow:'Entrega el Rubí de Monte Ascuas a Celio.'})[key]||`Consigue la Medalla ${world.gyms[+key.slice(5)-1]?.badge||'correspondiente'}.`;}
export function objective(s){let c=chapters.find(c=>!done(s,c[0]));if(c?.[0]==='bill'&&!done(s,'bridge')){const id=[0,1,2,3,4].find(i=>!s.progress['route24_bridge'+i]);c=['bridge','Los cinco del Puente Pepita','route24',id===undefined?'route24_recruiter':'route24_bridge'+id,'Enfrenta a los entrenadores del puente. Después podrás seguir hasta la casa de Bill.'];}return c||['complete','El viaje continúa','fourisland_daycare','fourisland_daycare_daycare','Ya puedes criar en Isla Quarta, completar la Pokédex y jugar duelos con tus amigos.'];}
export function journal(s){return {current:objective(s),chapters:chapters.map(c=>({id:c[0],title:c[1],map:c[2],npc:c[3],text:c[4],done:done(s,c[0])})),badges:world.gyms.map((g,i)=>({name:g.badge,leader:g.name,won:done(s,'badge'+(i+1))})),keys:['cut','surf_lesson','strength','scope','flute','tea','card_key','secret_key','national','rainbow'].filter(k=>done(s,k))};}
export function locate(p,id){const map=world.maps[p.map],n=map?.npcs.find(n=>n.id===id);if(!n||Math.abs(p.x-n.x)+Math.abs(p.y-n.y)>3)throw Error('Acércate a la persona con la que quieres hablar.');return n;}
function allReward(s,key,reward){for(const m of s.members)if(!m.rewards[key]){reward(m);m.rewards[key]=true;}}
export function catchUp(s,m){if(done(s,'delivery')&&!m.rewards.dex){m.bag.ball+=5;m.rewards.dex=true;}if(done(s,'silph')&&!m.rewards.silph){addMon(m,createMon(131,25,m.id));m.bag.masterball=(m.bag.masterball||0)+1;m.rewards.silph=true;}}
export function interact(s,m,p,n,input={}){const f=s.progress,key=n.data?.key;
 const set=(k,text)=>{f[k]=true;return text;};
 if(n.role==='heal'||n.role==='rest'){m.party.forEach(heal);m.lastCenter={...p};return 'Tu equipo recuperó todos sus PS y PP. También se eliminaron los problemas de estado.';}
 if(n.role==='guide')return objective(s)[4];
 if(n.role==='shop'&&p.map==='viridian_shop'&&!f.delivery)return set('parcel','Este paquete es para el profesor Oak. Llévaselo a su laboratorio en Pueblo Paleta.');
 if(n.role==='talk')return n.data.lines.join(' ');
 if(n.role==='gift'){if(!m.rewards[n.id]){m.bag.potion+=3;m.rewards[n.id]=true;}return 'Lleva estas pociones. Puedes revisar tu equipo y tu mochila desde el panel.';}
 switch(key){
 case 'oak':if(!f.parcel){f.accepted=true;return 'Tengo un pedido en la tienda de Ciudad Verde. Sigue la Ruta 1 hacia el norte y vuelve al laboratorio con el paquete.';}if(!f.delivery){f.delivery=f.delivered=true;allReward(s,'dex',x=>x.bag.ball+=5);return '¡Gracias por traer mi pedido! Aquí están vuestras Pokédex y cinco Poké Balls para cada uno. Capturad, observad y cuidad de vuestro equipo. El Bosque Verde conduce a Ciudad Plateada.';}if(f.champion&&m.caught&&Object.keys(m.caught).length>=60&&f.oneisland)return set('national','Has registrado al menos sesenta especies. La Pokédex Nacional está preparada. Celio necesita ayuda en Isla Prima.');return `Has capturado ${Object.keys(m.caught).length} especies. ${f.champion?'Visita Isla Prima y registra 60 para obtener la Pokédex Nacional.':'El diario os orientará, pero podéis explorar y entrenar a vuestro ritmo.'}`;
 case 'fossil':if(!f.moon_b2_rocket)return 'Los Rocket siguen amenazando la excavación. Derrota al supervisor.';if(!f.fossils){if(![138,140].includes(input.fossil))return {chooseFossil:true,text:'El paleontólogo propone conservar un fósil cada uno. Elige Helix o Domo para el grupo.'};f.fossil=input.fossil;return set('fossils','El fósil queda a salvo en los objetos clave del grupo. El laboratorio de Canela podrá restaurarlo. La salida oriental lleva a Ciudad Celeste.');}return 'El fósil está a salvo. Sigue hacia el este para llegar a Celeste.';
 case 'restore_fossil':if(!f.fossils)return 'En el Monte Moon se conservan fósiles Helix y Domo. Traed uno para estudiarlo.';if(m.rewards.fossil)return 'El Pokémon de tu fósil ya está contigo. Cuídalo y ayúdalo a adaptarse a esta época.';addMon(m,createMon(f.fossil||138,5,m.id));m.rewards.fossil=true;return '¡La restauración ha terminado! Recibiste a '+species(f.fossil||138).name+' al nivel 5. Revisa tu equipo o el PC.';
 case 'bill':if(!f.bill_started)return set('bill_started','¡Soy Bill! El experimento me ha mezclado con un Pokémon. Activa el terminal de separación a mi derecha.');if(!f.bill_pc)return 'El terminal a mi derecha puede deshacer la transformación.';return set('bill','¡Vuelvo a ser yo! Os doy el ticket del S. S. Anne. El barco está en Ciudad Carmín, al sur.');
 case 'bill_pc':return f.bill_started?set('bill_pc','La separación ha terminado. Habla otra vez con Bill.'):'Bill debe explicar primero cómo funciona la máquina.';
 case 'captain':if(!f.ssanne_rival)return 'Azul te espera en el pasillo del barco.';return set('cut','Gracias por ayudarme con el mareo. Esta MO enseña Corte. La Medalla Cascada permite usarla en los caminos.');
 case 'switch1':return set('switch1','Primer interruptor activado. Busca el segundo.');
 case 'switch2':return f.switch1?set('circuit','La barrera del gimnasio se ha apagado. Surge te espera.'):'Falta activar el primer interruptor.';
 case 'poster':return set('poster','Un interruptor detrás del cartel abre la escalera al escondite Rocket.');
 case 'scope':return f.rocket_b2_giovanni?set('scope','Giovanni se retira. Recuperáis el Scope Silph: ahora podéis identificar el espíritu de la Torre Pokémon.'):'Giovanni custodia el maletín. Debéis derrotarlo.';
 case 'tea':return set('tea','Llevad este té a los guardias de Azafrán. Os dejarán pasar por los accesos de la ciudad.');
 case 'fuji':return f.tower_3_rocket?set('flute','La Torre vuelve a estar en paz. Esta Poké Flauta puede despertar a los Pokémon que duermen en los caminos.'):'Los Rocket de la cima impiden que Fuji salga. Derrotadlos.';
 case 'teeth':return set('teeth','Encontraste los Dientes de Oro del guarda de Fucsia.');
 case 'warden':return f.teeth?set('strength','¡Mi dentadura! Como agradecimiento, os doy Fuerza. La Medalla Arcoíris permite mover rocas fuera del combate.'):'El guarda señala su boca y el mapa de la Zona Safari. Parece haber perdido la dentadura.';
 case 'surf':return set('surf_lesson','¡Habéis llegado a la Casa Secreta! Esta MO enseña Surf. Necesitáis la Medalla Alma para navegar.');
 case 'card_key':return set('card_key','Esta Tarjeta Llave abre las puertas de Silph. Azul y el presidente están más arriba.');
 case 'president':if(!f.silph_3_giovanni)return 'Giovanni sigue amenazando a los empleados.';f.silph=true;allReward(s,'silph',x=>{addMon(x,createMon(131,25,x.id));x.bag.masterball=(x.bag.masterball||0)+1;});return '¡Silph está a salvo! Os confío una Master Ball. Un empleado también os entrega a Lapras. Sabrina vuelve a recibir entrenadores.';
 case 'statue1':return set('statue1','La primera estatua revela el interruptor del laboratorio.');
 case 'statue2':return f.statue1?set('statues','La puerta del laboratorio se ha abierto.'):'El diario de la pared explica qué estatua activar primero.';
 case 'secret_key':return f.mansion_2_scientist?set('secret_key','Entre los diarios de la investigación de Mew encontráis la Llave Secreta del gimnasio de Canela.'):'El científico no permite investigar todavía.';
 case 'fly':return done(s,'cut_use')?set('fly','Te entrego la MO de Vuelo. El diario guarda este hallazgo; el viaje rápido aún no está habilitado en esta beta.'):'Usa Corte para recorrer los senderos de este bosque.';
 case 'celio':f.oneisland=true;if(f.ruby)return set('rainbow','¡Este es el Rubí que necesitaba! Toma el Pase Arcoíris. Ya podéis visitar Isla Quarta y su guardería de crianza.');return f.national?'Investiga Monte Ascuas. Los Rocket buscan una piedra roja en el volcán.':'Estoy investigando las conexiones entre regiones. Vuelve después de obtener la Pokédex Nacional.';
 case 'ruby':return f.ember_rocket?set('ruby','Recuperaste el Rubí. Llévaselo a Celio en el Centro Pokémon de Isla Prima.'):'Los Rocket custodian la entrada de esta galería.';
 case 'lost':return 'Ya he encontrado el sendero. ¡En el Bosque Verde viven Pikachu y muchos Pokémon bicho!';
 case 'lantern':return 'La salida del Túnel Roca lleva a Pueblo Lavanda. Las galerías permiten buscar Pokémon y entrenadores.';
 case 'curator':case 'fossil_case':case 'moon_case':return 'El museo estudia los fósiles del Monte Moon. Visitarlo es opcional; Brock acepta desafíos en el gimnasio.';
 case 'sailor':return 'El capitán está en su camarote, al fondo del barco.';
 default:if(n.role==='coach')return 'Entrena, revisa tus movimientos y lleva un equipo recuperado. También puedes invitar a un compañero para un combate doble.';return 'Revisa el diario para encontrar tu siguiente objetivo.';
 }
}
export function encounter(s,m,p,n){const f=s.progress;let team=n.data?.team,name=n.name,flag=n.id,badge=null,kind='trainer';
 if(n.role==='practice')return {name:'Guías de Ruta',team:[[19,7],[10,7]],flag:'training',kind:'practice'};
 if(n.role==='gym'){badge=n.data.gym+1;const requirements={3:'circuit',6:'silph',7:'secret_key'};if(requirements[badge]&&!done(s,requirements[badge]))throw Error(gate(s,requirements[badge]));if(badge===3&&!done(s,'cut_use'))throw Error(gate(s,'cut_use'));if(badge===8&&Array.from({length:7},(_,i)=>done(s,'badge'+(i+1))).some(x=>!x))throw Error('Giovanni requiere las otras siete medallas.');team=world.gyms[badge-1].team;flag='badge'+badge;}
 if(n.role==='league'){if((f.league_clears??Number(!!f.champion))>=3)throw Error('El grupo ya completó tres desafíos de la Liga.');if(!done(s,'league_access'))throw Error(gate(s,'league_access'));const i=s.league||0,leader=world.league[i];team=leader.team;name=leader.name;flag='league'+i;kind='league';}
 if(n.data?.key==='ghost'){if(!f.scope)throw Error(gate(s,'scope'));team=[[105,30]];kind='ghost';}
 if(['snorlax','snorlax16'].includes(n.data?.key)){if(!f.flute)throw Error(gate(s,'flute'));team=[[143,30]];kind='wild';}
 if(n.id==='pallet_lab_rival'||n.id==='route22_rival'){team=team.map(([id,l])=>[id===4?({1:4,4:7,7:1}[m.starter]):id,l]);}
 // The challenged trainer's starter selects the rival branch for the whole encounter.
 if(n.id==='ssanne_rival')team=[[17,19],[20,16],[64,18],[{1:5,4:8,7:2}[m.starter],20]];
 if(n.id==='silph_2_rival')team={1:[[18,37],[102,38],[130,35],[65,35],[6,40]],4:[[18,37],[58,38],[102,35],[65,35],[9,40]],7:[[18,37],[130,38],[58,35],[65,35],[3,40]]}[m.starter];
 if(n.role==='league'&&s.league===4)team=[[18,59],[65,57],[112,59],...({1:[[103,59],[130,61],[6,63]],4:[[59,59],[103,61],[9,63]],7:[[130,59],[59,61],[3,63]]}[m.starter])];
 if(n.id==='route24_recruiter'&&![0,1,2,3,4].every(i=>f['route24_bridge'+i]))throw Error('Supera primero a los cinco entrenadores del puente.');
 if(n.id==='silph_3_giovanni'&&!f.silph_2_rival)throw Error('Azul te espera en el departamento de desarrollo.');
 if(!team)throw Error('Este personaje no propone un combate.');const repeatable=n.role==='trainer'&&!/rocket|giovanni|rival|bridge\d|recruiter|mansion_2_scientist/.test(n.id);const wins=f['wins_'+flag]??Number(!!f[flag]);if(repeatable&&wins>=3)throw Error('Este entrenador ya completó tres combates con el grupo.');if(!repeatable&&f[flag]&&kind!=='practice'&&kind!=='league')throw Error('Este desafío ya está completado para el grupo.');return {name,team,flag,badge,kind,repeatable,round:s.league||0,rematch:repeatable&&wins>0};
}
export function victory(s,b){if(s.personal){for(const id of b.rewardOwners||Object.values(b.owners)){const m=s.members.find(m=>m.id===id),ctx=campaignFor(s,m);if(b.encounter?.kind!=='league'||ctx.league===b.encounter.round)victory(ctx,b);}return;}const e=b.encounter;if(!e)return;if(e.kind==='league'){s.league=(s.league||0)+1;if(s.league===5){s.progress.league_clears=(s.progress.league_clears??Number(!!s.progress.champion))+1;s.progress.champion=true;s.league=0;}return;}if(e.flag){if(e.repeatable)s.progress['wins_'+e.flag]=(s.progress['wins_'+e.flag]??Number(!!s.progress[e.flag]))+1;s.progress[e.flag]=true;}}
