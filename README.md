# Pokémon Hoja Verde · Compañeros 2.1

Aventura fan de Kanto para navegador, con un Pokémon líder que sigue al jugador. Esta edición sustituye la progresión lineal de la versión 1.0 por mapas conectados, una historia con objetivos y reglas de combate más completas. Es una adaptación con mapas y diálogos propios; no reproduce íntegramente Pokémon Verde Hoja.

**Jugar:** https://vladi1534.github.io/pokemon-hoja-verde-companeros/

También puedes abrir `dist/index.html` directamente. El juego integra sus gráficos, datos y música y no necesita descargar assets de otros servicios.

## Nuevo: beta cooperativa 2.1

Pulsa **Jugar online · Beta**, crea una sala y comparte **Invitar a un amigo**. Se admiten cuatro entrenadores visibles con su Pokémon inicial siguiendo sus pasos. Cada entrenador conserva una llave privada para recuperar su perfil desde otro navegador; está en **Mi entrenador**.

- Dos humanos contra dos NPC, con decisiones individuales, objetivos y cambios de Pokémon. El servidor espera a todos antes de resolver el turno.
- Entrenamiento individual con menor dificultad; los dos participantes reciben una oposición más fuerte. En salas de tres o cuatro, los demás pueden observar o seguir explorando.
- Duelo PvP individual con aceptación de ambos jugadores, sin pérdida de objetos ni recompensas.
- Misión compartida: encargo de Oak, paquete de la tienda de Ciudad Verde y regreso a Paleta. Los avances se conservan aunque alguien se desconecte.
- Reanudación de salas y combates, incluyendo PS, PP y decisiones pendientes. Guardado online separado de la aventura individual.

**Alcance de esta beta:** Paleta, Ruta 1, Ciudad Verde y seis interiores. Inicial Nv.8 y Pidgey Nv.7; equipos curados antes de cada combate. La entrega añade un nivel una sola vez. Todavía no incluye captura, gestión de mochila, intercambio ni la campaña completa en cooperativo. Los mapas siguen siendo adaptados. El siguiente tramo de trabajo será ampliar la campaña hacia Bosque Verde y Brock.

El cliente funciona en GitHub Pages y el servicio se publica por separado con Sites/Cloudflare Workers + D1. El código está en [online-server](online-server/README.md); contratos y límites en [MULTIPLAYER.md](docs/MULTIPLAYER.md). El motor online usa Pokémon Showdown (`@pkmn/sim`, reglas Gen3), con sus avisos MIT conservados.

## La aventura individual

- 26 zonas exteriores, con ciudades, rutas, bosque, mar, cuevas, interiores y varias plantas de mazmorra.
- 24 hitos principales: el paquete de Oak, el rescate del bosque, el museo, los fósiles del Monte Moon, el Puente Pepita, Bill, el S. S. Anne, el casino Rocket, la Torre Pokémon, Snorlax, Safari, Silph y la Mansión.
- Atlas con conexiones reales y accesos pendientes, mapa local con edificios y salidas, minimapa y diario. Vuelo se aprende durante la historia.
- Entrenadores con giro, patrullas y detección por línea de visión. Las paredes y los árboles cortan su vista; un entrenador derrotado deja de interceptarte.
- Ocho gimnasios y Liga, con requisitos de historia y progresión de niveles ampliada.
- 18 sprites adicionales de personajes, edificios especiales y mobiliario. El líder del equipo mantiene su seguimiento animado.

## Equipo y combate

Los 151 Pokémon tienen aprendizaje por especie y nivel de Verde Hoja, experiencia Gen3 y sus curvas de crecimiento. La experiencia se reparte entre quienes participan y permanecen conscientes. Los caramelos son recompensas de exploración, no un artículo ilimitado de la tienda.

Cada movimiento nuevo queda pendiente de una elección: aprender en un espacio libre, olvidar uno de los cuatro o no aprenderlo. Evolucionar conserva movimientos y PP. La ficha muestra la habilidad y permite recordar movimientos de la especie por ₽ 500.

Rayo Solar, Excavar, Vuelo, Buceo, Cabezazo y otros ataques de carga usan dos turnos y consumen PP una sola vez. Hiperrayo requiere recuperación; los ataques de varios golpes se resuelven en un mismo turno. Hay estados, cambios de estadísticas, clima, drenaje, trampas, protección y efectos residuales.

Las habilidades normales corresponden al perfil FRLG. Las ocultas posteriores amplían esta edición y pueden aparecer en el 8% de los encuentros salvajes. Una habilidad activa por Pokémon, con efectos como Espesura, Intimidación, Levitación, Absorbe Electricidad, Agallas, Clorofila o Regeneración. La ficha explica cuando una habilidad requiere un sistema aún ausente, como combates dobles u objetos equipados.

## Guardado y controles

Flechas/WASD para caminar, Shift para correr, Z/Enter para interactuar, X/Escape para volver, M para mapa y P para Pokédex. En móvil hay cruceta y botones táctiles.

La partida se guarda en el navegador. Exporta/importa JSON para cambiar de dispositivo o dirección. Al continuar una partida 1.0 se conserva el equipo, los movimientos y las medallas; se adapta la experiencia y se desbloquean los hitos anteriores a esas medallas. El respaldo 1.0 queda disponible desde Opciones. Para vivir todas las misiones desde el comienzo, exporta tu partida y elige Nueva aventura.

## Desarrollo y comprobaciones

`node validate.cjs` ejecuta 140 comprobaciones, incluidas navegación de todos los mapas, destinos de portales, colisiones, cadena de eventos, migración, aprendizaje, experiencia, habilidades y turnos. Una de las pruebas recorre los 361 movimientos del catálogo para detectar errores de ejecución y PS/estados inválidos; no certifica cada interacción del juego original.

`node build.cjs` genera el HTML independiente. GitHub Actions ejecuta la validación y compilación antes de publicar `dist` en Pages. Consulta [publicación](docs/PUBLICAR.md), [cambios de la versión](docs/CAMBIOS-2.0.md) y [diseño del multijugador](docs/MULTIPLAYER.md).

Prueba visual 2.0: inicio, importación, elección confirmada de movimiento, evolución conservando el repertorio, ficha de habilidad oculta, atlas, mapa local y carga móvil en un iframe de 390 px. El movimiento táctil mantuvo al seguidor en la casilla anterior y no hubo desbordamiento horizontal. No equivale a completar una campaña natural ni a probar dispositivos físicos.

## Alcance

La aventura individual mantiene su motor propio. Las evoluciones por piedra e intercambio continúan adaptadas a niveles; no hay crianza, objetos equipados ni combates dobles. Relevo cambia al siguiente compañero disponible. Las reglas de movimientos se han ampliado, pero no son una implementación certificada de todas las interacciones de la consola. Los combates dobles de dos humanos están disponibles en la beta online descrita arriba.

## Créditos y fuentes

Pokémon y gráficos originales © Nintendo, GAME FREAK y The Pokémon Company. Datos de aprendizaje, experiencia y movimientos: [PokéAPI](https://github.com/PokeAPI/pokeapi) y [pret/pokefirered](https://github.com/pret/pokefirered). Sprites de combate: [PokéAPI/sprites](https://github.com/PokeAPI/sprites). Personajes y seguidores: [pokeemerald-expansion](https://github.com/rh-hideout/pokeemerald-expansion) y sus artistas.

Fuentes y contratos detallados: `reference/RULES-RESEARCH.md`, `reference/World-visual-assets.md`, `reference/expansion-CREDITS.md` y `reference/PokeAPI-LICENCE.txt`. Los créditos no afirman una licencia comercial sobre marcas o gráficos originales. El HTML aportado se conserva en `reference/original.html`.
