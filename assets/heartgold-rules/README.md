# Auditoría HeartGold — reglas y datos (2.9)

## Resultado que originó la revisión

La reproducción determinista confirma que **Mankey con Espíritu Vital no puede dormir**. El motivo es su habilidad, no su tipo Lucha. Mankey con Irascible sí puede dormir. En HeartGold, **Venusaur y Tangela pueden dormirse con Somnífero** en ambos sentidos. La inmunidad de Planta a movimientos de polvo pertenece a sexta generación y no debe mezclarse accidentalmente con un perfil HeartGold.

El mensaje de combate debería identificar el motivo: «El Espíritu Vital de Mankey impide que se duerma». El código HG original usa precisamente un mensaje de permanecer despierto por una habilidad en `subscript_0018_FallAsleep.s`.

## Entrega

- `hg-rules.json`: 159 especies existentes, los 467 movimientos de HG, 76 habilidades usadas, 100 MT/MO y matriz de 17 tipos. Datos numéricos de especies, movimientos, aprendizaje y crianza extraídos del archivo HG español aportado. La matriz de tipos procede de la tabla decompilada C.
- `ability-descriptions-es.json`: 76 descripciones breves acordes con cuarta generación. La descripción de Robustez conserva la excepción moderna ya solicitada por el usuario.
- `hg-differences.json`: diferencias contra la versión 2.8 del commit `bea04c43bcb9546b02aac7972f1ce6f684016d0a`.
- `audit.json`: comparación contra `@pkmn/sim` 0.10.11 Gen4 y siete reproducciones deterministas.

## Comprobaciones

Las 159 especies coinciden en **todos sus tipos, estadísticas base y habilidades** con el Dex Gen4. Las 289 combinaciones de tipos también coinciden. Se compararon tipo, categoría, potencia, precisión, PP y prioridad de los 467 movimientos.

Hay una diferencia funcional concreta entre el simulador instalado y HG: **Aguante tiene prioridad +3 en HG**, mientras el Dex Gen4 instalado devuelve +4. Debe parchearse a +3 para el perfil nuevo. Otros 32 movimientos usan potencia `1` en la ROM como marcador de daño fijo/variable/KO; el simulador usa `0` y callbacks. Son representaciones equivalentes: **no se deben cambiar sus callbacks a un daño de potencia 1**.

Siete escenarios pasan: Espíritu Vital bloquea sueño; Irascible lo permite; Somnífero duerme a Venusaur y Tangela en los dos sentidos en Gen4; Insomnio bloquea sueño; Venusaur es inmune a polvo en Gen6; Venusaur es inmune a Polvo Veneno por su tipo Veneno en Gen4. Estas comprobaciones no significan que se haya reproducido cada interacción de las 76 habilidades.

## Cambios de datos importantes

- 151 listas de aprendizaje por nivel, 64 listas de huevo y 153 listas de MT/MO difieren respecto a 2.8. Se requieren 91 movimientos nuevos para cubrir todas las listas de estas especies.
- 45 especies ganan una segunda habilidad respecto al **Dex3 efectivo**. Todos los slots preexistentes conservan el mismo significado, por lo que no hace falta cambiar la habilidad de Pokémon guardados. El campo antiguo `frlgAbilities` difiere en 49 especies porque cuatro entradas ya eran incompletas/inconsistentes con el Dex3.
- La metadata visual de Arbok tenía Ataque 95 y debe ser 85; Dugtrio tenía 100 y debe ser 80. El motor Gen3 ya usaba las estadísticas correctas para esa generación.
- Cambian seis rendimientos de experiencia: Abra, Machop, Geodude, Omanyte, Kabuto y Kabutops.
- No hay diferencias en tipos de especies, probabilidades de captura, grupos/curvas de crecimiento, ratios de género ni ciclos base de huevo.

| Movimiento | PP 2.8 | PP HeartGold |
|---|---:|---:|
| Látigo Cepa | 10 | 15 |
| Absorber | 20 | 25 |
| Megaagotar | 10 | 15 |
| Recuperación | 20 | 10 |
| Gigadrenado | 5 | 10 |
| Reserva | 10 | 20 |

El cambio de Gen3 a Gen4 incorpora categorías física/especial por movimiento: Mordisco y Látigo Cepa pasan a físicos, mientras Bola Sombra pasa a especial. Debe mostrarse la categoría real utilizada por el motor, sin derivarla únicamente del tipo.

## Guardados y crianza

Mantener formatos Gen3 para terminar combates antiguos serializados; iniciar los siguientes con el perfil Gen4. No regenerar equipos, géneros, IV, EV, habilidad, nivel ni movimientos ya aprendidos. Al reducir PP máximos, limitar los PP guardados al máximo nuevo, sin recargar automáticamente los que se gastaron. Aplicar aprendizaje HG a niveles futuros; las decisiones pendientes siguen usando IDs válidos.

Aunque la proporción de sexo coincide, la fórmula exacta HG para nuevas criaturas compara `(pid & 255) < genderRatio`, donde los umbrales son 31, 63, 127 y 191. La fórmula antigua `genderRate * 32` difiere por un valor de personalidad de cada 256. Los valores 0, 254 y 255 significan solo macho, solo hembra y sin género.

Los huevos de HG nacen al **nivel 1**, con amistad **120** al eclosionar. La base 2.8 los creaba a nivel 5. Un ciclo de huevo ordinario dura **255 pasos**; fechas especiales lo reducen a 230. Cuerpo Llama o Escudo Magma en el equipo restan dos ciclos en lugar de uno. Estos detalles se verificaron en `src/get_egg.c`; las fechas especiales son un detalle de fidelidad adicional, no necesario para arreglar el combate reportado.

La ROM contiene evoluciones posteriores y comprobaciones de incienso que exceden las 159 especies disponibles. `evolutionRecords` se conserva como referencia; no debe aplicarse sin filtrar las especies soportadas y preservar las adaptaciones de intercambio de la campaña actual. HeartGold no tiene tipo Hada ni habilidades ocultas.

## Procedencia y reproducción

ROM española: código `IPKS`, SHA256 `9e0f7a1a4a18d9015936678722ce081d08b6a5d882fd648e89b624307f8f9e19`. No se reproduce ni distribuye la ROM. `profile.archives` contiene las rutas NitroFS, número de miembros y hashes individuales.

Referencia primaria de estructuras: [pret/pokeheartgold](https://github.com/pret/pokeheartgold), commit `e1d5a4606640e31c44d36714ad0b5cdd9c8763fd`:

- `include/struct_defs/personal_narc_structs.h`
- `include/move.h`
- `src/item.c`, tabla `sTMHMMoves`
- `src/battle/overlay_12_0224E4FC.c`, tabla `sTypeEffectiveness`
- `files/battledata/script/subscript/subscript_0018_FallAsleep.s`
- `src/pokemon.c`, `GetGenderBySpeciesAndPersonality_PreloadedPersonal`
- `src/get_egg.c`, `SetBreedEggStats`, `GetEggCyclesToSubtract`, `Daycare_GetEggCycleLength`

Las etiquetas españolas y slugs usan los CSV PokeAPI ya retenidos en el proyecto; los números de movimientos, efectos y criaturas se leen de HG. Los títulos modernos de algunos movimientos pueden variar respecto a la traducción DS, sin cambiar sus IDs o efecto.

Script de extracción: `../../scripts/hg-reference/extract_hg_rules.py`, solo biblioteca estándar Python. Ejemplo:

```sh
python extract_hg_rules.py --rom supplied-heartgold.zip --current kanto-2.8-baseline.json --decomp pokeheartgold --csv pokeapi-csv --output deliverable
node audit_hg_rules.mjs
```

La extracción no ejecuta código de la ROM. `../../scripts/hg-reference/audit_hg_rules.mjs` usa el simulador instalado en el repositorio compartido para cotejar el resultado. La integración se realiza en `scripts/import-heartgold.cjs`. Instrucciones de reproducción en `scripts/hg-reference/README.md`.
