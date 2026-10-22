# Publicar esta versión en GitHub Pages

Este paquete contiene el juego actual y un flujo de publicación listo para GitHub Actions. La presencia de estos archivos no significa que el repositorio o la web ya estén publicados.

## Configuración inicial

1. Crear un repositorio propio llamado `pokemon-hoja-verde-companeros` en la cuenta `Vladi1534`. La opción pública permite usar Pages con GitHub Free. El código y los gráficos del repositorio serán visibles públicamente.
2. Subir el contenido de este directorio a la rama `main`, incluyendo `.github/workflows/pages.yml`. No subir el ZIP como un único archivo: hay que extraerlo primero.
3. Abrir **Settings → Pages → Build and deployment → Source** y elegir **GitHub Actions**.
4. Abrir **Actions → Publicar juego en GitHub Pages → Run workflow**, si el primer intento ocurrió antes de habilitar Pages.
5. Esperar a que los trabajos `build` y `deploy` terminen correctamente. La URL confirmada aparece en el entorno `github-pages` y en **Settings → Pages → Visit site**.

El flujo ejecuta las comprobaciones del motor, genera `dist/index.html` y publica únicamente `dist`. Cada cambio posterior en `main` repite el proceso. No requiere instalar paquetes npm ni configurar claves privadas para el juego individual.

## Comprobación local

```bash
node validate.cjs
node build.cjs
```

Abrir `dist/index.html` en un navegador. El HTML es independiente y también funciona sin conexión.

## Conservar una partida anterior

El guardado pertenece al navegador y a la dirección desde la que se abre el juego. Antes de cambiar desde el HTML descargado o desde el sitio anterior a GitHub Pages:

1. Abrir la versión anterior y exportar la partida JSON desde los ajustes.
2. Abrir la nueva URL e importar ese JSON.

El código del juego no contiene partidas personales. Publicar la web permite compartir el enlace, pero todavía no permite que varios jugadores compartan una sesión. La propuesta para esa ampliación está en [MULTIPLAYER.md](MULTIPLAYER.md).

## Documentación oficial

- [Crear un sitio de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Configurar la fuente de publicación](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Usar flujos personalizados de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
