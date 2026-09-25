/* Elementos del logo del Tecnológico Nacional de México (vectorizados de referencias/tecnm.png). */
(function (LT) {
  'use strict';
  const G = 'TecNM';
  const one = (id, name, part, slotName) =>
    LT.defineElement({
      id,
      group: G,
      name,
      pivot: LT.trCenter('tecnm', [part]),
      slots: [{ id: 'color', name: slotName, def: '#1b396a' }],
      render: (p, c) => `<path fill="${c('color')}" fill-rule="evenodd" d="${LT.tr('tecnm', part)}"/>`,
    });

  one('tecnm.engrane', 'Engrane', 'engrane', 'Engrane');
  one('tecnm.guerrero', 'Guerrero águila', 'guerrero', 'Guerrero');
  one('tecnm.texto1', 'Texto "TECNOLÓGICO"', 'texto1', 'Texto');
  one('tecnm.texto2', 'Texto "NACIONAL DE MÉXICO"', 'texto2', 'Texto');

  LT.defineElement({
    id: 'tecnm.emblema',
    group: G,
    name: 'Emblema (engrane + guerrero)',
    pivot: LT.trCenter('tecnm', ['engrane']),
    slots: [
      { id: 'engrane', name: 'Engrane', def: '#1b396a' },
      { id: 'guerrero', name: 'Guerrero', def: '#1b396a' },
    ],
    render: (p, c) =>
      `<path fill="${c('engrane')}" fill-rule="evenodd" d="${LT.tr('tecnm', 'engrane')}"/>` +
      `<path fill="${c('guerrero')}" fill-rule="evenodd" d="${LT.tr('tecnm', 'guerrero')}"/>`,
  });
})(window.LT);
