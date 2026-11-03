import * as THREE from 'three';

// ============================================================================
// V9 measured envelope of the Etihad bowl.
//
// Coordinate convention for the whole scene: +X east, +Z south, +Y up.
// The 2026 north stand extension therefore sits at negative Z.
//
// Evidence
//   A  pitch 105 x 68 m is verified; all dimensions below are anchored to it.
//   B  roof edge plan: OSM stadium outline (way 26329734, 236 x 241 m bbox
//      including the eight ramp-tower lobes) cross-checked against the
//      Esri World Imagery tile mosaic at z=19 (0.178 m/px).  The smooth roof
//      edge between the tower lobes reads ~204 m east-west, the south stand
//      roof (2015 extension) reaches further south than the old north rim.
//   B  roof heights: Arup Journal 2003 p33 - the torus roof always slopes down
//      to the outside edge, 1.5 deg at the inner edge to ~17 deg at the rim;
//      the east and west sides are the high parts, north and south the low
//      ends.  Inner edge ~4.5 m above the rim.
//   B  2026 north stand: independent high roof with its own fascia, 38.9 m at
//      the south junction rising to 42.0 m at the north edge (Populous 2025
//      drawing 000310 RF 98.100 m, pitch 54.999 m -> +43.1 m to roof datum).
//   C  exact corner radii, opening size and fascia depth are photographic fits.
//
// The plan is a slightly boxy superellipse (the bowl reads almost circular in
// the aerials but has long straight-ish east and west elevations), while the
// central opening is a true rounded rectangle - not an ellipse.
// ============================================================================
export const ETIHAD_FORM = {
  evidence: 'B/C - OSM outline + Esri orthoimagery + Arup 2003 torus + 2026 photos; not a survey',
  pitch: { halfLength: 52.5, halfWidth: 34, level: -5.18 },
  plan: {
    outerX: 122,          // roof edge half width, east-west (m)
    southZ: 141,          // roof edge at the south stand (+Z)
    northZ: 141,          // legacy roof edge at the north (-Z), replaced in the middle
    shapePower: 0.78,     // >0.5; 1 = ellipse, lower = boxier superellipse
    openingX: 56,         // central opening half width (m)
    openingZ: 78,         // central opening half length (m)
    openingPower: 0.46,   // rounded-rectangle opening
    facadeInset: 6.4,     // facade drum sits this far inside the roof edge
    northRoof: {
      southZ: -90,        // junction with the legacy torus roof (old north sector removed)
      northZ: -172,       // new north fascia
      southHalfX: 102,
      northHalfX: 86,
      southY: 40.0,
      northY: 42.0,
      fascia: 2.2,
      gutterZ: -88
    }
  },
  roof: {
    rimLow: 35.4,         // north / south rim height
    rimHigh: 43.2,        // east / west rim height
    southDrop: 0.5,       // the south rim sits slightly lower than the north
    innerLift: 4.6,       // inner (opening) edge above the rim - torus section
    glassBand: 10.0,      // translucent polycarbonate band measured along the slope
    fasciaDepth: 2.0,     // aluminium gutter/fascia depth at the rim
    fasciaLip: 0.55,      // outward drip lip
    crownY: 30.2,         // facade top where the glazed drum ends
    louvreTopGap: 1.6     // dark louvre/plant band runs rim-louvreTopGap up to the rim
  },
  facade: {
    plinthY: 1.35,
    spandrels: [7.0, 16.2],
    pierSpacing: 8.2,
    bayMullion: 1.05
  },
  rampTowers: {
    halfX: 124.0,
    zs: [-96, -34, 34, 96],
    radius: 7.9,
    slabLevels: [0.82, 5.4, 10.0, 14.6, 19.2, 23.8, 27.2],
    topY: 27.2,
    cityBandY: 12.6
  },
  masts: {
    count: 10, // 8 tower masts + 2 south grounded masts; the 2 north masts are superseded by the 2026 headframes
    towerSupported: 8,
    groundSupported: 2,
    topY: 65.0,
    leanDeg: 12.0,
    groundX: 92,
    groundZ: 118
  }
};

function signedPow(v, p) {
  return Math.sign(v) * Math.pow(Math.abs(v), p);
}

// One point on a superellipse in plan. t is the polar angle, not arc length.
export function planPoint(t, a, b, p) {
  return { x: a * signedPow(Math.cos(t), p), z: b * signedPow(Math.sin(t), p) };
}

export function planLoop(inset = 0, segments = 256, form = ETIHAD_FORM) {
  const P = form.plan;
  const a = Math.max(1, P.outerX - inset);
  const bS = Math.max(1, P.southZ - inset);
  const bN = Math.max(1, P.northZ - inset);
  const pts = [];
  for (let i = 0; i < segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    const s = Math.sin(t);
    const p = planPoint(t, a, s >= 0 ? bS : bN, P.shapePower);
    pts.push(new THREE.Vector2(p.x, p.z));
  }
  return pts;
}

export function openingPoint(t, form = ETIHAD_FORM) {
  return planPoint(t, form.plan.openingX, form.plan.openingZ, form.plan.openingPower);
}

export function openingLoop(segments = 192, form = ETIHAD_FORM) {
  const pts = [];
  for (let i = 0; i < segments; i += 1) {
    const q = openingPoint((i / segments) * Math.PI * 2, form);
    pts.push(new THREE.Vector2(q.x, q.z));
  }
  return pts;
}

export function rimY(t, form = ETIHAD_FORM) {
  const R = form.roof;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return R.rimLow + (R.rimHigh - R.rimLow) * c * c - R.southDrop * Math.max(0, s);
}

export function innerY(t, form = ETIHAD_FORM) {
  return rimY(t, form) + form.roof.innerLift;
}

// Roof surface sample. u = 0 at the central opening edge, u = 1 at the rim.
// The surface always slopes down towards the outside; the slope steepens
// outwards (Arup: 1.5 deg at the opening, ~17 deg at the rim).
export function roofSample(t, u, form = ETIHAD_FORM) {
  const P = form.plan;
  const s = Math.sin(t);
  const outer = planPoint(t, P.outerX, s >= 0 ? P.southZ : P.northZ, P.shapePower);
  const inner = planPoint(t, P.openingX, P.openingZ, P.openingPower);
  const x = inner.x + (outer.x - inner.x) * u;
  const z = inner.z + (outer.z - inner.z) * u;
  const y = innerY(t, form) - form.roof.innerLift * Math.pow(Math.max(0, u), 1.7);
  return [x, y, z];
}

export function roofRim(t, form = ETIHAD_FORM) {
  return roofSample(t, 1, form);
}

export function roofInner(t, form = ETIHAD_FORM) {
  return roofSample(t, 0, form);
}

// Horizontal distance (m) from the opening edge to the rim at angle t. Used to
// convert the documented 10 m translucent band into a u parameter.
export function roofBandWidth(t, form = ETIHAD_FORM) {
  const P = form.plan;
  const s = Math.sin(t);
  const outer = planPoint(t, P.outerX, s >= 0 ? P.southZ : P.northZ, P.shapePower);
  const inner = planPoint(t, P.openingX, P.openingZ, P.openingPower);
  return Math.hypot(outer.x - inner.x, outer.z - inner.z);
}

export function glassU(t, form = ETIHAD_FORM) {
  return Math.min(0.3, form.roof.glassBand / Math.max(1, roofBandWidth(t, form)));
}

// Eight circulation towers stand outside the straight east and west elevations.
export function towerPositions(form = ETIHAD_FORM) {
  const T = form.rampTowers;
  const out = [];
  for (const side of [-1, 1]) for (const z of T.zs) out.push([side * T.halfX, z]);
  return out;
}

// Grounded masts. The two north masts of the 2003 scheme are superseded by the
// 2026 north-stand headframes (visible in the 2025/2026 photos), so only the two
// south diagonal masts are retained; the other two are represented by the
// north-complex A-frames. Evidence B/C.
export function groundMastPositions(form = ETIHAD_FORM) {
  const M = form.masts;
  return [[-M.groundX, M.groundZ], [M.groundX, M.groundZ]];
}

export function allMastPositions(form = ETIHAD_FORM) {
  return [...towerPositions(form), ...groundMastPositions(form)];
}

// Outward lean of a mast: horizontal offset at the head for a mast base b.
export function mastHead(baseX, baseY, baseZ, form = ETIHAD_FORM) {
  const M = form.masts;
  const length = M.topY - baseY;
  const offset = Math.tan((M.leanDeg * Math.PI) / 180) * length;
  const r = Math.hypot(baseX, baseZ) || 1;
  return [baseX + (baseX / r) * offset, M.topY, baseZ + (baseZ / r) * offset];
}

// New north-stand roof: a separate, higher sheet that steps up from the legacy
// torus roof between z=-112 and z=-172. Parameters s (0 south / 1 north) and
// u (-1 west / +1 east) follow the photographed fold, not an issued section.
export function northRoofSample(s, u, form = ETIHAD_FORM) {
  const N = form.plan.northRoof;
  const ss = Math.min(1, Math.max(0, s));
  const uu = Math.min(1, Math.max(-1, u));
  const halfX = N.southHalfX + (N.northHalfX - N.southHalfX) * ss;
  const x = halfX * uu;
  const z = N.southZ + (N.northZ - N.southZ) * ss;
  const base = N.southY + (N.northY - N.southY) * ss;
  // gentle transverse camber, plus a soft sag at the south junction
  const y = base + 0.55 * (1 - uu * uu) * (0.25 + 0.75 * ss) - 0.35 * (1 - ss) * (1 - ss);
  return [x, y, z];
}

export function northRoofRim(form = ETIHAD_FORM) {
  const N = form.plan.northRoof;
  return {
    south: { z: N.southZ, halfX: N.southHalfX, y: N.southY },
    north: { z: N.northZ, halfX: N.northHalfX, y: N.northY }
  };
}

// Mast fan angles measured on the roof plan, used by roofFans() and the cables.
export function mastFanAngle([x, z], form = ETIHAD_FORM) {
  const t = Math.atan2(z / form.plan.southZ, x / form.plan.outerX);
  return (t + Math.PI * 2) % (Math.PI * 2);
}
