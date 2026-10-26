# Referencia de Verde Hoja y alcance de la adaptación 2.4

Se consultan datos y eventos de la descompilación pública [pret/pokefirered](https://github.com/pret/pokefirered), datos de [PokéAPI](https://github.com/PokeAPI/pokeapi) y el motor MIT [pkmn/sim](https://github.com/pkmn/ps). La copia española aportada por el usuario se analizó como datos para contrastar cabeceras y dimensiones de tres mapas; no se ejecuta ni se incluye en el repositorio o despliegue. La disponibilidad pública de una descompilación no concede automáticamente una licencia para redistribuir todo su contenido. Los textos y la geometría de esta aplicación son propios; los avisos de sprites y dependencias se conservan en `reference/` y `online-server/licenses/`.

## Implementado en el motor unificado (solitario y online)

| Sistema | Estado |
| --- | --- |
| Campaña | Secuencia adaptada de Paleta a Liga; ocho medallas y desbloqueo de Nacional, Rubí y Quarta. Progreso personal. |
| Mundo | 111 mapas/interiores conectados, salidas validadas, atlas, mapa local y diario. Geometría propia. |
| Encuentros | Tablas de especies, intervalos de nivel y pesos de 33 zonas de LeafGreen; tasa de aparición por paso simplificada. |
| Equipo | Seis Pokémon, PC de 180, captura, curación, PS/PP/estado persistentes, líder visible. |
| Reglas | Simulador Gen3; categoría física/especial por tipo, turnos de carga, habilidades normales. Las ocultas aún no existían en FRLG. |
| Genética | IV 0–31, EV 255 por stat/510 totales, fórmula por nivel, 25 naturalezas y seis curvas de XP. |
| Aprendizaje | Tabla de nivel de FRLG; cuatro movimientos; elección explícita para olvidar o rechazar. |
| Evolución | Nivel/amistad con confirmación; piedras e intercambio; conserva identidad, IV/EV y slot de habilidad. |
| Crianza | Ruta 5 aloja uno y no produce huevos. Quarta aloja dos tras su desbloqueo. Compatibilidad 20/50/70%, grupos huevo/Ditto, nivel 5, herencia de movimientos y tres IV. |
| Cooperativo | Hasta cuatro personas presentes; dos por combate contra NPC. Historia personal, combates compartidos, regalos y viajes con el mismo equipo. PvP e intercambio. |

## Diferencias y pendientes concretos

- No son los mapas originales casilla por casilla. Torre, Silph, Mansión y otras mazmorras tienen menos plantas, entrenadores y puzles simplificados. Faltan varias rutas e interiores específicos; las conexiones representan recorridos más amplios.
- Faltan la historia completa de Archi7 (incluido Zafiro), misiones de legendarios/Cueva Celeste, plantillas avanzadas de revancha de Liga y otras actividades secundarias. Los fósiles de Moon sí se restauran; Ámbar Viejo/Aerodactyl aún no tienen evento de entrega.
- La Zona Safari usa captura normal. Las tablas de pesca están conservadas como datos, pero todavía no hay cañas ni minijuego de pesca. No todas las especies tienen actualmente una vía de obtención.
- Las MO son permisos de historia más medalla; no se exige llevar un Pokémon que conozca el movimiento. Vuelo se registra, pero no hay viaje rápido. Faltan enseñanza de MT/MO, objetos equipados, recordador y efectos de habilidad fuera de combate.
- No hay objetos equipados de crianza, sincronización de la naturaleza ni métodos modernos (Lazo Destino/Masuda). La herencia garantiza tres IV distintos como corrección deliberada del error de selección de FRLG, que puede sobrescribir una de las tres selecciones. El contador de eclosión está simplificado a ciclos ×256 pasos.
- La XP/EV se aplica al resolver el encuentro, en vez de mostrar el crecimiento tras cada rival debilitado. Se incluye el bono de Pokémon intercambiado. No están implementados la desobediencia por medallas ni todos los bonos de estadísticas del entrenador original.
- Los refuerzos en dobles (segundo equipo y +1 nivel) y las recompensas para ambos entrenadores son reglas propias. El escalado depende de quienes combaten, no de los espectadores. Falta ajuste con una campaña natural.
- Tres/cuatro jugadores pueden recorrer la misma sala, pero sólo dos combaten juntos. Encuentros independientes por entrenador; transporte HTTP con interpolación, sin WebSocket ni ensayo de carga masiva.
- La partida personal 2.4 usa el motor Gen3 del servidor también en el navegador. La edición individual anterior conserva sus archivos para migración y respaldo; sus habilidades ocultas no forman parte del motor nuevo.

## Fuentes concretas y datos versionados

- `pret/pokefirered`: `src/data/pokemon/species_info.h`, `level_up_learnsets.h`, `egg_moves.h`, `tmhm_learnsets.h`, `src/data/trainer_parties.h`, `src/daycare.c`, `src/pokemon.c`, `src/battle_script_commands.c`, `src/data/wild_encounters.json` y scripts de mapas. Se verifican hechos mecánicos y dependencias; no se copian diálogos completos.
- `online-server/server/data/kanto.json`: instantánea derivada con 159 especies (151 Kanto + Pichu/Cleffa/Igglybuff/Tyrogue/Hitmontop/Smoochum/Elekid/Magby), 354 movimientos y curvas de XP. Las reglas de combate se delegan en `@pkmn/sim@0.10.11`.
- `campaign-encounters.json`: selección de las tablas de LeafGreen; cada zona incluye `sourceMap` para contrastarla. El generador `scripts/build-campaign.cjs` integra esos datos con la geometría propia.
- Los tests de `online-server/tests/` distinguen reglas, integración con D1, recorrido de historia y ejecución del paquete compilado. Los equipos de nivel 100 del recorrido son fixtures; no certifican balance ni una campaña completa a mano.

## Referencia aportada para 2.3

El archivo aportado identifica Pokémon LeafGreen español, código `BPGS`, revisión 0, 16 MiB; SHA-256 `f8908e0bd32cf27077a26b557e1eea0ff06ce8059bee5dc7d799aab44a070d48`. La inspección de metadatos contrastó Carmín (48×40), exterior del S. S. Anne (70×32) y cocina (16×14). No equivale a validar cada evento ni la integridad completa del cartucho. La ROM no forma parte de los artefactos publicados.

Las conexiones del barco se contrastaron con `data/maps/SSAnne_1F_Corridor/map.json`, `SSAnne_2F_Corridor/map.json`, `SSAnne_Exterior/map.json`, `SSAnne_Kitchen/map.json` y scripts de descanso/capitán en [pret/pokefirered](https://github.com/pret/pokefirered). El original dispone de 26 mapas para el barco; esta adaptación utiliza seis interiores. Faltan aún muchos camarotes, la partida definitiva del barco y recompensas originales como el vale de bicicleta. Los nuevos textos, muebles y geometría son propios.
