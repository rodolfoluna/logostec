/* Formas genéricas y procedurales para armar combinaciones (todas centradas en 500,500). */
(function (LT) {
  'use strict';
  const U = LT.util;
  const S = LT.shapes;
  const G = 'Formas y texto';

  const fontParam = (def) => ({
    id: 'fuente',
    name: 'Fuente',
    type: 'select',
    def,
    options: () => LT.text.fontList().map((f) => [f.id, f.name]),
  });

  function textGroup(p, c, ctx, glyphs) {
    const own = p.contorno > 0;
    const w = own ? p.contorno : ctx.layerStrokeW;
    const stroke = own ? ` stroke="${c('contorno')}" stroke-linejoin="round" paint-order="stroke"` : '';
    return `<g fill="${c('relleno')}"${stroke}>${glyphs(w)}</g>`;
  }

  LT.defineElement({
    id: 'forma.texto',
    group: G,
    name: 'Texto',
    pivot: [500, 500],
    slots: [
      { id: 'relleno', name: 'Relleno', def: '#ffffff' },
      { id: 'contorno', name: 'Contorno', def: '#0b2a5b' },
    ],
    params: [
      { id: 'texto', name: 'Texto', type: 'text', def: 'SISTEMAS' },
      fontParam('montserrat-800'),
      { id: 'tamano', name: 'Tamaño', type: 'range', min: 10, max: 400, step: 1, def: 110 },
      { id: 'espaciado', name: 'Espaciado', type: 'range', min: -100, max: 600, step: 5, def: 0 },
      { id: 'contorno', name: 'Grosor contorno', type: 'range', min: 0, max: 40, step: 0.5, def: 0 },
    ],
    render: (p, c, ctx) =>
      textGroup(p, c, ctx, (w) =>
        LT.text.line({ text: p.texto, font: p.fuente, size: p.tamano, tracking: p.espaciado, cx: 500, cy: 500, strokeW: w })
      ),
  });

  LT.defineElement({
    id: 'forma.texto_arco',
    group: G,
    name: 'Texto en arco',
    pivot: [500, 500],
    slots: [
      { id: 'relleno', name: 'Relleno', def: '#672235' },
      { id: 'contorno', name: 'Contorno', def: '#ffffff' },
    ],
    params: [
      { id: 'texto', name: 'Texto', type: 'text', def: 'INSTITUTO TECNOLÓGICO SUPERIOR' },
      fontParam('montserrat-900'),
      { id: 'tamano', name: 'Tamaño', type: 'range', min: 10, max: 300, step: 1, def: 72 },
      { id: 'radio', name: 'Radio', type: 'range', min: 20, max: 700, step: 1, def: 445 },
      { id: 'angulo', name: 'Posición (°)', type: 'range', min: -180, max: 360, step: 1, def: 0 },
      { id: 'direccion', name: 'Dirección', type: 'select', def: 'arriba', options: [['arriba', 'Arriba (hacia afuera)'], ['abajo', 'Abajo (hacia el centro)']] },
      { id: 'espaciado', name: 'Espaciado', type: 'range', min: -100, max: 600, step: 5, def: 0 },
      { id: 'contorno', name: 'Grosor contorno', type: 'range', min: 0, max: 40, step: 0.5, def: 0 },
    ],
    render: (p, c, ctx) =>
      textGroup(p, c, ctx, (w) =>
        LT.text.arc({
          text: p.texto, font: p.fuente, size: p.tamano, tracking: p.espaciado,
          cx: 500, cy: 500, r: p.radio, angle: p.angulo, dir: p.direccion, strokeW: w,
        })
      ),
  });

  LT.defineElement({
    id: 'forma.circulo',
    group: G,
    name: 'Círculo',
    pivot: [500, 500],
    slots: [
      { id: 'relleno', name: 'Relleno', def: '#ffffff' },
      { id: 'borde', name: 'Borde', def: '#1b396a' },
    ],
    params: [
      { id: 'radio', name: 'Radio', type: 'range', min: 1, max: 700, step: 0.5, def: 480 },
      { id: 'grosor', name: 'Grosor del borde', type: 'range', min: 0, max: 120, step: 0.5, def: 0 },
    ],
    render: (p, c) =>
      `<circle cx="500" cy="500" r="${U.n(p.radio)}" fill="${c('relleno')}"` +
      (p.grosor > 0 ? ` stroke="${c('borde')}" stroke-width="${U.n(p.grosor)}"` : '') + '/>',
  });

  LT.defineElement({
    id: 'forma.arco',
    group: G,
    name: 'Anillo / arco',
    pivot: [500, 500],
    slots: [{ id: 'color', name: 'Color', def: '#672235' }],
    params: [
      { id: 'radio', name: 'Radio', type: 'range', min: 1, max: 700, step: 0.5, def: 400 },
      { id: 'grosor', name: 'Grosor', type: 'range', min: 0.5, max: 200, step: 0.5, def: 16 },
      { id: 'inicio', name: 'Inicio (°)', type: 'range', min: -360, max: 360, step: 1, def: 0 },
      { id: 'fin', name: 'Fin (°)', type: 'range', min: -360, max: 720, step: 1, def: 360 },
      { id: 'redondo', name: 'Puntas redondas', type: 'bool', def: false },
    ],
    render: (p, c) =>
      `<path fill="none" stroke="${c('color')}" stroke-width="${U.n(p.grosor)}" stroke-linecap="${p.redondo ? 'round' : 'butt'}" d="${S.arcPath(500, 500, p.radio, p.inicio, p.fin)}"/>`,
  });

  LT.defineElement({
    id: 'forma.onda',
    group: G,
    name: 'Onda (media luna)',
    pivot: [500, 500],
    slots: [{ id: 'color', name: 'Color', def: '#1f5fbf' }],
    params: [
      { id: 'radio', name: 'Radio', type: 'range', min: 10, max: 700, step: 1, def: 440 },
      { id: 'inicio', name: 'Inicio (°)', type: 'range', min: -360, max: 360, step: 1, def: 110 },
      { id: 'fin', name: 'Fin (°)', type: 'range', min: -360, max: 720, step: 1, def: 250 },
      { id: 'grosor', name: 'Grosor', type: 'range', min: -200, max: 300, step: 1, def: 30 },
    ],
    render: (p, c) => `<path fill="${c('color')}" d="${S.crescent(500, 500, p.radio, p.inicio, p.fin, p.grosor)}"/>`,
  });

  LT.defineElement({
    id: 'forma.rect',
    group: G,
    name: 'Rectángulo',
    pivot: [500, 500],
    slots: [
      { id: 'relleno', name: 'Relleno', def: '#1b396a' },
      { id: 'borde', name: 'Borde', def: '#ffffff' },
    ],
    params: [
      { id: 'ancho', name: 'Ancho', type: 'range', min: 1, max: 1400, step: 1, def: 400 },
      { id: 'alto', name: 'Alto', type: 'range', min: 1, max: 1400, step: 1, def: 200 },
      { id: 'radio', name: 'Esquinas', type: 'range', min: 0, max: 400, step: 1, def: 30 },
      { id: 'grosor', name: 'Grosor del borde', type: 'range', min: 0, max: 80, step: 0.5, def: 0 },
    ],
    render: (p, c) =>
      `<rect x="${U.n(500 - p.ancho / 2)}" y="${U.n(500 - p.alto / 2)}" width="${U.n(p.ancho)}" height="${U.n(p.alto)}" rx="${U.n(p.radio)}" fill="${c('relleno')}"` +
      (p.grosor > 0 ? ` stroke="${c('borde')}" stroke-width="${U.n(p.grosor)}"` : '') + '/>',
  });

  LT.defineElement({
    id: 'forma.engrane',
    group: G,
    name: 'Engrane',
    pivot: [500, 500],
    slots: [
      { id: 'cuerpo', name: 'Engrane', def: '#c7ccd3' },
      { id: 'marcas', name: 'Marcas', def: '#1b396a' },
    ],
    params: [
      { id: 'dientes', name: 'Dientes', type: 'range', min: 4, max: 40, step: 1, def: 12 },
      { id: 'radio', name: 'Radio', type: 'range', min: 10, max: 600, step: 1, def: 121 },
      { id: 'raiz', name: 'Radio raíz', type: 'range', min: 5, max: 600, step: 1, def: 100 },
      { id: 'hueco', name: 'Radio del hueco', type: 'range', min: 0, max: 590, step: 1, def: 79 },
      { id: 'punta', name: 'Ancho punta', type: 'range', min: 0.05, max: 0.95, step: 0.01, def: 0.42 },
      { id: 'base', name: 'Ancho base', type: 'range', min: 0.05, max: 0.98, step: 0.01, def: 0.6 },
      { id: 'fase', name: 'Giro de dientes (°)', type: 'range', min: 0, max: 90, step: 0.5, def: 0 },
      { id: 'marcas', name: 'Marcas (triángulos)', type: 'range', min: 0, max: 12, step: 1, def: 0 },
    ],
    render: (p, c) => {
      let s = `<path fill="${c('cuerpo')}" fill-rule="evenodd" d="${S.gear({
        cx: 500, cy: 500, teeth: p.dientes, rTip: p.radio, rRoot: Math.min(p.raiz, p.radio), rHole: Math.min(p.hueco, p.raiz - 1),
        tip: p.punta, base: p.base, phase: p.fase,
      })}"/>`;
      if (p.marcas > 0) {
        const rm = (p.hueco + p.raiz) / 2;
        s += `<path fill="${c('marcas')}" d="${S.marks(500, 500, rm, (p.raiz - p.hueco) * 0.55, p.marcas, p.fase)}"/>`;
      }
      return s;
    },
  });

  LT.defineElement({
    id: 'forma.colinas',
    group: G,
    name: 'Colinas',
    pivot: [500, 500],
    slots: [{ id: 'color', name: 'Color', def: '#2f5fb5' }],
    params: [
      { id: 'ancho', name: 'Ancho', type: 'range', min: 40, max: 1200, step: 1, def: 360 },
      { id: 'alto', name: 'Alto', type: 'range', min: 10, max: 800, step: 1, def: 180 },
      { id: 'picos', name: 'Picos', type: 'range', min: 1, max: 12, step: 1, def: 4 },
      { id: 'relieve', name: 'Altura de picos', type: 'range', min: 5, max: 400, step: 1, def: 70 },
      { id: 'semilla', name: 'Variación', type: 'range', min: 1, max: 99, step: 1, def: 3 },
    ],
    render: (p, c) => {
      const rnd = U.rng(p.semilla * 104729);
      const x0 = 500 - p.ancho / 2, top = 500 - p.alto / 2, base = top + p.relieve, bot = 500 + p.alto / 2;
      const ws = Array.from({ length: p.picos }, () => 0.6 + rnd());
      const sum = ws.reduce((a, b) => a + b, 0);
      let x = x0;
      let d = `M${U.n(x0)} ${U.n(bot)}L${U.n(x0)} ${U.n(base)}`;
      ws.forEach((w) => {
        const wi = (w / sum) * p.ancho;
        const h = p.relieve * (0.55 + rnd() * 0.45) * 1.33;
        d += `C${U.n(x + wi * 0.12)} ${U.n(base - h)} ${U.n(x + wi * 0.88)} ${U.n(base - h)} ${U.n(x + wi)} ${U.n(base)}`;
        x += wi;
      });
      d += `L${U.n(x0 + p.ancho)} ${U.n(bot)}Z`;
      return `<path fill="${c('color')}" d="${d}"/>`;
    },
  });

  LT.defineElement({
    id: 'forma.muro',
    group: G,
    name: 'Muro de ladrillos',
    pivot: [500, 500],
    slots: [{ id: 'color', name: 'Ladrillos', def: '#9fb4dc' }],
    params: [
      { id: 'ancho', name: 'Ancho', type: 'range', min: 20, max: 1000, step: 1, def: 220 },
      { id: 'alto', name: 'Alto', type: 'range', min: 20, max: 1000, step: 1, def: 160 },
      { id: 'filas', name: 'Filas', type: 'range', min: 1, max: 40, step: 1, def: 8 },
      { id: 'columnas', name: 'Columnas', type: 'range', min: 1, max: 30, step: 1, def: 5 },
      { id: 'junta', name: 'Junta', type: 'range', min: 0, max: 20, step: 0.5, def: 4 },
    ],
    render: (p, c) => `<path fill="${c('color')}" d="${S.wall(500, 500, p.ancho, p.alto, p.filas, p.columnas, p.junta)}"/>`,
  });
})(window.LT);
