import * as THREE from 'three';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import config from '../project.config.js';
import {buildScene} from '../scene.js';
import {createMaterials} from '../src/core/materials.js';
import {createRandom} from '../src/core/random.js';
import {NORTH_BOUNDARY as B} from '../north-junction.js';
const ctx={scene:new THREE.Scene(),config,...createMaterials(),...createRandom(config.seed),obstacles:[],signage:{textureCanvas:()=>null,signMat:()=>new THREE.MeshBasicMaterial()}};
const layout=buildScene(ctx),mx=new THREE.Matrix4(),p=new THREE.Vector3(),v=new THREE.Vector3();let tested=0,violations=0;
const inside=(x,z)=>x>-B.halfWidth&&x<B.halfWidth&&z<B.zBelow;
for(const mesh of layout.layers.seats.children){
 if(!mesh.isInstancedMesh||!/^matchday_seat/.test(mesh.name))continue;
 const a=mesh.geometry.attributes.position;
 for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,mx);p.setFromMatrixPosition(mx);
  if(p.y<7.1||p.z>-73||Math.min(Math.abs(Math.abs(p.x)-B.halfWidth),Math.abs(p.z-B.zBelow))>1)continue;
  const expected=inside(p.x,p.z);tested++;
  for(let j=0;j<a.count;j++){v.fromBufferAttribute(a,j).applyMatrix4(mx);if(inside(v.x,v.z)!==expected){violations++;break;}}
 }
}
assert.equal(violations,0,'Emitted seat geometry crosses the neighbouring stand domain');
fs.writeFileSync('validation/seat-junction-check.json',JSON.stringify({seats:layout.seatCount,testedSeatShellsAndFrames:tested,crossingMeshes:violations,scope:'Full emitted shell/underframe vertices near north replacement seam; fitted bowl geometry'},null,2));
console.log({seats:layout.seatCount,tested,violations});
