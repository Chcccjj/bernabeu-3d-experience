import * as THREE from 'three';
import { createGeometryKit } from './src/core/geometry.js';

// Two new north-stand A-frame headframes, as photographed in 2025/2026.
// Each frame is a tapered three-legged steel frame: two front legs land on the
// new roof near the south junction, one rear leg lands near the north edge,
// the legs carry a circular lattice node at ~55 % height and a chunky apex
// gusset around y = 72. Seven stays fan from the apex down onto the new sheet.
//
// A  two frames, three legs, circular node brace, apex plate, 7-stay fans
// B  apex height (72 m) and the general leg spread read from the 2026 photos
// C  exact foot coordinates, member sections and stay landings are a fit
//    (the 2026 form runs z=-90..-172; the fan lands across the middle of the sheet)

export function buildNorthHeadframes(ctx, { layers, northRoofSample, materials }) {
  const { steel, teal, dark, pale } = materials;
  const frameMat = ctx.mat('#546b77');   // dark blue-grey painted steel (photo)
  const accent = ctx.mat('#7b8f98');     // node plates / secondary lattice
  const frames = [];

  for (const [index, x] of [-48, 48].entries()) {
    const group = new THREE.Group();
    group.name = `north_headframe_${index + 1}`;
    group.userData = {
      component: 'new north roof headframe',
      evidence: 'B photographed form; C fitted coordinates and sections',
      reference: 'north-facade-2026.jpg; aerial-2026-northwest.jpg',
      legs: 3,
      stays: 7
    };
    layers.steel.add(group);
    const kit = createGeometryKit(group, ctx.random);
    const cables = createGeometryKit(layers.cables, ctx.random);

    const apex = new THREE.Vector3(x, 72.0, -145);
    const halfAt = (s) => northRoofSample(s, 1)[0] || 1;
    const footOf = (s, du) => {
      const u = Math.max(-0.98, Math.min(0.98, x / halfAt(s) + du));
      const p = northRoofSample(s, u);
      return new THREE.Vector3(p[0], p[1] + 0.08, p[2]);
    };
    // Two front legs on the roof near the south junction, one rear leg near
    // the north edge: the photographed "three-legged" A-frame.
    const frontL = footOf(0.19, -0.145);
    const frontR = footOf(0.19, 0.145);
    const rear = footOf(0.90, 0.0);
    const feet = [frontL, frontR, rear];
    const legs = feet.map((foot) => ({ foot, axis: apex.clone().sub(foot) }));

    // ---- three tapered lattice legs --------------------------------------
    for (const [li, leg] of legs.entries()) {
      const { foot, axis } = leg;
      const len = axis.length();
      if (len < 1e-3) continue;
      const dir = axis.clone().normalize();
      const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      const chordFoot = 1.0;
      const chordHead = 0.40;
      const chordA0 = foot.clone().addScaledVector(side, chordFoot);
      const chordA1 = apex.clone().addScaledVector(side, chordHead);
      const chordB0 = foot.clone().addScaledVector(side, -chordFoot);
      const chordB1 = apex.clone().addScaledVector(side, -chordHead);
      kit.pipe(chordA0.toArray(), chordA1.toArray(), 0.33, frameMat);
      kit.pipe(chordB0.toArray(), chordB1.toArray(), 0.33, frameMat);
      // zig-zag web between the two chords
      const steps = Math.max(7, Math.round(len / 3.4));
      for (let i = 0; i < steps; i += 1) {
        const t0 = i / steps;
        const t1 = (i + 1) / steps;
        const a = foot.clone().lerp(apex, t0);
        const b = foot.clone().lerp(apex, t1);
        const from = a.clone().addScaledVector(side, i % 2 === 0 ? chordFoot * (1 - t0 * 0.6) : -chordFoot * (1 - t0 * 0.6));
        const to = b.clone().addScaledVector(side, i % 2 === 0 ? -chordFoot * (1 - t1 * 0.6) : chordFoot * (1 - t1 * 0.6));
        kit.pipe(from.toArray(), to.toArray(), 0.11, accent);
      }
      // foot casting: base plate + pin
      const yaw = Math.atan2(dir.x, dir.z);
      kit.box(foot.x, foot.y + 0.20, foot.z, 3.0, 0.40, 3.1, dark, yaw);
      const pinA = foot.clone().addScaledVector(side, -1.15);
      const pinB = foot.clone().addScaledVector(side, 1.15);
      pinA.y += 0.62;
      pinB.y += 0.62;
      kit.pipe(pinA.toArray(), pinB.toArray(), 0.38, frameMat);
      // gusset cheek plates where the leg meets the apex
      kit.box(foot.clone().lerp(apex, 0.985).x, foot.clone().lerp(apex, 0.985).y, foot.clone().lerp(apex, 0.985).z, 1.5, 1.6, 0.5, accent, yaw);
      void li;
    }

    // ---- circular lattice node brace in the front A-plane ----------------
    const mid = frontL.clone().add(frontR).multiplyScalar(0.5);
    const tNode = 0.42;
    const center = mid.clone().lerp(apex, tNode);
    const radius = (1 - tNode) * frontL.distanceTo(frontR) * 0.5;
    const legDir = apex.clone().sub(frontL).normalize();
    const across = frontR.clone().sub(frontL).normalize();
    const normal = new THREE.Vector3().crossVectors(across, legDir).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    const place = new THREE.Matrix4().compose(center, q, new THREE.Vector3(1, 1, 1));
    const ringGeo = new THREE.TorusGeometry(radius, 0.26, 8, 72);
    ringGeo.applyMatrix4(place);
    kit.geometry(ringGeo, steel);
    ringGeo.dispose();
    const innerGeo = new THREE.TorusGeometry(radius * 0.56, 0.11, 6, 48);
    innerGeo.applyMatrix4(place);
    kit.geometry(innerGeo, accent);
    innerGeo.dispose();
    // wheel spokes + hub, as seen in the facade photograph
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const p = center.clone()
        .addScaledVector(across, Math.cos(a) * radius)
        .addScaledVector(legDir, Math.sin(a) * radius);
      const q0 = center.clone()
        .addScaledVector(across, Math.cos(a) * radius * 0.56)
        .addScaledVector(legDir, Math.sin(a) * radius * 0.56);
      kit.pipe(q0.toArray(), p.toArray(), 0.075, accent);
    }
    const hubA = center.clone().addScaledVector(normal, -0.85);
    const hubB = center.clone().addScaledVector(normal, 0.85);
    kit.pipe(hubA.toArray(), hubB.toArray(), 0.55, frameMat);
    // tie from the rear leg to the top of the ring
    const rearAt = rear.clone().lerp(apex, 0.52);
    const ringTop = center.clone().addScaledVector(legDir, radius);
    kit.pipe(rearAt.toArray(), ringTop.toArray(), 0.10, accent);

    // ---- apex plate / folded gusset --------------------------------------
    const capShape = new THREE.Shape();
    capShape.moveTo(-1.65, 0);
    capShape.lineTo(1.65, 0);
    capShape.lineTo(1.30, 1.55);
    capShape.lineTo(0, 2.45);
    capShape.lineTo(-1.30, 1.55);
    capShape.closePath();
    const cap = new THREE.ExtrudeGeometry(capShape, { depth: 0.8, bevelEnabled: false });
    cap.translate(x, apex.y - 1.55, apex.z - 0.40);
    kit.geometry(cap, frameMat);
    cap.dispose();
    // folded ridge cap + pin + stay anchor plate
    kit.box(x, apex.y + 0.78, apex.z - 0.10, 2.7, 0.34, 1.7, dark);
    const pinA = new THREE.Vector3(x - 1.35, apex.y - 0.35, apex.z - 0.15);
    const pinB = new THREE.Vector3(x + 1.35, apex.y - 0.35, apex.z - 0.15);
    kit.pipe(pinA.toArray(), pinB.toArray(), 0.24, accent);
    kit.box(x, apex.y - 0.85, apex.z - 0.92, 2.35, 0.55, 0.35, accent);

    // ---- seven-stay fan landing just inside the north roof edge ----------
    const stays = 7;
    const landings = [];
    for (let j = 0; j < stays; j += 1) {
      const dx = -20 + (40 * j) / (stays - 1);
      const s = 0.94 - 0.10 * j;
      const u = Math.max(-0.96, Math.min(0.96, (x + dx) / halfAt(s)));
      const p = northRoofSample(s, u);
      const land = new THREE.Vector3(p[0], p[1] + 0.30, p[2]);
      const anchor = new THREE.Vector3(p[0], p[1] + 0.10, p[2]);
      cables.pipe([apex.x, apex.y - 0.55, apex.z], land.toArray(), 0.075, dark);
      kit.box(anchor.x, anchor.y + 0.06, anchor.z, 1.0, 0.20, 1.0, dark);
      landings.push(land.toArray());
    }

    kit.flush();
    cables.flush();
    frames.push({
      index: index + 1,
      apex: apex.toArray(),
      feet: feet.map((p) => p.toArray()),
      legs: 3,
      stays: landings.length,
      ring: {
        center: center.toArray(),
        radius: Number(radius.toFixed(2)),
        planeNormal: normal.toArray()
      }
    });
    void teal;
    void pale;
  }

  return {
    frames,
    ringBraces: frames.length,
    stayCount: frames.reduce((sum, f) => sum + f.stays, 0),
    evidence: 'B/C fitted, not as-built'
  };
}
