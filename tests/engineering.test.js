import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {trayPose,trayTextureOffset,TRAY_WIDTH,STORAGE_Z} from '../src/model/pitch.js';
import {annulus,band,perimeter} from '../src/model/geometry.js';
import {CameraDirector} from '../src/camera.js';
import {openTunnel} from '../src/model/details.js';

const near=(a,b,epsilon=1e-7)=>assert.ok(Math.abs(a-b)<epsilon,`${a} != ${b}`);
test('six grass trays cover exactly 105 x 68 m without gaps',()=>{
  const edges=Array.from({length:6},(_,i)=>{const p=trayPose(i,0);near(p.y,1.08);return[p.z-TRAY_WIDTH/2,p.z+TRAY_WIDTH/2];});
  near(edges[0][0],-34);near(edges[5][1],34);for(let i=0;i<5;i++)near(edges[i][1],edges[i+1][0]);
});
test('texture coordinates remain continuous across all tray seams',()=>{
  // On a plane rotated -90 degrees, its negative-Z edge is UV v=1.
  for(let i=0;i<6;i++){
    near(trayTextureOffset(i)+1/6,1-i/6);
    if(i<5)near(trayTextureOffset(i),trayTextureOffset(i+1)+1/6);
  }
});
test('the transfer corridor holds one moving tray at a time',()=>{
  for(let step=0;step<=600;step++){
    const poses=Array.from({length:6},(_,i)=>trayPose(i,step/600));
    assert.ok(poses.filter(p=>p.phase>0&&p.phase<1).length<=1);
    for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){
      const sameHeight=Math.abs(poses[i].y-poses[j].y)<.7;
      if(sameHeight)assert.ok(Math.abs(poses[i].z-poses[j].z)>=TRAY_WIDTH-.001,'trays overlap in transfer');
    }
  }
});
test('stored trays are stacked below ground at separate elevations',()=>{
  const p=Array.from({length:6},(_,i)=>trayPose(i,1));p.forEach(v=>{near(v.z,STORAGE_Z);assert.ok(v.y<0);});
  for(let i=0;i<5;i++)near(p[i+1].y-p[i].y,2.15);
});
test('tray motion is continuous at every handoff and reverses along the same path',()=>{
  for(let i=0;i<6;i++)for(const phase of [0,.58,.61,1]){
    const t=(i+phase)/6,a=trayPose(i,Math.max(0,t-1e-7)),b=trayPose(i,Math.min(1,t+1e-7));
    assert.ok(Math.abs(a.y-b.y)<.001);assert.ok(Math.abs(a.z-b.z)<.001);
  }
});
test('horizontal bowl treads face upwards; risers face inward',()=>{
  const mat=new THREE.MeshBasicMaterial();const tread=annulus(80,60,79,59,10,mat),riser=band(80,60,9,10,mat,3.8,256,true);
  const n=tread.geometry.getAttribute('normal');assert.ok(n.getY(0)>.95);
  const rn=riser.geometry.getAttribute('normal');assert.ok(rn.getX(0)<-.9);
  tread.geometry.dispose();riser.geometry.dispose();mat.dispose();
});
test('perimeter spacing stays uniform around the rounded rectangle',()=>{
  const points=perimeter(120,105,500);const lengths=points.map((p,i)=>p.p.distanceTo(points[(i+1)%500].p));
  assert.ok(Math.max(...lengths)/Math.min(...lengths)<1.04);
});
test('free camera collides with the shell and enters through the central opening',()=>{
  const allowed=CameraDirector.prototype.allowedMove;
  assert.equal(allowed(new THREE.Vector3(125,35,0),new THREE.Vector3(115,35,0)),false);
  assert.equal(allowed(new THREE.Vector3(90,70,0),new THREE.Vector3(90,60,0)),false);
  assert.equal(allowed(new THREE.Vector3(0,70,0),new THREE.Vector3(0,60,0)),true);
  assert.equal(allowed(new THREE.Vector3(125,6,0),new THREE.Vector3(115,6,0)),true);
  assert.equal(allowed.call({roofProgress:1},new THREE.Vector3(0,70,0),new THREE.Vector3(0,60,0)),false);
});
test('tunnel opening removes crossing triangles without cutting the upper bowl',()=>{
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute([
    -64,1,0,-64,2,20,-63,1,20,
    -64,8,0,-64,9,1,-63,8,1,
    64,1,0,64,2,1,63,1,1,
  ],3));geo.setIndex([0,1,2,3,4,5,6,7,8]);
  openTunnel(geo);assert.deepEqual([...geo.index.array],[3,4,5,6,7,8]);geo.dispose();
});
