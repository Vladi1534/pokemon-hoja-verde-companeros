# Kanto Compañeros 2.6

- Los encuentros se anticipan con la misma regla de navegación que usa el servidor. La transición empieza en la casilla correcta y bloquea los pasos posteriores hasta confirmarse. Un portal corta el paquete de movimiento; las respuestas antiguas no pueden retroceder el estado aceptado.
- START: Equipo, Mochila, Amigos y Opciones. SELECT: mapa de la zona, mapa de Kanto y diario plegado. Las estadísticas IV/EV quedan bajo una sección desplegable.
- Amigos permanentes asociados a la identidad del guardado: solicitud y aceptación, presencia, invitación directa a mundos privados y salida conservando la partida personal. El código de amigo se comparte una vez. La presencia se consulta cada 12 segundos y caduca a los 35 segundos.
- 19 pistas chiptune y 12 efectos con atribución en `assets/audio/CREDITS.md`. Música contextual y volúmenes separados. El audio empieza tras una interacción y se pausa al ocultar la pestaña. No incluye la grabación oficial de VS Red.
- Salidas alineadas con las calles de las ciudades, entrada norte de Azafrán, cierre de bordes falsos, Ruta 4 rediseñada, señales y recompensas de exploración. Se conservan los 111 mapas y los jardines que requieren Corte.

## Comprobaciones

`npm run build && npm test` construye el mismo motor local que se entrega y verifica combate, guardado, presentación por turnos, predicción de encuentros con respuesta tardía, transiciones, sonido y accesibilidad de mapas. El servidor añade pruebas D1 de amistad, consentimiento, presencia e invitaciones y pruebas HTTP del Worker compilado.

La interfaz sigue usando canvas y JavaScript. React puede introducirse por secciones si el crecimiento de los menús lo justifica; cambiar de biblioteca no resuelve por sí mismo la sincronización ni mejora el arte del juego.
