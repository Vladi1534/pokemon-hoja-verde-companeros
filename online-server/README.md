# Kanto Compañeros · servicio online 2.2

Worker autoritativo para la campaña compartida. El cliente de GitHub Pages y `/play.html` usan el mismo servicio y la misma base D1.

## Ejecutar y verificar

Node 24 y la versión de pnpm indicada en `package.json`. Instala con `pnpm install --frozen-lockfile`. Ejecuta `pnpm test` para las pruebas de criaturas, D1, migración, concurrencia, capturas, intercambios y secuencia de historia. `pnpm build` y `pnpm test:bundle` comprueban la compilación y reanudación del simulador en workerd.

`node scripts/sync-game.mjs <directorio-del-juego>` genera los mapas compartidos, compila el cliente y copia `public/play.html` y `server/world.json`. `pnpm dev` inicia el desarrollo; el entorno administrado usa `sites-preview start`.

D1 requiere el binding `DB` y las migraciones de `drizzle/`. **Conserva `build.rolldownOptions.output.keepNames = true`:** el simulador serializa referencias mediante nombres de clase. La prueba del bundle detecta su rotura durante minificación.

## Estado y concurrencia

Hasta cuatro miembros y un combate activo por sala. `schema:2` almacena posición, equipo, PC, inventario, genética, guardería y progreso. La migración 2.1 lee las posiciones antiguas de `presence`, mantiene llaves y niveles y completa la nueva estructura una sola vez. No importa partidas del modo individual.

Todas las mutaciones, incluido movimiento, actualizan una fila mediante revisión y compare-and-swap. Las acciones tienen identificador idempotente; las direcciones llevan secuencias monotónicas. El servidor comprueba colisiones, accesos, proximidad, equipo, inventario y decisiones. Las llaves privadas se guardan como SHA-256 y nunca se incluyen en snapshots. Cada miembro sólo recibe su propio equipo y solicitud de combate.

Consultas HTTP cada 350 ms e interpolación visual. No hay WebSocket ni pruebas de carga a gran escala. La sala comparte los hitos y las medallas; los recursos y Pokémon pertenecen a cada entrenador.

## Combates

`@pkmn/sim@0.10.11`, Gen3, seis Pokémon como máximo. Una persona: equipo original de nivel del NPC. Dos: p1+p3 humanos contra p2+p4; se duplica el equipo rival y se añade un nivel a cada rival. Es una adaptación de dificultad por participantes, no una mecánica original. Tres/cuatro miembros se turnan o miran; no participan todos simultáneamente en el mismo combate.

PS, PP y estados se conservan en campaña; XP/EV se conceden a participantes conscientes tras resolver el encuentro. El PvP y los guías de práctica usan copias temporales recuperadas, sin recompensas de crecimiento. El turno espera 90 s: decisión automática en cooperativo; derrota del ausente o empate en PvP. Máximo 150 turnos.

Los intercambios necesitan oferta y contraoferta, y después la confirmación del iniciador sobre ambas. Bloquean cambios de equipo durante la propuesta. Capturas y movimientos pendientes se aplican una sola vez.

## Alcance

Campaña adaptada hasta Liga y acceso a crianza en Quarta. Datos versionados en `server/data/kanto.json`: 151 especies de Kanto, ocho especies necesarias para crianza y rama Tyrogue, 354 movimientos y seis curvas de experiencia. Fuentes y diferencias en `docs/FIDELIDAD-FRLG.md` del repositorio principal. No se distribuye una ROM.

El código está duplicado en `online-server/` del repositorio principal para consulta y reproducción; la fuente de Sites conserva el historial de despliegues. `public/play.html` es generado. Se permiten peticiones desde GitHub Pages, el propio Site y la vista previa administrada.
