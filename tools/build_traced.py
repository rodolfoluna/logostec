"""Vectoriza los logos de referencia (carpeta referencias/) y genera js/data/traced.js.

Cada logo se separa en capas por color/región y cada capa se traza con potrace.
Todas las coordenadas quedan en un espacio de 1000x1000 por logo.

Uso:  python3 tools/build_traced.py
"""
import json, os
from tl import *

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
out = {}


def put(logo, name, mask, S, DX, DY, **kw):
    out.setdefault(logo, {})[name] = dict(d=trace(mask, S, DX, DY, **kw), bbox=bbox(mask, S, DX, DY))
    print(f'{logo}.{name}: {len(out[logo][name]["d"])} bytes')


def biggest(mask, n=1):
    cs = sorted(components(mask), key=lambda c: -c['a'])[:n]
    m = np.zeros_like(mask)
    for c in cs:
        m |= c['mask']
    return m


def keep(mask, min_area):
    m = np.zeros_like(mask)
    for c in components(mask, min_area):
        m |= c['mask']
    return m


# ---------------------------------------------------------------- Sistemas
def sistemas():
    im = load('sistemas.webp')                      # 2000 x 1837
    S, DX, DY = 0.5, 0.0, 40.75
    lab = nearest(im, ['#03234d', '#4e8ad8', '#f4f4f4'])
    alpha = im[..., 3] > 128
    white = clean(lab == 2, open_=3) & alpha
    blue = clean(lab == 1, open_=3) & alpha
    comps = sorted(components(white, 200), key=lambda c: -c['a'])
    ring, drop_line, s_sym, letters = comps[0], comps[1], comps[2], comps[3:]
    sil = clean(fill_holes(alpha), open_=5, blur=6)
    split = 1330
    xs = np.arange(white.shape[1])[None, :]
    drop_outer = fill_holes(drop_line['mask'] | blue) & (xs < split)
    usb = drop_line['mask'] & (xs >= split - 40)
    drop_fill = clean(fill_holes(biggest(blue)), close=5)
    text = np.zeros_like(white)
    for c in letters:
        text |= c['mask']
    put('sistemas', 'silueta', sil, S, DX, DY, turd=50)
    put('sistemas', 'anillo', ring['mask'], S, DX, DY)
    put('sistemas', 'gota_borde', drop_outer, S, DX, DY)
    put('sistemas', 'gota_relleno', drop_fill, S, DX, DY)
    put('sistemas', 'simbolo', s_sym['mask'], S, DX, DY)
    put('sistemas', 'usb', usb, S, DX, DY)
    put('sistemas', 'texto', text, S, DX, DY, opttol=0.2)


# ---------------------------------------------------------------- ITSTR
def itstr():
    im = load('itstr.webp')                         # 1000 x 1000
    S, DX, DY, UP = 1.0, 0.0, 0.0, 3
    rgb = im[..., :3]
    H, W = rgb.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    rad = np.hypot(xx - 500, yy - 500.5)
    lum = rgb.mean(-1)
    burg = dist(im, '#672235') < 62
    navy = (dist(im, '#183069') < 75) | (dist(im, '#001860') < 60)

    def roi(x0, y0, x1, y1):
        return (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)

    mount = biggest(clean(burg & (rad < 383), open_=3, close=5))
    mount = clean(fill_holes(mount), close=9)
    put('itstr', 'montana', mount, S, DX, DY, up=UP, turd=20)

    text = keep(clean(burg & (rad > 404) & (rad < 486), open_=2), 30)
    put('itstr', 'texto', text, S, DX, DY, up=UP, turd=4, opttol=0.2)

    wire = biggest(clean(roi(662, 378, 880, 505) & (rgb.max(-1) < 80) & ~burg, close=3))
    put('itstr', 'cable', wire, S, DX, DY, up=UP, turd=6)

    R = roi(396, 390, 624, 550)
    cover = biggest(clean(R & navy, close=3))
    cover_f = clean(fill_holes(cover), close=5)
    pages = fill_holes(biggest(clean(cover_f & ~cover & (lum > 170), open_=3), 2))
    icons = keep(clean(cover_f & pages & (lum < 110), close=1), 8)
    border = cv2.dilate(cover_f.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))) > 0
    put('itstr', 'libro_borde', border, S, DX, DY, up=UP, turd=10)
    put('itstr', 'libro_tapa', cover_f, S, DX, DY, up=UP, turd=10)
    put('itstr', 'libro_hojas', pages, S, DX, DY, up=UP, turd=10)
    put('itstr', 'libro_iconos', icons, S, DX, DY, up=UP, turd=3, opttol=0.15)

    R = roi(384, 594, 632, 844)
    tr = keep(clean(R & navy & (np.hypot(xx - 507, yy - 718) < 82), close=2), 200)
    put('itstr', 'tr', tr, S, DX, DY, up=UP, turd=6, opttol=0.2)


# ---------------------------------------------------------------- TecNM
def tecnm():
    im = load('tecnm.png')                          # 1740 x 1915 (contenido hasta y=1660)
    S = 1000 / 1740
    DX, DY = 0.0, (1000 - 1660 * S) / 2
    a = im[..., 3] > 128
    cs = components(a, 50)
    gear = max(cs, key=lambda c: c['a'])
    # La parte superior del tocado (debajo de la ranura curva) está unida al engrane:
    # se corta con una línea desde el borde izquierdo hasta la punta de la ranura.
    cut = np.zeros(a.shape, np.uint8)
    cv2.line(cut, (470, 196), (622, 196), 1, 3)
    cut = cut.astype(bool) & gear['mask']
    pieces = sorted(components(gear['mask'] & ~cut, 20), key=lambda c: -c['a'])
    crest = np.zeros_like(a)
    for c in pieces[1:]:
        crest |= c['mask']
    crest |= cut  # la línea de corte se asigna al guerrero para no dejar huecos
    gear = dict(gear, mask=pieces[0]['mask'])
    war, t1, t2 = (np.zeros_like(a) for _ in range(3))
    war |= crest
    for c in cs:
        if c['a'] == max(x['a'] for x in cs):
            continue
        target = war if c['y'] < 1250 else (t1 if c['y'] < 1480 else t2)
        target |= c['mask']
    put('tecnm', 'engrane', gear['mask'], S, DX, DY, turd=20)
    put('tecnm', 'guerrero', war, S, DX, DY, turd=10)
    put('tecnm', 'texto1', t1, S, DX, DY, turd=10)
    put('tecnm', 'texto2', t2, S, DX, DY, turd=10)


sistemas()
itstr()
tecnm()

js = ['/* Trazos vectorizados de los logos de referencia. Generado por tools/build_traced.py. No editar a mano. */',
      'window.LT = window.LT || {};',
      'LT.TRACED = ' + json.dumps(out, separators=(',', ':')) + ';']
open(os.path.join(ROOT, 'js', 'data', 'traced.js'), 'w').write('\n'.join(js) + '\n')
print('ok -> js/data/traced.js')
