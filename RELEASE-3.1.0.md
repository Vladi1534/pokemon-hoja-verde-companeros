# 3.1.0 — Personajes, accesos e Isla Nueva

La historia principal y los 425 mapas de Verde Hoja conservan su geometría. Esta actualización añade un episodio opcional de Mewtwo, después de corregir la relación entre las puertas dibujadas y sus casillas de paso.

## Personajes y accesos

- 118 hojas originales de personajes y criaturas, con su tamaño real de fotograma. Los NPC importados conservan la identidad gráfica indicada en su mapa: científicos, campistas, pescadores, nadadores, Rocket y personajes con nombre.
- Se elimina el recurso al sprite de Rojo cuando falta una apariencia. El error `bug`/`bugcatcher` ya no convierte cazabichos en copias del jugador.
- Las 74 fachadas adaptadas ajustan su abertura visible a la casilla original de entrada; las paredes laterales se escalan por separado. También se contempla la tienda reflejada.
- Se recuperan 159 casillas laterales registradas de salidas anchas. Una alfombra de tres casillas permite salir por sus tres casillas. No se activan puertas independientes que deban seguir cerradas.

## Episodio de Mewtwo

1. Corey en Ruta 2, una investigadora del museo y Fergus en Ruta 6 ofrecen pistas.
2. Tras conseguir la cuarta medalla y el Scope Silph, Neesha entrega una invitación en Azulona. La marinera de Ciudad Carmín lleva a Isla Nueva.
3. Combate contra Corey, Fergus y Neesha; después enfrenta a los clones de Venusaur, Charizard y Blastoise. La enfermería permite descansar, y puedes volver a Kanto en cualquier momento.
4. Mewtwo aparece como encuentro capturable de nivel 50. Debilitarlo permite reintentarlo; **solo capturarlo** abre el laboratorio.
5. El terminal entrega el dispositivo remoto y una primera Clon Ball. Las recargas cuestan ₽6.000 y el dispositivo admite dos cargas.

La invitación, el dispositivo y las Clon Balls aparecen en la mochila. El diario tiene una sección separada para este episodio. Las cinco salas adicionales reutilizan geometría nativa verificada; son una adaptación fan del episodio, no una reproducción exacta de la isla de la película.

## Clonación durante el combate

- Captura garantizada contra el Pokémon activo de un NPC. No funciona contra jugadores ni en prácticas.
- Conserva especie, nivel, experiencia, IV, EV, naturaleza, habilidad y movimientos. Tiene identidad nueva, PS/PP completos y no duplica el objeto equipado ni los efectos temporales del combate.
- El original vuelve inmediatamente, sin quitarlo del equipo rival ni anular su acción. Capturar consume un turno.
- Después puedes ponerle un mote y dejarlo en el PC, o recibirlo en el equipo gastando otra acción. Sustituir al activo hace entrar al clon; sustituir un puesto de la banca lo deja en la banca. Se permite sustituir a un compañero debilitado de la banca.
- El compañero enviado al PC conserva sus PS y PP. No se utiliza la transferencia para curarlo.
- Una captura por entrenador y combate, y una copia por ejemplar original del NPC. Los dos Gengar de un mismo entrenador se distinguen por su puesto.
- Hace falta una casilla libre en el PC para reservar el clon. Si pierdes durante la captura, el clon permanece en esa casilla. Ante un cambio obligatorio, elige primero un relevo ordinario; el clon sigue esperando.
- La procedencia persiste en guardados, motes e intercambios. El NPC recuerda la clonación; si llevas su copia, reacciona a ella.
- Marcas oscuras en los sprites de combate, fichas y seguidores distinguen a los clones. Es un material visual generado al dibujar, inspirado en las marcas de la película; las hojas originales permanecen intactas.

## Verificación y alcance

- Auditoría de 430 mapas sin alias: 1.188 transiciones utilizables, 495 salidas desde la propia casilla, 784 contactos entre bordes, 107 obstáculos y 74 fachadas. Los cinco mapas extra pertenecen al episodio opcional.
- Comprobación de 1.118 apariencias de NPC y de la transparencia y geometría de las 118 hojas importadas.
- Trece regresiones de clonación: datos exactos, recepción activa/banca, debilitados, PC lleno, derrota, guardado, duplicados, PvP, cooperación, atrapamiento, referencias del simulador y recorrido de la isla.
- Pruebas del cliente en escritorio y en un viewport móvil de 390 × 844: mochila, selección del rival, mote, recarga y recepción. La revisión visual de los mapas originales es por muestras, además de la auditoría estructural completa.
- Las suites existentes siguen comprobando campaña, movimiento, combate, habilidades, guardados y servicios online. La interfaz utiliza el mismo motor tanto en solitario como online.

Las partidas 3.0.x se conservan. La actualización no requiere reiniciar la aventura. La misión de Isla Nueva puede iniciarse aunque hayas pasado de largo sus primeras pistas.
