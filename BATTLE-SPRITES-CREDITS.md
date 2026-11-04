# Battle sprites — release 2.7

318 original, unmodified PNG files: front and back for the 159 species currently supported by the project (1–151, 172, 173, 174, 236–240).

Source: [PokéAPI/sprites](https://github.com/PokeAPI/sprites), `sprites/pokemon/versions/generation-v/black-white/`, downloaded 2026-11-04. Exact source URLs and SHA-256 hashes are recorded in `manifest.json`.

All image contents are copyright The Pokémon Company. The source repository is distributed under CC0 1.0 Universal; this repository declaration does not transfer ownership of the underlying Pokémon artwork or trademarks. Its complete notice is preserved in `references/PokeAPI-LICENCE.txt`.

No ROM was downloaded. These are public sprite resources already distributed by PokéAPI. The artwork has not been regenerated, repainted, cropped, or enlarged. All PNGs remain 96 × 96 with transparency. Render using nearest-neighbor scaling (`image-rendering: pixelated`) to retain clean pixel edges.

`battle-sprites.js` is an optional transport bundle containing the same unmodified PNG bytes as data URLs plus their nontransparent bounds. It avoids 318 separate runtime image requests and makes the battle art available offline.

## Layout references

Primary reference: [pret/pokefirered — layouts.json](https://github.com/pret/pokefirered/blob/master/data/layouts/layouts.json), the publicly available decompilation's map definitions. Reference JSON snapshots are in `references/`. These are reference data, not a downloaded executable game.

- Player's house 1F: 13 × 10 tiles.
- Player's bedroom 2F: 12 × 9 tiles.
- Rival's house: 13 × 10 tiles.
- Generic homes: 11 × 9 tiles.
- Pokémon Center 1F: 15 × 10 tiles.
- Poké Mart: 11 × 9 tiles.
- Oak's laboratory: 13 × 14 tiles.
