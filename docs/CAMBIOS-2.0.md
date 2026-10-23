# Versión 2.0 · Aventura y combate

La versión 1.0 permitía encadenar gimnasios por salidas al norte y otorgaba experiencia excesiva a todo el equipo. La 2.0 introduce una cadena de historia y recorridos con desvíos, descubrimientos, regresos y decisiones.

| Problema observado | Cambio |
| --- | --- |
| Gimnasios sin historia intermedia | 24 hitos, personajes, objetos clave, pistas, mazmorras y requisitos explícitos para líderes. |
| Progresión demasiado rápida | Rendimiento de experiencia y curvas FRLG; participantes conscientes comparten XP; equipos finales con niveles adecuados. |
| Sin guía visual | Atlas conectado, accesos pendientes, itinerarios, mapa local, objetivo marcado, minimapa y diario. |
| Ataques reemplazados sin preguntar | Cola persistente de aprendizaje, elección de hueco/reemplazo/rechazo y confirmación. |
| Evolución cambia el repertorio | Se conservan movimientos, orden y PP; se ofrecen aparte los movimientos nuevos correspondientes. |
| Ataques de dos turnos instantáneos | Carga, semiinvulnerabilidad, impactos de respuesta y recuperación; un solo coste de PP. |
| Sin habilidades | Habilidades normales FRLG y ocultas posteriores, ficha explicativa y efectos de combate/campo. |
| Entrenadores estáticos | Giros y algunas patrullas, visión frontal obstruible, aviso y combate obligatorio al ser detectado. |
| Escasa variedad visual | 18 sprites adicionales y fachadas para museo, barco, Silph, torre, casino y mansión; bancos, lámparas y objetos de historia. |

## Partidas existentes

La clave del navegador se mantiene. El formato pasa de schema 1 a schema 2. La importación de 1.0 guarda una copia anterior y adapta el progreso a los hitos alcanzados; conserva nivel, criaturas, medallas y repertorio. La proporción hacia el siguiente nivel se convierte a la curva de la especie. Las posiciones se trasladan a un punto seguro porque la geometría cambió.

La cola de movimientos pendientes y la habilidad se conservan en el guardado. Cerrar o recargar durante una decisión no la descarta. El estado temporal de combate —carga, trampas, clima o transformaciones— no se guarda en los Pokémon.

## Validación

- 140 comprobaciones automáticas: los 151 Pokémon, datos y sprites, mapas completos y destinos, cadena de misiones y requisitos, importación/migración, PP, niveles, habilidades, estados, carga/recuperación, captura, derrota y Liga.
- Recorrido de los 361 movimientos para detectar excepciones y valores inválidos. No es una prueba exhaustiva de todas las combinaciones.
- Navegador: selección inicial, guardado, importación, reemplazo confirmado de Gruñido por Somnífero, evolución a Ivysaur conservando los cuatro ataques, ficha Clorofila oculta, atlas y planos.
- Presentación móvil a 390 px: controles táctiles mantenidos, seguidor y ausencia de desbordamiento horizontal.

## Alcance posterior

No se han añadido servicios online ni cuentas en esta versión. El diseño de salas e historia compartida sigue en MULTIPLAYER.md. Las habilidades que dependen de objetos equipados o de aliados en combates dobles explican esa limitación en su ficha. La prioridad siguiente será probar el ritmo de una partida real antes de introducir sincronización entre jugadores.
