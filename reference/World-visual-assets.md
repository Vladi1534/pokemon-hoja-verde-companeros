# NPC y vocabulario visual del mundo

Se prepararon **18 tiras de sprites**, de las cuales 16 tienen animación de marcha. `mom` tiene tres poses y `nurse` tiene tres poses más la reverencia. Las cuatro direcciones están disponibles usando el espejo horizontal para la derecha.

## Archivos y contrato

- `people-assets.json`: datos para integrar. `people` contiene las 18 claves y sus PNG como data URL; `meta` contiene dimensiones, direcciones, ancla, animaciones y procedencia por clave.
- `people/*.png`: PNG listos para canvas.
- `source/*.png`: originales descargados, sin modificación.
- `build_people.py`: empaquetador reproducible y validación de dimensiones, transparencia y referencias de cuadros.
- `download-report.json`: informe de descarga con URL fijada a una revisión.
- `expansion-CREDITS.md`: créditos del proyecto fuente, preservados.
- `object_event_anims.h` y `object_event_pic_tables.h`: tablas primarias usadas para confirmar el orden de las poses.

Integrar `Object.assign(ASSETS.people, bundle.people)` **antes** de convertir las data URLs en objetos `Image`. El bundle no contiene scripts que muten el motor. Puede copiarse la entrada `people` directamente al objeto existente en `data.js`.

Todos los cuadros son **16 × 32 píxeles**, en tira horizontal. Para los 16 sprites que caminan:

| Dirección | Quieto | Marcha | Espejo horizontal |
|---|---:|---|---|
| Abajo | 0 | 3, 4 | No |
| Arriba | 1 | 5, 6 | No |
| Izquierda | 2 | 7, 8 | No |
| Derecha | 2 | 7, 8 | Sí |

`mom` y `nurse` repiten su cuadro quieto al moverse. `nurse.specialFrames.bow = 3`. Las tiras FRLG con diez cuadros conservan el último cuadro pero no lo emplean para marcha. No interpolar ni suavizar los píxeles: usar `imageSmoothingEnabled = false` y conservar el anclaje a los pies del renderer actual.

El renderer existente ya admite este orden de cuadros. Su bucle de NPC sustituye expresamente `rocket` por `red`: eliminar esa sustitución al integrar. Conviene mantener el fallback de la clave genérica `person`, y pasar el estado real de marcha al argumento `moving` de `person(...)` cuando el NPC patrulle.

## Distribución sugerida

| Clave | Rol visual | Uso inmediato |
|---|---|---|
| `bugcatcher` | Cazabichos con red | Bosque Verde y senderos de hierba |
| `youngster` | Entrenador joven | Primeras rutas, cerca de accesos a ciudades |
| `lass` | Entrenadora | Rutas de Cerulean/Celeste y zonas residenciales |
| `hiker` | Montañero | Mt. Moon, montañas y entradas de cuevas |
| `sailor` | Marinero | Puerto y S.S. Anne |
| `scientist` | Científico | Laboratorio, fósiles, Silph y laboratorio de Cinnabar |
| `rocket` | Rocket hombre | Mt. Moon, guarida y Silph |
| `rocketF` | Rocket mujer | Guarida y Silph, variar entre ambos reclutas |
| `nurse` | Enfermera FRLG | Centro Pokémon; reemplaza la clave existente |
| `clerk` | Dependiente | Tiendas y recepciones |
| `fisher` | Pescador | Bordes de agua y muelles |
| `camper` | Campista | Ruta 3 y zonas de acampada |
| `picnicker` | Dominguera | Rutas, bancos y áreas de descanso |
| `blue` | Rival | Usar en los encuentros narrativos con el rival |
| `mom` | Madre | Casa inicial y NPC doméstico que permanece en su sitio |
| `fuji` | Señor Fuji | Pueblo Lavanda / cuidador o anciano de historia |
| `police` | Policía | Cruces bloqueados por eventos, Silph y comisarías |
| `gentleman` | Caballero | Guías de ciudad y pasajeros del barco |

Para dar vida sin generar combates accidentales durante diálogos: los NPC quietos pueden girar cada 2–4 segundos con una fase basada en su ID; los que patrullan alternan 1–3 casillas y pausa. El cono de visión del entrenador debe usar su `dir`, detenerse en muros/edificios/agua y resolver el acercamiento una sola vez antes de abrir el combate. La animación de marcha debe coincidir con el movimiento y no con el temporizador de giro.

## Edificios que puede dibujar el canvas

Estos son diseños propuestos para el renderer procedural, no recursos descargados. Mantienen la paleta y la escala actuales.

Primero crear tres variantes de casa dentro de la misma huella de colisión: tejado a dos aguas con chimenea, tejado de teja con buhardilla y tejado plano con parapeto. Elegir variante con un hash estable de `map.id + building.id`; nunca con `Math.random()` durante el dibujo. Ventanas, puertas y luces deben conservar posición entre cuadros. La puerta visible debe coincidir con la casilla de interacción y el camino.

| Entorno | Edificios distintivos | Props y guía visual |
|---|---|---|
| Pueblo Paleta | Casas crema, teja rojiza, persianas, chimenea; laboratorio ancho con ventanas altas | Vallas bajas, macetas, buzones, una parcela de flores; camino claro desde casa al laboratorio |
| Ciudad Verde | Madera clara, tejados verdes, pequeño puesto de guardia | Señales en la bifurcación, faroles, setos recortados y tablón de ruta |
| Ciudad Plateada | Zócalo de piedra, tejados pizarra; museo con dos columnas y fósil en cartel | Rocas decorativas, bancos y adoquines; gimnasio distinguible por emblema pétreo |
| Ciudad Celeste | Fachadas blancas, tejados azules; gimnasio con lucernario y franjas de agua | Canales, pasarelas con barandillas, flores azules y fuente; puente como hito hacia el norte |
| Ciudad Carmín | Fachadas ocres y cobertizos de puerto; estación de embarque diferente a una casa | Muelle de tablones, bolardos, cajas, cuerdas, gaviotas decorativas; pasarela visible al barco |
| Ciudad Azulona | Tiendas con toldos a rayas y escaparates; centro comercial de varios pisos | Jardineras, fuente central, terraza, máquinas expendedoras y cartel luminoso discreto |
| Pueblo Lavanda | Casas de piedra pálida; torre alta con campanario y zócalo violeta | Faroles, lápidas, flores claras y cipreses; entrada de torre visible desde la llegada |
| Ciudad Fucsia | Casas bajas de tonos tierra; entrada Safari con dos postes y dosel | Bambú, vallado de madera, estanques, huellas en arena y tablones de fauna |
| Ciudad Azafrán | Fachadas de ladrillo, cristales en retícula; Silph con acceso ancho y emblema propio | Cruces pavimentados, pasos peatonales, farolas y jardineras; Silph como hito central |
| Isla Canela | Piedra volcánica, tejados rojo oscuro; laboratorio con tubos y antena | Rocas negras, tuberías, ventiladores y carteles de investigación |
| Meseta Añil | Edificio simétrico con columnas y escalinata ancha | Banderas, estandartes de las medallas y camino de losas hacia la puerta |

Los Centros Pokémon y las tiendas deben conservar siempre su código rojo/azul para que el jugador los identifique de inmediato, aunque cambien el zócalo, la forma del tejado y los props según la ciudad. Los gimnasios requieren un emblema del tipo y una entrada clara, no sólo el texto `GYM`.

Para rutas y cuevas: mezclar dos alturas de árbol, arbustos, troncos, hongos y claros; cortar caminos con curvas y pequeñas bifurcaciones hacia objetos opcionales; incluir escarpes, guijarros, estalagmitas y charcos en cuevas. Es mejor que cada prop refuerce una ruta o un hito que llenar de decoración el suelo transitable.

## Detalles de render e interacción

1. Mantener una capa de suelo, otra de props bajos y la ordenación por pie para personas, edificios y árboles. El tejado puede sobresalir de la huella; no extender silenciosamente la colisión.
2. Los bancos y cajas deben definir explícitamente si bloquean el paso. Flores y marcas del suelo no lo bloquean.
3. Las vallas deben tener huecos alineados al camino. La pasarela del puerto debe tener la misma colisión visible que el terreno transitable.
4. Evitar casas decorativas con puertas idénticas a las accesibles: abrir las reales y usar persianas cerradas o fachadas laterales en el resto.
5. Las señales de ruta pueden mostrar un número y una flecha; combinar con el mapa regional y el objetivo actual para orientar al jugador.

## Procedencia y créditos

Fuente primaria: [rh-hideout/pokeemerald-expansion](https://github.com/rh-hideout/pokeemerald-expansion/tree/f4dc700a130330fd2f9325a17bbb1e2d91dbf091/graphics/object_events/pics/people), revisión `f4dc700a130330fd2f9325a17bbb1e2d91dbf091`. Cada archivo incluye su URL y SHA-256 en `people-assets.json`. El proyecto fuente deriva de los trabajos de desensamblado de pret y contiene arte original de Pokémon y aportes comunitarios; se preserva su archivo de créditos.

Personajes y arte original de Pokémon: Nintendo, Game Freak y Creatures. Este paquete no declara una licencia adicional sobre dichos recursos.

En `scientist` y `fisher` se añadió únicamente el chunk PNG `tRNS` para hacer transparente el índice 0 de la paleta, como requiere su representación en el juego. Los datos comprimidos de píxeles se conservan intactos. El resto de PNG es idéntico al original.
