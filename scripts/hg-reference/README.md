# Lectura de recursos HG como datos

Los scripts no descargan ni ejecutan un juego. Requieren un archivo proporcionado por quien realiza la extracción. La compilación habitual usa las tablas y modelos ya versionados y no necesita una ROM.

Reglas:

```sh
python scripts/hg-reference/extract_hg_rules.py --rom supplied-heartgold.zip --current kanto-2.8-baseline.json --decomp pokeheartgold --csv pokeapi-csv --output hg-work/rules
node scripts/hg-reference/audit_hg_rules.mjs hg-work/rules/hg-rules.json kanto-2.8-baseline.json hg-work/audit.json
```

La referencia base 2.8 puede obtenerse del commit `bea04c43bcb9546b02aac7972f1ce6f684016d0a`, archivo `online-server/server/data/kanto.json`. El auditor registra la discrepancia de Aguante del simulador sin parchear; el juego la corrige en `ability-rules.mjs`.

Modelos y colisiones (Pillow y Apicula compilado):

```sh
export HG_ROM=/absolute/path/heartgold.nds
export HG_WORK_DIR=/absolute/path/hg-work
export HG_DECOMP=/absolute/path/pokeheartgold
export APICULA_BIN=/absolute/path/apicula
python scripts/hg-reference/build_assets.py
python scripts/hg-reference/extract_anchors.py
python scripts/hg-reference/extract_museum_collision.py
```

Usar las revisiones documentadas en `assets/heartgold-models/README.md`. `nitro.py` solo lee las tablas de archivos y contenedores NARC. La conversión conserva geometría, texturas y coordenadas nativas; `scripts/heartgold-museum.cjs` adapta los eventos y colisiones al juego compartido.
