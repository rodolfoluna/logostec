/* Plantillas: los tres logos base, la combinación "Logosistemas" y su variante de color "prop2".
   Cada composición define una paleta de colores con nombre (tokens @id) y variantes de esa paleta. */
(function (LT) {
  'use strict';
  const U = LT.util;
  const N = LT.node;

  /** Crea un nodo de elemento. colors: {slot: '@token' | '#hex' | gradiente}. */
  const el = (id, colors = {}, extra = {}) => N.element(id, Object.assign({ colors, params: extra.params || {} }, extra));

  /** Ubica un nodo para que el punto src (espacio del elemento) caiga en dst, con escala s y giro r. */
  function fit(node, src, dst, s = 1, r = 0) {
    const [px, py] = N.pivot(node);
    const a = U.rad(r);
    const vx = (src[0] - px) * s, vy = (src[1] - py) * s;
    node.s = s;
    node.r = r;
    node.x = dst[0] - px - (vx * Math.cos(a) - vy * Math.sin(a));
    node.y = dst[1] - py - (vx * Math.sin(a) + vy * Math.cos(a));
    return node;
  }
  LT.fit = fit;

  const lin = (a, b, ang = 180, extra = {}) => Object.assign({ g: 'lineal', a, b, ang }, extra);
  const rad = (a, b, cx = 0.5, cy = 0.5, r = 0.6, extra = {}) => Object.assign({ g: 'radial', a, b, cx, cy, r }, extra);
  const pal = (list) => list.map(([id, name, color]) => ({ id, name, color }));
  const base = (name, palette, layers, extra = {}) =>
    Object.assign({ version: 1, name, w: 1000, h: 1000, bg: null, clip: { cx: 500, cy: 500, r: 470 }, palette, variants: [], layers }, extra);

  // ------------------------------------------------------------------ Sistemas
  function sistemas() {
    return base(
      'Sistemas',
      pal([
        ['marino', 'Azul marino', '#03234d'],
        ['celeste', 'Celeste', '#4e8ad8'],
        ['blanco', 'Blanco', '#ffffff'],
      ]),
      [
        el('sis.silueta', { color: '@marino' }),
        el('sis.anillo', { color: '@blanco' }),
        el('sis.gota', { borde: '@blanco', relleno: '@celeste' }),
        el('sis.usb', { color: '@blanco' }),
        el('sis.simbolo', { color: '@blanco' }),
        el('sis.texto', { color: '@blanco' }),
      ],
      {
        ref: { src: 'referencias/sistemas.webp', x: 0, y: 40.75, w: 1000, h: 918.5 },
        variants: [
          { name: 'Original', colors: { marino: '#03234d', celeste: '#4e8ad8', blanco: '#ffffff' } },
          { name: 'Guinda', colors: { marino: '#4a1426', celeste: '#a3304f', blanco: '#ffffff' } },
          { name: 'Azul TecNM', colors: { marino: '#1b396a', celeste: '#8fa9d6', blanco: '#ffffff' } },
          { name: 'Guinda y azul', colors: { marino: '#1b396a', celeste: '#7b1e3c', blanco: '#ffffff' } },
          { name: 'Monocromo', colors: { marino: '#1d1d1f', celeste: '#8a8a8f', blanco: '#ffffff' } },
          { name: 'Negativo', colors: { marino: '#ffffff', celeste: '#4e8ad8', blanco: '#03234d' } },
        ],
      }
    );
  }

  // ------------------------------------------------------------------ ITSTR
  function itstr() {
    return base(
      'ITSTR',
      pal([
        ['guinda', 'Guinda', '#672235'],
        ['azul', 'Azul', '#183069'],
        ['blanco', 'Blanco', '#ffffff'],
        ['arena', 'Arena', '#fed59a'],
        ['verde', 'Verde cactus', '#4f8270'],
        ['salvia', 'Verde salvia', '#86a597'],
        ['palma', 'Verde palma', '#3f6d16'],
        ['rojo', 'Rojo ladrillo', '#e5362d'],
        ['naranja', 'Naranja', '#f3ad76'],
        ['gris', 'Gris', '#d6d0d2'],
        ['tinta', 'Tinta', '#111111'],
      ]),
      [
        el('forma.circulo', { relleno: '@blanco', borde: '@azul' }, { name: 'Disco y borde', params: { radio: 494, grosor: 12 } }),
        el('forma.arco', { color: '@guinda' }, { name: 'Anillo interior', y: 0.5, params: { radio: 393.5, grosor: 16 } }),
        el('forma.texto_arco', { relleno: '@guinda', contorno: '@blanco' }, {
          name: 'Texto superior', y: 0.5,
          params: { texto: 'INSTITUTO TECNOLÓGICO SUPERIOR', fuente: 'montserrat-900', tamano: 69, radio: 443, angulo: 1.5, direccion: 'arriba', espaciado: -15 },
        }),
        el('forma.texto_arco', { relleno: '@guinda', contorno: '@blanco' }, {
          name: 'Texto inferior', y: 0.5,
          params: { texto: 'DE TEPEXI DE RODRÍGUEZ', fuente: 'montserrat-900', tamano: 64, radio: 442, angulo: 180, direccion: 'abajo', espaciado: -45 },
        }),
        el('itstr.acueducto', { relleno: '@arena', lineas: '#2b2118' }),
        el('itstr.cerro', { color: '@guinda' }),
        el('itstr.cactus', { cuerpo: '@verde', lineas: '#1f3a33' }),
        el('itstr.agave', { hojas: '@salvia', brillo: '#dfeae4' }),
        el('itstr.suelo', { color: '@tinta' }),
        el('itstr.palma', { hojas: '@palma', brillo: '#7db43e' }),
        el('itstr.cable', { color: '@tinta' }),
        el('itstr.ladrillos', { arriba: '@rojo', frente: '#c3261f', lado: '#8f1d18', borde: '#3b1411' }),
        el('itstr.pez', { relleno: '@naranja', lineas: '#b8683e', ojo: '@blanco' }),
        el('itstr.libro', { borde: '@blanco', tapa: '@azul', hojas: '@blanco', iconos: '@tinta' }),
        el('itstr.engrane', { cuerpo: '@gris', marcas: '@azul' }),
        el('itstr.tr', { color: '@azul' }),
      ],
      {
        ref: { src: 'referencias/itstr.webp', x: 0, y: 0, w: 1000, h: 1000 },
        variants: [
          {
            name: 'Original',
            colors: { guinda: '#672235', azul: '#183069', blanco: '#ffffff', arena: '#fed59a', verde: '#4f8270', salvia: '#86a597', palma: '#3f6d16', rojo: '#e5362d', naranja: '#f3ad76', gris: '#d6d0d2', tinta: '#111111' },
          },
          {
            name: 'Monocromo guinda',
            colors: { guinda: '#672235', azul: '#672235', blanco: '#ffffff', arena: '#e9c3cc', verde: '#8c3a50', salvia: '#c98a9b', palma: '#7a2c42', rojo: '#b0425c', naranja: '#e3a3b2', gris: '#e2d2d6', tinta: '#3d1320' },
          },
          {
            name: 'Azul institucional',
            colors: { guinda: '#1b396a', azul: '#0e2449', blanco: '#ffffff', arena: '#c9d8f0', verde: '#3f6cb3', salvia: '#8fa9d6', palma: '#2c5aa0', rojo: '#5b86cf', naranja: '#a9c0e6', gris: '#dde3ec', tinta: '#0b1a33' },
          },
          {
            name: 'Guinda y azul',
            colors: { guinda: '#7b1e3c', azul: '#1b396a', blanco: '#ffffff', arena: '#f2d9a0', verde: '#3f6cb3', salvia: '#8fa9d6', palma: '#1b396a', rojo: '#c8283c', naranja: '#f0b08a', gris: '#d8dbe2', tinta: '#111111' },
          },
        ],
      }
    );
  }

  // ------------------------------------------------------------------ TecNM
  function tecnm() {
    return base(
      'TecNM',
      pal([['azul', 'Azul TecNM', '#1b396a']]),
      [
        el('tecnm.engrane', { color: '@azul' }),
        el('tecnm.guerrero', { color: '@azul' }),
        el('tecnm.texto1', { color: '@azul' }),
        el('tecnm.texto2', { color: '@azul' }),
      ],
      {
        ref: { src: 'referencias/tecnm.png', x: 0, y: 23, w: 1000, h: 1100.6 },
        variants: [
          { name: 'Azul oficial', colors: { azul: '#1b396a' } },
          { name: 'Guinda', colors: { azul: '#6d1a36' } },
          { name: 'Negro', colors: { azul: '#111111' } },
          { name: 'Gris', colors: { azul: '#7a7f87' } },
          { name: 'Blanco', colors: { azul: '#ffffff' } },
        ],
      }
    );
  }

  // ------------------------------------------------------------------ Logosistemas (combinación)
  const LS_AZUL = {
    blanco: '#ffffff', fondo_a: '#ffffff', fondo_b: '#6f98e0', principal: '#1553b8', principal_claro: '#4a8ef0',
    marco: '#0d2f7a', acento: '#5c95e6', onda: '#12449c', escena: '#6389cf', escena_claro: '#d3e0f5',
    escena_osc: '#2f5fb5', guerrero: '#b9cbee', metal: '#7f8997', metal_claro: '#f2f4f7', monograma: '#0d2f7a',
    filete: '#ffffff', aro: '#0d2f7a', contorno: '#0d2f7a',
  };
  const LS_PROP2 = {
    blanco: '#ffffff', fondo_a: '#ffffff', fondo_b: '#b9c4ea', principal: '#6b1733', principal_claro: '#b3304f',
    marco: '#1e2c6b', acento: '#d0283c', onda: '#1e2c6b', escena: '#3653a8', escena_claro: '#aebde6',
    escena_osc: '#1e2c6b', guerrero: '#d0606e', metal: '#8c929b', metal_claro: '#f3f4f6', monograma: '#1e2c6b',
    filete: '#d0283c', aro: '#b3304f', contorno: '#6b1733',
  };
  const LS_NAMES = {
    blanco: 'Blanco', fondo_a: 'Fondo (centro)', fondo_b: 'Fondo (orilla)', principal: 'Principal', principal_claro: 'Principal claro',
    marco: 'Marco', acento: 'Acento', onda: 'Onda', escena: 'Escena', escena_claro: 'Escena clara', escena_osc: 'Escena oscura',
    guerrero: 'Guerrero', metal: 'Metal', metal_claro: 'Metal claro', monograma: 'Monograma TR', filete: 'Filete', aro: 'Aro del TR', contorno: 'Contorno del texto',
  };

  function logosistemas() {
    const place = (id, colors, src, dst, s, r, extra) => fit(el(id, colors, extra), src, dst, s, r);
    const at = (node, cx, cy) => Object.assign(node, { x: cx - 500, y: cy - 500 });

    const escena = N.group('Escena de fondo', [
      at(el('forma.colinas', { color: lin('@escena_osc', '@escena_osc', 180, { ob: 0.1 }) }, { o: 0.8, params: { ancho: 420, alto: 230, picos: 4, relieve: 70, semilla: 5 } }), 500, 340),
      place('itstr.acueducto', { relleno: '@escena_claro', lineas: '@escena' }, [391, 200], [330, 150], 1.32, 0, { params: { grosor: 2.2 } }),
      at(el('forma.muro', { color: '@escena' }, { o: 0.35, params: { ancho: 95, alto: 160, filas: 8, columnas: 3, junta: 5 } }), 100, 515),
      place('itstr.cactus', { cuerpo: '@escena', lineas: '@escena_osc' }, [251, 320], [215, 195], 1),
      place('itstr.agave', { hojas: '@escena_claro', brillo: '@blanco' }, [187, 551], [135, 440], 1),
      place('tecnm.emblema', { engrane: lin('@marco', '@marco', 180, { ob: 0.25 }), guerrero: '@guerrero' }, [435, 238.5], [712, 257], 0.96, 0, { o: 0.95 }),
    ], { clip: true });

    const gota = place('sis.gota', { borde: '@blanco', relleno: lin('@principal_claro', '@principal', 150) }, [285, 493], [365, 520], 1.17, 5);
    gota.shadow = { dx: 0, dy: 8, blur: 9, color: '#000000', o: 0.28 };
    const emblema = N.group('Emblema Sistemas', [
      place('sis.usb', { color: '@blanco' }, [685, 455.75], [792, 512], 0.6, 6),
      gota,
      place('sis.simbolo', { color: '@blanco' }, [312, 489.3], [388, 512], 1.3),
    ]);

    const engrane = N.group('Engrane TR', [
      at(el('forma.engrane', { cuerpo: lin('@metal_claro', '@metal', 160), marcas: '@marco' }, {
        params: { dientes: 10, radio: 118, raiz: 99, hueco: 1, punta: 0.46, base: 0.64, fase: 18 },
        shadow: { dx: 0, dy: 6, blur: 7, color: '#000000', o: 0.3 },
      }), 690, 690),
      at(el('forma.circulo', { relleno: rad('@blanco', '@metal_claro', 0.4, 0.35, 0.7), borde: '@aro' }, { params: { radio: 76, grosor: 10 } }), 690, 690),
      place('itstr.tr', { color: '@monograma' }, [508, 736], [690, 692], 0.86),
    ]);

    const texto = at(el('forma.texto_arco', { relleno: '@blanco', contorno: '@contorno' }, {
      name: 'Texto SISTEMAS',
      params: { texto: 'SISTEMAS', fuente: 'montserrat-800', tamano: 84, radio: 900, angulo: 180, direccion: 'abajo', espaciado: 50, contorno: 9 },
      shadow: { dx: 0, dy: 5, blur: 5, color: '#000000', o: 0.35 },
    }), 482, -88);

    return base(
      'Logosistemas',
      Object.keys(LS_AZUL).map((id) => ({ id, name: LS_NAMES[id], color: LS_AZUL[id] })),
      [
        el('forma.circulo', { relleno: rad('@fondo_a', '@fondo_b', 0.4, 0.3, 0.75) }, { name: 'Esfera', params: { radio: 472 } }),
        escena,
        el('forma.onda', { color: '@acento' }, { name: 'Onda 1', clip: true, params: { radio: 474, inicio: 96, fin: 262, grosor: 150 } }),
        el('forma.onda', { color: '@blanco' }, { name: 'Onda 2', clip: true, params: { radio: 474, inicio: 97, fin: 261, grosor: 132 } }),
        el('forma.onda', { color: lin('@principal', '@onda', 180) }, { name: 'Onda 3', clip: true, params: { radio: 474, inicio: 98, fin: 260, grosor: 118 } }),
        el('forma.arco', { color: '@filete' }, { name: 'Filete interior', params: { radio: 469, grosor: 6 } }),
        el('forma.arco', { color: lin('@marco', '@principal', 200) }, { name: 'Marco', params: { radio: 482, grosor: 18 } }),
        emblema,
        engrane,
        texto,
      ],
      {
        ref: { src: 'referencias/logosistemas.webp', x: 0, y: 0, w: 1000, h: 1000 },
        clip: { cx: 500, cy: 500, r: 472 },
        variants: [
          { name: 'Azul (Logosistemas)', colors: LS_AZUL },
          { name: 'Guinda y azul (prop2)', colors: LS_PROP2 },
          {
            name: 'Guinda',
            colors: Object.assign({}, LS_PROP2, { marco: '#4a1426', onda: '#4a1426', escena: '#8c3a50', escena_claro: '#e3c2cb', escena_osc: '#5c1a2e', guerrero: '#c98a9b', acento: '#b0304f', fondo_b: '#ecd3da', monograma: '#4a1426', aro: '#4a1426', filete: '#ffffff', contorno: '#4a1426' }),
          },
          {
            name: 'Noche',
            colors: Object.assign({}, LS_AZUL, { fondo_a: '#27456f', fondo_b: '#0b1a33', escena_claro: '#4d6d9c', escena: '#35598f', guerrero: '#6f8fc2', principal: '#0f3f8f', marco: '#050f24', onda: '#050f24', contorno: '#050f24' }),
          },
        ],
      }
    );
  }

  function applyVariant(comp, i) {
    const v = comp.variants[i];
    if (!v) return comp;
    for (const t of comp.palette) if (v.colors[t.id]) t.color = v.colors[t.id];
    return comp;
  }
  LT.applyVariant = applyVariant;

  LT.presets = [
    { id: 'sistemas', name: 'Sistemas', build: sistemas },
    { id: 'itstr', name: 'ITSTR', build: itstr },
    { id: 'tecnm', name: 'TecNM', build: tecnm },
    { id: 'logosistemas', name: 'Logosistemas', build: logosistemas },
    {
      id: 'prop2',
      name: 'prop2',
      build: () => {
        const c = applyVariant(logosistemas(), 1);
        c.name = 'prop2';
        c.ref = { src: 'referencias/prop2.png', x: 7.8, y: 0, w: 984.4, h: 1000 };
        return c;
      },
    },
  ];
})(window.LT);
