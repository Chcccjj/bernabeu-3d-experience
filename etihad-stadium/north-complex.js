import * as THREE from 'three';
import { ETIHAD_FORM, northRoofSample } from './stadium-form.js';
import { buildNorthHeadframes } from './north-headframes.js';

// ============================================================================
// 2026 north stand complex: independent high roof, white folded-panel shell,
// two photographed headframes, hotel / retail wings and the City Square
// diagrid + ETFE canopy.
//
// A  new north stand with a single 59-row upper tier exists (club / Populous)
// A  two A-frame headframes with fan stays are visible in 2026 photographs
// A  white folded panels on the north shell; City Square canopy is a diagrid
// B  roof junction, panel modulation, hotel height/window rhythm
// C  exact coordinates remain photographic fits
//
// Visual conventions used here:
//   * the shared form (scene.js) now clips the legacy torus sheet at z=-90 and
//     the new sheet starts there at y≈40.0, ~0.4 m above the old roof, so the
//     junction is built as a low white gutter upstand + dark channel at z=-90.
//   * fascia depth = ETIHAD_FORM.plan.northRoof.fascia (2.2 m).
//   * the north shell/cheeks sit between z≈-122 and the z=-172 fascia.
// ============================================================================

export function buildNorthComplex(ctx, { kits, layers, sign, materials, roof, random }) {
  const F = ETIHAD_FORM;
  const N = F.plan.northRoof;
  const { pale, dark, steel, glass, cladding, roofMat, roofGlass, teal } = materials;
  const n = kits.north;
  const canopy = kits.canopy;
  const hotel = kits.hotel;

  const white = ctx.mat('#e9ece7', { side: THREE.DoubleSide });
  const shellWhite = ctx.mat('#e3e7e2', { side: THREE.DoubleSide });
  const finMat = ctx.mat('#dfe3df');
  const brick = ctx.mat('#9a6f55');
  const brickDark = ctx.mat('#7c5844');
  const tread = ctx.mat('#8d979a');
  const seamDark = ctx.mat('#6e797c');
  const darkSteel = ctx.mat('#3c4e58');
  const frameMat = ctx.mat('#546b77');
  const roofTrim = ctx.mat('#f2f4f0');
  const glazing = ctx.mat('#5f7a86', { transparent: true, opacity: 0.66, depthWrite: false });
  const interior = ctx.mat('#1c272c');
  const shellSeam = ctx.mat('#525d60');
  const gutterMat = ctx.mat('#3c4e58', { side: THREE.DoubleSide });
  const concreteLight = ctx.mat('#b3b7b1');
  const garden = ctx.mat('#6d866c');
  const warm = ctx.mat('#d9c69b', { emissive: '#f7cd86', emissiveIntensity: 0.9 });
  const metrics = { headframes: 0, canopyPanels: 0, roofSeams: 0, shellPanels: 0 };

  const halfAt = (s) => N.southHalfX + (N.northHalfX - N.southHalfX) * s;
  // Use the shared 2026 form untreated: its south edge already sits ~0.4 m
  // above the clipped legacy torus roof.
  const surf = (s, u) => northRoofSample(s, u, F);
  // Edge-specific outward normals: the north and south edges are straight in
  // plan, the tapered east/west edges use their local tangent. (A radial
  // approximation skewed the valley bed at the corners and left a see-through
  // slot over the clipped legacy roof.)
  const northDir = new THREE.Vector3(0, 0, -1);
  const southDir = new THREE.Vector3(0, 0, 1);
  const sideOut = (points, signSide) => (i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const tx = b[0] - a[0];
    const tz = b[2] - a[2];
    return new THREE.Vector3(signSide * -tz, 0, signSide * tx).normalize();
  };

  // Builds a triangle strip between consecutive rows of ordered points.
  function quadStrip(kit, rows, material) {
    const v = [];
    for (let r = 0; r < rows.length - 1; r += 1) {
      const A = rows[r];
      const B = rows[r + 1];
      for (let i = 0; i < A.length - 1; i += 1) {
        v.push(...A[i], ...B[i], ...A[i + 1], ...A[i + 1], ...B[i], ...B[i + 1]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    kit.geometry(g, material);
    g.dispose();
  }

  // ==========================================================================
  // 1. New north roof sheet — independent, higher than the legacy north rim
  // ==========================================================================
  const NS = 26;
  const NU = 44;
  const pos = [];
  const uv = [];
  for (let s = 0; s <= NS; s += 1) {
    for (let u = 0; u <= NU; u += 1) {
      const p = surf(s / NS, -1 + (2 * u) / NU);
      pos.push(p[0], p[1], p[2]);
      uv.push(u / NU, s / NS);
    }
  }
  const idx = [];
  for (let s = 0; s < NS; s += 1) {
    for (let u = 0; u < NU; u += 1) {
      const a = s * (NU + 1) + u;
      const b = a + 1;
      const c = a + (NU + 1);
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const roofGeo = new THREE.BufferGeometry();
  roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  roofGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  roofGeo.setIndex(idx);
  roofGeo.computeVertexNormals();
  n.geometry(roofGeo, roofMat);
  roofGeo.dispose();

  // Standing seams run south -> north (the photographed radial panel rhythm).
  for (let u = 0; u <= NU; u += 1) {
    const pts = [];
    for (let s = 0; s <= NS; s += 1) pts.push(surf(s / NS, -1 + (2 * u) / NU));
    for (let s = 1; s <= NS; s += 1) {
      n.pipe(
        [pts[s - 1][0], pts[s - 1][1] + 0.035, pts[s - 1][2]],
        [pts[s][0], pts[s][1] + 0.035, pts[s][2]],
        0.022, steel
      );
      metrics.roofSeams += 1;
    }
  }
  // A few transverse panel-end seams break up the large flat sheet.
  for (const s of [0.16, 0.34, 0.52, 0.70, 0.88]) {
    for (let u = 0; u < NU; u += 1) {
      const a = surf(s, -1 + (2 * u) / NU);
      const b = surf(s, -1 + (2 * (u + 1)) / NU);
      n.pipe([a[0], a[1] + 0.03, a[2]], [b[0], b[1] + 0.03, b[2]], 0.017, seamDark);
    }
  }

  // ---- deep white perimeter fascia (2.2 m) with drip lip -------------------
  const edgeN = 44;
  const northPts = [];
  const southPts = [];
  const eastPts = [];
  const westPts = [];
  for (let i = 0; i <= edgeN; i += 1) northPts.push(surf(1, -1 + (2 * i) / edgeN));
  for (let i = 0; i <= edgeN; i += 1) southPts.push(surf(0, -1 + (2 * i) / edgeN));
  for (let i = 0; i <= edgeN; i += 1) eastPts.push(surf(i / edgeN, 1));
  for (let i = 0; i <= edgeN; i += 1) westPts.push(surf(i / edgeN, -1));

  function edgeBand(points, depth, lip, material, outAt) {
    const profile = [
      [0.0, 0.10],
      [lip, 0.10],
      [lip, 0.10 - depth],
      [-0.32, 0.10 - depth],
      [-0.32, -0.28]
    ];
    const rows = [];
    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const o = outAt(i);
      rows.push(profile.map(([out, up]) => [p[0] + o.x * out, p[1] + up, p[2] + o.z * out]));
    }
    // profile rows are nested (outer face first), build quads feature by feature
    const v = [];
    for (let r = 0; r < rows.length - 1; r += 1) {
      for (let k = 0; k < profile.length - 1; k += 1) {
        const a = rows[r][k];
        const b = rows[r][k + 1];
        const c = rows[r + 1][k];
        const d = rows[r + 1][k + 1];
        v.push(...a, ...b, ...c, ...b, ...d, ...c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    n.geometry(g, material);
    g.dispose();
  }
  edgeBand(northPts, N.fascia, 0.62, white, () => northDir);
  edgeBand(eastPts, 1.9, 0.55, white, sideOut(eastPts, 1));
  edgeBand(westPts, 1.9, 0.55, white, sideOut(westPts, -1));

  // vertical panel joints + a continuous dark drip shadow on the north fascia
  for (let i = 0; i < northPts.length - 1; i += 1) {
    const p = northPts[i];
    const q = northPts[i + 1];
    const mx = (p[0] + q[0]) / 2;
    const my = (p[1] + q[1]) / 2;
    const mz = (p[2] + q[2]) / 2;
    const o = northDir;
    const yaw = Math.atan2(-(q[2] - p[2]), q[0] - p[0]);
    const len = Math.hypot(q[0] - p[0], q[2] - p[2]) * 0.94;
    n.box(mx + o.x * 0.645, my + 0.10 - N.fascia / 2, mz + o.z * 0.645, len, N.fascia - 0.35, 0.035, seamDark, yaw);
    n.box(mx + o.x * 0.645, my - 0.25, mz + o.z * 0.645, len, 0.16, 0.05, darkSteel, yaw);
    n.box(mx + o.x * 0.60, my + 0.15, mz + o.z * 0.60, len, 0.06, 0.10, roofTrim, yaw);
  }
  // fascia maintenance ladders (photo: gantries on the north face)
  for (const x of [-70, 70]) {
    const p = surf(1, Math.max(-0.95, Math.min(0.95, x / halfAt(1))));
    const o = northDir;
    for (const d of [-0.32, 0.32]) {
      const bx = p[0] + o.x * 0.68 + d * 0.9;
      const bz = p[2] + o.z * 0.68;
      n.pipe([bx, p[1] + 0.1, bz], [bx, p[1] - N.fascia - 1.2, bz], 0.05, steel);
    }
    for (let r = 0; r < 6; r += 1) {
      const y = p[1] - N.fascia - 0.1 - r * 0.42;
      n.box(p[0] + o.x * 0.68, y, p[2] + o.z * 0.68, 1.8, 0.06, 0.06, steel);
    }
  }
  // big rectangular rainwater downpipes on the north shell (visible in photo)
  for (const x of [-63, 63]) {
    const p = surf(1, Math.max(-0.95, Math.min(0.95, x / halfAt(1))));
    const bottom = 9.0;
    const top = p[1] - N.fascia - 0.35;
    n.box(x, (top + bottom) / 2, p[2] + 2.35, 0.72, top - bottom, 0.5, ctx.mat('#9aa2a2'));
    n.box(x, top - 0.5, p[2] + 2.3, 1.0, 0.7, 0.8, seamDark);
    for (let y = bottom + 3; y < top - 1; y += 5.5) {
      n.box(x, y, p[2] + 2.3, 0.9, 0.18, 0.62, darkSteel);
    }
  }

  // ---- roof-edge walkway + glass balustrade --------------------------------
  const walkRows = [];
  for (const p of northPts) {
    const o = northDir;
    walkRows.push([
      [p[0] - o.x * 0.05, p[1] + 0.06, p[2] - o.z * 0.05],
      [p[0] - o.x * 1.65, p[1] + 0.06, p[2] - o.z * 1.65]
    ]);
  }
  quadStrip(n, walkRows, tread);
  quadStrip(n, [
    northPts.map((p) => [p[0], p[1] + 0.06, p[2] + 1.65]),
    northPts.map((p) => [p[0], p[1] - 0.34, p[2] + 1.85])
  ], white);

  function parapet(points, outAt) {
    const bottom = [];
    const top = [];
    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const o = outAt(i);
      bottom.push([p[0] + o.x * 0.60, p[1] + 0.14, p[2] + o.z * 0.60]);
      top.push([p[0] + o.x * 0.76, p[1] + 1.36, p[2] + o.z * 0.76]);
    }
    quadStrip(n, [bottom, top], roofGlass);
    for (let i = 0; i < points.length - 1; i += 1) {
      if (i % 3 === 0) n.pipe(bottom[i], top[i], 0.045, steel);
      n.pipe(top[i], top[i + 1], 0.05, steel);
      n.pipe(bottom[i], bottom[i + 1], 0.035, darkSteel);
    }
  }
  parapet(northPts, () => northDir);
  parapet(eastPts, sideOut(eastPts, 1));
  parapet(westPts, sideOut(westPts, -1));

  // ---- south junction: valley gutter catching the legacy torus roof -------
  // The clipped legacy sheet ends at z=-90 at y≈39.55; the new sheet edge sits
  // ~0.2-0.4 m above it. A low white upstand folds the new sheet down into the
  // old roof, with a dark channel and outlet boxes on the legacy side. The
  // ridge stays below y=40.55 (0.55 m above the 40.0 edge datum).
  const ridgeTop = 40.55;
  const ridgeIn = [];
  const ridgeOut = [];
  const channelLip = [];
  const channelFoot = [];
  for (const p of southPts) {
    const o = southDir;
    ridgeIn.push([p[0] - o.x * 0.02, p[1] + 0.015, p[2] - o.z * 0.02]);
    ridgeOut.push([p[0] + o.x * 0.30, ridgeTop, p[2] + o.z * 0.30]);
    channelLip.push([p[0] + o.x * 0.58, 40.02, p[2] + o.z * 0.58]);
    channelFoot.push([p[0] + o.x * 0.92, 39.50, p[2] + o.z * 0.92]);
  }
  quadStrip(n, [ridgeIn, ridgeOut], white);        // north face of the upstand
  quadStrip(n, [ridgeOut, channelLip], white);     // folded top into the channel
  quadStrip(n, [channelLip, channelFoot], gutterMat); // dark gutter channel
  // wide gutter bed bridging the clipped legacy metal strip (z≈-89..-88) so the
  // junction reads as a drainage channel instead of a slot into the interior
  const bedFar = southPts.map((p) => [p[0], 39.62, p[2] + 3.4]);
  quadStrip(n, [channelFoot, bedFar], gutterMat);
  for (let i = 0; i < ridgeOut.length - 1; i += 1) {
    n.pipe(ridgeOut[i], ridgeOut[i + 1], 0.07, seamDark);
    n.pipe(ridgeIn[i], ridgeIn[i + 1], 0.05, darkSteel);
  }
  // gutter outlets + valley downpipe stubs at both ends of the junction
  for (const x of [-99.5, 99.5]) {
    const p = surf(0, Math.max(-0.98, Math.min(0.98, x / halfAt(0))));
    n.box(x, 39.75, p[2] + 0.75, 1.15, 0.55, 1.5, darkSteel);
    n.box(x, 38.9, p[2] + 0.9, 0.66, 1.7, 0.5, ctx.mat('#9aa2a2'));
    n.box(x, 38.15, p[2] + 0.9, 0.9, 0.3, 0.66, darkSteel);
  }

  // ==========================================================================
  // 2. White folded-panel north shell
  // ==========================================================================
  const shellZ = N.northZ + 2.6;            // -169.4, set back under the fascia
  const shellHalf = N.northHalfX - 2;       // 84 m half width
  const ground = 0.82;
  const podiumTop = 2.7;
  const concourseTop = 8.6;
  const shellTop = 33.4;
  const skyBarTop = 37.6;
  const parapetTop = 39.2;

  // podium + recessed glazed concourse
  n.box(0, (ground + podiumTop) / 2, shellZ + 0.35, shellHalf * 2 + 1.6, podiumTop - ground, 1.0, ctx.mat('#586366'));
  n.box(0, (podiumTop + concourseTop) / 2, shellZ - 0.80, shellHalf * 2 - 1.6, concourseTop - podiumTop, 0.20, interior);
  n.box(0, (podiumTop + concourseTop) / 2, shellZ + 0.10, shellHalf * 2 - 1.2, concourseTop - podiumTop, 0.18, glazing);
  for (let x = -shellHalf + 2; x <= shellHalf - 2; x += 2.9) {
    n.box(x, (podiumTop + concourseTop) / 2, shellZ + 0.24, 0.16, concourseTop - podiumTop, 0.12, finMat);
  }
  n.box(0, 5.5, shellZ + 0.26, shellHalf * 2 - 1.2, 0.20, 0.14, finMat);
  n.box(0, concourseTop + 0.15, shellZ + 0.30, shellHalf * 2 + 0.8, 0.42, 0.55, white);
  // main entrance: taller glazed bay + canopy
  n.box(0, 4.4, shellZ + 0.22, 22, 7.2, 0.16, glazing);
  for (let x = -9; x <= 9; x += 3.0) n.box(x, 4.4, shellZ + 0.34, 0.16, 7.2, 0.12, finMat);
  n.box(0, 8.9, shellZ + 0.9, 24, 0.45, 2.1, white);
  n.box(0, 8.55, shellZ + 0.9, 23, 0.2, 2.0, darkSteel);
  // warm interior light behind the concourse glazing (night)
  n.box(0, 5.6, shellZ - 0.45, shellHalf * 2 - 8, 0.28, 0.12, warm);

  // large folded white plates (big triangular/trapezoidal facets)
  const cols = 16;
  const rowY = [8.6, 13.6, 18.6, 23.6, 28.6, 33.4];
  const foldOf = (c, r) => {
    if (c === 0 || c === cols) return 0;
    const a = c % 2 === 0 ? 1 : -1;
    const b = r % 2 === 0 ? 1 : -1;
    let f = 1.05 * a + 0.42 * a * b;
    if ((c + r) % 3 === 0) f -= 0.55;
    return f;
  };
  const grid = [];
  for (let r = 0; r < rowY.length; r += 1) {
    const row = [];
    for (let c = 0; c <= cols; c += 1) {
      const x = -shellHalf + (2 * shellHalf * c) / cols;
      row.push([x, rowY[r], shellZ + foldOf(c, r)]);
    }
    grid.push(row);
  }
  const foldVerts = [];
  for (let r = 0; r < rowY.length - 1; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const A = grid[r][c];
      const B = grid[r][c + 1];
      const C = grid[r + 1][c];
      const D = grid[r + 1][c + 1];
      if ((c + r) % 2 === 0) foldVerts.push(...A, ...C, ...B, ...B, ...C, ...D);
      else foldVerts.push(...A, ...C, ...D, ...A, ...D, ...B);
    }
  }
  const foldGeo = new THREE.BufferGeometry();
  foldGeo.setAttribute('position', new THREE.Float32BufferAttribute(foldVerts, 3));
  foldGeo.computeVertexNormals();
  n.geometry(foldGeo, shellWhite);
  foldGeo.dispose();
  metrics.shellPanels = cols * (rowY.length - 1);
  // fold ridges: vertical joints + alternate diagonal plate seams
  for (let c = 1; c < cols; c += 1) {
    for (let r = 0; r < rowY.length - 1; r += 1) {
      const a = grid[r][c];
      const b = grid[r + 1][c];
      n.pipe([a[0], a[1], a[2] + 0.02], [b[0], b[1], b[2] + 0.02], 0.085, shellSeam);
    }
  }
  for (let r = 0; r < rowY.length - 1; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if ((c + r) % 2 !== 0) continue;
      const a = grid[r][c];
      const d = grid[r + 1][c + 1];
      n.pipe([a[0], a[1], a[2] + 0.02], [d[0], d[1], d[2] + 0.02], 0.06, shellSeam);
    }
  }
  // horizontal band break and a shadow slot under the sky-bar
  n.box(0, 21.1, shellZ + 0.35, shellHalf * 2 - 1, 0.34, 0.35, concreteLight);
  n.box(0, shellTop + 0.25, shellZ + 0.30, shellHalf * 2 + 1.2, 1.0, 0.6, white);
  n.box(0, shellTop - 0.12, shellZ + 0.36, shellHalf * 2 - 1, 0.22, 0.15, darkSteel);

  // sky-bar glass band + white head band
  n.box(0, (shellTop + skyBarTop) / 2, shellZ - 0.80, shellHalf * 2 - 1.6, skyBarTop - shellTop, 0.20, interior);
  n.box(0, (shellTop + skyBarTop) / 2, shellZ + 0.10, shellHalf * 2 - 1.2, skyBarTop - shellTop, 0.20, glazing);
  for (let x = -shellHalf + 2; x <= shellHalf - 2; x += 3.2) {
    n.box(x, (shellTop + skyBarTop) / 2, shellZ + 0.24, 0.16, skyBarTop - shellTop, 0.12, finMat);
  }
  n.box(0, (shellTop + skyBarTop) / 2, shellZ + 0.26, shellHalf * 2 - 1.2, 0.18, 0.14, finMat);
  n.box(0, (skyBarTop + parapetTop) / 2, shellZ + 0.25, shellHalf * 2 + 1.0, parapetTop - skyBarTop, 0.7, white);
  n.box(0, (shellTop + skyBarTop) / 2, shellZ - 0.42, shellHalf * 2 - 8, 0.24, 0.12, warm);
  // end pilasters
  for (const side of [-1, 1]) {
    n.box(side * (shellHalf + 0.1), 20.0, shellZ + 0.45, 1.5, 38.2, 0.9, white);
  }

  // side returns: folded white cheeks from the north facade back to z≈-122
  const sideSouthZ = -122;
  const sideSouthX = halfAt((sideSouthZ - N.southZ) / (N.northZ - N.southZ)) - 2;
  for (const side of [-1, 1]) {
    const ax = side * shellHalf;
    const bx = side * sideSouthX;
    const xOf = (f) => ax + (bx - ax) * f;
    const zOf = (f) => shellZ + (sideSouthZ - shellZ) * f;
    const rows = [];
    const yRows = [ground, 8.6, 14.6, 20.6, 26.6, 32.6, parapetTop];
    for (let r = 0; r < yRows.length; r += 1) {
      const row = [];
      for (let i = 0; i <= 4; i += 1) {
        const f = i / 4;
        const fold = i === 0 || i === 4 ? 0 : (i % 2 === 1 ? -0.5 : 0.7);
        row.push([xOf(f) + side * fold * (r === 0 ? 0 : 1), yRows[r], zOf(f)]);
      }
      rows.push(row);
    }
    const v = [];
    for (let r = 0; r < rows.length - 1; r += 1) {
      for (let i = 0; i < rows[r].length - 1; i += 1) {
        const A = rows[r][i];
        const B = rows[r][i + 1];
        const C = rows[r + 1][i];
        const D = rows[r + 1][i + 1];
        v.push(...A, ...B, ...C, ...B, ...D, ...C);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    n.geometry(g, shellWhite);
    g.dispose();
    // glazed base along the side return
    quadStrip(n, [
      [0, 1, 2, 3, 4].map((i) => [xOf(i / 4), ground, zOf(i / 4)]),
      [0, 1, 2, 3, 4].map((i) => [xOf(i / 4), 8.6, zOf(i / 4)])
    ], glass);
    // fold seam on the side cheek
    for (const i of [1, 2, 3]) {
      for (let r = 1; r < rows.length - 1; r += 1) {
        const a = rows[r][i];
        const b = rows[r + 1][i];
        n.pipe([a[0], a[1], a[2] + side * 0.02], [b[0], b[1], b[2] + side * 0.02], 0.045, seamDark);
      }
    }
  }

  // ==========================================================================
  // 3. Two A-frame headframes (north-headframes.js)
  // ==========================================================================
  const headframes = buildNorthHeadframes(ctx, {
    layers,
    northRoofSample: (s, u) => surf(s, u),
    materials: { steel, teal, dark, pale }
  });
  metrics.headframes = headframes.frames.length;
  metrics.headframeLegs = headframes.frames.reduce((sum, f) => sum + f.legs, 0);
  metrics.headframeStays = headframes.stayCount;
  void roof;

  // ==========================================================================
  // 4. Hotel + retail wings (folded fins, glass bands, brick podium, plant)
  // ==========================================================================
  const wings = [
    { x: -65, z: -195, w: 39, d: 70, h: 37, podium: 7.6 },
    { x: 61, z: -190, w: 43, d: 62, h: 25, podium: 6.8 }
  ];
  for (const wg of wings) {
    const { x, z, w, d, h, podium } = wg;
    const yc = (podium + h) / 2 + ground;
    // brick-red podium
    hotel.box(x, podium / 2 + ground, z, w + 2.4, podium, d + 2.4, brick);
    hotel.box(x, podium + 0.15, z, w + 1.0, 0.32, d + 1.0, brickDark);
    const sFace = z + (d + 2.4) / 2 + 0.06;
    for (let xx = x - w / 2 + 1.6; xx < x + w / 2 - 1.2; xx += 5.0) {
      hotel.box(xx + 2.0, 3.2 + ground, sFace, 3.7, 3.6, 0.16, glass);
      hotel.box(xx + 4.3, 3.2 + ground, sFace + 0.02, 1.3, 3.9, 0.5, brickDark);
      hotel.box(xx + 2.0, 3.2 + ground, sFace + 0.14, 0.10, 3.5, 0.10, steel);
    }
    // facade canopy above the podium
    hotel.box(x, podium + 1.05 + ground, z, w + 3.8, 0.5, d + 3.8, pale);
    hotel.box(x, podium + 0.72 + ground, z, w + 3.4, 0.25, d + 3.4, darkSteel);
    // main glazed/aluminium volume
    hotel.box(x, yc, z, w, h - podium, d, cladding);
    // horizontal spandrel bands on all four faces (deep slab edges read over
    // the vertical fins, as in hotel-wing-2025.jpg)
    for (let y = podium + 1.6; y < h - 0.8; y += 3.5) {
      hotel.box(x, y + ground, z, w + 1.15, 0.38, d + 1.15, pale);
      hotel.box(x, y + ground - 0.26, z, w + 1.05, 0.10, d + 1.05, darkSteel);
    }
    // glazing strips on the three visible faces
    for (let y = podium + 1.6; y < h - 0.8; y += 3.5) {
      hotel.box(x, y + 1.75 + ground, z + d / 2 + 0.04, w - 1.4, 2.9, 0.16, glass);
      for (const side of [-1, 1]) {
        hotel.box(x + side * (w / 2 + 0.04), y + 1.75 + ground, z, 0.16, 2.9, d - 1.4, glass);
      }
    }
    // vertical folded aluminium fins
    for (let xx = x - w / 2 + 1.0; xx <= x + w / 2 - 0.6; xx += 2.5) {
      const deep = Math.round((xx - x) / 2.5) % 2 === 0;
      hotel.box(xx, yc, z + d / 2 + (deep ? 0.52 : 0.26), 0.18, h - podium - 0.6, deep ? 0.72 : 0.38, finMat);
    }
    for (const side of [-1, 1]) {
      for (let zz = z - d / 2 + 2.0; zz <= z + d / 2 - 1.4; zz += 4.0) {
        hotel.box(x + side * (w / 2 + 0.48), yc, zz, 0.52, h - podium - 0.6, 0.18, finMat);
      }
      hotel.box(x + side * (w / 2 + 0.20), yc, z, 0.35, h - podium - 0.4, d - 0.6, glass);
    }
    // rooftop: parapet, plant, green roof, railings
    hotel.box(x, h + 0.62 + ground, z, w + 1.5, 0.9, d + 1.5, pale);
    hotel.box(x, h + 1.2 + ground, z, w - 3, 0.4, d - 3, garden);
    for (const [ox, oz, pw, ph, pd] of [
      [-w * 0.22, -d * 0.22, 6.0, 2.4, 5.0],
      [w * 0.10, -d * 0.10, 7.5, 3.0, 4.0],
      [w * 0.26, d * 0.24, 4.5, 1.8, 4.5]
    ]) {
      hotel.box(x + ox, h + 1.9 + ground + ph / 2, z + oz, pw, ph, pd, concreteLight);
      for (let k = 0; k < 4; k += 1) {
        hotel.box(x + ox, h + 1.9 + ground + 0.4 + k * (ph / 4), z + oz + pd / 2 + 0.06, pw - 0.5, 0.10, 0.10, darkSteel);
      }
    }
    for (let xx = x - w / 2; xx <= x + w / 2; xx += 3.4) {
      for (const zz of [z - d / 2 - 0.9, z + d / 2 + 0.9]) {
        hotel.box(xx, h + 2.0 + ground, zz, 0.07, 1.6, 0.07, steel);
      }
    }
    // corner glass returns
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      hotel.box(x + sx * w / 2, yc, z + sz * d / 2, 1.6, h - podium - 0.6, 1.6, glass);
    }
  }
  // low brick retail row on the north side of the west wing
  for (let x = -84; x < -46; x += 3.2) {
    hotel.box(x, 3 + ground, -230.6, 2.9, 4.2, 0.25, glass);
    hotel.box(x - 1.55, 3 + ground, -230.6, 0.22, 5.0, 0.55, brick);
  }
  hotel.box(-65, 5.5 + ground, -231.0, 40, 1.2, 0.8, brick);
  sign(layers.hotel, 'THE MEDLOCK', -65, 33.5, -231.2, 27, 2.8, Math.PI, '#2c3f49', '#d6e0de');
  sign(layers.hotel, 'CITY STORE', 61, 6.4, -221.6, 27, 2.6, Math.PI, '#2c3f49', '#e9f3ed');
  sign(layers.north, 'CITY SQUARE', 0, 7.9, shellZ + 0.46, 24, 2.2, Math.PI, '#263f4c', '#e2eff1');

  // ==========================================================================
  // 5. City Square: diamond diagrid + translucent ETFE cushions
  // ==========================================================================
  const gx = 16;
  const gz = 7;
  const x0 = -44;
  const x1 = 40;
  const z0 = -171.5;
  const z1 = -213;
  const baseY = 15.2;
  const node = (i, j) => {
    const x = x0 + ((x1 - x0) * i) / gx;
    const z = z0 + ((z1 - z0) * j) / gz;
    const dome = Math.pow(Math.sin((Math.PI * i) / gx), 1.15) * Math.pow(Math.sin((Math.PI * j) / gz), 1.15) * 3.0;
    return [x, baseY + dome, z];
  };
  const nodes = [];
  for (let j = 0; j <= gz; j += 1) {
    nodes.push([]);
    for (let i = 0; i <= gx; i += 1) nodes[j].push(node(i, j));
  }
  const truss = 0.55;
  // upper + lower chords of the diamond diagrid, verticals at every node
  for (let j = 0; j <= gz; j += 1) {
    for (let i = 0; i <= gx; i += 1) {
      const p = nodes[j][i];
      if (i < gx && j < gz) {
        const a = nodes[j][i];
        const b = nodes[j + 1][i + 1];
        const c = nodes[j][i + 1];
        const d = nodes[j + 1][i];
        canopy.pipe(a, b, 0.15, darkSteel);
        canopy.pipe(c, d, 0.15, darkSteel);
        canopy.pipe([a[0], a[1] - truss, a[2]], [b[0], b[1] - truss, b[2]], 0.10, darkSteel);
        canopy.pipe([c[0], c[1] - truss, c[2]], [d[0], d[1] - truss, d[2]], 0.10, darkSteel);
      }
      canopy.pipe([p[0], p[1] - truss, p[2]], p, 0.08, steel);
      canopy.ball(p[0], p[1] + 0.02, p[2], 0.30, 0.30, 0.30, darkSteel);
      metrics.canopyPanels += 0;
    }
  }
  // ETFE cushions: smooth double-curved 3x3 patches between the diamond nodes
  for (let j = 0; j < gz; j += 1) {
    for (let i = 0; i < gx; i += 1) {
      const A = nodes[j][i];
      const B = nodes[j][i + 1];
      const C = nodes[j + 1][i + 1];
      const D = nodes[j + 1][i];
      const verts = [];
      const grid3 = [];
      for (let a = 0; a <= 3; a += 1) {
        const row = [];
        for (let b = 0; b <= 3; b += 1) {
          const u = a / 3;
          const v = b / 3;
          const x = A[0] * (1 - u) * (1 - v) + B[0] * u * (1 - v) + C[0] * u * v + D[0] * (1 - u) * v;
          const y = A[1] * (1 - u) * (1 - v) + B[1] * u * (1 - v) + C[1] * u * v + D[1] * (1 - u) * v;
          const z = A[2] * (1 - u) * (1 - v) + B[2] * u * (1 - v) + C[2] * u * v + D[2] * (1 - u) * v;
          row.push([x, y + 0.42 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v), z]);
        }
        grid3.push(row);
      }
      for (let a = 0; a < 3; a += 1) {
        for (let b = 0; b < 3; b += 1) {
          const p = grid3[a][b];
          const q = grid3[a][b + 1];
          const r = grid3[a + 1][b + 1];
          const s = grid3[a + 1][b];
          verts.push(...p, ...q, ...r, ...p, ...r, ...s);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      g.computeVertexNormals();
      canopy.geometry(g, roofGlass);
      g.dispose();
      metrics.canopyPanels += 1;
    }
  }
  // perimeter edge beam
  const border = [];
  for (let i = 0; i <= gx; i += 1) border.push(nodes[0][i]);
  for (let j = 1; j <= gz; j += 1) border.push(nodes[j][gx]);
  for (let i = gx - 1; i >= 0; i -= 1) border.push(nodes[gz][i]);
  for (let j = gz - 1; j >= 1; j -= 1) border.push(nodes[j][0]);
  for (let i = 0; i < border.length; i += 1) {
    const a = border[i];
    const b = border[(i + 1) % border.length];
    canopy.pipe(a, b, 0.26, darkSteel);
    canopy.pipe([a[0], a[1] - 0.75, a[2]], [b[0], b[1] - 0.75, b[2]], 0.12, darkSteel);
  }
  // few raking columns, forks at the head
  for (const [ci, cj] of [[3, 2], [gx - 3, 2], [3, gz - 2], [gx - 3, gz - 2]]) {
    const top = nodes[cj][ci];
    const dirX = Math.sign(top[0]) || 1;
    const base = [top[0] + dirX * 2.6, ground, top[2] + (cj < gz / 2 ? -2.2 : 2.2)];
    canopy.pipe(base, [top[0], top[1] - 0.55, top[2]], 0.34, darkSteel);
    canopy.box(base[0], ground + 0.20, base[2], 2.0, 0.4, 2.0, concreteLight);
    canopy.pipe([top[0], top[1] - 0.55, top[2]], [top[0] + 2.6, top[1] - 0.15, top[2] - 2.0], 0.18, darkSteel);
    canopy.pipe([top[0], top[1] - 0.55, top[2]], [top[0] - 2.6, top[1] - 0.15, top[2] + 2.0], 0.18, darkSteel);
  }
  // link the canopy edge to the west hotel wing
  for (const j of [1, 3, 5]) {
    const p = nodes[j][0];
    canopy.pipe(p, [x0 - 1.7, p[1] - 0.6, p[2]], 0.20, darkSteel);
  }
  // warm under-canopy lights
  for (const [x, z] of [[-24, -190], [0, -194], [24, -190], [-24, -200], [0, -204], [24, -200]]) {
    canopy.box(x, 13.2, z, 1.6, 0.18, 1.6, warm);
  }

  // warm illuminated band on the City Square face of each podium (the old
  // version was buried inside the new podium mass)
  for (const [x, z, d] of [[-65, -195, 70], [61, -190, 62]]) {
    const face = z + d / 2 + 1.22;
    hotel.box(x, 4.4 + ground, face, 22, 1.5, 0.14, warm);
    hotel.box(x, 4.4 + ground, face - 0.18, 22, 2.0, 0.24, darkSteel);
    for (let xx = x - 10; xx <= x + 10; xx += 5) {
      hotel.box(xx, 4.4 + ground, face + 0.06, 0.12, 1.6, 0.12, steel);
    }
  }

  return metrics;
}
