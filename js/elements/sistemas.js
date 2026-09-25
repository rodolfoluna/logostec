/* Elementos del logo de la carrera de Sistemas (vectorizados de referencias/sistemas.webp). */
(function (LT) {
  'use strict';
  const G = 'Sistemas';
  const path = (fill, d) => `<path fill="${fill}" fill-rule="evenodd" d="${d}"/>`;
  const one = (id, name, part, slotName, def) =>
    LT.defineElement({
      id,
      group: G,
      name,
      pivot: LT.trCenter('sistemas', [part]),
      slots: [{ id: 'color', name: slotName, def }],
      render: (p, c) => path(c('color'), LT.tr('sistemas', part)),
    });

  one('sis.silueta', 'Fondo (silueta)', 'silueta', 'Fondo', '#03234d');
  one('sis.anillo', 'Anillo en C', 'anillo', 'Anillo', '#ffffff');

  LT.defineElement({
    id: 'sis.gota',
    group: G,
    name: 'Gota',
    pivot: LT.trCenter('sistemas', ['gota_borde']),
    slots: [
      { id: 'borde', name: 'Borde', def: '#ffffff' },
      { id: 'relleno', name: 'Relleno', def: '#4e8ad8' },
    ],
    render: (p, c) => path(c('borde'), LT.tr('sistemas', 'gota_borde')) + path(c('relleno'), LT.tr('sistemas', 'gota_relleno')),
  });

  one('sis.simbolo', 'Símbolo S', 'simbolo', 'Símbolo', '#ffffff');
  one('sis.usb', 'Conector USB', 'usb', 'USB', '#ffffff');
  one('sis.texto', 'Texto "SISTEMAS" (original)', 'texto', 'Texto', '#ffffff');

  /** Emblema completo (gota + S + USB) en una sola capa, útil para combinaciones. */
  LT.defineElement({
    id: 'sis.emblema',
    group: G,
    name: 'Emblema (gota + S + USB)',
    pivot: LT.trCenter('sistemas', ['gota_borde', 'usb']),
    slots: [
      { id: 'borde', name: 'Borde', def: '#ffffff' },
      { id: 'relleno', name: 'Relleno gota', def: '#4e8ad8' },
      { id: 'simbolo', name: 'Símbolo S', def: '#ffffff' },
      { id: 'usb', name: 'USB', def: '#ffffff' },
    ],
    render: (p, c) =>
      path(c('borde'), LT.tr('sistemas', 'gota_borde')) +
      path(c('usb'), LT.tr('sistemas', 'usb')) +
      path(c('relleno'), LT.tr('sistemas', 'gota_relleno')) +
      path(c('simbolo'), LT.tr('sistemas', 'simbolo')),
  });
})(window.LT);
