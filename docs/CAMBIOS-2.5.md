# 2.5.0 · Consola portátil y encuentros especiales

## Interfaz móvil

La página ocupa la altura visible del teléfono, sin desplazar el documento para usar equipo, mochila o ajustes. La pantalla adapta su resolución y cámara a su espacio real. Conserva la proporción de los sprites.

START abre Equipo, Mochila, Mapa y diario, Amigos, Guardar y Opciones dentro de la pantalla. SELECT abre el mapa. A confirma; B vuelve y, fuera de menús, alterna caminar y correr. La cruceta permite elegir botones en menús y combates. Las invitaciones recibidas tienen un aviso dentro de la pantalla. En horizontal, los controles pasan a la derecha.

El escritorio conserva su distribución. Las pantallas muy pequeñas pueden desplazar el contenido de un menú dentro de la consola, sin desplazar el juego y los controles fuera de vista.

## Movimiento online

El servidor publica los últimos 24 pasos aceptados con tiempos, dirección y posición del compañero. El cliente reproduce ese recorrido con un pequeño margen para absorber la separación entre respuestas. Interpola cada tramo, preserva esquinas y anima al seguidor; no depende de la tasa de refresco. Al cambiar de mapa o recuperarse en un Centro, descarta los recorridos anteriores.

El transporte sigue siendo peticiones HTTP periódicas, no WebSockets. La mejora suaviza el movimiento con conexión estable; una pérdida prolongada de conexión todavía puede producir pausas y correcciones.

## Inicio de los combates

Los movimientos y evoluciones pendientes dejan de bloquear el combate y los encuentros de hierba. Se utiliza la especie y los movimientos actuales; las decisiones pendientes se conservan y pueden resolverse después desde Equipo. Los intercambios y regalos de Pokémon siguen requiriendo resolver sus decisiones antes de transferirlos.

Verificado con dos partidas nuevas: abrir mundo, unirse, aceptar un duelo y resolver un turno. También con ambos tipos de decisión pendientes y con práctica cooperativa. Los duelos y prácticas no modifican el estado previo de los equipos.

## Identidad de los personajes

Giovanni utiliza su propio sprite en sus tres apariciones. Los ocho líderes tienen apariencias distintas. En la Liga, el nombre y sprite corresponden a Lorelei, Bruno, Agatha, Lance o Azul según el enfrentamiento actual. Los NPC comunes conservan estilos de entrenador, científico, marinero, policía, comerciante o residente según su papel.

Ash y Pikachu ofrecen una práctica opcional en Ruta 1. Jessie, James y Meowth tienen episodios originales opcionales en Monte Moon, S. S. Anne y Silph. Se integran sin sustituir los objetivos principales. Cada episodio Rocket se completa una vez por entrenador; en dobles, Jessie y James usan equipos diferentes. Las imágenes del anime son adaptaciones comunitarias; la procedencia y atribución se conservan en `assets/characters`.

## Verificación

- Validaciones existentes del cliente y motor local: 150 comprobaciones, restauración, PP, turnos secuenciales y mensajes de victoria.
- Pruebas de servidor: campaña, guardado personal, recuperación, permisos, colisiones, intercambio y crianza.
- Recorrido automatizado de los 111 mapas y 30 combates de historia con equipos de prueba. Comprueba integración y accesos, no el equilibrio completo de niveles.
- Nueve regresiones nuevas: PvP inicial, decisiones pendientes, cooperación, movimiento, recuperación y encuentros especiales.
- Reproducción determinista del movimiento a distintas tasas de refresco.
- Revisión visual e interacción en navegador a 390×844, 360×640 y 844×390, incluyendo mochila, START, cruceta, A y combate.

Esta actualización conserva el motor y las partidas personales existentes. No incorpora todavía una campaña íntegra del anime ni Pokémon de todas las generaciones.
