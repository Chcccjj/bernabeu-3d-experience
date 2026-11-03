import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import config from '../project.config.js';
import {createMaterials} from '../src/core/materials.js';
import {createRandom} from '../src/core/random.js';
import {createGeometryKit} from '../src/core/geometry.js';
import {createActors} from '../src/actors/models.js';
import {createSimulation} from '../src/systems/simulation.js';
import {buildScene} from '../scene.js';
import {createStadiumActivity} from '../src/experience/stadium-activity.js';
import {createFootballMatch,sampleDerby} from '../src/experience/football-match.js';
const ctx={scene:new THREE.Scene(),config,...createMaterials(),...createRandom(1894),obstacles:[],state:{time:0,pedTime:0,trafficTime:0,traffic:true,people:true,trafficMode:'active',peopleMode:'active',paused:false},signage:{textureCanvas:()=>null,signMat:()=>new THREE.MeshBasicMaterial()},siteTrafficReservations:[],camera:{position:new THREE.Vector3(42,42,66)}};ctx.batch=createGeometryKit(ctx.scene,ctx.random,config.visual);const layout=buildScene(ctx),actors=createActors(ctx),simulation=createSimulation({...ctx},layout,actors),activity=createStadiumActivity(ctx,layout,simulation),football=createFootballMatch(ctx,layout);
assert.equal(activity.diagnostics().enabled,false);assert.ok(activity.cars.some(c=>c.root.visible));assert.ok(activity.cars.some(c=>c.driverVisible));assert.ok(activity.gates.length>=6);
activity.setMatchday(true);football.setEnabled(true);let minPlayers=Infinity,maxBall=0,maxCarsInMotion=0,carClearanceChecks=0,driverClearanceChecks=0,goals=0,lastGoal=false,entered=false,exited=false;
for(let i=0;i<2400;i++){
 const dt=.15;ctx.state.time+=dt;ctx.state.pedTime+=dt;ctx.state.trafficTime+=dt;const camera=ctx.camera;ctx.camera=null;activity.update(dt);ctx.camera=camera;simulation.update(dt);football.update(dt);
 const d=football.diagnostics();if(d.goal&&!lastGoal)goals++;lastGoal=d.goal;for(const p of d.players)assert.ok(Math.abs(p.p[0])<32&&Math.abs(p.p[2])<51,'player remains on field');
 for(let a=0;a<22;a++)for(let b=a+1;b<22;b++){const p=d.players[a].p,q=d.players[b].p;minPlayers=Math.min(minPlayers,Math.hypot(p[0]-q[0],p[2]-q[2]));}
 assert.ok(d.ball.every(Number.isFinite));maxBall=Math.max(maxBall,Math.abs(d.ball[2]));assert.ok(Math.abs(d.ball[0])<34&&Math.abs(d.ball[2])<55,'ball stays within pitch/goal envelope');
 const cars=activity.diagnostics();
 for(const car of activity.cars){
  if(car.driverVisible)for(const b of layout.parking.bays.filter(b=>b.occupied)){assert.ok(Math.abs(car.driverX-b.x)>2.4||Math.abs(car.driverZ-b.z)>1.35,'driver intersects parked car');driverClearanceChecks++;}
  if(['inbound','outbound'].includes(car.state)){const x=car.root.position.x,z=car.root.position.z,yaw=car.root.rotation.y,t=[Math.sin(yaw),Math.cos(yaw)],r=[Math.cos(yaw),-Math.sin(yaw)];for(const b of layout.parking.bays.filter(b=>b.occupied)){const dx=b.x-x,dz=b.z-z;const separate=[[1,0],[0,1],t,r].some(([ax,az])=>Math.abs(dx*ax+dz*az)>2.1*Math.abs(t[0]*ax+t[1]*az)+1.1*Math.abs(r[0]*ax+r[1]*az)+2.1*Math.abs(ax)+1.1*Math.abs(az));assert.ok(separate,'maneuvering car intersects occupied bay');carClearanceChecks++;}}
 }
maxCarsInMotion=Math.max(maxCarsInMotion,activity.cars.filter(c=>['inbound','outbound'].includes(c.state)).length);entered ||= cars.admissions>0;exited ||= cars.departures>0;
 for(const p of activity.fanPositions)if(p.visible){assert.ok(Math.abs(p.x)<205&&p.z<196&&p.z> -145,'arrivals avoid parking/road bounds');assert.ok(p.d>.02);}
}
assert.ok(minPlayers>1);assert.ok(maxCarsInMotion<=1);assert.ok(activity.diagnostics().admissions>1);assert.ok(entered&&exited,'daily parking must admit and release cars');assert.equal(goals,1);assert.deepEqual(football.state.score,[1,0]);assert.deepEqual(sampleDerby(29).score,[1,0]);assert.deepEqual(sampleDerby(65).score,[1,1]);assert.deepEqual(sampleDerby(72).score,[1,1]);
const before=football.clock,beforePlayers=football.diagnostics().players;ctx.state.paused=true;football.update(1);assert.equal(football.clock,before);assert.deepEqual(football.diagnostics().players,beforePlayers);ctx.state.paused=false;activity.setMatchday(false);activity.update(.1);assert.equal(activity.diagnostics().fanCount,0);assert.ok(activity.cars.some(c=>c.root.visible),'parking stays present outside matchday');football.setEnabled(false);assert.equal(football.group.visible,false);
const report={version:'V14',simulationSeconds:360,gates:activity.gates.length,arrivalPeople:activity.fanPositions.length,parkingCars:6,parkingAdmissions:activity.diagnostics().admissions,parkingDepartures:activity.diagnostics().departures,maxSimultaneouslyManeuvering:maxCarsInMotion,carClearanceChecks,driverClearanceChecks,minimumPlayerDistance:minPlayers,maxBallAbsZ:maxBall,goals,matchAndDayTransitions:'passed',pause:'passed'};fs.writeFileSync('validation/v14-matchday-life.json',JSON.stringify(report,null,2));console.log(report);
