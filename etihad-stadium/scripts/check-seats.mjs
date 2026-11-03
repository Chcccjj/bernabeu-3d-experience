import assert from 'node:assert/strict';
import * as THREE from 'three';
import config from '../project.config.js';
import {buildScene} from '../scene.js';
import {createMaterials} from '../src/core/materials.js';
import {createRandom} from '../src/core/random.js';

// Current bucket-seat geometry replaced the old independent BoxGeometry bases
// and backs. Audit the emitted shells/underframes, never pass with zero matches.
const ctx={scene:new THREE.Scene(),config,...createMaterials(),...createRandom(config.seed),obstacles:[],signage:{textureCanvas:()=>null,signMat:()=>new THREE.MeshBasicMaterial()}};
const layout=buildScene(ctx),matrix=new THREE.Matrix4(),frameMatrix=new THREE.Matrix4();
const key=values=>values.map(value=>Math.fround(value).toFixed(2)).join(',');
const records=new Map(layout.seatRecords.map(record=>[key([record.x,record.y,record.z]),record]));
const meshes=new Map(layout.layers.seats.children.filter(o=>o.isInstancedMesh).map(o=>[o.name,o]));
let seats=0,frames=0;
for(const [name,shell] of meshes){
  if(!/^matchday_seats_(detailed|upper)_/.test(name))continue;
  const frame=meshes.get(name.replace('matchday_seats_','matchday_seat_underframe_'));
  assert.ok(frame,`${name}: missing underframe`);assert.equal(frame.count,shell.count);
  for(const mesh of [shell,frame]){
    const positions=mesh.geometry.getAttribute('position');assert.ok(positions.count>30);
    assert.ok([...positions.array].every(Number.isFinite));
    mesh.geometry.computeBoundingBox();assert.ok(mesh.geometry.boundingBox.max.y>mesh.geometry.boundingBox.min.y);
  }
  for(let i=0;i<shell.count;i++){
    shell.getMatrixAt(i,matrix);frame.getMatrixAt(i,frameMatrix);assert.deepEqual(matrix.elements,frameMatrix.elements);
    const a=matrix.elements,record=records.get(key(a.slice(12,15)));assert.ok(record,`${name}: seat missing from selection records`);
    assert.ok(Math.abs(a[8]-Math.sin(record.yaw))<.0001&&Math.abs(a[10]-Math.cos(record.yaw))<.0001,'Rendered orientation diverges from seat-selection yaw');
    assert.ok(a[8]*record.x+a[10]*record.z<0,'Seat local +Z front must face the pitch, as defined by stadium-seats.js');
  }
  seats+=shell.count;frames+=frame.count;
}
assert.ok(seats>0,'No current seat shells were audited');assert.equal(seats,layout.seatCount);assert.equal(frames,seats);assert.equal(records.size,seats);
console.log({seats,pairedUnderframes:frames,selectionPositionsAndOrientations:'passed',scope:'current emitted bucket seats; north stair clearances are checked separately by check-north-steps.mjs'});
