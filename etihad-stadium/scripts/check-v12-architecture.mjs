import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import * as THREE from 'three';
import config from '../project.config.js';
import {createMaterials} from '../src/core/materials.js';
import {createRandom} from '../src/core/random.js';
import {buildScene} from '../scene.js';
const baselineCommit='46cdba3c91590460b2d4aaafdc566c0a5600f492';
const base=execFileSync('git',['show',baselineCommit+':scene.js'],{encoding:'utf8'}).replace(/(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,(_,a,path,b)=>a+new URL('../'+path,import.meta.url).href+b);
const original=await import('data:text/javascript;base64,'+Buffer.from(base).toString('base64'));
function digest(builder){const ctx={scene:new THREE.Scene(),config,...createMaterials(),...createRandom(config.seed),obstacles:[],signage:{textureCanvas:()=>null,signMat:()=>new THREE.MeshBasicMaterial()}};const layout=builder(ctx);ctx.scene.updateMatrixWorld(true);const result={};for(const [id,group]of Object.entries(layout.layers)){const hash=crypto.createHash('sha256');group.traverse(o=>{if(!o.isMesh)return;for(const [name,attr]of Object.entries(o.geometry.attributes)){hash.update(name);hash.update(Buffer.from(attr.array.buffer,attr.array.byteOffset,attr.array.byteLength));}if(o.geometry.index)hash.update(Buffer.from(o.geometry.index.array.buffer));if(o.instanceMatrix)hash.update(Buffer.from(o.instanceMatrix.array.buffer));if(o.instanceColor)hash.update(Buffer.from(o.instanceColor.array.buffer));hash.update(JSON.stringify(o.matrixWorld.elements));});result[id]=hash.digest('hex');}return result;}
const before=digest(original.buildScene),after=digest(buildScene);assert.deepEqual(after,before);const report={baselineCommit,architectureLayers:18,allLayerGeometryHashesIdentical:true,hashes:after};fs.writeFileSync('validation/v12-architecture-preservation.json',JSON.stringify(report,null,2));console.log({architectureLayers:18,allLayerGeometryHashesIdentical:true});
