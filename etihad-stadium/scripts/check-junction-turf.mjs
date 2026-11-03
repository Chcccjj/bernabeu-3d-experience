import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {clipNorthPolygon,NORTH_BOUNDARY} from '../north-junction.js';import {buildScene,MODEL} from '../scene.js';import config from '../project.config.js';import {createMaterials} from '../src/core/materials.js';import {createRandom} from '../src/core/random.js';
const ctx={scene:new THREE.Scene(),config,...createMaterials(),...createRandom(config.seed),obstacles:[],signage:{textureCanvas:()=>null,signMat:()=>new THREE.MeshBasicMaterial()}};
const layout=buildScene(ctx);ctx.scene.updateMatrixWorld(true);assert.equal(layout.bowlSections.north.zBelow,layout.bowlSections.replacedNorth.zBelow);
const area=poly=>Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[2]-q[0]*p[2];},0)/2);
// Crossing both rectangle edges must partition rather than reject whole quads.
for(const quad of[[[-80,0,-82],[-68,0,-82],[-68,0,-72],[-80,0,-72]],[[-90,0,-80],[90,0,-80],[90,0,-70],[-90,0,-70]]]){
 const inside=clipNorthPolygon(quad,true),outside=clipNorthPolygon(quad,false);assert.ok(Math.abs([...inside,...outside].reduce((s,p)=>s+area(p),0)-area(quad))<1e-6);
}
const ray=new THREE.Raycaster();
// Fixed world-space probes inside the user's former gap, independent of emitted
// triangles. Infer the row only from the shared rounded rectangle section.
const concrete=layout.layers.bowl.children.find(m=>m.material?.name==='Concrete / precast seating deck');assert.ok(concrete);let probes=0;
function contourDistance(x,z,off){const r=23+off*.9,dx=Math.abs(x)-(41+off-r),dz=Math.abs(z)-(62+off-r);return Math.hypot(Math.max(dx,0),Math.max(dz,0))+Math.min(Math.max(dx,dz),0)-r;}
function offsetAt(x,z){let lo=0,hi=90;for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(contourDistance(x,z,mid)>0)lo=mid;else hi=mid;}return(lo+hi)/2;}
const N=layout.bowlSections.north;
for(const sign of[-1,1])for(let x=55;x<=73;x+=1.5)for(const z of[-75.12,-76.5,-77.88]){
 const off=offsetAt(sign*x,z),row=Math.floor((off-N.start)/N.step);if(row<0||row>=N.rows)continue;
 const expected=N.y+row*N.rise;ray.set(new THREE.Vector3(sign*x,expected+.8,z),new THREE.Vector3(0,-1,0));ray.far=1.4;
 const hits=ray.intersectObject(concrete,false).filter(h=>h.face.normal.y>.99);assert.ok(hits.length>0,`Open tread at ${sign*x},${z}`);assert.ok(Math.abs(hits[0].point.y-expected)<N.rise+.005);probes++;
}
assert.ok(probes>50);assert.ok(layout.northJunction.panels>50);
const turf=layout.turf;assert.equal(turf.surface.geometry.parameters.width,68);assert.equal(turf.surface.geometry.parameters.height,105);assert.equal(turf.surface.position.y,MODEL.pitch.level+.045);assert.equal(turf.blades.castShadow,false);
const update=ctx.lodUpdates.at(-1),camera=new THREE.PerspectiveCamera();camera.position.set(0,-3.48,10);camera.lookAt(0,-5.1,0);camera.updateMatrixWorld();update(camera);assert.equal(turf.blades.visible,true);
camera.position.set(350,205,370);camera.updateMatrixWorld();update(camera);assert.equal(turf.blades.visible,false);
const report={boundary:NORTH_BOUNDARY,areaMetres2:layout.area,seats:layout.seatCount,formerGapWorldSpaceProbes:probes,junctionReturns:layout.northJunction,turf:turf.metrics,checks:['polygon area partition across both cut planes','independent fixed world-space raycasts across former void','shared replacement/seat boundary','near grass on / far grass off','68 x 105 m surface retained'],limitations:['North and side profiles remain C fitted','transition is a model repair, not surveyed seating or egress certification']};fs.writeFileSync('validation/junction-turf-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
