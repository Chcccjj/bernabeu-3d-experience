import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BernabeuExperience} from '../src/scene.js';

function fixture(t){
  const previous={innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight};
  globalThis.innerWidth=1440;globalThis.innerHeight=900;t.after(()=>Object.assign(globalThis,previous));
  const scene=new THREE.Scene();
  const lod=new THREE.LOD();lod.addLevel(new THREE.Group(),0);lod.addLevel(new THREE.Group(),100);lod.levels[0].object.visible=false;lod.levels[1].object.visible=true;scene.add(lod);
  let ratio=1.5;
  const sizes=[];
  const e=Object.assign(Object.create(BernabeuExperience.prototype),{
    canvas:{clientWidth:800,clientHeight:600,toBlob(callback){e.complete=callback;}},scene,
    renderer:{capabilities:{maxTextureSize:8192},getPixelRatio:()=>ratio,setPixelRatio:r=>ratio=r,setSize:(w,h)=>sizes.push([w,h])},
    composer:{setPixelRatio(){},setSize(){},render(){}},camera:new THREE.PerspectiveCamera(42,4/3),
    director:{controls:{enabled:true}},envelope:{facadeLOD:lod},bowl:{seatLOD:lod},
    ao:{enabled:false,setSize(){}},bloom:{enabled:false},fxaa:{enabled:true,uniforms:{resolution:{value:new THREE.Vector2()}}},
  });
  return {e,sizes,lod};
}
test('photo export is isolated from resize and restores the latest viewport after toBlob',async t=>{
  const {e,sizes,lod}=fixture(t);const photo=e.exportImage({longEdge:1024});
  assert.deepEqual(sizes.at(-1),[1024,576]);assert.equal(e.exporting,true);assert.equal(lod.autoUpdate,false);
  e.canvas.clientWidth=900;e.canvas.clientHeight=500;e.resize();assert.deepEqual(sizes.at(-1),[1024,576]);
  assert.throws(()=>e.beginRecording('16:9'),{key:'errors.recordBusy'});
  e.complete(new Blob(['png']));const result=await photo;
  assert.equal(result.width,1024);assert.deepEqual(sizes.at(-1),[900,500]);assert.equal(e.camera.aspect,1.8);
  assert.equal(e.renderer.getPixelRatio(),1.5);assert.equal(e.exporting,false);assert.equal(e.director.controls.enabled,true);
  assert.equal(lod.autoUpdate,true);assert.equal(lod.levels[0].object.visible,false);assert.equal(e.ao.enabled,false);assert.equal(e.fxaa.enabled,true);
});
test('failed photo encoding restores rendering and allows a second export',async t=>{
  const {e}=fixture(t);e.director.controls.enabled=false;const photo=e.exportImage();e.complete(null);
  await assert.rejects(photo,{key:'errors.image'});assert.equal(e.exporting,false);assert.equal(e.director.controls.enabled,false);
  const retry=e.exportImage();e.complete(new Blob(['png']));await retry;assert.equal(e.exporting,false);
});
test('recording uses fixed dimensions and matching FXAA sampling through viewport resizes',t=>{
  const {e,sizes}=fixture(t);const size=e.beginRecording('9:16');
  assert.deepEqual(size,{width:1080,height:1920});assert.deepEqual(sizes.at(-1),[1080,1920]);
  assert.equal(e.fxaa.uniforms.resolution.value.x,1/1080);assert.equal(e.fxaa.uniforms.resolution.value.y,1/1920);
  e.canvas.clientWidth=320;e.canvas.clientHeight=240;e.resize();assert.deepEqual(sizes.at(-1),[1080,1920]);
  e.endRecording();assert.deepEqual(sizes.at(-1),[320,240]);assert.equal(e.renderer.getPixelRatio(),1.5);
});
test('quality changes are deferred until a recording or export releases its dimensions',async t=>{
  const {e}=fixture(t);e.beginRecording('16:9');e.setQuality('high');assert.equal(e.renderer.getPixelRatio(),1);assert.equal(e.pendingQuality,'high');
  let applied; e.setQuality=value=>{applied=value;};e.endRecording();assert.equal(applied,'high');assert.equal(e.pendingQuality,null);
  e.setQuality=BernabeuExperience.prototype.setQuality;const photo=e.exportImage();e.setQuality('performance');assert.equal(e.pendingQuality,'performance');
  e.setQuality=value=>{applied=value;};e.complete(new Blob(['png']));await photo;assert.equal(applied,'performance');
});

test('mechanism requests share pending completion and reversals settle the interrupted request',async t=>{
  const {e}=fixture(t);e.mechanisms={roof:1,pitch:1};e.roofClosed=true;e.pitchStored=true;
  t.after(()=>{e.roofTween?.kill();e.pitchTween?.kill();});
  const open=e.setRoof(false);assert.equal(e.setRoof(false),open);e.roofTween.progress(.5);
  const close=e.setRoof(true);assert.equal(await open,false);e.roofTween.progress(1);assert.equal(await close,true);assert.equal(e.mechanisms.roof,1);
  const restore=e.setPitch(false);assert.equal(e.setPitch(false),restore);e.pitchTween.progress(.3);
  const store=e.setPitch(true);assert.equal(await restore,false);e.pitchTween.progress(1);assert.equal(await store,true);assert.equal(e.mechanisms.pitch,1);
});
test('reversing a mechanism before its first frame does not leave a stale rejected task',async t=>{
  const {e}=fixture(t);e.mechanisms={roof:0,pitch:0};e.roofClosed=false;e.pitchStored=false;
  const close=e.setRoof(true);assert.equal(await e.setRoof(false),true);assert.equal(await close,false);assert.equal(await e.setRoof(false),true);
  const store=e.setPitch(true);assert.equal(await e.setPitch(false),true);assert.equal(await store,false);assert.equal(await e.setPitch(false),true);
});

test('disposed scenes do not allocate new render targets when an old photo finishes',async t=>{
  const {e,sizes}=fixture(t);const photo=e.exportImage();const count=sizes.length;e.disposed=true;
  e.renderer.setPixelRatio=()=>{throw new Error('renderer already disposed');};e.composer.setPixelRatio=e.renderer.setPixelRatio;
  e.complete(new Blob(['png']));await photo;assert.equal(sizes.length,count);assert.equal(e.exporting,false);
});
test('scene disposal releases instance buffers, unattached materials and source textures once',t=>{
  const {e}=fixture(t);const geometry=new THREE.BoxGeometry(),texture=new THREE.Texture(),material=new THREE.MeshBasicMaterial({map:texture});
  const mesh=new THREE.InstancedMesh(geometry,material,1);e.scene.add(mesh);
  const unused=new THREE.MeshBasicMaterial(),grass=new THREE.Texture();e.materials={unused};e.pitch={grassTex:grass};
  const counts={};for(const [key,object] of Object.entries({geometry,texture,material,mesh,unused,grass}))object.addEventListener('dispose',()=>counts[key]=(counts[key]||0)+1);
  e.director.dispose=()=>{};e.canvas.removeEventListener=()=>{};e.envTargets=[];e.composer.passes=[];e.composer.dispose=()=>{};e.sun={shadow:{dispose(){}}};e.renderer.dispose=()=>{};
  const previousWindow=globalThis.window,previousCancel=globalThis.cancelAnimationFrame;globalThis.window={removeEventListener(){}};globalThis.cancelAnimationFrame=()=>{};
  t.after(()=>{globalThis.window=previousWindow;globalThis.cancelAnimationFrame=previousCancel;});
  e.dispose();e.dispose();assert.deepEqual(counts,{mesh:1,geometry:1,unused:1,material:1,texture:1,grass:1});
});
