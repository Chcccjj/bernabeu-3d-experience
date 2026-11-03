import * as THREE from 'three';

// ============================================================================
// Under-roof interior of the 2026 Etihad: the liner-tray soffit, the exposed
// radial rafter / purlin grid, the translucent polycarbonate edge band and its
// glazing rails, the deep leading-edge truss, the maintenance catwalk ring with
// handrails and cable trays, the floodlight banks, speaker clusters, rigging and
// the two LED screens hung at the north end, plus the service catwalk and light
// row under the 2026 north-roof front edge.
//
// Evidence
//   A  Arup Journal 2003 p33 / BUILDING_SPEC.verified: 76 radial rafters
//      (7.6 m grid), 0.30 m rafter width, 0.90 m max rafter depth, purlins at
//      4 m centres, 0.15 m liner tray depth, 10 m translucent edge band.
//   B  photographs: white/aluminium liner trays, deep leading-edge truss with
//      the walkway behind the band, rows of luminaires on the roof edge,
//      speaker clusters, two LED screens at the north corners, 2026 north-roof
//      service walkway with a row of lights under its front edge.
//   C  exact tray module width, luminaire schedule and screen size are fitted;
//      they are photographic approximations, not issued fixture drawings.
//
// The legacy torus sheet is clipped at z = -90 (the 2026 north stand replaces
// it), so every member is clipped against that line instead of floating in the
// new north-stand void. The liner sits LIFT below the sheet so that the
// structure above it (scene.js purlins/rafters) stays hidden behind it.
// ============================================================================

const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const XAX = new THREE.Vector3(1, 0, 0);
const IDQ = new THREE.Quaternion();
const vec = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const num = (v) => (Number.isFinite(v) ? v : 0);

export function buildStadiumInterior(ctx, { layers, kits, roof, glassU, bowlSections, materials, sign }) {
  const { pale, dark, steel, blueLight } = materials;
  const R = kits.roof;              // everything hung from the torus roof
  const L = kits.lighting;          // luminaires
  const V = kits.services;          // speakers, cable trays, rigging
  const metrics = {
    linerModules: 0, joints: 0, rafters: 0, purlins: 0,
    glazingRails: 0, trussSegments: 0, catwalkSegments: 0, gantries: 0,
    luminaireBanks: 0, luminaireHeads: 0, speakers: 0, screens: 0,
    cableTrays: 0, markers: 0, northCatwalkSegments: 0
  };

  // Documented geometry (metres below the roof sheet unless noted).
  const LIFT = 0.72;                 // liner tray soffit
  const PURLIN_TOP = 0.74, PURLIN_D = 0.14;
  const RAFTER_TOP = 0.90, RAFTER_D = 0.82, RAFTER_W = 0.30;
  const TRUSS_TOP = 0.86, TRUSS_DEPTH = 1.74, TRUSS_BOT = TRUSS_TOP + TRUSS_DEPTH;
  const CUT_Z = -89.35;              // legacy sheet clip at z = -90
  const NA = 192;                    // circumferential divisions (scene rhythm)
  const NR = 12;                     // radial divisions of a liner module
  const RAFTERS = 76;                // Arup: one rafter per original forestay
  const PURLIN_U = [0.24, 0.34, 0.44, 0.54, 0.64, 0.74, 0.84, 0.94];
  const PITCH_TARGET = [0, bowlSections?.tiers?.[0]?.y ?? -5.18, 0];

  // ------------------------------------------------------------------
  // Materials (ctx.mat -> toon finish used by the whole stadium)
  // ------------------------------------------------------------------
  // The soffit sits under the sheet, so neither the key light nor the sky
  // reaches it. Standard materials with a low constant emissive stand in for
  // the diffuse inter-reflection of the bowl; the value is a visual fit, kept
  // low enough that the floodlit night roof still models a light gradient.
  const metal = (name, color, roughness, metalness, glow, glowPower) => {
    const m = new THREE.MeshStandardMaterial({ name, color, roughness, metalness, emissive: glow, emissiveIntensity: glowPower, side: THREE.DoubleSide });
    return m;
  };
  const linerWhite = metal('White liner tray', '#e0e4dd', 0.92, 0.04, '#aeb6b2', 0.30);
  const linerAlu = metal('Natural aluminium liner tray', '#c9cfca', 0.66, 0.28, '#939b98', 0.24);
  const seamMat = ctx.mat('#9aa4a2', { side: THREE.DoubleSide });
  const ribMat = metal('Painted steel rafter', '#d2d9d4', 0.52, 0.32, '#8b9591', 0.30);
  const ribWebMat = metal('Rafter web / purlin steel', '#b6c1bf', 0.55, 0.35, '#737e7c', 0.26);
  const trussMat = metal('Leading-edge truss steel', '#bcc5c2', 0.5, 0.4, '#7d8886', 0.26);
  const catwalkMat = metal('Galvanised catwalk deck', '#5a686d', 0.78, 0.3, '#2c383d', 0.18);
  const gratingMat = metal('Catwalk grating', '#93a1a3', 0.7, 0.35, '#4c585c', 0.2);
  const railMat = metal('Handrail', '#e9eeea', 0.42, 0.4, '#a8b3af', 0.24);
  const trayMat = metal('Cable tray', '#c2cbc8', 0.55, 0.35, '#818b88', 0.22);
  const cableMat = ctx.mat('#2c363c');
  const housingMat = ctx.mat('#2e3a41');
  const lensMat = ctx.mat('#f1fbff', { emissive: '#e4f6ff', emissiveIntensity: 4.0 });
  const glowSoft = ctx.mat('#dfeefa', { emissive: '#bfe4ff', emissiveIntensity: 1.5 });
  const screenFrame = ctx.mat('#1e282f');
  const screenTrim = ctx.mat('#c9d0cc');
  const speakerMat = ctx.mat('#242d32');
  const speakerCone = ctx.mat('#38454c');

  // ------------------------------------------------------------------
  // Geometry helpers. All members are boxes: a handful of merged meshes per
  // material, no per-member Object3D, so the draw-call count stays flat.
  // ------------------------------------------------------------------
  const boxG = R.geo.box;
  const tmpRight = new THREE.Vector3();
  const tmpUp = new THREE.Vector3();

  function box(kit, m, x, y, z, sx, sy, sz, yaw = 0) {
    const q = yaw ? new THREE.Quaternion().setFromAxisAngle(UP, yaw) : IDQ;
    kit.geometry(boxG, m, new THREE.Matrix4().compose(vec([x, y, z]), q, new THREE.Vector3(sx, sy, sz)));
  }

  // Box strut spanning two points; w = width, d = depth (both perpendicular).
  function beam(kit, m, a, b, w, d) {
    const A = vec(a), B = vec(b);
    const dir = B.clone().sub(A);
    const len = dir.length();
    if (!(len > 1e-4)) return;
    dir.multiplyScalar(1 / len);
    const ref = Math.abs(dir.y) > 0.94 ? XAX : UP;
    tmpRight.crossVectors(dir, ref).normalize();
    tmpUp.crossVectors(tmpRight, dir).normalize();
    const m4 = new THREE.Matrix4().makeBasis(tmpRight, dir, tmpUp);
    m4.scale(new THREE.Vector3(w, len, d));
    m4.setPosition((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
    kit.geometry(boxG, m, m4);
  }

  // Box in an explicitly oriented frame: right/up/fwd are unit vectors.
  function oriented(kit, m, c, right, up, fwd, sx, sy, sz) {
    const m4 = new THREE.Matrix4().makeBasis(right, up, fwd);
    m4.scale(new THREE.Vector3(sx, sy, sz));
    m4.setPosition(c.x, c.y, c.z);
    kit.geometry(boxG, m, m4);
  }

  const rp = (t, u, drop = 0) => {
    const p = roof(t, u);
    return [num(p[0]), num(p[1]) - drop, num(p[2])];
  };
  const onSheet = (p) => p[2] >= CUT_Z;
  // Leading-edge / catwalk u, pulled in where the torus sheet is clipped.
  const edgeU = (t) => {
    let u = glassU(t) + 0.058;
    for (let k = 0; k < 40 && roof(t, u)[2] < CUT_Z; k += 1) u -= 0.006;
    return Math.max(glassU(t) + 0.012, u);
  };
  const uLiner0 = (t) => glassU(t) + 0.007;
  const U_LINER_1 = 0.972;

  // Generic quad strip from a list of {a,b} vertex pairs (a,b are the two
  // edges of the strip). Appends into a position/index bucket.
  function strip(bucket, pairs) {
    if (pairs.length < 2) return;
    const base = bucket.pos.length / 3;
    for (const [a, b] of pairs) bucket.pos.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    for (let i = 0; i < pairs.length - 1; i += 1) {
      const a = base + i * 2;
      bucket.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const bucket = () => ({ pos: [], idx: [] });
  function emitBucket(kit, m, b) {
    if (!b.idx.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    g.setIndex(b.idx);
    g.computeVertexNormals();
    kit.geometry(g, m);
    g.dispose();
  }

  // ------------------------------------------------------------------
  // 1. Liner tray soffit: 192 radial tray modules, every eighth one in
  //    natural aluminium, all following the torus surface LIFT below it.
  // ------------------------------------------------------------------
  const linerBuckets = new Map([[linerWhite, bucket()], [linerAlu, bucket()]]);
  for (let i = 0; i < NA; i += 1) {
    const t0 = (i / NA) * TAU;
    const t1 = ((i + 1) / NA) * TAU;
    const mat = i % 8 === 0 ? linerAlu : linerWhite;
    const b = linerBuckets.get(mat);
    const u0a = uLiner0(t0), u0b = uLiner0(t1);
    for (let j = 0; j < NR; j += 1) {
      const fa = j / NR, fb = (j + 1) / NR;
      const va = rp(t0, u0a + (U_LINER_1 - u0a) * fa, LIFT);
      const vb = rp(t0, u0a + (U_LINER_1 - u0a) * fb, LIFT);
      const vc = rp(t1, u0b + (U_LINER_1 - u0b) * fb, LIFT);
      const vd = rp(t1, u0b + (U_LINER_1 - u0b) * fa, LIFT);
      if (!onSheet(va) || !onSheet(vb) || !onSheet(vc) || !onSheet(vd)) continue;
      const base = b.pos.length / 3;
      b.pos.push(...va, ...vb, ...vc, ...vd);
      b.idx.push(base, base + 1, base + 3, base + 1, base + 2, base + 3);
    }
    metrics.linerModules += 1;
  }
  for (const [m, b] of linerBuckets) emitBucket(R, m, b);

  // Radial tray joints on every module boundary (dark shadow line).
  {
    const joints = bucket();
    for (let i = 0; i < NA; i += 1) {
      const t = (i / NA) * TAU;
      const pairs = [];
      const u0 = uLiner0(t);
      for (let j = 0; j <= 8; j += 1) {
        const u = u0 + (U_LINER_1 - u0) * (j / 8);
        const p = rp(t, u, LIFT + 0.012);
        if (!onSheet(p)) break;
        const pa = roof(t + 0.0015, u), pb = roof(t - 0.0015, u);
        let tx = pa[0] - pb[0], tz = pa[2] - pb[2];
        const l = Math.hypot(tx, tz) || 1;
        tx /= l; tz /= l;
        pairs.push([
          [p[0] - tx * 0.045, p[1], p[2] - tz * 0.045],
          [p[0] + tx * 0.045, p[1], p[2] + tz * 0.045]
        ]);
      }
      strip(joints, pairs);
      metrics.joints += 1;
    }
    emitBucket(R, seamMat, joints);
  }

  // Transverse tray laps at two intermediate rings (aluminium shadow gap).
  {
    const laps = bucket();
    for (const u of [0.40, 0.62, 0.84]) {
      const pairs = [];
      for (let i = 0; i <= NA; i += 1) {
        const t = (i / NA) * TAU;
        const p = rp(t, u, LIFT + 0.01);
        if (!onSheet(p)) { pairs.length = 0; continue; }
        const pa = roof(t, u + 0.0018), pb = roof(t, u - 0.0018);
        let rx = pa[0] - pb[0], ry = pa[1] - pb[1], rz = pa[2] - pb[2];
        const l = Math.hypot(rx, ry, rz) || 1;
        rx /= l; ry /= l; rz /= l;
        pairs.push([
          [p[0] - rx * 0.035, p[1] - ry * 0.035, p[2] - rz * 0.035],
          [p[0] + rx * 0.035, p[1] + ry * 0.035, p[2] + rz * 0.035]
        ]);
      }
      strip(laps, pairs);
    }
    emitBucket(R, seamMat, laps);
  }

  // Liner edge angle where the soffit starts behind the translucent band.
  for (let i = 0; i < NA; i += 2) {
    const t = (i / NA) * TAU;
    const t2 = ((i + 2) / NA) * TAU;
    const a = rp(t, uLiner0(t), LIFT + 0.05);
    const b = rp(t2, uLiner0(t2), LIFT + 0.05);
    const m = rp(t, uLiner0(t), LIFT + 0.20);
    beam(R, pale, [a[0], m[1], a[2]], [b[0], m[1] + (b[1] - a[1]), b[2]], 0.13, 0.16);
  }

  // ------------------------------------------------------------------
  // 2. Purlins (4 m documented centres) between liner and rafters, then the
  //    exposed 0.30 m x 0.90 m radial rafters.
  // ------------------------------------------------------------------
  for (const u of PURLIN_U) {
    for (let i = 0; i < NA; i += 2) {
      const t0 = (i / NA) * TAU, t1 = ((i + 2) / NA) * TAU;
      const a = rp(t0, u, PURLIN_TOP + PURLIN_D / 2);
      const b = rp(t1, u, PURLIN_TOP + PURLIN_D / 2);
      if (!onSheet(a) || !onSheet(b)) continue;
      beam(R, ribMat, a, b, 0.17, PURLIN_D);
      metrics.purlins += 1;
    }
  }

  for (let i = 0; i < RAFTERS; i += 1) {
    const t = (i / RAFTERS) * TAU;
    const u0 = uLiner0(t) + 0.006;
    const NSEG = 10;
    for (let j = 0; j < NSEG; j += 1) {
      const ua = u0 + (U_LINER_1 - u0) * (j / NSEG);
      const ub = u0 + (U_LINER_1 - u0) * ((j + 1) / NSEG);
      const a = rp(t, ua);
      const b = rp(t, ub);
      if (!onSheet(a) || !onSheet(b)) continue;
      // web (visible depth), then a bottom flange; top flange hidden by liner.
      beam(R, ribWebMat, [a[0], a[1] - (RAFTER_TOP + RAFTER_D * 0.5), a[2]], [b[0], b[1] - (RAFTER_TOP + RAFTER_D * 0.5), b[2]], 0.07, RAFTER_D);
      beam(R, ribMat, [a[0], a[1] - (RAFTER_TOP + RAFTER_D), a[2]], [b[0], b[1] - (RAFTER_TOP + RAFTER_D), b[2]], RAFTER_W, 0.10);
    }
    metrics.rafters += 1;
  }

  // ------------------------------------------------------------------
  // 3. Translucent band: visible concentric glazing rails and the structural
  //    fascia that closes the band against the liner.
  // ------------------------------------------------------------------
  for (const frac of [0.34, 0.68]) {
    for (let i = 0; i < NA; i += 2) {
      const t0 = (i / NA) * TAU, t1 = ((i + 2) / NA) * TAU;
      const u0 = glassU(t0) * frac, u1 = glassU(t1) * frac;
      const a = rp(t0, u0, 0.10);
      const b = rp(t1, u1, 0.10);
      if (!onSheet(a) || !onSheet(b)) continue;
      beam(R, trussMat, a, b, 0.07, 0.12);
      metrics.glazingRails += 1;
    }
  }
  for (let i = 0; i < NA; i += 2) {
    const t = (i / NA) * TAU;
    const t2 = ((i + 2) / NA) * TAU;
    const u = glassU(t) + 0.005;
    const u2 = glassU(t2) + 0.005;
    const a = rp(t, u, 0.14);
    const b = rp(t2, u2, 0.14);
    if (!onSheet(a) || !onSheet(b)) continue;
    beam(R, pale, [a[0], a[1] - 0.35, a[2]], [b[0], b[1] - 0.35, b[2]], 0.10, 0.70);
  }

  // ------------------------------------------------------------------
  // 4. Deep leading-edge truss, catwalk ring, handrails, cable trays and
  //    navigation markers. The truss carries the walkway; nothing floats.
  // ------------------------------------------------------------------
  const uEdgeList = [];
  for (let i = 0; i <= NA; i += 1) {
    const t = (i % NA) / NA * TAU;
    uEdgeList.push({ t, u: edgeU(t) });
  }
  for (let i = 0; i < NA; i += 2) {
    const e0 = uEdgeList[i], e1 = uEdgeList[i + 2];
    const topA = rp(e0.t, e0.u, TRUSS_TOP + 0.09);
    const topB = rp(e1.t, e1.u, TRUSS_TOP + 0.09);
    const botA = rp(e0.t, e0.u, TRUSS_TOP + TRUSS_DEPTH);
    const botB = rp(e1.t, e1.u, TRUSS_TOP + TRUSS_DEPTH);
    if (!onSheet(topA) || !onSheet(topB)) continue;
    beam(R, trussMat, topA, topB, 0.20, 0.18);                       // top chord
    beam(R, trussMat, botA, botB, 0.24, 0.22);                       // bottom chord
    beam(R, trussMat, [topA[0], topA[1] - 0.10, topA[2]], [botA[0], botA[1] + 0.10, botA[2]], 0.10, 0.10); // vertical
    const diagA = i % 4 === 0 ? topA : topB;
    const diagB = i % 4 === 0 ? botB : botA;
    beam(R, trussMat, [diagA[0], diagA[1] - 0.10, diagA[2]], [diagB[0], diagB[1] + 0.10, diagB[2]], 0.08, 0.08); // diagonal
    metrics.trussSegments += 1;

    // ---- catwalk deck and handrail ----------------------------------------
    const deckA = [botA[0], botA[1] + 0.14, botA[2]];
    const deckB = [botB[0], botB[1] + 0.14, botB[2]];
    beam(R, catwalkMat, deckA, deckB, 0.86, 0.07);
    beam(R, gratingMat, [deckA[0], deckA[1] + 0.045, deckA[2]], [deckB[0], deckB[1] + 0.045, deckB[2]], 0.80, 0.012);
    const railY = 1.10;
    for (const p of [deckA, deckB]) {
      beam(R, railMat, [p[0], p[1] + 0.03, p[2]], [p[0], p[1] + railY, p[2]], 0.055, 0.055);
    }
    for (const h of [railY, railY * 0.52]) {
      beam(R, railMat, [deckA[0], deckA[1] + h, deckA[2]], [deckB[0], deckB[1] + h, deckB[2]], 0.06, 0.06);
    }
    // toe board on the inner (pitch) edge of the walkway
    const toe0 = rp(e0.t, e0.u - 0.008);
    const toe1 = rp(e1.t, e1.u - 0.008);
    beam(R, catwalkMat, [toe0[0], deckA[1] + 0.08, toe0[2]], [toe1[0], deckB[1] + 0.08, toe1[2]], 0.05, 0.16);
    metrics.catwalkSegments += 1;

    // ---- cable tray along the walkway + navigation marker -----------------
    if (i % 8 === 0) {
      const trayA = rp(e0.t, e0.u + 0.004, TRUSS_BOT - 0.30);
      const trayB = rp(e1.t, e1.u + 0.004, TRUSS_BOT - 0.30);
      beam(V, trayMat, [trayA[0], deckA[1] + 0.30, trayA[2]], [trayB[0], deckB[1] + 0.30, trayB[2]], 0.30, 0.10);
      metrics.cableTrays += 1;
    }
    if (i % 16 === 0) {
      box(V, dark, deckA[0], deckA[1] + 0.55, deckA[2], 0.34, 0.42, 0.28);
    }
    if (i % 24 === 0) {
      box(L, blueLight, deckA[0], deckA[1] + railY + 0.12, deckA[2], 0.10, 0.10, 0.10);
      metrics.markers += 1;
    }
  }

  // ------------------------------------------------------------------
  // 5. Floodlight banks on the leading-edge truss: two rows of four heads,
  //    aimed at the pitch centre, hung under the walkway.
  // ------------------------------------------------------------------
  const rigBases = [];
  for (let i = 0; i < 32; i += 1) {
    const t = ((i + 0.5) / 32) * TAU;
    const u = edgeU(t);
    const anchor = rp(t, u, TRUSS_BOT + 0.02);         // under the bottom chord
    if (!onSheet(anchor)) continue;
    const c = new THREE.Vector3(anchor[0], anchor[1] - 0.95, anchor[2]);
    const fwd = new THREE.Vector3(PITCH_TARGET[0] - c.x, PITCH_TARGET[1] - c.y, PITCH_TARGET[2] - c.z).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    rigBases.push({ t, c, right, up, fwd });
    // backplate / frame
    oriented(L, housingMat, c.clone().addScaledVector(fwd, -0.36), right, up, fwd, 4.55, 1.32, 0.10);
    // two hanger rods up to the catwalk deck
    for (const dx of [-1.85, 1.85]) {
      const p = c.clone().addScaledVector(right, dx).addScaledVector(up, 0.62);
      beam(L, steel, [p.x, p.y + 0.04, p.z], [p.x, p.y + 0.46, p.z], 0.07, 0.07);
    }
    // two rows x four heads
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const p = c.clone()
          .addScaledVector(right, -1.62 + col * 1.08)
          .addScaledVector(up, 0.30 - row * 0.62);
        oriented(L, housingMat, p.clone().addScaledVector(fwd, 0.16), right, up, fwd, 0.66, 0.52, 0.62);
        oriented(L, lensMat, p.clone().addScaledVector(fwd, 0.50), right, up, fwd, 0.50, 0.36, 0.05);
        metrics.luminaireHeads += 1;
      }
    }
    // rear services box + drop cable to the tray
    box(V, housingMat, c.x - fwd.x * 0.55, c.y + 0.45, c.z - fwd.z * 0.55, 0.5, 0.35, 0.3);
    metrics.luminaireBanks += 1;
  }
  // Rigging drops from the walkway cable tray to each luminaire bank.
  for (const r of rigBases) {
    const top = r.c.clone().addScaledVector(r.up, 1.1);
    beam(V, cableMat, [top.x, top.y, top.z], [r.c.x, r.c.y + 0.4, r.c.z], 0.035, 0.035);
  }

  // ------------------------------------------------------------------
  // 6. Speaker clusters: three cabinets in a vertical line array, facing the
  //    pitch, with a bracket and safety cables back to the structure.
  // ------------------------------------------------------------------
  for (let i = 0; i < 16; i += 1) {
    const t = ((i + 0.5) / 16) * TAU + 0.06;
    const u = edgeU(t) + 0.012;
    const anchor = rp(t, u, TRUSS_BOT + 0.02);
    if (!onSheet(anchor)) continue;
    const c = new THREE.Vector3(anchor[0], anchor[1] - 0.62, anchor[2]);
    const fwd = new THREE.Vector3(PITCH_TARGET[0] - c.x, PITCH_TARGET[1] - c.y, PITCH_TARGET[2] - c.z).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    // bracket: two rods up to the walkway deck + a beam across
    for (const dx of [-0.55, 0.55]) {
      const p = c.clone().addScaledVector(right, dx);
      beam(L, steel, [p.x, p.y, p.z], [p.x, p.y + 0.74, p.z], 0.06, 0.06);
    }
    beam(L, steel, [c.x - right.x * 0.62, c.y + 0.38, c.z - right.z * 0.62], [c.x + right.x * 0.62, c.y + 0.38, c.z + right.z * 0.62], 0.07, 0.07);
    // 3 cabinets, slightly splayed
    for (let k = 0; k < 3; k += 1) {
      const p = c.clone().addScaledVector(up, -0.25 - k * 0.52).addScaledVector(fwd, -0.05 + k * 0.03);
      oriented(V, speakerMat, p, right, up, fwd, 1.10, 0.48, 0.58);
      for (const dx of [-0.30, 0.30]) {
        const d = p.clone().addScaledVector(right, dx).addScaledVector(fwd, 0.31);
        const m4 = new THREE.Matrix4().makeBasis(right, fwd, up);
        m4.scale(new THREE.Vector3(0.26, 0.06, 0.26));
        m4.setPosition(d.x, d.y, d.z);
        V.geometry(V.geo.cyl, speakerCone, m4);
        metrics.speakers += 1;
      }
    }
    for (const dx of [-0.42, 0.42]) {
      const a = c.clone().addScaledVector(right, dx).addScaledVector(up, 0.68);
      beam(V, cableMat, [a.x, a.y, a.z], [a.x, a.y - 1.55, a.z], 0.022, 0.022);
    }
  }

  // ------------------------------------------------------------------
  // 7. Radial maintenance gantries between the leading-edge walkway and the
  //    rim, hung from the rafter bottoms.
  // ------------------------------------------------------------------
  for (let g = 0; g < 8; g += 1) {
    const t = ((g + 0.5) / 8) * TAU;
    const u0 = edgeU(t) + 0.10;
    if (roof(t, u0)[2] < CUT_Z) continue;
    const NSEG = 8;
    let prev = null;
    for (let j = 0; j <= NSEG; j += 1) {
      const u = u0 + (0.94 - u0) * (j / NSEG);
      const p = rp(t, u, RAFTER_TOP + RAFTER_D + 0.66);
      if (!onSheet(p)) { prev = null; continue; }
      if (prev) {
        beam(R, gratingMat, prev, p, 0.62, 0.06);                     // deck
        const pa = roof(t + 0.0012, u), pb = roof(t - 0.0012, u);
        let tx = pa[0] - pb[0], tz = pa[2] - pb[2];
        const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        for (const side of [-1, 1]) {
          const a = [prev[0] + tx * 0.30 * side, prev[1] + 1.02, prev[2] + tz * 0.30 * side];
          const b = [p[0] + tx * 0.30 * side, p[1] + 1.02, p[2] + tz * 0.30 * side];
          beam(R, railMat, a, b, 0.045, 0.045);                       // handrail
          beam(R, railMat, [a[0], a[1] - 1.02, a[2]], [a[0], a[1] - 0.02, a[2]], 0.045, 0.045);
        }
        // hanger rod up to the purlin/rafter zone (between rafters)
        beam(R, steel, [p[0], p[1] + 0.06, p[2]], [p[0], p[1] + 1.62, p[2]], 0.05, 0.05);
        beam(R, steel, [p[0] - 0.12, p[1] + 1.60, p[2]], [p[0] + 0.12, p[1] + 1.60, p[2]], 0.06, 0.06);
      }
      prev = p;
    }
    metrics.gantries += 1;
  }

  // ------------------------------------------------------------------
  // 8. 2026 north-roof front edge: service catwalk, handrail and the row of
  //    round luminaires visible under the new north roof fascia.
  // ------------------------------------------------------------------
  const NH = 40.05;                 // new north roof underside near its south edge
  const NCW_Z = -91.5, NCW_Y = 37.62;
  {
    const segs = 12, x0 = -94, x1 = 94;
    for (let i = 0; i < segs; i += 1) {
      const xa = x0 + (x1 - x0) * (i / segs);
      const xb = x0 + (x1 - x0) * ((i + 1) / segs);
      beam(R, catwalkMat, [xa, NCW_Y, NCW_Z], [xb, NCW_Y, NCW_Z], 0.90, 0.08);
      beam(R, gratingMat, [xa, NCW_Y + 0.05, NCW_Z], [xb, NCW_Y + 0.05, NCW_Z], 0.82, 0.012);
      for (const x of [xa, xb]) {
        beam(R, railMat, [x, NCW_Y + 0.04, NCW_Z - 0.35], [x, NCW_Y + 1.12, NCW_Z - 0.35], 0.05, 0.05);
      }
      for (const h of [1.12, 0.58]) beam(R, railMat, [xa, NCW_Y + h, NCW_Z - 0.35], [xb, NCW_Y + h, NCW_Z - 0.35], 0.045, 0.045);
      // hangers up to the new north roof underside
      for (const x of [xa, xb]) {
        const camber = 0.55 * Math.max(0, 1 - Math.pow(x / 101, 2)) * 0.26;
        beam(R, steel, [x, NCW_Y + 0.04, NCW_Z - 0.35], [x, NH + camber, NCW_Z - 0.35], 0.06, 0.06);
      }
      metrics.northCatwalkSegments += 1;
    }
  }
  for (let i = 0; i < 9; i += 1) {
    const x = -80 + i * 20;
    const c = new THREE.Vector3(x, 37.18, NCW_Z + 0.55);
    const fwd = new THREE.Vector3(PITCH_TARGET[0] - c.x, PITCH_TARGET[1] - c.y, PITCH_TARGET[2] - c.z).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    // twin brackets from the catwalk underside
    beam(R, steel, [x - 0.45, NCW_Y - 0.06, NCW_Z], [x - 0.55, 37.44, NCW_Z + 0.35], 0.06, 0.06);
    beam(R, steel, [x + 0.45, NCW_Y - 0.06, NCW_Z], [x + 0.55, 37.44, NCW_Z + 0.35], 0.06, 0.06);
    oriented(L, housingMat, c, right, up, fwd, 1.18, 0.66, 0.72);
    oriented(L, lensMat, c.clone().addScaledVector(fwd, 0.40), right, up, fwd, 0.94, 0.50, 0.05);
    metrics.luminaireHeads += 1;
    metrics.luminaireBanks += 1;
  }

  // ------------------------------------------------------------------
  // 9. The two hung LED screens at the north end, facing the pitch centre.
  //    Frames, trims, four hoists up through the soffit and rear braces.
  //    Height/plan is fitted so the screen hangs in front of the old upper
  //    tier (max terrace below the footprint ~25.2 m, screen soffit 28.1 m).
  // ------------------------------------------------------------------
  // Height of the legacy torus sheet above a plan point: walk the radial line
  // that passes through the point and keep the closest sample.
  function roofAbove(x, z) {
    const t = (Math.atan2(z / 141, x / 122) + TAU) % TAU;
    let best = null;
    for (let k = 1; k <= 240; k += 1) {
      const u = k / 240;
      const p = roof(t, u);
      const d = Math.hypot(p[0] - x, p[2] - z);
      if (!best || d < best.d) best = { d, p };
    }
    return best.p;
  }
  const SCREEN_W = 15.8, SCREEN_H = 8.4;
  for (const [cx,cz] of [[-82,-78],[82,-78],[82,78]]) {
    const cy = 32.35;
    const yaw = Math.atan2(-cx, -cz);            // +Z face turned to the pitch centre
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const up = UP.clone();
    const c = new THREE.Vector3(cx, cy, cz);
    // chassis + bright rear trim (reads as the screen border)
    oriented(R, screenFrame, c.clone().addScaledVector(fwd, -0.30), right, up, fwd, SCREEN_W + 0.5, SCREEN_H + 0.5, 0.62);
    oriented(R, screenTrim, c.clone().addScaledVector(fwd, -0.62), right, up, fwd, SCREEN_W + 1.0, SCREEN_H + 1.0, 0.12);
    // LED face (canvas signage, emissive at night)
    const faceMat = ctx.signage.signMat('CITY 3 - 1', '#0a1a24', '#e9f7ff', false, 'MANCHESTER CITY · ETIHAD STADIUM', 'board');
    faceMat.userData.nightEmission = 4.5;
    ctx.emissives.push(faceMat);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), faceMat);
    face.name = `hung_led_screen_${cz>0?'se':cx<0?'nw':'ne'}_face`;
    face.userData={evidence:'C photo-fitted dimensions and position',source:'Manchester City roof update: SE jumbo screen in addition to two existing screens'};
    face.position.copy(c).addScaledVector(fwd, 0.02);
    face.rotation.y = yaw;
    layers.roof.add(face);
    (ctx.displaySurfaces??=[]).push({mesh:face,kind:'screen'});
    const topRailY = cy + SCREEN_H / 2 - 0.1;
    for (const dx of [-5.2, 5.2]) {
      const p = c.clone().addScaledVector(right, dx);
      const attach = roofAbove(p.x, p.z);
      const linerY = attach[1] - LIFT;
      // hoist through the soffit: flashing plate at the liner, rod up to the sheet
      beam(R, steel, [attach[0], attach[1] - LIFT, attach[2]], [p.x, topRailY, p.z], 0.10, 0.10);
      box(R, screenTrim, attach[0], linerY - 0.05, attach[2], 0.55, 0.10, 0.55);
      box(R, steel, attach[0], attach[1] - 0.04, attach[2], 0.30, 0.08, 0.30);
    }
    // rear diagonal braces back into the roof structure
    for (const dx of [-6.4, 6.4]) {
      const p = c.clone().addScaledVector(right, dx).addScaledVector(up, SCREEN_H / 2 - 0.3);
      const attach = roofAbove(p.x + Math.sin(yaw) * 2.4, p.z + Math.cos(yaw) * 2.4);
      beam(R, steel, [attach[0], attach[1] - LIFT, attach[2]], [p.x, p.y + 0.08, p.z], 0.07, 0.07);
    }
    // bottom service frame: ties the lower rail back to the two hoists
    for (const dx of [-6.9, 6.9]) {
      const p = c.clone().addScaledVector(right, dx).addScaledVector(up, -SCREEN_H / 2 + 0.25);
      beam(R, screenFrame, [p.x, p.y, p.z], [p.x, topRailY, p.z], 0.12, 0.12);
    }
    metrics.screens += 1;
  }

  // ------------------------------------------------------------------
  // 10. Liner maintenance strip at the rim and the under-soffit markers that
  //     read at night; the rim gutter shadow closes the soffit edge.
  // ------------------------------------------------------------------
  for (let i = 0; i < NA; i += 2) {
    const t = (i / NA) * TAU, t2 = ((i + 2) / NA) * TAU;
    const a = rp(t, 0.970, LIFT + 0.10);
    const b = rp(t2, 0.970, LIFT + 0.10);
    if (!onSheet(a) || !onSheet(b)) continue;
    beam(R, dark, a, b, 0.14, 0.22);
  }

  return metrics;
}
