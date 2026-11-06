import {Dex} from '@pkmn/sim';

// Campaign rules remain Gen 3, with the requested modern Sturdy survival rule.
// Apply to the shared cached Dex before creating or restoring either runtime's battles.
const sturdy = Dex.mod('gen3').abilities.get('sturdy');
sturdy.onDamagePriority = -30;
sturdy.onDamage = function (damage, target, source, effect) {
  if (target.hp === target.maxhp && damage >= target.hp && effect?.effectType === 'Move') {
    this.add('-ability', target, 'Sturdy');
    return target.hp - 1;
  }
};

export const abilityDescriptions = {
 arenatrap:'Impide la retirada de rivales que están en el suelo.',
 battlearmor:'Evita los golpes críticos.', blaze:'Potencia los ataques de Fuego cuando quedan pocos PS.',
 chlorophyll:'Duplica la Velocidad bajo el sol.', clearbody:'Evita que el rival reduzca sus características.',
 cloudnine:'Anula los efectos del clima mientras está en combate.', compoundeyes:'Aumenta la precisión de sus movimientos.',
 cutecharm:'El contacto puede enamorar a un rival del sexo opuesto.', damp:'Impide Autodestrucción y Explosión.',
 earlybird:'Se despierta antes de lo habitual.', effectspore:'El contacto puede dormir, paralizar o envenenar al rival.',
 flamebody:'El contacto puede quemar al rival.', flashfire:'Absorbe ataques de Fuego y potencia los propios.',
 guts:'Aumenta el Ataque cuando sufre un problema de estado.', hypercutter:'Impide que el rival reduzca su Ataque.',
 illuminate:'Esta habilidad no tiene efecto durante el combate.', immunity:'Impide el envenenamiento.',
 innerfocus:'Evita el retroceso.', insomnia:'Impide que se duerma.', intimidate:'Reduce el Ataque de los rivales al entrar.',
 keeneye:'Impide que el rival reduzca su precisión.', levitate:'Evita los ataques de Tierra.',
 lightningrod:'Atrae los ataques eléctricos de un objetivo; no los absorbe con estas reglas.', limber:'Impide la parálisis.',
 liquidooze:'Daña al rival cuando intenta absorber sus PS.', magnetpull:'Impide la retirada de Pokémon de Acero.',
 naturalcure:'Cura el problema de estado al retirarse.', oblivious:'Impide el enamoramiento.',
 overgrow:'Potencia los ataques de Planta cuando quedan pocos PS.', owntempo:'Impide la confusión.',
 pickup:'No tiene efecto durante el combate.', poisonpoint:'El contacto puede envenenar al rival.',
 pressure:'Los movimientos rivales dirigidos a él gastan más PP.', rockhead:'Evita el daño de retroceso de sus ataques.',
 runaway:'Permite huir de los combates salvajes.', sandveil:'Aumenta la evasión durante una tormenta de arena.',
 serenegrace:'Duplica la probabilidad de efectos secundarios.', shedskin:'Puede curar su problema de estado al terminar el turno.',
 shellarmor:'Evita los golpes críticos.', shielddust:'Evita efectos secundarios de los ataques recibidos.',
 soundproof:'Evita movimientos basados en sonido.', static:'El contacto puede paralizar al rival.',
 stench:'No tiene efecto durante el combate con estas reglas.', stickyhold:'Evita que le quiten su objeto equipado.',
 sturdy:'Con todos los PS, resiste un golpe fulminante con 1 PS. También evita ataques de KO directo.',
 swarm:'Potencia los ataques de Bicho cuando quedan pocos PS.', swiftswim:'Duplica la Velocidad bajo la lluvia.',
 synchronize:'Devuelve quemaduras, parálisis y envenenamiento al causante.', thickfat:'Reduce el daño de Fuego y Hielo.',
 torrent:'Potencia los ataques de Agua cuando quedan pocos PS.', trace:'Copia la habilidad de un rival al entrar.',
 vitalspirit:'Impide que se duerma.', voltabsorb:'Los ataques eléctricos recuperan sus PS en lugar de dañarlo.',
 waterabsorb:'Los ataques de Agua recuperan sus PS en lugar de dañarlo.', waterveil:'Impide las quemaduras.'
};
export const abilityDescription = name => abilityDescriptions[Dex.toID(name)] || '';
