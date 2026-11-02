import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import gsap from 'gsap';
import {domFixture} from './dom-fixture.mjs';
import {CameraDirector} from '../src/camera.js';

function fixture(t){
  const window=domFixture(t),camera=new THREE.PerspectiveCamera(50,1.6);camera.position.set(200,50,200);
  const canvas=document.querySelector('#scene'),director=new CameraDirector(camera,canvas);director.mode='free';director.installLimits();
  window.testCleanups.push(()=>{director.dispose();gsap.ticker.sleep();});return {window,camera,canvas,director};
}
test('camera movement ignores UI controls and modified browser shortcuts',t=>{
  const {window,canvas,director}=fixture(t);
  for(const target of [document.querySelector('#roof-toggle'),document.querySelector('#quality-select')]){
    target.dispatchEvent(new window.KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));assert.equal(director.keys.size,0);
  }
  canvas.dispatchEvent(new window.KeyboardEvent('keydown',{code:'KeyW',ctrlKey:true,bubbles:true}));assert.equal(director.keys.size,0);
  canvas.dispatchEvent(new window.KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));assert.equal(director.keys.has('KeyW'),true);
  document.querySelector('#quality-select').focus();assert.equal(director.keys.size,0);
});
test('right Shift accelerates free movement and focus loss clears held keys',t=>{
  const {window,canvas,camera,director}=fixture(t);director.controls.target.copy(camera.position).add(new THREE.Vector3(0,0,-.2));
  const start=camera.position.clone();director.keys.add('KeyW');director.keys.add('ShiftRight');director.update(.05);
  assert.ok(Math.abs(camera.position.distanceTo(start)-3.25)<.0001);
  canvas.dispatchEvent(new window.Event('blur'));window.dispatchEvent(new window.Event('blur'));assert.equal(director.keys.size,0);
});
