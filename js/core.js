/* Utilidades generales: números, colores, ids, PRNG. */
window.LT = window.LT || {};
(function (LT) {
  'use strict';
  const U = (LT.util = {});

  U.uid = (p = 'n') => p + Math.random().toString(36).slice(2, 9);
  U.clone = (o) => JSON.parse(JSON.stringify(o));
  U.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  U.rad = (d) => (d * Math.PI) / 180;

  /** Número compacto para SVG. */
  U.n = (v, d = 2) => {
    let s = (+v).toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  };

  U.esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /** PRNG determinista (mulberry32) para que los dibujos "orgánicos" sean estables. */
  U.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /** Punto en un círculo; ángulo en grados medido desde arriba, en sentido horario. */
  U.polar = (cx, cy, r, deg) => {
    const a = U.rad(deg);
    return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  };
  U.pt = (p) => U.n(p[0]) + ' ' + U.n(p[1]);

  // ------------------------------------------------------------------ colores
  U.normHex = (s) => {
    if (typeof s !== 'string') return null;
    let h = s.trim().replace(/^#/, '').toLowerCase();
    if (/^[0-9a-f]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('');
    return /^[0-9a-f]{6}$/.test(h) ? '#' + h : null;
  };
  U.hexToRgb = (hex) => {
    const h = U.normHex(hex) || '#000000';
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  };
  U.rgbToHex = (r, g, b) =>
    '#' + [r, g, b].map((v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  U.rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  };
  U.hslToRgb = (h, s, l) => {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const [r, g, b] =
      h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  };
  U.hexToHsl = (hex) => U.rgbToHsl(...U.hexToRgb(hex));
  U.hslToHex = (h, s, l) => U.rgbToHex(...U.hslToRgb(h, U.clamp(s, 0, 1), U.clamp(l, 0, 1)));
  U.mix = (a, b, t) => {
    const A = U.hexToRgb(a), B = U.hexToRgb(b);
    return U.rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  };
  /** Gira el tono conservando saturación/luminosidad. Los grises no cambian. */
  U.shiftHue = (hex, deg) => {
    const [h, s, l] = U.hexToHsl(hex);
    if (s < 0.08) return U.normHex(hex);
    return U.hslToHex(h + deg, s, l);
  };
  U.luma = (hex) => {
    const [r, g, b] = U.hexToRgb(hex).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
})(window.LT);
