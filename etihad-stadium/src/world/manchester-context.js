import * as THREE from 'three';
import {cameraPositionAllowed} from '../experience/camera-paths.js';
// Manchester context, adapted from the collaborator's instanced-city approach.
// Nearby road directions are source-based; distant buildings are an atmospheric
// reconstruction, not surveyed footprints or named Manchester landmarks.
export function buildManchesterContext(ctx){
 const group=new THREE.Group();group.name='Manchester / extended city context';group.userData.exportExclude=true;ctx.scene.add(group);
 let seed=18942026;const random=()=>{seed=Math.imul(seed,1664525)+1013904223|0;return(seed>>>0)/4294967296;};
 const bins=new Map(),box=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
 const ground=new THREE.MeshStandardMaterial({color:'#929d90',roughness:1}),road=new THREE.MeshStandardMaterial({color:'#505c61',roughness:.96}),paving=new THREE.MeshStandardMaterial({color:'#b5b8af',roughness:.98}),roof=new THREE.MeshStandardMaterial({color:'#525e63',roughness:.86}),white=new THREE.MeshStandardMaterial({color:'#bcc6c1',roughness:1}),trunk=new THREE.MeshStandardMaterial({color:'#776759',roughness:1}),leaf=new THREE.MeshStandardMaterial({color:'#617662',roughness:1});
 function put(material,x,y,z,w,h,d,ry=0){
  if(!bins.has(material))bins.set(material,[]);
  const add=(a,b,c,e)=>{if(c>.001&&e>.001)bins.get(material).push({x:a,y,z:b,w:c,h,d:e,ry});};
  // The original campus owns its paving: split exterior ground sheets at its edge.
  if(y<1&&h<.3&&x+w/2>-235&&x-w/2<235&&z+d/2>-255&&z-d/2<245){
   const l=x-w/2,r=x+w/2,b=z-d/2,t=z+d/2,il=Math.max(l,-235),ir=Math.min(r,235);
   if(l< -235)add((l-235)/2,z,-235-l,d);if(r>235)add((r+235)/2,z,r-235,d);
   if(b< -255)add((il+ir)/2,(b-255)/2,ir-il,-255-b);if(t>245)add((il+ir)/2,(t+245)/2,ir-il,t-245);
  }else add(x,z,w,d);
 }
 const roadXs=[222,-326,-620,-1000,550,930,1310,1690],roadZs=[205,335,650,990,1330,-350,-680,-1010,-1340];
 const sheet=new THREE.Shape();sheet.moveTo(-3600,-3600);sheet.lineTo(3600,-3600);sheet.lineTo(3600,3600);sheet.lineTo(-3600,3600);sheet.closePath();const hole=new THREE.Path();hole.moveTo(-235,-245);hole.lineTo(-235,255);hole.lineTo(235,255);hole.lineTo(235,-245);hole.closePath();sheet.holes.push(hole);const land=new THREE.ShapeGeometry(sheet);land.rotateX(-Math.PI/2);const landMesh=new THREE.Mesh(land,ground);landMesh.position.y=.78;landMesh.receiveShadow=true;group.add(landMesh);
 function facade(base){const n=128,h=256,data=new Uint8Array(n*h*4),lit=new Uint8Array(n*h*4),c=new THREE.Color(base).convertLinearToSRGB();for(let y=0;y<h;y++)for(let x=0;x<n;x++){const k=(y*n+x)*4,wx=x%32,wy=y%40,window=wx>8&&wx<23&&wy>11&&wy<31,bond=(y%8===0)||((x+(Math.floor(y/8)%2)*8)%16===0),v=window?.32:bond?.87:.94+random()*.10;data.set([Math.round(c.r*255*v),Math.round(c.g*255*v),Math.round(c.b*255*v),255],k);const warm=window&&Math.floor(x/32+Math.floor(y/40)*13)%5===0;lit.set(warm?[255,195,114,255]:[0,0,0,255],k);}const texture=d=>{const t=new THREE.DataTexture(d,n,h);t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;};const m=new THREE.MeshStandardMaterial({map:texture(data),roughness:.9,emissive:'#ffd3a0',emissiveMap:texture(lit),emissiveIntensity:0});m.userData.nightEmission=.8;(ctx.emissives??=[]).push(m);return m;}
 const walls=['#a77c67','#bd9681','#89685d','#b3b4ac','#88999e'].map(facade);
 // Main campus edges: Ashton New Road south, Alan Turing Way east.
 for(const x of[222,-326,-620,-1000,550,930,1310,1690]){put(road,x,.81,0,x===222?20:15,.05,5800);for(const s of[-1,1])put(paving,x+s*11,.84,0,2,.12,5800);for(let z=-2700;z<2800;z+=18)if(Math.abs(z)>260)put(white,x,.85,z,.16,.018,6);}
 for(const z of[205,335,650,990,1330,-350,-680,-1010,-1340]){put(road,0,.81,z,5800,.05,z===205?19:14);for(const s of[-1,1])put(paving,0,.84,z+s*10,5800,.12,1.8);for(let x=-2800;x<2800;x+=18)if(Math.abs(x)>245)put(white,x,.85,z,6,.018,.16);}
 // Keep the immediate campus open. Housing/industrial blocks sit beyond it;
 // northeast is deliberately greener in the direction of Philips Park.
 const footprints=[],gables=[];let buildings=0;
 for(let ix=-23;ix<=23;ix++)for(let iz=-22;iz<=22;iz++){
  const x=ix*112+random()*14,z=iz*110+random()*14;
  if((Math.abs(x)<350&&z>-350&&z<345)||Math.hypot(x,z)>2900)continue;
  if(x>300&&x<1000&&z<-300&&z>-1030&&random()<.88)continue;
  if([222,-326,-620,-1000,550,930,1310,1690].some(v=>Math.abs(x-v)<42)||[205,335,650,990,1330,-350,-680,-1010,-1340].some(v=>Math.abs(z-v)<34))continue;
  const distance=Math.hypot(x,z),industrial=distance<950&&random()<.27;
  const plots=industrial?[[0,0,65,68]]:[[-23,-18,29,39],[23,-18,29,39],[0,29,78,22]];
  for(const [ox,oz,w,d]of plots){const px=x+ox,pz=z+oz,h=industrial?8+random()*6:9+Math.floor(random()*5)*3.15;
   if(roadXs.some(v=>Math.abs(px-v)<w/2+14)||roadZs.some(v=>Math.abs(pz-v)<d/2+13))continue;
   footprints.push({x:px,z:pz,w,d,h});put(walls[Math.floor(random()*(industrial?5:4))],px,.82+h/2,pz,w,h,d);put(roof,px,.82+h+.18,pz,w+.5,.36,d+.5);buildings++;
   if(distance<1050){put(paving,px,.84,pz,w+2,.12,d+2);if(industrial)put(roof,px+3,h+1.6,pz-4,5,1.5,3);else gables.push({x:px,y:.82+h,z:pz,w:w+1,h:3.5,d:d+1});for(const side of[-1,1])put(white,px,h+.65,pz+side*d/2,w,.6,.3);}
  }
 }
 // Distant western/southwestern high-rise rhythm, without naming or pretending
 // that these fitted silhouettes are surveyed towers.
 for(let i=0;i<35;i++){const x=-1050-random()*1000,z=350+random()*1200,h=38+random()*110,w=22+random()*25;footprints.push({x,z,w,d:w*.85,h});put(walls[4],x,.82+h/2,z,w,h,w*.85);put(roof,x,.82+h+.5,z,w+1,1,w*.85);buildings++;}
 const carMats=['#647d89','#a7aaa0','#384a55','#9b6f5d'].map(color=>new THREE.MeshStandardMaterial({color,roughness:.42,metalness:.3})),carGlass=new THREE.MeshStandardMaterial({color:'#405968',roughness:.24,metalness:.4});
 for(let i=0;i<170;i++){const horizontal=i%2===0,x=horizontal?(random()-.5)*3500:[-326,550,930][i%3]+(i%4<2?5:-5),z=horizontal?[335,650,-350,-680][i%4]+(i%3?4:-4):(random()-.5)*3000;if(Math.abs(x)<250&&z>-260&&z<250)continue;put(carMats[i%4],x,1.45,z,horizontal?4.4:1.85,1.2,horizontal?1.85:4.4);put(carGlass,x,2.08,z,horizontal?2.5:1.6,.55,horizontal?1.6:2.5);}
 const lampMat=new THREE.MeshStandardMaterial({color:'#c3b78f',emissive:'#ffd29a',emissiveIntensity:0});lampMat.userData.nightEmission=1.6;(ctx.emissives??=[]).push(lampMat);for(let z=-1100;z<1300;z+=48)for(const x of[-336,560]){put(roof,x,5.82,z,.12,10,.12);put(lampMat,x+1.2,10.9,z,2.8,.18,.5);}
 const treeGeometry=new THREE.IcosahedronGeometry(1,1),trees=[];
 for(let i=0;i<650;i++){const x=(random()-.5)*4400,z=(random()-.5)*4400;if(Math.abs(x)<270&&z>-280&&z<270)continue;const park=x>300&&x<1000&&z<-300&&z>-1050;if(!park&&random()>.3)continue;if(footprints.some(b=>Math.abs(x-b.x)<b.w/2+4&&Math.abs(z-b.z)<b.d/2+4)||roadXs.some(v=>Math.abs(x-v)<13)||roadZs.some(v=>Math.abs(z-v)<12))continue;const h=5+random()*4;put(trunk,x,.82+h/2,z,.35,h,.35);trees.push([x,h+1,z]);}
 for(const[m,items]of bins){const mesh=new THREE.InstancedMesh(box,m,items.length);mesh.name='Manchester context / '+(m.map?'facade':'urban furniture');items.forEach((v,i)=>{dummy.position.set(v.x,v.y,v.z);dummy.scale.set(v.w,v.h,v.d);dummy.rotation.set(0,v.ry,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.computeBoundingSphere();mesh.receiveShadow=true;mesh.castShadow=false;group.add(mesh);}
 const roofPositions=[],roofVerts=[[-.5,0,-.5],[.5,0,-.5],[-.5,1,0],[.5,1,0],[-.5,0,.5],[.5,0,.5]];
 for(const tri of [[0,2,1],[1,2,3],[2,4,3],[3,4,5],[0,4,2],[1,3,5]])for(const ix of tri)roofPositions.push(...roofVerts[ix]);
 const gableGeo=new THREE.BufferGeometry();gableGeo.setAttribute('position',new THREE.Float32BufferAttribute(roofPositions,3));gableGeo.computeVertexNormals();const gableRoofs=new THREE.InstancedMesh(gableGeo,roof,gables.length);gables.forEach((v,i)=>{dummy.position.set(v.x,v.y,v.z);dummy.scale.set(v.w,v.h,v.d);dummy.rotation.set(0,0,0);dummy.updateMatrix();gableRoofs.setMatrixAt(i,dummy.matrix);});gableRoofs.computeBoundingSphere();group.add(gableRoofs);
 const foliage=new THREE.InstancedMesh(treeGeometry,leaf,trees.length);trees.forEach(([x,y,z],i)=>{dummy.position.set(x,y,z);dummy.scale.set(3.2,4,3.2);dummy.rotation.set(0,0,0);dummy.updateMatrix();foliage.setMatrixAt(i,dummy.matrix);});foliage.computeBoundingSphere();group.add(foliage);
 ctx.worldNavigationAllowed=p=>{if(cameraPositionAllowed(p))return true;if(Math.abs(p.x)<235&&p.z>-255&&p.z<245)return false;if(Math.abs(p.x)>2600||Math.abs(p.z)>2600||p.y<2.52||p.y>350)return false;return !footprints.some(b=>Math.abs(p.x-b.x)<b.w/2+.5&&Math.abs(p.z-b.z)<b.d/2+.5&&p.y<b.h+2.5);};if(ctx.controls)ctx.controls.maxTargetRadius=2600;
 return {group,buildings,footprints,extent:6000,evidence:'B main road directions; C procedural Manchester atmosphere',setVisible(value){group.visible=value;}};
}
