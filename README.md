# Pokémon Hoja Verde · Compañeros 3.0.1

Aventura fan de Kanto para navegador, con tu líder siguiéndote y una partida personal que puedes abrir a amigos. La geometría procede de 425 mapas originales de Verde Hoja; la campaña y sus eventos siguen adaptados al motor web compartido. El arte de HeartGold se integra progresivamente sin cambiar esas coordenadas.

**Jugar:** https://vladi1534.github.io/pokemon-hoja-verde-companeros/

## Una partida, solo o acompañado

1. Crea tu entrenador e inicial y empieza en **1 jugador**.
2. Pulsa **Mi partida → Abrir a amigos** para abrir ese mismo mundo. Comparte el código de ocho caracteres.
3. Tu amigo inicia o continúa su propia partida y pulsa **Unirme con código**. Llega a Pueblo Paleta con su equipo; un entrenador nuevo empieza con su inicial de nivel 5.
4. Acercaos para regalar objetos/Pokémon, intercambiar o retaros. El destinatario revisa y acepta o rechaza los regalos; los intercambios requieren ambas ofertas y confirmación final.
5. **Guardar y seguir solo** conserva tu equipo, mochila, dinero, Pokédex, historia, posición y los caminos despejados del mundo visitado. Después puedes hospedar tú o visitar otro mundo con el mismo entrenador.

Hasta cuatro entrenadores pueden recorrer un mundo. Los encuentros individuales no bloquean los de los demás. Dos personas pueden combatir juntas contra NPC; cada una decide sus movimientos, y el rival incorpora un equipo de refuerzo. Los demás pueden explorar, combatir por su cuenta u observar. El PvP no entrega experiencia, EV, dinero ni medallas.

Las medallas y objetos clave pertenecen a cada entrenador. La historia avanza para los participantes que cumplen sus requisitos; un invitado nuevo no recibe automáticamente las medallas del anfitrión. Los árboles cortados pertenecen al mundo y se conservan en la copia local al salir.

## Cambios de esta versión

- Árboles de Corte con texturas visibles y paso libre tras despejarlos.
- Fachadas completas, puertas alineadas y vegetación nativa conservada. Las fachadas sin correspondencia exacta mantienen su arte original.
- Movimiento unificado con el motor nativo: cruces de rutas, saltos y barreras abiertas sin rechazos del navegador por una cuadrícula antigua.
- Entradas y salidas corregidas, incluso al cargar partidas guardadas sobre una flecha de salida. Las placas y otros objetos invisibles de interacción ya no generan paredes.
- Auditoría automática de 425 mapas, 1.018 transiciones utilizables, 784 contactos entre bordes y 107 obstáculos removibles.

Detalle y límites: [correcciones 3.0.1](RELEASE-3.0.1.md).

## Novedades de 3.0.0

- Experiencia y EV tras cada rival debilitado, con mensaje, barra y nivel durante el combate. Repartir Exp. se obtiene al entregar el paquete de Oak y se equipa desde la mochila.
- Fichas con efecto de las 25 naturalezas, filas de características en verde/rojo y recomendaciones orientativas según especie y movimientos, contrastadas con Pokéxperto.
- Motes persistentes; Pokédex con zonas, niveles y disponibilidad diurna/nocturna. Nidoran macho aparece en rutas iniciales.
- Pokéflauta, billete, llaves y MO visibles en Objetos clave. Se conservan al guardar, importar o visitar un mundo.
- Los 425 mapas conservan dimensiones, metatiles, elevaciones y conexiones de Verde Hoja. Edificios HG anclados a sus puertas originales; bosques y cuevas reciben texturas y modelos HG.
- Tema exclusivo para Ash tomado de VS Rival de HeartGold. El opening de anime del enlace solicitado no está incluido en los juegos aportados y continúa pendiente.

Detalle, pruebas y límites: [cambios 3.0.0](RELEASE-3.0.md). Historial: [2.9.0](RELEASE-2.9.md), [2.8.0](RELEASE-2.8.md).

La versión 2.4.1 incorporó:

- Corregido el bloqueo al recuperarse en un Centro Pokémon: el punto de descanso ya no restaura un contador antiguo de movimiento. Se recuperan también las partidas 2.4 que guardaron ese dato.
- Ataques y efectos presentados en secuencia, con los PS actualizándose tras cada acción. «Mostrar resultado» permite saltar la presentación; las reglas de velocidad y prioridad siguen a cargo del simulador.
- «¡Has ganado el combate!» para victorias individuales, incluso dentro de un mundo online. «¡Victoria en equipo!» sólo cuando participan dos entrenadores.
- Nidoran♀ y Nidoran♂ en Ruta 22, Abra poco frecuente en Ruta 2 y Caterpie/Weedle en Ruta 1. Son ajustes propios de variedad inicial, aplicados tanto en solitario como online.
- Recuperación de la sincronización antes de abrir la partida a amigos y respuesta inmediata a pulsaciones breves de dirección.

La versión 2.4 incorporó:

- Mismo motor de campaña y combate en solitario y online, incluyendo IV, EV, naturalezas, habilidades Gen3, crianza, PC y decisiones de aprendizaje/evolución.
- Encuentros en hierba alta desde el inicio, antes de entregar el paquete de Oak. El césped decorativo de las ciudades sigue siendo seguro.
- Combates independientes por entrenador, regalos con aceptación y viajes con identidad/entrenador original conservados.
- Indicador permanente **1 jugador / Online · Tu mundo / Online · Visita**, controles de entrada y salida, panel de equipo y jugadores.
- Combate de escritorio con rivales en diagonal y sprites más grandes; distribución móvil específica.
- Guardado local que reanuda combates pendientes sin límite de tiempo. Caché para jugar sin internet después de cargar una vez por HTTPS y ver **Disponible sin conexión**.

## Guardado y versiones anteriores

El guardado local pertenece al navegador y dirección donde juegas. **Descargar copia / Importar mi partida** permite trasladarlo a otro dispositivo. Una copia exportada durante una visita online recupera esa visita; usa **Guardar y seguir solo** para terminarla y continuar desconectado. No cierres una transferencia pendiente: reintentar recupera la misma operación.

Las partidas online 2.1–2.3 se recuperan desde la pantalla inicial o su llave privada. Al convertir una sala antigua, cada entrenador conserva el progreso compartido que ya tenía. Los siguientes avances son personales. Las nuevas visitas no heredan las medallas ajenas.

La partida solitaria antigua se convierte sin borrar su original. Sus datos de experiencia y movimientos pasan al motor compartido. Los IV/EV/naturalezas que ese motor anterior no almacenaba reciben valores iniciales de migración; las habilidades ocultas de la antigua ampliación no están implementadas en este perfil HeartGold. Conserva el respaldo si quieres volver a esa edición.

## Mundo y mecánicas

425 mapas nativos y dos alias de compatibilidad, diario de 24 hitos, atlas y mapa local. Campaña adaptada desde Oak hasta Liga y acceso a Isla Quarta. Se mantienen los 26 mapas del S. S. Anne y las plantas originales de cuevas, Silph y Torre. Importar geometría no equivale a ejecutar todos los scripts originales; consulta los límites de la versión.

Los entrenadores adaptados admiten tres victorias por entrenador, con recompensa reducida en las revanchas; los entrenadores importados del mapa original admiten una victoria. Los gimnasios y jefes de historia se completan una vez; la Liga permite tres recorridos. Ayudar en un desafío ya completado no vuelve a conceder sus recompensas.

Seis Pokémon por equipo, PC de 180, PS/PP/estados persistentes, captura, piedras e intercambio, guardería individual en Ruta 5 y crianza en Quarta. Cuatro movimientos como máximo, con elección al aprender/evolucionar. Reglas HeartGold/Gen4 mediante `@pkmn/sim@0.10.11` (MIT): IV 0–31, EV 255 por característica/510 totales, naturalezas, habilidades normales, ataques de carga y efectos de turno.

Flechas/WASD: caminar; Shift: correr; Z/Enter: interactuar; X/Escape: opciones; M: mapa. En móvil: cruceta y botones táctiles.

## Referencia de diseño y límites

Pokémon Revolution Online es una referencia para la claridad del equipo, la presencia de otros entrenadores y las interacciones sociales. Su [wiki oficial](https://wiki.pokemonrevolution.net/PRO) y [documentación de scripts](https://docs.pokemonrevolution.net/index.html) se consultan como referencia; este proyecto no incorpora ni afirma disponer de su motor completo. Conservamos el requisito propio de jugar localmente y abrir mundos privados a amigos.

La historia, geometría y puzles todavía no equivalen al cartucho completo. Faltan pesca, varios eventos secundarios, MT/MO enseñables, objetos equipados y contenido posterior. No hay chat ni un mundo MMO masivo. Transporte HTTP cada 350 ms con interpolación; falta validar carga y una campaña natural completa entre varios dispositivos. Los guardados locales son editables: no se ofrece una economía competitiva protegida contra trucos.

Consulta [fidelidad y pendientes](docs/FIDELIDAD-FRLG.md), [multijugador](docs/MULTIPLAYER.md), [cambios 2.4](docs/CAMBIOS-2.4.md) y [correcciones 2.4.1](docs/CAMBIOS-2.4.1.md).

## Desarrollo

Ejecuta `npm ci`, `npm run build` y `npm test` con Node 24. La compilación verifica y expande los paquetes gráficos de `assets/world-bundles`, y genera mapas, sprites embebidos y el motor desde el código fuente con dependencias fijadas. No necesita los cartuchos originales. `dist/` contiene el HTML, los motores personal y visual, audio, modelos, vistas compatibles, avisos legales y `sw.js`; mantén todos sus archivos juntos para distribuir el juego. Los archivos generados no se versionan. GitHub Actions los reconstruye, comprueba el motor resultante y publica `dist` en Pages.

El código compartido está en `online-server/server/` y el adaptador local en `online-server/browser/local-engine.mjs`. La compilación raíz actualiza también `online-server/server/world.json` y los archivos de juego de `online-server/public/`, antes de construir el servidor por separado. `online-server` incluye pruebas D1 de concurrencia, campaña, transferencia, regalos, aislamiento y paquete Worker.

## Créditos

Pokémon y gráficos originales © Nintendo, GAME FREAK y The Pokémon Company. Datos: [PokéAPI](https://github.com/PokeAPI/pokeapi) y [pret/pokefirered](https://github.com/pret/pokefirered). Sprites: [PokéAPI/sprites](https://github.com/PokeAPI/sprites), [pokeemerald-expansion](https://github.com/rh-hideout/pokeemerald-expansion) y sus artistas. Motor: [pkmn/sim](https://github.com/pkmn/ps).

Los avisos se conservan en `reference/`, `online-server/licenses/` y `personal-engine.js.LEGAL.txt`. No se incluye una ROM. El HTML inicial permanece en `reference/original.html`.
