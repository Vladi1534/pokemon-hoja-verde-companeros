# Audio de HeartGold · Compañeros 2.8

La música y los efectos de este paquete proceden del archivo de **Pokémon Edición Oro HeartGold (España)** aportado por el usuario. Se leyó el sistema de archivos NitroFS y se extrajo `data/sound/gs_sound_data.sdat` como datos; no se ejecutó el código del juego ni se descargó otra ROM.

El videojuego, sus composiciones, secuencias, bancos y muestras conservan su copyright original: **© 2009 Pokémon. © 1995–2009 Nintendo / Creatures Inc. / GAME FREAK inc.** La extracción, conversión o inclusión de estos recursos no los convierte en CC0, MIT ni recursos de dominio público. Las licencias de las herramientas se refieren solamente a su código.

## Procedencia y tratamiento

`manifest.json` registra la huella SHA-256 del archivo NDS aportado y de la SDAT, el índice y nombre original de cada SSEQ, su banco, duración, puntos de bucle, tratamiento, tamaño y huella del recurso final.

- Secuencias y muestras originales SSEQ / SBNK / SWAR renderizadas a 32.000 Hz con **DualRip**, commit `f69e23c63a7d0985a474d0cbaeb2b364174748ac` (MIT), de TetraSsky: https://github.com/TetraSsky/DualRip
- DualRip se basa en FeOS Sound System de fincs y NCSF Player de Naram Qashat (CyberBotX), e incluye tablas obtenidas del controlador de sonido NNS. Se conserva su licencia en `sources/DualRip-LICENSE.txt`.
- Lectura de la SDAT con **ndspy 4.2.0**, de RoadrunnerWMC (GPL-3.0): https://github.com/RoadrunnerWMC/ndspy. Se utiliza como herramienta de conversión, no como dependencia del juego publicado.
- Codificación final mediante **FFmpeg / libvorbis**. Música Ogg Vorbis estéreo a 32 kHz, calidad 0. Efectos PCM WAV mono a 32 kHz.
- El mezclador se atenúa por 0,25 antes de convertir a PCM para evitar saturación. Después se aplica una ganancia constante por recurso. No se altera el tono, el tempo, la composición ni la selección de instrumentos.
- Para la música se conservan la introducción y un ciclo completo del bucle en estado estable. Se aplica una transición de 5 ms al final de la introducción, sin modificar el segmento que se repite. Los efectos terminan con un fundido de 25 ms; los silencios nativos se conservan y el silencio digital final se limita a 80 ms.

Es una reproducción de las secuencias con sus muestras originales, no una captura del audio de una consola ni una afirmación de equivalencia bit a bit con su mezclador.

## Referencia entregada por el usuario

El oEmbed oficial de YouTube identifica https://www.youtube.com/watch?v=TsxlTd69d3o como **“Pokémon HeartGold & SoulSilver - Final Battle! Legend Red (1080p60)”**, de **Mixeli**. No se descargó ni se utilizó audio de ese video. La escena `champion` y el alias `red` usan el tema `SEQ_GS_VS_CHAMP` de la SDAT aportada.

## Contenido del paquete

La selección básica mantiene las claves de escenas y efectos que usa Compañeros. Se añaden claves de ciudades y rutas de Kanto para seleccionar su música de forma contextual sin archivos duplicados. Los índices exactos están en `manifest.json` y `sources/selection.json`.

El paquete publicable contiene únicamente audio convertido, catálogo, créditos y scripts de conversión. No contiene el ZIP, la ROM NDS, el archivo SDAT ni los bancos de datos completos del juego.
