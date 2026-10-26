# 2.4 · La misma aventura en solitario y con amigos

Se elimina la separación funcional entre dos motores y dos entrenadores. El navegador ejecuta los módulos de campaña/combate del servidor mediante un bundle local. La clave privada y el identificador de entrenador permanecen estables al viajar; se conservan UID, OT, genética, movimientos, PP, mochila, PC, guardería y progreso.

`host` importa una partida validada y crea un código de ocho caracteres; repetir su identificador de solicitud recupera la misma sala. `join` incorpora la partida propia sin heredar los hitos del anfitrión. `depart` confirma el estado final antes de pasar al motor local. Las solicitudes de conexión/salida pendientes se conservan para reintentarlas tras una respuesta perdida. Salir invalida las mutaciones de esa visita anterior. El cierre del anfitrión permite que los invitados recuperen su última copia.

El progreso narrativo es personal. Los bloqueos físicos despejados pertenecen al mundo. Las salas antiguas conservan el progreso compartido ya obtenido cuando adoptan este modelo. Los encuentros personales se almacenan por combate y sus participantes: otro entrenador puede entrar en hierba y combatir mientras un amigo lucha. Las propuestas de regalo/intercambio son concretas, caducan y sólo mueven recursos tras aceptación dentro de la transacción CAS.

La interfaz indica el modo y papel del jugador, separa equipo y compañeros, muestra hábitat/repelente y ofrece entrada/salida desde el panel. Los combates individuales de escritorio usan posiciones diagonales, sprites grandes, cuatro movimientos en una fila cuando hay espacio y variantes para móvil. El modo local conserva combates sin temporizador y guarda su simulador completo.

Referencia visual y social: Pokémon Revolution Online. No se incorpora código de su motor ni se afirma compatibilidad con sus cuentas/servidores. El proyecto mantiene mundos privados y partida local, no una economía MMO.

## Verificación

- Motor previo: 150 comprobaciones de regresión y navegación.
- Servicio: campaña, reglas, D1, migración, captura, intercambios y recorrido automático de historia.
- Integración personal: identidad/validación, ejecución real del bundle sin fetch, reanudación de batalla, códigos, regalos aceptados/rechazados, aislamiento narrativo, combates paralelos, encuentros antes de Oak, salida, cambio de anfitrión y rechazo de sesiones terminadas.
- Paquete Worker: se valida tras compilar con workerd y D1 local.
- Navegador: partida nueva, importación, combate, consumo de PP, guardar/recargar y controles de modo; interfaz móvil en iframe de 390 px sin desbordamiento horizontal. La prueba del bundle ejecuta otro turno después de recargar el simulador. La revisión de una partida de prueba no equivale a completar la campaña naturalmente.

## Límites pendientes

Máximo cuatro jugadores presentes y dos por combate cooperativo. El escalado depende de los combatientes, no de espectadores. Faltan prueba de carga, campaña natural entre dispositivos, chat, intercambio global, contenido completo de FRLG y habilidades ocultas. Los perfiles locales no son una frontera contra trucos: CAS evita duplicar una misma operación, pero un archivo offline puede editarse o restaurarse manualmente.
