# Recursos de entorno HeartGold para trazados originales de Verde Hoja

Esta entrega contiene **135 texturas nativas** y **17 modelos GLB independientes**. No contiene un mapa de HeartGold pegado sobre Verde Hoja. El atlas conserva los píxeles originales, sin redibujado ni filtros. Los modelos son piezas y props nativos; los cuatro segmentos de pared se limitan a una celda de 16 × 16 × 16 unidades, conservando su perfil y sus UV.

## Archivos

- `environment-atlas.png` y `environment-atlas.json`: atlas de 512 × 512 píxeles y rectángulo exacto de cada textura.
- `textures/`: las mismas texturas en PNG individuales, útiles para patrones o UV repetidos sin sangrado entre imágenes.
- `environment-catalog.json`: propuesta de asociación semántica para suelo, hierba alta, caminos, agua, desniveles, paredes, copas y escaleras.
- `models/`: GLB con todas sus texturas incrustadas y filtros de texel nativos.
- `manifest.json`: origen de cada grupo, archivos NARC, miembros, SHA-256, dimensiones, anclas y método de extracción.
- `models-contact.png`: vista técnica de los modelos a 42°. Cada recuadro está ajustado para inspección; **no es una comparación de escala entre modelos**.
- `building-scale-report.json`: dimensiones originales de los edificios ya existentes y explicación del tamaño reducido de las tiendas.
- `build_environment.py` y `verify_assets.py`: extracción reproducible y comprobaciones.

## Integración sin modificar el mapeo

1. Cargar las celdas originales FRLG, con metatile, comportamiento, colisión, elevación y capas inferior/superior. Mantener las coordenadas originales de eventos, NPC, objetos y warps.
2. Seleccionar la familia visual HG por bioma. `floor`, `tall_grass`, `water`, `obstacle`, `ledge` y `warp` del dataset FRLG sirven como punto de partida; **obstacle no significa automáticamente árbol**. La asignación de edificios, estanterías, rocas y decoraciones requiere identificar su metatile concreto.
3. Dibujar la sustitución solo en las capas y regiones identificadas. Los metatiles sin correspondencia auditada deben conservar su arte FRLG. No tapar edificios, entradas o elementos superiores con una capa general de suelo HG.
4. Conservar siempre la colisión original FRLG. Ni la silueta de un árbol, ni su sombra, ni el rectángulo del atlas son una fuente de colisión. Los modelos de copas y techos pueden sobresalir de su base, con profundidad y oclusión coherentes.
5. No cambiar coordenadas de una escalera para centrar su imagen. Su warp original manda; colocar el arte y su ancla sobre ese warp.

## Unidades, patrones y proyección

HeartGold usa **16 unidades nativas por celda**. Con un tile de 32 píxeles en el canvas, la escala del mundo es 2 píxeles por unidad. Los GLB mantienen Y hacia arriba, X hacia el este y Z hacia el sur. El origen original se mantiene en los props completos; en las piezas extraídas la traslación eliminada figura en `nativeSource.sourceOriginRemoved`.

En los suelos, un texel corresponde aproximadamente a una unidad nativa: una textura de 32 × 32 corresponde a un patrón de 2 × 2 celdas. No comprimir ese patrón entero dentro de cada celda de 16 × 16. Usar coordenadas del mundo para continuar los patrones a ambos lados de cada tile. Las UV de los modelos ya conservan sus escalas, repeticiones y posibles recortes originales.

Los árboles aislados de 64 píxeles no son un bloque lógico de una celda: su plano nativo mide 64 unidades de ancho, con la inclinación de billboard que usaba HG. Su follaje debe ocupar agrupaciones o bordes de bosque coherentes con los obstáculos FRLG. No colocar un árbol gigante nuevo en cada celda sólida ni cubrir pasillos transitables. `kanto-tree-edge` es el recorte nativo más estrecho, de 32 unidades; `forest-canopy-strip` es una franja nativa con cuatro copas.

Para Three.js: materiales sin iluminación adicional, colores de vértice, texturas sRGB, `NearestFilter`, sin mipmaps; conservar MASK/BLEND. En materiales BLEND usar escritura de profundidad desactivada y orden correcto. La inclinación de 42–45° del render debe compartirse entre geometría y personajes. La ejecución WebGL no debe ser obligatoria: se pueden prerenderizar las mismas piezas con sus anclas como fallback.

## Por qué las tiendas se ven pequeñas

`game-v28/landmark-layout.js` toma el mínimo entre el ancho total del antiguo edificio y los espacios a izquierda/derecha de la puerta. Una fachada asimétrica se reduce completa por el lado corto. La tienda HG tiene la puerta en X = −8 y un letrero que sobresale a la derecha. Con un solar sintético de cinco tiles y la puerta centrada, el marco completo queda en unos **113 px**; a escala nativa corresponde a **192 px**, incluidas las franjas de encuadre. El cuerpo visible mide aproximadamente 184 px. El aumento correcto en ese caso es de alrededor de **1,70×**.

Debe calcularse una sola escala desde las unidades del render:

```js
const pixelsPerWorldUnit = tilePixels / 16;
const scale = pixelsPerWorldUnit / frame.nativePixelsPerUnit;
const x = originalDoorFootX - frame.anchorX * scale;
const y = originalDoorFootY - frame.anchorY * scale;
```

En el renderer GPU, `nativePixelsPerUnit = image.width / (camera.right - camera.left)`. En el fallback ya existe como `preview.scale`; falta conservarlo en el objeto que devuelve `fallbackFrame`. Ambos caminos deben producir la misma escala. Se fija la puerta sobre la posición original FRLG, sin recentrarla según el rectángulo de la fachada.

No todo edificio de HG cabe a tamaño nativo en el solar FRLG. El museo HG, por ejemplo, tiene casi 15,7 tiles de ancho nativo. En esos casos hace falta adaptar las alas/profundidad del edificio o un módulo de fachada apropiado para ese solar, conservando el tamaño de la puerta y del jugador. Reducir uniformemente todo el modelo vuelve a producir puertas diminutas. Ampliar colisiones hasta el tamaño del modelo rompería el trazado original. `building-scale-report.json` permite detectar estos conflictos antes de integrar.

## Reproducibilidad y verificación

Fuente: ZIP aportado `Pokemon - Edicion Oro HeartGold (Spain) [b](1).zip`, miembro `4832 - Pokemon - Edicion Oro HeartGold (Spain) [b].nds`; código IPKS; SHA-256 `9e0f7a1a4a18d9015936678722ce081d08b6a5d882fd648e89b624307f8f9e19`. Se leyó como datos, sin ejecutar el juego.

Se usó Apicula, commit `3d4e91e14045392a49c89e86dab8cb936225588c`, y se comprobó la correspondencia de los bancos de área mediante el decomp `pret/pokeheartgold`, commit `e1d5a4606640e31c44d36714ad0b5cdd9c8763fd`. Las texturas se asignan por materiales de modelos originales; no se adivinaron paletas por parecido de nombre.

```sh
python build_environment.py --rom '/ruta/al/HeartGold.zip' --apicula '/ruta/a/apicula' --out './deliverable'
python verify_assets.py ./deliverable
```

Las verificaciones comprueban identidad píxel a píxel del atlas, hashes, GLB sin imágenes externas, índices y vértices válidos, y las cuatro paredes de 16 × 16 × 16. La hoja de modelos se renderizó e inspeccionó visualmente. Esto valida los recursos, no reemplaza la prueba de navegación de todos los mapas una vez integrados.

El kit proporciona arte y geometría originales HG. **No traslada el ejecutable ni todo el motor de Nintendo DS al navegador.** La iluminación, orden de capas, agua animada, culling y adaptación de edificios siguen siendo responsabilidades del renderer web. Los fotogramas de agua son originales; la secuencia temporal no se ha portado en esta entrega.
