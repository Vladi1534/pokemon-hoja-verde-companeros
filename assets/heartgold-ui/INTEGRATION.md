# HG_UI integration

Load `hg-ui-assets.js` as a classic script before the interface code. It declares the `HG_UI` global lexical binding. Images are embedded PNG data URIs and need no additional requests.

```html
<script src="hg-ui-assets.js"></script>
<script src="hg-portraits.js"></script><!-- optional -->
<script src="hg-interface.js"></script>
```

| Property | Contents | Original image size |
| --- | --- | --- |
| `HG_UI.bag`, `bagFemale` | Original 2D bag sprites | 64 × 64 |
| `HG_UI.pockets` | `medicine`, `items`, `balls`, `machines`, `berries`, `mail`, `battle`, `key` | 32 × 32 |
| `HG_UI.items` | 31 unique icons, 43 keys including aliases | 32 × 32 |
| `HG_UI.arrows.left/right` | Page arrows | 32 × 32 |
| `HG_UI.arrows.up/down` | Vertical arrows | 32 × 24 |
| `HG_UI.frames.tab` | Selected pocket outline | 32 × 32 |
| `HG_UI.frames.item/selection` | Item-row outlines | 128 × 48 |
| `HG_UI.frames.button` | Action outline | 64 × 32 |
| `HG_UI.portraits.ethan/lyra` | Optional HG trainer portraits | 36 × 65 / 35 × 65 |

Use `image-rendering: pixelated` and preserve intrinsic aspect ratio. Keep transparent padding rather than cropping icons per item: it aligns the original sprite centers. Do not stretch portraits to fill arbitrary rectangles.

Item keys:

```text
ball superball ultraball masterball potion superpotion hyperpotion
antidote fullheal revive firestone waterstone thunderstone leafstone
moonstone repel rareCandy ether oldrod goodrod superrod bicycle map
card_key hm01 hm02 hm03 hm04 hm05 hm06 tm01
pokeball greatball rare_candy cut fly surf surf_lesson strength flash
rocksmash rod cardkey
```

For unknown objects: `HG_UI.items[id] || HG_UI.pockets.key`. Pocket names are identifiers; provide Spanish labels in the application. Render buttons with accessible names even when the visual is an icon.

The reference HG bag displays six items in a two-column, three-row page, eight pocket tabs, a selected item description and contextual actions. Preserve the cursor and page separately for each pocket; an empty pocket should display a clear empty state. Five gameplay pockets can consolidate unused HG categories, but retain item type separation (medicine, balls, machines, key items and general objects).

Development-only files: the source decoder, manifest, full mapping and contact sheet. Only `hg-ui-assets.js`, optional `hg-portraits.js` and the attribution need application packaging.

Rebuild from the owner's source (does not execute ROM code):

```bash
python extract_from_rom.py /path/to/heartgold.nds --output /path/to/output
```

The decoder also accepts a ZIP containing exactly one `.nds` file. Preserve the original source outside the app. The expected main JS bundle size is 47,557 bytes; there are 63 embedded PNG references including aliases and optional portraits.
