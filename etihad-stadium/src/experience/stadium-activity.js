import * as THREE from 'three';
import {createParkedCars} from '../actors/parked-cars.js';
import {createActors} from '../actors/models.js';
import {createPeopleBatch} from '../actors/people-batch.js';
import {createRandom} from '../core/random.js';
import {createGeometryKit} from '../core/geometry.js';
import {buildArrivalRoute,arrivalDistance,buildCampusLoop} from './arrival-routes.js';
import {towerPositions} from '../../stadium-form.js';
function route(points){const path=new THREE.CurvePath(),p=points.map(([x,z])=>new THREE.Vector3(x,.92,z));let start=p[0];for(let i=1;i<p.length-1;i++){const a=p[i-1],b=p[i],c=p[i+1],r=Math.min(3,a.distanceTo(b)*.35,b.distanceTo(c)*.35),entry=b.clone().addScaledVector(a.clone().sub(b).normalize(),r),exit=b.clone().addScaledVector(c.clone().sub(b).normalize(),r);path.add(new THREE.LineCurve3(start,entry));path.add(new THREE.QuadraticBezierCurve3(entry,b,exit));start=exit;}path.add(new THREE.LineCurve3(start,p.at(-1)));return path;}
export function selectArrivalGates(portals){const towers=towerPositions();const valid=portals.filter(p=>p.z> -85&&towers.every(([x,z])=>Math.hypot(x-p.x,z-p.z)>16));const desired=[[116,-65],[116,0],[116,65],[-116,-65],[-116,0],[-116,65],[-50,130],[0,135],[50,130]],used=new Set();return desired.map(([x,z])=>{const p=valid.filter(q=>!used.has(q.id)).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];if(p)used.add(p.id);return p;}).filter(Boolean);}
export function createStadiumActivity(ctx,layout,simulation){
 const group=new THREE.Group();group.name='Stadium arrivals and daily parking';group.userData.exportExclude=true;layout.layers.site.add(group);const staticGroup=new THREE.Group();group.add(staticGroup);const kit=createGeometryKit(staticGroup,()=>.5,{outlineOpacity:0});const navy=ctx.mat('#294453'),paint=ctx.mat('#d5ded6'),steel=ctx.mat('#7c8a8c'),amber=ctx.mat('#dfbf69');
 for(const name of ['legacy_parked_car_bodies','legacy_parked_car_glass']){const mesh=layout.layers.site.getObjectByName(name);if(mesh)mesh.visible=false;}staticGroup.add(createParkedCars(ctx,layout.parking.bays.filter(b=>b.occupied)));
 const gates=selectArrivalGates(layout.envelope.portals),perGate=ctx.economy?72:144,fanCount=gates.length*perGate,fans=createPeopleBatch(ctx,fanCount,{name:'matchday_arrival_queues',coarse:true}),drivers=createPeopleBatch(ctx,6,{name:'daily_parking_drivers',seed:242});const roamCount=ctx.economy?228:456,roamers=createPeopleBatch(ctx,roamCount,{name:'campus_walkers_and_groups',seed:819,coarse:true});group.add(fans.mesh,drivers.mesh,roamers.mesh);fans.mesh.visible=false;
 const feeds=gates.map(buildArrivalRoute),feedLengths=feeds.map(p=>p.getLength());
 const strolls=[[[146,-118],[157,-114],[157,128],[146,132]], [[-146,-118],[-158,-114],[-158,128],[-146,132]], [[-131,159],[130,159],[129,174],[-130,174]]].map(buildCampusLoop);
 const clusters=[[151,-100],[151,-47],[151,22],[151,103],[-151,-100],[-151,-47],[-151,22],[-151,103],[-108,168],[-60,170],[0,169],[60,170],[108,168]];
 function avoidPosts(p){for(let x=-90;x<=90;x+=4){const dx=p.x-x,dz=p.z-151,d=Math.hypot(dx,dz);if(d<.55){const n=d||.1;p.x+=(dx||.1)/n*(.55-d);p.z+=dz/n*(.55-d);}}for(let i=0;i<32;i++){const a=i/32*Math.PI*2,x=149*Math.cos(a),z=162*Math.sin(a),dx=p.x-x,dz=p.z-z,d=Math.hypot(dx,dz);if(d<.65){p.x+=(dx||.1)/(d||.1)*(.65-d);p.z+=dz/(d||.1)*(.65-d);}}return p;}
 function updateRoamers(){for(let i=0;i<roamCount;i++){let p,t,stride;if(i<roamCount*.72){const path=strolls[i%3],u=((i*.61803398875+clock*.85/path.getLength())%1+1)%1;p=path.getPointAt(u);t=path.getTangentAt(u);stride=.7;}else{const j=i-Math.ceil(roamCount*.72),center=clusters[Math.floor(j/10)%clusters.length],angle=(j%10)*2.399963,r=1.4+((j*7)%5)*.44;p=new THREE.Vector3(center[0]+Math.cos(angle)*r,.825,center[1]+Math.sin(angle)*r);t=new THREE.Vector3(center[0]-p.x,0,center[1]-p.z);stride=.035;}avoidPosts(p);roamers.set(i,p.x,.825,p.z,Math.atan2(t.x,t.z),i%17===0?.86:1,stride,['#75b2d2','#b9c7c7','#244959','#7b8d9a','#d0c4ab','#486f83'][i%6]);}roamers.update(clock);}

 // Queue railings stay inside the existing open apron, following the modeled portals.
 for(const gate of gates){const yaw=Math.atan2(gate.nx,gate.nz);for(const side of[-1,1]){const tx=-gate.nz,tz=gate.nx;for(let d=3;d<17;d+=3.8){const x=gate.x+gate.nx*d+tx*side*2.8,z=gate.z+gate.nz*d+tz*side*2.8;kit.cyl(x,1.38,z,.055,1.1,steel);if(d<14)kit.pipe([x,1.84,z],[x+gate.nx*3.8,1.84,z+gate.nz*3.8],.045,steel);}}
  const face=new THREE.Mesh(new THREE.PlaneGeometry(4,.65),ctx.signage.signMat('ENTRY '+String(gate.id+1).padStart(2,'0'),'#153e53','#e1f2ee'));face.position.set(gate.x+gate.nx*.28,3.0,gate.z+gate.nz*.28);face.rotation.y=yaw;staticGroup.add(face);
 }
 // Painted entry/exit lanes on existing paving, no second ground plane.
 for(const z of[149,157]){kit.box(202, .965,z,33,.022,.13,paint);for(let x=186;x<216;x+=6)kit.box(x,.967,z+1.6,2,.025,.13,paint);}
 const barriers=[];for(const[x,z,yaw]of[[204,151,-Math.PI/2],[204,159,Math.PI/2]]){kit.box(x,1.6,z+2.7,.55,1.35,.55,navy);const pivot=new THREE.Group();pivot.position.set(x,2.2,z+2.7);const arm=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,5.1),paint);arm.position.z=-2.55;pivot.add(arm);staticGroup.add(pivot);barriers.push({x,z,pivot,angle:0});kit.box(x,2.2,z+1.8,.14,.14,.35,amber);}
 const parkingSign=new THREE.Mesh(new THREE.PlaneGeometry(8,2),ctx.signage.signMat('P  /  PARKING','#1b485e','#e4eeee'));parkingSign.position.set(201,4,149);parkingSign.rotation.y=Math.PI/2;staticGroup.add(parkingSign);kit.flush();
 const models=createActors({...ctx,...createRandom(413)}),palette=['#579cbb','#e0dccb','#4d6069','#9a6260','#829993','#c7cbd0'],cars=layout.parking.activeZ.map((z,i)=>{
  const model=models.car('car',ctx.mat(palette[i]));group.add(model.root);model.root.scale.setScalar(1.6);const inbound=route([[218,182],[218,151],[182,151],[182,z],[191,z]]),back=route([[191,z],[178,z],[178,z-6]]),outbound=new THREE.CurvePath(),gate=gates.find(g=>g.x>100&&Math.abs(g.z)<20)??gates[0];
  outbound.add(back);outbound.add(route([[178,z-6],[178,159],[226,159],[226,192]]));
  const walk=route([[191,z-1.65],[184,z-1.65],[153,z-1.65],[145,gate.z],[gate.x+gate.nx*.6,gate.z+gate.nz*.6]]);
  return {...model,index:i,z,inbound,outbound,reverseLength:back.getLength(),walk,state:i===0?'waiting-entry':'parked',s:0,age:i*19,visit:0,driver:i===0?'hidden':i%3===0?'inside':i%3===1?'walking':'returning',walkS:i%3===1?walk.getLength()*.35:walk.getLength()*.7,travel:0};
 });
 const before=new Set(ctx.scene.children),sync=models.batch();for(const mesh of ctx.scene.children.filter(o=>!before.has(o)&&o.isInstancedMesh)){mesh.castShadow=false;group.add(mesh);}
 const dummy=new THREE.Object3D(),fanPositions=[];let enabled=false,clock=0,fanTime=0,active=null,entries=0,exits=0,admissions=0,departures=0;
 ctx.siteTrafficReservations??=[];
 function carPlace(c){let p,t;if(c.state==='inbound'||c.state==='outbound'){const path=c[c.state],u=Math.min(1,c.s/path.getLength());p=path.getPointAt(u);t=path.getTangentAt(u);}else{p=new THREE.Vector3(191,.92,c.z);t=new THREE.Vector3(1,0,0);}c.root.position.copy(p);const reversing=c.state==='outbound'&&c.s<c.reverseLength;c.root.rotation.y=Math.atan2(t.x,t.z)+(reversing?Math.PI:0);c.wheels.forEach(w=>w.rotation.x=c.travel/.25);c.root.visible=c.state!=='away'&&c.state!=='waiting-entry';}
 function updateFans(dt){if(!enabled)return;if(!ctx.state.paused&&ctx.state.people)fanTime+=dt;if(!group.visible)return;fanPositions.length=0;entries=0;for(let g=0;g<gates.length;g++){const gate=gates[g],path=feeds[g],length=feedLengths[g];for(let k=0;k<perGate;k++){const s=arrivalDistance(k,perGate,length,fanTime),u=s/length,p=path.getPointAt(u),t=path.getTangentAt(Math.min(.999,u)),spread=(k%6-2.5)*.72;p.x+=t.z*spread;p.z-=t.x*spread;avoidPosts(p);const visible=s<length-.03;if(!visible)entries++;fans.set(g*perGate+k,p.x,.825,p.z,Math.atan2(t.x,t.z),visible?(k%13===0?.86:1):0,.7,['#73b6d8','#a5cfe0','#234c66','#dbe1de','#58788b'][k%5]);fanPositions.push({x:p.x,z:p.z,d:length-s,s,gate:gate.id,visible});}}fans.update(fanTime);}
 function updateParking(dt){const traffic=ctx.state.traffic&&!ctx.state.paused,people=ctx.state.people&&!ctx.state.paused;if(!ctx.state.paused)clock+=dt;
  ctx.siteTrafficReservations.length=0;
  if(!active&&traffic){const pending=cars.find(c=>c.state==='waiting-exit')??cars.find(c=>c.state==='waiting-entry'&&simulation.vehicles.every(v=>Math.hypot(v.root.position.x-218,v.root.position.z-182)>14));if(pending){active=pending;active.s=0;active.state=active.state==='waiting-exit'?'outbound':'inbound';if(active.state==='inbound')admissions++;}}
  for(const b of barriers){const open=active&&Math.hypot(active.root.position.x-b.x,active.root.position.z-b.z)<13;b.angle=THREE.MathUtils.lerp(b.angle,open?1.5:0,traffic?1-Math.exp(-dt*5):0);b.pivot.rotation.x=b.angle;}
  for(const c of cars){c.age+=traffic?dt:0;if(c.state==='inbound'||c.state==='outbound'){
    const path=c[c.state],next=Math.min(path.getLength(),c.s+(traffic?5.4*dt:0)),q=path.getPointAt(next/path.getLength()),pedestrian= cars.some(o=>o.driverVisible&&Math.hypot(o.driverX-q.x,o.driverZ-q.z)<3.2),roadConflict=q.x>210&&simulation.vehicles.some(v=>Math.hypot(v.root.position.x-q.x,v.root.position.z-q.z)<5.5);
    const barrierBlocked=barriers.some(b=>Math.hypot(q.x-b.x,q.z-b.z)<3.4&&b.angle<1.25);
    if(!pedestrian&&!roadConflict&&!barrierBlocked){c.travel+=next-c.s;c.s=next;}if(q.x>209&&!roadConflict)ctx.siteTrafficReservations.push({x:q.x,z:q.z,r:4});
    if(c.s>=path.getLength()-.01){if(c.state==='inbound'){c.state='parked';c.driver='walking';c.walkS=0;c.age=0;}else{c.state='away';c.age=0;departures++;}active=null;}
   }else if(c.state==='away'&&c.age>12){c.state='waiting-entry';c.driver='hidden';}
   if(c.state==='parked'||c.state==='waiting-exit'){
    if(c.driver==='walking'&&people){c.walkS=Math.min(c.walk.getLength(),c.walkS+dt*1.35);if(c.walkS>=c.walk.getLength()){c.driver='inside';c.visit=0;}}
    else if(c.driver==='inside'&&people){c.visit+=dt;if(c.visit>18)c.driver='returning';}
    else if(c.driver==='returning'&&people){c.walkS=Math.max(0,c.walkS-dt*1.35);if(c.walkS===0){c.driver='hidden';c.state='waiting-exit';}}
   }
   c.driverVisible=c.driver==='walking'||c.driver==='returning';const u=THREE.MathUtils.clamp(c.walkS/c.walk.getLength(),0,1),p=c.walk.getPointAt(u),t=c.walk.getTangentAt(u),dir=c.driver==='returning'?-1:1;c.driverX=p.x;c.driverZ=p.z;drivers.set(c.index,p.x,.925,p.z,Math.atan2(t.x*dir,t.z*dir),c.driverVisible?1:0,c.driverVisible&&people?.8:0,palette[c.index]);carPlace(c);
  }drivers.update(clock);sync();
 }
 function update(dt){const camera=ctx.camera;group.visible=!camera||!(Math.abs(camera.position.x)<90&&Math.abs(camera.position.z)<105&&camera.position.y<55);updateFans(dt);updateParking(dt);if(group.visible)updateRoamers();fans.mesh.visible=enabled;}
 update(0);return {group,update,setMatchday(value){enabled=value;fans.mesh.visible=value;},diagnostics:()=>({enabled,fanCount:enabled?fanCount-entries:0,nearbyPeople:roamCount,gateCount:gates.length,entries,admissions,departures,activeCar:active?.index??null,barriers:barriers.map(b=>({x:b.x,z:b.z,angle:b.angle})),fanPositions:enabled?fanPositions.slice(0,144):[],parking:cars.map(c=>({id:c.index,state:c.state,position:c.root.position.toArray(),driver:c.driver,driverVisible:c.driverVisible,driverPosition:[c.driverX,.925,c.driverZ]}))}),gates,fanPositions,cars,dispose(){fans.dispose();drivers.dispose();roamers.dispose();group.removeFromParent();ctx.siteTrafficReservations??=[];}};
}
