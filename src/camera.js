import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import {walkable,walkEyeHeight} from './features/state.js';

export const CAMERA_VIEWS={
  exterior:{position:[263,340,280],target:[0,23,0],fov:42},
  interior:{position:[-70,42,66],target:[2,17,0],fov:62},
  pitch:{position:[0,2.8,4],target:[45,17,-15],fov:65},
  free:{position:[185,54,167],target:[0,30,0]},
};
const vec=(a)=>new THREE.Vector3(...a);
export class CameraDirector {
  constructor(camera,canvas,{onChange,onTour,onInteract,reducedMotion=false}={}){
    this.camera=camera;this.canvas=canvas;this.onChange=onChange;this.onTour=onTour;this.onInteract=onInteract;this.reduced=reducedMotion;
    this.controls=new OrbitControls(camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.065;this.controls.rotateSpeed=.52;this.controls.zoomSpeed=.65;this.controls.panSpeed=.65;this.controls.screenSpacePanning=true;
    this.controls.target.set(0,23,0);this.mode='exterior';this.keys=new Set();this.moving=false;this.tourProgress=0;this.installLimits();
    this.startHandler=()=>{this.cancel();this.onInteract?.();};this.controls.addEventListener('start',this.startHandler);
    this.keydown=(e)=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target.isContentEditable||e.target.closest?.('button,a,input,select,textarea,dialog,[role=tab]'))return;this.keys.add(e.code);if(['free','walk'].includes(this.mode)&&['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();};
    this.keyup=(e)=>this.keys.delete(e.code);this.blur=()=>this.keys.clear();
    window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);window.addEventListener('blur',this.blur);
    this.visibility=()=>{if(document.hidden)this.keys.clear();};
    document.addEventListener('visibilitychange',this.visibility);document.addEventListener('focusin',this.blur);
  }
  installLimits(){
    const c=this.controls;
    c.minPolarAngle=.08;c.maxPolarAngle=Math.PI*.48;c.enablePan=!['walk','seat'].includes(this.mode);c.enableZoom=!['free','walk','seat'].includes(this.mode);
    if(this.mode==='exterior'){c.minDistance=205;c.maxDistance=this.camera.aspect<.8?1150:820;}
    else if(this.mode==='interior'){c.minDistance=8;c.maxDistance=170;c.maxPolarAngle=Math.PI*.58;}
    else if(this.mode==='pitch'){c.minDistance=4;c.maxDistance=57;c.maxPolarAngle=Math.PI*.59;}
    else {c.minDistance=.1;c.maxDistance=900;c.maxPolarAngle=Math.PI*.94;c.minPolarAngle=.04;}
  }
  cancel(){
    const moving=this.moving;this.timeline?.kill();this.timeline=null;this.moving=false;
    if(moving){const p=this.camera.position,inside=p.y<64&&Math.abs(p.x)<115&&Math.abs(p.z)<98;this.mode=this.mode==='walk'&&p.y<3.1&&walkable(p.x,p.z)?'walk':inside?(this.mode==='pitch'&&p.y<4?'pitch':'interior'):p.distanceTo(this.controls.target)>205?'exterior':'free';this.installLimits();this.onChange?.(this.mode);}
    this.controls.enabled=true;this.onTour?.(null);
  }
  async setView(mode,{instant=false}={}){
    this.cancel();this.onInteract?.();const dest=CAMERA_VIEWS[mode];if(!dest)return;
    const fromInside=this.camera.position.y<64&&Math.abs(this.camera.position.x)<115&&Math.abs(this.camera.position.z)<98;this.mode=mode;this.onChange?.(mode);this.moving=true;this.controls.enabled=false;
    const duration=(this.reduced || instant) ? .01 : 1;
    const tl=gsap.timeline({onComplete:()=>{this.moving=false;this.controls.enabled=true;if(mode==='free'){const direction=this.controls.target.clone().sub(this.camera.position).normalize();this.controls.target.copy(this.camera.position).addScaledVector(direction,.2);}this.installLimits();this.controls.update();}});this.timeline=tl;
    const position=[...dest.position];
    if(mode==='exterior'&&this.camera.aspect<.9){const f=THREE.MathUtils.clamp(.82/this.camera.aspect,1,1.75);position[0]*=f;position[1]*=1+(f-1)*.62;position[2]*=f;}
    tl.to(this.camera,{fov:dest.fov||50,duration:2*duration,ease:'power2.inOut',onUpdate:()=>this.camera.updateProjectionMatrix()},0);
    const inside=(v)=>v==='interior'||v==='pitch';
    // Use the central opening for every change between external and internal space.
    const route=[];
    if(inside(mode)&&!fromInside)route.push({p:[this.camera.position.x,155,this.camera.position.z],t:[0,30,0],d:1.15},{p:[0,146,0],t:[0,14,0],d:1.5},{p:[0,74,0],t:[0,8,0],d:1.2});
    if(!inside(mode)&&fromInside)route.push({p:[0,74,0],t:[0,5,0],d:1.4},{p:[0,150,0],t:[0,20,0],d:1.1});
    route.push({p:position,t:dest.target,d:inside(mode)?2.0:2.4});
    let cursor=0;for(const step of route){tl.to(this.camera.position,{x:step.p[0],y:step.p[1],z:step.p[2],duration:step.d*duration,ease:'power2.inOut'},cursor);tl.to(this.controls.target,{x:step.t[0],y:step.t[1],z:step.t[2],duration:step.d*duration,ease:'power2.inOut'},cursor);cursor+=step.d*duration;}
    this.installLimits();
  }
  intro(){
    const f=THREE.MathUtils.clamp(.82/this.camera.aspect,1,1.75),fy=1+(f-1)*.62;
    this.camera.position.set(350*f,430*fy,375*f);this.controls.target.set(0,23,0);this.controls.update();
    this.moving=true;this.controls.enabled=true;
    this.timeline=gsap.timeline({onComplete:()=>{this.moving=false;this.controls.enabled=true;}}).to(this.camera.position,{x:263*f,y:340*fy,z:280*f,duration:this.reduced ? .05 : 4.5,ease:'power2.out'});
  }
  tour(){
    this.cancel();this.onInteract?.();this.mode='tour';this.moving=true;this.controls.enabled=false;this.onChange?.('tour');
    const startingInside=this.camera.position.y<65&&Math.abs(this.camera.position.x)<115&&Math.abs(this.camera.position.z)<98;
    const escape=startingInside?[vec([0,76,0]),vec([0,153,0])]:[];
    const position=new THREE.CatmullRomCurve3([this.camera.position.clone(),...escape,vec([330,220,305]),vec([290,100,70]),vec([230,76,-152]),vec([10,128,-220]),vec([-120,158,-135]),vec([-65,155,70]),vec([12,114,20]),vec([8,77,8]),vec([0,49,0]),vec([-18,25,18]),vec(CAMERA_VIEWS.interior.position)],false,'centripetal',.5);
    const target=new THREE.CatmullRomCurve3([this.controls.target.clone(),...escape.map(()=>vec([0,12,0])),vec([0,31,0]),vec([40,32,-4]),vec([8,39,-20]),vec([0,40,0]),vec([0,45,0]),vec([0,44,0]),vec([0,10,0]),vec([0,7,0]),vec([9,5,0]),vec([8,11,-12]),vec(CAMERA_VIEWS.interior.target)],false,'centripetal',.5);
    const motion={t:0};this.tourProgress=0;
    this.timeline=gsap.to(motion,{t:1,duration:this.reduced?12:36,ease:'none',onUpdate:()=>{
      this.camera.position.copy(position.getPoint(motion.t));this.controls.target.copy(target.getPoint(motion.t));this.camera.fov=THREE.MathUtils.lerp(48,58,motion.t);this.camera.updateProjectionMatrix();this.tourProgress=motion.t;this.onTour?.(motion.t);
    },onComplete:()=>{this.moving=false;this.mode='interior';this.controls.enabled=true;this.installLimits();this.onChange?.('interior');this.onTour?.(null);}});
  }
  moveTo(pose,{mode='hotspot',duration=2.4,waypoints=[]}={}){
    this.cancel();this.onInteract?.();
    const fromInside=this.camera.position.y<64&&Math.abs(this.camera.position.x)<115&&Math.abs(this.camera.position.z)<98;
    const toInside=pose.position[1]<64&&Math.abs(pose.position[0])<115&&Math.abs(pose.position[2])<98;
    this.mode=mode;this.onChange?.(mode);this.moving=true;this.controls.enabled=false;
    const route=[];
    if(fromInside&&!toInside)route.push({p:[0,74,0],t:[0,10,0]},{p:[0,147,0],t:[0,20,0]});
    if(!fromInside&&toInside)route.push({p:[this.camera.position.x,150,this.camera.position.z],t:[0,30,0]},{p:[0,144,0],t:[0,15,0]},{p:[0,74,0],t:[0,8,0]});
    route.push(...waypoints,{p:pose.position,t:pose.target});
    return new Promise(resolve=>{
      const done=()=>{this.moving=false;this.controls.enabled=true;
        if(['free','walk','seat'].includes(mode)){const direction=this.controls.target.clone().sub(this.camera.position).normalize();this.controls.target.copy(this.camera.position).addScaledVector(direction,.2);}
        this.installLimits();this.controls.update();resolve(true);
      };
      const tl=gsap.timeline({onComplete:done,onInterrupt:()=>resolve(false)});this.timeline=tl;
      tl.to(this.camera,{fov:pose.fov||58,duration:this.reduced?.05:duration,ease:'power2.inOut',onUpdate:()=>this.camera.updateProjectionMatrix()},0);
      let cursor=0;for(const step of route){const d=this.reduced?.03:(step===route.at(-1)?duration:1.1);tl.to(this.camera.position,{x:step.p[0],y:step.p[1],z:step.p[2],duration:d,ease:'power2.inOut'},cursor);tl.to(this.controls.target,{x:step.t[0],y:step.t[1],z:step.t[2],duration:d,ease:'power2.inOut'},cursor);cursor+=d;}
    });
  }
  async walkTour(){
    const arrived=await this.moveTo({position:[-82,1.82,0],target:[-48,2.8,0],fov:70},{mode:'walk',waypoints:[{p:[0,6,-8],t:[-55,2,-8]},{p:[-58,2.8,-8],t:[-80,2,0]},{p:[-59,2.6,0],t:[-80,2,0]}]});
    if(!arrived)return false;
    this.mode='walk';this.onChange?.('walk');this.moving=true;this.controls.enabled=false;
    return new Promise(resolve=>{
      this.timeline=gsap.timeline({onComplete:()=>{this.moving=false;this.controls.enabled=true;this.controls.target.copy(this.camera.position).add(new THREE.Vector3(1,.15,0).normalize().multiplyScalar(.2));this.installLimits();resolve(true);},onInterrupt:()=>resolve(false)});
      this.timeline.to(this.camera.position,{x:-58,duration:this.reduced?2:9,ease:'sine.inOut',onUpdate:()=>{this.camera.position.y=walkEyeHeight(this.camera.position.x);}},0).to(this.controls.target,{x:-20,y:9,z:-8,duration:this.reduced?2:9,ease:'sine.inOut'},0);
      this.timeline.to(this.camera.position,{x:-57.5,z:-8,duration:this.reduced?1:4,ease:'sine.inOut'}).to(this.controls.target,{x:8,y:10,z:-8,duration:this.reduced?1:4,ease:'sine.inOut'},'<');
      this.timeline.to(this.camera.position,{x:-28,z:-8,duration:this.reduced?2:8,ease:'sine.inOut'}).to(this.controls.target,{x:15,y:12,z:-8,duration:this.reduced?2:8,ease:'sine.inOut'},'<');
    });
  }
  captureOrbit(duration=15){
    this.cancel();this.mode='tour';this.onChange?.('tour');this.moving=true;this.controls.enabled=false;
    const angle=Math.atan2(this.camera.position.z,this.camera.position.x),motion={a:angle};
    const radius=Math.max(340,Math.hypot(this.camera.position.x,this.camera.position.z)),height=this.camera.position.y;
    this.timeline=gsap.to(motion,{a:angle+Math.PI*.8,duration,ease:'sine.inOut',onUpdate:()=>{this.camera.position.set(Math.cos(motion.a)*radius,height,Math.sin(motion.a)*radius);this.controls.target.set(0,25,0);},onComplete:()=>{this.moving=false;this.mode='exterior';this.controls.enabled=true;this.installLimits();this.onChange?.('exterior');}});
  }
  update(dt){
    if(['free','walk'].includes(this.mode)&&!this.moving){
      const velocity=new THREE.Vector3(),forward=this.controls.target.clone().sub(this.camera.position).normalize(),right=forward.clone().cross(this.camera.up).normalize();
      const walking=this.mode==='walk';if(walking){forward.y=0;forward.normalize();}
      const speed=(walking?((this.keys.has('ShiftLeft')||this.keys.has('ShiftRight'))?3.6:1.9):((this.keys.has('ShiftLeft')||this.keys.has('ShiftRight'))?65:27))*dt;
      if(this.keys.has('KeyW')||this.keys.has('ArrowUp'))velocity.add(forward);
      if(this.keys.has('KeyS')||this.keys.has('ArrowDown'))velocity.sub(forward);
      if(this.keys.has('KeyD')||this.keys.has('ArrowRight'))velocity.add(right);
      if(this.keys.has('KeyA')||this.keys.has('ArrowLeft'))velocity.sub(right);
      if(!walking&&(this.keys.has('KeyE')||this.keys.has('Space')))velocity.y+=1;
      if(!walking&&this.keys.has('KeyQ'))velocity.y-=1;
      if(velocity.lengthSq()>0){
        velocity.normalize().multiplyScalar(speed);const next=this.camera.position.clone().add(velocity);
        next.x=THREE.MathUtils.clamp(next.x,-650,650);next.z=THREE.MathUtils.clamp(next.z,-650,650);next.y=walking?walkEyeHeight(next.x):THREE.MathUtils.clamp(next.y,2.3,340);
        if(walking?walkable(next.x,next.z):this.allowedMove(this.camera.position,next)){const delta=next.clone().sub(this.camera.position);this.camera.position.copy(next);this.controls.target.add(delta);if(walking)this.onWalk?.(delta.length());}
      }
    }
    if(!this.moving){
      if(this.mode==='exterior'){
        const t=this.controls.target;t.x=THREE.MathUtils.clamp(t.x,-40,40);t.z=THREE.MathUtils.clamp(t.z,-40,40);t.y=THREE.MathUtils.clamp(t.y,10,50);
        this.camera.position.y=Math.max(this.camera.position.y,8);
      }else if(this.mode==='interior'||this.mode==='pitch'){
        this.camera.position.y=THREE.MathUtils.clamp(this.camera.position.y,2.5,55);
        const p=this.camera.position,upper=p.y>=38,middle=p.y>=18;
        const a=this.mode==='pitch'?52:upper?99+(p.y-38)*.70/.75:middle?81.5+Math.max(0,p.y-19.3):62.8+Math.max(0,p.y-2.5)*.8/.65;
        const b=this.mode==='pitch'?34:a-(upper?21:middle?21:20.9),f=(Math.abs(p.x/a)**3+Math.abs(p.z/b)**3)**(1/3);
        if(f>1){p.x/=f;p.z/=f;}
        this.controls.target.y=THREE.MathUtils.clamp(this.controls.target.y,2,35);this.controls.target.x=THREE.MathUtils.clamp(this.controls.target.x,-42,42);this.controls.target.z=THREE.MathUtils.clamp(this.controls.target.z,-28,28);
      }
      this.controls.update();
    }else this.camera.lookAt(this.controls.target);
  }
  allowedMove(old,next){
    const radius=(v,a,b,n=3.8)=>Math.abs(v.x/a)**n+Math.abs(v.z/b)**n;
    if(next.y>10&&next.y<63&&((radius(old,120,105)>1)!==(radius(next,120,105)>1)))return false;
    if((old.y>64.9)!==(next.y>64.9)&&radius(next,120,105)<1){
      if(radius(next,55,37,5.8)>1)return false;
      const openingHalfWidth=35.3*(1-(this?.roofProgress||0));if(Math.abs(next.z)>openingHalfWidth-.35)return false;
    }
    return true;
  }
  dispose(){this.cancel();this.controls.removeEventListener('start',this.startHandler);this.controls.dispose();window.removeEventListener('keydown',this.keydown);window.removeEventListener('keyup',this.keyup);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.visibility);document.removeEventListener('focusin',this.blur);}
}
