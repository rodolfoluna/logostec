"""Extract glyph outlines + kerning from OFL fonts into a compact JS module.

Glyph paths are normalised to 1000 units/em, y pointing down, baseline at y=0.
"""
import io, json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

CHARS = ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
         "ÁÉÍÓÚÜÑáéíóúüñ .,:;-–!¡?¿&'\"()/@#+*%·")

FONTS = [
    # id, label, file, weight
    ('montserrat-900', 'Montserrat Black', 'montserrat_Montserrat[wght].ttf', 900),
    ('montserrat-800', 'Montserrat ExtraBold', 'montserrat_Montserrat[wght].ttf', 800),
    ('montserrat-700', 'Montserrat Bold', 'montserrat_Montserrat[wght].ttf', 700),
    ('montserrat-500', 'Montserrat Medium', 'montserrat_Montserrat[wght].ttf', 500),
    ('oswald-600', 'Oswald SemiBold', 'oswald_Oswald[wght].ttf', 600),
    ('quicksand-700', 'Quicksand Bold', 'quicksand_Quicksand[wght].ttf', 700),
    ('orbitron-700', 'Orbitron Bold', 'orbitron_Orbitron[wght].ttf', 700),
    ('exo2-800', 'Exo 2 ExtraBold', 'exo2_Exo2[wght].ttf', 800),
]


def num(v):
    s = f"{v:.1f}"
    s = s.rstrip('0').rstrip('.') if '.' in s else s
    return '0' if s == '-0' else s


class RoundPen(SVGPathPen):
    def __init__(self, glyphSet):
        super().__init__(glyphSet, ntos=num)


def build(fid, label, path, weight):
    font = TTFont(path)
    if 'fvar' in font:
        font = instancer.instantiateVariableFont(font, {'wght': weight})
    buf = io.BytesIO()
    font.save(buf)
    data = buf.getvalue()
    upm = font['head'].unitsPerEm
    k = 1000 / upm
    cmap = font.getBestCmap()
    gs = font.getGlyphSet()
    hmtx = font['hmtx']
    os2 = font['OS/2']
    glyphs = {}
    for ch in CHARS:
        gname = cmap.get(ord(ch))
        if gname is None:
            continue
        pen = RoundPen(gs)
        tpen = TransformPen(pen, (k, 0, 0, -k, 0, 0))
        gs[gname].draw(tpen)
        glyphs[ch] = [round(hmtx[gname][0] * k), pen.getCommands()]

    # kerning via harfbuzz: shaped width of pair minus the individual advances
    face = hb.Face(data)
    hbfont = hb.Font(face)
    def width(s):
        b = hb.Buffer()
        b.add_str(s)
        b.guess_segment_properties()
        hb.shape(hbfont, b, {'liga': False, 'kern': True})
        return sum(p.x_advance for p in b.glyph_positions)
    single = {c: width(c) for c in glyphs}
    kern = {}
    letters = [c for c in glyphs if c.strip()]
    for a in letters:
        for b in letters:
            d = width(a + b) - single[a] - single[b]
            if abs(d * k) >= 4:
                kern[a + b] = round(d * k)
    cap = getattr(os2, 'sCapHeight', 0) or 700
    xh = getattr(os2, 'sxHeight', 0) or 500
    return dict(id=fid, name=label, asc=round(os2.sTypoAscender * k), desc=round(-os2.sTypoDescender * k),
                cap=round(cap * k), xh=round(xh * k), glyphs=glyphs, kern=kern)


out = []
for f in FONTS:
    r = build(*f)
    print(f[0], len(r['glyphs']), 'glyphs', len(r['kern']), 'kern pairs', 'cap', r['cap'], file=sys.stderr)
    out.append(r)

js = ['/* Glyph outlines generated from OFL fonts (see fonts/OFL.txt). Do not edit by hand. */',
      'window.LT = window.LT || {};', 'LT.FONTS = LT.FONTS || {};']
for r in out:
    js.append(f"LT.FONTS[{json.dumps(r['id'])}] = {json.dumps(r, ensure_ascii=False, separators=(',', ':'))};")
open(sys.argv[1], 'w').write('\n'.join(js) + '\n')
