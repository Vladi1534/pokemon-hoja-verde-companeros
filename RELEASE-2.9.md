# 2.9.0 — Reglas HeartGold y primeros escenarios con profundidad

La campaña sigue el recorrido adaptado de Verde Hoja. Los combates nuevos usan un perfil coherente de HeartGold, con la mejora moderna de Robustez solicitada para esta edición.

## Combates y guardados

- Tablas extraídas del archivo HeartGold aportado: las 159 especies disponibles, 467 movimientos y sus categorías, 76 habilidades, aprendizaje por nivel, movimientos de huevo, compatibilidad con MT/MO y matriz de 17 tipos. La disponibilidad de datos no añade automáticamente todas las especies ni un menú para enseñar MT/MO.
- Mankey con Espíritu Vital no puede dormir; Mankey con Irascible sí. En Gen4, los tipos Planta pueden recibir Somnífero. El tipo Veneno impide el envenenamiento. Los mensajes distinguen inmunidad por habilidad, fallo de precisión y estado ya presente.
- Cada movimiento usa su categoría física/especial de Gen4. Aguante tiene prioridad +3 según los datos HG. Los movimientos de daño variable conservan sus fórmulas del simulador.
- Fichas con tipos, habilidad y descripción; los movimientos muestran categoría, potencia y precisión. El registro permite revisar los acontecimientos del turno y las reglas de la edición.
- Huevos de nivel 1, amistad 120 y ciclos ordinarios de 255 pasos; Cuerpo Llama/Escudo Magma aceleran la eclosión. No se incorporan las fechas especiales de eclosión de HG.
- Los guardados mantienen identidad, equipo, movimientos elegidos, IV/EV, historia y objetos. Recuperación pasa a un máximo de 10 PP; importar no rellena PP gastados. Los combates anteriores se reanudan con su generación original. Las posiciones antiguas incompatibles con el museo nuevo regresan a su entrada segura.

## Gráficos

- Museo con geometría y texturas nativas, once objetos colocados, 229 casillas conectadas y siete personajes/interacciones. Se conservan los IDs de la campaña y se añaden visitantes y pistas diferentes.
- Personajes y acompañantes 2D sobre la escena 3D, cámara ortográfica inclinada y oclusión por paredes y vitrinas. Los visitantes online conservan su nombre y acompañante.
- Fachadas HG para centros, tiendas, laboratorio, museo, siete gimnasios, casino, Silph, Liga y casas de varias ciudades. Las entradas coinciden con las casillas autorizadas del juego.
- 26 vistas prerenderizadas de los mismos modelos y máscara de profundidad para mantener el aspecto y la jugabilidad cuando WebGL no está disponible. Ambos modos comparten colisiones y eventos.
- Recursos incluidos en la caché offline. La interfaz portátil azul se mantiene.

## Verificación

- Suites completas del frontend y del servicio: combate, transferencia, amigos, regalos, PvP, cooperación, recuperación, movimiento, importación y guardado.
- Comparación de metadatos de todas las especies y movimientos con el motor compartido; casos reproducibles de sueño, categorías, prioridades, PP, crianza y migración.
- Verificación de los 62 archivos GLB por hash, dimensiones de las 26 vistas compatibles y proyección/oclusión ortográfica.
- Accesibilidad lógica de los 112 mapas. Recorrido offline de 29 combates de historia hasta las ocho medallas y campeón, con recargas. Usa equipos de nivel 100 para comprobar eventos y persistencia; no valida la dificultad de una partida natural.
- Prueba de navegador: acceso al museo desde Ciudad Plateada, recorrido, interacción con la exposición y salida; presentación de Somnífero y controles de escritorio/móvil.
- El navegador de QA no ofrece WebGL. La prueba visual se realiza sobre la representación compatible de los mismos modelos; la aceleración 3D requiere validación adicional en hardware real.

## Alcance del salto visual

Esta es la primera integración 2.5D, no una conversión completa de Kanto. Los exteriores siguen usando el mapa por casillas y vistas de modelos; el museo incorpora la escena tridimensional. El S. S. Anne, la Torre Pokémon y la Mansión de Isla Canela conservan sus diseños anteriores: los edificios de HeartGold de esas épocas no son equivalentes y requieren adaptación específica. Tampoco se ha convertido aún el escenario de combate a 3D.

Se conserva el motor compartido y las partidas. Para ampliar esta base se necesitan escenas de cada localidad, colisiones y puertas contrastadas, iluminación coherente, animaciones y pruebas en móviles. React puede servir a los menús, pero la profundidad visual la aporta el render de escenarios y los recursos gráficos.

Procedencia: [modelos](assets/heartgold-models/README.md), [reglas](assets/heartgold-rules/README.md), [audio](assets/audio/CREDITS.md). No se incluye una ROM.
