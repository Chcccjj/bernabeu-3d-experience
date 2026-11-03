import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createMaterials} from '../src/core/materials.js';
import {createRandom} from '../src/core/random.js';
import config from '../project.config.js';
import {buildScene} from '../scene.js';
import {buildManchesterContext} from '../src/world/manchester-context.js';
import {normalizeStudioState,encodeStudioState,decodeStudioState} from '../src/experience/studio-state.js';
const ctx={scene:new THREE.Scene(),config,...createMaterials(),...createRandom(config.seed),obstacles:[],signage:{textureCanvas:()=>null,signMat:()=>new THREE.MeshBasicMaterial()},controls:{}};
const layout=buildScene(ctx),ids=Object.keys(layout.layers),records=layout.seatRecords;
assert.equal(records.length,layout.seatCount);assert.equal(new Set(records.map(r=>r.id)).size,records.length);
for(const r of records){assert.ok([r.x,r.y,r.z,r.yaw].every(Number.isFinite));assert.ok(['lower','middle','upper','north'].includes(r.tier));assert.ok(Number.isInteger(r.row)&&r.row>0);}
// Ray selection relies on matching each seat's actual instance translation.
const keys=new Set(records.map(r=>[r.x,r.y,r.z].map(v=>Math.fround(v).toFixed(2)).join(',')));let matched=0;
layout.layers.seats.traverse(o=>{if(o.isInstancedMesh&&/^matchday_seats_/.test(o.name)){const m=new THREE.Matrix4(),v=new THREE.Vector3();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);v.setFromMatrixPosition(m);assert.ok(keys.has(v.toArray().map(n=>n.toFixed(2)).join(',')));matched++;}}});assert.equal(matched,records.length);
const state={version:2,p:[8,-3.48,18],t:[0,-4.2,0],zoom:1,fov:66,projection:'perspective',mode:'night',explode:.3,section:true,roof:false,event:false,city:false,layers:Object.fromEntries(ids.map((id,i)=>[id,i!==2]))};
assert.deepEqual(decodeStudioState(encodeStudioState(state),ids),normalizeStudioState(state,ids));
for(const patch of[{p:[NaN,0,0]},{p:[0,-10,0]},{p:[4001,2,0]},{fov:100},{mode:'unknown'},{projection:'bad'},{explode:2},{version:1}])assert.equal(normalizeStudioState({...state,...patch},ids),null);
assert.equal(decodeStudioState('x'.repeat(12001),ids),null);assert.equal(decodeStudioState('not a state',ids),null);
const city=buildManchesterContext(ctx);assert.equal(city.group.userData.exportExclude,true);assert.ok(city.buildings>1000);
for(const b of city.footprints)assert.ok(Math.abs(b.x)>235+b.w/2||b.z+b.d/2< -255||b.z-b.d/2>245,'city must stay outside campus');
assert.equal(ctx.worldNavigationAllowed(new THREE.Vector3(0,-3.48,0)),true);assert.equal(ctx.worldNavigationAllowed(new THREE.Vector3(80,10,0)),false);assert.equal(ctx.worldNavigationAllowed(new THREE.Vector3(3000,10,0)),false);
for(const b of city.footprints.slice(0,100)){assert.equal(ctx.worldNavigationAllowed(new THREE.Vector3(b.x,3,b.z)),false);assert.equal(ctx.worldNavigationAllowed(new THREE.Vector3(b.x,b.h+5,b.z)),true);}
assert.ok(ctx.emissives.filter(m=>m.map).every(m=>m.emissiveIntensity===0));city.setVisible(false);assert.equal(city.group.visible,false);city.setVisible(true);
const report={version:'V12',seats:records.length,instanceTranslationsMatched:matched,stateValidation:'roundtrip and 10 invalid inputs passed',cityBuildings:city.buildings,cityDrawObjects:city.group.children.length,cityCampusExclusion:'passed',navigation100Footprints:'passed',cityExportExcluded:true};fs.writeFileSync('validation/v12-studio-check.json',JSON.stringify(report,null,2));console.log(report);
