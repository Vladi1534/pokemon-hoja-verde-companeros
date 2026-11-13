# Original NPC sheets

`sprites.json` stores the original PNG bytes as base64, keyed by the filenames in `manifest.json`. No pixels, palette transparency or frame geometry are changed. The runtime embeds this pack directly; unpacked PNGs are optional and ignored.

Regenerate both files with `node scripts/import-native-npcs.cjs /path/to/pret/pokefirered`. The manifest pins the source commit and original paths.
