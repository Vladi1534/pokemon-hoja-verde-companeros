# HeartGold visual resource provenance

These graphics were decoded from the Pokémon HeartGold Spanish ZIP supplied by the project owner. The game was read only as binary data; no ROM code was executed. The application bundle includes selected PNG graphics and does not include the ROM, executable code, or game story scripts.

Original Pokémon graphics are copyright Nintendo / GAME FREAK / The Pokémon Company. They are not newly authored or represented as freely licensed. The public reverse-engineering references below document file structure and resource identities; public source availability does not change the ownership of the original artwork.

## Source data

- ROM game code: `IPKS`.
- ROM length: 134,217,728 bytes.
- ROM SHA-256: `9e0f7a1a4a18d9015936678722ce081d08b6a5d882fd648e89b624307f8f9e19`.
- `a/0/1/5`: bag graphics, eight pocket icons, arrows and UI selection outlines.
- `a/0/1/8`: item icons. Mappings checked against `src/item.c` in pret/pokeheartgold.
- `a/0/4/9`: optional Ethan and Lyra trainer-card portraits. These are HG protagonists, not Red and Leaf.

The selected bag images are original 2D inventory sprites. The larger rotating bag shown in the reference screenshot is a 3D model in the source game (NSBMD); this bundle does not claim the static PNG is a render of that model.

`assets/heartgold-ui/manifest.json` identifies every source archive, member, cell, image dimension and retained application alias. `assets/heartgold-ui/item-map.json` records the complete table parsed from the primary source below. `assets/heartgold-ui/extract_from_rom.py` is a reproducible, data-only decoder for the selected resources (Python + Pillow).

## Primary reverse-engineering references

- [HeartGold bag resources](https://github.com/pret/pokeheartgold/tree/master/files/graphic/bag/bag_graphics)
- [Bag application behavior and layout](https://github.com/pret/pokeheartgold/blob/master/src/application/bag/bag_app_main.c)
- [Bag sprite and palette selection](https://github.com/pret/pokeheartgold/blob/master/src/application/bag/bag_app_sprite.c)
- [Item icon NCGR/NCLR mapping](https://github.com/pret/pokeheartgold/blob/master/src/item.c)
- [Trainer-card resource handling](https://github.com/pret/pokeheartgold/blob/master/asm/overlay_trainer_card_main.s)
- [Nitro archive identifiers](https://github.com/pret/pokeheartgold/blob/master/include/filesystem_files_def.h)

## Identity boundaries

LeafGreen-specific Silph Scope, Poké Flute, Tea and Secret Key have no matching official HG item entry in the icon mapping used here. Use the generic key-pocket graphic as a fallback, rather than describing a different HG object as an official equivalent.

The application alias `flash` points to `hm05` to preserve the previous integration contract. In HeartGold, HM05 teaches Whirlpool, not Flash. This alias is an application compatibility choice, not game-data evidence. `cut`, `fly`, `surf`, `strength` and `rocksmash` point to the corresponding selected HM icon.
