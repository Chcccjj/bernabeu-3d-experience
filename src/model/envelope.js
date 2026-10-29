import * as THREE from 'three';
import {TAU,outline,normalAt,geometry,band,annulus,box,boxGeometry,instances,perimeter,beams,textTexture,canvasTexture} from './geometry.js';

export const facadeHeight = (t,f=1) => (2.1*Math.sin(t+.5)+1.45*Math.sin(2*t-1)+.7*Math.cos(3*t)) * f;
export function facadePoint(t,f) {
  const swell=Math.sin(f*Math.PI)*3.5;
  const p=outline(115+3.2*f+swell,99+4.6*f+swell,t,3.8);
  p.x+=1.8*Math.sin(t*2)*f;return p;
}
export function createEnvelope(m) {
  const group=new THREE.Group();group.name='Sculpted stainless steel lamella envelope';
  group.add(annulus(118,102,63,43,.35,m.concrete));
  group.add(band(114.6,98.5,1,12.1,m.glass));
  const shell=band(116.1,100,11,59.5,m.dark,3.8);group.add(shell);
  // Individual curved four-sided blades are batched into one closed geometry.
  const pos=[],idx=[],uv=[],colors=[],farPos=[],farIdx=[],silver=new THREE.Color(),segments=384,levels=48;
  for(let j=0;j<levels;j++) {
    const f=j/(levels-1),start=pos.length/3;
    for(let i=0;i<=segments;i++){
      const t=i/segments*TAU,p=facadePoint(t,f),n=normalAt(118,103,t),y=10.6+j*1.035+facadeHeight(t,f);
      const profile=[[0,0],[.9,.02],[1.6,.25],[1.6,.49],[.05,.67],[0,.58]];
      profile.forEach(([d,h],k)=>{
        pos.push(p.x+n.x*d,y+h,p.z+n.z*d);uv.push(i/segments*18,j/levels);
        silver.setRGB(.71+(j%4)*.014,.74+(j%4)*.014,.77+(j%4)*.014).multiplyScalar([.32,.48,.49,.7,1,.43][k]);colors.push(silver.r,silver.g,silver.b);
      });
      if(i<segments) for(let k=0;k<6;k++){const a=start+i*6+k,b=start+i*6+(k+1)%6;idx.push(a,b,a+6,b,b+6,a+6);}
    }
  }
  const louverMat=new THREE.MeshPhysicalMaterial({color:0xe3e6e8,metalness:.91,roughness:.55,roughnessMap:m.silver.roughnessMap,vertexColors:true,anisotropy:.22,anisotropyRotation:0,envMapIntensity:.85});
  const indexed=geometry(pos,idx,uv,colors),flat=indexed.toNonIndexed();flat.computeVertexNormals();indexed.dispose();
  const louvers=new THREE.Mesh(flat,louverMat);louvers.name='48 sculpted lamella courses';louvers.castShadow=true;louvers.receiveShadow=false;
  // A filtered optical representation integrates subpixel gaps at drone distances.
  // The close LOD retains all closed, beveled, three-dimensional blades.
  const farUV=[];
  for(let j=0;j<=48;j++)for(let i=0;i<=segments;i++){
    const f=j/48,t=i/segments*TAU,p=facadePoint(t,f),n=normalAt(118,103,t);
    farPos.push(p.x+n.x*1.35,10.6+49.315*f+facadeHeight(t,f),p.z+n.z*1.35);farUV.push(i/segments,f);
    if(j<48&&i<segments){const a=j*(segments+1)+i,b=a+segments+1;farIdx.push(a,b,a+1,b,b+1,a+1);}
  }
  const filteredBlades=canvasTexture(8,64,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#89949d');g.addColorStop(.18,'#b8c0c6');g.addColorStop(.80,'#ccd1d5');g.addColorStop(1,'#98a4ae');c.fillStyle=g;c.fillRect(0,0,w,h);});
  filteredBlades.wrapT=THREE.RepeatWrapping;filteredBlades.repeat.y=48;
  const integratedNormal=canvasTexture(4,4,(c,w,h)=>{c.fillStyle='rgb(128,212,226)';c.fillRect(0,0,w,h);},THREE.NoColorSpace);
  const farMaterial=m.silver.clone();farMaterial.color.set(0xffffff);farMaterial.map=filteredBlades;farMaterial.normalMap=integratedNormal;farMaterial.roughness=.52;farMaterial.roughnessMap=null;
  const distantLouvers=new THREE.Mesh(geometry(farPos,farIdx,farUV),farMaterial);distantLouvers.castShadow=true;
  const facadeLOD=new THREE.LOD();facadeLOD.addLevel(louvers,0);facadeLOD.addLevel(distantLouvers,310);group.add(facadeLOD);
  const columns=[],doors=[],handles=[],seams=[];
  perimeter(115.5,99.6,148).forEach(({p,t},i)=>{
    const n=normalAt(115,99,t),rot=Math.atan2(n.x,n.z);
    columns.push({p:[p.x,5.2,p.z],s:[.42,9.6,.48],r:[0,rot,0]});
    if(i%2===0){
      doors.push({p:[p.x+n.x*.18,2.2,p.z+n.z*.18],s:[3.8,4.1,.12],r:[0,rot,0]});
      handles.push({p:[p.x+n.x*.33,2,p.z+n.z*.33],s:[.07,.8,.12],r:[0,rot,0]});
    }
  });
  instances(group,boxGeometry,m.steel,columns);instances(group,boxGeometry,m.glass,doors);instances(group,boxGeometry,m.silver,handles);
  // Fine panel joints follow the varying skin geometry instead of forming a cage.
  for(let i=0;i<112;i++){
    const t=i/112*TAU;
    for(let j=0;j<47;j++){
      const f=j/47,p=facadePoint(t,f),q=facadePoint(t,(j+1)/47),n=normalAt(118,103,t);
      seams.push([[p.x+n.x*1.62,10.6+j*1.035+facadeHeight(t,f)+.48,p.z+n.z*1.62],[q.x+n.x*1.62,10.6+(j+1)*1.035+facadeHeight(t,(j+1)/47)+.48,q.z+n.z*1.62]]);
    }
  }
  const jointGeo=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(seams.flat(2),3));
  const joints=new THREE.LineSegments(jointGeo,new THREE.LineBasicMaterial({color:0x49535c,transparent:true,opacity:.24,depthWrite:false}));
  const jointLOD=new THREE.LOD();jointLOD.addLevel(joints,0);jointLOD.addLevel(new THREE.Group(),320);group.add(jointLOD);
  // The recessed Castellana entrance and its projecting canopy anchor the facade.
  box(group,m.dark,-10,4.7,99.3,78,9.3,1.1);
  box(group,m.silver,-10,9.6,103,88,.8,9);
  const signage=new THREE.Mesh(new THREE.PlaneGeometry(60,6.7),new THREE.MeshStandardMaterial({map:textTexture('SANTIAGO BERNABÉU',{font:'500 65px Arial',spacing:6}),transparent:true,roughness:.45,metalness:.45,emissive:0xffffff,emissiveIntensity:.1,side:THREE.DoubleSide,depthWrite:false}));
  signage.position.set(-10,6,107.6);group.add(signage);
  const gateLabels=[];
  for(let i=0;i<8;i++){
    const t=(i/8)*TAU+Math.PI/8,p=outline(116.1,100.4,t),n=normalAt(116,100,t);
    const label=new THREE.Mesh(new THREE.PlaneGeometry(3.6,2),new THREE.MeshBasicMaterial({map:textTexture(String(i*7+1).padStart(2,'0'),{w:128,h:64,font:'500 42px Arial',background:'#222d34'}),side:THREE.DoubleSide}));label.position.set(p.x+n.x*.2,6,p.z+n.z*.2);label.rotation.y=Math.atan2(n.x,n.z);group.add(label);gateLabels.push(label);
  }
  const stripMat=new THREE.MeshBasicMaterial({color:0xf4ddac,toneMapped:false});
  const lightRing=band(115.2,99.4,9.1,9.23,stripMat);group.add(lightRing);
  return {group,louvers,facadeLOD,lightRing,signage,louverCount:levels};
}
