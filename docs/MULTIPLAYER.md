# Multijugador · 2.2 beta

Hasta cuatro personas comparten historia, medallas y posición en Kanto. Cada persona conserva equipo, capturas, dinero, mochila, PC, decisiones y guardería. La invitación permite un perfil nuevo; la llave privada permite recuperar el mismo. No hay listado público de salas ni chat.

Dos personas pueden desafiar juntas a un NPC: cada una controla su Pokémon y decide movimiento, objetivo o cambio. La oposición incorpora un segundo equipo y un nivel adicional por rival. Quienes no participan pueden mirar o explorar; sólo hay un combate activo por sala. El PvP es individual y requiere aceptación de ambos, sin premios ni pérdida de recursos.

La campaña conserva daño, PP y estados entre encuentros; sólo enfermeras, descanso y objetos recuperan el equipo. La práctica y el PvP usan copias que no modifican el estado anterior. Se pueden capturar Pokémon en encuentros individuales, elegir el líder, depositar en PC, aprender/descartar movimientos, evolucionar, usar piedras, intercambiar y criar en Quarta.

Motor `@pkmn/sim@0.10.11`, reglas Gen3. El servidor guarda el simulador en cada transición. Turnos de 90 segundos y límite de 150. La falta de decisión produce acción automática en cooperativo; derrota del ausente o empate en PvP.

El cliente consulta por HTTP cada 350 ms y suaviza las posiciones. El servidor valida secuencias de pasos, colisiones, portales, objetos, proximidad y decisiones. Las revisiones con compare-and-swap evitan perder acciones simultáneas. Los identificadores de acción evitan recompensas duplicadas al reintentar. Los snapshots públicos omiten secretos y los equipos/elecciones privados de los demás.

Las salas 2.1 migran de forma automática conservando perfiles, llaves, posición y niveles. Recarga el cliente al actualizar para usar el nuevo catálogo de mapas y los controles de campaña. El guardado individual sigue siendo independiente.

La secuencia de historia, migración y combates tienen pruebas automatizadas con D1 local y workerd. El recorrido automático usa equipos de prueba de nivel 100: valida eventos y funcionamiento, no dificultad. Faltan una campaña natural de varias horas, pruebas de desconexión de larga duración y carga con muchas salas. Consulta [fidelidad](FIDELIDAD-FRLG.md) para sistemas todavía incompletos.

## Exploración y revanchas 2.3

`explore {object}` sólo actúa desde una casilla vecina en el mapa persistido por el servidor. Los bloqueos requieren permisos de historia/medalla y abren el paso compartido. Los objetos se registran en `member.rewards`; `trainer.collected` comunica los recogidos del mapa actual. Repetir la solicitud no duplica recompensas.

Los entrenadores comunes usan `progress.wins_<npc>` con máximo tres victorias por sala. Los desafíos de historia conservan su marca única. Los guardados previos con marca de victoria y sin contador arrancan en una. La revisión de mundo 3 migra las posiciones antiguas una sola vez y cancela propuestas pendientes, preservando equipos, combates activos, historia e inventarios.
