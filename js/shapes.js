/* Generadores de geometría procedural (engranes, arcos, medias lunas, cajas isométricas, muros). */
(function (LT) {
  'use strict';
  const U = LT.util;
  const P = (x, y) => U.n(x) + ' ' + U.n(y);
  const S = (LT.shapes = {});

  /** Circunferencia completa como sub-trazo (para huecos con evenodd). */
  S.circle = (cx, cy, r) =>
    `M${P(cx + r, cy)}A${U.n(r)} ${U.n(r)} 0 1 1 ${P(cx - r, cy)}A${U.n(r)} ${U.n(r)} 0 1 1 ${P(cx + r, cy)}Z`;

  /**
   * Engrane. o: {cx, cy, teeth, rTip, rRoot, rHole, tip, base, phase}
   * tip/base = fracción del paso angular que ocupa el diente en la punta / en la raíz.
   */
  S.gear = (o) => {
    const N = Math.max(3, Math.round(o.teeth));
    const pitch = 360 / N;
    const ht = (pitch * U.clamp(o.tip, 0.05, 0.95)) / 2;
    const hb = (pitch * U.clamp(o.base, 0.05, 0.98)) / 2;
    const { cx, cy, rTip, rRoot } = o;
    const pol = (r, a) => U.polar(cx, cy, r, a);
    let d = '';
    for (let k = 0; k < N; k++) {
      const c = (o.phase || 0) + k * pitch;
      const a0 = pol(rRoot, c - hb), a1 = pol(rTip, c - ht), a2 = pol(rTip, c + ht), a3 = pol(rRoot, c + hb);
      const nx = pol(rRoot, c + pitch - hb);
      d += (k === 0 ? 'M' : 'L') + U.pt(a0);
      d += 'L' + U.pt(a1);
      d += `A${U.n(rTip)} ${U.n(rTip)} 0 0 1 ${U.pt(a2)}`;
      d += 'L' + U.pt(a3);
      d += `A${U.n(rRoot)} ${U.n(rRoot)} 0 0 1 ${U.pt(nx)}`;
    }
    d += 'Z';
    if (o.rHole > 0) d += S.circle(cx, cy, o.rHole);
    return d;
  };

  /** Triángulos indicadores alrededor de un centro (apuntando hacia afuera). */
  S.marks = (cx, cy, r, size, count, phase) => {
    let d = '';
    for (let k = 0; k < count; k++) {
      const a = (phase || 0) + (k * 360) / count;
      const tip = U.polar(cx, cy, r + size * 0.6, a);
      const b1 = U.polar(cx, cy, r - size * 0.4, a - (size * 0.62 * 180) / (Math.PI * r));
      const b2 = U.polar(cx, cy, r - size * 0.4, a + (size * 0.62 * 180) / (Math.PI * r));
      d += `M${U.pt(tip)}L${U.pt(b1)}L${U.pt(b2)}Z`;
    }
    return d;
  };

  /** Arco (trazo abierto) de a1 a a2 grados en sentido horario. */
  S.arcPath = (cx, cy, r, a1, a2) => {
    let span = a2 - a1;
    if (span >= 359.99) return S.circle(cx, cy, r);
    if (span <= 0) span += 360;
    const p1 = U.polar(cx, cy, r, a1), p2 = U.polar(cx, cy, r, a1 + span);
    return `M${U.pt(p1)}A${U.n(r)} ${U.n(r)} 0 ${span > 180 ? 1 : 0} 1 ${U.pt(p2)}`;
  };

  /**
   * Media luna / "swoosh": arco exterior de radio r entre a1 y a2 y un arco interior
   * que deja un grosor máximo t en el centro y termina en punta en los extremos.
   */
  S.crescent = (cx, cy, r, a1, a2, t) => {
    let span = a2 - a1;
    if (span <= 0) span += 360;
    span = Math.min(span, 359);
    const p1 = U.polar(cx, cy, r, a1), p2 = U.polar(cx, cy, r, a1 + span);
    const half = U.rad(span / 2);
    const hc = r * Math.sin(half); // media cuerda
    const s1 = r * (1 - Math.cos(half)); // sagita exterior
    const s2 = s1 - t;
    let inner;
    if (Math.abs(s2) < 0.01) inner = `L${U.pt(p1)}`;
    else {
      const R2 = (s2 * s2 + hc * hc) / (2 * Math.abs(s2));
      const large = Math.abs(s2) > R2 ? 1 : 0;
      inner = `A${U.n(R2)} ${U.n(R2)} 0 ${large} ${s2 > 0 ? 0 : 1} ${U.pt(p1)}`;
    }
    return `M${U.pt(p1)}A${U.n(r)} ${U.n(r)} 0 ${span > 180 ? 1 : 0} 1 ${U.pt(p2)}${inner}Z`;
  };

  /**
   * Caja isométrica (ladrillo). Devuelve {top, a, b} como polígonos (d).
   * a = cara del eje Y visible, b = cara del eje X visible.
   */
  S.isoBox = (cx, cy, L, W, H, angle, tilt = 0.5) => {
    const ca = Math.cos(U.rad(angle)), sa = Math.sin(U.rad(angle));
    const pr = (x, y, z) => [cx + x * ca - y * sa, cy + (x * sa + y * ca) * tilt - z];
    const l = L / 2, w = W / 2;
    const poly = (pts) => 'M' + pts.map(U.pt).join('L') + 'Z';
    const top = poly([pr(-l, -w, H), pr(l, -w, H), pr(l, w, H), pr(-l, w, H)]);
    const ys = ca >= 0 ? w : -w; // cara Y visible
    const xs = sa >= 0 ? l : -l; // cara X visible
    const a = poly([pr(-l, ys, 0), pr(l, ys, 0), pr(l, ys, H), pr(-l, ys, H)]);
    const b = poly([pr(xs, -w, 0), pr(xs, w, 0), pr(xs, w, H), pr(xs, -w, H)]);
    return { top, a, b };
  };

  /** Muro de ladrillos centrado en (cx, cy). */
  S.wall = (cx, cy, w, h, rows, cols, gap) => {
    const bh = (h - gap * (rows - 1)) / rows;
    const bw = (w - gap * (cols - 1)) / cols;
    const x0 = cx - w / 2, y0 = cy - h / 2;
    let d = '';
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? -(bw + gap) / 2 : 0;
      for (let c = 0; c <= cols; c++) {
        let xa = x0 + off + c * (bw + gap), xb = xa + bw;
        xa = Math.max(xa, x0); xb = Math.min(xb, x0 + w);
        if (xb - xa < 1) continue;
        const y = y0 + r * (bh + gap);
        d += `M${P(xa, y)}H${U.n(xb)}V${U.n(y + bh)}H${U.n(xa)}Z`;
      }
    }
    return d;
  };
})(window.LT);
