import * as THREE from 'three';

export const TAU = Math.PI * 2;
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = THREE.MathUtils.clamp;
export const smooth = (t) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };
export function random(seed = 28) {
  return () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
}
export function outline(a, b, t, n = 3.8) {
  const c = Math.cos(t), s = Math.sin(t), p = 2 / n;
  return new THREE.Vector3(a * Math.sign(c) * Math.abs(c) ** p, 0, b * Math.sign(s) * Math.abs(s) ** p);
}
export function normalAt(a, b, t, n = 3.8) {
  const p = outline(a, b, t - .0001, n), q = outline(a, b, t + .0001, n);
  return new THREE.Vector3(q.z - p.z, 0, p.x - q.x).normalize();
}
export function perimeter(a, b, count, n = 3.8) {
  const pts = [], lens = [0], steps = 4096;
  for (let i = 0; i <= steps; i++) {
    pts.push(outline(a, b, i / steps * TAU, n));
    if (i) lens.push(lens[i - 1] + pts[i].distanceTo(pts[i - 1]));
  }
  const result = []; let k = 1;
  for (let i = 0; i < count; i++) {
    const d = i / count * lens[steps];
    while (k < steps && lens[k] < d) k++;
    const f = (d - lens[k - 1]) / (lens[k] - lens[k - 1]);
    result.push({ p: pts[k - 1].clone().lerp(pts[k], f), t: (k - 1 + f) / steps * TAU });
  }
  return result;
}
export function geometry(pos, idx, uv, colors) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (colors) g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  if (idx) g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
export function band(a, b, y0, y1, material, n = 3.8, segments = 256, inside = false) {
  const p = [], uv = [], ix = [];
  for (let i = 0; i <= segments; i++) {
    const q = outline(a, b, i / segments * TAU, n);
    p.push(q.x, y0, q.z, q.x, y1, q.z); uv.push(i / segments, 0, i / segments, 1);
    if (i < segments) { const k = i * 2; ix.push(...(inside ? [k,k+2,k+1,k+1,k+2,k+3] : [k,k+1,k+2,k+1,k+3,k+2])); }
  }
  const mesh = new THREE.Mesh(geometry(p, ix, uv), material); mesh.receiveShadow = true;
  return mesh;
}
export function annulus(a, b, ia, ib, y, material, {n = 3.8, innerN = n, dy = 0, segments = 256} = {}) {
  const p = [], uv = [], ix = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments * TAU, o = outline(a,b,t,n), q = outline(ia,ib,t,innerN);
    p.push(o.x,y,o.z,q.x,y+dy,q.z); uv.push(i/segments,0,i/segments,1);
    if (i < segments) { const k=i*2; ix.push(k,k+1,k+2,k+1,k+3,k+2); }
  }
  const mesh = new THREE.Mesh(geometry(p,ix,uv), material); mesh.receiveShadow = true;
  return mesh;
}
export const boxGeometry = new THREE.BoxGeometry(1,1,1);
export function box(parent, mat, x,y,z, w,h,d, rotation = 0) {
  const m = new THREE.Mesh(boxGeometry, mat); m.position.set(x,y,z); m.scale.set(w,h,d); m.rotation.y=rotation;
  m.receiveShadow=true; parent.add(m); return m;
}
export function instances(parent, geo, mat, transforms, {shadow = false, colors = false} = {}) {
  const mesh = new THREE.InstancedMesh(geo, mat, transforms.length), d = new THREE.Object3D();
  transforms.forEach((t,i) => {
    d.position.set(...t.p); d.rotation.set(...(t.r || [0,0,0])); d.scale.set(...(t.s || [1,1,1])); d.updateMatrix(); mesh.setMatrixAt(i,d.matrix);
    if (colors && t.color !== undefined) mesh.setColorAt(i, new THREE.Color(t.color));
  });
  mesh.castShadow = shadow; mesh.receiveShadow = true; mesh.computeBoundingSphere(); parent.add(mesh); return mesh;
}
export function beams(parent, edges, material, radius = .18, sides = 5) {
  const mesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,sides), material, edges.length);
  const d = new THREE.Object3D(), up = new THREE.Vector3(0,1,0);
  edges.forEach(([p,q], i) => {
    const a = new THREE.Vector3(...p), b = new THREE.Vector3(...q), v = b.clone().sub(a);
    d.position.copy(a.add(b).multiplyScalar(.5)); d.quaternion.setFromUnitVectors(up,v.clone().normalize()); d.scale.set(radius,v.length(),radius); d.updateMatrix(); mesh.setMatrixAt(i,d.matrix);
  });
  mesh.receiveShadow=true; mesh.computeBoundingSphere(); parent.add(mesh); return mesh;
}
export function lineSegments(parent, segments, color = 0xc9c9c2, opacity = 1) {
  const m = new THREE.LineSegments(geometry(segments.flat(2)), new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity})); parent.add(m); return m;
}
export function canvasTexture(w, h, draw, colorSpace = THREE.SRGBColorSpace) {
  const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=colorSpace; return tex;
}
export function textTexture(text, {w=1024,h=128,color='#f3f4f0',background='transparent',font='600 72px Arial',spacing=0} = {}) {
  return canvasTexture(w,h,(c)=>{ c.fillStyle=background;c.fillRect(0,0,w,h);c.fillStyle=color;c.font=font;c.textAlign='center';c.textBaseline='middle'; if(spacing && 'letterSpacing' in c)c.letterSpacing=`${spacing}px`;c.fillText(text,w/2,h/2,w-28); });
}
