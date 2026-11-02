import * as THREE from 'three';
import {box,beams,canvasTexture,random,geometry,band,textTexture} from './geometry.js';
import {openTunnel} from './details.js';

export const TRAY_COUNT=6;
export const TRAY_WIDTH=68/TRAY_COUNT;
export const STORAGE_Z=-40.2;
export const trayTextureOffset=(index)=>(TRAY_COUNT-1-index)/TRAY_COUNT;
// One tray clears and lowers before the next enters its translation corridor.
export function trayPose(index, progress) {
  const phase=THREE.MathUtils.clamp(progress*TRAY_COUNT-index,0,1);
  const smooth=(a)=>{a=THREE.MathUtils.clamp(a,0,1);return a*a*(3-2*a);};
  const initial=-34+TRAY_WIDTH*(index+.5),slide=smooth(phase/.58),lower=smooth((phase-.61)/.39);
  return {z:THREE.MathUtils.lerp(initial,STORAGE_Z,slide),y:1.08-lower*(5.5+(5-index)*2.15),phase};
}
export function createPitch(m,renderer) {
  const group=new THREE.Group();group.name='Six-tray retractable natural turf';
  const apronMat=new THREE.MeshStandardMaterial({color:0x294535,roughness:.95});
  const concrete=box(group,apronMat,0,-.02,0,112,.3,80);concrete.receiveShadow=true;
  for(const x of [-57.5,57.5])box(group,apronMat,x,.59,0,10,.92,82);
  box(group,apronMat,0,.59,38.2,105,.92,8.4);
  const floorTex=canvasTexture(1024,512,(c,w,h)=>{c.fillStyle='#aaa99e';c.fillRect(0,0,w,h);c.strokeStyle='#92958c';c.lineWidth=1;for(let x=0;x<w;x+=64){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=64){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}});
  const eventFloor=new THREE.Mesh(new THREE.PlaneGeometry(105,68),new THREE.MeshStandardMaterial({map:floorTex,roughness:.92}));eventFloor.rotation.x=-Math.PI/2;eventFloor.position.y=.15;group.add(eventFloor);
  box(group,m.dark,0,.2,STORAGE_Z,108,.07,11.5);
  const hatch=new THREE.Group();hatch.position.set(0,1.04,STORAGE_Z-5.75);box(hatch,apronMat,0,-.065,5.75,108,.13,11.5);group.add(hatch);
  const rails=[];for(const x of [-48,-32,-16,0,16,32,48])rails.push([[x,.3,-45.9],[x,.3,35]]);beams(group,rails,m.silverDark,.055,4);
  const grassTex=canvasTexture(2100,1360,(c,w,h)=>{
    const rand=random(7);c.fillStyle='#3e7132';c.fillRect(0,0,w,h);
    for(let i=0;i<20;i++){c.fillStyle=i%2===0?'#487e36':'#3c6d2e';c.fillRect(i*w/20,0,w/20,h);}
    for(let i=0;i<270000;i++){const x=rand()*w,y=rand()*h;c.fillStyle=rand()>.52?'rgba(190,195,119,.12)':'rgba(9,38,15,.13)';c.fillRect(x,y,1,2+rand()*3);}
    const sx=w/105,sy=h/68;c.strokeStyle='#eeeee0';c.lineWidth=2.5;c.strokeRect(2,2,w-4,h-4);
    c.beginPath();c.moveTo(w/2,1);c.lineTo(w/2,h-1);c.stroke();
    c.beginPath();c.ellipse(w/2,h/2,9.15*sx,9.15*sy,0,0,Math.PI*2);c.stroke();
    c.fillStyle='#eeeee0';c.beginPath();c.arc(w/2,h/2,3,0,Math.PI*2);c.fill();
    for(const side of [-1,1]){
      const x=side===-1?2:w-2,dir=-side;
      c.strokeRect(side===-1?x:x-16.5*sx,(34-20.16)*sy,16.5*sx,40.32*sy);
      c.strokeRect(side===-1?x:x-5.5*sx,(34-9.16)*sy,5.5*sx,18.32*sy);
      c.beginPath();c.arc(x+dir*11*sx,h/2,3,0,Math.PI*2);c.fill();
      c.beginPath();c.ellipse(x+dir*11*sx,h/2,9.15*sx,9.15*sy,0,side===-1?-.925:Math.PI-.925,side===-1?.925:Math.PI+.925);c.stroke();
    }
    for(const x of [2,w-2])for(const y of [2,h-2]){c.beginPath();c.ellipse(x,y,sx,sy,0,x===2?(y===2?0:-Math.PI/2):(y===2?Math.PI/2:Math.PI),x===2?(y===2?Math.PI/2:0):(y===2?Math.PI:Math.PI*1.5));c.stroke();}
  });grassTex.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());
  const trays=[];
  for(let i=0;i<6;i++){
    const tray=new THREE.Group();tray.name=`Turf tray ${i+1}`;const texture=grassTex.clone();
    texture.repeat.set(1,1/6);texture.offset.y=trayTextureOffset(i);texture.needsUpdate=true;
    const mat=new THREE.MeshStandardMaterial({map:texture,roughness:.98});
    const surface=new THREE.Mesh(new THREE.PlaneGeometry(105,TRAY_WIDTH),mat);surface.rotation.x=-Math.PI/2;surface.receiveShadow=true;tray.add(surface);
    box(tray,m.silverDark,0,-.38,0,105,.65,TRAY_WIDTH-.035);
    const braces=[];for(let x=-51;x<53;x+=7)braces.push([[x,-.7,-5.4],[x+3.5,-.1,5.4]],[[x,-.1,-5.4],[x+3.5,-.7,5.4]]);beams(tray,braces,m.steel,.045,4);
    tray.position.set(0,1.08,-34+TRAY_WIDTH*(i+.5));group.add(tray);trays.push(tray);
  }
  const goals=[];
  for(const side of [-1,1]){
    const goal=new THREE.Group();const white=new THREE.MeshStandardMaterial({color:0xeeeeeb,roughness:.35,metalness:.25});
    const bars=[[[0,0,-3.66],[0,2.44,-3.66]],[[0,0,3.66],[0,2.44,3.66]],[[0,2.44,-3.66],[0,2.44,3.66]],[[0,2.44,-3.66],[side*2.1,2.05,-3.66]],[[0,2.44,3.66],[side*2.1,2.05,3.66]],[[side*2.1,.08,-3.66],[side*2.1,.08,3.66]]];
    beams(goal,bars,white,.057,8);
    const net=[];
    for(let z=-3.66;z<=3.67;z+=.22)net.push([[0,2.4,z],[side*2.1,2.05,z]],[[side*2.1,2.05,z],[side*2.1,.08,z]]);
    for(let y=.1;y<=2.1;y+=.22)net.push([[side*2.1,y,-3.66],[side*2.1,y,3.66]]);
    for(const z of [-3.66,3.66])for(let x=0;x<=2.11;x+=.22)net.push([[side*x,.08,z],[side*x,2.44-x*.18,z]]);
    const netGeo=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(net.flat(2),3));goal.add(new THREE.LineSegments(netGeo,new THREE.LineBasicMaterial({color:0xf2f2ec,transparent:true,opacity:.75})));
    goal.position.set(side*52.5,1.09,0);goal.userData.side=side;group.add(goal);goals.push(goal);
  }
  const flags=[];
  for(const x of [-52.3,52.3])for(const z of [-33.8,33.8]){
    const flag=new THREE.Group();beams(flag,[[[0,0,0],[0,1.5,0]]],m.white,.025,5);
    const cloth=new THREE.Mesh(geometry([0,1.5,0,.48,1.45,0,.42,1.14,0,0,1.18,0],[0,1,2,0,2,3]),new THREE.MeshStandardMaterial({color:0xeae8da,side:THREE.DoubleSide}));flag.add(cloth);flag.position.set(x,1.08,z);flag.userData.x=x;group.add(flag);flags.push(flag);
  }
  const benches=new THREE.Group();
  for(const x of [-14,14]){
    const g=new THREE.Group();box(g,m.dark,0,.45,0,11,.9,1.5);box(g,m.glass,0,2.2,.8,11,.11,2.1,-.02);
    for(let i=0;i<12;i++){box(g,m.blue,-5+i*.9,.95,0,.65,.15,.65);box(g,m.blue,-5+i*.9,1.35,.32,.65,.8,.11);}
    for(const side of [-1,1])box(g,m.glass,side*5.5,1.1,.15,.08,2.2,1.8);g.position.set(x,1.1,38.2);benches.add(g);
  }group.add(benches);
  const boardTex=canvasTexture(2048,128,(c,w,h)=>{c.fillStyle='#142e63';c.fillRect(0,0,w,h);c.fillStyle='#f2f4f6';c.font='500 51px Arial';c.textBaseline='middle';for(let i=0;i<4;i++)c.fillText(i%2?'HALA MADRID':'BERNABÉU',i*512+52,65);});boardTex.wrapS=THREE.RepeatWrapping;boardTex.repeat.x=4;
  const boardMat=new THREE.MeshBasicMaterial({map:boardTex,side:THREE.DoubleSide,toneMapped:false});const led=band(63,42.4,1.2,2.1,boardMat,5,256,true);openTunnel(led.geometry);group.add(led);
  // Explanatory section: the moving trays are the very same meshes used on the pitch.
  const storage=new THREE.Group();storage.name='Simplified underground turf storage section';
  box(storage,m.concrete,0,-18.65,-12,140,.5,118);
  box(storage,m.lightConcrete,0,-8.9,-46.8,112,19,.65);
  box(storage,m.lightConcrete,-55.8,-8.9,STORAGE_Z,.65,19,12.3);
  const rack=[];
  for(const x of [-53,-27,0,27,53])rack.push([[x,-18.4,-46],[x,1,-46]]);
  for(let i=0;i<6;i++){
    const y=trayPose(i,1).y-.85;
    rack.push([[-54,y,-46],[54,y,-46]],[[-54,y,STORAGE_Z+5.2],[54,y,STORAGE_Z+5.2]]);
    for(const x of [-53,53])rack.push([[x,y,-46],[x,y,STORAGE_Z+5.2]]);
    const label=new THREE.Mesh(new THREE.PlaneGeometry(3,1.1),new THREE.MeshBasicMaterial({map:textTexture(String(i+1).padStart(2,'0'),{w:128,h:64,font:'500 48px Arial',background:'#1d3448'}),side:THREE.DoubleSide}));label.position.set(55.3,y+.45,STORAGE_Z+4.8);storage.add(label);
  }
  beams(storage,rack,m.steel,.12,5);storage.visible=false;group.add(storage);
  return {group,trays,goals,flags,hatch,eventFloor,boardTex,grassTex,storage,setCutaway(value){
    group.children.forEach(child=>{child.visible=!value||trays.includes(child)||child===storage;});storage.visible=value;
  },update(progress){
    trays.forEach((tray,i)=>{const p=trayPose(i,progress);tray.position.set(0,p.y,p.z);});
    hatch.rotation.x=Math.PI*.5*THREE.MathUtils.smoothstep(progress,0,.035);
    goals.forEach(g=>g.position.x=g.userData.side*(52.5+9*THREE.MathUtils.smoothstep(progress,0,.04)));
    flags.forEach(f=>f.position.x=f.userData.x+Math.sign(f.userData.x)*5*THREE.MathUtils.smoothstep(progress,0,.04));
  }};
}
