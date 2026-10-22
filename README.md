# Pokémon Hoja Verde · Compañeros

Adaptación fan en un HTML independiente, basada en el juego HTML aportado por el usuario. No es una reproducción completa de Pokémon Verde Hoja. Sus mapas, eventos, economía, movimientos y progresión tienen adaptaciones propias.

## Jugar

Abrir `dist/index.html` en un navegador moderno. Todos los gráficos y sonidos están integrados; no se cargan imágenes desde servicios externos. En escritorio: WASD o flechas, Z/Enter para interactuar, X/Escape para volver, Shift para correr, M para mapa y P para Pokédex. En móvil hay controles táctiles mantenidos y botones de combate independientes del lienzo.

## Contenido

- Los 151 Pokémon originales con gráficos frontales, dorsales y seguidores animados por dirección.
- Tres iniciales, equipo de seis, PC, captura, PP, eficacia e inmunidades, estados, cambios y experiencia.
- Quince zonas exteriores y sus interiores: Pueblo Paleta, rutas, ciudades, bosque, cueva, Liga y reserva final.
- Ocho gimnasios, cinco combates de Liga, regalos, fósiles, pesca, Surf y Mewtwo.
- Tiendas, curación, objetos, Pokédex, evolución y elección de la rama de Eevee.
- Guardado automático local, copia JSON exportable e importación con validación.

## Adaptaciones

Los movimientos se aprenden automáticamente por tipo y nivel. La curva de experiencia y los encuentros están ajustados para una aventura de navegador. Evoluciones por piedra: nivel 28; por intercambio: nivel 36; Eevee: elección al nivel 25. No hay funciones en línea ni compatibilidad con partidas del HTML Fakemon anterior. La Reserva posterior a la Liga permite encontrar las 151 especies.

## Desarrollo

La publicación con GitHub Actions está preparada en `.github/workflows/pages.yml`: comprueba el motor, construye el juego y publica `dist` en GitHub Pages. Consulta [la guía de publicación](docs/PUBLICAR.md). La activación inicial de Pages se hace en los ajustes del repositorio. Al cambiar de URL, exporta e importa tu partida: los guardados locales no se transfieren automáticamente entre sitios.

La ampliación a salas privadas, historia compartida y combates está descrita en [la propuesta multijugador](docs/MULTIPLAYER.md). Es un diseño para la siguiente versión; el juego actual es individual.

`node build.cjs` genera el HTML final con todos los datos, gráficos y módulos integrados. `node validate.cjs` comprueba 83 condiciones del motor, accesibilidad de mapas, colisiones, guardado y ciclos de combate. El archivo original se conserva en `reference/original.html`.

La comprobación en navegador incluyó selección del inicial, movimiento, seguimiento, transición de zona, batalla con daño y PP, captura, cambio de líder, diálogo del compañero y restauración del guardado. Se comprobó una ventana de 390 píxeles mediante un iframe de prueba: sin desbordamiento horizontal, controles mantenidos funcionales y botones de combate visibles de 48 píxeles de alto. La prueba no equivale a completar una partida natural entera ni a validar cada combinación de movimientos en dispositivos físicos.

## Créditos

Pokémon y gráficos originales © Nintendo, GAME FREAK y The Pokémon Company. Sprites de combate y datos: [PokéAPI](https://github.com/PokeAPI/sprites). Compañeros y personajes: [pokeemerald-expansion](https://github.com/rh-hideout/pokeemerald-expansion), con los créditos originales conservados en `reference/expansion-CREDITS.md`. Estos créditos no afirman una licencia comercial sobre las marcas o gráficos originales. Mapas, interfaz, motor web y música de esta adaptación fueron creados para este proyecto.
