# LogosTec · Generador de logos

Aplicación web (HTML + JavaScript, sin dependencias ni servidor) que **genera como vectores** los logos de
Sistemas, del Instituto Tecnológico Superior de Tepexi de Rodríguez (ITSTR) y del Tecnológico Nacional de México (TecNM),
permite **editar la paleta de colores de cada capa** y **combinarlos** para crear logos nuevos, como *Logosistemas*
(combinación de los tres) y *prop2* (una variante de color de Logosistemas).

## Cómo usarla

1. Abre `index.html` con doble clic en Chrome, Edge, Firefox o Safari. Funciona sin internet.
   También puedes publicarla con GitHub Pages (Settings → Pages → rama principal) para usarla desde una URL.
2. Elige una **plantilla** (Sistemas, ITSTR, TecNM, Logosistemas o prop2).
3. Edita:
   - **Paleta de colores**: cada composición tiene colores con nombre (p. ej. *Principal*, *Marco*, *Guinda*).
     Cambiar uno recolorea todas las capas que lo usan.
   - **Capas**: selecciona una pieza en la lista o haz clic sobre ella en el lienzo. Puedes moverla (arrastrando o con las
     flechas), escalarla, rotarla, voltearla, cambiar su opacidad y asignar a cada parte un color de la paleta,
     un color fijo o un degradado (lineal o radial). También puedes agregar sombra y contorno.
   - **Variantes de color**: guarda la paleta actual como variante, cambia entre variantes con un clic o pide
     sugerencias automáticas (giros de tono, complementario, pastel, escala de grises, etc.).
     *prop2* es la variante “Guinda y azul” de Logosistemas.
4. Para **combinar**, usa *Insertar logo completo…* (agrega otro logo como grupo, fusionando su paleta) o
   *Agregar elemento…* (piezas sueltas: gota, símbolo S, USB, cerro, acueducto, cactus, guerrero águila, engranes,
   textos en arco, ondas, colinas, muro de ladrillos…).
5. Exporta en **SVG** (vectorial, sin fuentes externas: los textos se convierten en trazos) o **PNG** (512–4096 px).
   Con **Guardar** descargas un `.json` para seguir editando después con **Abrir**.

El trabajo se guarda automáticamente en el navegador. Atajos: `Ctrl+Z` / `Ctrl+Y` deshacer y rehacer,
`Ctrl+D` duplicar, `Supr` eliminar, flechas para mover (con `Shift` de 10 en 10), `Ctrl+rueda` para acercar.
La casilla **Referencia** superpone la imagen original de la plantilla para comparar.

## Cómo está hecho

| Archivo | Contenido |
| --- | --- |
| `index.html`, `css/app.css` | Interfaz. |
| `js/app.js` | Estado, capas, inspector, paleta, variantes, arrastre, historial, exportación. |
| `js/render.js` | Registro de elementos y render de una composición a SVG (paletas, degradados, grupos, recorte, sombras). |
| `js/elements/*.js` | Elementos de cada logo y formas genéricas. |
| `js/presets.js` | Plantillas (composiciones) y sus variantes de color. |
| `js/text.js`, `js/data/fonts.js` | Texto recto y en arco a partir de contornos de fuentes libres (OFL). |
| `js/shapes.js` | Geometría procedural: engranes, arcos, medias lunas, cajas isométricas, muros. |
| `js/data/traced.js` | Trazos vectorizados de las imágenes de `referencias/` (generado con `tools/`). |

Las formas orgánicas y los logotipos oficiales (cerro, libro, guerrero águila, gota, USB, textos originales, etc.) se
obtuvieron **vectorizando** las imágenes de `referencias/` capa por capa (ver `tools/README.md`). El acueducto, el cactus,
los agaves, el pez, los ladrillos, los engranes, los anillos, las ondas y los textos editables se **dibujan con código**.

Una composición es un JSON con: tamaño del lienzo, paleta (`[{id, name, color}]`), variantes y un árbol de capas.
Los colores de cada capa pueden ser `'@idDePaleta'`, `'#rrggbb'` o un degradado
`{g: 'lineal'|'radial', a, b, ang, cx, cy, r, oa, ob}`.

### Agregar un elemento nuevo

```js
LT.defineElement({
  id: 'mio.estrella',
  group: 'Mis elementos',
  name: 'Estrella',
  pivot: [500, 500],                       // centro para escalar/rotar
  slots: [{ id: 'color', name: 'Color', def: '#f2b705' }],
  params: [{ id: 'puntas', name: 'Puntas', type: 'range', min: 3, max: 12, step: 1, def: 5 }],
  render: (p, color) => `<path fill="${color('color')}" d="..."/>`,
});
```

Guárdalo en `js/elements/` y agrégalo con un `<script>` en `index.html` (antes de `js/presets.js`).

## Créditos

- Los logos de referencia pertenecen a sus respectivas instituciones.
- Fuentes Montserrat, Oswald, Quicksand, Orbitron y Exo 2 bajo SIL Open Font License (ver `fonts/`).
