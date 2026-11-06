> Integración 3.0: el dataset `runtime-world.json` se versiona como `runtime-world.json.gz` (gzip determinista); el contenido descomprimido es idéntico. Esta carpeta contiene el subconjunto necesario para compilar y auditar el juego. Los scripts pueden reconstruir el conjunto completo con la copia aportada y las referencias indicadas.

# Mapeo nativo de Pokémon Verde Hoja, edición española

Los datos numéricos y los píxeles se han leído del archivo aportado por el usuario. No se ha ejecutado, modificado ni incluido la ROM en esta entrega. Los nombres simbólicos y la comprobación independiente proceden de `pret/pokefirered`, commit `ce6406d8c2eaf46d543c8a2606de0c3cb1951982`.

## Cobertura comprobada

| Dato | Cobertura |
|---|---:|
| Bancos/mapas | 43 / 425 |
| Mapas de Kanto, incluidos interiores y algunos escenarios no usados | 256 |
| Celdas originales | 233.741 |
| Geometrías de mapa idénticas al decomp | 425 / 425 |
| Layouts, incluidas variantes dinámicas y no usadas | 365, más 18 posiciones nulas |
| Objetos/NPC / eventos de coordenada / eventos de fondo | 1.648 / 228 / 702 |
| Warps / conexiones de borde | 1.294 / 116 |
| Atlas combinados de tilesets | 60, cada uno con capas `under`, `over`, `full` |
| Mapas anteriores asociados | 112, correspondientes a 110 mapas nativos distintos |
| Roles de historia actuales con posición nativa verificada | 93 |
| Entrenadores ROM / NPC vinculados a equipo | 743 / 450 |
| Equipos reales contrastados con decomp | 639, sin diferencias |
| Diálogos españoles iniciales simples / introducciones de entrenador | 333 / 432 |
| Recogibles visibles / ocultos | 168 / 183, todos contrastados |

`audit.json` contiene las comprobaciones realizadas. La ROM es `BPGS`, revisión 0, SHA-256 `f8908e0bd32cf27077a26b557e1eea0ff06ce8059bee5dc7d799aab44a070d48`.

## Archivos para integrar

| Archivo | Uso |
|---|---|
| `runtime-world.json` | Los 425 mapas, listos para consultar desde un compilador de mundo. |
| `maps/frlg_BB_NN.json` | Extracción detallada individual, con offsets ROM y símbolos de cada evento. |
| `index.json` | Índice de bancos, mapas, dimensiones, tilesets y procedencia. |
| `tilesets/*.json` | Atributos de cada metatile: comportamiento, terreno, encuentros, capas y subtiles. |
| `atlases/*.under.png` | Capa que se dibuja antes de los personajes. |
| `atlases/*.over.png` | Capa que se dibuja sobre los personajes. |
| `atlases/*.full.png` | Composición opaca para referencia. |
| `reference/*.png` | Mapas originales reconstruidos: Paleta, Bosque Verde, Mt. Moon, etc. |
| `legacy-map-correspondence.json` y `.csv` | IDs anteriores → IDs/mapas nativos, dimensiones y notas de migración. |
| `legacy-story-anchors.json` | NPC/roles anteriores → mapa, evento y coordenadas originales. |
| `events-by-script.json` | Búsqueda de objetos y eventos por símbolo de script. |
| `door-anchors.json` | 203 entradas exteriores: coordenada de puerta, destino y contacto transitable. |
| `warp-contacts.json` | Destino y casillas de aproximación/llegada de todos los warps. |
| `all-layouts.json` | Los 365 layouts; 56 no son el layout predeterminado de ningún mapa. |
| `scripted-map-operations.json` | 669 operaciones de scripts que modifican tiles/layouts/warps/objetos, con archivo y etiqueta de origen. |
| `wild-encounters-leafgreen.json` | 132 entradas de encuentros originales con tasas, niveles, especies y cañas. |
| `native-trainers.json` | Equipos y datos españoles de los 743 entrenadores. |
| `native-trainer-objects.json` | Objetos del mapa → entrenador inicial/variantes; textos de introducción y derrota cuando son directos. |
| `native-simple-dialogues-es.json` | Texto directo inicial de scripts `msgbox` sencillos, sin interpretar ramas. |
| `native-map-items.json` | Recogibles exactos, flags de recogida y regalos condicionales separados. |
| `missing-map-scenarios.json` | Escenarios originales que no tenían ID equivalente en el mundo anterior. |

## Contrato de coordenadas y representación

Cada celda es un **metatile original de 16×16 píxeles**. El motor puede presentarlo a 32×32 o cualquier escala entera sin cambiar coordenadas ni geometría. Los atlas tienen 32 columnas, 32 filas; el rectángulo de un metatile `id` es `(id % 32 * 16, floor(id / 32) * 16, 16, 16)`.

`blocks[y][x]` es el `uint16` original:

```js
const metatileId = block & 0x03ff;
const collision = (block >> 10) & 3;
const elevation = block >> 12;
```

`runtime-world.json` también expone matrices separadas `collision`, `elevation`, `behavior`, `encounterType`, `semantic` y `suggestedGrid`. `semanticCodes` explica los valores de `semantic`: suelo, hierba alta, agua, obstáculo, salto, warp, hielo o movimiento forzado. `suggestedGrid` es solo una adaptación a los códigos del motor anterior; **no sustituye** la información original de colisión, elevación y comportamiento.

Una colisión distinta de cero bloquea la marcha normal. Las puertas, saltos, obstáculos móviles y rompecabezas tienen reglas adicionales. El terreno y el tipo de encuentro no son equivalentes: las cuevas pueden generar encuentros sobre suelo, y el agua requiere Surf.

Las elevaciones 0 y 15 admiten transiciones de elevación según las reglas de FRLG. No debe aplanarse toda elevación a una sola capa: puentes y desniveles dependen de este dato.

Los atlas son una referencia visual fiel de FRLG. La capa gráfica HG puede sustituir texturas/modelos por semántica, conservando estas coordenadas. El archivo no afirma que los atlas GBA sean gráficos HG. Una pared, un mueble y un árbol pueden compartir la clase `obstacle`; reemplazar todos por árboles destruiría el mapa.

## Warps, puertas y conexiones

- **Todos los índices de warp son cero-based**, igual que los datos ROM. Nunca restar 1 a `destinationWarp`.
- `MB_WARP_DOOR` (`0x69`) normalmente tiene colisión 1. Se activa al intentar avanzar hacia arriba desde la casilla inferior: `trigger: "approach"`, `entryDirection: "up"`.
- Escaleras, entradas de cueva y flechas utilizan su comportamiento original; consultar `sourceCell.behaviorName`, `trigger` y `entryDirection`.
- `arrival` es una posición estáticamente transitable: la celda destino si es pisable o el contacto de la puerta. Siempre mantener un bloqueo temporal de warp hasta abandonar la casilla de llegada; así se evita el rebote infinito.
- `connections[].contacts` lista los pares exactos `from`/`to` en bordes transitables. Al cruzar verticalmente, `targetX = sourceX - offset`; al cruzar horizontalmente, `targetY = sourceY - offset`.
- Hay **19 warps dinámicos**, por ejemplo ascensores y funciones de enlace; su destino depende del estado y no debe inventarse.
- Hay **13 warps sin casilla adyacente transitable en el layout inicial**: dos vestigios del S. S. Anne, entradas con secuencia de la Liga, pisos de Torre Desafío y un túnel posgame. `activeWarpBehaviorByDefault: false` identifica además anclas sin comportamiento de warp activo. No abrirlos por la fuerza; aplicar la secuencia o variante correspondiente.
- Los contactos calculados ignoran NPC, objetos movibles y flags de historia. Estos deben resolverse por estado del juego.

La ROM no tiene objetos "edificio" con un rectángulo; los edificios forman parte del mapa de tiles. Por ello `door-anchors.bounds` es `null`: sus puertas y colisiones sí son exactas. Alinear cualquier modelo HG a la puerta real y respetar su huella, en lugar de deducir un rectángulo por tamaño visual.

## Personajes, entrenadores, historia y objetos

Anclar cada rol existente **una sola vez** a su `nativeId` y coordenada en `legacy-story-anchors.json`. Reutilizar el objeto nativo indicado por `nativeEventIndex` o su `localId`, sin crear una copia adicional. Respetar `symbols.flag`/`nativeVisibilityFlag` para Oak, Bill, rivales y objetos temporales. Varias apariciones de un mismo personaje corresponden a estados distintos.

Los NPC detrás de mostradores necesitan interacción a dos celdas cuando la intermedia sea `MB_COUNTER` (`0x80`). No mover enfermeras ni dependientes al pasillo para resolver esta interacción.

En `native-trainer-objects.json`, `resolution: "direct-ROM-opcode"` identifica el entrenador inicial inequívoco. Las entradas por análisis de llamadas pueden tener iniciales/revanchas o variantes según el Pokémon inicial; sus condiciones están señaladas. `native-trainers.team[].speciesId` usa IDs internos FRLG (los primeros 251 coinciden con Pokédex nacional). Las especies mayores requieren convertir por `speciesSymbol`. `ivScale255` es el valor de entrenador original, no un IV individual de 0–31.

Los valores `trainerType` superiores a 3 que aparecen en algunas rocas se utilizan como datos del rompecabezas; no son entrenadores.

Los recogibles simples tienen `oneTimeFlagId` y una identidad estable `mapa:tipo:índice`. Para ocultos, el flag es `1000 + flagOffset`, con cantidad y requisito `underfoot` originales. No tratar `conditionalGifts` como objetos gratis: contienen recompensas, fósiles, decisiones y requisitos de historia. Los ocho objetos con aspecto de Poké Ball pero sin `finditem` inicial incluyen Pokémon disfrazados y guiones especiales.

**Los IDs de objetos GBA no son los IDs de HGSS.** Usar `itemSymbol` y `engineKeyHint` para traducirlos al catálogo del juego. Lo mismo se aplica a cualquier futura importación de datos entre generaciones.

Los cambios importantes de distribución están anotados en la correspondencia: Monte Moon tiene tres plantas con cuatro enlaces internos distintos; Silph tiene once plantas y ascensor; Torre Pokémon siete; Guarida Rocket cuatro sótanos y ascensor; Mansión tres plantas y sótano; Calle Victoria tres; Islas Espuma cinco; Safari cuatro zonas y acceso; Liga seis salas. Los mapas anteriores concentraban varios de estos escenarios en uno solo.

## Límites concretos

Este paquete contiene el mapa y sus datos, **no un intérprete de eventos GBA**. Los callbacks de C, secuencias, puertas de rompecabezas, flags, entrenadores y diálogos con ramas deben vincularse al motor de historia. `scripted-map-operations.json` proporciona los cambios concretos y su origen, pero no ejecuta automáticamente las condiciones. Los renders son estáticos: no aplican animaciones de agua/flor, ciclo horario, niebla u oscurecimiento de Destello.

Los 425 mapas incluyen funciones de enlace, mapas de evento, prototipos y mapas sin uso. No todos deberían abrirse en el recorrido normal. Los encuentros FRLG no tienen variante día/noche; cualquier división horaria añadida debe declararse como adaptación del juego.

## Reproducción

Python 3.12 y Pillow 13.0.0 fueron utilizados. Obtener el decomp en el commit indicado y pasar el ZIP/GBA aportado como entrada de solo lectura. Los scripts no requieren emulador ni generan una copia de la ROM.

```bash
python scripts/extract_leafgreen_maps.py --rom RUTA_AL_ZIP --decomp RUTA_AL_DECOMP --out SALIDA --render selected
python scripts/build_integration.py --native SALIDA --current legacy-world-v29-input.json --decomp RUTA_AL_DECOMP
python scripts/build_story_anchors.py --native SALIDA --current legacy-world-v29-input.json
python scripts/extract_layout_variants.py --rom RUTA_AL_ZIP --decomp RUTA_AL_DECOMP --out SALIDA
python scripts/extract_native_trainers.py --rom RUTA_AL_ZIP --decomp RUTA_AL_DECOMP --out SALIDA
python scripts/extract_native_items.py --rom RUTA_AL_ZIP --decomp RUTA_AL_DECOMP --out SALIDA
```

`legacy-world-v29-input.json` es una entrada mínima reproducible de correspondencias/roles auditados; no es una partida guardada ni el mundo completo anterior. Para renders de todos los mapas, usar `--render all` en la primera orden. Los offsets se descubren mediante firmas y se validan contra todo el conjunto de mapas; no dependen de offsets de una edición inglesa.

Fuentes de estructura y formato:

- https://github.com/pret/pokefirered/blob/ce6406d8c2eaf46d543c8a2606de0c3cb1951982/include/global.fieldmap.h
- https://github.com/pret/pokefirered/blob/ce6406d8c2eaf46d543c8a2606de0c3cb1951982/src/fieldmap.c
- https://github.com/pret/pokefirered/blob/ce6406d8c2eaf46d543c8a2606de0c3cb1951982/src/field_camera.c
- https://github.com/pret/pokefirered/blob/ce6406d8c2eaf46d543c8a2606de0c3cb1951982/include/battle.h
