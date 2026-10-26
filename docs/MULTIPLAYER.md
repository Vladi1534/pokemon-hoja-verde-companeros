# Multijugador · 2.4

La partida personal usa el mismo motor en navegador y Worker. Cada entrenador lleva identidad, equipo/PC, mochila, dinero, capturas, guardería, medallas e historia. Los caminos físicos despejados pertenecen al mundo. Un invitado aparece en Paleta con su perfil; un entrenador nuevo no hereda progreso del anfitrión.

`host {portable,key,requestId}` abre el mundo. El código de invitación tiene ocho caracteres; la llave privada de 36 caracteres autoriza sólo al propietario del entrenador. `join {portable,key,invite}` importa el perfil o recupera una visita existente. `checkpoint` obtiene la copia propia. `depart` confirma la salida y devuelve el perfil final; el cliente guarda antes de continuar localmente. Los invitados detectan el cierre del anfitrión y realizan su propia salida.

Hasta cuatro jugadores activos por mundo; los que se retiraron no ocupan una plaza. Los combates se indexan por ID y propietarios. Cada entrenador puede combatir de forma independiente; un encuentro cooperativo incorpora dos propietarios y un segundo equipo rival con un nivel adicional. PvP y práctica conservan el equipo anterior y no otorgan recompensas de crecimiento.

Las acciones de campaña usan `member.progress` en salas personales. Sólo los participantes elegibles reciben progreso y recompensas. Los espectadores no reciben medallas. Los entrenadores comunes admiten tres victorias por persona; los jefes conservan su marca única. Los hitos previos compartidos de salas 2.1–2.3 se copian al adoptar el modelo personal.

`propose {kind:'gift',other,item,qty}` o `{mon}` genera una oferta concreta. El destinatario revisa, acepta o rechaza; no se descuenta al proponer. La aceptación revalida propiedad, proximidad, inventario y espacio, y transfiere una sola vez. Intercambiar requiere oferta, contraoferta y confirmación final de ambos Pokémon. Un entrenador conserva al menos un Pokémon capaz de combatir al regalar.

El servidor usa D1 con revisión compare-and-swap para movimientos, decisiones y transferencias. Los IDs de solicitud evitan duplicados por reintento. Las claves se almacenan como SHA-256. Las respuestas sólo contienen el equipo y copia portable del propio entrenador. El cliente consulta cada 350 ms y suaviza posiciones; no usa WebSocket.

Los turnos online tienen 90 s y los combates un máximo de 150 turnos. La falta de decisión produce acción automática en cooperativo; derrota del ausente o empate en PvP. El motor local no tiene temporizador y puede reanudar su simulador tras recargar.

El cliente persiste la operación antes de conectarse o salir. Una respuesta perdida deja visible «conexión pendiente» y bloquea cambios locales hasta reintentar. Una visita terminada no admite nuevas mutaciones. Una copia exportada mientras sigues online reanuda esa visita; para llevar una partida desconectada, termina primero con «Guardar y seguir solo».

No hay cuentas, chat, listado público, economía protegida contra trucos ni sincronización automática entre navegadores. Un archivo local es editable y no demuestra integridad competitiva. Las pruebas cubren transacciones D1 locales y el paquete Worker; falta una campaña natural prolongada y carga con muchas salas.
