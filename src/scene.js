import * as THREE from 'three';
import gsap from 'gsap';
import {LocalizedError} from './i18n/index.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import hdrURL from './assets/potsdamer_platz_1k.hdr?url&inline';
import {createMaterials} from './materials.js';
import {createCity} from './model/city.js';
import {createEnvelope} from './model/envelope.js';
import {createBowl} from './model/bowl.js';
import {createPitch} from './model/pitch.js';
import {createRoof} from './model/roof.js';
import {canvasTexture} from './model/geometry.js';
import {CameraDirector} from './camera.js';
import {createArchitecturalDetails} from './model/details.js';
import {outputSize,adaptiveRatio} from './features/state.js';

const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
const palettes={
  day:{top:0x7eabd1,horizon:0xc1cbd0,ground:0x8d948e,fog:0xb9c2c5,sun:2.5,hemi:.62,fill:.32,exposure:.92,flood:2500,env:.8},
  night:{top:0x050e1d,horizon:0x192d47,ground:0x0f1a25,fog:0x101d2e,sun:.035,hemi:.17,fill:.21,exposure:1.1,flood:14000,env:.53},
  match:{top:0x081326,horizon:0x21324b,ground:0x15202c,fog:0x152238,sun:.045,hemi:.25,fill:.24,exposure:1.05,flood:17000,env:.64},
};
export class BernabeuExperience {
  constructor(canvas,{onProgress,onView,onTour,onInteraction,onMechanism}={}){
    this.canvas=canvas;this.callbacks={onProgress,onView,onTour,onInteraction,onMechanism};this.disposed=false;this.ready=false;this.mode='day';this.quality='auto';this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.3,5000);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.98;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,1.25),1.5));
    this.director=new CameraDirector(this.camera,canvas,{onChange:onView,onTour,onInteract:onInteraction,reducedMotion:this.reduced});
    this.mechanisms={roof:0,pitch:0};this.roofClosed=false;this.pitchStored=false;
    this.cutaway=false;this.exporting=false;this.recording=false;this.autoBudget={slow:0,fast:0};this.budgetTime=0;
    this.materials=createMaterials(this.renderer);this.envTargets=[];this.setupLighting();this.setupSky();
    this.scene.fog=new THREE.Fog(0xb9c2c5,540,1850);
    const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4});
    this.composer=new EffectComposer(this.renderer,target);this.renderPass=new RenderPass(this.scene,this.camera);this.composer.addPass(this.renderPass);
    this.ao=new SSAOPass(this.scene,this.camera,innerWidth/2,innerHeight/2,8);this.ao.kernelRadius=2.2;this.ao.minDistance=.001;this.ao.maxDistance=.045;this.ao.enabled=false;this.composer.addPass(this.ao);
    this.bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth/2,innerHeight/2),.10,.35,1.25);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
    this.fxaa=new ShaderPass(FXAAShader);this.composer.addPass(this.fxaa);
    this.resize=this.resize.bind(this);window.addEventListener('resize',this.resize);this.resize();
    this.contextLost=(e)=>{e.preventDefault();this.contextIsLost=true;document.dispatchEvent(new CustomEvent('experience-error',{detail:'errors.context'}));};canvas.addEventListener('webglcontextlost',this.contextLost);
    this.contextRestored=()=>location.reload();canvas.addEventListener('webglcontextrestored',this.contextRestored);
    this.last=performance.now();this.frames=0;this.frameMs=16.7;this.hudTime=0;this.elapsed=0;this.render=this.render.bind(this);
  }
  async init(){
    const report=(n,label)=>this.callbacks.onProgress?.(n,label);
    report(.04,'loading.environment');await nextFrame();
    const hdr=await new HDRLoader().loadAsync(hdrURL);const pmrem=new THREE.PMREMGenerator(this.renderer);
    const environment=pmrem.fromEquirectangular(hdr);this.envTargets[0].dispose();this.envTargets[0]=environment;this.scene.environment=environment.texture;this.scene.environmentIntensity=.8;this.scene.environmentRotation.y=.7;hdr.dispose();pmrem.dispose();
    report(.12,'loading.city');await nextFrame();this.city=createCity(this.materials);this.scene.add(this.city.group);
    report(.23,'loading.skin');await nextFrame();this.envelope=createEnvelope(this.materials);this.scene.add(this.envelope.group);
    report(.41,'loading.seats');await nextFrame();this.bowl=createBowl(this.materials);this.scene.add(this.bowl.group);
    report(.64,'loading.pitch');await nextFrame();this.pitch=createPitch(this.materials,this.renderer);this.scene.add(this.pitch.group);
    this.details=createArchitecturalDetails(this.materials);this.scene.add(this.details.group);
    report(.77,'loading.roof');await nextFrame();this.roof=createRoof(this.materials);this.scene.add(this.roof.group);this.roof.update(0);
    report(.9,'loading.compile');await nextFrame();this.director.intro();
    await this.renderer.compileAsync(this.scene,this.camera);this.composer.render();
    report(1,'loading.ready');this.ready=true;this.last=performance.now();this.render();this.setQuality('auto');
    this.canvas.dataset.seats=this.bowl.seatCount;return this;
  }
  setupLighting(){
    this.hemi=new THREE.HemisphereLight(0xdcecff,0x7e7a67,1.45);this.scene.add(this.hemi);
    this.sun=new THREE.DirectionalLight(0xffefda,3.7);this.sun.position.set(-230,340,190);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);
    Object.assign(this.sun.shadow.camera,{left:-205,right:205,top:185,bottom:-185,near:20,far:800});this.sun.shadow.bias=-.00018;this.sun.shadow.normalBias=.18;this.sun.shadow.radius=3;this.sun.target.position.set(0,15,0);this.scene.add(this.sun,this.sun.target);
    this.fill=new THREE.DirectionalLight(0xbacfe8,.65);this.fill.position.set(180,120,-210);this.scene.add(this.fill);
    this.floodlights=[];
    for(const x of [-41,41])for(const z of [-27,27]){
      const light=new THREE.SpotLight(0xf0f3ff,1200,220,Math.PI*.34,.7,2);light.position.set(x,59,z);light.target.position.set(-x*.6,0,-z*.6);this.scene.add(light,light.target);this.floodlights.push(light);
    }
    this.facadeLights=[];
    for(const [x,z] of [[0,132],[145,0],[-145,0],[0,-132]]){
      const light=new THREE.SpotLight(0xd5e4f6,0,200,.95,.9,2);light.position.set(x,3,z);light.target.position.set(x*.8,38,z*.8);this.scene.add(light,light.target);this.facadeLights.push(light);
    }
  }
  setupSky(){
    this.skyUniforms={top:{value:new THREE.Color(palettes.day.top)},horizon:{value:new THREE.Color(palettes.day.horizon)},ground:{value:new THREE.Color(palettes.day.ground)}};
    const sky=new THREE.Mesh(new THREE.SphereGeometry(2400,32,16),new THREE.ShaderMaterial({uniforms:this.skyUniforms,side:THREE.BackSide,depthWrite:false,vertexShader:'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vDirection;uniform vec3 top;uniform vec3 horizon;uniform vec3 ground;void main(){float h=normalize(vDirection).y;vec3 col=mix(horizon,top,pow(max(0.,h),.6));col=mix(col,ground,smoothstep(0.,.35,-h));gl_FragColor=vec4(col,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));
    // Shader includes must start on their own source lines.
    sky.material.fragmentShader=sky.material.fragmentShader.replace(';#include',';\n#include');sky.frustumCulled=false;this.scene.add(sky);this.sky=sky;
    const pmrem=new THREE.PMREMGenerator(this.renderer);
    for(const night of [false,true]){
      const texture=canvasTexture(1024,512,(c,w,h)=>{
        const gradient=c.createLinearGradient(0,0,0,h);gradient.addColorStop(0,night?'#182a49':'#94b9d8');gradient.addColorStop(.49,night?'#293952':'#e4e5df');gradient.addColorStop(.53,night?'#111e2b':'#aaa99b');gradient.addColorStop(1,night?'#111a24':'#777e78');c.fillStyle=gradient;c.fillRect(0,0,w,h);
        const sun=c.createRadialGradient(w*.23,h*.3,0,w*.23,h*.3,night?30:110);sun.addColorStop(0,night?'rgba(180,203,231,.35)':'rgba(255,255,244,1)');sun.addColorStop(.12,night?'rgba(150,173,210,.12)':'rgba(255,253,235,.8)');sun.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=sun;c.fillRect(0,0,w,h);
        // Broad white sky reflections and low-frequency urban silhouettes.
        if(!night){c.fillStyle='rgba(255,255,250,.28)';c.fillRect(w*.56,h*.34,w*.3,h*.07);}
        for(let i=0;i<70;i++){const hh=8+Math.sin(i*13.1)**2*22;c.fillStyle=night?'#132131':'#727c80';c.fillRect(i*w/70,h*.51-hh,w/70-2,hh+10);}
      });texture.mapping=THREE.EquirectangularReflectionMapping;
      const target=pmrem.fromEquirectangular(texture);this.envTargets.push(target);texture.dispose();
    }
    this.scene.environment=this.envTargets[0].texture;this.scene.environmentIntensity=1.15;pmrem.dispose();
  }
  setMode(mode){
    if(!palettes[mode])return;this.mode=mode;const p=palettes[mode],duration=this.reduced ? .03 : 2.2;
    this.lightingTween?.kill();const tl=gsap.timeline();this.lightingTween=tl;
    const colorTo=(color,value)=>{const c=new THREE.Color(value);tl.to(color,{r:c.r,g:c.g,b:c.b,duration},0);};
    colorTo(this.skyUniforms.top.value,p.top);colorTo(this.skyUniforms.horizon.value,p.horizon);colorTo(this.skyUniforms.ground.value,p.ground);colorTo(this.scene.fog.color,p.fog);
    tl.to(this.sun,{intensity:p.sun,duration},0).to(this.hemi,{intensity:p.hemi,duration},0).to(this.fill,{intensity:p.fill,duration},0).to(this.renderer,{toneMappingExposure:p.exposure,duration},0).to(this.scene,{environmentIntensity:p.env,duration},0);
    for(const f of this.floodlights)tl.to(f,{intensity:p.flood,duration},0);
    for(const f of this.facadeLights)tl.to(f,{intensity:mode==='day'?0:23000,duration},0);
    this.scene.environment=this.envTargets[mode==='day'?0:1].texture;
    if(this.bowl)this.bowl.crowd.visible=mode==='match';
    if(this.envelope){this.envelope.lightRing.visible=mode!=='day';this.envelope.signage.material.emissiveIntensity=mode==='day'?.1:.7;}
    this.bloom.strength=mode==='day'?.035:.18;
    this.canvas.dataset.mode=mode;
  }
  setRoof(closed){
    this.roofClosed=closed;this.roofTween?.kill();
    return new Promise(resolve=>{this.roofTween=gsap.to(this.mechanisms,{roof:closed?1:0,duration:this.reduced?.1:7.5,ease:'power2.inOut',onComplete:()=>resolve(true),onInterrupt:()=>resolve(false)});});
  }
  setPitch(stored){
    this.pitchStored=stored;this.pitchTween?.kill();
    return new Promise(resolve=>{this.pitchTween=gsap.to(this.mechanisms,{pitch:stored?1:0,duration:this.reduced?1.5:24,ease:'none',onComplete:()=>resolve(true),onInterrupt:()=>resolve(false)});});
  }
  setQuality(value){
    this.quality=value;const low=value==='performance'||(value==='auto'&&(innerWidth<720||navigator.hardwareConcurrency<6));
    const ratio=low?1:value==='high'?Math.min(Math.max(devicePixelRatio,1.5),2):Math.min(Math.max(devicePixelRatio,1.25),1.5);
    this.renderer.setPixelRatio(ratio);this.composer.setPixelRatio(ratio);
    this.ao.enabled=value==='high';this.bloom.enabled=!low;
    this.sun.shadow.mapSize.set(low?1024:2048,low?1024:2048);this.sun.shadow.map?.dispose();this.sun.shadow.map=null;
    this.canvas.dataset.quality=low?'performance':value;this.resize();
    this.autoBaseRatio=ratio;this.autoBudget={slow:0,fast:0};
  }
  setCutaway(value){
    this.cutaway=value;this.pitch.setCutaway(value);
    for(const part of [this.envelope,this.roof,this.bowl,this.city,this.details])part.group.visible=!value;
    this.scene.fog.near=value?900:540;this.canvas.dataset.cutaway=String(value);
  }
  resize(){
    const w=this.canvas.clientWidth||innerWidth,h=this.canvas.clientHeight||innerHeight;
    const width=this.recordingSize?.width||w,height=this.recordingSize?.height||h;
    this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.composer?.setSize(width,height);this.ao?.setSize(Math.round(width/2),Math.round(height/2));
    const ratio=this.renderer.getPixelRatio();this.fxaa?.uniforms.resolution.value.set(1/(w*ratio),1/(h*ratio));
  }
  async exportImage({format='16:9',longEdge=3840,mime='image/png'}={}){
    if(this.exporting||this.recording)throw new LocalizedError('errors.exportBusy');
    const limit=Math.min(this.renderer.capabilities.maxTextureSize,innerWidth<720?2048:4096);
    const size=outputSize(format,longEdge,limit),ratio=this.renderer.getPixelRatio(),aspect=this.camera.aspect;
    const ao=this.ao.enabled,bloom=this.bloom.enabled,fxaa=this.fxaa.enabled;
    const lods=[];this.scene.traverse(o=>{if(o.isLOD){lods.push([o,o.autoUpdate,o.levels.map(l=>l.object.visible)]);o.autoUpdate=false;}});
    // A still image can afford the complete louvers and seat geometry even when
    // the interactive viewport is currently showing a lighter distant level.
    for(const lod of [this.envelope.facadeLOD,this.bowl.seatLOD])lod.levels.forEach((level,i)=>level.object.visible=i===0);
    const controlsEnabled=this.director.controls.enabled;
    this.exporting=true;this.director.controls.enabled=false;
    try{
      this.renderer.setPixelRatio(1);this.composer.setPixelRatio(1);this.renderer.setSize(size.width,size.height,false);this.composer.setSize(size.width,size.height);this.ao.setSize(Math.ceil(size.width/2),Math.ceil(size.height/2));
      this.camera.aspect=size.width/size.height;this.camera.updateProjectionMatrix();this.ao.enabled=true;this.bloom.enabled=bloom;this.fxaa.enabled=false;
      this.composer.render();
      const blobPromise=new Promise((resolve,reject)=>this.canvas.toBlob(blob=>blob?resolve(blob):reject(new LocalizedError('errors.image')),mime,.96));
      const blob=await blobPromise;
      return {blob,...size,mime};
    }finally{
      this.renderer.setPixelRatio(ratio);this.composer.setPixelRatio(ratio);this.camera.aspect=aspect;this.camera.updateProjectionMatrix();this.ao.enabled=ao;this.bloom.enabled=bloom;this.fxaa.enabled=fxaa;
      for(const [lod,auto,visibility] of lods){lod.autoUpdate=auto;lod.levels.forEach((l,i)=>l.object.visible=visibility[i]);}
      this.director.controls.enabled=controlsEnabled;this.exporting=false;this.resize();this.composer.render();
    }
  }
  beginRecording(format){
    if(this.recording||this.exporting)throw new LocalizedError('errors.recordBusy');
    this.recording=true;this.recordingRatio=this.renderer.getPixelRatio();this.recordingSize=outputSize(format,innerWidth<720?1280:1920,2048);
    this.renderer.setPixelRatio(1);this.composer.setPixelRatio(1);this.resize();return this.recordingSize;
  }
  endRecording(){
    if(!this.recording)return;this.recording=false;this.recordingSize=null;
    this.renderer.setPixelRatio(this.recordingRatio);this.composer.setPixelRatio(this.recordingRatio);this.resize();
  }
  render(now=performance.now()){
    if(this.disposed||this.contextIsLost)return;this.frame=requestAnimationFrame(this.render);
    if(document.hidden||this.exporting){this.last=now;return;}
    const raw=Math.min(now-this.last,200),dt=Math.min(raw/1000,.05);this.last=now;this.elapsed+=dt;
    this.frameMs=this.frameMs*.96+raw*.04;this.director.roofProgress=this.mechanisms.roof;this.director.update(dt);
    this.roof.update(this.mechanisms.roof);this.pitch.update(this.mechanisms.pitch);
    this.roof.drawScreen(this.elapsed,this.mode,!this.reduced);
    this.bowl.crowdTime.value=this.reduced?0:this.elapsed;
    if(this.mode==='match'&&!this.reduced)this.pitch.boardTex.offset.x=this.elapsed*.008;
    this.renderer.info.autoReset=false;this.renderer.info.reset();this.composer.render(dt);this.frames++;
    this.onFrame?.(dt);
    if(now-this.hudTime>400){
      this.hudTime=now;this.callbacks.onMechanism?.(this.mechanisms,this.roofClosed,this.pitchStored);
      Object.assign(this.canvas.dataset,{fps:String(Math.round(1000/this.frameMs)),triangles:String(this.renderer.info.render.triangles),drawCalls:String(this.renderer.info.render.calls),view:this.director.mode,roof:this.mechanisms.roof.toFixed(4),pitch:this.mechanisms.pitch.toFixed(4),frames:String(this.frames),camera:this.camera.position.toArray().map(n=>n.toFixed(1)).join(','),crowd:String(this.bowl.crowd.visible)});
      // Adapt only after the initial compilation and a sustained slow frame rate.
      if(this.quality==='auto'&&!this.recording&&this.frames>180&&now-this.budgetTime>1000){
        this.budgetTime=now;const current=this.renderer.getPixelRatio();
        this.autoBudget=adaptiveRatio({...this.autoBudget,ratio:current,base:this.autoBaseRatio,ms:this.frameMs});
        if(this.autoBudget.ratio!==current){this.renderer.setPixelRatio(this.autoBudget.ratio);this.composer.setPixelRatio(this.autoBudget.ratio);this.bloom.enabled=this.autoBudget.ratio>1.05;this.resize();this.canvas.dataset.autoRatio=String(this.autoBudget.ratio);}
      }
    }
  }
  screenshot(){this.composer.render();return this.canvas.toDataURL('image/png');}
  dispose(){
    this.disposed=true;cancelAnimationFrame(this.frame);this.lightingTween?.kill();this.roofTween?.kill();this.pitchTween?.kill();this.director.dispose();window.removeEventListener('resize',this.resize);this.canvas.removeEventListener('webglcontextlost',this.contextLost);this.canvas.removeEventListener('webglcontextrestored',this.contextRestored);
    const geos=new Set(),mats=new Set(),textures=new Set();
    this.scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){mats.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
    for(const g of geos)g.dispose();for(const m of mats)m.dispose();for(const t of textures)t.dispose();this.envTargets.forEach(t=>t.dispose());this.composer.passes.forEach(p=>p.dispose?.());this.composer.dispose();this.sun.shadow.dispose();this.renderer.dispose();
  }
}
