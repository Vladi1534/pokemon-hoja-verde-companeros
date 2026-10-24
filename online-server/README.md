# Kanto Compañeros · servicio online 2.1

Servidor autoritativo de la beta cooperativa. GitHub Pages sirve el juego y este Worker coordina salas, decisiones de combate y progreso en D1. No usa Supabase ni conexiones del usuario a otras aplicaciones.

## Reproducir

- Node 24, pnpm (versión indicada en package.json).
- Instalar dependencias con `pnpm install --frozen-lockfile`.
- `pnpm test`: integración con D1 emulado (22 casos).
- `pnpm build`; `pnpm test:bundle`: motor compilado en workerd, rehidratación entre solicitudes.
- Activar el binding D1 `DB`. Las migraciones están en `drizzle/` y se aplican durante la publicación Sites.
- `node scripts/sync-game.mjs <carpeta-del-juego>` copia el cliente compilado y la geometría compartida desde el repositorio principal.
- `pnpm dev` para desarrollo. En la sesión administrada se usa `sites-preview start`.

La configuración Rolldown `output.keepNames = true` es obligatoria: Showdown serializa referencias usando los nombres de clase. La prueba del bundle detecta regresiones que no aparecen al ejecutar el código fuente sin minificar.

## Modelo y límites

Las salas tienen hasta cuatro entrenadores. Una invitación aleatoria permite incorporar un entrenador; otra llave privada independiente recupera un perfil. En la base sólo se almacena su SHA-256. No se reciben correos ni contraseñas. No existe listado público de salas. El cliente guarda sus llaves en este navegador y puede copiarlas desde «Mi entrenador».

Las decisiones cambian una fila de sala mediante compare-and-swap de revisión; las solicitudes llevan identificadores idempotentes. Sólo el servidor crea equipos, valida acciones y otorga hitos. Las posiciones utilizan secuencias monotónicas, colisiones compartidas, límite de pasos y transición de mapas validada. El cliente interpola a los compañeros. Transporte inicial: consultas HTTP cada 350 ms, con reintentos al reconectar; todavía no utiliza WebSocket.

El motor es `@pkmn/sim@0.10.11` (Pokémon Showdown, MIT), en Gen3. Cooperativo: p1+p3 humanos, p2+p4 NPC. PvP: p1 contra p2. Los espectadores reciben sólo el estado público; nunca se publica el snapshot del simulador ni las solicitudes privadas ajenas. Los PS/PP y decisiones pendientes se serializan en cada transición. Límite de turno: 90 s. En cooperativo se elige una acción automática; en PvP pierde el ausente o empatan si faltan ambos. Límite de combate: 100 turnos.

Los equipos de esta beta son un inicial Nv.8 y Pidgey Nv.7, preparados para probar el motor. Se curan antes de cada combate. La entrega de Oak añade un nivel una sola vez; el entrenamiento añade un reconocimiento de la sala una sola vez, incluso a espectadores y miembros que se incorporan después. No son medallas de gimnasio. Aún no hay captura, mochila, intercambio, crianza o campaña completa online. Las partidas de la aventura individual son independientes.

El código y las licencias se conservan en GitHub bajo `online-server/`; el repositorio de origen de Sites conserva las versiones desplegadas. `public/play.html` es una copia generada para acceder también desde el servidor. La API permite la procedencia de GitHub Pages, el propio Site y la vista previa local; otras procedencias se rechazan.
