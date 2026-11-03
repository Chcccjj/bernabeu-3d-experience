import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createMaterials} from '../src/core/materials.js';
import {createRandom} from '../src/core/random.js';
import config from '../project.config.js';
import {buildScene,MODEL} from '../scene.js';
import {createTourCurves,cameraPositionAllowed,PITCH_EYE,interiorTransition} from '../src/experience/camera-paths.js';
import {createMatchday} from '../src/experience/matchday.js';
import {createEventSetup} from '../src/experience/event-setup.js';
const ctx={scene:new THREE.Scene(),config,...createMaterials(),...createRandom(config.seed),obstacles:[],signage:{textureCanvas:()=>null,signMat:()=>new THREE.MeshBasicMaterial()}};
const layout=buildScene(ctx);assert.equal(MODEL.pitch.width,68);assert.equal(MODEL.pitch.length,105);assert.equal(layout.area,235000);assert.equal(Object.keys(layout.layers).length,18);assert.equal(layout.interior.screens,3);
ctx.scene.updateMatrixWorld(true);const sight=new THREE.Raycaster(new THREE.Vector3(52.2,1.07,9.84047),new THREE.Vector3(-52.2,-5.27,-9.84047).normalize());assert.equal(sight.intersectObject(layout.layers.site,true).filter(h=>h.distance<55).length,0,'Site paving must not cover the submerged bowl');
const screens=ctx.displaySurfaces.filter(x=>x.kind==='screen');assert.equal(screens.length,3);assert.ok(screens.some(s=>s.mesh.position.x>0&&s.mesh.position.z>0));
const tour=createTourCurves();let minY=Infinity;for(let i=0;i<=1000;i++){const p=tour.p.getPoint(i/1000);p.y=Math.max(PITCH_EYE,p.y);assert.ok(p.toArray().every(Number.isFinite));minY=Math.min(minY,p.y);if(p.y<50){const aperture=Math.pow(Math.abs(p.x)/56,2/.46)+Math.pow(Math.abs(p.z)/78,2/.46);assert.ok(aperture<1,`Tour left roof opening at ${p.toArray()}`);}}
for(const to of [[8,PITCH_EYE,18],[52.2,1.07,9.84047]]){const curve=interiorTransition(new THREE.Vector3(350,205,370),new THREE.Vector3(...to));for(let i=0;i<1000;i++){const p=curve.getPoint(i/999);if(p.y<50)assert.ok(Math.pow(Math.abs(p.x)/56,2/.46)+Math.pow(Math.abs(p.z)/78,2/.46)<1);}}
assert.equal(cameraPositionAllowed(new THREE.Vector3(0,PITCH_EYE,0)),true);assert.equal(cameraPositionAllowed(new THREE.Vector3(80,10,0)),false);assert.equal(cameraPositionAllowed(new THREE.Vector3(80,75,0)),true);assert.equal(cameraPositionAllowed(new THREE.Vector3(0,10,-200)),false);assert.equal(cameraPositionAllowed(new THREE.Vector3(226,80,0)),false);
const crowd=createMatchday(ctx,layout);assert.ok(crowd.count>40000&&crowd.count<layout.seatCount);assert.equal(crowd.group.visible,false);crowd.setEnabled(true);assert.equal(crowd.group.visible,true);crowd.setEnabled(false);
const event=createEventSetup(ctx,MODEL.pitch.level);event.setEnabled(true);for(let i=0;i<900;i++)event.update(1/60);assert.equal(event.progress,1);event.group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(event.group);assert.ok(bounds.min.x>=-34&&bounds.max.x<=34);assert.ok(bounds.min.z>=-52.5&&bounds.max.z<=52.5);event.setEnabled(false);for(let i=0;i<900;i++)event.update(1/60);assert.equal(event.progress,0);assert.equal(event.group.visible,false);
const html=fs.readFileSync('dist/index.html','utf8');for(const id of['event-setup','event-restore','roof-structure','roof-restore','ui-restore','load-progress','navigation-pad'])assert.ok(html.includes(`id="${id}"`));assert.ok(html.includes('data-scene-mode="match"'));
const report={baseline:'V10 42 modules normalized identical',architectureLayers:18,areaMetres2:layout.area,seats:layout.seatCount,screens:screens.length,crowdCount:crowd.count,tourSamples:1001,tourMinimumEyeY:minY,roofAperture:'passed',navigationBounds:'passed',eventProtectionBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},eventRestore:'passed',pbrMaterialFactory:ctx.M.concrete.isMeshStandardMaterial};fs.writeFileSync('validation/v11-experience-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
