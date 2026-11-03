import * as THREE from 'three';

// ============================================================================
// Matchday seating - 61,102 real bucket seats, not a blue texture.
//
// Local space is the frame scene.js instances: the origin sits on the seat
// centre line 0.17 m above the concrete tread, +Z looks at the pitch, -Z at
// the row behind and +X runs along the row.  Two detail levels are instanced
// separately:
//
//   * lower, middle and north-lower seats (world y < 19.5 m): moulded shell -
//     dished pan with a rolled front lip, wrap-around reclined back with a
//     rounded head roll, two armrests and a four-part steel underframe.
//   * upper tier and north upper rows: a 3-box silhouette (cheap, still
//     correctly proportioned and facing the pitch).
//
// The shell carries vertex-colour ambient shading (dark under the pan, crisp
// on the head roll) and every seat gets its own blue from a hash, so the bowl
// breaks up without a visible pattern.  Four draw calls in total.
//
// A  61,102 seats and tier heights (site metadata / scene.js)
// B  seat proportions: 470 mm pan, 480 mm back, 785 mm overall height
// C  moulded profile fitted from stadium interior photographs
// ============================================================================

const TREAD = -0.17;            // tread top in seat local space
const SHELL = 0.043;            // moulded shell thickness

// Pan: 470 wide, 394 deep, front edge ~0.32 m above the tread.
const PAN_HALF = 0.235;
const PAN_BACK = -0.156;
const PAN_FRONT = 0.238;
const PAN_MID_Y = 0.138;

// Back: 480 wide at the base tapering to 450 mm, reclined ~12 degrees.
const BACK_HALF = 0.24;
const BACK_BOT = 0.10;
const BACK_TOP = 0.615;
const BACK_LEAN = 0.115;

// Armrests: 512 mm apart, pad 0.22 m above the pan.
const ARM_X = 0.256;
const ARM_TOP = 0.377;
const ARM_BOT = 0.3155;

// Detail split: lower + middle + north lower are close to the camera.
const SIMPLE_FROM_Y = 0.5;

// Seat blues: the four site seat finishes, plus hashed lightness / hue drift.
const FALLBACK_PALETTE = ['#5f9cc0', '#6ba7c9', '#77b1d0', '#4d7f9f'];
const HASH_MUL = 0x9e3779b1;

function hash01(n) {
  let x = Math.imul(n | 0, HASH_MUL);
  x ^= x >>> 15;
  x = Math.imul(x, 0x85ebca77);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

// ---------------------------------------------------------------------------
// Tiny triangle-soup builder.  All materials are double sided, so only the
// outward normal matters; every helper is written to produce one.
// ---------------------------------------------------------------------------
const TAU = Math.PI * 2;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const mid = (a, b) => [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5];
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const grey = (v) => [v, v, v];

function makeSink() {
  const position = [];
  const normal = [];
  const color = [];
  function tri(a, b, c, na, nb, nc, ca, cb, cc) {
    // Double-sided materials derive the shading normal side from the winding,
    // so every triangle must wind counter-clockwise as seen from its outward
    // normal.  Fixing that here means rim, tube, grid and frustum faces all
    // shade correctly without hand-tuning each primitive.
    const gx = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const gy = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]);
    const gz = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]);
    const nx = na[0] + nb[0] + nc[0];
    const ny = na[1] + nb[1] + nc[1];
    const nz = na[2] + nb[2] + nc[2];
    if (gx * nx + gy * ny + gz * nz < 0) {
      position.push(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
      normal.push(na[0], na[1], na[2], nc[0], nc[1], nc[2], nb[0], nb[1], nb[2]);
      color.push(ca[0], ca[1], ca[2], cc[0], cc[1], cc[2], cb[0], cb[1], cb[2]);
    } else {
      position.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      normal.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2]);
      color.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2], cc[0], cc[1], cc[2]);
    }
  }
  function quadFlat(a, b, c, d, n, colour) {
    tri(a, b, c, n, n, n, colour, colour, colour);
    tri(a, c, d, n, n, n, colour, colour, colour);
  }
  // Quad whose normal is derived from the winding, then flipped away from ref.
  function quadOut(a, b, c, d, ref, colour) {
    let n = unit(cross(sub(b, a), sub(c, b)));
    if (dot(n, sub(mid(a, c), ref)) < 0) n = mul(n, -1);
    quadFlat(a, b, c, d, n, colour);
  }
  function geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(color, 3));
    return g;
  }
  return { tri, quadFlat, quadOut, geometry, triangles: () => position.length / 9 };
}

// Smooth double surface (front + rim; the material is double sided so the
// hidden back of the shell needs no triangles).
function surface(sink, nu, nv, fn, ref, shade, skipRim) {
  const pts = [];
  const nrm = [];
  const eps = 0.03;
  for (let i = 0; i <= nu; i += 1) {
    pts[i] = [];
    nrm[i] = [];
    for (let j = 0; j <= nv; j += 1) {
      const u = i / nu;
      const v = j / nv;
      const p = fn(u, v);
      const du = sub(fn(Math.min(1, u + eps), v), fn(Math.max(0, u - eps), v));
      const dv = sub(fn(u, Math.min(1, v + eps)), fn(u, Math.max(0, v - eps)));
      let n = unit(cross(du, dv));
      if (dot(n, ref(p, u, v)) < 0) n = mul(n, -1);
      pts[i][j] = p;
      nrm[i][j] = n;
    }
  }
  for (let i = 0; i < nu; i += 1) {
    for (let j = 0; j < nv; j += 1) {
      const a = pts[i][j];
      const b = pts[i + 1][j];
      const c = pts[i + 1][j + 1];
      const d = pts[i][j + 1];
      const ca = shade(a);
      const cb = shade(b);
      const cc = shade(c);
      const cd = shade(d);
      sink.tri(a, b, c, nrm[i][j], nrm[i + 1][j], nrm[i + 1][j + 1], ca, cb, cc);
      sink.tri(a, c, d, nrm[i][j], nrm[i + 1][j + 1], nrm[i][j + 1], ca, cc, cd);
    }
  }
  return pts;
}

// Thin edge band between a surface boundary and the same boundary offset by
// `off`; normals point away from the loop centre in the plane of the band.
function rim(sink, pts, nu, nv, off, shade, skip) {
  const loop = [];
  for (let i = 0; i < nu; i += 1) loop.push(pts[i][0]);
  for (let j = 0; j < nv; j += 1) loop.push(pts[nu][j]);
  for (let i = nu; i > 0; i -= 1) loop.push(pts[i][nv]);
  for (let j = nv; j > 0; j -= 1) loop.push(pts[0][j]);
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const p of loop) {
    cx += p[0];
    cy += p[1];
    cz += p[2];
  }
  const centre = [cx / loop.length, cy / loop.length, cz / loop.length];
  const offLen = Math.max(1e-9, dot(off, off));
  for (let k = 0; k < loop.length; k += 1) {
    const a = loop[k];
    const b = loop[(k + 1) % loop.length];
    if (skip && skip(a, b)) continue;
    const e = sub(b, a);
    let n = unit(cross(e, off));
    if (!Number.isFinite(n[0])) continue;
    const m = mid(a, b);
    const v = sub(m, centre);
    const vp = sub(v, mul(off, dot(v, off) / offLen));
    if (dot(n, vp) < 0) n = mul(n, -1);
    sink.quadFlat(a, b, add(b, off), add(a, off), n, shade(m));
  }
}

// Cylinder along X with smooth radial normals, flat end caps.
function tubeX(sink, x0, x1, cy, cz, r, seg, shade) {
  const ring = [];
  for (let k = 0; k <= seg; k += 1) {
    const a = (k / seg) * TAU;
    const ny = Math.cos(a);
    const nz = Math.sin(a);
    const p0 = [x0, cy + r * ny, cz + r * nz];
    const p1 = [x1, cy + r * ny, cz + r * nz];
    const s = shade(p0);
    ring.push({ n: [0, ny, nz], p0, p1, s });
  }
  for (let k = 0; k < seg; k += 1) {
    const a = ring[k];
    const b = ring[k + 1];
    sink.tri(a.p0, a.p1, b.p1, a.n, a.n, b.n, a.s, a.s, b.s);
    sink.tri(a.p0, b.p1, b.p0, a.n, b.n, b.n, a.s, b.s, b.s);
  }
  for (const [px, nx] of [[x0, [-1, 0, 0]], [x1, [1, 0, 0]]]) {
    const c = [px, cy, cz];
    for (let k = 0; k < seg; k += 1) {
      const a = ring[k];
      const b = ring[k + 1];
      const s = shade(c);
      if (nx[0] < 0) sink.tri(c, a.p0, b.p0, nx, nx, nx, s, s, s);
      else sink.tri(c, b.p1, a.p1, nx, nx, nx, s, s, s);
    }
  }
}

function box(sink, centre, size, colour, rot) {
  const [w, h, d] = size;
  const sx = w * 0.5;
  const sy = h * 0.5;
  const sz = d * 0.5;
  const local = [
    [-sx, -sy, -sz], [sx, -sy, -sz], [sx, sy, -sz], [-sx, sy, -sz],
    [-sx, -sy, sz], [sx, -sy, sz], [sx, sy, sz], [-sx, sy, sz]
  ];
  const rotP = (p) => (rot ? rot(p) : p);
  const p = local.map((q) => add(centre, rotP(q)));
  const n = (v) => unit(rot ? rot(v) : v);
  const faces = [
    [0, 3, 2, 1, n([0, 0, -1])], [4, 5, 6, 7, n([0, 0, 1])],
    [0, 1, 5, 4, n([0, -1, 0])], [3, 7, 6, 2, n([0, 1, 0])],
    [0, 4, 7, 3, n([-1, 0, 0])], [1, 2, 6, 5, n([1, 0, 0])]
  ];
  for (const [a, b, c, e, nn] of faces) sink.quadFlat(p[a], p[b], p[c], p[e], nn, colour);
}

// Tapered rectangular prism (steel pedestal).
function frustum(sink, bottom, top, colour) {
  const [by, bw, bd, bz] = bottom; // y, width, depth, z centre
  const [ty, tw, td, tz] = top;
  const B = [
    [-bw / 2, by, bz - bd / 2], [bw / 2, by, bz - bd / 2],
    [bw / 2, by, bz + bd / 2], [-bw / 2, by, bz + bd / 2]
  ];
  const T = [
    [-tw / 2, ty, tz - td / 2], [tw / 2, ty, tz - td / 2],
    [tw / 2, ty, tz + td / 2], [-tw / 2, ty, tz + td / 2]
  ];
  const ref = [0, (by + ty) / 2, (bz + tz) / 2];
  sink.quadOut(B[0], B[1], B[2], B[3], ref, colour);
  sink.quadOut(T[0], T[1], T[2], T[3], ref, colour);
  for (let k = 0; k < 4; k += 1) {
    const k2 = (k + 1) % 4;
    sink.quadOut(B[k], B[k2], T[k2], T[k], ref, colour);
  }
}

// Profile in XY extruded along Z (armrest pad).
function extrudeZ(sink, profile, z0, z1, colour) {
  const n = profile.length;
  for (let k = 0; k < n; k += 1) {
    const p = profile[k];
    const q = profile[(k + 1) % n];
    const ex = q[0] - p[0];
    const ey = q[1] - p[1];
    const nn = unit([ey, -ex, 0]);
    const a = [p[0], p[1], z0];
    const b = [q[0], q[1], z0];
    const c = [q[0], q[1], z1];
    const d = [p[0], p[1], z1];
    sink.quadFlat(a, b, c, d, nn, colour);
  }
  const centre = [0, 0];
  for (const p of profile) {
    centre[0] += p[0] / n;
    centre[1] += p[1] / n;
  }
  for (let k = 1; k < n - 1; k += 1) {
    sink.tri([profile[0][0], profile[0][1], z0], [profile[k][0], profile[k][1], z0], [profile[k + 1][0], profile[k + 1][1], z0], [0, 0, -1], [0, 0, -1], [0, 0, -1], colour, colour, colour);
    sink.tri([profile[0][0], profile[0][1], z1], [profile[k][0], profile[k][1], z1], [profile[k + 1][0], profile[k + 1][1], z1], [0, 0, 1], [0, 0, 1], [0, 0, 1], colour, colour, colour);
  }
}

// ---------------------------------------------------------------------------
// Detailed prototype (world y < 19.5 m): 206 triangles.
// ---------------------------------------------------------------------------
function buildDetailedShell() {
  const sink = makeSink();

  // Ambient shade: mouldings catch a little more light towards the top edge,
  // crevices under the pan and behind the back stay darker.
  const shade = (p) => {
    const up = clamp01((p[1] - TREAD) / 0.9);
    let k = 0.80 + 0.20 * up;
    // pan underside / rim bands read darker
    if (p[1] < 0.14 && p[2] >= PAN_BACK - 0.002) k *= 0.94;
    return grey(k);
  };

  // Pan: dished seat pan, side bolsters fading out towards the rolled lip.
  const panTop = (u, v) => {
    const uu = u * 2 - 1;
    const f = Math.abs(uu);
    const x = uu * PAN_HALF;
    const z = PAN_BACK + (PAN_FRONT - PAN_BACK) * v;
    const curl = 0.038 * f * f * (1 - 0.85 * v);
    const slope = 0.012 * (v * 2 - 1);
    const dish = -0.010 * (1 - f * f) * Math.sin(Math.PI * v);
    return [x, PAN_MID_Y + curl + slope + dish, z];
  };
  const pan = surface(sink, 3, 2, panTop, () => [0, 1, 0], shade);
  rim(sink, pan, 3, 2, [0, -SHELL, 0], shade, (a, b) => a[2] > PAN_FRONT - 0.01 && b[2] > PAN_FRONT - 0.01);
  // Rolled front lip, slightly wider than the pan.
  tubeX(sink, -(PAN_HALF + 0.006), PAN_HALF + 0.006, panTop(0.5, 1)[1] - 0.020, PAN_FRONT, 0.023, 5, shade);

  // Back: 480 -> 450 mm wide, 515 mm tall shell reclined ~12 degrees, wrapping
  // forward at the sides and tapering at the waist so the silhouette is a bucket.
  const backFront = (u, v) => {
    const uu = u * 2 - 1;
    const width = BACK_HALF * (1 - 0.06 * v);
    const x = uu * width;
    const y = BACK_BOT + (BACK_TOP - BACK_BOT) * v;
    const curl = 0.068 * uu * uu * (1 - 0.72 * v);
    const lumbar = 0.012 * Math.sin(Math.PI * v) * (1 - 0.6 * uu * uu);
    return [x, y, -0.132 - BACK_LEAN * v + curl + lumbar];
  };
  const back = surface(sink, 4, 2, backFront, () => [0, 0, 1], shade);
  rim(sink, back, 4, 2, [0, 0, -SHELL], shade, (a, b) => a[1] < BACK_BOT + 0.01 && b[1] < BACK_BOT + 0.01);
  // Head roll: horizontal roll closing the top edge.  Centred on the top edge
  // section so it stays married to the shell at any recline angle.
  const topFrontZ = -0.132 - BACK_LEAN;
  const topHalfWidth = BACK_HALF * 0.94;
  tubeX(sink, -topHalfWidth, topHalfWidth, BACK_TOP - 0.004, topFrontZ - SHELL * 0.5, 0.040, 6, shade);

  // Armrests: 5-sided moulded pad on a slim steel bracket at the rear.  Both
  // sides are identical, so the pair stays 512 mm apart around the 470 mm pan.
  const padProfile = [
    [-0.0225, ARM_BOT], [0.0225, ARM_BOT], [0.0285, 0.352], [0, ARM_TOP], [-0.0285, 0.352]
  ];
  for (const side of [-1, 1]) {
    const cx = side * ARM_X;
    const profile = padProfile.map(([x, y]) => [cx + x, y]);
    extrudeZ(sink, profile, -0.176, 0.126, shade([0, 0.345, 0]));
    // slim rear bracket: seat side -> pad rear, leaning back with the shell
    const tilt = (q) => [q[0], q[1] * Math.cos(-0.22) - q[2] * Math.sin(-0.22), q[1] * Math.sin(-0.22) + q[2] * Math.cos(-0.22)];
    box(sink, [side * 0.244, 0.225, -0.118], [0.030, 0.205, 0.042], shade([0, 0.26, -0.13]), tilt);
  }

  return sink;
}

function buildDetailedFrame() {
  const sink = makeSink();
  const shade = () => grey(1);
  // Two front legs, located exactly where the legacy seat-frame instances sit
  // (x +/-0.15, z 0.04) but 60 x 70 mm so those thinner aluminium legs vanish
  // inside them, and reaching the tread instead of hovering above it.
  for (const side of [-1, 1]) {
    box(sink, [side * 0.15, -0.02, 0.04], [0.060, 0.299, 0.070], shade());
  }
  // Cross beam under the pan that also swallows the legacy cross member.
  box(sink, [0, 0.09, 0.04], [0.42, 0.060, 0.090], shade());
  // Cantilever rear pedestal down to the tread, clear of the north riser.
  frustum(sink, [TREAD + 0.0005, 0.13, 0.047, -0.1815], [0.215, 0.075, 0.040, -0.182], shade());
  return sink;
}

// ---------------------------------------------------------------------------
// Simplified prototype (upper tier + north upper rows): 36 triangles.
// ---------------------------------------------------------------------------
function buildSimpleShell() {
  const sink = makeSink();
  const shade = (p) => grey(0.80 + 0.20 * clamp01((p[1] - TREAD) / 0.9));
  box(sink, [0, 0.12, 0.041], [0.47, 0.05, 0.394], shade([0, 0.12, 0]));
  const tilt = (p) => {
    const c = Math.cos(-0.21);
    const s = Math.sin(-0.21);
    return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
  };
  box(sink, [0, 0.385, -0.19], [0.48, 0.47, 0.045], shade([0, 0.385, 0]), tilt);
  return sink;
}

function buildSimpleFrame() {
  const sink = makeSink();
  const shade = () => grey(1);
  frustum(sink, [TREAD + 0.0005, 0.13, 0.047, -0.1815], [0.215, 0.075, 0.040, -0.182], shade());
  return sink;
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------
function seatMaterials() {
  const shell = new THREE.MeshStandardMaterial({
    name: 'Stadium seat shell - moulded polypropylene (blue)',
    color: '#ffffff',
    roughness: 0.46,
    metalness: 0.03,
    envMapIntensity: 0.62,
    side: THREE.DoubleSide,
    vertexColors: true
  });
  shell.userData = {
    materialEvidence: 'B/C stadium interior photographs; glossy moulded plastic',
    vertexColours: 'baked ambient shade per moulding'
  };
  const frame = new THREE.MeshStandardMaterial({
    name: 'Seat underframe - powder-coated steel',
    color: '#3f4a52',
    roughness: 0.58,
    metalness: 0.22,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide
  });
  frame.userData = { materialEvidence: 'B/C steel seat frames in stadium photographs' };
  return { shell, frame };
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
export function buildStadiumSeats(ctx, { layers, seatPositions, seatMats }) {
  const positions = seatPositions.flat();
  const count = positions.length;
  if (!count) return { seats: 0, vertices: 0, drawCalls: 0 };

  // Base palette follows the shared seat finishes when available.
  const palette = [];
  const source = seatMats && seatMats.length ? seatMats : null;
  const baseColours = source
    ? source.slice(0, 6).map((m) => (m && m.color ? '#' + m.color.getHexString() : FALLBACK_PALETTE[0]))
    : FALLBACK_PALETTE;
  const base = baseColours.map((hex) => new THREE.Color(hex));
  // Main rotation: the mid blues plus gentle light/dark variants.  The darkest
  // shared finish is only used as a rare "replaced/weathered" tone so the bowl
  // reads as one blue family with subtle break-up, not a patchwork.
  palette.push(base[0], base[1], base[2]);
  palette.push(base[0].clone().offsetHSL(0, 0, 0.030));
  palette.push(base[1].clone().offsetHSL(0, -0.015, 0.045));
  palette.push(base[2].clone().offsetHSL(0, 0.010, -0.025));
  const darkTone = (base[3] || base[2]).clone().lerp(base[1], 0.5);
  const faded = new THREE.Color('#9db2bc').lerp(base[2], 0.35);
  // All shells darkened a touch: the daylight + sky IBL otherwise washes them out.
  for (const c of palette) c.multiplyScalar(0.90);
  darkTone.multiplyScalar(0.90);
  faded.multiplyScalar(0.90);

  const detailed = [];
  const simplified = [];
  for (const seat of positions) {
    if (seat[1] >= SIMPLE_FROM_Y) simplified.push(seat);
    else detailed.push(seat);
  }

  const materials = seatMaterials();
  const detailShell = buildDetailedShell();
  const detailFrame = buildDetailedFrame();
  const simpleShell = buildSimpleShell();
  const simpleFrame = buildSimpleFrame();
  const detailShellGeo = detailShell.geometry();
  const detailFrameGeo = detailFrame.geometry();
  const simpleShellGeo = simpleShell.geometry();
  const simpleFrameGeo = simpleFrame.geometry();
  const detailTris = detailShell.triangles() + detailFrame.triangles();
  const simpleTris = simpleShell.triangles() + simpleFrame.triangles();

  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  // Runtime seats are divided into azimuth sectors. A single stadium-wide
  // instance bound kept every seat on the GPU even when a close camera saw
  // only one stand. The offline master still receives the original full bins.
  function sectors(subset) {
    const count = ctx.renderer ? 16 : 1;
    const bins = Array.from({ length: count }, () => []);
    for (let i = 0; i < subset.length; i++) {
      const [x, , z] = subset[i];
      const sector = count === 1 ? 0 : Math.min(count - 1, Math.floor((Math.atan2(z, x) + Math.PI) / (Math.PI * 2) * count));
      bins[sector].push(i);
    }
    return bins.filter(bin => bin.length);
  }
  function instance(geo, material, subset, indices, name, colourOffset = null) {
    const mesh = new THREE.InstancedMesh(geo, material, indices.length);
    mesh.name = name;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    for (let i = 0; i < indices.length; i += 1) {
      const [x, y, z, yaw] = subset[indices[i]];
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (colourOffset !== null) {
        const sourceIndex = indices[i];
        const pick = hash01(sourceIndex * 3 + 1 + colourOffset);
        let tone = palette[Math.min(palette.length - 1, Math.floor(pick * palette.length))];
        if (pick > 0.985) tone = faded;
        else if (pick > 0.945) tone = darkTone;
        col.copy(tone);
        col.offsetHSL((hash01(sourceIndex * 5 + 11 + colourOffset * 2) - 0.5) * 0.008, (hash01(sourceIndex * 7 + 23 + colourOffset * 2) - 0.5) * 0.04, (hash01(sourceIndex * 11 + 37 + colourOffset * 2) - 0.5) * 0.028);
        mesh.setColorAt(i, col);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    layers.seats.add(mesh);
    return mesh;
  }
  const detailedBins = sectors(detailed), simpleBins = sectors(simplified);
  const detailSeats = detailedBins.map((indices, i) => instance(detailShellGeo, materials.shell, detailed, indices, `matchday_seats_detailed_${i}`, 0));
  const detailFrames = detailedBins.map((indices, i) => instance(detailFrameGeo, materials.frame, detailed, indices, `matchday_seat_underframe_detailed_${i}`));
  simpleBins.forEach((indices, i) => {
    instance(simpleShellGeo, materials.shell, simplified, indices, `matchday_seats_upper_${i}`, 100);
    instance(simpleFrameGeo, materials.frame, simplified, indices, `matchday_seat_underframe_upper_${i}`);
  });

  // Distance LOD preserves detailed lower seats for close inspection. Exporters
  // retain the detailed prototypes; only the realtime viewport adds fallback bins.
  if(ctx.renderer){
    const distant = detailedBins.map((indices, i) => {
      const mesh = instance(simpleShellGeo, materials.shell, detailed, indices, `seats_lower_distance_lod_${i}`);
      mesh.instanceColor = detailSeats[i].instanceColor;
      return mesh;
    });
    const distantFrames = detailedBins.map((indices, i) => instance(simpleFrameGeo, materials.frame, detailed, indices, `seat_frames_lower_distance_lod_${i}`));
    let near = true;
    function update(camera) {
      const d = camera.position.length() / camera.zoom, want = d < (near ? 155 : 125);
      if (want !== near) {
        near = want;
        for (const mesh of [...detailSeats, ...detailFrames]) mesh.visible = want;
        for (const mesh of [...distant, ...distantFrames]) mesh.visible = !want;
      }
    }
    for (const mesh of [...distant, ...distantFrames]) mesh.visible = false;
    (ctx.lodUpdates ??= []).push(update);
    update(ctx.camera);
  }

  const detailVerts = detailShellGeo.getAttribute('position').count + detailFrameGeo.getAttribute('position').count;
  const simpleVerts = simpleShellGeo.getAttribute('position').count + simpleFrameGeo.getAttribute('position').count;

  return {
    seats: count,
    detailed: detailed.length,
    simplified: simplified.length,
    drawCalls: 4,
    triangles: detailed.length * detailTris + simplified.length * simpleTris,
    detailTriangles: detailTris,
    simpleTriangles: simpleTris,
    prototypeVertices: { detailed: detailVerts, simple: simpleVerts },
    vertices: detailed.length * detailVerts + simplified.length * simpleVerts,
    palette: palette.length + 2,
    evidence: 'B/C proportions and mouldings; seat positions untouched'
  };
}
