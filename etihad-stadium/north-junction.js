// A single fitted replacement boundary shared by decks, seats and fittings.
// C evidence: this closes a modelling gap, not a surveyed construction joint.
export const NORTH_BOUNDARY={zBelow:-75,halfWidth:74,evidence:'C fitted junction'};
const planes=[p=>p[0]+NORTH_BOUNDARY.halfWidth,p=>NORTH_BOUNDARY.halfWidth-p[0],p=>NORTH_BOUNDARY.zBelow-p[2]];
function half(poly,dist,inside){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],da=dist(a)*(inside?1:-1),db=dist(b)*(inside?1:-1),ia=da>=-1e-9,ib=db>=-1e-9;
  if(ia)out.push(a);
  if(ia!==ib){const t=da/(da-db);out.push(a.map((v,k)=>v+(b[k]-v)*t));}
 }
 return out;
}
export function clipNorthPolygon(poly,keepInside){
 let rest=poly;const outside=[];
 for(const plane of planes){if(!rest.length)break;const part=half(rest,plane,false);if(part.length>=3)outside.push(part);rest=half(rest,plane,true);}
 return keepInside?(rest.length>=3?[rest]:[]):outside;
}
export function northMask(inside=true){const f=p=>(p.y<NORTH_BOUNDARY.zBelow&&Math.abs(p.x)<NORTH_BOUNDARY.halfWidth)===inside;f.clipNorth=inside?'inside':'outside';return f;}

// Test the full rotated footprint, not just its centre. A seat whose centre
// passed the old mask could still penetrate the neighbouring rake/cheek.
export function fitsNorthFootprint(x,z,yaw,inside,halfWidth=.30,halfDepth=.36){
 const c=Math.cos(yaw),s=Math.sin(yaw),poly=[];
 for(const [u,v] of [[-halfWidth,-halfDepth],[halfWidth,-halfDepth],[halfWidth,halfDepth],[-halfWidth,halfDepth]])poly.push([x+u*c+v*s,0,z-u*s+v*c]);
 if(inside)return poly.every(p=>planes.every(d=>d(p)>.025));
 return clipNorthPolygon(poly,true).length===0;
}

// Structural cheek infill between the two independently fitted rakes. Kept
// below tread tops: no invented extra seat rows or room/egress arrangement.
export function buildNorthJunctionReturns(THREE,{kit,loop,north,tiers,material}){
 const positions=[];let panels=0;
 function oldHeight(off){
  const t=off<tiers[1].start?tiers[0]:off<tiers[2].start?tiers[1]:tiers[2];
  return t.y+Math.min(t.rows,Math.max(0,Math.floor((off-t.start)/t.step)))*t.rise;
 }
 for(let row=0;row<north.rows;row++){
  const off=north.start+row*north.step,y=north.y+row*north.rise,a=loop(off),b=loop(off+north.step),below=oldHeight(off+north.step*.5);
  for(let i=0;i<a.length-1;i++){
   const polys=clipNorthPolygon([[a[i].x,y,a[i].y],[a[i+1].x,y,a[i+1].y],[b[i+1].x,y,b[i+1].y],[b[i].x,y,b[i].y]],true);
   for(const poly of polys)for(let j=0;j<poly.length;j++){
    const p=poly[j],q=poly[(j+1)%poly.length];
    const onCut=planes.some(d=>Math.abs(d(p))<1e-7&&Math.abs(d(q))<1e-7);
    if(!onCut||Math.hypot(p[0]-q[0],p[2]-q[2])<.001||Math.abs(y-below)<.015)continue;
    const lo=Math.min(y,below)-.06,hi=Math.max(y,below),v=[[p[0],lo,p[2]],[q[0],lo,q[2]],[q[0],hi,q[2]],[p[0],hi,p[2]]];
    for(const k of[0,1,2,0,2,3])positions.push(...v[k]);panels++;
   }
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();const cheek=material.clone();cheek.side=THREE.DoubleSide;cheek.name='North/side bowl fitted structural returns';kit.geometry(geometry,cheek);geometry.dispose();return{panels,evidence:'C fitted closure between existing profiles'};
}
