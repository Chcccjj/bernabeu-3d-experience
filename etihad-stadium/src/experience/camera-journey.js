import * as THREE from 'three';
import {createTourCurves,interiorTransition,TOUR_POINTS,TOUR_TARGETS,PITCH_EYE} from './camera-paths.js';
export function createCameraJourney(ctx,navigation,onTourState){
 let animation=null;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function cancel(){animation=null;ctx.state.cameraScripted=false;onTourState(false,0,'');}
 function prepare(){navigation.setMode(null);ctx.cancelCameraMotion();ctx.state.cameraScripted=true;ctx.setOrbit(false);}
 function moveTo(shot,{instant=false,duration}={}){
  cancel();prepare();ctx.setProjection(shot.projection??'perspective');const fovFrom=ctx.camera.fov??32,fovTo=shot.fov??32;ctx.controls.maxPolarAngle=shot.look?Math.PI-.04:ctx.config.camera.maxPolarAngle;
  const to=new THREE.Vector3(...shot.p),at=new THREE.Vector3(...shot.t),from=ctx.camera.position.clone(),curve=interiorTransition(from,to);
  animation={start:performance.now(),duration:instant||reduced?0:(duration??(curve.points.length>2?4200:1500)),curve,targetFrom:ctx.controls.target.clone(),targetTo:at,zoomFrom:ctx.camera.zoom,zoomTo:shot.z,look:shot.look??null,tour:false,fovFrom,fovTo};
 }
 function tour(){moveTo({p:TOUR_POINTS[0],t:TOUR_TARGETS[0],z:1,fov:58},{duration:2600});animation.afterTour=true;onTourState(true,0,'准备巡游');}
 function update(){if(!animation)return;const a=animation,u=a.duration?THREE.MathUtils.clamp((performance.now()-a.start)/a.duration,0,1):1,s=u*u*(3-2*u),camera=ctx.camera;
  if(a.tour){camera.position.copy(a.p.getPoint(s));ctx.controls.target.copy(a.t.getPoint(s));camera.zoom=1;const phase=s<.32?'环绕外立面':s<.57?'穿过屋顶开口':s<.8?'进入草坪':'东看台观赛席';onTourState(true,u,phase);}
  else{if(camera.isPerspectiveCamera)camera.fov=THREE.MathUtils.lerp(a.fovFrom,a.fovTo,s);camera.position.copy(a.curve.getPoint(s));ctx.controls.target.lerpVectors(a.targetFrom,a.targetTo,s);camera.zoom=THREE.MathUtils.lerp(a.zoomFrom,a.zoomTo,s);}
  camera.position.y=Math.max(PITCH_EYE,camera.position.y);camera.lookAt(ctx.controls.target);camera.updateProjectionMatrix();
  if(u===1){if(!a.tour)ctx.setLens(a.fovTo);if(a.afterTour){animation={start:performance.now(),duration:reduced?0:36000,...createTourCurves(),tour:true,look:'fixed'};return;}animation=null;ctx.state.cameraScripted=false;if(a.look)navigation.setMode(a.look);if(a.tour)onTourState(false,1,'巡游完成 · 拖动环视');}
 }
 return {moveTo,tour,cancel,update,get running(){return !!animation;},get touring(){return !!(animation?.tour||animation?.afterTour);}};
}
