# 3.0.0 — Trazado original y progreso durante el combate

## Aventura y equipo

La experiencia se concede al debilitar cada rival, una sola vez, y se muestra en la secuencia del turno. Se actualizan nivel, PS y estadísticas sin esperar a finalizar. Las decisiones de aprendizaje y evolución se presentan al terminar el encuentro. Los combates iniciados en una versión anterior mantienen su mecanismo de recompensa para evitar duplicaciones.

Repartir Exp. aparece en Objetos clave después de entregar el paquete de Oak. Se elige un portador del equipo; recibe la mitad de la experiencia y los participantes comparten la otra mitad. Un portador que también participa recibe ambas partes. No reciben XP Pokémon debilitados, huevos, participantes de PvP o de práctica. Esta entrega temprana es una mejora deliberada de esta edición.

Las fichas describen las 25 naturalezas (+10%/−10% o neutra), con nombres españoles contrastados en [Pokéxperto](https://www.pokexperto.net/index2.php?seccion=advance/naturedex). Las filas de IV/EV indican la característica favorecida o reducida; no se alteran los valores de IV/EV por la naturaleza. El orden de recomendaciones usa estadísticas base y movimientos actuales: es una ayuda para la aventura, no un ranking competitivo universal.

Los motes admiten hasta diez caracteres y se conservan con la identidad del Pokémon. La Pokédex permite buscar y consultar hábitats y niveles. Las tablas de Verde Hoja no cambian entre día y noche; la interfaz lo indica expresamente. Nidoran macho y hembra aparecen en Ruta 2 desde nivel 3, además de las otras zonas configuradas.

Los objetos de historia aparecen físicamente en la mochila: paquete, billete, Pokéflauta, Scope Silph, llaves, dientes, fósil y MO, entre otros. Las entregas consumen los objetos correspondientes. No pueden regalarse para saltar el progreso personal de otro entrenador.

## Mapas y presentación

Se extraen 425 mapas de la copia española aportada: 233.741 celdas, 1.294 registros de warp y 116 conexiones de borde. Sus dimensiones y metatiles coinciden con la referencia pret/pokefirered. El motor usa puertas, escaleras y conexiones nativas; conserva plantas, interiores y distribución de ciudades. Hay dos alias adicionales para partidas anteriores.

Se vinculan los objetivos existentes a sus coordenadas originales, se incorporan entrenadores y conversaciones, ascensores, puertas de Silph, barreras Rocket, interruptores de Mansión y salas separadas de la Liga. Las partidas anteriores se recolocan una vez en una entrada segura manteniendo equipo, historia, dinero y objetos.

Los modelos de edificios HG se anclan a la puerta original. La escala ya no depende del lado corto de una fachada asimétrica. Bosques y cuevas emplean texturas y piezas HG, con anclas de árboles fijas y sin superponer las dos versiones del mismo árbol. Continúan utilizándose metatiles FRLG cuando no existe una correspondencia visual auditada.

Ash tiene un tema distinto: VS Rival de HG, con bucle y volumen ajustados. El vídeo solicitado es un arreglo instrumental del opening del anime, no una pista de los dos cartuchos. Esta versión no lo presenta como si fuera ese arreglo.

## Verificación y límites

- Comparación automática de las 425 geometrías, dimensiones, elevaciones y contactos; destinos de transición dentro de sus mapas.
- Recorrido por casillas con condiciones desbloqueadas: 280 mapas conectados, objetivos principales y cámara del Rubí alcanzables. Los mapas restantes incluyen instalaciones, eventos y zonas aún sin acceso integrado.
- Campaña offline hasta campeón: 30 combates con guardados y recargas; campaña cooperativa y postjuego: 31 combates. Los equipos de nivel 100 verifican eventos y persistencia, no dificultad.
- Pruebas de XP intermedia sin repetición, Repartir Exp., 25 naturalezas, motes, objetos clave, habilidades, transferencia, regalos, PvP, amigos, recuperación y movimiento.
- Revisión de navegador de fichas, mochila, Pokédex, bosque, cueva, fachadas y controles móviles.

No se ejecuta una ROM ni se ha trasplantado el motor Nintendo DS. El motor web conserva su campaña adaptada. No existe todavía un intérprete completo de todos los scripts FRLG: puzzles de empujar rocas, hielo y flechas, varios eventos secundarios y las misiones completas de Archi7 necesitan trabajo adicional. Las placas de Calle Victoria se activan con Fuerza; no simulan aún el desplazamiento original de rocas. La conversión visual HG de todo Kanto y los escenarios de combate también continúa.

Fuentes y herramientas reproducibles: [mapeo](assets/leafgreen-world/README.es.md), [entornos HG](assets/heartgold-environment/README.es.md), [reglas HG](assets/heartgold-rules/README.md), [audio](assets/audio/CREDITS.md). `runtime-world.json.gz` contiene el JSON de geometría comprimido sin cambios de contenido. No se incluye una ROM ni un ZIP del juego.
