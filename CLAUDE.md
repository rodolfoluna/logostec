# LogosTec

Generador de logos vectoriales (HTML + JavaScript sin compilación). Ver `README.md`.

## Flujo de trabajo

- La única rama del proyecto es `main`. Trabaja, haz commit y push directamente sobre `main`;
  no crees ramas nuevas ni pull requests salvo que se pidan explícitamente.
- Antes de hacer push, abre `index.html` en un navegador (Playwright/Chromium) y confirma que no hay errores de consola.

## Estructura

- `js/elements/*.js`: elementos de cada logo (`LT.defineElement`). `js/presets.js`: plantillas y variantes de color.
- `js/data/traced.js` y `js/data/fonts.js` son generados por `tools/` (ver `tools/README.md`); no se editan a mano.
- Textos de la interfaz y documentación en español.
