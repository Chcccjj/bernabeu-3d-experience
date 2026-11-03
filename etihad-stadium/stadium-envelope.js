import * as THREE from 'three';
import {
  ETIHAD_FORM,
  planLoop,
  rimY,
  roofRim,
  towerPositions
} from './stadium-form.js';

// ============================================================================
// V9 outer envelope. The Etihad reads as four horizontal layers, not one glass
// wall (research/V9-FORM-BRIEF.md sec.3 + west/east elevations 2023):
//
//   1  dark plinth, concourse portals and lit entrance canopies;
//   2  lower glazing + deep silver spandrel band (y = 7.0 m, ETIHAD_FORM);
//   3  middle glazing with supporter / advertising panels;
//   4  upper silver band, tall upper glazing carrying the ETIHAD STADIUM
//      letters and the City roundel, a recessed dark louvre band, the
//      translucent eaves clerestory and the deep overhang soffit under the
//      white fascia.
//
// Vertical rhythm: 8.2 m piers (ETIHAD_FORM.facade.pierSpacing) projecting
// 0.8-1.0 m past the glass, 2.1 m mullion modules (2 x bayMullion), and
// V-struts across the upper glazing bays.
//
// The eight towers are open structures: hollow white slab-edge rings every
// 4.6 m, glass balustrades, matchday blue "CITY" fascia strips, an exposed
// spiral ramp and the concrete cap + tapered drum + steel tripod that carry
// each mast. Evidence: B for the open towers, slab edges, blue CITY band,
// glass balustrades and roof overhang shadow; C for band heights, pier depth,
// louvre height and the tower cap profile.
// ============================================================================

export function buildStadiumEnvelope(ctx, { kits, layers, sign, materials }) {
  const F = ETIHAD_FORM;
  const P = F.plan;
  const facade = kits.facade;
  const roof = kits.roof;
  const ramps = kits.ramps;
  const inset = P.facadeInset;
  const ground = F.groundLevel ?? 0.82;
  const crownY = F.roof.crownY;
  const DS = THREE.DoubleSide;
  const TAU = Math.PI * 2;
  const metrics = {
    portals: [],
    piers: 0,
    bays: 0,
    mullions: 0,
    louvreFins: 0,
    eavesMullions: 0,
    towers: 0,
    facadeHeight: crownY - ground,
    addedMeshes: 0,
    signs: 0,
    sanitised: 0,
    skipped: 0
  };

  // ---- palette ------------------------------------------------------------
  // MeshToon belongs to the model's stylisation; the glazing alone is a lit
  // MeshStandard surface so it picks up the sky environment and reads as
  // reflective grey-blue instead of near-black.
  const toon = (color, extra = {}) => ctx.mat(color, { side: DS, ...extra });
  const standard = (name, color, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ name, color, side: DS, ...extra });
    m.userData = { materialEvidence: 'C - tone/reflectance fitted from 2023-2026 photographs' };
    return m;
  };
  const nightEmission = (m, value) => {
    m.emissiveIntensity = 0;
    m.userData.nightEmission = value;
    ctx.emissives.push(m);
    return m;
  };
  const glassLower = nightEmission(standard(
    'Envelope lower glazing / concourse reflection',
    '#7f99a5',
    { metalness: 0.38, roughness: 0.24, emissive: '#ffd9a1' }
  ), 0.62);
  const glassUpper = nightEmission(standard(
    'Envelope upper glazing / sky reflection',
    '#8aa6b3',
    { metalness: 0.52, roughness: 0.17, emissive: '#7ea4b2' }
  ), 0.3);
  const eavesGlass = nightEmission(standard(
    'Eaves clerestory glazing',
    '#9bbcb3',
    {
      metalness: 0.12,
      roughness: 0.34,
      transparent: true,
      opacity: 0.9,
      emissive: '#a9e0cd'
    }
  ), 0.72);
  eavesGlass.userData.noShadow = true;
  const darkGlass = toon('#253239');
  const plinthDark = toon('#334047');
  const pierConcrete = toon('#9ca6a9');
  const louvreDark = toon('#4b585f');
  const soffitDark = toon('#303c42');
  const finSteel = toon('#79868d');
  const silver = toon('#aab3b4');
  const white = toon('#e7eae4');
  const crestWhite = toon('#eef1ec');
  const crestBlue = toon('#5badd6');
  const towerWhite = toon('#e9ece6');
  const towerConcrete = toon('#a4a9a3');
  const towerDark = toon('#2b373d');
  const railSteel = toon('#6d787e');
  const capPale = toon('#c7cbc5');
  const coneDark = toon('#39424a');
  const glow = ctx.mat('#f6e4c0', { emissive: '#ffd28f', emissiveIntensity: 2.0, side: DS });
  const railGlass = nightEmission(standard(
    'Ramp tower balustrade glass',
    '#a9ccd5',
    {
      metalness: 0.1,
      roughness: 0.26,
      transparent: true,
      opacity: 0.16,
      emissive: '#cfe6e2'
    }
  ), 0.1);
  railGlass.userData.noShadow = true;
  const fasciaMate = materials?.pale ?? toon('#cbd0cd');

  // Blue matchday fascia strip around every tower slab: the years and the
  // "CITY" wordmark photographed on the east/west towers (north-street-2026,
  // east-stand-elevation-2023).
  let towerBlue = toon('#1f5f9c');
  if (ctx.signage?.textureCanvas) {
    const font = ctx.config?.visual?.fontFamily || 'Arial, sans-serif';
    const tex = ctx.signage.textureCanvas(1024, 128, (c, w, h) => {
      c.fillStyle = '#1d5a94';
      c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,.09)';
      c.fillRect(0, 0, w, Math.round(h * 0.16));
      c.fillStyle = '#eef6f9';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `700 ${Math.round(h * 0.62)}px ${font}`;
      const parts = ['CITY', '1894', 'CITY', '1904', 'CITY', '1956', 'CITY', '1968'];
      const cell = w / parts.length;
      parts.forEach((p, i) => c.fillText(p, cell * (i + 0.5), h * 0.54));
    });
    towerBlue = new THREE.MeshToonMaterial({ map: tex, gradientMap: ctx.gradient, side: DS });
    towerBlue.userData = { materialEvidence: 'B tower CITY fascia strips photographed 2023/2026' };
  }

  // ---- geometry bins (the kit merges one mesh per material) --------------
  const binFacade = { kit: facade, mats: new Set() };
  const binRoof = { kit: roof, mats: new Set() };
  const binRamps = { kit: ramps, mats: new Set() };
  const finite = (v) => Number.isFinite(v);
  const allFinite = (values) => values.every(finite);
  function emit(bin, arr, mtl) {
    // Guard: a builder must never push NaN into a BufferGeometry (NaN breaks
    // computeBoundingSphere and frustum culling for the whole merged mesh).
    let bad = 0;
    for (let i = 0; i < arr.length; i += 1) {
      if (!Number.isFinite(arr[i])) {
        arr[i] = 0;
        bad += 1;
      }
    }
    metrics.sanitised += bad;
    bin.mats.add(mtl);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    g.computeVertexNormals();
    bin.kit.geometry(g, mtl);
    g.dispose();
  }
  function place(bin, geometry, mtl, x, y, z) {
    if (!allFinite([x, y, z])) {
      metrics.skipped += 1;
      geometry.dispose();
      return;
    }
    bin.mats.add(mtl);
    geometry.translate(x, y, z);
    bin.kit.geometry(geometry, mtl);
    geometry.dispose();
  }
  function pipe(bin, a, b, r, mtl) {
    if (!allFinite([...a, ...b, r])) {
      metrics.skipped += 1;
      return;
    }
    bin.mats.add(mtl);
    bin.kit.pipe(a, b, r, mtl);
  }
  function box(bin, x, y, z, w, h, d, mtl, yaw = 0) {
    if (!allFinite([x, y, z, w, h, d, yaw])) {
      metrics.skipped += 1;
      return;
    }
    bin.mats.add(mtl);
    bin.kit.box(x, y, z, w, h, d, mtl, yaw);
  }
  function shell(bin, x, y, z, r, h, mtl, segments = 40) {
    place(bin, new THREE.CylinderGeometry(r, r, h, segments, 1, true), mtl, x, y, z);
  }
  function annulus(bin, x, y, z, rIn, rOut, mtl, segments = 40, up = true) {
    const g = new THREE.RingGeometry(rIn, rOut, segments, 1);
    g.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
    place(bin, g, mtl, x, y, z);
  }
  function disc(bin, x, y, z, r, mtl, yaw = 0, segments = 28) {
    const g = new THREE.CircleGeometry(r, segments);
    g.rotateY(yaw);
    place(bin, g, mtl, x, y, z);
  }

  // Vertical wall ribbon around a plan loop at two heights.
  function ribbon(bin, off, y0, y1, mtl, n = 384) {
    const pts = planLoop(off, n);
    const arr = [];
    for (let i = 0; i < n; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      arr.push(a.x, y0, a.y, b.x, y1, b.y, b.x, y0, b.y);
      arr.push(a.x, y0, a.y, a.x, y1, a.y, b.x, y1, b.y);
    }
    emit(bin, arr, mtl);
  }
  // Same, with per-angle top/bottom heights (the roof rim is not level).
  function ribbonVary(bin, off, y0Fn, y1Fn, mtl, n = 384) {
    const pts = planLoop(off, n);
    const arr = [];
    for (let i = 0; i < n; i += 1) {
      const j = (i + 1) % n;
      const a = pts[i];
      const b = pts[j];
      const ta = (i / n) * TAU;
      const tb = (j / n) * TAU;
      const a0 = y0Fn(ta, i), a1 = y1Fn(ta, i);
      const b0 = y0Fn(tb, j), b1 = y1Fn(tb, j);
      arr.push(a.x, a0, a.y, b.x, b1, b.y, b.x, b0, b.y);
      arr.push(a.x, a0, a.y, a.x, a1, a.y, b.x, b1, b.y);
    }
    emit(bin, arr, mtl);
  }
  // Horizontal ring surfaces between two insets, with per-angle heights.
  function shelfVary(bin, offA, offB, yFn, mtl, n = 384) {
    const a = planLoop(offA, n);
    const b = planLoop(offB, n);
    const arr = [];
    for (let i = 0; i < n; i += 1) {
      const j = (i + 1) % n;
      const ta = (i / n) * TAU;
      const tb = (j / n) * TAU;
      const ya = yFn(ta, i), yb = yFn(ta, i), yaj = yFn(tb, j), ybj = yFn(tb, j);
      arr.push(a[i].x, ya, a[i].y, b[j].x, ybj, b[j].y, b[i].x, yb, b[i].y);
      arr.push(a[i].x, ya, a[i].y, a[j].x, yaj, a[j].y, b[j].x, ybj, b[j].y);
    }
    emit(bin, arr, mtl);
  }
  // Projecting rectangular ring band (silver spandrels).
  function bandRect(bin, off, y, height, depth, mtl, n = 384) {
    const inner = planLoop(off, n);
    const outer = planLoop(off - depth, n);
    const arr = [];
    const quad = (p, q, r, s) => arr.push(...p, ...q, ...r, ...p, ...r, ...s);
    const y0 = y, y1 = y + height;
    for (let i = 0; i < n; i += 1) {
      const j = (i + 1) % n;
      const a = inner[i], b = inner[j], c = outer[j], d = outer[i];
      quad([a.x, y1, a.y], [b.x, y1, b.y], [c.x, y1, c.y], [d.x, y1, d.y]);
      quad([a.x, y0, a.y], [d.x, y0, d.y], [c.x, y0, c.y], [b.x, y0, b.y]);
      quad([d.x, y0, d.y], [c.x, y0, c.y], [c.x, y1, c.y], [d.x, y1, d.y]);
    }
    emit(bin, arr, mtl);
  }

  // ---- plan helpers -------------------------------------------------------
  const signedPow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
  function planAt(off, t) {
    const a = P.outerX - off;
    const b = (Math.sin(t) >= 0 ? P.southZ : P.northZ) - off;
    return { x: a * signedPow(Math.cos(t), P.shapePower), z: b * signedPow(Math.sin(t), P.shapePower) };
  }
  function normalAt(off, t) {
    const e = 0.002;
    const p0 = planAt(off, t - e);
    const p1 = planAt(off, t + e);
    const tx = p1.x - p0.x;
    const tz = p1.z - p0.z;
    const l = Math.hypot(tx, tz) || 1;
    return { x: tz / l, z: -tx / l, yaw: Math.atan2(tz / l, -tx / l) };
  }
  function perimeter(off) {
    const pts = planLoop(off, 1024);
    let total = 0;
    for (let i = 0; i < pts.length; i += 1) total += pts[i].distanceTo(pts[(i + 1) % pts.length]);
    return total;
  }
  // Even arc-length sample of a plan loop with the outward normal and yaw.
  function spacedLoop(off, count, phase = 0.5) {
    const pts = planLoop(off, 1024);
    const m = pts.length;
    const cum = new Float64Array(m + 1);
    for (let i = 0; i < m; i += 1) cum[i + 1] = cum[i] + pts[i].distanceTo(pts[(i + 1) % m]);
    const total = cum[m];
    const out = [];
    for (let k = 0; k < count; k += 1) {
      const target = ((k + phase) / count) * total;
      let j = 0;
      while (j < m - 1 && cum[j + 1] < target) j += 1;
      const span = Math.max(1e-6, cum[j + 1] - cum[j]);
      const f = Math.min(1, Math.max(0, (target - cum[j]) / span));
      const a = pts[j];
      const b = pts[(j + 1) % m];
      const x = a.x + (b.x - a.x) * f;
      const z = a.y + (b.y - a.y) * f;
      const tx = b.x - a.x;
      const tz = b.y - a.y;
      const l = Math.hypot(tx, tz) || 1;
      out.push({ x, z, nx: tz / l, nz: -tx / l, yaw: Math.atan2(tz / l, -tx / l) });
    }
    return out;
  }
  // Recover the superellipse parameter of a loop point (r = outerX - off).
  function tAt(q, off) {
    // q is either a Vector2 from planLoop (x, y=z) or a spacedLoop entry (x, z).
    const qx = q.x;
    const qz = typeof q.z === 'number' ? q.z : q.y;
    const a = P.outerX - off;
    const b = (qz >= 0 ? P.southZ : P.northZ) - off;
    const cx = Math.sign(qx) * Math.pow(Math.abs(qx) / a, 1 / P.shapePower);
    const sz = Math.sign(qz) * Math.pow(Math.abs(qz) / b, 1 / P.shapePower);
    return Math.atan2(sz, cx);
  }

  // ---- top-of-facade zone -------------------------------------------------
  // Between the glazed drum crown (30.2 m, ETIHAD_FORM.roof.crownY) and the
  // sloping roof rim: recessed louvre band, translucent eaves clerestory, then
  // the deep overhang soffit. Heights are photographic fits of the 2023
  // elevations; the rim itself comes from stadium-form.js.
  function crownZone(t) {
    const rim = rimY(t);
    const zone = Math.max(0.4, rim - crownY);
    const soffitDrop = Math.min(2.6, Math.max(0.9, zone * 0.16));
    const eavesTop = rim - F.roof.fasciaDepth - soffitDrop + 0.05;
    const eavesH = Math.min(2.8, Math.max(0.8, zone * 0.22));
    const eavesBottom = Math.max(crownY + 0.15, eavesTop - eavesH);
    return { rim, eavesTop, eavesBottom };
  }

  // ---- façade drum: plinth, glazing, spandrels ----------------------------
  const plinthTop = 2.9;
  const bandA = F.facade.spandrels[0];          // 7.0  lower silver band
  const bandATop = bandA + 2.1;
  const bandB = F.facade.spandrels[1];          // 16.2 upper silver band
  const bandBTop = bandB + 1.8;
  const louvreOff = inset + 0.62;
  const eavesOff = inset + 0.16;

  ribbon(binFacade, inset, ground, plinthTop, plinthDark);
  ribbon(binFacade, inset, plinthTop, bandA, glassLower);
  ribbon(binFacade, inset, bandATop, bandB, glassLower);
  ribbon(binFacade, inset, bandBTop, crownY, glassUpper);
  bandRect(binFacade, inset + 0.12, bandA, 2.1, 0.62, silver);
  bandRect(binFacade, inset + 0.12, bandB, 1.8, 0.62, silver);
  // shadow reveals under / over the silver bands
  for (const y of [bandA - 0.14, bandATop - 0.14, bandB - 0.14, bandBTop - 0.14]) {
    ribbon(binFacade, inset + 0.02, y, y + 0.14, louvreDark);
  }
  // metal panel joints on the two silver spandrel bands (4.2 m module)
  mullionsJoint();
  function mullionsJoint() {
    const joints = spacedLoop(inset - 0.5, Math.max(24, Math.round(perimeter(inset) / (F.facade.bayMullion * 4))), 0.5);
    for (const q of joints) {
      box(binFacade, q.x, bandA + 1.05, q.z, 0.05, 2.06, 0.07, finSteel, q.yaw);
      box(binFacade, q.x, bandB + 0.9, q.z, 0.05, 1.76, 0.07, finSteel, q.yaw);
    }
  }
  // bright trim capping the glazed drum
  ribbon(binFacade, inset - 0.06, crownY - 0.06, crownY + 0.14, finSteel, 192);
  // continuous plinth reveal line
  ribbon(binFacade, inset + 0.01, plinthTop - 0.16, plinthTop, finSteel, 192);

  // Concourse portals with lit canopies (a strong ground-level rhythm).
  const portalCount = Math.max(8, Math.round(perimeter(inset) / (F.facade.pierSpacing * 2)));
  spacedLoop(inset, portalCount, 0.5).forEach((q, i) => {
    metrics.portals.push({...q, id:i});
    box(binFacade, q.x, ground + 1.12, q.z, 5.2, 2.25, 0.24, darkGlass, q.yaw);
    box(binFacade, q.x, 3.14, q.z, 6.0, 0.26, 0.78, silver, q.yaw);
    if (i % 2 === 0) box(binFacade, q.x, 3.44, q.z, 5.4, 0.07, 0.16, glow, q.yaw);
  });

  // Vertical mullion grid: two 1.05 m modules = 2.1 m.
  const mullions = spacedLoop(inset - 0.06, Math.max(48, Math.round(perimeter(inset) / (F.facade.bayMullion * 2))), 0.5);
  mullions.forEach((q) => {
    box(binFacade, q.x, (plinthTop + crownY) / 2, q.z, 0.075, crownY - plinthTop, 0.16, finSteel, q.yaw);
  });
  metrics.mullions = mullions.length;
  // Horizontal glazing transoms.
  for (const y of [4.8, 12.4, 20.9, 24.4, 27.4]) {
    ribbon(binFacade, inset - 0.07, y - 0.03, y + 0.03, finSteel, 256);
  }

  // Piers: 8.2 m rhythm, 0.8-1.0 m deep past the glass, heavy every fourth bay.
  const piers = spacedLoop(inset - 0.32, Math.max(24, Math.round(perimeter(inset) / F.facade.pierSpacing)), 0.5);
  piers.forEach((q, i) => {
    const heavy = i % 4 === 0;
    box(
      binFacade,
      q.x,
      (ground + crownY) / 2,
      q.z,
      heavy ? 1.2 : 0.8,
      crownY - ground,
      heavy ? 1.0 : 0.85,
      heavy ? pierConcrete : silver,
      q.yaw
    );
  });
  metrics.piers = piers.length;
  metrics.bays = piers.length;
  // V-strut pairs across the upper glazing bays (Arup exposed bracing).
  for (let i = 0; i < piers.length; i += 2) {
    const a = piers[i];
    const b = piers[(i + 1) % piers.length];
    const ax = a.x + (b.x - a.x) * 0.22;
    const az = a.z + (b.z - a.z) * 0.22;
    const bx = a.x + (b.x - a.x) * 0.78;
    const bz = a.z + (b.z - a.z) * 0.78;
    const y0 = bandBTop + 1.1;
    const y1 = crownY - 1.2;
    const off = 0.14;
    pipe(binFacade, [ax + a.nx * off, y0, az + a.nz * off], [bx + b.nx * off, y1, bz + b.nz * off], 0.045, finSteel);
    pipe(binFacade, [ax + a.nx * off, y1, az + a.nz * off], [bx + b.nx * off, y0, bz + b.nz * off], 0.045, finSteel);
  }

  // ---- crown band: recessed louvres, eaves clerestory, soffit -------------
  // Recessed continuous louvre band (not a colonnade) with thin fins.
  ribbonVary(binFacade, louvreOff, () => crownY + 0.15, (t) => crownZone(t).eavesBottom, louvreDark, 384);
  shelfVary(binFacade, louvreOff, inset, (t) => crownY + 0.15, louvreDark, 384);
  shelfVary(binFacade, inset, louvreOff, (t) => crownZone(t).eavesBottom, louvreDark, 384);
  const fins = spacedLoop(louvreOff + 0.02, Math.max(60, Math.round(perimeter(inset) / 1.9)), 0.5);
  fins.forEach((q) => {
    const top = Math.max(crownY + 0.25, crownZone(tAt(q, louvreOff)).eavesBottom);
    box(binFacade, q.x, (crownY + 0.1 + top) / 2, q.z, 0.07, top - crownY - 0.1, 0.32, finSteel, q.yaw);
  });
  metrics.louvreFins = fins.length;
  // two thin horizontal stringers follow the sloping band
  for (const f of [0.34, 0.67]) {
    ribbonVary(
      binFacade,
      louvreOff - 0.11,
      (t) => crownY + 0.15 + (crownZone(t).eavesBottom - crownY - 0.15) * f - 0.03,
      (t) => crownY + 0.15 + (crownZone(t).eavesBottom - crownY - 0.15) * f + 0.03,
      finSteel,
      256
    );
  }
  // translucent eaves clerestory strip under the roof
  ribbonVary(binFacade, eavesOff, (t) => crownZone(t).eavesBottom, (t) => crownZone(t).eavesTop, eavesGlass, 384);
  const eavesMullions = spacedLoop(eavesOff - 0.05, Math.max(60, Math.round(perimeter(inset) / 2.2)), 0.5);
  eavesMullions.forEach((q) => {
    const z = crownZone(tAt(q, eavesOff));
    box(binFacade, q.x, (z.eavesBottom + z.eavesTop) / 2, q.z, 0.05, Math.max(0.2, z.eavesTop - z.eavesBottom), 0.14, finSteel, q.yaw);
  });
  metrics.eavesMullions = eavesMullions.length;

  // ---- roof edge: white fascia, drip lip, gutter shadow, deep soffit ------
  const rimN = 384;
  const fasciaArr = [];
  const lipArr = [];
  const gutterArr = [];
  const soffitArr = [];
  const innerSoffit = planLoop(eavesOff, rimN);
  const pushQuad = (target, p, q, r, s) => target.push(...p, ...q, ...r, ...p, ...r, ...s);
  for (let i = 0; i < rimN; i += 1) {
    const j = (i + 1) % rimN;
    const t0 = (i / rimN) * TAU;
    const t1 = (j / rimN) * TAU;
    const a = roofRim(t0);
    const b = roofRim(t1);
    const ya = rimY(t0);
    const yb = rimY(t1);
    const depth = F.roof.fasciaDepth;
    // fascia face
    pushQuad(fasciaArr, [a[0], ya, a[2]], [b[0], yb, b[2]], [b[0], yb - depth, b[2]], [a[0], ya - depth, a[2]]);
    // drip lip projecting out beyond the roof edge
    const ra = Math.hypot(a[0], a[2]) || 1;
    const rb = Math.hypot(b[0], b[2]) || 1;
    const lip = F.roof.fasciaLip;
    const ax = a[0] * (1 + lip / ra), az = a[2] * (1 + lip / ra);
    const bx = b[0] * (1 + lip / rb), bz = b[2] * (1 + lip / rb);
    // outward lip face
    pushQuad(lipArr, [ax, ya + 0.02, az], [bx, yb + 0.02, bz], [b[0], yb - 0.3, b[2]], [a[0], ya - 0.3, a[2]]);
    // lip top return
    pushQuad(lipArr, [ax, ya + 0.02, az], [a[0], ya + 0.02, a[2]], [b[0], yb + 0.02, b[2]], [bx, yb + 0.02, bz]);
    // gutter shadow groove just under the fascia (2 cm proud: no z-fighting)
    const gs = 1 + 0.02 / ra;
    const gs2 = 1 + 0.02 / rb;
    pushQuad(gutterArr, [a[0] * gs, ya - depth + 0.04, a[2] * gs], [b[0] * gs2, yb - depth + 0.04, b[2] * gs2], [b[0] * gs2, yb - depth + 0.28, b[2] * gs2], [a[0] * gs, ya - depth + 0.28, a[2] * gs]);
    // deep overhang soffit: from the fascia back down to the eaves clerestory
    const z0 = crownZone(t0);
    const z1 = crownZone(t1);
    const ia = innerSoffit[i];
    const ib = innerSoffit[j];
    pushQuad(
      soffitArr,
      [a[0], ya - depth + 0.05, a[2]],
      [b[0], yb - depth + 0.05, b[2]],
      [ib.x, z1.eavesTop, ib.y],
      [ia.x, z0.eavesTop, ia.y]
    );
  }
  emit(binRoof, fasciaArr, fasciaMate);
  emit(binRoof, lipArr, fasciaMate);
  emit(binRoof, gutterArr, soffitDark);
  emit(binRoof, soffitArr, soffitDark);

  // ---- signage ------------------------------------------------------------
  // Thin illuminated metal letters on dark glazing, not white billboards. The
  // letters are alpha-tested canvas cut-outs, so there is no panel around them.
  const letterMats = new Map();
  function letterMat(text, color, aspect) {
    const key = `${text}|${color}|${Math.round(aspect * 100)}`;
    if (letterMats.has(key)) return letterMats.get(key);
    const font = ctx.config?.visual?.fontFamily || 'Arial, sans-serif';
    const tex = ctx.signage.textureCanvas(1024, Math.max(64, Math.round(1024 / aspect)), (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = color;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const byWidth = (w - 70) / (Math.max(1, text.length) * 0.62);
      const size = Math.max(18, Math.min(h * 0.62, byWidth));
      c.font = `700 ${Math.round(size)}px ${font}`;
      c.fillText(text, w / 2, h * 0.52);
    });
    const m = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: false,
      alphaTest: 0.42,
      side: DS,
      toneMapped: true
    });
    m.userData = { materialEvidence: 'B illuminated facade lettering, 2023 night elevation' };
    letterMats.set(key, m);
    return m;
  }
  function letterSign(text, x, y, z, w, h, yaw, color) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), letterMat(text, color, w / h));
    mesh.position.set(x, y, z);
    mesh.rotation.y = yaw;
    layers.facade.add(mesh);
    metrics.signs += 1;
    return mesh;
  }
  for (const t of [0, Math.PI]) {
    const q = planAt(inset - 1.18, t);
    const n = normalAt(inset, t);
    letterSign('ETIHAD STADIUM', q.x + n.x * 0.02, 24.6, q.z + n.z * 0.02, 30, 4.6, n.yaw, '#eaf6f8');
    // City roundel above the letters: white ring, sky-blue field, white centre.
    const cx = q.x + n.x * 0.12;
    const cz = q.z + n.z * 0.12;
    const ring = new THREE.TorusGeometry(1.95, 0.16, 6, 28);
    ring.rotateY(n.yaw);
    place(binFacade, ring, crestWhite, cx, 28.25, cz);
    disc(binFacade, cx + n.x * 0.02, 28.25, cz + n.z * 0.02, 1.86, crestBlue, n.yaw);
    disc(binFacade, cx + n.x * 0.05, 28.4, cz + n.z * 0.05, 0.62, crestWhite, n.yaw);
    // "MANCHESTER CITY" as dark metal letters on the upper silver band.
    const mq = planAt(inset - 1.02, t);
    const mn = normalAt(inset, t);
    letterSign('MANCHESTER CITY', mq.x + mn.x * 0.02, bandB + 0.92, mq.z + mn.z * 0.02, 23, 1.9, mn.yaw, '#3d4c53');
  }
  // Dark blue matchday advertising panels on the middle glazing.
  const zPanel = 62;
  const panelT = Math.asin(signedPow(zPanel / (P.southZ - inset), 1 / P.shapePower));
  for (const t of [panelT, -panelT, Math.PI - panelT, Math.PI + panelT]) {
    const q = planAt(inset - 1.05, t);
    const n = normalAt(inset, t);
    sign(layers.facade, 'CITY', q.x + n.x * 0.02, 11.6, q.z + n.z * 0.02, 11.5, 4.6, n.yaw, '#1b4d84', '#e9f3f7');
    metrics.signs += 1;
  }

  // ---- eight open spiral circulation towers ------------------------------
  const T = F.rampTowers;
  const R = T.radius;
  const coreR = 3.0;
  const openLevels = T.slabLevels.filter((y) => y < T.topY - 0.2);
  towerPositions(F).forEach(([x, z], index) => {
    // lift / stair core, visible through the open slabs
    shell(binRamps, x, (ground + T.topY) / 2, z, coreR, T.topY - ground, towerDark, 24);
    // base ring
    annulus(binRamps, x, ground + 0.04, z, coreR, R + 0.55, towerConcrete, 40);
    shell(binRamps, x, ground + 0.42, z, R + 0.55, 0.72, towerWhite, 44);
    shell(binRamps, x, ground + 1.45, z, R + 0.5, 1.25, towerBlue, 44);

    // hollow slab-edge rings, glass balustrades and lit soffits
    openLevels.forEach((y, level) => {
      const top = y + 0.18;
      const bot = y - 0.38;
      annulus(binRamps, x, top, z, coreR, R, towerConcrete, 40);
      annulus(binRamps, x, bot, z, coreR, R, towerDark, 40, false);
      shell(binRamps, x, y - 0.1, z, R, 0.56, towerWhite, 44);
      shell(binRamps, x, y - 0.04, z, R + 0.025, 0.4, towerBlue, 44);
      // under-slab lighting strip (bright at night, the photographed look)
      shell(binRamps, x, bot - 0.06, z, R - 0.2, 0.07, glow, 36);
      // glass balustrade, posts and top rail
      shell(binRamps, x, top + 0.54, z, R - 0.22, 1.05, railGlass, 32);
      for (let k = 0; k < 10; k += 1) {
        const a = (k / 10) * TAU + 0.31 + index * 0.07;
        pipe(
          binRamps,
          [x + Math.cos(a) * (R - 0.22), top + 0.02, z + Math.sin(a) * (R - 0.22)],
          [x + Math.cos(a) * (R - 0.22), top + 1.1, z + Math.sin(a) * (R - 0.22)],
          0.035,
          railSteel
        );
      }
      shell(binRamps, x, top + 1.12, z, R - 0.22, 0.05, railSteel, 32);
      // radial landing beams under the slab
      for (let k = 0; k < 4; k += 1) {
        const a = (k / 4) * TAU + index * 0.31;
        pipe(
          binRamps,
          [x + Math.cos(a) * (coreR + 0.2), bot - 0.12, z + Math.sin(a) * (coreR + 0.2)],
          [x + Math.cos(a) * (R - 0.25), bot - 0.12, z + Math.sin(a) * (R - 0.25)],
          0.1,
          towerConcrete
        );
      }
      void level;
    });

    // exposed spiral ramp behind the balustrades
    const turns = 3.4;
    const steps = 150;
    const yStart = ground + 0.35;
    const yEnd = T.topY - 0.9;
    const rampArr = [];
    for (let i = 0; i < steps; i += 1) {
      const u0 = i / steps;
      const u1 = (i + 1) / steps;
      const a0 = u0 * TAU * turns;
      const a1 = u1 * TAU * turns;
      const yy0 = yStart + (yEnd - yStart) * u0;
      const yy1 = yStart + (yEnd - yStart) * u1;
      const ro = R - 0.32;
      const ri = 4.15;
      const p = (a, r, yy) => [x + Math.cos(a) * r, yy, z + Math.sin(a) * r];
      const A = p(a0, ri, yy0), B = p(a0, ro, yy0), C = p(a1, ro, yy1), D = p(a1, ri, yy1);
      rampArr.push(...A, ...B, ...C, ...A, ...C, ...D);
    }
    emit(binRamps, rampArr, towerConcrete);

    // top: concrete cap, tapered drum, shallow cone, cylindrical mast bearing
    annulus(binRamps, x, T.topY + 0.02, z, coreR, R + 0.6, capPale, 44);
    annulus(binRamps, x, T.topY - 0.5, z, coreR, R + 0.6, towerDark, 44, false);
    shell(binRamps, x, T.topY - 0.24, z, R + 0.6, 0.52, towerWhite, 44);
    place(binRamps, new THREE.CylinderGeometry(4.9, 5.3, 2.1, 28), capPale, x, T.topY + 1.05, z);
    // vertical rib lines on the drum
    for (let k = 0; k < 12; k += 1) {
      const a = (k / 12) * TAU;
      const rr = 5.18;
      box(
        binRamps,
        x + Math.cos(a) * rr,
        T.topY + 1.05,
        z + Math.sin(a) * rr,
        0.1,
        1.9,
        0.18,
        coneDark,
        Math.atan2(Math.cos(a), Math.sin(a))
      );
    }
    annulus(binRamps, x, T.topY + 2.12, z, 4.6, 5.3, capPale, 32);
    place(binRamps, new THREE.CylinderGeometry(0.8, 5.4, 1.15, 32), coneDark, x, T.topY + 2.68, z);
    place(binRamps, new THREE.CylinderGeometry(1.2, 1.35, 0.55, 16), capPale, x, T.topY + 3.5, z);
    // steel tripod carrying the cigar mast
    for (let k = 0; k < 3; k += 1) {
      const a = (k / 3) * TAU + 0.3 + index * 0.05;
      pipe(
        binRamps,
        [x + Math.cos(a) * 4.4, T.topY + 2.2, z + Math.sin(a) * 4.4],
        [x, T.topY + 5.2, z],
        0.15,
        railSteel
      );
    }
    metrics.towers += 1;
  });

  // ---- metrics ------------------------------------------------------------
  metrics.addedMeshes = binFacade.mats.size + binRoof.mats.size + binRamps.mats.size + metrics.signs;
  metrics.facadeMaterials = { facade: binFacade.mats.size, roof: binRoof.mats.size, ramps: binRamps.mats.size };
  return metrics;
}
