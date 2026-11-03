import * as THREE from 'three';

// Families observed in Arup / Populous photographs. Rendering values are visual
// fits, not measured reflectance. V11 architecture uses physically based materials.
export function createStadiumMaterials(mat){
 const standard=(name,color,roughness,metalness)=>{const m=new THREE.MeshStandardMaterial({name,color,roughness,metalness,side:THREE.DoubleSide});m.userData={materialEvidence:'photograph-based appearance fit'};return m;};
 const roofMat=standard('Natural aluminium / weathered standing-seam roof','#8f9a9d',.86,.34);
 roofMat.userData.roofSurface=true;roofMat.userData.source='Kalzip Etihad reference: 65/400, natural aluminium, stucco finish';
 const roofVariants=['#a4adb0','#a9b1b3','#aeb6b8'].map(c=>{const m=roofMat.clone();m.color.set(c);return m;});
 const roofGlass=standard('Polycarbonate daylight strip / translucent display approximation','#cfdcdd',.55,.02);
 roofGlass.transparent=true;roofGlass.opacity=.82;roofGlass.depthWrite=true;roofGlass.polygonOffset=true;roofGlass.polygonOffsetFactor=-1;roofGlass.polygonOffsetUnits=-1;roofGlass.depthWrite=true;roofGlass.userData.noShadow=true;roofGlass.userData.roofSurface=true;roofGlass.userData.source='Arup Journal 2003 p33: transparent polycarbonate inner 10m';
 const glass=standard('Glazing / reflected sky approximation','#2f4b57',.14,.60);
 const cladding=standard('Silver-grey facade panels','#a3abad',.60,.28);
 const pale=standard('Light painted steel / liner','#ccd1cd',.72,.10);pale.userData.stadiumFinish='light-painted';
 const seam=roofMat.clone();seam.color.set('#7a8588');seam.name='Aluminium standing seam / nominal folded profile';seam.userData={noShadow:true,detail:'Sub-shadow-texel folds retain geometry without aliased shadow-map silhouettes'};
 // Close-range realism: structure, cladding and frames use physically-shaded
// surfaces with roughness/metalness instead of the flat toon ramp. The overall
// linework style is kept; only material response changes.
 const concrete=standard('Concrete / precast seating deck','#9da19b',.94,.02);
 const dark=standard('Dark steel / shadowed soffit','#2f3d44',.58,.45);
 const steel=standard('Structural steel','#68767c',.42,.72);
 const teal=standard('Club teal metalwork','#5f93aa',.55,.35);
 return {concrete,pale,dark,steel,teal,glass,cladding,roofMat,roofGlass,roofVariants,seam,seatMats:['#6ba5c7','#78b2ce','#86bdd4','#416b88'].map(c=>mat(c))};
}

// Narrow folded upstands share the exact roof triangles; they are not a second
// opaque skin. 65mm is the nominal profile family, panel layout remains inferred.
export function buildStandingSeams(kit,roof,material,innerU=.16){
 const facets=192,count=Math.ceil(2*Math.PI*131/.55),positions=[];
 function segment(a,b){const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<1e-6)return;const sx=-dz/length*.008,sz=dx/length*.008,v=[];for(const p of[a,b])for(const h of[-.003,.028])for(const s of[-1,1])v.push([p[0]+sx*s,p[1]+h,p[2]+sz*s]);for(const i of[0,1,3,0,3,2,4,6,7,4,7,5,0,4,5,0,5,1,2,3,7,2,7,6,0,2,6,0,6,4,1,5,7,1,7,3])positions.push(...v[i]);}
 const steps=[0,.18,.36,.54,.72,.86,1];
 for(let i=0;i<count;i++){
  const angle=i/count*Math.PI*2;
  // follow the curved surface rather than a straight chord between edges
  let prev=null;
  const u0=typeof innerU==='function'?innerU(angle):innerU;
  for(const f of steps){const u=u0+(1-u0)*f;const p=roof(angle,u);if(prev)segment(prev,p);prev=p;}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();kit.geometry(g,material);g.dispose();return {seams:count,nominalHeight:.065,outerPitchApprox:.55,layoutEvidence:'C - radial distribution over the fitted torus surface'};
}
