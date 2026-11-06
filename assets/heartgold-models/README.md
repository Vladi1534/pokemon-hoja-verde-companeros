# Geometría HeartGold — procedencia y conversión

Selección del archivo español aportado por el propietario del proyecto: código IPKS, SHA256 `9e0f7a1a4a18d9015936678722ce081d08b6a5d882fd648e89b624307f8f9e19`. Se leyó como datos; no se ejecutó ni se incluye la ROM. Gráficos originales © Nintendo / GAME FREAK / The Pokémon Company.

Conversor: [Apicula](https://github.com/scurest/apicula), commit `3d4e91e14045392a49c89e86dab8cb936225588c`, licencia 0BSD. Estructuras y mapas contrastados con [pret/pokeheartgold](https://github.com/pret/pokeheartgold), commit `e1d5a4606640e31c44d36714ad0b5cdd9c8763fd`. La disponibilidad pública de las herramientas no cambia la titularidad de los gráficos originales.

`manifest.json` registra los 62 modelos, archivos NitroFS, miembros, hashes y texturas embebidas. `door-anchors.json` contrasta las entradas con los warps originales. `museum-collision.json` conserva la cuadrícula y su componente transitable; `museum-props.json` conserva las once ubicaciones de mobiliario.

Los modelos usan Y vertical y 16 unidades por casilla. El museo usa el archivo de terreno `a/0/6/5`, miembro 358, matriz 242, texturas `a/0/4/4` miembro 44 y eventos 424. Las identidades de NPC y objetivos de esta adaptación siguen siendo de la campaña de Verde Hoja.

`previews/` contiene 26 renders ortográficos de estos mismos modelos. La vista completa del museo incluye una máscara de profundidad de 16 bits, codificada en RG de PNG, con 16 unidades de profundidad por unidad nativa. Permite ocultar personajes tras objetos sólidos sin WebGL. Las transparencias no escriben en la máscara.

Conversión reproducible: [scripts y entradas](../../scripts/hg-reference/README.md). Los renders pueden regenerarse desde los GLB, sin ROM, con `python scripts/render-model-previews.py` y numpy, trimesh, pyrender y Pillow. El juego no necesita esas dependencias: usa los resultados versionados.

Motor visual [Three.js](https://github.com/mrdoob/three.js), MIT. Los avisos de dependencia se conservan en `model-engine.js.LEGAL.txt`. La torre de radio de Pueblo Lavanda y la Mansión Azulona no se presentan como sus equivalentes de Verde Hoja; los recursos de referencia sin uso no cambian la campaña.
