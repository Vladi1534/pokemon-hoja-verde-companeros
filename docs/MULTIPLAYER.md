# Compañeros online: propuesta de implementación

Estado: diseño para la siguiente versión. El juego entregado continúa siendo individual; no hay salas, servidor, cuentas ni combates online implementados.

## Experiencia recomendada

Empezar con salas privadas de 2–4 jugadores, accesibles por enlace o código de invitación. Cada persona elige un nombre y un inicial, conserva su equipo y ve a los otros entrenadores junto a sus Pokémon líderes. El anfitrión crea una campaña compartida. Cualquier miembro puede regresar a esa campaña aunque el anfitrión esté desconectado.

La campaña online se guarda por separado. La aventura individual actual sigue funcionando sin conexión. Para la primera versión, las campañas online empiezan de cero: no importan equipos locales que el servidor no pueda verificar.

| Elemento | Regla propuesta |
| --- | --- |
| Historia, medallas y puertas | Avance de la campaña compartido y persistente; cada hito se concede una sola vez. |
| Equipo, capturas, mochila, dinero y Pokédex | Propios de cada jugador dentro de esa campaña. |
| Objetos del mapa y regalos | Una reclamación por jugador; la historia compartida no consume el regalo de los demás. |
| Pokémon acompañante | La primera criatura disponible de cada equipo; cambios visibles para la sala. |
| Mapas | Se puede explorar por separado; solo se dibujan jugadores presentes en el mismo mapa. |
| Entrenadores y gimnasios | Encuentro cooperativo por invitación; los participantes confirman antes de empezar. |
| Combate cooperativo inicial | Dos entrenadores activos, un Pokémon por entrenador, contra un encuentro adaptado. Los otros miembros pueden observar. |
| Combates entre amigos | Desafío 1 contra 1 con aceptación mutua, sin apuestas ni pérdida permanente de criaturas u objetos; restaurar el equipo al terminar. |
| Desconexión | Reconexión al último estado confirmado. En combate, ventana de 60 segundos; después, sustitución por IA en cooperativo o abandono en duelo. |

Los parámetros anteriores son decisiones propuestas para mantener manejable la primera versión; no son capacidades ya disponibles. Un modo de cuatro entrenadores activos en un mismo combate requiere rediseñar turnos, objetivos, interfaz y equilibrio.

## Arquitectura recomendada

**GitHub Pages** sirve el juego y los gráficos. Es alojamiento estático: no ejecuta el servidor que arbitra una partida.

**Un proyecto independiente de Supabase** puede aportar autenticación, base de datos, Presence para saber quién está conectado y Broadcast para movimientos y eventos. El estado duradero se guarda en Postgres; los mensajes de Realtime no sustituyen un guardado. Las salas usan canales privados y políticas vinculadas a sus miembros. No hace falta reutilizar los datos ni las credenciales de otros proyectos.

**Funciones de servidor** reciben comandos de combate e historia. Un resolutor puro calcula los resultados; una transacción con versión esperada guarda cada cambio y notifica a los clientes. El navegador solicita una acción y anima el resultado confirmado. No envía una victoria, una captura, dinero ni PS como si fueran hechos confiables.

La posición puede enviarse aproximadamente a 8–10 actualizaciones por segundo durante el movimiento, con interpolación local y números de secuencia para descartar paquetes antiguos. Es información visual: no debe conceder acceso a contenido, recompensas ni saltarse controles de combate. El servidor valida ubicación y requisitos cuando se interactúa con un evento importante. No se escribe cada fotograma en la base de datos.

## Datos y contratos

| Recurso | Contenido principal |
| --- | --- |
| `campaigns` | ID, creador, versión de reglas, hitos compartidos, revisión y fecha de guardado. |
| `campaign_members` | Campaña, usuario, rol y estado de pertenencia. |
| `player_saves` | Campaña + usuario, equipo, PC, mochila, dinero, Pokédex, posición válida y revisión. |
| `invites` | Campaña, hash del código, vencimiento, usos disponibles; acceso validado en servidor. |
| `battles` | Participantes, modo, turno, estado, revisión y estado aleatorio del servidor. |
| `battle_commands` | ID único de petición, usuario, turno y acción; evita procesar una petición dos veces. |
| `reward_claims` | Evento + usuario únicos para evitar premios duplicados al reconectar. |

Operaciones iniciales: `create_campaign`, `create_invite`, `join_campaign`, `get_snapshot`, `request_battle`, `accept_battle`, `submit_action`, `claim_event` y `leave_campaign`.

Cada comando autenticado lleva un identificador único y la revisión esperada. El servidor verifica pertenencia, turno, movimiento, PP, inventario y requisitos. Al detectar un conflicto devuelve el estado actualizado. Un enlace de invitación solo permite solicitar entrada; no concede permisos de administración. Limitar intentos de código y caducar invitaciones. Las claves administrativas permanecen en el servidor.

## Cambios concretos en el código actual

- `mechanics.js`: extraer reglas sin dependencias del DOM e inyectar un generador aleatorio. Usar el mismo catálogo y versión de reglas en cliente y servidor.
- `battle.js`: separar resolución y animación. Ahora modifica directamente `Game.party`, premios y banderas; en online debe representar eventos confirmados por el servidor. El resolutor cooperativo deberá soportar varios objetivos y acciones simultáneas por ronda.
- `game.js`: distinguir avance personal de hitos de campaña, introducir un adaptador de persistencia y emitir eventos de movimiento, entrada de mapa y cambio de líder. Mantener la clave de guardado individual actual.
- `renderer.js`: dibujar entrenadores y seguidores remotos con interpolación, ordenados por altura; no bloquear el camino con cuerpos remotos.
- `ui.js`: selector Solo / Online, creación y unión a sala, lista de participantes, invitaciones a combate, estado de reconexión y resumen del guardado compartido.
- `input.js`: reutilizar controles; impedir comandos adicionales mientras un turno confirmado esté pendiente.

## Orden de entrega y criterio de terminado

1. **Publicación:** repositorio, despliegue y URL comprobados. La partida individual puede exportarse e importarse al cambiar de dirección.
2. **Sala y exploración:** dos navegadores distintos se unen mediante invitación y ven movimiento, mapa y cambio de líder. Una tercera persona sin acceso no obtiene el guardado. Se recupera la conexión sin duplicar jugadores.
3. **Persistencia e historia:** equipos personales y avance compartido sobreviven al cierre de ambos navegadores. Reclamar el mismo evento dos veces no duplica objetos. El anfitrión no necesita permanecer conectado.
4. **Duelo entre amigos:** ambos reciben el mismo estado de combate, un comando repetido no consume dos turnos y desconectarse no corrompe el equipo.
5. **Historia cooperativa:** dos entrenadores completan un gimnasio, la campaña recibe una sola medalla y las recompensas personales se aplican una sola vez. Un tercer miembro observa y recibe la actualización compartida al reconectar.

Antes de subir la capacidad por encima de cuatro personas, medir latencia, mensajes, carga y consumo del servicio en una sesión real. No se promete un coste fijo ni gratuidad permanente del servicio online; el límite de sala y la frecuencia de envío permiten ajustar el consumo.

## Referencias oficiales

- [GitHub Pages: archivos estáticos y límites de servidor](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Supabase Realtime: Broadcast, Presence y cambios de Postgres](https://supabase.com/docs/guides/realtime)
- [Autorización de canales privados](https://supabase.com/docs/guides/realtime/authorization)

La elección de arquitectura, las reglas de campaña y las etapas son propuestas para este juego, no funciones que las plataformas proporcionen automáticamente.
