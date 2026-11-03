import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from '../vendor/three/examples/jsm/loaders/GLTFLoader.js';
const manifest=JSON.parse(fs.readFileSync('models/MODEL-MANIFEST.json','utf8'));
const results={};
for(const [name,expected] of Object.entries(manifest.files)){
 const bytes=fs.readFileSync('models/'+name);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),expected.sha256);
 const data=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
 const loaded=await new GLTFLoader().parseAsync(data,'');
 loaded.scene.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(loaded.scene);
 assert.ok([...box.min.toArray(),...box.max.toArray()].every(Number.isFinite));
 const min=box.min.toArray(),max=box.max.toArray();
 for(let i=0;i<3;i++){assert.ok(Math.abs(min[i]-expected.boundsMetres.min[i])<.02);assert.ok(Math.abs(max[i]-expected.boundsMetres.max[i])<.02);}
 let meshes=0,instances=0;loaded.scene.traverse(o=>{if(o.isMesh)meshes++;if(o.isInstancedMesh)instances+=o.count;});
 results[name]={bytes:bytes.length,sha256:expected.sha256,meshes,instances,reimport:'passed',boundsMetres:{min,max}};
}
fs.writeFileSync('validation/v11-export-check.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
