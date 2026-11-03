import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createMaterials} from './materials.js';
import {createGeometryKit} from './geometry.js';
import {createRandom} from './random.js';
import {createSkyEnvironment} from './sky-environment.js';
export function createRuntime(config){
 const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');let reduced=reducedQuery.matches;
 const lite=/[?&]lite\b/.test(location.search);
 const economy=innerWidth<700||(navigator.hardwareConcurrency||8)<=4;
 const state={time:0,trafficTime:0,pedTime:0,night:config.lighting.night,orbit:config.camera.autoRotate&&!reduced,traffic:true,people:true,trafficMode:'active',peopleMode:'active',paused:false,quality:economy?'economy':'high'};
 const scene=new THREE.Scene();scene.background=new THREE.Color(config.lighting.nightBackground);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false,logarithmicDepthBuffer:false});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,lite?1:economy?1.25:config.visual.pixelRatio));renderer.shadowMap.enabled=config.visual.shadows&&!economy&&!lite;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=config.lighting.exposure;renderer.localClippingEnabled=true;renderer.info.autoReset=false;
 document.querySelector('#city').appendChild(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label',config.title+'. Drag to orbit; scroll to zoom.');
 const cc=config.camera,perspectiveCamera=new THREE.PerspectiveCamera(cc.fov||36,innerWidth/innerHeight,.35,5200),orthographicCamera=new THREE.OrthographicCamera(-35,35,24,-24,.6,2400);let camera=cc.projection==='perspective'?perspectiveCamera:orthographicCamera;
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.rotateSpeed=.9;controls.panSpeed=.85;controls.autoRotateSpeed=cc.autoRotateSpeed;controls.screenSpacePanning=false;controls.minZoom=cc.minZoom;controls.maxZoom=cc.maxZoom;controls.minPolarAngle=cc.minPolarAngle;controls.maxPolarAngle=cc.maxPolarAngle;controls.minDistance=8;controls.maxDistance=2400;controls.maxTargetRadius=Math.max(config.terrain.width,config.terrain.depth)*.8;
 // Smooth dolly: OrbitControls' wheel dolly jumps in discrete steps, which
 // feels crude at close range. We intercept the wheel/pinch, keep a target
 // distance and ease towards it every frame (frame-rate independent).
 controls.enableZoom=false;
 let zoomDistance=null,zoomOrtho=null,pinch=null;const pointers=new Map();
 const clampZoom=v=>THREE.MathUtils.clamp(v,cc.minZoom??.45,cc.maxZoom??8);
 const onWheel=e=>{
  if(contextLost||ctx?.state.navigation)return;
  renderer.domElement.dispatchEvent(new Event('navigationinput'));
  e.preventDefault();e.stopPropagation();
  const unit=e.deltaMode===1?16:e.deltaMode===2?400:1;
  const dy=THREE.MathUtils.clamp(e.deltaY*unit,-320,320);
  resetting=null;holdOrbitUntil=performance.now()+12000;
  if(camera.isPerspectiveCamera){
   const cur=camera.position.distanceTo(controls.target);
   const base=zoomDistance??cur;
   // exponential: the step scales with distance, so far zoom moves fast and
   // close zoom is fine-grained instead of jumping over seats.
   zoomDistance=THREE.MathUtils.clamp(base*Math.exp(dy*.00145),controls.minDistance,controls.maxDistance);
  }else{
   const base=zoomOrtho??camera.zoom;
   zoomOrtho=clampZoom(base*Math.exp(-dy*.0012));
  }
 };
 renderer.domElement.addEventListener('wheel',onWheel,{passive:false,capture:true});
 const onPointerDown=e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const p=[...pointers.values()];pinch={d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),base:zoomDistance??camera.position.distanceTo(controls.target)};}};
 const onPointerMove=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinch&&camera.isPerspectiveCamera){const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(d>8)zoomDistance=THREE.MathUtils.clamp(pinch.base*pinch.d/d,controls.minDistance,controls.maxDistance);}};
 const onPointerUp=e=>{pointers.delete(e.pointerId);if(pointers.size<2)pinch=null;};
 renderer.domElement.addEventListener('pointerdown',onPointerDown,{capture:true});
 renderer.domElement.addEventListener('pointermove',onPointerMove,{capture:true});
 renderer.domElement.addEventListener('pointerup',onPointerUp,{capture:true});
 renderer.domElement.addEventListener('pointercancel',onPointerUp,{capture:true});
 // Double-click focuses on whatever is under the cursor: the quickest way to
 // get from the whole stadium to a single seat / truss / facade bay. The target
 // and dolly are tweened so the move reads as a camera move, not a jump.
 let focusTween=null;const raycaster=new THREE.Raycaster();
 function focusAt(clientX,clientY){
  if(ctx.state.navigation||ctx.state.cameraScripted)return;
  const rect=renderer.domElement.getBoundingClientRect();
  const ndc=new THREE.Vector2(((clientX-rect.left)/rect.width)*2-1,-((clientY-rect.top)/rect.height)*2+1);
  raycaster.setFromCamera(ndc,camera);
  const hits=raycaster.intersectObjects(scene.children,true).filter(h=>h.object.isMesh&&h.object.visible&&!h.object.userData?.noPick);
  if(!hits.length)return;
  const p=hits[0].point.clone();
  const dir=camera.position.clone().sub(controls.target).normalize();
  const cur=camera.position.distanceTo(controls.target);
  const want=THREE.MathUtils.clamp(Math.min(cur*.55,p.distanceTo(camera.position)*.8),12,110);
  focusTween={start:performance.now(),fromTarget:controls.target.clone(),toTarget:p,dir,fromDist:cur,toDist:want};
  zoomDistance=null;zoomOrtho=null;resetting=null;holdOrbitUntil=performance.now()+9000;
 }
 const onDblClick=e=>{e.preventDefault();focusAt(e.clientX,e.clientY);};
 renderer.domElement.addEventListener('dblclick',onDblClick);
 function zoomBy(factor){resetting=null;holdOrbitUntil=performance.now()+12000;if(camera.isPerspectiveCamera){const cur=camera.position.distanceTo(controls.target);zoomDistance=THREE.MathUtils.clamp((zoomDistance??cur)*factor,controls.minDistance,controls.maxDistance);}else zoomOrtho=clampZoom((zoomOrtho??camera.zoom)*factor);}
 const homePosition=new THREE.Vector3(...cc.position),homeTarget=new THREE.Vector3(...cc.target),homeZoom=cc.zoom??1;controls.cursor.copy(homeTarget);
 const distance=homePosition.distanceTo(homeTarget);scene.fog=new THREE.Fog(config.lighting.nightBackground,distance+260,distance+1200);
 const composer=new EffectComposer(renderer);composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;const renderPass=new RenderPass(scene,camera);composer.addPass(renderPass);const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),config.lighting.bloom,.45,1.08);composer.addPass(bloom);if(lite)bloom.enabled=false;composer.addPass(new OutputPass());
 const skyEnvironment=createSkyEnvironment(renderer);scene.environment=skyEnvironment.texture;
 const rng=createRandom(config.seed),materials=createMaterials(config.visual.palette),batch=createGeometryKit(scene,rng.random,config.visual);
 const ctx={config,scene,renderer,camera,controls,composer,bloom,state,economy,...rng,...materials,batch,obstacles:[]};
 let lensFov=null;
 let resetting=null,holdOrbitUntil=performance.now()+6500,raf=0,disposed=false,contextLost=false,previous=performance.now(),frames=0,elapsed=0,slow=0,shadowFrozen=false,shadowFrames=0;
 const dragQA=location.hostname==='127.0.0.1'&&new URLSearchParams(location.search).has('perfqa');let dragStart=0,dragFrames=0;
 function fit(){const width=ctx.outputSize?.width??innerWidth,height=ctx.outputSize?.height??innerHeight,a=width/height;if(camera.isPerspectiveCamera){camera.aspect=a;camera.fov=lensFov??(a<.85?53:cc.fov||36);}else{const viewHeight=cc.planViewHeight??cc.viewHeight,h=a<.85?viewHeight*.76/a:viewHeight;camera.left=-h*a/2;camera.right=h*a/2;camera.top=h/2;camera.bottom=-h/2;}camera.updateProjectionMatrix();renderer.setSize(width,height,!ctx.outputSize);composer.setSize(width,height);}
 function setProjection(projection){const next=projection==='orthographic'?orthographicCamera:perspectiveCamera;if(next===camera)return;resetting=null;next.position.copy(camera.position);next.quaternion.copy(camera.quaternion);next.zoom=camera.zoom;camera=next;ctx.camera=next;controls.object=next;renderPass.camera=next;const plan=next.isOrthographicCamera;controls.enableRotate=!plan;controls.minPolarAngle=plan?0:cc.minPolarAngle;controls.maxPolarAngle=plan?0:cc.maxPolarAngle;fit();controls.update();}
 function reset(instant=false){zoomDistance=null;zoomOrtho=null;setProjection(cc.projection);const d=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=d;holdOrbitUntil=performance.now()+6500;if(instant||reduced){camera.position.copy(homePosition);controls.target.copy(homeTarget);camera.zoom=homeZoom;camera.updateProjectionMatrix();controls.update();}else resetting={start:performance.now(),from:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom};}
 const onStart=()=>{resetting=null;zoomDistance=null;zoomOrtho=null;holdOrbitUntil=performance.now()+10000;if(dragQA){dragStart=performance.now();dragFrames=0;}};
 const onEnd=()=>{if(dragQA&&dragStart){const seconds=(performance.now()-dragStart)/1000;console.info('ETIHAD_DRAG '+JSON.stringify({fps:Math.round(dragFrames/seconds),frames:dragFrames,seconds:+seconds.toFixed(2),pixelRatio:renderer.getPixelRatio()}));dragStart=0;}};
 controls.addEventListener('start',onStart);controls.addEventListener('end',onEnd);
 const onReduced=e=>{reduced=e.matches;if(reduced)state.orbit=false;};reducedQuery.addEventListener('change',onReduced);
 const onLost=e=>{e.preventDefault();contextLost=true;},onRestored=()=>{contextLost=false;};renderer.domElement.addEventListener('webglcontextlost',onLost);renderer.domElement.addEventListener('webglcontextrestored',onRestored);
 addEventListener('resize',fit);fit();reset(true);
 function start(frame){previous=performance.now();function animate(now){if(disposed)return;raf=requestAnimationFrame(animate);const raw=(now-previous)/1000,dt=Math.min(raw,.1);previous=now;if(contextLost||document.hidden)return;
  if(!state.paused){state.time+=dt;if(state.traffic)state.trafficTime+=dt;if(state.people)state.pedTime+=dt;}frame(dt);
  if(resetting){const u=THREE.MathUtils.clamp((now-resetting.start)/1200,0,1),s=u*u*(3-2*u);camera.position.lerpVectors(resetting.from,homePosition,s);controls.target.lerpVectors(resetting.target,homeTarget,s);camera.zoom=THREE.MathUtils.lerp(resetting.zoom,homeZoom,s);camera.updateProjectionMatrix();if(u===1)resetting=null;}
  controls.autoRotate=state.orbit&&!state.paused&&now>holdOrbitUntil&&!resetting;
  if(!state.cameraScripted&&!state.navigation)controls.update(dt);
  if(focusTween){
   const u=THREE.MathUtils.clamp((now-focusTween.start)/900,0,1),s=u*u*(3-2*u);
   controls.target.lerpVectors(focusTween.fromTarget,focusTween.toTarget,s);
   const d=THREE.MathUtils.lerp(focusTween.fromDist,focusTween.toDist,s);
   camera.position.copy(controls.target).addScaledVector(focusTween.dir,d);
   if(u===1)focusTween=null;
  }
  if(camera.isPerspectiveCamera){
   if(zoomDistance!=null){const cur=camera.position.distanceTo(controls.target);const k=1-Math.exp(-dt*15);const next=THREE.MathUtils.lerp(cur,zoomDistance,k);if(Math.abs(next-zoomDistance)>.02){const dir=camera.position.clone().sub(controls.target).normalize();camera.position.copy(controls.target).addScaledVector(dir,next);}else{zoomDistance=null;}}
  }else if(zoomOrtho!=null){camera.zoom=THREE.MathUtils.lerp(camera.zoom,zoomOrtho,1-Math.exp(-dt*15));camera.updateProjectionMatrix();if(Math.abs(camera.zoom-zoomOrtho)<.002)zoomOrtho=null;}
  if(!state.navigation&&!state.cameraScripted){controls.target.y=THREE.MathUtils.clamp(controls.target.y,-5,160);camera.position.y=Math.max(camera.isPerspectiveCamera?-3.55:7,camera.position.y);}
  // The lighting rig and architecture are static; re-rendering the 2048 shadow
  // map every frame was a large part of the orbit cost. Render it for the first
  // few frames, then freeze it until something actually changes.
  if(!state.paused&&!shadowFrozen){shadowFrames+=1;if(shadowFrames>3){renderer.shadowMap.autoUpdate=false;shadowFrozen=true;}}
  for(const update of ctx.lodUpdates??[])update(camera);
  renderer.info.reset();renderFrame();frames++;if(dragStart)dragFrames++;elapsed+=raw;if(elapsed>3){ctx.fps=Math.round(frames/elapsed);ctx.drawCalls=renderer.info.render.calls;frames=0;elapsed=0;}
 }raf=requestAnimationFrame(animate);}
 function renderFrame(){
  // A fixed 0.35 m near plane wastes depth precision on a 500–2400 m
  // overview. Retain close inspection while scaling precision with distance.
  if(camera.isPerspectiveCamera){const near=THREE.MathUtils.clamp(camera.position.distanceTo(controls.target)*.01,.35,24);if(Math.abs(camera.near-near)>.001){camera.near=near;camera.updateProjectionMatrix();}}
  if(bloom.enabled&&bloom.strength>.001)composer.render();else renderer.render(scene,camera);
 }
 function setOrbit(enabled){state.orbit=enabled&&!reduced;holdOrbitUntil=0;}
 function cancelCameraMotion(){resetting=focusTween=null;zoomDistance=zoomOrtho=null;}
 function setLens(value=null){lensFov=value;if(camera.isPerspectiveCamera){camera.fov=value??(innerWidth/innerHeight<.85?53:cc.fov||36);camera.updateProjectionMatrix();}}
 function refreshShadows(){renderer.shadowMap.needsUpdate=true;}
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);removeEventListener('resize',fit);reducedQuery.removeEventListener('change',onReduced);controls.removeEventListener('start',onStart);controls.removeEventListener('end',onEnd);renderer.domElement.removeEventListener('wheel',onWheel,{capture:true});renderer.domElement.removeEventListener('pointerdown',onPointerDown,{capture:true});renderer.domElement.removeEventListener('pointermove',onPointerMove,{capture:true});renderer.domElement.removeEventListener('pointerup',onPointerUp,{capture:true});renderer.domElement.removeEventListener('pointercancel',onPointerUp,{capture:true});renderer.domElement.removeEventListener('dblclick',onDblClick);controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',onLost);renderer.domElement.removeEventListener('webglcontextrestored',onRestored);const gs=new Set(),ms=new Set(),ts=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){ms.add(m);for(const v of Object.values(m))if(v?.isTexture)ts.add(v);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());skyEnvironment.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove();}
 return Object.assign(ctx,{start,resize:fit,reset,setOrbit,setProjection,dispose,zoomBy,refreshShadows,cancelCameraMotion,setLens,renderFrame});
}
