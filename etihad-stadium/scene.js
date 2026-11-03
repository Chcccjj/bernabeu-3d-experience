import * as THREE from 'three';
import {clipNorthPolygon,northMask,buildNorthJunctionReturns,fitsNorthFootprint} from './north-junction.js';
import {buildPitchTurf} from './pitch-turf.js';
import {createGeometryKit} from './src/core/geometry.js';
import {makePath} from './src/world/terrain.js';
import {buildStadiumDetails} from './stadium-detail.js';
import {buildOriginalRoofAssemblies} from './roof-structure.js';
import {isAisleSeat,aisleFrame,AISLE_LAYOUT} from './bowl-aisles.js';
import {buildNorthDatum} from './north-datum.js';
import {createBowlSections} from './bowl-sections.js';
import {createStadiumMaterials,buildStandingSeams} from './stadium-materials.js';
import {ETIHAD_FORM,roofSample,glassU,towerPositions as towerPositionsFromForm,allMastPositions} from './stadium-form.js';
import {buildStadiumEnvelope} from './stadium-envelope.js';
import {buildNorthComplex} from './north-complex.js';
import {buildStadiumSeats} from './stadium-seats.js';
import {buildStadiumInterior} from './stadium-interior.js';
import {buildStadiumBowlDetail} from './stadium-bowl-detail.js';

// Metres. Only documented dimensions are classified as A evidence.
export const MODEL={pitch:{width:68,length:105,level:-5.18,evidence:'A'},groundLevel:.82,roof:{halfWidth:ETIHAD_FORM.plan.outerX,halfLength:ETIHAD_FORM.plan.southZ,evidence:'B/C'},north:{height:49,evidence:'C'},evidence:{envelope:'B/C OSM outline + Esri orthoimagery + Arup 2003 torus + 2025/2026 photos'}};
export function buildScene(ctx){
 ctx.displaySurfaces??=[];
 const {scene,mat,M,random}=ctx,ground=.82,pitch=MODEL.pitch.level,layers={},kits={};
 const specs=[['site','场地与道路',0],['pitch','草坪与比赛设施',12],['bowl','看台混凝土结构',35],['seats','座椅与支架',47],['facade','幕墙与外立面',60],['ramps','八座螺旋交通塔',70],['steel','桅杆与主屋架',105],['cables','扇形拉索与锚固',120],['roof','屋面与采光带',150],['north','新北看台与连廊',55],['hotel','酒店与商业翼楼',72],['canopy','球迷广场玻璃雨棚',90],['structure','环廊与次结构',28],['level0','下层环廊楼板与柱网',18],['level1','中层环廊楼板与柱网',32],['level2','上层环廊楼板与柱网',46],['lighting','比赛照明与灯具支架',153],['services','屋顶排水与检修构件',133]];
 for(const [id,label,lift] of specs){const g=new THREE.Group();g.name=label;g.userData={id,label,lift};scene.add(g);layers[id]=g;kits[id]=createGeometryKit(g,random,{outlineOpacity:0});}
 const {concrete,pale,dark,steel,teal,glass,cladding,roofMat,roofGlass,roofVariants,seam,seatMats}=createStadiumMaterials(mat);
 const lamp=mat('#d6e5e7',{emissive:'#d1eeff',emissiveIntensity:1.8}),blueLight=mat('#5dadd3',{emissive:'#40a4e4',emissiveIntensity:2.8});
 const curb=mat('#aab5b2'),paving=mat('#a7b2ae'),grass=mat('#6a8b67');
 const outlineCache=new Map();
 function shape(off=0){const x=41+off,z=62+off,r=23+off*.9,s=new THREE.Shape();s.moveTo(-x+r,-z);s.lineTo(x-r,-z);s.absarc(x-r,-z+r,r,-Math.PI/2,0);s.lineTo(x,z-r);s.absarc(x-r,z-r,r,0,Math.PI/2);s.lineTo(-x+r,z);s.absarc(-x+r,z-r,r,Math.PI/2,Math.PI);s.lineTo(-x,-z+r);s.absarc(-x+r,-z+r,r,Math.PI,Math.PI*1.5);s.closePath();return s;}
 function loop(off,n=256){const key=off+':'+n;if(!outlineCache.has(key))outlineCache.set(key,shape(off).getSpacedPoints(n));return outlineCache.get(key);}
 function ring(g,off,width,y,height,material,filter=()=>true){
  const a=loop(off),b=loop(off+width),p=[];
  function face(poly){const parts=filter.clipNorth?clipNorthPolygon(poly,filter.clipNorth==='inside'):[poly];for(const v of parts)for(let k=1;k<v.length-1;k++)p.push(...v[0],...v[k],...v[k+1]);}
  for(let i=0;i<a.length-1;i++){
   if(!filter.clipNorth&&!filter(a[i]))continue;
   face([[a[i].x,y,a[i].y],[a[i+1].x,y,a[i+1].y],[b[i+1].x,y,b[i+1].y],[b[i].x,y,b[i].y]]);
   // Full tread riser. The former second triangle repeated its first vertex.
   face([[a[i].x,y-height,a[i].y],[a[i+1].x,y,a[i+1].y],[a[i+1].x,y-height,a[i+1].y]]);
   face([[a[i].x,y-height,a[i].y],[a[i].x,y,a[i].y],[a[i+1].x,y,a[i+1].y]]);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.computeVertexNormals();g.geometry(geo,material);geo.dispose();
 }
 function wallRibbon(k,off,y0,y1,material,filter=()=>true){const p=loop(off),v=[];for(let i=0;i<p.length-1;i++){if(!filter(p[i]))continue;const a=p[i],b=p[i+1];for(const q of[[a,y0],[b,y1],[b,y0],[a,y0],[a,y1],[b,y1]])v.push(q[0].x,q[1],q[0].y);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();k.geometry(g,material);g.dispose();}
 function sign(parent,text,x,y,z,w,h,rotation=0,bg='#263f4c',fg='#e2eff1'){const m=ctx.signage.signMat(text,bg,fg);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);mesh.position.set(x,y,z);mesh.rotation.y=rotation;parent.add(mesh);if((parent===layers.pitch||parent===layers.bowl)&&/^(MAN CITY|ETIHAD|ETIHAD AIRWAYS|MANCHESTER CITY|TOGETHER|CITY|ETIHAD STADIUM)$/.test(text))ctx.displaySurfaces.push({mesh,kind:'ad'});return mesh;}
 function labelGround(text,x,z,w,d){const m=ctx.signage.signMat(text,'#aebbb9','#4a6977'),mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.91,z);layers.site.add(mesh);}
 // Ground plate with a real opening: the pitch is 6 metres below the public concourse.
 const site=kits.site;const slab=new THREE.Shape();slab.moveTo(-235,-255);slab.lineTo(235,-255);slab.lineTo(235,245);slab.lineTo(-235,245);slab.closePath();const hole=new THREE.Path();const hp=loop(18);hp.slice().reverse().forEach((p,i)=>i?hole.lineTo(p.x,p.y):hole.moveTo(p.x,p.y));hole.closePath();slab.holes.push(hole);const gg=new THREE.ShapeGeometry(slab,100);gg.rotateX(-Math.PI/2);site.geometry(gg,paving,new THREE.Matrix4().makeTranslation(0,ground,0));gg.dispose();
 site.box(0,-7.8,-5,470,3.5,500,mat('#596a70'));
 for(const z of[-255,245])site.box(0,-4.6,z,470,4,.65,concrete);for(const x of[-235,235])site.box(x,-4.6,-5,.65,4,500,concrete);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(8000,8000),new THREE.MeshStandardMaterial({color:'#b5c4c8',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-9.6;scene.add(floor);ctx.floor=floor;
 // Access apron paving joints; no opaque coplanar stacked terrain faces.
 for(let x=-216;x<=216;x+=9)for(const z of[-155,154])site.box(x,.86,z, .045,.025,62,curb);
 for(let z=-120;z<142;z+=9)for(const x of[-159,159])site.box(x,.86,z,62,.025,.045,curb);
 for(let x=-216;x<=216;x+=9)for(const z of[-180,185])site.box(x,.86,z,8.9,.03,.05,curb);
 // Keep the original preview footprint; detail work is confined to the stadium.
 site.box(0,.865,205,466,.07,19,mat('#59696f'));site.box(222,.87,-5,19,.08,500,mat('#59696f'));
 for(let x=-230;x<230;x+=9){site.box(x,.94,205,4,.035,.16,pale);for(const z of[196.7,213.3])site.box(x,.94,z,8.8,.035,.13,pale);}
 for(let z=-240;z<244;z+=9){site.box(222,.95,z,.16,.035,4,pale);for(const x of[213.7,230.3])site.box(x,.95,z,.13,.035,8.8,pale);}
 // Eastern parking court, bays and parked vehicles.
 site.box(181,.87,5,43,.08,292,mat('#96a3a2'));
 const parkedGeo=new THREE.BoxGeometry(1,1,1),parked=[];
 const parkingBays=[],activeParkingZ=[27,31,35,39,43,47].map(i=>-128+i*5.5+2.6);
 for(let z=-128;z<140;z+=5.5){for(const x of[169,191]){site.box(x,.94,z,5.0,.035,.10,pale);const occupied=random()>.18,reserved=x===191&&activeParkingZ.some(v=>Math.abs(v-z-2.6)<.01);parkingBays.push({x,z:z+2.6,reserved,occupied:occupied&&!reserved});if(occupied&&!reserved)parked.push([x,1.7,z+2.6]);}}
 const parkedMat=mat('#728d9e'),cars=new THREE.InstancedMesh(parkedGeo,parkedMat,parked.length),cg=new THREE.InstancedMesh(parkedGeo,glass,parked.length),dummy=new THREE.Object3D();parked.forEach(([x,y,z],i)=>{dummy.position.set(x,y,z);dummy.scale.set(4.4,1.3,1.8);dummy.updateMatrix();cars.setMatrixAt(i,dummy.matrix);dummy.position.y=y+.7;dummy.scale.set(2.2,.7,1.58);dummy.updateMatrix();cg.setMatrixAt(i,dummy.matrix);});cars.name='legacy_parked_car_bodies';cg.name='legacy_parked_car_glass';layers.site.add(cars,cg);
 labelGround('ASHTON NEW ROAD',55,223,75,6);labelGround('ETIHAD CAMPUS',0,164,58,7);
 // Grass and regulation pitch markings, precisely 105 by 68 m white line to white line.
 const p=kits.pitch,apronMat=mat('#4c7860');
 // The turf is the sole exposed owner of the regulation field. Recess the
 // foundation and cut the surrounding apron out of the field footprint.
 p.box(0,pitch-.42,0,85,.24,126,apronMat);
 const apron=new THREE.Shape();apron.moveTo(-42.5,-63);apron.lineTo(42.5,-63);apron.lineTo(42.5,63);apron.lineTo(-42.5,63);apron.closePath();
 const fieldHole=new THREE.Path();fieldHole.moveTo(-34,-52.5);fieldHole.lineTo(-34,52.5);fieldHole.lineTo(34,52.5);fieldHole.lineTo(34,-52.5);fieldHole.closePath();apron.holes.push(fieldHole);
 const apronGeometry=new THREE.ShapeGeometry(apron);apronGeometry.rotateX(-Math.PI/2);p.geometry(apronGeometry,apronMat,new THREE.Matrix4().makeTranslation(0,pitch,0));apronGeometry.dispose();
 const turf=buildPitchTurf(ctx,layers.pitch,pitch);
 const marking=new THREE.MeshStandardMaterial({color:'#f0f2e9',roughness:.96,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 function line(points,r=.065){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),ox=-dz/len*r,oz=dx/len*r,y=pitch+.054;const vertices=[a[0]-ox,y,a[2]-oz,a[0]+ox,y,a[2]+oz,b[0]+ox,y,b[2]+oz,a[0]-ox,y,a[2]-oz,b[0]+ox,y,b[2]+oz,b[0]-ox,y,b[2]-oz];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();p.geometry(g,marking,new THREE.Matrix4());g.dispose();}}
 const rect=(x1,z1,x2,z2)=>line([[x1,0,z1],[x2,0,z1],[x2,0,z2],[x1,0,z2],[x1,0,z1]]);
 rect(-34,-52.5,34,52.5);line([[-34,0,0],[34,0,0]]);
 const arc=(cx,cz,r,a=0,b=Math.PI*2)=>line(Array.from({length:81},(_,i)=>[cx+Math.cos(a+(b-a)*i/80)*r,0,cz+Math.sin(a+(b-a)*i/80)*r]));arc(0,0,9.15);
 p.cyl(0,pitch+.095,0,.14,.02,M.white);
 for(const s of[-1,1]){rect(-20.16,s*52.5,20.16,s*36);rect(-9.16,s*52.5,9.16,s*47);p.cyl(0,pitch+.095,s*41.5,.13,.02,M.white);const cz=s*41.5;arc(0,cz,9.15,s===-1?.6435:Math.PI+.6435,s===-1?Math.PI-.6435:Math.PI*2-.6435);const zz=s*52.62,back=zz+s*2.1;
  for(const x of[-3.66,3.66]){p.pipe([x,pitch,zz],[x,pitch+2.44,zz],.06,M.white);p.pipe([x,pitch+2.44,zz],[x,pitch+2.44,back],.035,M.white);p.pipe([x,pitch,back],[x,pitch+2.44,back],.035,M.white);}p.pipe([-3.66,pitch+2.44,zz],[3.66,pitch+2.44,zz],.06,M.white);
  for(let x=-3.66;x<3.67;x+=.28)p.pipe([x,pitch,back],[x,pitch+2.44,back],.012,pale);for(let y=.28;y<=2.44;y+=.28)p.pipe([-3.66,pitch+y,back],[3.66,pitch+y,back],.012,pale);
 }
 for(const x of[-34,34])for(const z of[-52.5,52.5]){p.pipe([x,pitch,z],[x,pitch+1.5,z],.035,M.white);p.box(x+.18,pitch+1.32,z,.34,.25,.018,teal);}
 // Perimeter advertising boards, technical dugouts, pitch-side track.
 ring(p,0,2.5,pitch-.03,.12,mat('#536970'));wallRibbon(p,1.6,pitch,pitch+.75,teal);
 for(const s of[-1,1]){sign(layers.pitch,'ETIHAD AIRWAYS',s*42,pitch+.43,0,32,.8,-s*Math.PI/2);sign(layers.pitch,'MANCHESTER CITY',0,pitch+.43,s*64,32,.8,s===1?Math.PI:0);}
 for(const z of[-12,12]){p.box(-40.8,pitch+1.0,z,.22,1.9,10,dark);p.box(-39.6,pitch+.18,z,2.6,.28,10,dark);p.box(-39.5,pitch+2,z,2.8,.15,10.8,roofGlass);for(let i=0;i<13;i++)p.box(-39.2,pitch+.78,z-4.5+i*.7,.7,.55,.5,teal);}
 // Three-tier bowl. Seat positions are explicit geometry, not a flat blue texture.
 const b=kits.bowl,seatPositions=[[],[],[],[]],seatRecords=[];let seatCount=0;
 const bowlSections=createBowlSections(pitch),{tiers,north:northTier,replacedNorth}=bowlSections;
 for(let ti=0;ti<tiers.length;ti++){const t=tiers[ti];for(let row=0;row<t.rows;row++){const off=t.start+row*t.step,y=t.y+row*t.rise,filter=ti>=1?northMask(false):()=>true;ring(b,off,t.step+.018,y,t.rise+.04,concrete,filter);const curve=shape(off+t.seatOffset),length=curve.getLength(),n=Math.floor(length/.64),points=curve.getSpacedPoints(n);for(let i=0;i<n;i++){const q=points[i],next=points[(i+1)%n];const yaw=Math.atan2(-(next.y-q.y),next.x-q.x);if(ti>=1&&!fitsNorthFootprint(q.x,q.y,yaw,false))continue;if(isAisleSeat(i/n,length))continue;seatPositions[(i+row)%23===0?3:(i+row)%3].push([q.x,y+.17,q.y,yaw]);seatRecords.push({id:seatCount,x:q.x,y:y+.17,z:q.y,yaw,tier:t.id,row:row+1});seatCount++;}}
  ring(b,t.start,1.0,t.y+.3,.6,dark,ti>=1?northMask(false):()=>true);ring(b,t.start+t.rows*t.step,2,t.y+t.rows*t.rise+.1,.65,pale,ti>=1?northMask(false):()=>true);
 }
 // North expansion: a deeper continuous upper tier replaces the old north upper geometry.
 for(let row=0;row<northTier.rows;row++){const off=northTier.start+row*northTier.step,y=northTier.y+row*northTier.rise,points=loop(off),filter=northMask(true);ring(b,off,northTier.terraceDepth,y,northTier.rise+.04,concrete,filter);const c=shape(off+northTier.seatOffset),length=c.getLength(),n=Math.floor(length/.64),ps=c.getSpacedPoints(n);for(let i=0;i<n;i++){const q=ps[i],r=ps[(i+1)%n];const yaw=Math.atan2(-(r.y-q.y),r.x-q.x);if(!fitsNorthFootprint(q.x,q.y,yaw,true)||isAisleSeat(i/n,length))continue;seatPositions[(i+row)%3].push([q.x,y+.17,q.y,yaw]);seatRecords.push({id:seatCount,x:q.x,y:y+.17,z:q.y,yaw,tier:"north",row:row+1});seatCount++;}}
 const northJunction=buildNorthJunctionReturns(THREE,{kit:b,loop,north:northTier,tiers,material:concrete});
 const seatDetail=buildStadiumSeats(ctx,{layers,seatPositions,seatMats});
 // Stair plates and handrails. Vomitories now live in stadium-bowl-detail.js
 // (per-tier concourse portals), so the old schematic portal boxes are gone.
 // Handrails follow each aisle axis; no obsolete middle/upper rails cross the new north tier.
 function tierRails(t,north=false){const curves=Array.from({length:t.rows},(_,row)=>shape(t.start+row*t.step+t.seatOffset));for(let i=0;i<AISLE_LAYOUT.count;i++){let previous=null;curves.forEach((curve,row)=>{const q=aisleFrame(curve,i).point,valid=north?q.y<northTier.zBelow&&Math.abs(q.x)<northTier.halfWidth:!(t.id!=='lower'&&q.y<replacedNorth.zBelow&&Math.abs(q.x)<replacedNorth.halfWidth);if(!valid){previous=null;return;}const point=[q.x,t.y+row*t.rise+.65,q.y];if(previous)b.pipe(previous,point,.055,steel);previous=point;});}}
 tiers.forEach(t=>tierRails(t));tierRails(northTier,true);
 // Solid back wall: the stands are a closed concrete volume, not floating rows.
 // It blocks see-through between the seats and the glazed facade.
 // Dark concourse backdrop behind the glazing (kept inside the facade drum so the
 // glass reads as glass, not as a painted wall).
 wallRibbon(b,66.5,-5.2,34.2,mat('#3c4a51'),()=>true);

 // Interior fittings: LED ribbons, vomitories, tunnel, gantry, technical areas.
 const bowlDetail=buildStadiumBowlDetail(ctx,{layers,kits,loop,shape,bowlSections,materials:{concrete,pale,dark,steel,glass,teal},sign,seatPositions});
 // ---------------------------------------------------------------------
 // V9 outer envelope: glazed drum, spandrels, piers, louvre crown, roof
 // fascia/soffit and the eight open spiral towers (stadium-envelope.js).
 // ---------------------------------------------------------------------
 const envelope=buildStadiumEnvelope(ctx,{kits,layers,sign,materials:{concrete,pale,dark,steel,teal,glass,cladding,roofMat,roofGlass,lamp}});
 const towerPositions=towerPositionsFromForm();
 // ---------------------------------------------------------------------
 // Torus-section roof ring: the inner (opening) edge is the high edge and the
 // surface slopes down to the rim, steepening outwards (Arup 2003 p33). The
 // opening is a rounded rectangle; its first 10 m are translucent polycarbonate.
 // ---------------------------------------------------------------------
 const r=kits.roof,roofPoints=[];
 const roof=(t,u)=>roofSample(t,u);
 function roofGrid(uStartOf,uEndOf,NU,material,filter=()=>true){
  const NR=192,pos=[],idx=[];
  for(let i=0;i<=NR;i++){const t=(i%NR)/NR*Math.PI*2,u0=uStartOf(t),u1=uEndOf(t);for(let j=0;j<=NU;j++){const u=u0+(u1-u0)*j/NU;pos.push(...roof(t,u));}}
  for(let i=0;i<NR;i++)for(let j=0;j<NU;j++){const a=i*(NU+1)+j,b=a+1,c=a+NU+1,d=c+1;if(!filter(pos, a, c, d))continue;idx.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();r.geometry(g,material);g.dispose();
 }
 roofGrid(()=>0,t=>glassU(t),6,roofGlass);
 // The legacy torus roof stops at the 2026 north stand: the north sector is
 // replaced by the independent north sheet (north-complex.js), so quads with
 // vertices north of z=-90 are removed to avoid a double roof and z-fighting.
 roofGrid(t=>glassU(t),()=>1,18,roofMat,(pos,a,c,d)=>!((pos[a*3+2]<-90)||(pos[c*3+2]<-90)||(pos[d*3+2]<-90)));
 for(let i=0;i<192;i++)roofPoints.push(roof(i/192*Math.PI*2,1));
 // White fascia around the central opening: the roof reads as a thick sheet,
 // with a deep gutter shadow behind the translucent band (Arup/photo).
 {
  const N=192,edge=[],band=[];
  for(let i=0;i<=N;i++){const t=(i%N)/N*Math.PI*2;edge.push(roof(t,0));}
  for(let i=0;i<N;i++){
   const a=edge[i],b=edge[i+1];
   const ay=a[1],by=b[1];
   band.push(a[0],ay+.02,a[2], b[0],by+.02,b[2], b[0],by-1.25,b[2]);
   band.push(a[0],ay+.02,a[2], b[0],by-1.25,b[2], a[0],ay-1.25,a[2]);
   band.push(a[0],ay-1.25,a[2], b[0],by-1.25,b[2], b[0],by-1.45,b[2]);
   band.push(a[0],ay-1.25,a[2], b[0],by-1.45,b[2], a[0],ay-1.45,a[2]);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(band,3));g.computeVertexNormals();r.geometry(g,pale);g.dispose();
  for(let i=0;i<N;i+=2)r.pipe(edge[i],edge[(i+1)%N],.16,steel);
 }
 // Mullions inside the translucent band follow the radial rafter rhythm.
 for(let i=0;i<192;i+=2){const t=i/192*Math.PI*2,g=glassU(t);r.pipe(roof(t,g),roof(t,g*.12),.075,steel);}
 const surfaceDetail=buildStandingSeams(r,roof,seam,t=>glassU(t));
 // Purlins sit below the sheet (not on it); only the rim-edge beam is visible
 // from outside. Radial rafters are lowered to the structural zone.
 for(const u of[.42,.72])for(let i=0;i<192;i+=2){const a=roof(i/192*Math.PI*2,u),b=roof((i+1)/192*Math.PI*2,u);r.pipe([a[0],a[1]-.30,a[2]],[b[0],b[1]-.30,b[2]],.10,steel);}
 for(let i=0;i<192;i+=4){const a=roof(i/192*Math.PI*2,.06),b=roof(i/192*Math.PI*2,1);r.pipe([a[0],a[1]-.55,a[2]],[b[0],b[1]-.60,b[2]],.12,steel);}
 // 12 documented masts: eight on the ramp towers, four on ground anchors.
 const mastPositions=allMastPositions();
 const roofAssemblies=buildOriginalRoofAssemblies(ctx,{layers,roof,mastPositions,materials:{steel,pale,dark,blueLight,concrete},form:ETIHAD_FORM});
 // 2026 north complex: independent high roof, A-frame headframes, hotel wings,
 // City Square diagrid + ETFE canopy (north-complex.js).
 const northMetrics=buildNorthComplex(ctx,{kits,layers,sign,materials:{pale,dark,steel,teal,glass,cladding,roofMat,roofGlass},roof,random});
 // Under-roof liner, structure, catwalk, lights, speakers and hung screens.
 const interior=buildStadiumInterior(ctx,{layers,kits,roof,glassU,bowlSections,materials:{pale,dark,steel,glass,lamp,blueLight},sign});
 // Trees, entrance bollards, turnstiles, site furniture and ticket gate markers.
 const treeMats=[mat('#728d76'),mat('#8b9e83'),mat('#668575')];for(const s of[-1,1])for(let z=-227;z<180;z+=24){const x=s===-1?-177:154;if(s===1&&z>-130&&z<140)continue;site.cyl(x,2.3,z,.22,3,mat('#7d7568'));site.ball(x,5,z,2.5,3.2,2.6,treeMats[Math.floor(random()*3)]);site.box(x,.95,z,5,.3,5,mat('#98aaa0'));}
 for(let x=-156;x<150;x+=24){site.cyl(x,2.3,181,.22,3,mat('#7d7568'));site.ball(x,5,181,2.5,3.1,2.5,treeMats[Math.floor(random()*3)]);}
 for(let i=0;i<32;i++){const t=i/32*Math.PI*2,x=149*Math.cos(t),z=162*Math.sin(t);if(z<-145)continue;site.pipe([x,.82,z],[x,8,z],.10,steel);site.box(x,8,z,2,.17,.6,lamp);if(i%2===0)sign(layers.site,'CITY',x,5.8,z,1.1,2.8,t,'#679fb6','#e9f3ed');}
 for(let x=-90;x<=90;x+=4)site.cyl(x,1.35,151,.12,1.1,steel);
 for(const s of[-1,1])for(let z=-88;z<=90;z+=22){for(let j=0;j<6;j++){site.box(s*124,1.8,z+j*1.1,.6,1.8,.65,dark);site.pipe([s*124,2.4,z+j*1.1],[s*126,2.4,z+j*1.1],.04,steel);}site.box(s*126,3.6,z+3,7,.3,9,pale);}
 const detail=buildStadiumDetails(ctx,{kits,layers,loop,shape,bowlSections,roof,seatPositions,towerPositions,mastPositions,sign,materials:{concrete,pale,dark,steel,teal,glass,roofMat,roofGlass,lamp,blueLight}});
 const datumControl=buildNorthDatum(scene);

 for(const id of Object.keys(kits))kits[id].flush();
 // Stadium floodlights: illumination scaled to a metre-based scene.
 const floods=[];for(const [x,z]of[[-60,-65],[60,-65],[-60,65],[60,65]]){const l=new THREE.PointLight('#e0efff',0,210,1.6);l.position.set(x,32,z);layers.lighting.add(l);floods.push(l);}
 ctx.obstacles.push({x:0,z:0,w:141,d:146,label:'stadium'},{x:-65,z:-195,w:20,d:35,label:'hotel'},{x:61,z:-190,w:22,d:32,label:'retail'});
 // Closed road loop kept within the initial scene footprint.
 const trafficCurve=makePath([[[218,193],[218,-238]],[[218,-238],[218,-245],[226,-245],[226,-238]],[[226,-238],[226,201]],[[226,201],[226,209],[218,209],[210,209]],[[210,209],[-221,209]],[[-221,209],[-231,209],[-231,201],[-221,201]],[[-221,201],[210,201]],[[210,201],[218,201],[218,201],[218,193]]]);
 const roadPoints=trafficCurve.getSpacedPoints(500).map(q=>[q.x,q.z]);
 return {parking:{bays:parkingBays,activeZ:activeParkingZ},layers,specs,seatCount,seatRecords,floods,detail,roofAssemblies,northMetrics,envelope,seatDetail,bowlDetail,interior,datumControl,bowlSections,northJunction,turf,surfaceDetail,area:470*500,buildings:[{id:'etihad',evidence:'C'},{id:'north-extension',evidence:'B/C'}],roadPoints,roadWidth:19,
 lanes:[{id:'access',entry:'access',axis:'LOOP',curve:trafficCurve,stopPoint:[218,180],exitDistance:20}],junction:{x:222,z:205,w:12,d:12},
 footRoutes:[[[ -158,-135],[-158,145],[150,145],[150,-135]],[[-120,-238],[120,-238],[120,-233],[-120,-233]]],crossings:[],activities:[{x:-147,z:120,mode:'taking-photo'},{x:-148,z:123,mode:'socializing'},{x:35,z:153,mode:'taking-photo'}],signals:[]};
}
