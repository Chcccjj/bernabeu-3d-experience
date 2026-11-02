import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {domFixture} from './dom-fixture.mjs';
import {ExperienceTools} from '../src/features/index.js';
import {initializeLocalization,setLanguage} from '../src/i18n/index.js';
import {encodeView} from '../src/features/state.js';

function fixture(t){
  const window=domFixture(t),cleanup=initializeLocalization(),moves=[];
  const engine={canvas:Object.assign(document.querySelector('#scene'),{captureStream:undefined}),camera:new THREE.PerspectiveCamera(42,1.6),renderer:{toneMappingExposure:1,capabilities:{maxTextureSize:8192}},
    scene:new THREE.Scene(),bowl:{rowSeats:Array.from({length:64},()=>[0]),seatRecords:[{p:[0,30,70],rot:0,row:32,number:1}]},
    director:{controls:{target:new THREE.Vector3()},mode:'exterior',cancel(){},moveTo:async pose=>{moves.push(pose);return true;}},
    mechanisms:{roof:0,pitch:0},mode:'day',resize(){},setCutaway(value){this.cutaway=value;},setMode(value){this.mode=value;},setRoof:async()=>true,setPitch:async()=>true};
  engine.camera.position.set(200,100,200);
  const markers=ExperienceTools.prototype.createMarkers;
  t.mock.method(ExperienceTools.prototype,'createMarkers',function(){this.markers=new THREE.Group();});
  const tools=new ExperienceTools(engine);t.mock.method(ExperienceTools.prototype,'createMarkers',markers);
  window.testCleanups.push(()=>{tools.dispose();cleanup();});
  return {window,engine,tools,moves};
}
test('workbench tabs use one tab stop, labeled panels and arrow/Home/End navigation',t=>{
  const {window,tools}=fixture(t);tools.open('explore');
  assert.equal(document.activeElement.id,'close-drawer');
  const tabs=tools.$$('[role=tab]');assert.equal(tabs.filter(b=>b.tabIndex===0).length,1);
  tabs[0].dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  assert.equal(tools.exploreTab,'routes');assert.equal(document.activeElement,tabs[1]);assert.equal(tabs[1].getAttribute('aria-selected'),'true');
  assert.equal(tools.$('#explore-panel-routes').getAttribute('aria-labelledby'),tabs[1].id);assert.equal(tools.$('#explore-panel-seats').hidden,true);
  tabs[1].dispatchEvent(new window.KeyboardEvent('keydown',{key:'End',bubbles:true}));assert.equal(tools.exploreTab,'section');
  tabs[3].dispatchEvent(new window.KeyboardEvent('keydown',{key:'Home',bubbles:true}));assert.equal(tools.exploreTab,'seats');
  tools.close();assert.equal(document.activeElement,tools.$('[data-tool=explore]'));
});
test('language switches retain input values, panel selection and the existing scene',t=>{
  const {tools,engine}=fixture(t);tools.open('explore');tools.selectTab('routes');const scene=engine.scene.uuid;
  tools.$('#bookmark-name').value='Mi vista 中文';tools.$('#ambient-volume').value=58;
  for(const code of ['en','es','zh']){
    setLanguage(code);assert.equal(engine.scene.uuid,scene);assert.equal(tools.exploreTab,'routes');assert.equal(tools.$('#ambient-volume').value,'58');assert.equal(tools.$('#bookmark-name').value,'Mi vista 中文');
    assert.equal(document.documentElement.dataset.language,code);
  }
});
test('a hash restoration cannot mutate the scene while recording',async t=>{
  const {tools,engine,moves,window}=fixture(t);tools.recorder.state='recording';
  const view={v:1,p:[2,30,70],t:[0,10,0],m:'night',g:true,r:true,x:true,c:'study'};
  window.location.hash=encodeView(view);await tools.restore(view);
  assert.equal(engine.mode,'day');assert.equal(engine.cutaway,undefined);assert.equal(moves.length,0);
  tools.recorder.state='idle';
});
test('closing a workbench invalidates the pending exit from a closed-roof cutaway',async t=>{
  const {tools,engine,moves}=fixture(t);let complete;engine.roofClosed=true;engine.setRoof=()=>new Promise(resolve=>complete=resolve);
  tools.open('explore');engine.setCutaway(true);const exiting=tools.section(false);tools.close();complete(true);await exiting;
  assert.equal(moves.length,0);assert.equal(tools.active,null);
});
test('photos keep the studio stable until encoding finishes and restore its UI afterward',async t=>{
  const {tools,engine}=fixture(t);tools.open('photo');const originalFov=tools.studioPrevious.fov;
  engine.exporting=true;tools.close();assert.equal(tools.active,'photo');assert.equal(document.querySelector('#interface').inert,true);
  tools.open('share');assert.equal(tools.active,'photo');
  engine.exporting=false;engine.camera.fov=75;tools.close();assert.equal(engine.camera.fov,originalFov);assert.equal(tools.frame.hidden,true);assert.equal(document.querySelector('#interface').inert,false);
});
test('a browser with MediaRecorder but no captureStream disables recording',t=>{
  const prior=globalThis.MediaRecorder;globalThis.MediaRecorder=class {static isTypeSupported(){return true;}};
  t.after(()=>{globalThis.MediaRecorder=prior;});const {tools}=fixture(t);
  assert.equal(tools.$('#record-start').disabled,true);assert.equal(tools.$('#video-capability').getAttribute('data-i18n'),'video.unsupported');
});

test('camera entry waits for an opening roof even when its destination flag is already open',async t=>{
  const {tools,engine,moves}=fixture(t);engine.mechanisms.roof=.5;engine.roofClosed=false;let finish;
  engine.setRoof=()=>new Promise(resolve=>finish=resolve);
  const preset=tools.preset('field');assert.equal(moves.length,0);finish(true);await preset;assert.equal(moves.length,1);
});
test('clipboard API failures keep the view link selected when legacy copying is unavailable',async t=>{
  const {tools}=fixture(t);tools.open('share');document.execCommand=undefined;
  t.mock.method(navigator.clipboard,'writeText',async()=>{throw new Error('clipboard denied');});
  await tools.copy();const input=tools.$('#view-link');assert.equal(document.activeElement,input);assert.equal(input.selectionStart,0);assert.equal(input.selectionEnd,input.value.length);
});
