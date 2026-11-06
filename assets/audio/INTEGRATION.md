# Integración de audio HeartGold

Copiar `deliverable/music/`, `deliverable/sfx/`, `deliverable/manifest.json`, `deliverable/CREDITS.md` y `deliverable/sources/` a `assets/audio/`, y `deliverable/audio-data.js` a la raíz del frontend. No copiar los archivos NDS, SDAT, WAV intermedios, entornos de Python ni el checkout de DualRip. El catálogo completo incluye claves extra; las actuales se conservan.

## Escenas

Mantener todas las rutas actuales de `Soundtrack.scene()` y añadir por ID de mapa (para interiores normales, usar su padre):

| Mapa o contexto | Clave |
|---|---|
| Paleta / hogar / casa rival | `pallet` |
| Ciudad Verde | `viridian` |
| Ciudad Plateada | `pewter` |
| Ciudad Celeste | `cerulean` |
| Ciudad Carmín / puerto | `vermilion` (alias de `coast`) |
| Pueblo Lavanda | `lavender` |
| Ciudad Azulona | `celadon` |
| Ciudad Fucsia | `fuchsia` |
| Ciudad Azafrán | `saffron` (alias de `town`) |
| Isla Canela | `cinnabar` |
| Rutas 1 / 2 / 22 | `route` |
| Rutas 3 / 4 y otras rutas de Kanto | `route3` |
| Rutas 24 / 25 | `route24` |
| Centro Pokémon | `center` |
| Laboratorios | `lab` |
| Gimnasio, fuera del combate | `gym` |
| Liga, fuera del combate | `league` |
| Bosque Verde | `forest` |
| Cuevas | `cave` |
| Salvajes / entrenadores / líderes | `wild` / `trainer` / `leader` |
| Rocket / Giovanni | `rocket` / `giovanni` (mismo archivo) |
| Campeón / Rojo o duelo especial | `champion` / `red` (mismo archivo) |
| Victoria normal / salvaje / líder | `victory` / `victoryWild` / `victoryLeader` |

Los alias comparten el mismo `file`. El motor puede evitar reiniciar una canción al cambiar entre alias del mismo archivo. Usar `loopStart` y `loopEnd` del catálogo, nunca inferirlos de la duración completa ni reproducir la introducción al repetir el tema.

## Duración de los efectos

Los sonidos auténticos pueden durar más que los de 2.7. Agua ronda 1,66 s, Tierra 3,74 s, crítico 1,82 s. Para mantener turnos claros, dar a la animación el tiempo necesario o desvanecer la voz del efecto anterior al comenzar la siguiente acción. Los efectos siempre tienen `loop:false` aunque su secuencia original fuera sostenida. Evitar duplicar un golpe genérico encima del sonido del movimiento.

El jingle de recuperación dura unos 2,44 s. Usar la duración del catálogo para los jingles y restaurar luego la música del mapa; no conservar temporizadores fijos de la versión anterior.

## Reproducibilidad

En una carpeta temporal vacía, copiar los scripts de `deliverable/sources/`, proporcionar el ZIP del usuario y disponer de Python con NumPy y FFmpeg. Instalar `ndspy==4.2.0` en `python-deps`, obtener el código de DualRip en `DualRip/` y fijar el commit del manifiesto. La conversión DS usa su parser de SDAT y su sintetizador; no requiere ejecutar la ROM.

1. `python extract_hg.py '/ruta/al/archivo.zip' .`
2. En `DualRip/dualrip/engine/sdat/render.py`, atenuar `bl` y `br` por `0.25` justo antes de las dos llamadas a `np.clip(...,-32768,32767)` que forman el bloque PCM. Este cambio impide el recorte previo al mastering; no basta bajar el volumen después.
3. `python render_selected.py`
4. `python package_audio.py`

El script de render reanuda los índices que falten en `raw/`. Para cambiar su selección o tratamiento, retirar solo los intermedios correspondientes antes de volver a renderizar. Las versiones de bibliotecas, índices originales y huellas quedan registradas para auditoría.
