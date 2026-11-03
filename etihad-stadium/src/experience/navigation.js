import * as THREE from 'three';
import {cameraPositionAllowed} from './camera-paths.js';
export function createNavigation(ctx,onExit){
 const canvas=ctx.renderer.domElement,keys=new Set();let mode=null,drag=null,yaw=0,pitch=0,smoothYaw=0,smoothPitch=0;
 const rotation=new THREE.Euler(0,0,0,'YXZ'),direction=new THREE.Vector3();
 function setMode(value){mode=value;ctx.state.navigation=value;ctx.controls.enabled=!value;keys.clear();drag=null;if(value){canvas.focus({preventScroll:true});ctx.camera.getWorldDirection(direction);yaw=Math.atan2(-direction.x,-direction.z);pitch=Math.asin(THREE.MathUtils.clamp(direction.y,-1,1));smoothYaw=yaw;smoothPitch=pitch;}}
 function down(e){if(!mode)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);e.stopImmediatePropagation();}
 function move(e){if(!mode||!drag)return;yaw-=(e.clientX-drag.x)*.003;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-drag.y)*.003,-1.35,1.35);drag={x:e.clientX,y:e.clientY};e.stopImmediatePropagation();}
 const up=()=>{drag=null;};
 function keydown(e){if(!mode||/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName))return;if(e.code==='Escape'){onExit();return;}if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ShiftLeft','ShiftRight','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}}
 const keyup=e=>keys.delete(e.code),clear=()=>keys.clear();
 canvas.addEventListener('pointerdown',down,{capture:true});canvas.addEventListener('pointermove',move,{capture:true});canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);addEventListener('keydown',keydown);addEventListener('keyup',keyup);addEventListener('blur',clear);
 function update(dt){if(!mode||ctx.state.cameraScripted)return;const camera=ctx.camera;if(mode==='fly'){
  const f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),r=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),v=Number(keys.has('KeyE'))-Number(keys.has('KeyQ')),input=new THREE.Vector3(-Math.sin(yaw)*f+Math.cos(yaw)*r,v,-Math.cos(yaw)*f-Math.sin(yaw)*r);
  if(input.lengthSq()){input.normalize().multiplyScalar(dt*(keys.has('ShiftLeft')||keys.has('ShiftRight')?13:4));for(const axis of['x','y','z']){const next=camera.position.clone();next[axis]+=input[axis];if((ctx.worldNavigationAllowed??cameraPositionAllowed)(next))camera.position.copy(next);}}
 }
 const blend=1-Math.exp(-dt*18);smoothYaw=THREE.MathUtils.lerp(smoothYaw,yaw,blend);smoothPitch=THREE.MathUtils.lerp(smoothPitch,pitch,blend);rotation.set(smoothPitch,smoothYaw,0);camera.quaternion.setFromEuler(rotation);camera.getWorldDirection(direction);ctx.controls.target.copy(camera.position).addScaledVector(direction,10);
 }
 function dispose(){canvas.removeEventListener('pointerdown',down,{capture:true});canvas.removeEventListener('pointermove',move,{capture:true});canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);removeEventListener('keydown',keydown);removeEventListener('keyup',keyup);removeEventListener('blur',clear);}
 return {setMode,update,dispose,press(code,value){if(value)keys.add(code);else keys.delete(code);},get mode(){return mode;}};
}
