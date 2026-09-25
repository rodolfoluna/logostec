/* Interfaz del editor: estado, capas, inspector, paleta, variantes, lienzo, historial y exportación. */
(function (LT) {
  'use strict';
  const U = LT.util;
  const N = LT.node;
  const $ = (s) => document.querySelector(s);
  const STORE = 'logostec.v1';

  const S = {
    comp: null,
    sel: null,
    zoom: 1,
    fit: true,
    guides: false,
    showRef: false,
    refOpacity: 0.5,
    suggestions: [],
    adjBase: null,
  };
  let lastSnap = '';
  let undoStack = [];
  let redoStack = [];

  // ================================================================ utilidades DOM
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    let value;
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'value') value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) el.append(k.nodeType ? k : String(k));
    if (value !== undefined) el.value = value;
    return el;
  }

  const ICONS = {
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  };
  function icon(name) {
    const s = h('span', { class: 'ico' });
    s.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
    return s;
  }
  function iconBtn(name, title, fn) {
    return h('button', { class: 'icon', title, 'aria-label': title, onclick: (e) => { e.stopPropagation(); fn(e); } }, icon(name));
  }
  function field(label, ...ctl) {
    return h('div', { class: 'field' }, h('span', null, label), h('div', { class: 'ctl' }, ...ctl));
  }
  function sub(text) {
    return h('div', { class: 'sub' }, text);
  }
  function selectEl(options, value, onChange) {
    const sel = h('select', { onchange: (e) => onChange(e.target.value) });
    for (const [v, label] of options) sel.append(h('option', { value: v }, label));
    sel.value = value;
    return sel;
  }
  function numRange(label, value, min, max, step, onInput) {
    const num = h('input', { type: 'number', step, value: +(+value).toFixed(3) });
    const rng = h('input', { type: 'range', min, max, step, value });
    rng.addEventListener('input', () => { num.value = rng.value; onInput(+rng.value); });
    num.addEventListener('input', () => { if (num.value !== '' && !isNaN(+num.value)) { rng.value = num.value; onInput(+num.value); } });
    return field(label, rng, num);
  }
  function checkbox(label, checked, onChange) {
    return h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked, onchange: (e) => onChange(e.target.checked) }), ' ' + label);
  }
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  const slug = (s) =>
    (s || 'logo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'logo';

  // ================================================================ historial y guardado
  let commitTimer = null;
  function commit(later) {
    clearTimeout(commitTimer);
    if (later) {
      commitTimer = setTimeout(() => commit(false), 350);
      return;
    }
    const snap = JSON.stringify(S.comp);
    if (snap === lastSnap) return;
    if (lastSnap) undoStack.push(lastSnap);
    if (undoStack.length > 120) undoStack.shift();
    redoStack = [];
    lastSnap = snap;
    persist();
    updateUndo();
    scheduleThumbs();
  }
  function persist() {
    try {
      localStorage.setItem(STORE, lastSnap);
    } catch (e) {
      /* almacenamiento no disponible: se ignora */
    }
  }
  function restore(snap) {
    S.comp = JSON.parse(snap);
    lastSnap = snap;
    if (S.sel && !N.find(S.comp.layers, S.sel)) S.sel = null;
    resetAdjust();
    persist();
    renderAll();
  }
  function doUndo() {
    commit(false);
    if (!undoStack.length) return;
    redoStack.push(lastSnap);
    restore(undoStack.pop());
  }
  function doRedo() {
    commit(false);
    if (!redoStack.length) return;
    undoStack.push(lastSnap);
    restore(redoStack.pop());
  }
  function updateUndo() {
    $('#btnUndo').disabled = !undoStack.length;
    $('#btnRedo').disabled = !redoStack.length;
  }

  /** Punto central tras cualquier cambio. */
  function changed(o = {}) {
    if (o.layers) renderLayers();
    if (o.inspector) renderInspector();
    if (o.palette) renderPalette();
    if (o.canvasProps) renderCanvasProps();
    scheduleCanvas();
    if (o.commit !== false) commit(o.commit === 'later');
  }

  function normalize(c) {
    c.version = 1;
    c.name = c.name || 'Diseño';
    c.w = +c.w || 1000;
    c.h = +c.h || 1000;
    c.palette = Array.isArray(c.palette) ? c.palette : [];
    c.variants = Array.isArray(c.variants) ? c.variants : [];
    c.clip = c.clip || { cx: c.w / 2, cy: c.h / 2, r: Math.min(c.w, c.h) * 0.47 };
    N.walk(c.layers, (n) => {
      for (const [k, v] of Object.entries(N.defaults())) if (n[k] === undefined) n[k] = v;
      if (n.type === 'element') { n.colors = n.colors || {}; n.params = n.params || {}; }
      if (n.type === 'group') n.children = n.children || [];
    });
    return c;
  }

  function loadComp(comp, msg) {
    commit(false);
    S.comp = normalize(comp);
    S.sel = null;
    S.suggestions = [];
    resetAdjust();
    renderAll();
    commit(false);
    if (msg) toast(msg);
  }

  // ================================================================ lienzo
  const canvasEl = () => $('#canvas');
  let rafPending = false;
  function scheduleCanvas() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      renderCanvas();
    });
  }

  function renderCanvas() {
    const c = S.comp;
    let extra = '';
    if (S.showRef && c.ref) {
      const r = c.ref;
      extra += `<image href="${U.esc(r.src)}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" preserveAspectRatio="none" opacity="${S.refOpacity}" pointer-events="none"/>`;
    }
    if (S.guides) {
      const k = c.clip;
      extra +=
        `<g fill="none" stroke="#ff2d7a" stroke-width="1.5" stroke-dasharray="8 6" pointer-events="none" vector-effect="non-scaling-stroke">` +
        (k ? `<circle cx="${k.cx}" cy="${k.cy}" r="${k.r}"/>` : '') +
        `<path d="M${c.w / 2} 0V${c.h}M0 ${c.h / 2}H${c.w}"/><rect x="0" y="0" width="${c.w}" height="${c.h}"/></g>`;
    }
    extra += '<g id="lt-overlay" pointer-events="none"></g>';
    canvasEl().innerHTML = LT.render(c, { prefix: 'cv', extra });
    sizeCanvas();
    drawSelection();
  }

  function sizeCanvas() {
    const vp = $('#viewport');
    const c = S.comp;
    if (S.fit) {
      const aw = Math.max(120, vp.clientWidth - 48), ah = Math.max(120, vp.clientHeight - 48);
      S.zoom = Math.min(aw / c.w, ah / c.h);
    }
    const el = canvasEl();
    el.style.width = Math.round(c.w * S.zoom) + 'px';
    el.style.height = Math.round(c.h * S.zoom) + 'px';
  }

  function svgRoot() {
    return canvasEl().querySelector('svg');
  }
  function nodeEl(id) {
    const svg = svgRoot();
    return svg && svg.querySelector(`[data-id="${id}"]`);
  }
  function toLocal(ref, x, y) {
    const svg = svgRoot();
    const p = svg.createSVGPoint();
    p.x = x;
    p.y = y;
    return p.matrixTransform(ref.getScreenCTM().inverse());
  }

  function drawSelection() {
    const svg = svgRoot();
    const ov = svg && svg.querySelector('#lt-overlay');
    if (!ov) return;
    ov.innerHTML = '';
    const g = S.sel && nodeEl(S.sel);
    if (!g) return;
    let bb;
    try {
      bb = g.getBBox();
    } catch (e) {
      return;
    }
    if (!bb || (!bb.width && !bb.height)) return;
    const m = svg.getScreenCTM().inverse().multiply(g.getScreenCTM());
    const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x + bb.width, bb.y + bb.height], [bb.x, bb.y + bb.height]].map(([x, y]) => {
      const p = svg.createSVGPoint();
      p.x = x;
      p.y = y;
      const q = p.matrixTransform(m);
      return U.n(q.x) + ',' + U.n(q.y);
    });
    const px = S.comp.w / Math.max(1, canvasEl().clientWidth);
    const poly = pts.join(' ');
    ov.innerHTML =
      `<polygon points="${poly}" fill="rgba(45,140,255,0.08)" stroke="#ffffff" stroke-width="${U.n(3.5 * px)}"/>` +
      `<polygon points="${poly}" fill="none" stroke="#1f7aff" stroke-width="${U.n(1.8 * px)}" stroke-dasharray="${U.n(7 * px)} ${U.n(4 * px)}"/>` +
      pts.map((q) => { const [x, y] = q.split(',').map(Number); return `<rect x="${U.n(x - 4 * px)}" y="${U.n(y - 4 * px)}" width="${U.n(8 * px)}" height="${U.n(8 * px)}" fill="#ffffff" stroke="#1f7aff" stroke-width="${U.n(1.5 * px)}"/>`; }).join('');
  }

  /** Al hacer clic en una pieza dentro de un grupo cerrado se selecciona el grupo. */
  function selectable(id) {
    const chain = [];
    const find = (list, trail) => {
      for (const n of list) {
        if (n.id === id) { chain.push(...trail, n); return true; }
        if (n.type === 'group' && find(n.children, [...trail, n])) return true;
      }
      return false;
    };
    find(S.comp.layers, []);
    for (const n of chain) if (n.type === 'group' && !n.open) return n.id;
    return chain.length ? chain[chain.length - 1].id : null;
  }

  let drag = null;
  function onPointerDown(e) {
    if (e.button !== 0) return;
    const t = e.target.closest('[data-id]');
    if (!t) {
      if (S.sel) select(null);
      return;
    }
    const id = selectable(t.getAttribute('data-id'));
    if (!id) return;
    if (id !== S.sel) select(id);
    const hit = N.find(S.comp.layers, id);
    const g = nodeEl(id);
    if (!hit || !g) return;
    const parentG = g.parentElement.closest('[data-id]');
    const ref = parentG || svgRoot();
    const p0 = toLocal(ref, e.clientX, e.clientY);
    drag = { node: hit.node, g, ref, p0, x0: hit.node.x, y0: hit.node.y, moved: false };
    canvasEl().setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e) {
    if (!drag) return;
    const p = toLocal(drag.ref, e.clientX, e.clientY);
    const dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
    if (!drag.moved && Math.hypot(dx, dy) < 0.5) return;
    drag.moved = true;
    drag.node.x = Math.round((drag.x0 + dx) * 10) / 10;
    drag.node.y = Math.round((drag.y0 + dy) * 10) / 10;
    const tf = N.transform(drag.node);
    if (tf) drag.g.setAttribute('transform', tf);
    else drag.g.removeAttribute('transform');
    drawSelection();
  }
  function onPointerUp() {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (moved) changed({ inspector: true });
  }

  function centerNode(n) {
    const g = nodeEl(n.id);
    const svg = svgRoot();
    if (!g) return;
    const bb = g.getBBox();
    const m = svg.getScreenCTM().inverse().multiply(g.getScreenCTM());
    const p = svg.createSVGPoint();
    p.x = bb.x + bb.width / 2;
    p.y = bb.y + bb.height / 2;
    const c = p.matrixTransform(m);
    const parentG = g.parentElement.closest('[data-id]');
    const toParent = (parentG ? parentG.getScreenCTM().inverse() : svg.getScreenCTM().inverse()).multiply(svg.getScreenCTM());
    const a = c.matrixTransform(toParent);
    const t = svg.createSVGPoint();
    t.x = S.comp.w / 2;
    t.y = S.comp.h / 2;
    const b = t.matrixTransform(toParent);
    n.x = Math.round((n.x + b.x - a.x) * 10) / 10;
    n.y = Math.round((n.y + b.y - a.y) * 10) / 10;
    changed({ inspector: true });
  }

  // ================================================================ selección y capas
  function select(id) {
    S.sel = id;
    renderLayers();
    renderInspector();
    drawSelection();
  }

  function slotColor(n) {
    if (n.type !== 'element') return null;
    const def = LT.elements[n.el];
    if (!def || !def.slots.length) return null;
    let v = N.color(def, n, def.slots[0].id);
    if (v && typeof v === 'object') v = v.a;
    return LT.resolveColor(v, S.comp.palette);
  }

  function renderLayers() {
    const box = $('#layers');
    box.innerHTML = '';
    const rows = [];
    const walk = (list, depth) => {
      for (let i = list.length - 1; i >= 0; i--) {
        const n = list[i];
        rows.push(layerRow(n, depth, list, i));
        if (n.type === 'group' && n.open) walk(n.children, depth + 1);
      }
    };
    walk(S.comp.layers, 0);
    if (!rows.length) rows.push(h('div', { class: 'empty' }, 'Sin capas: agrega un elemento o inserta un logo.'));
    box.append(...rows);
  }

  function layerRow(n, depth, list, i) {
    const isG = n.type === 'group';
    const chev = h('span', {
      class: 'chev',
      onclick: isG ? (e) => { e.stopPropagation(); n.open = !n.open; renderLayers(); commit(true); } : null,
      title: isG ? (n.open ? 'Contraer' : 'Expandir') : null,
    }, isG ? (n.open ? '▾' : '▸') : '');
    const col = slotColor(n);
    const dot = isG ? icon('folder') : h('span', { class: 'dot', style: col && col !== 'none' ? `background:${col}` : '' });
    const eye = iconBtn(n.visible ? 'eye' : 'eyeOff', n.visible ? 'Ocultar' : 'Mostrar', () => {
      n.visible = !n.visible;
      changed({ layers: true });
    });
    const tools = h('span', { class: 'tools' },
      iconBtn('up', 'Traer al frente', () => moveNode(list, i, +1)),
      iconBtn('down', 'Enviar atrás', () => moveNode(list, i, -1)),
      iconBtn('copy', 'Duplicar', () => duplicate(n.id)),
      iconBtn('trash', 'Eliminar', () => removeNode(n.id)));
    return h('div', {
      class: 'layer' + (S.sel === n.id ? ' sel' : '') + (n.visible ? '' : ' hidden'),
      style: `padding-left:${4 + depth * 14}px`,
      role: 'treeitem',
      onclick: () => select(n.id),
      ondblclick: () => { select(n.id); const inp = $('#inspector input[type=text]'); if (inp) { inp.focus(); inp.select(); } },
    }, chev, eye, dot, h('span', { class: 'name' + (isG ? ' grp' : ''), title: n.name }, n.name), tools);
  }

  function moveNode(list, i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    changed({ layers: true });
  }
  function reid(n) {
    n.id = U.uid(n.type === 'group' ? 'g' : 'e');
    if (n.type === 'group') n.children.forEach(reid);
    return n;
  }
  function duplicate(id) {
    const hit = N.find(S.comp.layers, id);
    if (!hit) return;
    const copy = reid(U.clone(hit.node));
    copy.name = hit.node.name + ' (copia)';
    hit.list.splice(hit.list.indexOf(hit.node) + 1, 0, copy);
    S.sel = copy.id;
    changed({ layers: true, inspector: true });
    toast('Capa duplicada');
  }
  function removeNode(id) {
    const hit = N.find(S.comp.layers, id);
    if (!hit) return;
    const idx = hit.list.indexOf(hit.node);
    hit.list.splice(idx, 1);
    if (S.sel === id || (hit.node.type === 'group' && !N.find(S.comp.layers, S.sel))) {
      const next = hit.list[Math.min(idx, hit.list.length - 1)];
      S.sel = next ? next.id : hit.parent ? hit.parent.id : null;
    }
    changed({ layers: true, inspector: true });
  }
  function insertNode(n) {
    const hit = S.sel && N.find(S.comp.layers, S.sel);
    if (hit && hit.node.type === 'group' && hit.node.open) hit.node.children.push(n);
    else if (hit) hit.list.splice(hit.list.indexOf(hit.node) + 1, 0, n);
    else S.comp.layers.push(n);
    S.sel = n.id;
    changed({ layers: true, inspector: true });
  }
  function isInside(n, id) {
    let found = false;
    if (n.type === 'group') N.walk(n.children, (c) => { if (c.id === id) { found = true; return false; } });
    return found;
  }
  function moveToGroup(n, gid) {
    const hit = N.find(S.comp.layers, n.id);
    if (!hit) return;
    hit.list.splice(hit.list.indexOf(n), 1);
    const target = gid ? N.find(S.comp.layers, gid) : null;
    if (target) {
      target.node.children.push(n);
      target.node.open = true;
    } else S.comp.layers.push(n);
    changed({ layers: true, inspector: true });
  }

  /** Saca las piezas de un grupo conservando su posición visual (compone giro, escala y opacidad). */
  function ungroup(g) {
    const hit = N.find(S.comp.layers, g.id);
    if (!hit || g.type !== 'group') return;
    if (g.fx || g.fy) { toast('Quita el volteo del grupo antes de desagrupar.'); return; }
    const [gx, gy] = N.pivot(g);
    const a = U.rad(g.r);
    const map = ([px, py]) => {
      const vx = (px - gx) * g.s, vy = (py - gy) * g.s;
      return [g.x + gx + vx * Math.cos(a) - vy * Math.sin(a), g.y + gy + vx * Math.sin(a) + vy * Math.cos(a)];
    };
    for (const c of g.children) {
      const [cx, cy] = N.pivot(c);
      const q = map([cx + c.x, cy + c.y]);
      c.x = Math.round((q[0] - cx) * 100) / 100;
      c.y = Math.round((q[1] - cy) * 100) / 100;
      c.r += g.r;
      c.s *= g.s;
      c.o *= g.o;
      if (!hit.parent && g.clip) c.clip = true;
    }
    hit.list.splice(hit.list.indexOf(g), 1, ...g.children);
    S.sel = g.children.length ? g.children[g.children.length - 1].id : null;
    changed({ layers: true, inspector: true });
    toast('Grupo deshecho');
  }

  function addElement(elId) {
    const def = LT.elements[elId];
    if (!def) return;
    const n = N.element(elId);
    for (const s of def.slots) {
      const t = S.comp.palette.find((p) => typeof s.def === 'string' && p.color.toLowerCase() === s.def.toLowerCase());
      if (t) n.colors[s.id] = '@' + t.id;
    }
    insertNode(n);
  }

  function remapValue(v, map) {
    if (typeof v === 'string' && v[0] === '@' && map[v.slice(1)]) return '@' + map[v.slice(1)];
    if (v && typeof v === 'object') {
      v.a = remapValue(v.a, map);
      v.b = remapValue(v.b, map);
    }
    return v;
  }
  function eachColorRef(nodes, fn) {
    N.walk(nodes, (n) => {
      if (n.colors) for (const k of Object.keys(n.colors)) n.colors[k] = fn(n.colors[k]);
      if (n.stroke) n.stroke.color = fn(n.stroke.color);
      if (n.shadow) n.shadow.color = fn(n.shadow.color);
    });
  }
  /** Inserta un logo completo como grupo; fusiona su paleta evitando choques de nombres. */
  function insertLogo(presetId) {
    const p = LT.presets.find((x) => x.id === presetId);
    if (!p) return;
    const src = p.build();
    const map = {};
    for (const t of src.palette) {
      const ex = S.comp.palette.find((q) => q.id === t.id);
      if (!ex) S.comp.palette.push(U.clone(t));
      else if (ex.color.toLowerCase() !== t.color.toLowerCase()) {
        let k = 2;
        while (S.comp.palette.find((q) => q.id === `${t.id}_${k}`)) k++;
        map[t.id] = `${t.id}_${k}`;
        S.comp.palette.push({ id: map[t.id], name: `${t.name} (${src.name})`, color: t.color });
      }
    }
    eachColorRef(src.layers, (v) => remapValue(v, map));
    src.layers.forEach((n) => { n.clip = false; });
    const g = N.group(src.name, src.layers, { open: false });
    S.comp.layers.push(g);
    S.sel = g.id;
    changed({ layers: true, inspector: true, palette: true });
    toast(`Se insertó el logo ${src.name} como grupo`);
  }

  // ================================================================ editor de color
  function tokenOptions(allowNone) {
    const o = S.comp.palette.map((t) => ['@' + t.id, t.name]);
    o.push(['custom', 'Personalizado…']);
    if (allowNone) o.push(['none', 'Ninguno (transparente)']);
    return o;
  }
  function hexOf(v) {
    const c = LT.resolveColor(typeof v === 'object' && v ? v.a : v, S.comp.palette);
    return U.normHex(c) || '#000000';
  }
  function solidLine(val, set, allowNone) {
    const sw = h('span', { class: 'swatch' });
    const paintSw = (v) => {
      const c = LT.resolveColor(v, S.comp.palette);
      sw.style.background = c === 'none' ? 'repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 50% / 10px 10px' : c;
    };
    const cur = typeof val === 'string' && val[0] === '@' ? val : val === 'none' || !val ? (allowNone ? 'none' : 'custom') : 'custom';
    const pick = h('input', { type: 'color', value: hexOf(val), title: 'Elegir color' });
    pick.style.display = cur === 'custom' ? '' : 'none';
    const sel = selectEl(tokenOptions(allowNone), cur, (v) => {
      if (v === 'custom') {
        pick.style.display = '';
        val = hexOf(val);
        pick.value = val;
      } else {
        pick.style.display = 'none';
        val = v;
      }
      paintSw(val);
      set(val);
    });
    pick.addEventListener('input', () => { val = pick.value; paintSw(val); set(val); });
    paintSw(val);
    return h('div', { class: 'colorline' }, sw, sel, pick);
  }
  /** Editor de un valor de color: token de la paleta, color fijo o degradado. */
  function colorEditor(value, onChange, opt = {}) {
    const box = h('div', { class: 'colorbox' });
    const rebuild = () => box.replaceWith(colorEditor(value, onChange, opt));
    if (!value || typeof value !== 'object') {
      const line = solidLine(value, (v) => { value = v; onChange(v); }, opt.allowNone);
      if (!opt.noGradient) {
        line.append(h('button', {
          class: 'icon', title: 'Convertir en degradado',
          onclick: () => {
            const a = value && value !== 'none' ? value : '#ffffff';
            value = { g: 'lineal', a, b: U.mix(hexOf(a), '#000000', 0.35), ang: 180 };
            onChange(value);
            rebuild();
          },
        }, '◐'));
      }
      box.append(line);
      return box;
    }
    const g = value;
    const upd = () => onChange(g);
    box.append(
      h('div', { class: 'colorline' },
        selectEl([['lineal', 'Degradado lineal'], ['radial', 'Degradado radial']], g.g, (v) => { g.g = v; upd(); rebuild(); }),
        h('button', { class: 'icon', title: 'Quitar degradado', onclick: () => { value = g.a; onChange(value); rebuild(); } }, '✕'))
    );
    const gb = h('div', { class: 'gradbox' });
    gb.append(h('div', { class: 'muted' }, 'Color inicial'), solidLine(g.a, (v) => { g.a = v; upd(); }));
    gb.append(h('div', { class: 'muted' }, 'Color final'), solidLine(g.b, (v) => { g.b = v; upd(); }));
    if (g.g === 'radial') {
      gb.append(numRange('Centro X', g.cx ?? 0.5, 0, 1, 0.01, (v) => { g.cx = v; upd(); }));
      gb.append(numRange('Centro Y', g.cy ?? 0.5, 0, 1, 0.01, (v) => { g.cy = v; upd(); }));
      gb.append(numRange('Radio', g.r ?? 0.6, 0.05, 1.5, 0.01, (v) => { g.r = v; upd(); }));
    } else {
      gb.append(numRange('Ángulo', g.ang ?? 180, 0, 360, 1, (v) => { g.ang = v; upd(); }));
    }
    gb.append(numRange('Opac. inicial', g.oa ?? 1, 0, 1, 0.01, (v) => { g.oa = v; upd(); }));
    gb.append(numRange('Opac. final', g.ob ?? 1, 0, 1, 0.01, (v) => { g.ob = v; upd(); }));
    box.append(gb);
    return box;
  }

  // ================================================================ inspector
  function renderInspector() {
    const box = $('#inspector');
    box.innerHTML = '';
    const hit = S.sel && N.find(S.comp.layers, S.sel);
    if (!hit) {
      $('#inspTitle').textContent = 'Capa';
      box.append(h('div', { class: 'empty' }, 'Selecciona una capa en la lista o haz clic en el lienzo.'));
      return;
    }
    const n = hit.node;
    const isG = n.type === 'group';
    const def = !isG && LT.elements[n.el];
    $('#inspTitle').textContent = isG ? 'Grupo seleccionado' : 'Capa seleccionada';
    const later = () => changed({ commit: 'later' });

    box.append(field('Nombre', h('input', { type: 'text', value: n.name, oninput: (e) => { n.name = e.target.value; renderLayers(); commit(true); } })));
    if (def) box.append(h('div', { class: 'muted' }, `${def.group} · ${def.name}`));
    if (isG) box.append(h('div', { class: 'muted' }, `${n.children.length} capa(s). Expande el grupo en la lista para editar sus piezas.`));

    const groups = [];
    N.walk(S.comp.layers, (g) => { if (g.type === 'group' && g.id !== n.id && !isInside(n, g.id)) groups.push([g.id, g.name]); });
    if (groups.length) box.append(field('Dentro de', selectEl([['', '(raíz del lienzo)'], ...groups], hit.parent ? hit.parent.id : '', (v) => moveToGroup(n, v))));

    box.append(sub('Posición y tamaño'));
    box.append(numRange('X', n.x, -1000, 1000, 1, (v) => { n.x = v; later(); }));
    box.append(numRange('Y', n.y, -1000, 1000, 1, (v) => { n.y = v; later(); }));
    box.append(numRange('Escala', n.s, 0.05, 4, 0.01, (v) => { n.s = v; later(); }));
    box.append(numRange('Rotación', n.r, -180, 180, 1, (v) => { n.r = v; later(); }));
    box.append(numRange('Opacidad', n.o, 0, 1, 0.01, (v) => { n.o = v; later(); }));
    box.append(h('div', { class: 'btnrow' },
      checkbox('Voltear ↔', n.fx, (v) => { n.fx = v; changed(); }),
      checkbox('Voltear ↕', n.fy, (v) => { n.fy = v; changed(); }),
      h('button', { onclick: () => centerNode(n) }, 'Centrar'),
      h('button', { onclick: () => { Object.assign(n, { x: 0, y: 0, s: 1, r: 0, fx: false, fy: false }); changed({ inspector: true }); } }, 'Restablecer')));

    if (def && def.slots.length) {
      box.append(sub('Colores'));
      for (const slot of def.slots) {
        box.append(field(slot.name, colorEditor(U.clone(N.color(def, n, slot.id)), (v) => {
          n.colors[slot.id] = v;
          renderLayers();
          later();
        })));
      }
    }

    if (def && def.params.length) {
      box.append(sub('Parámetros'));
      const p = N.params(def, n);
      for (const q of def.params) {
        const setP = (v, now) => { n.params[q.id] = v; changed({ commit: now ? true : 'later' }); };
        if (q.type === 'text') box.append(field(q.name, h('input', { type: 'text', value: p[q.id], oninput: (e) => setP(e.target.value) })));
        else if (q.type === 'range') box.append(numRange(q.name, p[q.id], q.min, q.max, q.step, (v) => setP(v)));
        else if (q.type === 'select') {
          const opts = typeof q.options === 'function' ? q.options() : q.options;
          box.append(field(q.name, selectEl(opts, p[q.id], (v) => setP(v, true))));
        } else if (q.type === 'bool') box.append(field(q.name, h('input', { type: 'checkbox', checked: !!p[q.id], onchange: (e) => setP(e.target.checked, true) })));
      }
    }

    box.append(sub('Efectos'));
    if (!hit.parent) {
      box.append(checkbox('Recortar dentro del círculo del lienzo', n.clip, (v) => { n.clip = v; changed(); }));
    }
    box.append(checkbox('Sombra', !!n.shadow, (v) => {
      n.shadow = v ? { dx: 0, dy: 6, blur: 6, color: '#000000', o: 0.3 } : null;
      changed({ inspector: true });
    }));
    if (n.shadow) {
      const sh = n.shadow;
      box.append(numRange('Despl. X', sh.dx, -60, 60, 0.5, (v) => { sh.dx = v; later(); }));
      box.append(numRange('Despl. Y', sh.dy, -60, 60, 0.5, (v) => { sh.dy = v; later(); }));
      box.append(numRange('Desenfoque', sh.blur, 0, 60, 0.5, (v) => { sh.blur = v; later(); }));
      box.append(numRange('Intensidad', sh.o, 0, 1, 0.01, (v) => { sh.o = v; later(); }));
      box.append(field('Color', colorEditor(sh.color, (v) => { sh.color = v; later(); }, { noGradient: true })));
    }
    box.append(checkbox('Contorno', !!n.stroke, (v) => {
      n.stroke = v ? { color: '#ffffff', w: 8 } : null;
      changed({ inspector: true });
    }));
    if (n.stroke) {
      const st = n.stroke;
      box.append(numRange('Grosor', st.w, 0, 60, 0.5, (v) => { st.w = v; later(); }));
      box.append(field('Color', colorEditor(st.color, (v) => { st.color = v; later(); }, { noGradient: true })));
    }

    box.append(h('div', { class: 'btnrow', style: 'margin-top:8px' },
      isG ? h('button', { onclick: () => ungroup(n), title: 'Saca las piezas del grupo sin moverlas' }, 'Desagrupar') : null,
      h('button', { onclick: () => duplicate(n.id) }, 'Duplicar'),
      h('button', { onclick: () => removeNode(n.id), style: 'color:var(--danger)' }, 'Eliminar')));
  }

  // ================================================================ paleta
  function tokenUses(id) {
    let k = 0;
    const ref = '@' + id;
    const count = (v) => {
      if (v === ref) k++;
      else if (v && typeof v === 'object') { if (v.a === ref) k++; if (v.b === ref) k++; }
      return v;
    };
    eachColorRef(S.comp.layers, count);
    count(S.comp.bg);
    return k;
  }

  function renderPalette() {
    const box = $('#palette');
    box.innerHTML = '';
    for (const t of S.comp.palette) {
      const hex = h('input', { type: 'text', class: 'hex', value: t.color, 'aria-label': 'Código de color' });
      const pick = h('input', { type: 'color', value: U.normHex(t.color) || '#000000', title: `@${t.id}` });
      pick.addEventListener('input', () => {
        t.color = pick.value;
        hex.value = t.color;
        resetAdjust();
        changed({ commit: 'later' });
      });
      pick.addEventListener('change', () => { renderInspector(); renderLayers(); });
      hex.addEventListener('change', () => {
        const v = U.normHex(hex.value);
        if (!v) { hex.value = t.color; return; }
        t.color = v;
        pick.value = v;
        resetAdjust();
        changed({ inspector: true, layers: true });
      });
      const name = h('input', { type: 'text', value: t.name, title: `Identificador: @${t.id}`, 'aria-label': 'Nombre del color' });
      name.addEventListener('input', () => { t.name = name.value; commit(true); });
      name.addEventListener('change', () => renderInspector());
      const del = iconBtn('trash', 'Eliminar color', () => {
        const uses = tokenUses(t.id);
        if (uses && !confirm(`"${t.name}" se usa en ${uses} lugar(es). Se reemplazará por su valor fijo ${t.color}. ¿Continuar?`)) return;
        const ref = '@' + t.id;
        const fix = (v) => {
          if (v === ref) return t.color;
          if (v && typeof v === 'object') { if (v.a === ref) v.a = t.color; if (v.b === ref) v.b = t.color; }
          return v;
        };
        eachColorRef(S.comp.layers, fix);
        S.comp.bg = fix(S.comp.bg);
        S.comp.palette.splice(S.comp.palette.indexOf(t), 1);
        changed({ palette: true, inspector: true, canvasProps: true });
      });
      box.append(h('div', { class: 'token' }, pick, name, hex, del));
    }
    if (!S.comp.palette.length) box.append(h('div', { class: 'empty' }, 'La paleta está vacía.'));
  }

  function addToken() {
    let k = S.comp.palette.length + 1;
    while (S.comp.palette.find((t) => t.id === 'color' + k)) k++;
    S.comp.palette.push({ id: 'color' + k, name: 'Color ' + k, color: U.hslToHex(Math.random() * 360, 0.6, 0.5) });
    changed({ palette: true, inspector: true });
  }

  function currentColors() {
    const o = {};
    for (const t of S.comp.palette) o[t.id] = t.color;
    return o;
  }
  function applyColors(colors, msg) {
    for (const t of S.comp.palette) if (colors[t.id]) t.color = colors[t.id];
    resetAdjust();
    changed({ palette: true, inspector: true, layers: true });
    renderVariants();
    if (msg) toast(msg);
  }
  function resetAdjust() {
    S.adjBase = null;
    for (const id of ['#adjHue', '#adjSat', '#adjLight']) { const el = $(id); if (el) el.value = 0; }
  }
  function quickAdjust() {
    if (!S.adjBase) S.adjBase = S.comp.palette.map((t) => t.color);
    const dh = +$('#adjHue').value, ds = +$('#adjSat').value / 100, dl = +$('#adjLight').value / 100;
    S.comp.palette.forEach((t, i) => {
      const base = S.adjBase[i];
      if (!base) return;
      const [hh, ss, ll] = U.hexToHsl(base);
      t.color = U.hslToHex(hh + dh, ss * (1 + ds), ll + dl * (dl > 0 ? 1 - ll : ll) * 2);
    });
    const base = S.adjBase;
    renderPalette();
    S.adjBase = base;
    changed({ commit: 'later' });
  }

  // ================================================================ variantes y miniaturas
  const thumbUrls = new Map();
  function svgUrl(key, svg) {
    const old = thumbUrls.get(key);
    if (old) URL.revokeObjectURL(old);
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    thumbUrls.set(key, url);
    return url;
  }
  function paletteWith(colors) {
    return S.comp.palette.map((t) => ({ id: t.id, name: t.name, color: colors[t.id] || t.color }));
  }
  function thumbCard(url, label, onClick, o = {}) {
    const card = h('div', { class: 'thumb' + (o.active ? ' active' : ''), title: label, onclick: onClick, role: 'button', tabindex: '0' },
      h('img', { src: url, alt: label, loading: 'lazy' }), h('span', null, label));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } });
    if (o.onDelete) card.append(h('button', { class: 'x', title: 'Eliminar', onclick: (e) => { e.stopPropagation(); o.onDelete(); } }, '✕'));
    if (o.onKeep) card.append(h('button', { class: 'keep', title: 'Guardar como variante', onclick: (e) => { e.stopPropagation(); o.onKeep(); } }, '★'));
    return card;
  }
  const sameColors = (a) => S.comp.palette.every((t) => !a[t.id] || a[t.id].toLowerCase() === t.color.toLowerCase());

  function renderVariants() {
    const box = $('#variants');
    box.innerHTML = '';
    S.comp.variants.forEach((v, i) => {
      const url = svgUrl('var' + i, LT.render(S.comp, { palette: paletteWith(v.colors), exportar: true }));
      box.append(thumbCard(url, v.name, () => applyColors(v.colors, `Variante "${v.name}" aplicada`), {
        active: sameColors(v.colors),
        onDelete: () => {
          if (!confirm(`¿Eliminar la variante "${v.name}"?`)) return;
          S.comp.variants.splice(i, 1);
          renderVariants();
          commit();
        },
      }));
    });
    if (!S.comp.variants.length) box.append(h('div', { class: 'empty', style: 'grid-column:1/-1' }, 'Aún no hay variantes guardadas.'));
    const sb = $('#suggestions');
    sb.innerHTML = '';
    S.suggestions.forEach((v, i) => {
      const url = svgUrl('sug' + i, LT.render(S.comp, { palette: paletteWith(v.colors), exportar: true }));
      sb.append(thumbCard(url, v.name, () => applyColors(v.colors, `Sugerencia "${v.name}" aplicada`), {
        active: sameColors(v.colors),
        onKeep: () => {
          S.comp.variants.push({ name: v.name, colors: U.clone(v.colors) });
          renderVariants();
          commit();
          toast('Variante guardada');
        },
      }));
    });
  }
  let thumbTimer = null;
  function scheduleThumbs() {
    clearTimeout(thumbTimer);
    thumbTimer = setTimeout(renderVariants, 700);
  }

  function suggest() {
    const base = currentColors();
    const map = (fn) => { const o = {}; for (const [k, v] of Object.entries(base)) o[k] = fn(v); return o; };
    const hsl = (fn) => map((c) => { const [hh, s, l] = U.hexToHsl(c); return U.hslToHex(...fn(hh, s, l)); });
    S.suggestions = [
      { name: 'Tono +30°', colors: map((c) => U.shiftHue(c, 30)) },
      { name: 'Tono +60°', colors: map((c) => U.shiftHue(c, 60)) },
      { name: 'Tono +120°', colors: map((c) => U.shiftHue(c, 120)) },
      { name: 'Complementario', colors: map((c) => U.shiftHue(c, 180)) },
      { name: 'Tono −120°', colors: map((c) => U.shiftHue(c, -120)) },
      { name: 'Tono −60°', colors: map((c) => U.shiftHue(c, -60)) },
      { name: 'Pastel', colors: hsl((hh, s, l) => [hh, s * 0.6, l + (1 - l) * 0.35]) },
      { name: 'Intenso', colors: hsl((hh, s, l) => [hh, Math.min(1, s * 1.35), l * 0.92]) },
      { name: 'Oscuro', colors: hsl((hh, s, l) => [hh, s, l * 0.72]) },
      { name: 'Escala de grises', colors: hsl((hh, s, l) => [hh, 0, l]) },
      { name: 'Sepia', colors: hsl((hh, s, l) => [30, 0.35, l]) },
      { name: 'Invertir luz', colors: hsl((hh, s, l) => [hh, s, 1 - l]) },
    ];
    renderVariants();
  }

  function renderPresets() {
    const box = $('#presets');
    box.innerHTML = '';
    for (const p of LT.presets) {
      const comp = p.build();
      const url = svgUrl('preset-' + p.id, LT.render(comp, { exportar: true }));
      box.append(thumbCard(url, p.name, () => loadComp(p.build(), `Plantilla "${p.name}" cargada (Ctrl+Z para volver)`)));
    }
  }

  // ================================================================ lienzo: propiedades
  function renderCanvasProps() {
    const c = S.comp;
    const box = $('#canvasProps');
    box.innerHTML = '';
    box.append(field('Nombre', h('input', { type: 'text', value: c.name, oninput: (e) => { c.name = e.target.value; $('#docName').textContent = c.name; commit(true); } })));
    box.append(numRange('Ancho', c.w, 100, 3000, 1, (v) => { c.w = Math.max(10, v); S.fit && sizeCanvas(); changed({ commit: 'later' }); }));
    box.append(numRange('Alto', c.h, 100, 3000, 1, (v) => { c.h = Math.max(10, v); S.fit && sizeCanvas(); changed({ commit: 'later' }); }));
    box.append(field('Fondo', colorEditor(c.bg || 'none', (v) => { c.bg = v === 'none' ? null : v; changed({ commit: 'later' }); }, { allowNone: true })));
    box.append(sub('Círculo de recorte'));
    box.append(h('div', { class: 'muted' }, 'Las capas con “Recortar dentro del círculo” sólo se ven dentro de él. Actívalo en Guías para verlo.'));
    box.append(numRange('Centro X', c.clip.cx, 0, c.w, 1, (v) => { c.clip.cx = v; changed({ commit: 'later' }); }));
    box.append(numRange('Centro Y', c.clip.cy, 0, c.h, 1, (v) => { c.clip.cy = v; changed({ commit: 'later' }); }));
    box.append(numRange('Radio', c.clip.r, 1, Math.max(c.w, c.h), 1, (v) => { c.clip.r = v; changed({ commit: 'later' }); }));
  }

  function renderAll() {
    $('#docName').textContent = S.comp.name;
    $('#refWrap').style.display = S.comp.ref ? '' : 'none';
    renderLayers();
    renderInspector();
    renderPalette();
    renderCanvasProps();
    renderVariants();
    renderCanvas();
    updateUndo();
  }

  // ================================================================ exportación
  function exportSvg() {
    const svg = LT.render(S.comp, { exportar: true, width: S.comp.w, height: S.comp.h });
    download(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + svg], { type: 'image/svg+xml' }), slug(S.comp.name) + '.svg');
  }
  function exportPng() {
    const size = +$('#pngSize').value;
    const W = size, H = Math.round((size * S.comp.h) / S.comp.w);
    const svg = LT.render(S.comp, { exportar: true, width: W, height: H });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      const cv = h('canvas', { width: W, height: H });
      cv.getContext('2d').drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      try {
        cv.toBlob((b) => download(b, `${slug(S.comp.name)}-${W}px.png`), 'image/png');
      } catch (e) {
        toast('El navegador bloqueó la exportación a PNG; usa SVG.');
      }
    };
    img.onerror = () => toast('No se pudo generar el PNG.');
    img.src = url;
  }
  function saveJson() {
    const data = JSON.stringify({ app: 'LogosTec', version: 1, comp: S.comp }, null, 2);
    download(new Blob([data], { type: 'application/json' }), slug(S.comp.name) + '.json');
  }
  function openJson(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        const comp = data.comp || data;
        if (!Array.isArray(comp.layers) || !Array.isArray(comp.palette)) throw new Error('formato');
        loadComp(comp, `Se abrió "${comp.name || file.name}"`);
      } catch (e) {
        toast('El archivo no es un diseño válido de LogosTec.');
      }
    };
    r.readAsText(file);
  }

  // ================================================================ inicio
  function fillSelects() {
    const addEl = $('#addElement');
    const groups = {};
    for (const d of Object.values(LT.elements)) (groups[d.group] = groups[d.group] || []).push(d);
    const order = (g) => (g === 'Formas y texto' ? 1 : 0);
    for (const [g, list] of Object.entries(groups).sort((x, y) => order(x[0]) - order(y[0]))) {
      const og = h('optgroup', { label: g });
      for (const d of list) og.append(h('option', { value: d.id }, d.name));
      addEl.append(og);
    }
    addEl.addEventListener('change', () => { if (addEl.value) addElement(addEl.value); addEl.value = ''; });
    const addLogo = $('#addLogo');
    for (const p of LT.presets) addLogo.append(h('option', { value: p.id }, p.name));
    addLogo.addEventListener('change', () => { if (addLogo.value) insertLogo(addLogo.value); addLogo.value = ''; });
  }

  function bind() {
    $('#btnUndo').onclick = doUndo;
    $('#btnRedo').onclick = doRedo;
    $('#btnSvg').onclick = exportSvg;
    $('#btnPng').onclick = exportPng;
    $('#btnSave').onclick = saveJson;
    $('#btnOpen').onclick = () => $('#fileInput').click();
    $('#fileInput').onchange = (e) => { const f = e.target.files[0]; if (f) openJson(f); e.target.value = ''; };
    $('#btnGroup').onclick = () => insertNode(N.group('Grupo nuevo', [], { open: true }));
    $('#btnAddColor').onclick = addToken;
    $('#btnSaveVariant').onclick = () => {
      const name = prompt('Nombre de la variante:', `Variante ${S.comp.variants.length + 1}`);
      if (!name) return;
      S.comp.variants.push({ name, colors: currentColors() });
      renderVariants();
      commit();
      toast('Variante guardada');
    };
    $('#btnSuggest').onclick = suggest;
    for (const id of ['#adjHue', '#adjSat', '#adjLight']) $(id).addEventListener('input', quickAdjust);
    $('#adjReset').onclick = () => {
      if (S.adjBase) S.comp.palette.forEach((t, i) => { if (S.adjBase[i]) t.color = S.adjBase[i]; });
      resetAdjust();
      changed({ palette: true, inspector: true });
    };

    $('#zoomIn').onclick = () => { S.fit = false; S.zoom *= 1.25; sizeCanvas(); drawSelection(); };
    $('#zoomOut').onclick = () => { S.fit = false; S.zoom /= 1.25; sizeCanvas(); drawSelection(); };
    $('#zoomFit').onclick = () => { S.fit = true; sizeCanvas(); drawSelection(); };
    $('#previewBg').onchange = (e) => { $('#viewport').className = 'viewport bg-' + e.target.value; };
    $('#showGuides').onchange = (e) => { S.guides = e.target.checked; scheduleCanvas(); };
    $('#showRef').onchange = (e) => { S.showRef = e.target.checked; scheduleCanvas(); };
    $('#refOpacity').oninput = (e) => { S.refOpacity = +e.target.value; S.showRef = true; $('#showRef').checked = true; scheduleCanvas(); };

    const cv = canvasEl();
    cv.addEventListener('pointerdown', onPointerDown);
    cv.addEventListener('pointermove', onPointerMove);
    cv.addEventListener('pointerup', onPointerUp);
    cv.addEventListener('pointercancel', onPointerUp);
    $('#viewport').addEventListener('pointerdown', (e) => { if (e.target.id === 'viewport' && S.sel) select(null); });
    $('#viewport').addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      S.fit = false;
      S.zoom *= e.deltaY < 0 ? 1.1 : 1 / 1.1;
      sizeCanvas();
      drawSelection();
    }, { passive: false });
    window.addEventListener('resize', () => { if (S.fit) { sizeCanvas(); drawSelection(); } });

    document.addEventListener('keydown', (e) => {
      const t = e.target;
      const typing = (t.tagName === 'INPUT' && t.type !== 'checkbox' && t.type !== 'button') || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA';
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'z' && !typing) { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
      if (mod && k === 'y' && !typing) { e.preventDefault(); doRedo(); return; }
      if (typing) return;
      if (mod && k === 's') { e.preventDefault(); saveJson(); return; }
      const hit = S.sel && N.find(S.comp.layers, S.sel);
      if (!hit) return;
      if (mod && k === 'd') { e.preventDefault(); duplicate(S.sel); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeNode(S.sel); }
      else if (e.key === 'Escape') select(null);
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') hit.node.x -= d;
        if (e.key === 'ArrowRight') hit.node.x += d;
        if (e.key === 'ArrowUp') hit.node.y -= d;
        if (e.key === 'ArrowDown') hit.node.y += d;
        changed({ inspector: true, commit: 'later' });
      }
    });
  }

  function start() {
    fillSelects();
    bind();
    let comp = null;
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) comp = JSON.parse(saved);
    } catch (e) {
      comp = null;
    }
    if (!comp || !Array.isArray(comp.layers)) comp = LT.presets.find((p) => p.id === 'logosistemas').build();
    S.comp = normalize(comp);
    lastSnap = JSON.stringify(S.comp);
    renderPresets();
    renderAll();
  }

  LT.app = { state: S, loadComp, insertLogo, addElement, select, exportSvg };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window.LT);
