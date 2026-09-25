/* Motor de texto: compone glifos (js/data/fonts.js) como trazos SVG, en línea recta o en arco.
   Al ser trazos, el SVG/PNG exportado no depende de fuentes instaladas. */
(function (LT) {
  'use strict';
  const U = LT.util;

  function font(id) {
    return LT.FONTS[id] || LT.FONTS['montserrat-800'] || Object.values(LT.FONTS)[0];
  }

  function glyph(f, ch) {
    return f.glyphs[ch] || f.glyphs[ch.toUpperCase()] || f.glyphs[ch.normalize('NFD')[0]] || f.glyphs[' '] || [500, ''];
  }

  /** Posiciones horizontales (en unidades de fuente) de cada carácter. */
  function layout(str, f, tracking) {
    const chars = Array.from(str);
    const out = [];
    let x = 0;
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const [adv, d] = glyph(f, ch);
      out.push({ ch, x, adv, d });
      x += adv + tracking;
      const next = chars[i + 1];
      if (next) x += f.kern[ch + next] || 0;
    }
    return { glyphs: out, width: Math.max(0, x - tracking) };
  }

  function matrix(a, b, c, d, e, f) {
    return `matrix(${U.n(a, 5)} ${U.n(b, 5)} ${U.n(c, 5)} ${U.n(d, 5)} ${U.n(e)} ${U.n(f)})`;
  }

  function glyphPath(g, m, extra) {
    if (!g.d) return '';
    return `<path transform="${m}" d="${g.d}"${extra || ''}/>`;
  }

  const T = (LT.text = {});

  T.fontList = () => Object.values(LT.FONTS).map((f) => ({ id: f.id, name: f.name }));
  T.capHeight = (fontId, size) => (font(fontId).cap * size) / 1000;

  /**
   * Texto recto centrado en (cx, cy): el centro vertical es el centro de la altura de mayúsculas.
   * opts: {text, font, size, tracking, cx, cy, align: 'centro'|'izquierda'|'derecha', strokeW}
   */
  T.line = (o) => {
    const f = font(o.font);
    const s = o.size / 1000;
    const L = layout(o.text || '', f, o.tracking || 0);
    const w = L.width * s;
    let x0 = o.cx - w / 2;
    if (o.align === 'izquierda') x0 = o.cx;
    if (o.align === 'derecha') x0 = o.cx - w;
    const base = o.cy + (f.cap * s) / 2;
    const extra = o.strokeW ? ` stroke-width="${U.n(o.strokeW / s)}"` : '';
    return L.glyphs.map((g) => glyphPath(g, matrix(s, 0, 0, s, x0 + g.x * s, base), extra)).join('');
  };

  /**
   * Texto sobre un arco de centro (cx, cy) y radio r (r = centro de la altura de mayúsculas).
   * angle: posición central en grados (0 = arriba, sentido horario).
   * dir: 'arriba' (lectura horaria, letras hacia afuera) | 'abajo' (lectura antihoraria, letras hacia el centro).
   */
  T.arc = (o) => {
    const f = font(o.font);
    const s = o.size / 1000;
    const L = layout(o.text || '', f, o.tracking || 0);
    const cap = f.cap * s;
    const r = Math.max(1, o.r);
    const total = (L.width * s) / r; // radianes
    const down = o.dir === 'abajo';
    const rb = down ? r + cap / 2 : r - cap / 2;
    const extra = o.strokeW ? ` stroke-width="${U.n(o.strokeW / s)}"` : '';
    const start = U.rad(o.angle || 0) + (down ? total / 2 : -total / 2);
    let out = '';
    for (const g of L.glyphs) {
      const mid = (g.x + g.adv / 2) * s / r;
      const phi = down ? start - mid - Math.PI : start + mid;
      const cos = Math.cos(phi), sin = Math.sin(phi);
      const qx = (-g.adv * s) / 2, qy = down ? rb : -rb;
      const e = o.cx + cos * qx - sin * qy;
      const fy = o.cy + sin * qx + cos * qy;
      out += glyphPath(g, matrix(s * cos, s * sin, -s * sin, s * cos, e, fy), extra);
    }
    return out;
  };
})(window.LT);
