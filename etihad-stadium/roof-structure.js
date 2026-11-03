import * as THREE from 'three';
import {createGeometryKit} from './src/core/geometry.js';
import {roofFans,BUILDING_SPEC,MAST_FAN} from './building-spec.js';
import {ETIHAD_FORM,mastHead,towerPositions} from './stadium-form.js';

// ============================================================================
// The 2003 cable-net roof as retained on the 2026 Etihad Stadium:
//   ten cigar masts - eight on the spiral ramp-tower caps, two grounded on the
//   south plaza; narrow forestay fans of seven (tower) or five (ground) stays
//   landing on the radial rafters just outside the 10 m translucent band;
//   pairs of Macalloy backstays to ground anchor blocks; the four-strand
//   grounded tension ring above the opening edge.
//
// Evidence
//   A  Arup Journal 2003 p29/33: cigar masts up to 65 m, 76 spiral-strand
//      forestays in fan-shaped groups of five or seven (one per radial rafter),
//      a four-strand "grounded tension ring", pairs of Macalloy high-tensile
//      rod backstays, pot bearings and fabricated plate fixings.
//   B  photographic fits: 1.2-1.5 m maximum cigar diameter, 12 deg outward
//      lean (ETIHAD_FORM.masts), 10-15 m backstay anchors (west elevation).
//   B  retained 2026 count: the north pair of 2003 grounded masts is superseded
//      by the 2026 north-stand headframes (north-headframes.js), leaving 8 + 2.
//   C  stay diameters are drawn ~2x documented so the fans read at model
//      distance; anchor block sizes and bearing details are fitted.
//
// The legacy torus roof is clipped at the 2026 north-stand junction, so no stay
// or tension-ring segment is allowed to land north of that line or to hang
// below the independent north roof sheet.
// ============================================================================
const TAU=Math.PI*2;
const GROUND_Y=BUILDING_SPEC.provisional.concourseLevels[0];   // 0.82 m concourse datum
const TOWER_FOOT=ETIHAD_FORM.rampTowers.topY+3.78;             // top face of the tower-cap pot bearing drum
const GROUND_FOOT=GROUND_Y+1.68;                               // top of the ground-mast steel shoe
const STAY_R=.085;                                             // forestay radius
const ROD_R=.07;                                               // Macalloy backstay rod radius
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

// The 2026 north sheet (z -90...-172, half-width 102->86, y 40...42) replaces
// the legacy roof north sector. This guard reports points that lie below that
// sheet inside its plan footprint; any cable touching it is skipped.
function northSheetGuard(form){
 const N=form.plan.northRoof;
 if(!N)return null;
 const cutZ=N.gutterZ??N.southZ;
 return {
  cutZ,
  under(x,y,z){
   if(z>cutZ)return false;
   const s=clamp((z-N.southZ)/(N.northZ-N.southZ),0,1);
   const halfX=N.southHalfX+(N.northHalfX-N.southHalfX)*s;
   if(Math.abs(x)>halfX)return false;
   const sheetY=N.southY+(N.northY-N.southY)*s;
   return y<sheetY-.6;
  }
 };
}
function crossesGuard(a,b,guard){
 if(!guard)return false;
 for(let i=0;i<=14;i+=1){
  const f=i/14;
  if(guard.under(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f))return true;
 }
 return false;
}

// Oriented helpers: the geometry kit's box/cyl are axis-aligned, so oriented
// members are emitted straight into the kit with an explicit matrix.
function orientedBox(kit,w,h,d,m,center,quat){
 const g=new THREE.BoxGeometry(w,h,d);
 const mx=new THREE.Matrix4().compose(center,quat,new THREE.Vector3(1,1,1));
 kit.geometry(g,m,mx);g.dispose();
}
function orientedCylinder(kit,rTop,rBot,h,m,center,quat,seg=14){
 const g=new THREE.CylinderGeometry(rTop,rBot,h,seg);
 const mx=new THREE.Matrix4().compose(center,quat,new THREE.Vector3(1,1,1));
 kit.geometry(g,m,mx);g.dispose();
}
// A rectangular plate/strut spanning two points (cast-steel bracket language).
function strut(kit,a,b,w,d,m){
 const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),dir=B.clone().sub(A);
 const len=dir.length();
 if(len<1e-4)return;
 const mid=A.clone().add(B).multiplyScalar(.5);
 const o=new THREE.Object3D();
 o.position.copy(mid);
 o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.multiplyScalar(1/len));
 o.scale.set(w,len,d);o.updateMatrix();
 const g=new THREE.BoxGeometry(1,1,1);
 kit.geometry(g,m,o.matrix.clone());g.dispose();
}
// Cigar profile: thin at both ends, max diameter 2*(.14+.60) = 1.48 m.
function cigarProfile(length,segments=28){
 return Array.from({length:segments+1},(_,j)=>{
  const u=j/segments;
  return new THREE.Vector2(.14+.60*Math.pow(Math.sin(Math.PI*u),.62),u*length);
 });
}

export function buildOriginalRoofAssemblies(ctx,{layers,roof,mastPositions,materials,form=ETIHAD_FORM}){
 const {steel,pale,dark,blueLight,concrete}=materials;
 const guard=northSheetGuard(form),northCut=guard?guard.cutZ:Infinity;
 const towerKeys=new Set(towerPositions(form).map(([x,z])=>`${x.toFixed(2)}|${z.toFixed(2)}`));
 const isTower=([x,z])=>towerKeys.has(`${x.toFixed(2)}|${z.toFixed(2)}`);
 // Painted-steel shaft, pale spiral strand and bright Macalloy rod: never pure
 // black, so the masts and fans catch the key/fill light in day and night views.
 const mastSteel=ctx.mat('#87949a');
 const cableSteel=ctx.mat('#93a1a6',{emissive:'#a7b6bc',emissiveIntensity:.22});
 const rodSteel=ctx.mat('#c6cecf',{emissive:'#c6cecf',emissiveIntensity:.16});
 const ringSteel=ctx.mat('#8e9a9f',{emissive:'#9aa9ae',emissiveIntensity:.14});
 const shoeSteel=ctx.mat('#7d8a90');
 const fans=roofFans(mastPositions),assemblies=[];
 const towerCount=mastPositions.filter((p)=>isTower(p)).length;
 const groundCount=mastPositions.length-towerCount;
 let forestays=0,backstayRods=0,staysClipped=0;
 for(const [index,position] of mastPositions.entries()){
  const [x,z]=position,tower=isTower(position);
  const supportLevel=tower?TOWER_FOOT:GROUND_FOOT;
  const foot=new THREE.Vector3(x,supportLevel,z);
  const headArr=mastHead(x,foot.y,z,form),head=new THREE.Vector3(headArr[0],headArr[1],headArr[2]);
  const axis=head.clone().sub(foot),length=axis.length(),dir=axis.clone().normalize();
  const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
  const axial=(f)=>foot.clone().addScaledVector(axis,clamp(f,0,1));
  const radiusAt=(f)=>.14+.60*Math.pow(Math.sin(Math.PI*clamp(f,0,1)),.62);
  const group=new THREE.Group();
  group.name=`M${String(index+1).padStart(2,'0')}_${tower?'tower':'ground'}_cigar_mast`;
  group.userData={component:'original roof mast',index:index+1,support:tower?'ramp tower':'ground',supportLevelMetres:supportLevel,leanDegrees:form.masts.leanDeg,evidence:'A topology and cigar form; B retained 2026 count, 1.2-1.5 m diameter, 12 deg lean; C support and fixing details'};
  layers.steel.add(group);
  const kit=createGeometryKit(group,ctx.random),cableKit=createGeometryKit(layers.cables,ctx.random);

  // ---- cigar-shaped tubular shaft --------------------------------------
  const body=new THREE.Mesh(new THREE.LatheGeometry(cigarProfile(length),20),mastSteel);
  body.name='cigar_tubular_shaft';body.position.copy(foot);body.quaternion.copy(rotation);
  body.castShadow=true;body.receiveShadow=true;body.userData={maxDiameterMetres:1.48,minDiameterMetres:.28,evidence:'B photographic cigar taper fit'};group.add(body);
  // circumferential fabrication collars, sized to the local shaft radius
  for(const f of [.14,.38,.62,.86])orientedCylinder(kit,radiusAt(f)+.045,radiusAt(f)+.045,.11,steel,axial(f),rotation,16);

  // ---- mast head: cast plate, cable spider, gussets and tip beacon -------
  const headPlate=axial(.965);
  orientedBox(kit,2.35,1.35,.24,pale,headPlate,rotation);
  for(const side of [-1,1]){
   const fin=axial(.9);
   orientedBox(kit,.26,1.5,.62,steel,fin.clone().add(new THREE.Vector3(side*.7,0,0)),rotation);
  }
  orientedCylinder(kit,.62,.78,.4,shoeSteel,axial(.9),rotation,14);
  orientedCylinder(kit,.14,.30,.24,pale,axial(1),rotation,12);
  const beacon=axial(1).addScaledVector(dir,.16);
  orientedCylinder(kit,.30,.16,.52,blueLight,beacon,rotation,12);

  // ---- support: pot bearing on the tower cap, or shoe on a concrete base -
  const planR=Math.hypot(x,z)||1,outward=new THREE.Vector3(x/planR,0,z/planR);
  const tangent=new THREE.Vector3(-outward.z,0,outward.x);
  if(tower){
   // Cylindrical mast bearing on the tower cap. The envelope (stadium-envelope.js)
   // builds the drum and pot bearing; here the fabricated base collar, the bearing
   // pin and the three cast-steel support brackets that pick up the leaning shaft.
   orientedCylinder(kit,1.42,1.46,.20,concrete,new THREE.Vector3(x,TOWER_FOOT-.10,z),new THREE.Quaternion(),20);
   orientedCylinder(kit,.40,.66,.62,shoeSteel,new THREE.Vector3(x,TOWER_FOOT+.34,z),rotation,16);
   kit.pipe([x-tangent.x*1.50,TOWER_FOOT+.30,z-tangent.z*1.50],[x+tangent.x*1.50,TOWER_FOOT+.30,z+tangent.z*1.50],.13,pale);
   for(let k=0;k<3;k+=1){
    const a=index*.37+k*TAU/3;
    const rim=new THREE.Vector3(x+Math.cos(a)*1.16,TOWER_FOOT+.02,z+Math.sin(a)*1.16);
    const fB=Math.min(.11,1.7/length),shaft=axial(fB).add(new THREE.Vector3(Math.cos(a),0,Math.sin(a)).multiplyScalar(radiusAt(fB)*.82));
    strut(kit,rim.toArray(),shaft.toArray(),.30,.54,shoeSteel);
   }
  }else{
   // concrete base, fabricated steel shoe, holding-down bolts and gussets
   kit.box(x,GROUND_Y+.30,z,3.7,.60,3.7,concrete);
   kit.box(x,GROUND_Y+.78,z,2.85,.42,2.85,concrete);
   kit.box(x,GROUND_Y+1.12,z,1.9,.34,1.9,shoeSteel);
   orientedCylinder(kit,.36,.98,.74,shoeSteel,new THREE.Vector3(x,GROUND_Y+1.46,z),new THREE.Quaternion(),16);
   for(const sx of [-1,1])for(const sz of [-1,1]){
    kit.box(x+sx*.98,GROUND_Y+.92,z+sz*.98,.24,.9,.24,pale);
    kit.cyl(x+sx*.58,GROUND_Y+1.34,z+sz*.58,.09,.26,dark);
   }
   for(let k=0;k<4;k+=1){
    const a=index*.5+k*TAU/4;
    const rim=new THREE.Vector3(x+Math.cos(a)*.82,GROUND_Y+1.2,z+Math.sin(a)*.82);
    const fG=Math.min(.06,.9/length),shaft=axial(fG).add(new THREE.Vector3(Math.cos(a),0,Math.sin(a)).multiplyScalar(radiusAt(fG)));
    strut(kit,rim.toArray(),shaft.toArray(),.24,.36,shoeSteel);
   }
  }

  // ---- pair of Macalloy backstay groups to ground anchors ----------------
  const anchorDist=tower?15.5:13.5,anchorSpread=tower?4.2:4.8;
  const headAttach=axial(.9);
  for(const side of [-1,1]){
   const anchor=new THREE.Vector3(foot.x,GROUND_Y,foot.z).addScaledVector(outward,anchorDist).addScaledVector(tangent,side*anchorSpread);
   const rodPlan=new THREE.Vector3(anchor.x-foot.x,0,anchor.z-foot.z).normalize();
   const yaw=Math.atan2(rodPlan.x,rodPlan.z);
   const anchorTop=GROUND_Y+(tower?1.06:1.55);
   // Arup: each top is tied back by a pair of groups of high-tensile rods;
   // two visible rods per group read as the bundled Macalloy set.
   for(const k of [-1,1]){
    const start=headAttach.clone().addScaledVector(tangent,k*.44);
    const end=new THREE.Vector3(anchor.x+rodPlan.x*.3+tangent.x*k*.52,anchorTop,anchor.z+rodPlan.z*.3+tangent.z*k*.52);
    if(crossesGuard(start.toArray(),end.toArray(),guard))continue;
    cableKit.pipe(start.toArray(),end.toArray(),ROD_R,rodSteel);backstayRods+=1;
   }
   // cast anchor plate on a wedged concrete block, sized by support type
   if(tower){
    kit.box(anchor.x,GROUND_Y+.32,anchor.z,2.2,.64,2.9,concrete,yaw);
    const qTop=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(-rodPlan.z,0,rodPlan.x),.13).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw));
    orientedBox(kit,1.7,.52,2.2,concrete,new THREE.Vector3(anchor.x,GROUND_Y+.82,anchor.z),qTop);
    kit.box(anchor.x,GROUND_Y+1.1,anchor.z,1.2,.2,.95,dark,yaw);
   }else{
    kit.box(anchor.x,GROUND_Y+.45,anchor.z,3.2,.9,4.0,concrete,yaw);
    const qTop=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(-rodPlan.z,0,rodPlan.x),.16).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw));
    orientedBox(kit,2.6,.78,3.1,concrete,new THREE.Vector3(anchor.x,GROUND_Y+1.16,anchor.z),qTop);
    kit.box(anchor.x,GROUND_Y+1.55,anchor.z,1.5,.2,1.1,dark,yaw);
   }
  }

  // ---- forestay fan onto the radial rafters -----------------------------
  const fan=fans.find((f)=>f.index===index),kept=[];
  for(const angle of fan.angles){
   const q=roof(angle,MAST_FAN.landingU);
   // The 2026 north stand removed the legacy roof north of this line: never
   // land a stay there, and never thread one under the independent north sheet.
   if(q[2]<northCut){staysClipped+=1;continue;}
   const end=[q[0],q[1]+.34,q[2]];
   const radial=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle));
   const attach=headAttach.clone().addScaledVector(radial,.62);
   if(crossesGuard(attach.toArray(),end,guard)){staysClipped+=1;continue;}
   cableKit.pipe(attach.toArray(),end,STAY_R,cableSteel);forestays+=1;kept.push(angle);
   // welded stay socket on the rafter at the landing point
   kit.box(q[0],q[1]+.16,q[2],.62,.36,.62,steel);
   kit.cyl(q[0],q[1]+.42,q[2],.13,.30,pale);
  }
  kit.flush();cableKit.flush();
  assemblies.push({index:index+1,support:tower?'ramp tower':'ground',base:foot.toArray(),head:head.toArray(),lengthMetres:+length.toFixed(2),forestays:kept.length,backstayGroups:2,headPlateMetres:2.35});
 }

 // ---- four-strand grounded tension ring above the opening edge -----------
 // Arup p33: four independent spiral-strand cables form the grounded tension
 // ring just above the roof surface around the opening (four corner ties to
 // ground are part of the original system but are not visible in 2026 views).
 const ringStrands=[];
 for(let strand=0;strand<4;strand+=1){
  const radial=strand%2===0?-.14:.14,vertical=strand<2?-.11:.11;
  const points=[];let dropped=0;
  for(let i=0;i<192;i+=1){
   const t=(i/192)*TAU,q=roof(t,.07);
   const px=q[0]+Math.cos(t)*radial,pz=q[2]+Math.sin(t)*radial,py=q[1]+.50+vertical;
   if(pz<northCut){dropped+=1;continue;}
   points.push(new THREE.Vector3(px,py,pz));
  }
  if(dropped>0||points.length<32)continue; // never chord across the north stand
  const curve=new THREE.CatmullRomCurve3(points,true,'centripetal');
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,224,.055,6,true),ringSteel);
  mesh.name=`grounded_tension_ring_strand_${strand+1}`;mesh.castShadow=false;
  mesh.userData={component:'grounded tension ring',strand:strand+1,strandsTotal:4,evidence:'A four independent spiral strands; C fitted 2026 route just above the opening edge'};
  layers.cables.add(mesh);ringStrands.push(strand+1);
 }
 return {originalMasts:assemblies,towerSupportedMasts:towerCount,groundSupportedMasts:groundCount,tensionRingStrands:ringStrands.length,forestays,forestaysPlanned:fans.reduce((n,f)=>n+f.n,0),forestayFans:fans.length,backstayGroups:assemblies.length*2,backstayRods,staysClippedByNorthStand:staysClipped,fanGeometry:'narrow, almost coplanar fans of 7 (tower) / 5 (ground) stays'};
}
