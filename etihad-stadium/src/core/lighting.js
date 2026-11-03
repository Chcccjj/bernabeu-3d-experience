import * as THREE from 'three';
import {createRandom} from './random.js';
export function createLighting(ctx){
 const {scene,state,M,emissives,nightLights,streetLampBulb,streetLampDayColor,streetLampNightColor,windowNightColors}=ctx,cfg=ctx.config;
 const hemi=new THREE.HemisphereLight('#bfd9ef','#5d6b70',1.05);scene.add(hemi);
 const key=new THREE.DirectionalLight('#abc9ef',1);key.position.set(-210,330,170);key.castShadow=cfg.visual.shadows;key.shadow.mapSize.set(2048,2048);const bound=225;Object.assign(key.shadow.camera,{left:-bound,right:bound,top:bound,bottom:-bound,near:1,far:1000});key.shadow.bias=-.00045;key.shadow.normalBias=.42;key.shadow.radius=3;scene.add(key);
 const fill=new THREE.DirectionalLight('#cad6dd',.46);fill.position.set(160,150,-200);scene.add(fill);
 const day=new THREE.Color(cfg.lighting.dayBackground),night=new THREE.Color(cfg.lighting.nightBackground),dayFloor=new THREE.Color('#ccd7d7'),nightFloor=new THREE.Color('#192b39');let nightAmount=state.night?1:0;
 // Gradient sky dome: a flat background colour reads like a massing model;
 // a vertical sky gradient plus the environment probe gives the metal and
 // glazing something believable to reflect.
 const skyGeo=new THREE.SphereGeometry(4200,32,16);
 const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color('#6fa6c8')},mid:{value:new THREE.Color('#c6d9e0')},bot:{value:new THREE.Color('#e9eff0')},n:{value:0}},vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`uniform vec3 top;uniform vec3 mid;uniform vec3 bot;uniform float n;varying vec3 vDir;float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=h21(i),b=h21(i+vec2(1.,0.)),c=h21(i+vec2(0.,1.)),d=h21(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*vnoise(p);p*=2.03;a*=.5;}return v;}void main(){float h=clamp(vDir.y,0.0,1.0);vec3 c=h<0.35?mix(bot,mid,h/0.35):mix(mid,top,pow((h-0.35)/0.65,0.8));vec2 uv=vec2(atan(vDir.z,vDir.x)*1.6,asin(clamp(vDir.y,-1.,1.))*2.4);float cl=fbm(uv*1.7+vec2(n*0.3,0.0));float cover=smoothstep(0.55,0.82,cl)*smoothstep(0.02,0.22,vDir.y);vec3 cloud=mix(vec3(0.72,0.76,0.78),vec3(1.0,0.99,0.97),1.0-n);c=mix(c,cloud,cover*0.55);gl_FragColor=vec4(c,1.0);}`});
 const sky=new THREE.Mesh(skyGeo,skyMat);sky.name='sky_dome';sky.frustumCulled=false;scene.add(sky);
 const {random,rr}=createRandom(cfg.seed^0x7f4a7c15);let rain=null;
 if(cfg.weather.preset==='rain'){
  const positions=new Float32Array(cfg.weather.rainCount*3);for(let i=0;i<positions.length;i+=3){positions[i]=rr(-cfg.terrain.width/2,cfg.terrain.width/2);positions[i+1]=rr(1,24);positions[i+2]=rr(-cfg.terrain.depth/2,cfg.terrain.depth/2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));rain=new THREE.Points(g,new THREE.PointsMaterial({color:'#b8d0dd',size:.06,transparent:true,opacity:.55,depthWrite:false}));scene.add(rain);
 }
 const distance=ctx.camera.position.distanceTo(ctx.controls.target),mist=cfg.weather.preset!=='clear';scene.fog.near=distance+(mist?120:450);scene.fog.far=distance+(mist?900:2200);
 function update(dt){
  const target=state.night?1:0;nightAmount=THREE.MathUtils.lerp(nightAmount,target,1-Math.exp(-dt*2.2));if(Math.abs(nightAmount-target)<.002)nightAmount=target;const n=nightAmount;
  scene.background.copy(day).lerp(night,n);scene.fog.color.copy(scene.background);skyMat.uniforms.n.value=n;skyMat.uniforms.top.value.set('#6fa6c8').lerp(new THREE.Color('#1b3247'),n);skyMat.uniforms.mid.value.set('#c6d9e0').lerp(new THREE.Color('#152738'),n);skyMat.uniforms.bot.value.set('#e9eef0').lerp(new THREE.Color('#0d1b26'),n);hemi.intensity=.78*(1-n)+.34*n;key.intensity=2.35*(1-n)+.30*n;scene.environmentIntensity=.55*(1-n)+.22*n;key.color.set('#fff2d6').lerp(new THREE.Color('#abc9ef'),n);fill.intensity=.10+.24*(1-n);if(state.matchday){hemi.intensity+=.11*n;key.intensity+=.18*n;fill.intensity+=.08*n;scene.environmentIntensity+=.08*n;}
  for(const m of emissives)m.emissiveIntensity=m.userData.nightEmission*n;
  for(const[i,m]of[M.warm,M.warmDim].entries()){m.color.copy(M.windowDark.color).lerp(windowNightColors[i],n);m.emissiveIntensity=m.userData.nightEmission*n;}
  streetLampBulb.color.copy(streetLampDayColor).lerp(streetLampNightColor,n);streetLampBulb.emissiveIntensity=2.6*n;
  for(const{l,power}of nightLights)l.intensity=power*n*.24;ctx.signage.glowMat.opacity=.18*n;ctx.bloom.strength=(ctx.economy?.14:cfg.lighting.bloom)*n;ctx.bloom.enabled=cfg.lighting.bloom>0&&!ctx.state.performanceMode&&!ctx.economy&&n>0.04;if(ctx.floor)ctx.floor.material.color.copy(dayFloor).lerp(nightFloor,n);
  if(rain&&!state.paused){const a=rain.geometry.attributes.position;for(let i=0;i<a.count;i++){let x=a.getX(i)+dt*cfg.weather.wind,y=a.getY(i)-dt*9;if(y<.8){y=24;x=rr(-cfg.terrain.width/2,cfg.terrain.width/2);}if(x>cfg.terrain.width/2)x=-cfg.terrain.width/2;a.setXYZ(i,x,y,a.getZ(i));}a.needsUpdate=true;}
 }
 update(10);
 return {update,diagnostics:()=>({nightAmount,windowColor:M.warm.color.getHexString(),unlitColor:M.windowDark.color.getHexString(),windowEmission:M.warm.emissiveIntensity,bulbColor:streetLampBulb.color.getHexString(),bulbEmission:streetLampBulb.emissiveIntensity,weather:cfg.weather.preset,rainPoints:rain?cfg.weather.rainCount:0})};
}
