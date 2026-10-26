# Kanto Compañeros · motor compartido y servicio online 2.4

Los módulos de `server/` se ejecutan en Cloudflare Workers con D1 y en navegador con `browser/local-engine.mjs`. El bundle `public/personal-engine.js` permite jugar solo sin peticiones al servidor. `/play.html` y GitHub Pages son el mismo cliente.

## Verificar y compilar

Node 24 y pnpm según `package.json`; `pnpm install --frozen-lockfile`. `pnpm test` ejecuta las pruebas de criaturas, D1, migración, concurrencia, historia y partida portable. `pnpm build` y `pnpm test:bundle` validan el paquete Worker con workerd.

`node scripts/sync-game.mjs <directorio-del-juego>` sincroniza geometría, recompila el motor del navegador y copia el cliente y su service worker. `node scripts/build-personal.mjs [salida.js]` reconstruye sólo el bundle con el esbuild de Vite instalado.

El binding D1 es `DB`; migraciones en `drizzle/`. Conserva `build.rolldownOptions.output.keepNames = true`: el simulador serializa referencias por nombre de clase.

## Estado personal y mundos

Hasta cuatro jugadores activos. Cada perfil tiene historia, medallas, recursos, equipo y guardería propios. `sharedGates` guarda caminos físicos despejados del mundo. `portable.mjs` valida un formato acotado y conserva identidad de entrenador y Pokémon, OT, genética, PP y progreso. Las salas anteriores adoptan historias personales copiando sólo el progreso compartido que ya habían obtenido.

`host` importa el perfil y devuelve un código de ocho caracteres. `join` recibe el perfil propio y aparece en Paleta, sin heredar hitos ajenos. `checkpoint` devuelve la copia propia; `depart` confirma el estado final e invalida nuevas mutaciones de esa visita. Si el anfitrión sale, cierra el mundo y los invitados guardan su propio avance.

Los encuentros se indexan por ID y participantes; puede haber combates independientes simultáneos. En cooperativo dos humanos se enfrentan a dos equipos rivales (+1 nivel). Los demás pueden explorar, combatir por su cuenta u observar. PvP/práctica usan copias y no modifican recursos ni crecimiento del equipo. El online tiene plazo de 90 s por turno; el modo local guarda su simulador sin temporizador.

Las acciones usan revisión CAS y un ID de solicitud. Regalos e intercambios se transfieren sólo con aceptación y validación final, dentro de la misma operación. Las llaves se almacenan como SHA-256 y no aparecen en snapshots. Cada jugador recibe sólo su propio equipo detallado/copia portable.

Transporte HTTP cada 350 ms con interpolación, sin WebSocket. No hay cuentas, chat, prueba de carga masiva ni economía protegida contra guardados editados. Los tests con equipos de alto nivel validan eventos y serialización, no balance natural de la campaña. Referencia de UX: PRO; motor de combate reutilizado bajo MIT: `@pkmn/sim@0.10.11`, Gen3. No se distribuye una ROM ni código del motor de PRO.
