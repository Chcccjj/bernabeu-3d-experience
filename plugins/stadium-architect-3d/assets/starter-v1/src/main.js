import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

// Generic scaffold only. Customize footprint, roof, facade, seating, and iconic features
// to the target stadium before presenting it as a stadium-specific V1.
const app = document.querySelector('#app');
app.innerHTML = `
  <section class="header" aria-label="球场信息">
    <div class="kicker">STADIUMARCHITECT · V1 STARTER</div>
    <h1>Stadium Preview</h1>
    <p class="hint">通用几何底座 · 尚未针对真实球场进行还原</p>
    <div class="status"><span id="mode">DAY</span> · <span id="camera-mode">EXTERIOR</span> · <span id="scene-state">loading</span></div>
  </section>
  <div class="footnote">FPS <span id="fps">--</span> · H 隐藏控制台</div>
  <nav class="dock" aria-label="3D球场控制台">
    <button type="button" data-view="exterior">外部全景</button>
    <button type="button" data-view="pitch">球场内</button>
    <button type="button" data-view="stand">看台视角</button>
    <button type="button" data-view="reset">重置</button>
    <button type="button" data-mode="day">白天</button>
    <button type="button" data-mode="night">夜间</button>
  </nav>`;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#90b8d4');
scene.fog = new THREE.Fog('#90b8d4', 260, 620);
const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 950);
const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.prepend(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.055;
orbit.minDistance = 8;
orbit.maxDistance = 400;
orbit.maxPolarAngle = Math.PI * .495;
const presets = {
  exterior:{pos:[184,116,153],target:[0,22,0]},
  pitch:{pos:[0,1.75,3],target:[0,24,62]},
  stand:{pos:[-69,25,44],target:[0,4,0]}
};
const destPos = new THREE.Vector3();
const destTarget = new THREE.Vector3();
let traveling = false;
function moveTo(name, animate=true){
  const p = presets[name] || presets.exterior;
  destPos.fromArray(p.pos);destTarget.fromArray(p.target);
  if(!animate){ camera.position.copy(destPos);orbit.target.copy(destTarget);orbit.update(); }
  traveling = animate;
  document.querySelector('#camera-mode').textContent = name.toUpperCase();
}
moveTo('exterior',false);
orbit.addEventListener('start',()=>{ traveling=false; });

const hemi = new THREE.HemisphereLight(0xb9dfff,0x4b5d57,2.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4db,3.4);
sun.position.set(-125,175,80);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left = -150;sun.shadow.camera.right = 150;
sun.shadow.camera.top = 150;sun.shadow.camera.bottom = -150;
sun.shadow.camera.near = 1;sun.shadow.camera.far = 450;
sun.shadow.bias = -.0002;
scene.add(sun);

const mat=(color,metalness=.05,roughness=.7)=>new THREE.MeshStandardMaterial({color,metalness,roughness,side:THREE.DoubleSide});
const baseMat=mat('#a7b4bd',.28,.72);
const concrete=mat('#708498',.07,.88);
const bowlMat=mat('#344b62',.26,.67);
const rimMat=mat('#becbd3',.65,.28);
const pitchMat=mat('#1b8c4d',.02,.9);
const lightMat=new THREE.MeshStandardMaterial({color:0xf2f8ff,emissive:'#b2dbff',emissiveIntensity:.15,roughness:.2});

const ground=new THREE.Mesh(new THREE.PlaneGeometry(950,950),mat('#526d67'));
ground.rotation.x=-Math.PI/2;ground.position.y=-.65;ground.receiveShadow=true;scene.add(ground);
const plinth=new THREE.Mesh(new THREE.BoxGeometry(235,2.2,185),baseMat);
plinth.position.y=-.75;plinth.receiveShadow=true;scene.add(plinth);

// Superellipse used for this neutral starter; real stadium adapters may use custom splines.
function point(rx,rz,ang,n=3.7){
  const c=Math.cos(ang),s=Math.sin(ang),p=2/n;
  return [rx*Math.sign(c)*Math.abs(c)**p,rz*Math.sign(s)*Math.abs(s)**p];
}
function annulus(innerX,innerZ,outerX,outerZ,yInner,yOuter,material,segments=240){
  const positions=[],indices=[];
  for(let j=0;j<=segments;j++){
    const a=(j/segments)*Math.PI*2;
    const p0=point(innerX,innerZ,a),p1=point(outerX,outerZ,a);
    positions.push(p0[0],yInner,p0[1],p1[0],yOuter,p1[1]);
    if(j<segments){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
annulus(61,42,81,61,2.5,20,bowlMat);
annulus(82,62,98,77,24,45,concrete);
annulus(76,54,108,84,51,55,rimMat);
annulus(100,79,108,85,47,56,baseMat);

// Tiered seats: InstancedMesh avoids thousands of independent draw calls.
function seats(tier,rows,columns){
  const seatGeometry=new THREE.BoxGeometry(.64,.22,.52);
  const seatMaterial=mat('#c5d7e9',.07,.75);
  const mesh=new THREE.InstancedMesh(seatGeometry,seatMaterial,rows*columns);
  const dummy=new THREE.Object3D(); const color=new THREE.Color();let idx=0;
  for(let row=0;row<rows;row++){
    const u=(row+.5)/rows;
    const rx=tier.ix+(tier.ox-tier.ix)*u;
    const rz=tier.iz+(tier.oz-tier.iz)*u;
    const y=tier.iy+(tier.oy-tier.iy)*u+.28;
    for(let col=0;col<columns;col++){
      const a=(col+.5)/columns*Math.PI*2;
      const [x,z]=point(rx,rz,a);
      dummy.position.set(x,y,z);
      dummy.rotation.set(0,-a,0);
      dummy.updateMatrix();mesh.setMatrixAt(idx,dummy.matrix);
      color.setHSL(.59+(col%7)*.004,.30,.51+((row+col)%6)*.035);
      mesh.setColorAt(idx,color);idx++;
    }
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.computeBoundingSphere();scene.add(mesh);
}
seats({ix:62,iz:43,ox:79,oz:59,iy:3,oy:19},21,230);
seats({ix:83,iz:63,ox:97,oz:75,iy:25,oy:44},21,260);

const slatGeometry=new THREE.BoxGeometry(1.9,39,2.2);
const slats=new THREE.InstancedMesh(slatGeometry,rimMat,120);
const dummy=new THREE.Object3D();
for(let i=0;i<120;i++){
  const a=(i/120)*Math.PI*2;
  const [x,z]=point(107,84,a);
  dummy.position.set(x,23.5,z);dummy.rotation.set(0,-a,0);
  dummy.updateMatrix();slats.setMatrixAt(i,dummy.matrix);
}
slats.instanceMatrix.needsUpdate=true;slats.computeBoundingSphere();scene.add(slats);

const field=new THREE.Mesh(new THREE.PlaneGeometry(105,68),pitchMat);
field.rotation.x=-Math.PI/2;field.position.y=.03;field.receiveShadow=true;scene.add(field);
// Alternating procedural mowing bands, entirely generated in code.
for(let i=0;i<10;i++){
  if(i%2===0)continue;
  const strip=new THREE.Mesh(new THREE.PlaneGeometry(10.5,68),mat('#167f43'));
  strip.rotation.x=-Math.PI/2;strip.position.set(-47.25+i*10.5,.046,0);scene.add(strip);
}
function fieldLine(x,z,w,d){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));
  m.rotation.x=-Math.PI/2;m.position.set(x,.075,z);scene.add(m);
}
fieldLine(0,-34,105,.12);fieldLine(0,34,105,.12);fieldLine(-52.5,0,.12,68);fieldLine(52.5,0,.12,68);fieldLine(0,0,.12,68);
function openRect(xcenter,width,depth,goalSide){
  const xOuter=goalSide*52.5,xInner=goalSide*(52.5-depth);
  fieldLine(xInner,0,.12,width);fieldLine((xOuter+xInner)/2,-width/2,depth,.12);fieldLine((xOuter+xInner)/2,width/2,depth,.12);
}
for(const side of [-1,1]){openRect(0,40.32,16.5,side);openRect(0,18.32,5.5,side);}
const circlePoints=[];for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;circlePoints.push(new THREE.Vector3(Math.cos(a)*9.15,.095,Math.sin(a)*9.15));}
scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circlePoints),new THREE.LineBasicMaterial({color:0xffffff})));
function goal(side){
 const material=mat('#e8f5ff',.05,.25);const x=side*52.5;
 for(const z of [-3.66,3.66]){
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,2.44,8),material);
  post.position.set(x,1.22,z);scene.add(post);
 }
 const cross=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,7.32,8),material);
 cross.rotation.x=Math.PI/2;cross.position.set(x,2.44,0);scene.add(cross);
}
goal(-1);goal(1);
for(const x of [-52.5,52.5])for(const z of [-34,34]){
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,1.6,6),mat('#ffffff'));
 pole.position.set(x,.8,z);scene.add(pole);
}
const emissiveStrips=[];
for(let k=0;k<14;k++){
 const a=(k/14)*Math.PI*2,[x,z]=point(86,65,a);
 const fixture=new THREE.Mesh(new THREE.BoxGeometry(6,.24,1.5),lightMat);
 fixture.position.set(x,50.8,z);fixture.rotation.y=-a;scene.add(fixture);emissiveStrips.push(fixture);
}
let mode='day';
function setMode(next){
 mode=next;
 const night=next==='night';
 scene.background.set(night?'#060f21':'#90b8d4');scene.fog.color.copy(scene.background);
 sun.intensity=night?.24:3.4;hemi.intensity=night?.45:2.25;
 renderer.toneMappingExposure=night?1.34:1.12;
 lightMat.emissiveIntensity=night?5:.15;
 document.querySelector('#mode').textContent=night?'NIGHT':'DAY';
}
app.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>moveTo(btn.dataset.view==='reset'?'exterior':btn.dataset.view)));
app.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))app.classList.toggle('hidden-ui')});
function resize(){camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);}
window.addEventListener('resize',resize);
document.querySelector('#scene-state').textContent='ready';
let frames=0,measureAt=performance.now();
const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);
 const delta=clock.getDelta();
 if(traveling){
  const factor=1-Math.exp(-delta*3.9);
  camera.position.lerp(destPos,factor);orbit.target.lerp(destTarget,factor);
  if(camera.position.distanceToSquared(destPos)<.012 && orbit.target.distanceToSquared(destTarget)<.012) traveling=false;
 }
 orbit.update();renderer.render(scene,camera);frames++;
 const now=performance.now();if(now-measureAt>=850){document.querySelector('#fps').textContent=String(Math.round(frames*1000/(now-measureAt)));measureAt=now;frames=0;}
}
animate();
