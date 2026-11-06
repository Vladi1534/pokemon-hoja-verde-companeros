# 3.0.1 — Colisiones y representación del mundo

Esta revisión corrige la separación entre lo que se dibuja y lo que permite atravesar el motor. Conserva las coordenadas, conexiones e historia de la versión 3.0.0 y es compatible con sus partidas.

## Correcciones

- Las entradas del navegador usan las mismas reglas nativas que el motor local y el servidor. La cuadrícula antigua ya no impide cruzar un borde de ruta, saltar un desnivel o atravesar una barrera abierta.
- Las llegadas a interiores se sitúan delante de la flecha de salida. También se puede salir desde la propia flecha, para recuperar partidas guardadas allí.
- Las fachadas HG tienen parcelas identificadas por sus metatiles originales. La detección anterior confundía edificios con árboles, vallas y casas contiguas: borraba su dibujo, pero conservaba sus colisiones.
- Las tiendas muestran el cuerpo completo del edificio. Se retiró del modelo adaptado el poste exterior que descentraba su puerta y provocaba el recorte. El modelo original permanece disponible.
- Se conservan las copas, troncos y flores originales fuera de las parcelas verificadas. No se borran fragmentos de bosque que carecen de un árbol de reemplazo.
- Los árboles de Corte y las rocas utilizan vistas con texturas verificadas, con una representación visible durante su carga. Las copias decorativas fuera de los límites del mapa se excluyen de los obstáculos.
- Las placas y marcadores estáticos de interacción no añaden paredes invisibles. Los PC se sitúan sobre la casilla real de PC del mapa original.
- Guardar e importar respeta las casillas de puzles abiertas, los NPC retirados y las posiciones válidas sobre agua con Surf.

## Verificación

- Auditoría automática de los 425 mapas originales: 1.018 transiciones con acceso utilizable, 329 salidas desde su propia flecha, 784 contactos de conexión, 107 obstáculos removibles y 74 fachadas sin superposiciones ni puertas adicionales ocultas.
- Los 784 contactos entre mapas se ejecutan también contra el código real de entrada del navegador. Esto detecta rechazos del cliente que una prueba exclusiva del servidor no observa.
- Regresiones de entrada/salida de tienda, casillas abiertas, placas, guardado sobre agua y guardados sobre flechas de salida.
- Comprobación visual e interacción en navegador de tiendas, Corte, pasos entre rutas y una selección de casas, bosques e interiores.
- La compilación y las suites existentes verifican también campaña, combate, guardados y servicios online.

## Alcance

Las fachadas cuya correspondencia HG no está verificada conservan íntegro su arte de Verde Hoja. No se alteran colisiones originales para acomodar un modelo. Las pruebas estructurales abarcan todos los mapas; la revisión visual manual es por muestras y no equivale a completar otra vez toda la campaña.

`scripts/map-qa.cjs` genera una superficie local de inspección, con un guardado de prueba separado y una capa opcional de colisiones. No se publica en producción.
