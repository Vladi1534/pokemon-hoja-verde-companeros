# Multijugador implementado · 2.1 beta

## Sala y progreso

Hasta cuatro entrenadores por sala. La invitación aleatoria incorpora un perfil nuevo; la llave privada recupera el mismo perfil y debe guardarse aparte. Nombres de hasta 16 caracteres, sin correos ni cuentas externas. El grupo comparte el encargo de Oak, el paquete, la entrega y el primer entrenamiento. Cada perfil tiene su inicial, avatar, nivel y reconocimiento. Los miembros que entran después reciben los hitos ya conseguidos, una sola vez.

## Combate

Dos participantes contra dos NPC; con una sola persona se usa un combate individual de menor nivel. El escalado depende de quienes combaten, no de los espectadores. En PvP, ambos aceptan un duelo individual. Un solo combate activo por sala; los otros jugadores pueden observar o caminar. Cada uno elige su movimiento, objetivo o cambio. Sólo el servidor controla los equipos rivales, el azar y la resolución.

Motor `@pkmn/sim@0.10.11`, formato Gen3. p1+p3 humanos y p2+p4 NPC en multi. Rehidratación de snapshot entre solicitudes, conservando PS/PP, estados y decisiones. PP sin PP Ups iniciales. El código compilado debe preservar nombres de clase (`Rolldown output.keepNames`).

Turnos de 90 s: acción automática si alguien no decide en cooperativo; derrota del ausente o empate si ambos faltan en PvP. Tope de 100 turnos. No hay pérdida de objetos ni experiencia por PvP. Los equipos se recuperan antes de cada nuevo combate en esta prueba.

## Transporte y guardado

Cliente estático en GitHub Pages; Worker y D1 en Sites. Consulta HTTP aproximadamente cada 350 ms y movimiento interpolado, con reintentos más lentos si se pierde conexión. WebSocket no está implementado todavía. El cliente envía direcciones con secuencia, no posiciones arbitrarias; el servidor comprueba colisiones, portales y velocidad. Las acciones de sala usan comparación de revisión, reintento y claves idempotentes. No se transfieren partidas individuales al servidor.

La respuesta pública no incluye llaves, snapshot interno ni elecciones ajenas. Cada participante recibe únicamente su propia solicitud de combate. Las llaves se guardan como hash SHA-256 en D1; localmente se conservan para recuperar al entrenador. La invitación y la llave tienen funciones distintas. No hay chat ni listado público de salas.

## Comprobaciones

140 pruebas del juego individual, 22 casos de integración de salas con D1 emulado y una prueba del Worker compilado en workerd. Incluyen concurrencia, reintentos, autorización por perfil, límite de sala, movimiento, objetivos, entrega del paquete, recompensas únicas, espectadores, PvP y vencimiento del turno. Prueba visual en dos clientes independientes y una tercera jugadora a 390 px. El ensayo del paquete compilado detectó y corrigió un error de minificación que no aparecía en desarrollo.

## Pendiente

Ampliar la historia cooperativa hacia Bosque Verde y Brock; completar después el resto de Kanto. Añadir captura, mochila, equipos persistentes con daño entre combates, progresión de movimientos/evoluciones, intercambio y mejor IA. Extender el protocolo a más actividades simultáneas, WebSocket y pruebas de carga antes de anunciar disponibilidad masiva. La beta no reproduce íntegramente la campaña ni todos los sistemas del cartucho original.
