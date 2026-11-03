import * as THREE from 'three';
import {clipNorthPolygon,fitsNorthFootprint} from './north-junction.js';
import { AISLE_LAYOUT, isAisleSeat } from './bowl-aisles.js';

// ============================================================================
// Bowl interior fittings that sell the scale at close range (V10):
//
//   * continuous LED advertising ribbons at the tier fronts and the pitch
//     perimeter, with sponsor content and real panel joints;
//   * the tier-top concourse band: a parapet-mounted LED ribbon, the walkway
//     behind it and a vomitory headwall with recessed, lit portals, steps,
//     handrails and block signage at the back of each tier;
//   * aisle nosing strips at every tread and block/exit signage;
//   * the players' tunnel at the south-west corner with canopy and Tunnel Club
//     signage, and the west-side technical areas (glass screens + canopy trim
//     around the pitch-level dugouts that scene.js already places);
//   * the TV camera gantry on the south upper-tier front with cameras,
//     monitors, operator seats and side camera positions;
//   * pitch-side photographers behind the goal-line boards.
//
// Evidence
//   A  LED ribbons at every tier front + pitch perimeter, white vomitory
//      surrounds with steps, the white concourse band and block signage are all
//      directly visible in etihad-2026/south-stand-interior.jpg and
//      v9-2026/north-upper-tier-2026.jpg.
//   B  Bay rhythm, ribbon heights, portal width/depth and tunnel position are
//      fitted from those photographs against the model's tier sections.
//   C  Exact portal bays, block numbers, gantry and dugout trims.
//
// Units: metres. All positions are derived from the shared bowl section
// (bowlSections) and the exact shape/loop used by the concrete and seats, so
// nothing floats: the ribbons sit on the existing tier-back rings, the walkway
// floors are coplanar with those rings and the portals stand on those floors.
// ============================================================================

const AISLES = AISLE_LAYOUT.count;              // 36 radial aisle axes
const SEG = 224;                                // loop samples for ribbons

export function buildStadiumBowlDetail(ctx, { layers, kits, loop, shape, bowlSections, materials, sign, seatPositions }) {
  void seatPositions;
  const b = kits.bowl;                          // concrete / bowl layer
  const struct = kits.structure;                // gantry / secondary steel
  const pkit = kits.pitch;                      // pitch furniture
  const { concrete, pale, dark, steel, glass, teal } = materials;

  const pitch = bowlSections.tiers[0].y - 0.25; // -5.18 m, same as scene.js
  const RN = bowlSections.replacedNorth;        // { zBelow, halfWidth }
  const inNorth = (x, z) => z < RN.zBelow && Math.abs(x) < RN.halfWidth;
  const keepNorth = (x, z) => !inNorth(x, z);   // skip where the tiers were replaced
  const northOnly = (x, z) => inNorth(x, z);

  const metrics = {
    ledRibbons: 0, ledSegments: 0, ledTexts: 0, ledPerimeter: 0,
    concourseBands: 0, vomitories: 0, portalSteps: 0, portalRails: 0,
    blockSigns: 0, aisleNosings: 0, exitSigns: 0,
    tunnel: 1, tunnelClubSigns: 0, gantry: 0, gantryCameras: 0, sideCameras: 0,
    dugouts: 0, dugoutScreens: 0, photographerClusters: 0, northBands: 0,
    primitives: 0
  };
  const bump = (n = 1) => { metrics.primitives += n; };

  // ---- materials -------------------------------------------------------
  const ledFace = ctx.mat('#6fc9ee', { emissive: '#2fb0ea', emissiveIntensity: 2.30, side: THREE.DoubleSide });
  const ledNavy = ctx.mat('#1d3c55', { emissive: '#2a6d94', emissiveIntensity: 0.85, side: THREE.DoubleSide });
  const ledDark = ctx.mat('#101d29', { emissive: '#0a151e', emissiveIntensity: 0.20, side: THREE.DoubleSide });
  const ledWarm = ctx.mat('#eaf7fd', { emissive: '#cfeeff', emissiveIntensity: 2.10, side: THREE.DoubleSide });
  const offWhite = ctx.mat('#d3d8d3', { side: THREE.DoubleSide });
  const soffitGrey = ctx.mat('#a9b1ae', { side: THREE.DoubleSide });
  
  const LED_TEXT = ['MAN CITY', 'ETIHAD', 'MANCHESTER CITY', 'TOGETHER', 'CITY'];
  const PERIMETER_TEXT = ['ETIHAD AIRWAYS', 'MANCHESTER CITY', 'TOGETHER', 'CITY'];

  // ---- low-level geometry helpers --------------------------------------
  // A vertical ribbon between y0 and y1 following a closed loop; `pred` may
  // reject a segment (north-sector filters, vomitory door gaps).
  function ribbon(kit, pts, y0, y1, mat, pred) {
    const pos = [];
    let segs = 0;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = pts[i];
      const c = pts[i + 1];
      if (pred && ((!pred.clipNorth && !pred(a, c, i)) || pred.reject?.(a,c,i))) continue;
      const quad=[[a.x,y0,a.y],[c.x,y0,c.y],[c.x,y1,c.y],[a.x,y1,a.y]];
      const polys=pred?.clipNorth?clipNorthPolygon(quad,pred.clipNorth==="inside"):[quad];
      for(const poly of polys)for(let k=1;k<poly.length-1;k++)pos.push(...poly[0],...poly[k],...poly[k+1]);
      segs += 1;
    }
    if (!segs) return 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    kit.geometry(g, mat);
    g.dispose();
    return segs;
  }

  // A horizontal band between two loops at a constant height (walkway floors,
  // coping lips). Both loops are arc-length sampled so points correspond.
  function flatBand(kit, offA, offB, y, mat, pred) {
    const a = loop(offA, SEG);
    const c = loop(offB, SEG);
    const pos = [];
    let segs = 0;
    const n = Math.min(a.length, c.length) - 1;
    for (let i = 0; i < n; i += 1) {
      if (pred && !pred.clipNorth && !pred(a[i], a[i + 1], i)) continue;
      const quad=[[a[i].x,y,a[i].y],[c[i].x,y,c[i].y],[c[i+1].x,y,c[i+1].y],[a[i+1].x,y,a[i+1].y]];
      const polys=pred?.clipNorth?clipNorthPolygon(quad,pred.clipNorth==="inside"):[quad];
      for(const poly of polys)for(let k=1;k<poly.length-1;k++)pos.push(...poly[0],...poly[k],...poly[k+1]);
      segs += 1;
    }
    if (!segs) return 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    kit.geometry(g, mat);
    g.dispose();
    return segs;
  }

  const midIn = (x, z) => { const r = Math.hypot(x, z) || 1; return [-x / r, -z / r]; };
  const tangentYaw = (a, c) => Math.atan2(-(c.y - a.y), c.x - a.x);
  const signRot = (x, z) => Math.atan2(-x, -z); // plane normal faces the pitch

  function loopCurve(off) { return shape(off); }
  function yawAt(curve, u) {
    const a = curve.getPoint((u - 1e-4 + 1) % 1);
    const c = curve.getPoint((u + 1e-4) % 1);
    return { yaw: Math.atan2(-(c.y - a.y), c.x - a.x), p: curve.getPoint(u) };
  }

  // Dark joints every `step` samples along a LED ribbon.
  function addJoints(kit, off, y0, y1, step, pred) {
    const pts = loop(off, SEG);
    const h = y1 - y0;
    for (let i = 0; i < pts.length - 1; i += step) {
      const a = pts[i];
      const c = pts[(i + 1) % (pts.length - 1)];
      if (pred && !pred(a, c, i)) continue;
      kit.box(a.x, (y0 + y1) / 2, a.y, 0.055, h, 0.10, ledDark, tangentYaw(a, c));
      metrics.ledSegments += 1;
      bump();
    }
  }

  // Text content mounted just in front of a LED ribbon face.
  function addLedTexts(off, y, step, texts, w, h, pred) {
    const pts = loop(off, SEG);
    let k = 0;
    for (let i = 0; i < pts.length - 1; i += step) {
      const p = pts[i];
      if (pred && !pred(p, p, i)) continue;
      const [ix, iz] = midIn(p.x, p.y);
      const px = p.x + ix * 0.12;
      const pz = p.y + iz * 0.12;
      sign(layers.bowl, texts[k % texts.length], px, y, pz, w, h, signRot(p.x, p.y), '#1f4a68', '#f1fbff');
      metrics.ledTexts += 1;
      k += 1;
    }
  }

  // One continuous advertising ribbon: backing frame, emissive face, top lip,
  // panel joints, sponsor text and support brackets against the tier-back ring.
  //   offYard  - offset of the concrete tier-back ring
  //   y0,y1    - ribbon vertical extent
  function ledRibbon({ offYard, y0, y1, pred, textStep = 12, texts = LED_TEXT, face = ledFace, textW = 3.1, textH = 0.42, label = 'tier' }) {
    const faceOff = offYard - 0.10;
    ribbon(b, loop(offYard, SEG), y0 - 0.07, y1 + 0.07, ledDark, pred);
    metrics.ledSegments += ribbon(b, loop(faceOff, SEG), y0, y1, face, pred);
    flatBand(b, faceOff - 0.02, offYard + 0.02, y1 + 0.075, offWhite, pred);
    addJoints(b, faceOff - 0.02, y0, y1, 3, pred);
    addLedTexts(faceOff, y0 + (y1 - y0) * 0.78, textStep, texts, textW, textH, pred);
    // slim support posts every 12 samples
    const pts = loop(offYard, SEG);
    for (let i = 0; i < pts.length - 1; i += 12) {
      const p = pts[i];
      const c = pts[(i + 1) % (pts.length - 1)];
      if (pred && !pred(p, c, i)) continue;
      b.box(p.x, (y0 + y1) / 2, p.y, 0.07, y1 - y0, 0.09, steel, tangentYaw(p, c));
      bump();
    }
    metrics.ledRibbons += 1;
    void label;
    return faceOff;
  }

  // Rounded-rectangle plan loop around the pitch (pitch perimeter board line).
  function roundedLoop(hw, hl, r, n) {
    const s = new THREE.Shape();
    s.moveTo(-hw + r, -hl);
    s.lineTo(hw - r, -hl);
    s.absarc(hw - r, -hl + r, r, -Math.PI / 2, 0);
    s.lineTo(hw, hl - r);
    s.absarc(hw - r, hl - r, r, 0, Math.PI / 2);
    s.lineTo(-hw + r, hl);
    s.absarc(-hw + r, hl - r, r, Math.PI / 2, Math.PI);
    s.lineTo(-hw, -hl + r);
    s.absarc(-hw + r, -hl + r, r, Math.PI, Math.PI * 1.5);
    s.closePath();
    return s.getSpacedPoints(n);
  }

  // =========================================================================
  // 1. Pitch-perimeter LED advertising boards (photo: dark navy panels with
  //    white sponsor text, right at the advertising line around the pitch).
  // =========================================================================
  {
    const hw = 36.2;      // 34 m touchline + 2.2 m board line
    const hl = 55.7;      // 52.5 m goal line + 3.2 m (clears the goal net)
    const pts = roundedLoop(hw, hl, 5.0, 240);
    const y0 = pitch + 0.03;
    const y1 = pitch + 1.00;
    // dark base trench / plinth
    ribbon(pkit, pts, pitch - 0.06, y0 + 0.02, ledDark, null);
    // LED face, slightly inset from the frame
    ribbon(pkit, pts, y0 + 0.03, y1 - 0.03, ledNavy, null);
    // bright top lip that reads as the lit upper row of the display
    ribbon(pkit, pts, y1 - 0.16, y1, ledWarm, null);
    {
      // horizontal white cap along the top edge of the board line
      const cap = [];
      for (let i = 0; i < pts.length - 1; i += 1) {
        const a = pts[i];
        const c = pts[i + 1];
        const [ax, az] = midIn(a.x, a.y);
        const [cx, cz] = midIn(c.x, c.y);
        cap.push(a.x - ax * 0.16, y1 + 0.02, a.y - az * 0.16, a.x + ax * 0.04, y1 + 0.02, a.y + az * 0.04, c.x + cx * 0.04, y1 + 0.02, c.y + cz * 0.04);
        cap.push(a.x - ax * 0.16, y1 + 0.02, a.y - az * 0.16, c.x + cx * 0.04, y1 + 0.02, c.y + cz * 0.04, c.x - cx * 0.16, y1 + 0.02, c.y - cz * 0.16);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(cap, 3));
      g.computeVertexNormals();
      pkit.geometry(g, offWhite);
      g.dispose();
    }
    // panel joints
    for (let i = 0; i < pts.length - 1; i += 3) {
      const a = pts[i];
      const c = pts[(i + 1) % (pts.length - 1)];
      pkit.box(a.x, (y0 + y1) / 2, a.y, 0.05, y1 - y0, 0.10, ledDark, tangentYaw(a, c));
      metrics.ledSegments += 1;
      bump();
    }
    // sponsor content, facing the pitch centre
    let k = 0;
    for (let i = 0; i < pts.length - 1; i += 14) {
      const p = pts[i];
      const [ix, iz] = midIn(p.x, p.y);
      sign(layers.pitch, PERIMETER_TEXT[k % PERIMETER_TEXT.length],
        p.x + ix * 0.10, pitch + 0.55, p.y + iz * 0.10, 4.2, 0.55, signRot(p.x, p.y), '#152a3b', '#eef8fb');
      metrics.ledTexts += 1;
      k += 1;
    }
    // rear legs so the board does not read as a floating plane from behind
    for (let i = 0; i < pts.length - 1; i += 8) {
      const p = pts[i];
      const [ox, oz] = midIn(p.x, p.y);
      pkit.pipe([p.x, pitch, p.y], [p.x - ox * 0.55, pitch, p.y - oz * 0.55], 0.035, steel);
      bump();
    }
    metrics.ledPerimeter = 1;
    metrics.ledRibbons += 1;
  }

  // =========================================================================
  // 2. Tier-top concourse bands. Each tier ends against the existing 2 m wide
  //    back ring (built in scene.js). We mount the front LED ribbon on that
  //    ring, build the walkway floor behind it and put the vomitory headwall
  //    at the back of the walkway, with recessed, lit portals that open onto
  //    the walkway and steps inside the recess.
  // =========================================================================
  const portalDefs = [];

  function buildConcourseBand({ lower, upper, pred, blockBase, portalH, portalW, ledEverywhere = false }) {
    // The existing back ring of `lower` is 2 m wide at offset B; its top is the
    // walkway floor. The next tier's front wall closes the walkway.
    const B = lower.start + lower.rows * lower.step;
    const floorY = lower.y + lower.rows * lower.rise + 0.425; // ring centre +0.325
    const F = upper.start - 0.12;                              // front wall plane
    const H = B + 2.0;                                         // headwall plane
    const filter = (a, c) => pred((a.x + c.x) / 2, (a.y + c.y) / 2);
    filter.clipNorth="outside";

    // walkway floor between the ring and the upper tier front
    flatBand(b, B + 2.0, F, floorY, soffitGrey, filter);

    // LED ribbon on the front face of the tier-back ring (the top band stays
    // visible above the top row's seat backs, as in the reference photos)
    const ledY0 = floorY - 0.55;
    const ledY1 = floorY + 0.95;
    ledRibbon({ offYard: B + 0.02, y0: ledY0, y1: ledY1, pred: ledEverywhere ? null : filter, textStep: 13, texts: LED_TEXT });

    // upper tier front wall from the walkway up to the first row
    const wY0 = floorY - 0.02;
    const wY1 = upper.y;
    ribbon(b, loop(F, SEG), wY0, wY1, pale, filter);
    // vertical panel joints break up the tall upper-tier front wall
    {
      const pts = loop(F - 0.09, SEG);
      for (let i = 0; i < pts.length - 1; i += 6) {
        const p = pts[i];
        const c = pts[(i + 1) % (pts.length - 1)];
        if (!filter(p, p)) continue;
        b.box(p.x, (wY0 + wY1) / 2, p.y, 0.035, wY1 - wY0 - 0.12, 0.06, soffitGrey, tangentYaw(p, c));
        bump();
      }
    }
    // dark sponsor band near the top of that wall (photo: ETIHAD STADIUM band)
    const bandY1 = wY1 - 0.22;
    const bandY0 = wY1 - 0.92;
    ribbon(b, loop(F - 0.10, SEG), bandY0, bandY1, ledDark, filter);
    {
      const pts = loop(F - 0.16, SEG);
      let k = 0;
      for (let i = 0; i < pts.length - 1; i += 18) {
        const p = pts[i];
        if (!filter(p, p)) continue;
        sign(layers.bowl, k % 2 ? 'ETIHAD STADIUM' : 'MANCHESTER CITY',
          p.x, (bandY0 + bandY1) / 2, p.y, 5.2, 0.44, signRot(p.x, p.y), '#263b47', '#eef4f2');
        k += 1;
        metrics.exitSigns += 1;
      }
    }

    // vomitory headwall with door openings (gaps in the ribbon)
    const curve = loopCurve(H);
    const len = curve.getLength();
    const portals = [];
    for (let k = 1; k < AISLES; k += 2) {
      const u = k / AISLES;
      const { yaw, p } = yawAt(curve, u);
      if (!fitsNorthFootprint(p.x,p.y,yaw,false,portalW/2+.45,1.15)) continue;
      portals.push({ u, yaw, p });
    }
    const halfU = (portalW / 2 + 0.10) / len;
    const mask = new Uint8Array(SEG);
    for (const pr of portals) {
      for (let i = 0; i < SEG; i += 1) {
        const u = i / SEG;
        const d = Math.abs(u - pr.u);
        if (Math.min(d, 1 - d) < halfU) mask[i] = 1;
      }
    }
    const wallPred = (a, c, i) => filter(a, c) && !mask[i];
    wallPred.clipNorth="outside";wallPred.reject=(a,c,i)=>!!mask[i];
    ribbon(b, curve.getSpacedPoints(SEG), floorY - 0.04, floorY + 2.42, pale, wallPred);
    flatBand(b, H - 0.10, H + 0.16, floorY + 2.44, offWhite, filter);

    let block = blockBase;
    for (const pr of portals) {
      const { p, yaw } = pr;
      b.at(p.x, floorY, p.y, yaw, () => {
        const w = portalW;
        const h = portalH;
        // white surround (cut edges + jambs)
        for (const s of [-1, 1]) b.box(s * (w / 2 + 0.15), h / 2 + 0.20, 0.02, 0.30, h + 0.20, 0.24, offWhite);
        b.box(0, h + 0.30, 0.02, w + 0.60, 0.30, 0.24, offWhite);
        b.box(0, 0.055, 0.02, w + 0.60, 0.13, 0.28, offWhite);
        // recessed dark vestibule
        b.box(0, h / 2 + 0.20, -0.62, w - 0.06, h - 0.02, 1.02, ledDark);
        // steps rising into the concourse behind
        for (let s = 0; s < 3; s += 1) {
          b.box(0, 0.16 + s * 0.19, -0.26 - s * 0.25, w - 0.24, 0.19, 0.26, offWhite);
          metrics.portalSteps += 1; bump();
        }
        // handrails flanking the vomitory
        for (const s of [-1, 1]) {
          b.pipe([s * (w / 2 + 0.02), 0.0, 0.20], [s * (w / 2 + 0.02), 1.02, 0.20], 0.030, steel);
          b.pipe([s * (w / 2 + 0.02), 1.02, 0.20], [s * (w / 2 + 0.02), 1.02, -0.55], 0.030, steel);
          metrics.portalRails += 2; bump(2);
        }
        // lit lintel strip inside the recess
        b.box(0, h - 0.02, -0.58, w - 0.34, 0.05, 0.42, ledWarm);
        bump(6);
      });
      // block sign above the portal, facing the pitch
      const [ix, iz] = midIn(p.x, p.y);
      sign(layers.bowl, `BLOCK ${block}`, p.x + ix * 0.20, floorY + 2.20, p.y + iz * 0.20, 1.7, 0.32, signRot(p.x, p.y), '#1d2f3c', '#e9f1f2');
      metrics.blockSigns += 1;
      block += 1;
      metrics.vomitories += 1;
    }

    metrics.concourseBands += 1;
    metrics.primitives += 40;
  }

  const [T0, T1, T2] = bowlSections.tiers;
  // lower tier top (between lower and middle tiers)
  buildConcourseBand({ lower: T0, upper: T1, pred: keepNorth, blockBase: 101, portalH: 1.95, portalW: 2.35, ledEverywhere: true });
  // middle tier top (between middle and upper tiers)
  buildConcourseBand({ lower: T1, upper: T2, pred: keepNorth, blockBase: 201, portalH: 2.05, portalW: 2.35 });

  // =========================================================================
  // 3. Aisle nosing strips: a pale nosing on every tread along every radial
  //    aisle, matching the concrete treads rather than replacing them.
  // =========================================================================
  function addAisleNosings(t, pred, everyRow = 1) {
    for (let row = 0; row < t.rows; row += everyRow) {
      const off = t.start + row * t.step + 0.10;
      const curve = shape(off);
      const y = t.y + row * t.rise + 0.045;
      for (let k = 0; k < AISLES; k += 1) {
        const u = k / AISLES;
        const p = curve.getPoint(u);
        if (!pred(p.x, p.y)) continue;
        const q = curve.getPoint((u + 1e-4) % 1);
        const yaw = Math.atan2(-(q.y - p.y), q.x - p.x);
        b.box(p.x, y, p.y, 1.32, 0.028, 0.13, offWhite, yaw);
        metrics.aisleNosings += 1;
        bump();
      }
    }
  }
  addAisleNosings(T0, () => true, 1);
  addAisleNosings(T1, (x, z) => keepNorth(x, z), 1);
  addAisleNosings(T2, (x, z) => keepNorth(x, z), 1);

  // =========================================================================
  // 4. 2026 north stand: continuous front LED on the tier-back ring, a mid-
  //    height egress/entrance band and the rear concourse with portals.
  // =========================================================================
  const N = bowlSections.north;
  {
    const pred = (a, c) => northOnly((a.x + c.x) / 2, (a.y + c.y) / 2);
    // North nosings are built with the two-step solids in north-aisle-steps.js.

    // Front parapet above the retained lower tier: the new north upper tier
    // rises directly behind the lower tier's back ring here (there is no
    // walkway gap), so a pale band above the LED ribbon reads as its front
    // fascia and also covers the legacy scene.js portal boxes that sit in the
    // north tier's first rows.
    ribbon(b, loop(24.02, SEG), 8.08, 9.02, pale, pred);
    flatBand(b, 23.94, 24.20, 9.04, offWhite, pred);

    // Rear concourse at the top of the 59-row north tier.
    const Bn = N.start + N.rows * N.step;                       // 63.35
    const floorY = N.y + N.rows * N.rise + 0.425;               // 33.68
    const H = Bn + 2.0;
    // LED ribbon on the back ring
    ledRibbon({ offYard: Bn + 0.02, y0: floorY - 0.55, y1: floorY + 0.72, pred, textStep: 15, texts: ['MAN CITY', 'ETIHAD', 'TOGETHER'] });
    flatBand(b, H, H + 1.9, floorY, soffitGrey, pred);
    // headwall with portals
    const curve = loopCurve(H);
    const len = curve.getLength();
    const portals = [];
    for (let k = 0; k < AISLES; k += 3) {
      const u = k / AISLES;
      const { yaw, p } = yawAt(curve, u);
      if (!northOnly(p.x, p.y)) continue;
      portals.push({ u, yaw, p });
    }
    const portalW = 2.4;
    const halfU = (portalW / 2 + 0.10) / len;
    const mask = new Uint8Array(SEG);
    for (const pr of portals) {
      for (let i = 0; i < SEG; i += 1) {
        const u = i / SEG;
        const d = Math.abs(u - pr.u);
        if (Math.min(d, 1 - d) < halfU) mask[i] = 1;
      }
    }
    ribbon(b, curve.getSpacedPoints(SEG), floorY - 0.04, floorY + 2.30, pale, (a, c, i) => pred(a, c) && !mask[i]);
    flatBand(b, H - 0.10, H + 0.16, floorY + 2.32, offWhite, pred);
    let block = 401;
    for (const pr of portals) {
      const { p, yaw } = pr;
      b.at(p.x, floorY, p.y, yaw, () => {
        for (const s of [-1, 1]) b.box(s * (portalW / 2 + 0.15), 1.10, 0.02, 0.30, 2.10, 0.24, offWhite);
        b.box(0, 2.22, 0.02, portalW + 0.60, 0.28, 0.24, offWhite);
        b.box(0, 0.06, 0.02, portalW + 0.60, 0.13, 0.28, offWhite);
        b.box(0, 1.12, -0.62, portalW - 0.06, 1.90, 1.02, ledDark);
        for (let s = 0; s < 3; s += 1) { b.box(0, 0.16 + s * 0.19, -0.26 - s * 0.25, portalW - 0.24, 0.19, 0.26, offWhite); metrics.portalSteps += 1; }
        b.box(0, 1.93, -0.58, portalW - 0.34, 0.05, 0.42, ledWarm);
        for (const s of [-1, 1]) {
          b.pipe([s * (portalW / 2 + 0.02), 0.0, 0.20], [s * (portalW / 2 + 0.02), 0.95, 0.20], 0.028, steel);
          metrics.portalRails += 1;
        }
        bump(10);
      });
      const [ix, iz] = midIn(p.x, p.y);
      sign(layers.bowl, `BLOCK ${block}`, p.x + ix * 0.20, floorY + 2.12, p.y + iz * 0.20, 1.7, 0.30, signRot(p.x, p.y), '#1d2f3c', '#e9f1f2');
      metrics.blockSigns += 1;
      metrics.vomitories += 1;
      block += 1;
    }

    // Mid-height egress band across the 59-row tier (photo evidence: the
    // 2026 north upper tier is visually split by a horizontal entrance band).
    const rB = 30;
    const offB = N.start + rB * N.step;
    const yB = N.y + rB * N.rise;
    const bandSegments=1024,bandPts=loop(offB-.14,bandSegments),bandLength=shape(offB-.14).getLength();
    const bandPred=(a,c,i=0)=>pred(a,c)&&!isAisleSeat((i+.5)/bandSegments,bandLength);
    ribbon(b, bandPts, yB + 0.50, yB + 0.98, pale, bandPred);
    // The narrow dark coping stays above the radial stair openings. Masking it
    // with the seat-aisle test made the long horizontal line break into dashes.
    ribbon(b, loop(offB - 0.20, bandSegments), yB + 0.80, yB + 0.99, ledDark, pred);

    // The old middle-tier ribbon and the 2026 north entrance band terminate on
    // the same fitted x cut, but at different z and heights. Close each exposed
    // end with an actual sloped cheek fascia, carrying its dark trim and pale
    // top edge across the 3–4 m transition. This remains a C-fitted junction.
    const oldOff = T1.start + T1.rows * T1.step + 0.02;
    const oldFloor = T1.y + T1.rows * T1.rise + 0.425;
    const oldY0 = oldFloor - 0.55, oldY1 = oldFloor + 0.95;
    function cutPoint(off, side) {
      const pts = loop(off, 1024), x = side * RN.halfWidth;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], c = pts[i + 1];
        if (a.y > RN.zBelow || c.y > RN.zBelow) continue;
        if ((a.x - x) * (c.x - x) > 0) continue;
        const t = (x - a.x) / (c.x - a.x);
        return [x, a.y + (c.y - a.y) * t];
      }
      throw new Error('North ribbon return missing fitted x cut');
    }
    function cheek(side, y0a, y1a, y0b, y1b, material, inward = 0) {
      const a = cutPoint(oldOff + inward, side), c = cutPoint(offB - 0.14 + inward, side);
      const vertices = [
        a[0], y0a, a[1], c[0], y0b, c[1], c[0], y1b, c[1],
        a[0], y0a, a[1], c[0], y1b, c[1], a[0], y1a, a[1]
      ];
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      g.computeVertexNormals();
      b.geometry(g, material);
      g.dispose();
    }
    for (const side of [-1, 1]) {
      cheek(side, oldY0, oldY1, yB + 0.50, yB + 0.98, pale);
      cheek(side, oldY0 - 0.02, oldY1, yB + 0.80, yB + 0.99, ledDark, -0.055);
      metrics.primitives += 2;
    }
    // a few EXIT panels on the band
    {
      const pts = bandPts;
      let k = 0;
      for (let i = 48; i < pts.length - 1; i += 136) {
        const p = pts[i];
        if (!bandPred(p, p, i)) continue;
        const [ix, iz] = midIn(p.x, p.y);
        sign(layers.bowl, 'EXIT', p.x + ix * 0.12, yB + 0.74, p.y + iz * 0.12, 0.9, 0.24, signRot(p.x, p.y), '#243540', '#e6f1f0');
        metrics.exitSigns += 1;
        k += 1;
      }
      void k;
    }
    metrics.northBands += 2;
    metrics.concourseBands += 1;
  }

  // =========================================================================
  // 5. Players' tunnel at the south-west corner (photographed location: the
  //    tunnel mouth breaks the lower-tier front wall at the SW corner).
  // =========================================================================
  {
    const target = { x: -36.5, z: 57.5 };
    const mouth = (() => {
      const pts = loop(3.0, 360);
      let best = pts[0];
      let bestD = Infinity;
      for (const p of pts) {
        const d = Math.hypot(p.x - target.x, p.y - target.z);
        if (d < bestD) { bestD = d; best = p; }
      }
      const shapeAt = loopCurve(3.0);
      const u = bestD === Infinity ? 0 : (() => {
        let bu = 0; let bd = Infinity;
        for (let i = 0; i < 720; i += 1) {
          const q = shapeAt.getPoint(i / 720);
          const d = Math.hypot(q.x - best.x, q.y - best.y);
          if (d < bd) { bd = d; bu = i / 720; }
        }
        return bu;
      })();
      const { yaw } = yawAt(shapeAt, u);
      return { x: best.x, z: best.y, yaw };
    })();
    const inward = { x: Math.sin(mouth.yaw), z: Math.cos(mouth.yaw) };
    const kit = b;
    kit.at(mouth.x, pitch, mouth.z, mouth.yaw, () => {
      // White portal hood: jambs and lintel stand proud of the tier front wall
      // (the model's first row sits immediately behind that wall, so the mouth
      // is a hooded opening rather than a deep visible throat).
      for (const s of [-1, 1]) kit.box(s * 2.35, 1.55, 0.34, 0.52, 3.10, 0.96, offWhite);
      kit.box(0, 3.24, 0.34, 5.22, 0.56, 0.96, offWhite);
      kit.box(0, 0.04, 0.34, 5.22, 0.10, 0.96, offWhite);
      // dark tunnel mouth (opaque panel hides the tier structure behind it)
      kit.box(0, 1.52, 0.10, 4.14, 2.96, 0.22, ledDark);
      // lit transom strip inside the mouth + reflected light on the threshold
      kit.box(0, 2.86, 0.16, 3.50, 0.09, 0.10, ledWarm);
      kit.box(0, 0.10, 0.52, 4.30, 0.06, 0.30, concrete);
      // canopy over the tunnel approach: glass roof + white fascia
      kit.box(0, 3.62, 1.95, 6.70, 0.14, 4.40, glass);
      kit.box(0, 3.44, 4.06, 6.90, 0.44, 0.22, offWhite);
      for (const s of [-1, 1]) kit.box(s * 3.20, 3.44, 4.06, 0.30, 0.44, 0.22, offWhite);
      // support posts standing on the pitch apron
      for (const s of [-1, 1]) kit.pipe([s * 3.10, 0.0, 3.90], [s * 3.10, 3.58, 3.90], 0.075, steel);
      // canopy ribs
      for (const dz of [0.6, 1.7, 2.8]) kit.box(0, 3.70, dz, 6.50, 0.05, 0.09, steel);
      bump(26);
    });
    // signage facing the pitch
    sign(layers.bowl, 'THE TUNNEL CLUB', mouth.x + inward.x * 4.24, pitch + 3.44, mouth.z + inward.z * 4.24, 5.6, 0.62, mouth.yaw, '#243f52', '#eef7fa');
    sign(layers.bowl, 'PLAYERS TUNNEL', mouth.x + inward.x * 0.24, pitch + 2.66, mouth.z + inward.z * 0.24, 3.2, 0.28, mouth.yaw, '#1c3040', '#e9f3f5');
    metrics.tunnelClubSigns += 2;
    // dark walkway apron in front of the tunnel so the mouth reads at pitch level
    kit.box(mouth.x + inward.x * 2.6, pitch + 0.012, mouth.z + inward.z * 2.6, 5.0, 0.02, 5.6, dark, mouth.yaw);
    bump(2);
  }

  // =========================================================================
  // 6. West-side technical areas: the two pitch-level dugouts already built
  //    by scene.js at x = -39.5, z = +/-12 get their glass screens, canopy
  //    trim, technical-area line and signage.
  // =========================================================================
  {
    const benchZ = [-12, 12];
    for (const z of benchZ) {
      const kit = pkit;
      // glass screen under the canopy read as the dugout enclosure
      kit.box(-38.32, pitch + 1.70, z, 0.06, 0.62, 9.6, glass);
      for (const dz of [-4.8, 4.8]) kit.box(-38.32, pitch + 1.70, z + dz, 0.10, 0.68, 0.10, steel);
      // front canopy fascia + sponsor strip
      kit.box(-38.22, pitch + 1.95, z, 0.14, 0.26, 10.6, offWhite);
      kit.box(-38.14, pitch + 1.80, z, 0.06, 0.10, 10.2, teal);
      // roof edge trim on the canopy
      kit.box(-39.5, pitch + 2.09, z + 5.30, 2.9, 0.10, 0.12, steel);
      kit.box(-39.5, pitch + 2.09, z - 5.30, 2.9, 0.10, 0.12, steel);
      // pitch-side technical-area boundary line
      kit.box(-37.05, pitch + 0.02, z, 0.10, 0.02, 10.6, offWhite);
      // shelter side returns
      for (const dz of [-5.15, 5.15]) kit.box(-39.4, pitch + 1.55, z + dz, 2.7, 0.10, 0.10, steel);
      metrics.dugouts += 1;
      metrics.dugoutScreens += 1;
      bump(20);
    }
    sign(layers.pitch, 'TECHNICAL AREA', -38.10, pitch + 1.95, -12, 8.0, 0.20, Math.PI / 2, '#2b4a5c', '#eaf4f2');
    sign(layers.pitch, 'TECHNICAL AREA', -38.10, pitch + 1.95, 12, 8.0, 0.20, Math.PI / 2, '#2b4a5c', '#eaf4f2');
  }

  // =========================================================================
  // 7. TV camera gantry on the front of the upper tier (south centre) plus
  //    side camera positions on the east and west upper-tier fronts.
  // =========================================================================
  function frontPoint(off, pick) {
    const pts = loop(off, 360);
    const shapeAt = loopCurve(off);
    let best = null;
    let bestScore = -Infinity;
    for (const p of pts) {
      const score = pick(p);
      if (score > bestScore) { bestScore = score; best = p; }
    }
    let bu = 0;
    let bd = Infinity;
    for (let i = 0; i < 720; i += 1) {
      const q = shapeAt.getPoint(i / 720);
      const d = Math.hypot(q.x - best.x, q.y - best.y);
      if (d < bd) { bd = d; bu = i / 720; }
    }
    const { yaw } = yawAt(shapeAt, bu);
    return { x: best.x, z: best.y, yaw };
  }

  {
    const off = T2.start - 0.75;
    const p = frontPoint(off, (q) => q.y - Math.abs(q.x) * 0.02); // south centre
    const inward = { x: Math.sin(p.yaw), z: Math.cos(p.yaw) };
    const deckY = T2.y + 0.18;                 // just above the upper front ring
    const kit = struct;
    // local frame: +X along the row, +Z inward towards the pitch
    const along = { x: Math.cos(p.yaw), z: -Math.sin(p.yaw) };
    const at2 = (lx, lz) => ({ x: p.x + along.x * lx + inward.x * lz, z: p.z + along.z * lx + inward.z * lz });
    // platform deck cantilevered in front of the upper-tier wall
    {
      const c = at2(0, 0.95);
      kit.box(c.x, deckY, c.z, 9.2, 0.18, 1.9, steel, p.yaw);
    }
    {
      const f = at2(0, 1.95);
      kit.box(f.x, deckY - 0.12, f.z, 9.4, 0.34, 0.18, ledDark, p.yaw);
    }
    // guard rails along the pitch edge of the platform
    for (const h of [0.55, 1.10]) {
      const a = at2(-4.6, 1.95);
      const c = at2(4.6, 1.95);
      kit.pipe([a.x, deckY + h, a.z], [c.x, deckY + h, c.z], 0.03, steel);
    }
    for (let i = -4; i <= 4; i += 2) {
      const a = at2(i, 1.95);
      kit.pipe([a.x, deckY, a.z], [a.x, deckY + 1.12, a.z], 0.025, steel);
      bump();
    }
    // support legs back to the concourse floor
    const floorY = T1.y + T1.rows * T1.rise + 0.425; // 17.755
    for (const lx of [-3.6, 3.6]) {
      const a = at2(lx, 0.30);
      kit.pipe([a.x, floorY, a.z], [a.x, deckY - 0.1, a.z], 0.10, steel);
      bump();
    }
    // diagonal braces back to the upper-tier wall
    for (const lx of [-3.0, 3.0]) {
      const a = at2(lx, 1.8);
      const c = at2(lx, -0.25);
      kit.pipe([a.x, deckY - 0.15, a.z], [c.x, deckY + 2.2, c.z], 0.05, steel);
      bump();
    }
    // three camera positions: tripod, body, lens, monitor and operator seat
    for (const lx of [-2.9, 0, 2.9]) {
      const cam = at2(lx, 1.05);
      const by = deckY + 0.09;
      for (let t = 0; t < 3; t += 1) {
        const a = (t / 3) * Math.PI * 2 + 0.5;
        kit.pipe([cam.x + Math.cos(a) * 0.42, by, cam.z + Math.sin(a) * 0.42], [cam.x, by + 0.92, cam.z], 0.028, dark);
        bump();
      }
      kit.box(cam.x, by + 1.02, cam.z, 0.46, 0.26, 0.24, dark, p.yaw);
      const lens = at2(lx, 1.40);
      kit.pipe([cam.x, by + 1.02, cam.z], [lens.x, by + 0.96, lens.z], 0.075, dark);
      // monitor on a stand beside the camera, with a lit screen
      const mon = at2(lx + 0.62, 0.70);
      kit.pipe([mon.x, by, mon.z], [mon.x, by + 0.72, mon.z], 0.035, dark);
      kit.box(mon.x, by + 0.86, mon.z, 0.52, 0.32, 0.05, dark, p.yaw);
      const scr = at2(lx + 0.62, 0.67);
      kit.box(scr.x, by + 0.86, scr.z, 0.42, 0.24, 0.015, teal, p.yaw);
      // operator seat behind the camera
      const seat = at2(lx, 0.30);
      kit.box(seat.x, by + 0.26, seat.z, 0.50, 0.10, 0.48, dark, p.yaw);
      kit.box(seat.x, by + 0.56, seat.z - inward.z * 0.22, 0.50, 0.56, 0.09, dark, p.yaw);
      metrics.gantryCameras += 1;
      bump(10);
    }
    {
      const s = at2(0, 2.05);
      sign(layers.structure, 'TV CAMERA', s.x, deckY - 0.10, s.z, 3.6, 0.30, p.yaw, '#253a47', '#e8f2f4');
    }
    metrics.gantry = 1;
    bump(6);

    // side camera positions on the east and west upper-tier fronts
    for (const side of [-1, 1]) {
      const q = frontPoint(off, (r) => side * r.x - Math.abs(r.y) * 0.02);
      const inq = { x: Math.sin(q.yaw), z: Math.cos(q.yaw) };
      const dY = T2.y + 0.18;
      const qa = { x: Math.cos(q.yaw), z: -Math.sin(q.yaw) };
      const at3 = (lx, lz) => ({ x: q.x + qa.x * lx + inq.x * lz, z: q.z + qa.z * lx + inq.z * lz });
      const d = at3(0, 0.85);
      kit.box(d.x, dY, d.z, 3.2, 0.16, 1.5, steel, q.yaw);
      for (const h of [0.6, 1.1]) {
        const a = at3(-1.5, 1.55);
        const c = at3(1.5, 1.55);
        kit.pipe([a.x, dY + h, a.z], [c.x, dY + h, c.z], 0.028, steel);
      }
      const cam = at3(0, 0.95);
      kit.box(cam.x, dY + 1.05, cam.z, 0.44, 0.26, 0.24, dark, q.yaw);
      const lens = at3(0, 1.30);
      kit.pipe([cam.x, dY + 1.05, cam.z], [lens.x, dY + 0.98, lens.z], 0.07, dark);
      const trip = at3(0, 0.45);
      kit.pipe([trip.x, dY, trip.z], [cam.x, dY + 1.0, cam.z], 0.04, dark);
      metrics.sideCameras += 1;
      bump(7);
    }
  }

  // =========================================================================
  // 8. Pitch-side photographers behind the goal-line boards.
  // =========================================================================
  {
    const clusters = [];
    for (let i = -3; i <= 3; i += 1) {
      clusters.push([i * 4.2, 56.9], [i * 4.2, -56.9]);
    }
    for (const [x, z] of clusters) {
      const kit = pkit;
      const y = pitch;
      for (let t = 0; t < 3; t += 1) {
        const a = (t / 3) * Math.PI * 2 + 0.8;
        kit.pipe([x + Math.cos(a) * 0.30, y, z + Math.sin(a) * 0.30], [x, y + 0.85, z], 0.022, dark);
        bump();
      }
      kit.box(x, y + 0.92, z, 0.30, 0.18, 0.20, dark);
      kit.pipe([x, y + 0.92, z], [x, y + 0.88, z - Math.sign(z) * 0.26], 0.05, dark);
      // small photographer's stool
      kit.box(x + 0.55, y + 0.24, z, 0.26, 0.06, 0.26, dark);
      metrics.photographerClusters += 1;
      bump(5);
    }
  }

  console.log('[bowl-detail]', JSON.stringify(metrics));
  return metrics;
}
