# Datos de reglas de Kanto para integración

Entrega de investigación, sin modificaciones al juego: `kanto-rules.json` y `kanto-rules.js`. El segundo declara `const KANTO_RULES` y puede cargarse antes de `mechanics.js`. Ambos contienen el mismo objeto. El generador reproducible es `build_rules.py`; conserva sus fuentes descargadas en `source/`.

## Cobertura verificada

| Conjunto | Cantidad |
|---|---:|
| Especies de Kanto | 151 |
| Entradas de aprendizaje por nivel en Verde Hoja | 1.536 |
| Movimientos distintos en esos learnsets | 273 |
| Catálogo completo de movimientos Gen3 | 354 |
| Movimientos modernos heredados del motor, para migración | 7 |
| Símbolos de efectos originales Gen3 | 198 |
| Habilidades distintas en asignaciones actuales | 114 |
| Habilidades normales distintas originales FRLG | 55 |
| Habilidades ocultas distintas actuales de Kanto | 59 |
| Unión de normales originales y ocultas actuales | 99 |

Se comparó cada learnset de las 151 especies entre PokeAPI (`version_group_id=7`, `pokemon_move_method_id=1`) y la tabla original de FRLG. Coinciden los pares movimiento/nivel. Se conserva el orden original de Verde Hoja, incluida su rama específica para los movimientos iniciales de Dugtrio. Ese orden importa cuando hay varios aprendizajes en el mismo nivel.

## Contrato de datos

```js
KANTO_RULES.species[1] // Bulbasaur
// {id, growthRateId, genderRate, baseExpYield,
//  frlgAbilities:[65], abilities:[{id:65,slot:1,hidden:false}, ...],
//  levelUp:[[1,33],[4,45],[7,73], ...]}

KANTO_RULES.moves[91] // Excavar
// {id:91, key:'dig', slug:'dig', name:'Excavar', type:'ground',
//  power:60, pp:10, accuracy:100, priority:0, category:'physical',
//  gen3Effect:'SEMI_INVULNERABLE', gen3EffectId, effectId, effectChance,
//  flags, twoTurn:{charge:'dig',semiInvulnerable:'underground', ...}, ...}

KANTO_RULES.legacyAliases.dig // 91; cubre los 76 aliases publicados
KANTO_RULES.experience[4].thresholds[16] // XP total para ese nivel y curva
KANTO_RULES.abilities[65] // nombre español, resumen, hooks y dependencias
KANTO_RULES.gen3Effects.SEMI_INVULNERABLE // IDs de movimientos de ese efecto
```

Los IDs numéricos son los nacionales/PokeAPI; en JSON sus claves son cadenas. `move.key` conserva los aliases de los 76 movimientos del motor publicado, y usa el slug de PokeAPI para los nuevos. Para migrar partidas: resolver un alias mediante `legacyAliases`, conservar sus PP actuales con límite en los nuevos PP máximos, conservar el orden y no reemplazar movimientos aprendidos.

`accuracy:null` significa que no se hace la tirada normal de precisión. `power:1` acompañado de `powerMode:'effect'` señala daño especial o potencia variable: no se debe calcular como potencia 1. `gen3Effect` y las propiedades principales provienen de FRLG. `effectId` usa la numeración PokeAPI y su historial. No son el mismo espacio de IDs.

`apiMetaCurrent` está deliberadamente separado: es el metadato moderno sin adaptar, útil para investigación, pero no debe sobrescribir las reglas Gen3. Ejemplos de diferencias: Ácido reduce Defensa en FRLG, Desarrollo aumenta solo Ataque Especial, Látigo Cepa tiene potencia 35/10 PP, Surf y Lanzallamas potencia 95. Esas propiedades están correctas en los campos principales.

El archivo incluye campos derivados para cambios de características, estados, golpes múltiples, drenaje, retroceso, curación, clima, cargas y recargas. Los efectos complejos aún exigen su manejador. La presencia en la tabla no afirma que el juego los implemente.

## Aprendizaje y evolución

1. Al crear un salvaje o equipo de entrenador, recorrer el learnset hasta su nivel, omitir duplicados y mantener los últimos cuatro movimientos obtenidos. No usar los pools por tipo.
2. Al ganar experiencia, procesar cada nivel cruzado. Encolar todos los movimientos de ese nivel en orden. Si ya lo conoce, omitirlo; si tiene espacio, aprenderlo; con cuatro movimientos, ofrecer los cuatro para olvidar y una opción de no aprender.
3. La elección debe persistirse antes de continuar al siguiente movimiento, a la evolución o a la recompensa siguiente. Rechazar un movimiento no debe cambiar ningún PP ni ataque equipado.
4. Al evolucionar, conservar los movimientos y PP equipados. Evaluar solo los aprendizajes pertinentes del nuevo Pokémon al nivel actual, sin reconstruir el moveset entero y sin regalar todos sus movimientos de nivel 1.

## Experiencia y ritmo

Usar `species[id].baseExpYield`, que es el rendimiento Gen3; no el moderno. El motor original calcula primero `floor(baseExpYield * nivelDelDerrotado / 7)`, lo reparte entre los participantes vivos elegibles y aplica después los multiplicadores pertinentes. El bonus de entrenador es ×1,5. Repartir Experiencia tiene sus dos mitades propias si se implementa ese objeto. No otorgar esa cantidad íntegra a los seis miembros indiscriminadamente.

Las seis tablas completas de crecimiento, de nivel 1 a 100, están en `experience`. Las 151 especies usan cuatro: lenta (26), media (80), rápida (5), media lenta (40). La XP almacenada es acumulativa; el siguiente umbral es `thresholds[level + 1]`, no un cubo universal. Al migrar un guardado, conservar su nivel y convertir su porcentaje de progreso al tramo equivalente de su curva nueva, sin bajar niveles ganados.

## Ataques con carga y recarga

`twoTurn` incluye los ocho movimientos Gen3 pertinentes: Viento Cortante (13), Vuelo (19), Rayo Solar (76), Excavar (91), Cabezazo (130), Ataque Aéreo (143), Buceo (291) y Bote (340). El primer turno gasta PP una vez y establece el estado; el segundo resuelve el ataque sin gastar PP otra vez. Cabezazo aumenta Defensa durante la carga. Rayo Solar omite la carga con sol efectivo y pierde potencia bajo lluvia, arena o granizo. Vuelo/Excavar/Buceo/Bote usan estados de seminvulnerabilidad con excepciones de ataques concretos.

Los movimientos `RECHARGE` imponen un turno posterior sin acción. No son equivalentes a los que cargan antes. La carga debe cancelarse correctamente al cambiar, caer, sufrir una interrupción aplicable o terminar el combate. Puño Certero, Venganza/Bide, ataques que bloquean varios turnos y ataques futuros necesitan sus propios estados; no convertir todos en la misma carga genérica.

## Habilidades: perfil y plan de implementación

Las habilidades ocultas no existían en FRLG. Se incluyen como extensión explícita. Para conservar las normales originales, elegir entre `frlgAbilities` y añadir las entradas actuales con `hidden:true`; son 99 habilidades distintas en total. `abilities` contiene además las normales actuales, de modo que no se pierde información: por ejemplo, Gengar tenía Levitación en Gen3 y tiene Cuerpo Maldito en su asignación actual.

El catálogo da un resumen propio en español, `hooks`, `requires` y `implementationStatus:'data-only'` para las 114. Las habilidades introducidas en Gen3 describen su funcionamiento FRLG; las posteriores son extensiones. Las diferencias de generación deben ser una decisión de reglas visible, no consecuencias accidentales de mezclar metadatos:

| Caso | Perfil FRLG del catálogo | Posible modernización adicional |
|---|---|---|
| Robustez | Bloquea KO directo | Resistir con 1 PS desde PS completos |
| Pararrayos | Redirige Electricidad en dobles | Inmunidad y aumento de Ataque Especial |
| Efecto Espora | 10% total al contacto | Probabilidad posterior mayor |
| Hedor / Iluminación | Efectos fuera de combate | Sus efectos de combate añadidos después |
| Sequía | Sol permanente hasta reemplazar | Duración limitada posterior |
| Foco Interno / Ritmo Propio / Despiste | Inmunidades Gen3 | Inmunidad posterior a Intimidación |

Orden concreto de hooks recomendado:

1. **Entrada y cambio:** Intimidación, Cura Natural, Regeneración y climas; recalcular capacidades activas al cambiar. No reasignar la habilidad elegida al evolucionar sin conservar el slot correspondiente.
2. **Consulta de inmunidad y estado:** Levitación, absorciones, Insomnio, Inmunidad, Velo Agua, Ritmo Propio, Polvo Escudo, Cuerpo Puro y protecciones de estadísticas. Centralizar esta consulta para que afecte tanto ataques directos como efectos secundarios y habilidades.
3. **Cálculo de precisión, velocidad y daño:** Mar Llamas/Espesura/Torrente/Enjambre, Agallas, Escama Especial, Sebo, Compensación, Experto, Adaptable, Cromolente y habilidades de clima. Conservar el split físico/especial por tipo Gen3.
4. **Impacto/contacto y fin de turno:** Electricidad Estática, Punto Tóxico, Cuerpo Llama, Efecto Espora, Mudar, Cura Lluvia y variantes meteorológicas. El contacto depende de flags, no de que el movimiento sea físico.
5. **Eventos específicos:** Presión al gastar PP; Cabeza Roca al aplicar retroceso; Lodo Líquido al absorber; Autoestima al conseguir KO; Competitivo/Tenacidad solo ante reducciones causadas por rivales; Rompemoldes con lista de habilidades anulables y Gas Reactivo con supresión temporal.

Dependencias que no deben fingirse con un bonus genérico: Gran Encanto/Rivalidad necesitan sexo; Recogida/Cacheo/Cosecha/Gula/Liviano/Nerviosismo/Viscosidad necesitan objetos equipados; Alma Cura/Compiescolta necesitan combates dobles y aliados; Impostor necesita Transformación; Rastro necesita copia y exclusiones; Gas Reactivo necesita supresión y restauración. Sus `requires` permiten mantenerlos identificados hasta que el motor soporte sus condiciones. Es correcto que una habilidad de dobles no actúe en individual; no es correcto sustituirla por otra ni anunciar un efecto inexistente.

## Fuentes y límites

- [Documentación oficial de PokeAPI](https://pokeapi.co/docs/v2): significados de campos, relaciones de versiones, movimientos, habilidades y crecimiento.
- [CSV mantenidos por PokeAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv): learnsets, nombres españoles, asignación actual de habilidades, experiencia, metadata e historial de movimientos.
- [Tabla de movimientos FRLG](https://github.com/pret/pokefirered/blob/master/src/data/battle_moves.h): potencia, PP, precisión, prioridad, objetivo, flags y efecto de cada movimiento de Gen3.
- [Learnsets FRLG](https://github.com/pret/pokefirered/blob/master/src/data/pokemon/level_up_learnsets.h) y [datos de especies FRLG](https://github.com/pret/pokefirered/blob/master/src/data/pokemon/species_info.h): comprobación completa del aprendizaje, habilidad original y rendimiento de XP.
- [Comandos de combate FRLG](https://github.com/pret/pokefirered/blob/master/src/battle_script_commands.c) y [utilidades de combate FRLG](https://github.com/pret/pokefirered/blob/master/src/battle_util.c): reparto de experiencia y detalles de habilidades originales.
- [Definiciones de habilidades de pokeemerald-expansion](https://github.com/rh-hideout/pokeemerald-expansion/blob/master/src/data/abilities.h): referencia de implementación y diferencias configurables entre generaciones para las extensiones.

Se entregan hechos y una recomendación de integración, no código del motor ni una promesa de soporte de los 198 efectos. `validation.json` contiene controles y hashes de las fuentes; `learnset-discrepancies.json` debe estar vacío tras seleccionar la rama LeafGreen. No se publicaron cambios ni se editaron archivos del juego.
