/* Registro de elementos y render de una composición a SVG. */
(function (LT) {
  'use strict';
  const U = LT.util;

  // ------------------------------------------------------------------ registro
  const REG = (LT.elements = {});
  LT.defineElement = (def) => {
    def.slots = def.slots || [];
    def.params = def.params || [];
    REG[def.id] = def;
    return def;
  };

  /** Trazo vectorizado de un logo de referencia. */
  LT.tr = (logo, part) => (LT.TRACED[logo] && LT.TRACED[logo][part] ? LT.TRACED[logo][part].d : '');
  /** Centro de la caja envolvente de varias partes vectorizadas. */
  LT.trCenter = (logo, parts) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of parts) {
      const b = LT.TRACED[logo] && LT.TRACED[logo][p] && LT.TRACED[logo][p].bbox;
      if (!b) continue;
      x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]);
    }
    return isFinite(x0) ? [(x0 + x1) / 2, (y0 + y1) / 2] : [500, 500];
  };

  // ------------------------------------------------------------------ nodos
  const N = (LT.node = {});
  N.defaults = () => ({ visible: true, x: 0, y: 0, s: 1, r: 0, fx: false, fy: false, o: 1, clip: false, shadow: null, stroke: null });

  N.element = (el, extra = {}) => {
    const def = REG[el];
    return Object.assign(N.defaults(), { id: U.uid('e'), type: 'element', el, name: def ? def.name : el, colors: {}, params: {} }, extra);
  };
  N.group = (name, children = [], extra = {}) =>
    Object.assign(N.defaults(), { id: U.uid('g'), type: 'group', name, open: false, children }, extra);

  N.walk = (nodes, fn, parent = null) => {
    for (const n of nodes) {
      if (fn(n, parent) === false) return false;
      if (n.type === 'group' && N.walk(n.children, fn, n) === false) return false;
    }
  };
  N.find = (nodes, id) => {
    let hit = null;
    N.walk(nodes, (n, parent) => {
      if (n.id === id) { hit = { node: n, parent, list: parent ? parent.children : nodes }; return false; }
    });
    return hit;
  };
  N.pivot = (n) => {
    if (n.type === 'group') return n.pivot || [500, 500];
    const def = REG[n.el];
    if (!def) return [500, 500];
    return typeof def.pivot === 'function' ? def.pivot(N.params(def, n)) : def.pivot || [500, 500];
  };
  N.params = (def, n) => {
    const p = {};
    for (const q of def.params) p[q.id] = n.params && n.params[q.id] !== undefined ? n.params[q.id] : q.def;
    return p;
  };
  N.color = (def, n, slot) => {
    if (n.colors && n.colors[slot] !== undefined) return n.colors[slot];
    const s = def.slots.find((x) => x.id === slot);
    return s ? s.def : '#ff00ff';
  };
  N.transform = (n) => {
    const [px, py] = N.pivot(n);
    const sx = (n.fx ? -1 : 1) * n.s, sy = (n.fy ? -1 : 1) * n.s;
    if (!n.x && !n.y && !n.r && sx === 1 && sy === 1) return '';
    return `translate(${U.n(n.x + px)} ${U.n(n.y + py)}) rotate(${U.n(n.r)}) scale(${U.n(sx, 4)} ${U.n(sy, 4)}) translate(${U.n(-px)} ${U.n(-py)})`;
  };

  // ------------------------------------------------------------------ pintura
  LT.resolveColor = (v, palette) => {
    if (!v || v === 'none') return 'none';
    if (typeof v === 'string' && v[0] === '@') {
      const t = palette.find((p) => p.id === v.slice(1));
      return t ? t.color : '#ff00ff';
    }
    return typeof v === 'string' ? v : '#ff00ff';
  };

  function makeCtx(comp, prefix) {
    let k = 0;
    const ctx = {
      comp,
      defs: [],
      id: (p) => `${prefix}${p}${++k}`,
      color: (v) => LT.resolveColor(v, comp.palette),
      paint(v) {
        if (v && typeof v === 'object') return gradient(ctx, v);
        return ctx.color(v);
      },
    };
    return ctx;
  }

  function gradient(ctx, g) {
    const id = ctx.id('grad');
    const stops = [
      [ctx.color(g.a), g.oa ?? 1],
      [ctx.color(g.b), g.ob ?? 1],
    ];
    const st = stops
      .map(([c, o], i) => `<stop offset="${i}" stop-color="${c}"${o < 1 ? ` stop-opacity="${U.n(o, 3)}"` : ''}/>`)
      .join('');
    if (g.g === 'radial') {
      ctx.defs.push(
        `<radialGradient id="${id}" cx="${U.n(g.cx ?? 0.5)}" cy="${U.n(g.cy ?? 0.5)}" r="${U.n(g.r ?? 0.6)}">${st}</radialGradient>`
      );
    } else {
      const a = U.rad(g.ang ?? 180);
      const x1 = 0.5 - Math.sin(a) / 2, y1 = 0.5 + Math.cos(a) / 2, x2 = 0.5 + Math.sin(a) / 2, y2 = 0.5 - Math.cos(a) / 2;
      ctx.defs.push(`<linearGradient id="${id}" x1="${U.n(x1)}" y1="${U.n(y1)}" x2="${U.n(x2)}" y2="${U.n(y2)}">${st}</linearGradient>`);
    }
    return `url(#${id})`;
  }

  // ------------------------------------------------------------------ render
  function renderNode(n, ctx, isRoot) {
    if (!n.visible) return '';
    let inner = '';
    if (n.type === 'group') {
      inner = n.children.map((c) => renderNode(c, ctx, false)).join('');
    } else {
      const def = REG[n.el];
      if (!def) return '';
      const p = N.params(def, n);
      const paint = (slot) => ctx.paint(N.color(def, n, slot));
      ctx.layerStrokeW = n.stroke && n.stroke.w > 0 ? n.stroke.w : 0;
      try {
        inner = def.render(p, paint, ctx);
      } catch (err) {
        console.error('Error al dibujar', n.el, err);
        inner = '';
      }
    }
    let attrs = ` data-id="${n.id}"`;
    const tf = N.transform(n);
    if (tf) attrs += ` transform="${tf}"`;
    if (n.o < 1) attrs += ` opacity="${U.n(n.o, 3)}"`;
    if (n.stroke && n.stroke.w > 0) {
      attrs += ` stroke="${ctx.color(n.stroke.color)}" stroke-width="${U.n(n.stroke.w)}" stroke-linejoin="round" paint-order="stroke"`;
    }
    if (n.shadow) {
      const f = ctx.id('sh');
      const sh = n.shadow;
      ctx.defs.push(
        `<filter id="${f}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feDropShadow dx="${U.n(sh.dx)}" dy="${U.n(sh.dy)}" stdDeviation="${U.n(sh.blur)}" flood-color="${ctx.color(sh.color)}" flood-opacity="${U.n(sh.o, 3)}"/></filter>`
      );
      attrs += ` filter="url(#${f})"`;
    }
    let out = `<g${attrs}>${inner}</g>`;
    if (isRoot && n.clip && ctx.comp.clip) {
      if (!ctx.clipId) {
        ctx.clipId = ctx.id('clip');
        const c = ctx.comp.clip;
        ctx.defs.push(`<clipPath id="${ctx.clipId}"><circle cx="${U.n(c.cx)}" cy="${U.n(c.cy)}" r="${U.n(c.r)}"/></clipPath>`);
      }
      out = `<g clip-path="url(#${ctx.clipId})">${out}</g>`;
    }
    return out;
  }

  /**
   * Genera el SVG de una composición.
   * opts: {prefix, width, height, palette (sustituye la paleta), exportar (sin data-id), extra (contenido extra al final)}
   */
  LT.render = (comp, opts = {}) => {
    const c = opts.palette ? Object.assign({}, comp, { palette: opts.palette }) : comp;
    const ctx = makeCtx(c, opts.prefix || 'lt');
    let body = '';
    if (c.bg && c.bg !== 'none') body += `<rect width="${c.w}" height="${c.h}" fill="${ctx.paint(c.bg)}"/>`;
    body += c.layers.map((n) => renderNode(n, ctx, true)).join('');
    if (opts.exportar) body = body.replace(/ data-id="[^"]*"/g, '');
    const size = (opts.width ? ` width="${opts.width}"` : '') + (opts.height ? ` height="${opts.height}"` : '');
    const defs = ctx.defs.length ? `<defs>${ctx.defs.join('')}</defs>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${c.w} ${c.h}"${size}>${defs}${body}${opts.extra || ''}</svg>`;
  };
})(window.LT);
