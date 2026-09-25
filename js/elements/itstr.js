/* Elementos del logo del Instituto Tecnológico Superior de Tepexi de Rodríguez.
   Cerro, textos, libro, cable, suelo y monograma TR vienen vectorizados de referencias/itstr.webp;
   acueducto, cactus, agave, palma, pez, ladrillos y engrane se dibujan de forma procedural. */
(function (LT) {
  'use strict';
  const U = LT.util;
  const S = LT.shapes;
  const G = 'ITSTR';
  const path = (fill, d) => `<path fill="${fill}" fill-rule="evenodd" d="${d}"/>`;
  const one = (id, name, part, slotName, def) =>
    LT.defineElement({
      id,
      group: G,
      name,
      pivot: LT.trCenter('itstr', [part]),
      slots: [{ id: 'color', name: slotName, def }],
      render: (p, c) => path(c('color'), LT.tr('itstr', part)),
    });

  one('itstr.cerro', 'Cerro', 'montana', 'Cerro', '#672235');
  one('itstr.texto', 'Texto del instituto (original)', 'texto', 'Texto', '#672235');
  one('itstr.cable', 'Cable', 'cable', 'Cable', '#111111');
  one('itstr.tr', 'Monograma TR', 'tr', 'Monograma', '#183069');

  LT.defineElement({
    id: 'itstr.libro',
    group: G,
    name: 'Libro (ciencia y tecnología)',
    pivot: LT.trCenter('itstr', ['libro_borde']),
    slots: [
      { id: 'borde', name: 'Borde', def: '#ffffff' },
      { id: 'tapa', name: 'Tapa', def: '#183069' },
      { id: 'hojas', name: 'Hojas', def: '#ffffff' },
      { id: 'iconos', name: 'Íconos', def: '#000000' },
    ],
    render: (p, c) =>
      path(c('borde'), LT.tr('itstr', 'libro_borde')) +
      path(c('tapa'), LT.tr('itstr', 'libro_tapa')) +
      path(c('hojas'), LT.tr('itstr', 'libro_hojas')) +
      path(c('iconos'), LT.tr('itstr', 'libro_iconos')),
  });

  LT.defineElement({
    id: 'itstr.suelo',
    group: G,
    name: 'Línea de suelo',
    pivot: [216, 571],
    slots: [{ id: 'color', name: 'Suelo', def: '#111111' }],
    params: [{ id: 'grosor', name: 'Grosor', type: 'range', min: 0.5, max: 12, step: 0.1, def: 4 }],
    render: (p, c) =>
      `<path fill="none" stroke="${c('color')}" stroke-width="${U.n(p.grosor)}" stroke-linecap="round" stroke-linejoin="round" ` +
      'd="M118 557C140 553 170 553 198 558S240 564 265 561S298 556 304 558L313 570M220 566C236 574 250 582 264 589"/>',
  });

  // ------------------------------------------------------------ acueducto
  LT.defineElement({
    id: 'itstr.acueducto',
    group: G,
    name: 'Acueducto / puente',
    pivot: [518, 228],
    slots: [
      { id: 'relleno', name: 'Relleno', def: '#fed59a' },
      { id: 'lineas', name: 'Líneas', def: '#2b2118' },
    ],
    params: [{ id: 'grosor', name: 'Grosor de línea', type: 'range', min: 0, max: 8, step: 0.1, def: 2.6 }],
    render: (p, c) => {
      const st = `stroke="${c('lineas')}" stroke-width="${U.n(p.grosor)}" stroke-linejoin="round"`;
      return (
        `<g fill="${c('relleno')}" ${st}>` +
        '<path d="M432.5 238L472.5 238L466 294L439 294Z"/>' +
        '<path d="M562.5 238L600 238L595 298L572.5 298Z"/>' +
        '<path d="M391 200L645 200L615 239L417.5 239Z"/>' +
        '<path d="M428.5 160H472.5V200H428.5Z"/><path d="M561 160H606V200H561Z"/>' +
        '</g>' +
        `<path fill="none" ${st} stroke-linecap="round" d="M397.5 182.5H642.5M397.5 182.5V200M450.5 182.5V200M496 182.5V200M541 182.5V200M583.5 182.5V200M630 182.5V200"/>`
      );
    },
  });

  // ------------------------------------------------------------ cactus
  LT.defineElement({
    id: 'itstr.cactus',
    group: G,
    name: 'Cactus (órgano)',
    pivot: [251, 440],
    slots: [
      { id: 'cuerpo', name: 'Cuerpo', def: '#4f8270' },
      { id: 'lineas', name: 'Líneas y espinas', def: '#1f3a33' },
    ],
    params: [
      { id: 'costillas', name: 'Costillas', type: 'range', min: 0, max: 7, step: 1, def: 3 },
      { id: 'espinas', name: 'Espinas', type: 'bool', def: true },
    ],
    render: (p, c) => {
      const x0 = 221, x1 = 281, R = 30, cx = 251, ty = 350, bot = 556;
      const L = c('lineas');
      let s = `<path fill="${c('cuerpo')}" stroke="${L}" stroke-width="2.2" d="M${x0} ${bot}V${ty}A${R} ${R} 0 0 1 ${x1} ${ty}V${bot}Z"/>`;
      let ribs = '', spines = '';
      const n = p.costillas;
      for (let i = 1; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / (n + 1);
        const top = ty - Math.sqrt(Math.max(0, R * R - (x - cx) ** 2)) + 7;
        ribs += `M${U.n(x)} ${U.n(top)}V${bot}`;
        if (p.espinas) for (let y = top + 8 + (i % 2) * 6; y < bot - 4; y += 13) spines += `M${U.n(x - 3)} ${U.n(y)}h6`;
      }
      if (p.espinas) {
        for (let y = ty - 4; y < bot - 4; y += 13) spines += `M${x0 - 5} ${U.n(y)}h6M${x1 - 1} ${U.n(y + 6)}h6`;
        for (let a = -60; a <= 60; a += 30) {
          const q1 = U.polar(cx, ty, R - 1, a), q2 = U.polar(cx, ty, R + 5, a);
          spines += `M${U.pt(q1)}L${U.pt(q2)}`;
        }
      }
      if (ribs) s += `<path fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round" d="${ribs}"/>`;
      if (spines) s += `<path fill="none" stroke="${L}" stroke-width="1.8" stroke-linecap="round" d="${spines}"/>`;
      return s;
    },
  });

  // ------------------------------------------------------------ hojas (agave y palma)
  function leaf(bx, by, ang, len, w, bend) {
    const a = U.rad(ang);
    const ux = Math.sin(a), uy = -Math.cos(a), nx = -uy, ny = ux;
    const tx = bx + ux * len + nx * bend, ty = by + uy * len + ny * bend;
    const m = 0.45;
    const c1 = [bx + ux * len * m + nx * (w + bend * m), by + uy * len * m + ny * (w + bend * m)];
    const c2 = [bx + ux * len * m - nx * (w - bend * m), by + uy * len * m - ny * (w - bend * m)];
    return `M${U.n(bx)} ${U.n(by)}Q${U.pt(c1)} ${U.n(tx)} ${U.n(ty)}Q${U.pt(c2)} ${U.n(bx)} ${U.n(by)}Z`;
  }

  LT.defineElement({
    id: 'itstr.agave',
    group: G,
    name: 'Agave (sotol)',
    pivot: [184, 530],
    slots: [
      { id: 'hojas', name: 'Hojas', def: '#86a597' },
      { id: 'brillo', name: 'Brillo', def: '#d6e4dc' },
    ],
    params: [
      { id: 'hojas', name: 'Número de hojas', type: 'range', min: 5, max: 90, step: 1, def: 46 },
      { id: 'semilla', name: 'Variación', type: 'range', min: 1, max: 99, step: 1, def: 7 },
    ],
    render: (p, c) => {
      const rnd = U.rng(p.semilla * 7919);
      const bx = 184, by = 556;
      let d = '', hi = '';
      for (let i = 0; i < p.hojas; i++) {
        const t = p.hojas === 1 ? 0.5 : i / (p.hojas - 1);
        const ang = -148 + 296 * t + (rnd() - 0.5) * 9;
        const len = (86 - Math.abs(ang) * 0.25) * (0.8 + rnd() * 0.3);
        const bend = (ang / 148) * 5;
        d += leaf(bx, by, ang, len, 2.3, bend);
        if (i % 2 === 0) {
          const a = U.rad(ang);
          hi += `M${U.n(bx + Math.sin(a) * 10)} ${U.n(by - Math.cos(a) * 10)}L${U.n(bx + Math.sin(a) * len * 0.8)} ${U.n(by - Math.cos(a) * len * 0.8)}`;
        }
      }
      return `<path fill="${c('hojas')}" d="${d}"/><path fill="none" stroke="${c('brillo')}" stroke-width="0.9" stroke-linecap="round" d="${hi}"/>`;
    },
  });

  LT.defineElement({
    id: 'itstr.palma',
    group: G,
    name: 'Palma',
    pivot: [218, 645],
    slots: [
      { id: 'hojas', name: 'Hojas', def: '#3f6d16' },
      { id: 'brillo', name: 'Brillo', def: '#7db43e' },
    ],
    params: [{ id: 'hojas', name: 'Número de hojas', type: 'range', min: 3, max: 25, step: 1, def: 13 }],
    render: (p, c) => {
      const bx = 218, by = 692;
      let d = '', l = '';
      for (let i = 0; i < p.hojas; i++) {
        const t = p.hojas === 1 ? 0.5 : i / (p.hojas - 1);
        const ang = -72 + 144 * t;
        const len = 100 - Math.abs(ang) * 0.36;
        const bend = (ang / 72) * 7;
        d += leaf(bx, by, ang, len, 8.5, bend);
        l += leaf(bx, by - 3, ang, len * 0.86, 3.4, bend * 0.86);
      }
      return `<path fill="${c('hojas')}" d="${d}"/><path fill="${c('brillo')}" d="${l}"/>`;
    },
  });

  // ------------------------------------------------------------ pez fósil
  LT.defineElement({
    id: 'itstr.pez',
    group: G,
    name: 'Pez fósil',
    pivot: [803, 544],
    slots: [
      { id: 'relleno', name: 'Relleno', def: '#f3ad76' },
      { id: 'lineas', name: 'Líneas', def: '#b8683e' },
      { id: 'ojo', name: 'Ojo', def: '#ffffff' },
    ],
    params: [{ id: 'espinas', name: 'Espinas', type: 'range', min: 4, max: 24, step: 1, def: 13 }],
    render: (p, c) => {
      const y0 = 543, F = c('relleno'), L = c('lineas');
      let ribs = `M764 ${y0}H857`;
      const n = p.espinas, x0 = 770, x1 = 850;
      for (let i = 0; i < n; i++) {
        const x = x0 + ((x1 - x0) * i) / Math.max(1, n - 1);
        const h = 22 - (12 * i) / Math.max(1, n - 1);
        ribs += `M${U.n(x)} ${y0}Q${U.n(x + 2)} ${U.n(y0 - h / 2)} ${U.n(x - 2)} ${U.n(y0 - h)}`;
        ribs += `M${U.n(x)} ${y0}Q${U.n(x + 2)} ${U.n(y0 + h / 2)} ${U.n(x - 2)} ${U.n(y0 + h * 0.95)}`;
      }
      return (
        `<path fill="none" stroke="${L}" stroke-width="4.8" stroke-linecap="round" d="${ribs}"/>` +
        `<path fill="none" stroke="${F}" stroke-width="2.6" stroke-linecap="round" d="${ribs}"/>` +
        `<path fill="${F}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round" d="M852 543L867 533L884 523Q878 537 872 543Q878 549 885 564L867 553Z"/>` +
        `<path fill="${L}" d="${S.circle(858, 540, 1.5)}${S.circle(862, 546, 1.5)}${S.circle(866, 540, 1.3)}"/>` +
        `<path fill="${F}" stroke="${L}" stroke-width="1.6" stroke-linejoin="round" d="M721 547C727 535 740 527 750 528L754 524L759 529C766 537 767 556 760 563C745 568 727 559 721 547Z"/>` +
        `<path fill="none" stroke="${L}" stroke-width="1.5" stroke-linecap="round" d="M755 532Q749 546 755 560"/>` +
        `<ellipse cx="738" cy="541" rx="4" ry="2.4" fill="${c('ojo')}"/>`
      );
    },
  });

  // ------------------------------------------------------------ ladrillos
  LT.defineElement({
    id: 'itstr.ladrillos',
    group: G,
    name: 'Ladrillos',
    pivot: [790, 470],
    slots: [
      { id: 'arriba', name: 'Cara superior', def: '#e5362d' },
      { id: 'frente', name: 'Cara frontal', def: '#c3261f' },
      { id: 'lado', name: 'Cara lateral', def: '#8f1d18' },
      { id: 'borde', name: 'Borde', def: '#3b1411' },
    ],
    render: (p, c) => {
      const b = (cx, cy, L, W, H, a) => {
        const f = S.isoBox(cx, cy, L, W, H, a, 0.9);
        return `<path fill="${c('frente')}" d="${f.a}"/><path fill="${c('lado')}" d="${f.b}"/><path fill="${c('arriba')}" d="${f.top}"/>`;
      };
      return `<g stroke="${c('borde')}" stroke-width="2" stroke-linejoin="round">${b(727, 492, 42, 28, 8, 32)}${b(848, 452, 38, 26, 9, 22)}</g>`;
    },
  });

  // ------------------------------------------------------------ engrane con marcas
  LT.defineElement({
    id: 'itstr.engrane',
    group: G,
    name: 'Engrane',
    pivot: [509, 717.5],
    slots: [
      { id: 'cuerpo', name: 'Engrane', def: '#d6d0d2' },
      { id: 'marcas', name: 'Marcas', def: '#183069' },
    ],
    render: (p, c) =>
      `<path fill="${c('cuerpo')}" fill-rule="evenodd" d="${S.gear({ cx: 509, cy: 717.5, teeth: 12, rTip: 121, rRoot: 100, rHole: 79, tip: 0.42, base: 0.6, phase: 0 })}"/>` +
      `<path fill="${c('marcas')}" d="${S.marks(509, 717.5, 89.5, 11.5, 4, 0)}"/>`,
  });
})(window.LT);
