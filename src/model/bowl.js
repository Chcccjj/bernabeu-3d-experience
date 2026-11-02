import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {TAU,outline,normalAt,geometry,perimeter,annulus,band,instances,boxGeometry,beams,random} from './geometry.js';
import {openTunnel} from './details.js';

export function createBowl(m) {
  const group=new THREE.Group();group.name='Four-level seating bowl and hospitality';const r=random(80);
  const tiers=[{rows:22,a:64.3,b:43.4,y:2.5,run:.8,rise:.65},{rows:20,a:83,b:62,y:19.3,run:.78,rise:.78},{rows:22,a:100.5,b:79.5,y:38,run:.70,rise:.75}];
  const steps=[],risers=[],seats=[],stairs=[],rails=[],posts=[],seatRecords=[],rowSeats=[];
  const mask=document.createElement('canvas');mask.width=1200;mask.height=160;const ctx=mask.getContext('2d');ctx.fillStyle='#fff';ctx.font='900 143px Arial';ctx.textAlign='center';ctx.fillText('REAL MADRID',600,133,1180);const pixels=ctx.getImageData(0,0,1200,160).data;
  tiers.forEach((tier,ti)=>{
    for(let row=0;row<tier.rows;row++){
      const a=tier.a+row*tier.run,b=tier.b+row*tier.run,y=tier.y+row*tier.rise,n=3.0;
      const globalRow=rowSeats.length;rowSeats.push([]);
      steps.push(openTunnel(annulus(a+.82,b+.82,a,b,y,m.bowl,{n}).geometry));
      risers.push(openTunnel(band(a,b,y-tier.rise,y,m.bowl,n,256,true).geometry));
      const approx=TAU*Math.sqrt((a*a+b*b)/2)*1.06,count=Math.round(approx/.57/36)*36;
      const rowPoints=perimeter(a+.32,b+.32,count,n);
      rowPoints.forEach(({p,t},i)=>{
        if(p.x<-60&&p.x>-86&&Math.abs(p.z)<4.7&&y<5.4)return;
        const outward=normalAt(a,b,t,n),rotation=Math.atan2(outward.x,outward.z);
        if(i%(count/36)<3){
          if(i%(count/36)===1)stairs.push({p:[p.x,y+.025,p.z],r:[0,rotation,0],s:[1.45,.045,.74]});
          return;
        }
        let color=new THREE.Color().setHSL(.60+r()*.014,.66+r()*.08,.27+r()*.065);
        if(ti===1&&row>=4&&row<17&&Math.abs(p.z)>b*.92&&Math.abs(p.x)<71){
          const mx=Math.floor((p.z>0?-p.x:p.x)/142*1200+600),my=Math.floor((16-row)/12*159);
          if(pixels[(my*1200+mx)*4+3]>100)color=new THREE.Color(0xe6e9e4);
        }
        const item={p:[p.x,y+.2,p.z],r:[0,rotation,0],s:[1,1,1],color};
        const id=seats.length;seats.push(item);rowSeats[globalRow].push(id);
        seatRecords.push({p:item.p,rot:rotation,row:globalRow+1,number:rowSeats[globalRow].length,tier:ti+1});
      });
    }
    const a=tier.a+tier.rows*tier.run,b=tier.b+tier.rows*tier.run,y=tier.y+(tier.rows-1)*tier.rise;
    group.add(annulus(a+1.4,b+1.4,a-.2,b-.2,y-.15,m.concrete,{n:3}));
    group.add(band(a-.3,b-.3,y+.1,y+1.4,m.glass,3,256,true));
    const pts=perimeter(a-.32,b-.32,180,3);
    pts.forEach(({p},i)=>{const q=pts[(i+1)%pts.length].p;rails.push([[p.x,y+1.45,p.z],[q.x,y+1.45,q.z]]);if(i%2===0)posts.push([[p.x,y,p.z],[p.x,y+1.45,p.z]]);});
  });
  const treadMesh=new THREE.Mesh(mergeGeometries(steps),m.bowl);treadMesh.receiveShadow=true;group.add(treadMesh);
  const riserMesh=new THREE.Mesh(mergeGeometries(risers),m.bowl);riserMesh.receiveShadow=true;group.add(riserMesh);steps.forEach(g=>g.dispose());risers.forEach(g=>g.dispose());
  instances(group,boxGeometry,m.lightConcrete,stairs);beams(group,rails,m.steel,.045);beams(group,posts,m.steel,.035);
  // Detail seats have an actual pan and tilted back. A reduced mesh is used outside.
  const pan=new THREE.BoxGeometry(.47,.075,.42).translate(0,.12,0),back=new THREE.BoxGeometry(.47,.42,.075).rotateX(-.1).translate(0,.36,.215);
  const detailed=mergeGeometries([pan,back]);pan.dispose();back.dispose();
  const simple=geometry([-.235,.12,-.21,.235,.12,-.21,.235,.12,.22,-.235,.12,.22,-.235,.55,.23,.235,.55,.23],[0,2,1,0,3,2,3,4,5,3,5,2]);
  const near=new THREE.Group(),far=new THREE.Group();const seatMat=m.seat.clone();
  const nearSeats=instances(near,detailed,seatMat,seats,{colors:true}),farSeats=instances(far,simple,seatMat,seats,{colors:true});
  const seatLOD=new THREE.LOD();seatLOD.addLevel(near,0);seatLOD.addLevel(far,260);group.add(seatLOD);
  for(const [a,b,y] of [[82,61,16.9],[99.5,78.5,35.4]]){
    group.add(annulus(a+2,b+2,a-1,b-1,y-.3,m.concrete,{n:3}));
    group.add(band(a,b,y,y+2,m.glass,3,256,true));
    group.add(annulus(a+.8,b+.8,a-.4,b-.4,y+2.1,m.steel,{n:3}));
    const mullions=perimeter(a-.07,b-.07,220,3).map(({p})=>({p:[p.x,y+1,p.z],s:[.07,2,.08],r:[0,Math.atan2(p.x,p.z),0]}));instances(group,boxGeometry,m.steel,mullions);
  }
  // Radial supporting frames can be read through the undercroft glazing.
  const structure=[];
  perimeter(112,91,72,3).forEach(({p})=>{
    const q=p.clone().multiplyScalar(.72);structure.push([[p.x,1,p.z],[p.x,53,p.z]],[[q.x,1,q.z],[p.x,48,p.z]]);
  });beams(group,structure,m.concrete,.6,4);
  const crowd=new THREE.Group();crowd.name='Instanced match-day spectators';
  const shirts=[],heads=[];
  seatRecords.forEach((s,i)=>{
    if(r()>.83)return;
    const [x,y,z]=s.p,front=new THREE.Vector3(-Math.sin(s.rot),0,-Math.cos(s.rot));
    shirts.push({p:[x+front.x*.07,y+.52,z+front.z*.07],s:[.38,.5,.26],r:[0,s.rot,0],color:i%6<4?0xdbddd9:i%6===4?0x2c5ea1:0x899ab0});
    heads.push({p:[x+front.x*.08,y+.87,z+front.z*.08],s:[.13,.16,.13],color:[0xb88362,0xd3a483,0x76533f,0xb99674][i%4]});
  });
  const crowdTime={value:0},animatedMaterials=[];
  const animateMaterial=(mat)=>{mat.onBeforeCompile=shader=>{
    shader.uniforms.crowdTime=crowdTime;
    shader.vertexShader='uniform float crowdTime;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat phase=instanceMatrix[3].x*.17+instanceMatrix[3].z*.21; transformed.y+=sin(crowdTime*1.3+phase)*.075;\n#endif');
  };mat.customProgramCacheKey=()=> 'subtle-crowd-v1';animatedMaterials.push(mat);return mat;};
  const bodyGeo=new THREE.CylinderGeometry(.42,.5,1,6),headGeo=new THREE.IcosahedronGeometry(1,0);
  const distantGeo=new THREE.PlaneGeometry(.4,.78).translate(0,.15,0);
  for(let sector=0;sector<8;sector++){
    const indexes=[];shirts.forEach((s,i)=>{if(Math.floor((Math.atan2(s.p[0],s.p[2])+Math.PI)/(TAU/8))%8===sector)indexes.push(i);});
    const nearCrowd=new THREE.Group(),farCrowd=new THREE.Group(),lod=new THREE.LOD();
    const angle=(sector+.5)/8*TAU-Math.PI,center=outline(90,69,Math.PI/2-angle,3);
    lod.position.set(center.x,25,center.z);
    const local=(s)=>({...s,p:[s.p[0]-center.x,s.p[1]-25,s.p[2]-center.z]});
    const bodyMat=animateMaterial(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.97}));
    instances(nearCrowd,bodyGeo,bodyMat,indexes.map(i=>local(shirts[i])),{colors:true});
    instances(nearCrowd,headGeo,animateMaterial(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.98})),indexes.map(i=>local(heads[i])),{colors:true});
    const simplePeople=indexes.map(i=>({...local(shirts[i]),s:[1,1,1]}));
    instances(farCrowd,distantGeo,animateMaterial(new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide})),simplePeople,{colors:true});
    lod.addLevel(nearCrowd,0);lod.addLevel(farCrowd,95);crowd.add(lod);
  }
  group.add(crowd);crowd.visible=false;
  return {group,crowd,crowdTime,seatCount:seats.length,nearSeats,farSeats,seatLOD,tiers,seatRecords,rowSeats};
}
