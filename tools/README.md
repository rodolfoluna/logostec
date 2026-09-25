# Herramientas de generación de datos

Estos scripts sólo se necesitan si cambias las imágenes de `referencias/` o quieres agregar fuentes.
La aplicación ya incluye los archivos generados en `js/data/`.

```bash
pip install pillow numpy opencv-python-headless potracer fonttools uharfbuzz
```

## Trazos vectorizados (`js/data/traced.js`)

```bash
python3 tools/build_traced.py
```

`build_traced.py` separa cada imagen de referencia en capas por color y región (por ejemplo, en Sistemas: silueta,
anillo, borde y relleno de la gota, símbolo S, USB y texto) y traza cada capa con potrace. Todas las coordenadas quedan
en un espacio de 1000 × 1000 por logo. `tl.py` contiene las funciones auxiliares (máscaras, componentes, trazado).

## Fuentes (`js/data/fonts.js`)

Descarga los archivos `.ttf` de [Google Fonts](https://github.com/google/fonts/tree/main/ofl) en `tools/fonts/`
(por ejemplo `montserrat_Montserrat[wght].ttf`, como se listan en `FONTS` dentro del script) y ejecuta:

```bash
cd tools/fonts && python3 ../build_fonts.py ../../js/data/fonts.js
```

El script extrae los contornos de los caracteres del español, sus avances y el *kerning* (calculado con HarfBuzz),
normalizados a 1000 unidades por eme.
