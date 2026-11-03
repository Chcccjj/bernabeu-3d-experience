import * as THREE from 'three';
import {createVisitScore,isInsideStadium} from './visit-score.js';
import {createPeopleBatch} from '../actors/people-batch.js';
export const MATCH_HALF_SECONDS=36;
// A deterministic Manchester derby demonstration, not a live match feed or game engine.
const frames=[
 {t:0,p:[0,0],role:9},{t:3,p:[-3,1],role:9},{t:7,p:[-13,10],role:6,flight:1},
 {t:13,p:[-11,24],role:6},{t:17,p:[18,30],role:7,flight:1},
 {t:23,p:[16,40],role:7},{t:26,p:[2,42],role:9,flight:2},
 {t:29,p:[1.3,53.45],role:9,flight:1.1},{t:36,p:[1.3,53.45],role:9}
];
const shape=[[0,-49],[-23,-25],[-8,-28],[8,-28],[23,-25],[-23,-4],[-10,-1],[12,-3],[24,9],[0,17],[-14,18]];
export function sampleDerby(time){
 const half=Math.floor(time/MATCH_HALF_SECONDS),u=time-half*MATCH_HALF_SECONDS,attack=half%2,sign=attack===0?1:-1;
 let j=1;while(j<frames.length-1&&u>frames[j].t)j++;const a=frames[j-1],b=frames[j],v=THREE.MathUtils.clamp((u-a.t)/(b.t-a.t),0,1),s=v*v*(3-2*v),shot=b.t===29;
 const point=[THREE.MathUtils.lerp(a.p[0],b.p[0],s)*sign,THREE.MathUtils.lerp(a.p[1],b.p[1],s)*sign];
 const goal=u>=29,ballHeight=goal?0:Math.sin(v*Math.PI)*(b.flight??0)*.8;
 const completed=Math.floor(time/36),blue=Math.floor((completed+1)/2)+(attack===0&&goal?1:0),red=Math.floor(completed/2)+(attack===1&&goal?1:0);
 return {half,phase:u,attack,sign,point,ballHeight,carrier:v<.18?a.role:b.role,carrying:!b.flight&&!goal,goal,score:[blue,red],label:goal?'GOAL · 进球庆祝':u<3?'KICK-OFF · 中圈开球':shot?'SHOT · 射门':b.flight?'PASS · 传球':'PLAY · 推进'};
}
export function createFootballMatch(ctx,layout){
 const group=new THREE.Group();group.name='Manchester derby / simulated match';group.userData.exportExclude=true;group.visible=false;layout.layers.pitch.add(group);
 const players=createPeopleBatch(ctx,22,{name:'City blue / United red · 22 players',seed:1894,athlete:true}),referee=createPeopleBatch(ctx,1,{name:'match_referee',seed:1910,athlete:true});group.add(players.mesh,referee.mesh);
 const ballGeo=new THREE.IcosahedronGeometry(.115,1),colors=[];for(let i=0;i<ballGeo.attributes.position.count;i++){const c=new THREE.Color(Math.floor(i/3)%7===0?'#172732':'#f5f4e9');colors.push(c.r,c.g,c.b);}ballGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const ball=new THREE.Mesh(ballGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72}));ball.name='football';group.add(ball);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.19,16),new THREE.MeshBasicMaterial({color:'#173523',transparent:true,opacity:.33,depthWrite:false}));shadow.rotation.x=-Math.PI/2;group.add(shadow);
 const positions=Array.from({length:22},()=>new THREE.Vector3()),previous=positions.map(p=>p.clone());const visit=createVisitScore(),refereePosition=new THREE.Vector3(-8,-5.13,-12);let shotFrom=null,goalAt=null;let clock=0,enabled=false,state=sampleDerby(0),kicker=0,initialized=false;
 function update(dt){if(!enabled||(ctx.state.paused&&initialized))return;dt=ctx.state.paused?0:dt;if(enabled&&!ctx.state.paused)clock+=dt;const wasScored=visit.scored;visit.update(dt,isInsideStadium(ctx.camera?.position),ctx.state.paused);if(!wasScored&&visit.scored)goalAt=clock;
  // Keep the score at 0:0 while outside. The only scoring attack is tied to
  // the visitor's fifteenth second inside; later play never adds another goal.
  state=sampleDerby((clock%24));state.goal=false;state.score=visit.score;
  if(visit.seconds>=12&&!visit.scored){if(!shotFrom)shotFrom=[...state.point];const u=(visit.seconds-12)/3,s=u*u*(3-2*u);state.point=[THREE.MathUtils.lerp(shotFrom[0],1.3,s),THREE.MathUtils.lerp(shotFrom[1],53.45,s)];state.ballHeight=Math.sin(u*Math.PI)*.9;state.attack=0;state.sign=1;state.carrier=9;state.label='SHOT · 射门';}
  if(visit.scored&&clock-goalAt<4){state.point=[1.3,53.45];state.ballHeight=0;state.attack=0;state.sign=1;state.goal=true;state.label='GOAL · 曼城进球';}
  const {point,sign,attack,phase,carrier,goal}=state;
  for(let team=0;team<2;team++)for(let role=0;role<11;role++){
   const i=team*11+role,forward=team===0?1:-1,[bx,bz]=shape[role],advance=team===attack?Math.min(22,Math.abs(point[1])*.45):Math.min(12,Math.abs(point[1])*.25);
   let x=bx*forward+Math.sin(clock*.45+i)*1.1,z=(bz+(goal&&phase>32?0:advance))*forward;
   if(role===0){x=THREE.MathUtils.clamp(point[0]*.2,-3,3);z=-49*forward;}
   else if(team===attack&&role===carrier&&!goal){x=point[0]-.3*sign;z=point[1]-.7*sign;kicker=i;}
   else if(team!==attack&&role===2&&!goal){x=point[0]+2.1*sign;z=point[1]+2.5*sign;}
   // Kick-off is visibly staged in the centre; the receiving team stays in its half.
   if(phase<3&&team!==attack&&role>0)z=forward*Math.min(-1,Math.abs(bz)*-.7);
   x=THREE.MathUtils.clamp(x,-30.5,30.5);z=THREE.MathUtils.clamp(z,-50.1,50.1);
   if(goal&&phase>32&&team!==attack&&role===9){x=-.3*forward;z=-.7*forward;}
   const desired=new THREE.Vector3(x,-5.13,z),difference=desired.clone().sub(positions[i]);if(!initialized)positions[i].copy(desired);else positions[i].add(difference.clampLength(0,7*dt));
  }
  initialized=true;
  for(let k=0;k<3;k++)for(let i=0;i<22;i++)for(let j=i+1;j<22;j++){const a=positions[i],b=positions[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d<1.35){const n=d||1,px=(d?dx/n:1)*(1.35-d)/2,pz=(d?dz/n:0)*(1.35-d)/2;a.x-=px;a.z-=pz;b.x+=px;b.z+=pz;}}
  for(let i=0;i<22;i++){const p=positions[i],team=Math.floor(i/11),role=i%11,delta=p.clone().sub(previous[i]),moving=delta.lengthSq()>.00001;const yaw=moving?Math.atan2(delta.x,delta.z):Math.atan2(point[0]-p.x,point[1]-p.z);players.set(i,p.x,p.y+(goal&&team===attack?Math.max(0,Math.sin(clock*5+i))*.12:0),p.z,yaw,1.06,moving?1.5:goal?.4:.12,role===0?(team===0?'#e8c454':'#5fba9c'):team===0?'#77c8f1':'#d92e3b');previous[i].copy(p);}
  const rx=THREE.MathUtils.clamp(point[0]-8,-26,26),rz=THREE.MathUtils.clamp(point[1]-12*sign,-40,40);refereePosition.add(new THREE.Vector3(rx,-5.13,rz).sub(refereePosition).clampLength(0,dt*7));referee.set(0,refereePosition.x,-5.13,refereePosition.z,Math.atan2(point[0]-rx,point[1]-rz),1.02,1,'#f1da65');
  ball.position.set(point[0],-5.135+.115+state.ballHeight,point[1]);ball.rotation.set(clock*9,clock*3,clock*4);shadow.position.set(point[0],-5.115,point[1]);shadow.scale.setScalar(1+state.ballHeight*.2);players.update(clock);referee.update(clock);
 }
 update(0);return {group,update,setEnabled(value){if(value&&!enabled){clock=0;visit.reset();shotFrom=null;goalAt=null;state={...sampleDerby(0),goal:false,score:[0,0]};refereePosition.set(-8,-5.13,-12);initialized=false;previous.forEach(p=>p.set(0,0,0));}enabled=value;group.visible=value;},get state(){return state;},get clock(){return clock;},diagnostics:()=>({enabled,clock,insideSeconds:visit.seconds,scored:visit.scored,...state,players:positions.map((p,i)=>({team:i<11?'CITY':'UNITED',role:i%11,p:p.toArray()})),ball:ball.position.toArray(),kicker}),dispose(){players.dispose();referee.dispose();ballGeo.dispose();ball.material.dispose();shadow.geometry.dispose();shadow.material.dispose();group.removeFromParent();}};
}
