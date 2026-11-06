# Compañeros 2.8.0 — HeartGold, inmersión y combates reales

La campaña de Kanto y los guardados de la versión anterior se conservan. Esta edición renueva la presentación y corrige las consecuencias de los combates opcionales.

## Cambios

- Mochila con cinco bolsillos, selección, descripción, seis objetos por página y navegación. Usa iconos y bolsas 2D originales de HeartGold extraídos del archivo aportado. Los objetos clave y las MO ya obtenidas aparecen sin duplicar sus recompensas.
- Menú START, equipo y tarjeta de entrenador dentro de la pantalla, también en escritorio. SELECT mantiene el mapa. El objetivo actual se despliega bajo la ubicación; desaparecen el panel lateral y la tarjeta exterior de objetivos. Carcasa móvil azul con botones grises.
- Los NPC miran al entrenador durante el diálogo y vuelven a su orientación anterior al terminar. Los personajes de conversación miran alrededor en reposo. La dirección de los entrenadores que detectan al jugador sigue sincronizada con el servidor.
- Ash en Ruta 1 es un encuentro voluntario de campaña: concede experiencia, EV y dinero, conserva el gasto de PP y las heridas; una derrota completa devuelve al último Centro. Permite una victoria inicial y dos revanchas con premio reducido. Las prácticas antiguas contra Ash no consumen este límite.
- Robustez conserva su inmunidad a KO directo e incorpora la resistencia moderna a 1 PS desde vida completa. No protege un Pokémon ya herido, los golpes siguientes de un movimiento múltiple ni el daño residual. Las otras reglas siguen siendo de tercera generación; Geodude también puede tener Cabeza Roca.
- Las fichas incluyen descripciones de las 55 habilidades disponibles. Sus activaciones se presentan en el registro del combate. Fuga permite escapar de un rival salvaje que atrapa.
- La reproducción de los turnos utiliza los PS exactos del propio entrenador. Las pociones muestran primero la curación y después la respuesta del rival; consumen un objeto y un turno.
- 33 pistas musicales y 33 efectos originales de HeartGold, expuestos mediante 37 escenas y 35 familias. Temas propios de las ciudades de Kanto, rutas, interiores, salvajes, entrenadores, Rocket, líderes y campeón. Introducciones y puntos de bucle conservados; cambios suaves y efectos sucesivos sin superposición. La descarga inicial incluye la música para jugar sin conexión.

## Verificación

- Suite frontend: 150 comprobaciones de datos y reglas, motor compilado sin red, guardados, movimiento, sincronización, comandos de combate, 318 sprites y accesibilidad de 112 mapas.
- Once regresiones nuevas de habilidades, curación y Ash; comprobaciones de mirada de NPC, transición de mapas y elegibilidad de objetos.
- Auditoría de todas las habilidades asignadas a las 159 especies disponibles; casos de Robustez, Levitación, Absorbe Agua, Absorbe Elec, Intimidación, Presión y Fuga.
- Suites del servicio: identidad portátil, consentimiento, amigos, regalos, PvP, combate cooperativo, recuperación tras derrota y persistencia. Recorrido offline de 29 encuentros obligatorios hasta las ocho medallas, Alto Mando y campeón, con recarga de guardados. Ese recorrido usa equipos de prueba de nivel 100 y comprueba progresión, no equilibrio.
- Navegador de escritorio y pantallas 390×844, 360×640 y 844×390. Mochila completa dentro de la pantalla; diálogo de Dalia mirando al entrenador; objetivo desplegable; tarjeta; victoria de Ash con experiencia; Robustez dejando 1 PS y uso de poción con consumo de turno e inventario.
- Recursos de audio: hashes, duración y bucles validados; cero muestras saturadas durante el render. Procedencia y procesos reproducibles en `assets/audio/` y `assets/heartgold-ui/`.

## Alcance

La interfaz toma HeartGold como referencia y usa recursos seleccionados del archivo aportado. El mundo continúa siendo la adaptación existente de Kanto, no una reproducción completa del motor 3D, mapas o scripts de HeartGold. No se incluye la ROM. Se mantienen 159 especies y el sistema de guardado anterior. La ampliación de Robustez es una regla deliberada de esta edición, posterior a HeartGold.

Créditos: [audio](assets/audio/CREDITS.md), [gráficos HG](HG-UI-CREDITS.md), [sprites de combate](BATTLE-SPRITES-CREDITS.md).
