import * as THREE from 'three';
import {createGeometryKit} from './src/core/geometry.js';
import {AISLE_LAYOUT,aisleFrame} from './bowl-aisles.js';

// Topology: Manchester City 2026/27 Access Statement p20 confirms two aisle
// steps per North Stand seat-row interval. Dimensions/positions retain the
// provisional bowl profile; this is not an as-built egress or compliance model.
export function buildNorthAisleSteps(ctx,{parent,shape,profile,concrete}){
 const group=new THREE.Group();group.name='north_aisle_double_steps_fitted';parent.add(group);
 const kit=createGeometryKit(group,ctx.random),paint=ctx.mat('#e2e6df');
 paint.userData.noShadow=true;
 const stations=[];let treads=0,landings=0;
 for(let index=0;index<=(profile.rows-1)*2;index++){
  const row=index/2,curve=shape(profile.start+row*profile.step+profile.seatOffset);
  for(let aisle=0;aisle<AISLE_LAYOUT.count;aisle++){
   const f=aisleFrame(curve,aisle),q=f.point;
   if(q.y>=profile.zBelow||Math.abs(q.x)>profile.halfWidth)continue;
   const height=index===0?.06:profile.rise/2+.06,depth=profile.step/2,top=profile.y+row*profile.rise+.01;
   kit.box(q.x,top-height/2,q.y,profile.stairWidth,height,depth,concrete,f.yaw);
   if(index===0)landings++;else treads++;
   kit.at(q.x,top+.009,q.y,f.yaw,()=>kit.box(0,0,depth/2-.025,profile.stairWidth,.016,.05,paint));
   stations.push({index,row,aisle,center:[q.x,top-height/2,q.y],yaw:f.yaw,width:profile.stairWidth,height,depth,top});
  }
 }
 kit.flush();
 const result={treads,landings,nosings:stations.length,subdivisionsPerRow:2,stations,evidence:'A row-to-step relation; C inherited section, width, nosing and placement',source:'https://www.mancity.com/meta/media/qjpefmyj/etihad-access-statement-2627.pdf#page=20'};
 group.userData={...result,stations:undefined};
 return result;
}
