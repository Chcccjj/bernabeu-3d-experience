import * as THREE from 'three';

// Short stadium turf: 2 m repeat, leaf-scale normal/roughness, directional pile,
// plus a bounded near-camera blade field. No extra land or post-process blur.
// Appearance is photo-fitted; this is not a claim about the installed grass mix.
function rng(){let s=194932;return()=>{s=Math.imul(1664525,s)+1013904223|0;return(s>>>0)/4294967296;};}
export function turfStripe(z){return Math.floor((z+52.5)/5.25)%2===0?0:1;}
function pileMaterial(material,blades=false){
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vTurfWorld;');
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 turfWorld=vec4(transformed,1.0);
   #ifdef USE_INSTANCING
    turfWorld=instanceMatrix*turfWorld;
   #endif
   vTurfWorld=(modelMatrix*turfWorld).xyz;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vTurfWorld;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float stripe=mod(floor((vTurfWorld.z+52.5)/5.25),2.0);
   vec3 eye=normalize(cameraPosition-vTurfWorld);
   float lay=(stripe*2.0-1.0)*eye.z;
   // Cut direction changes the light response instead of painting hard flat boxes.
   diffuseColor.rgb*=mix(.90,1.06,stripe)+lay*.055;
   float field=sin(vTurfWorld.x*.71+sin(vTurfWorld.z*.29))*sin(vTurfWorld.z*.83+vTurfWorld.x*.11);
   diffuseColor.rgb*=1.0+field*.025;
   ${blades?`if(abs(vTurfWorld.x)>34.0||abs(vTurfWorld.z)>52.5)discard;
    float d=length(cameraPosition-vTurfWorld);
    float keep=1.0-smoothstep(9.0,13.0,d);
    float stipple=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
    if(stipple>keep)discard;`:''}`);
 };
 material.customProgramCacheKey=()=>blades?'etihad-turf-blades-v1':'etihad-turf-pile-v1';
 return material;
}
export function buildPitchTurf(ctx,parent,level){
 const random=rng(),N=1024,base=new Float32Array(N*N);base.fill(.57);
 // Random short, narrow blades over a fine sward: no large gravel-like noise.
 for(let i=0;i<200000;i++){
  const x=Math.floor(random()*N),z=Math.floor(random()*N),len=4+Math.floor(random()*13),bend=(random()-.5)*3,value=.30+random()*.65;
  for(let j=0;j<len;j++){const xx=(x+Math.round(bend*j/len)+N)%N,zz=(z+j)%N,idx=zz*N+xx;base[idx]=value*(.75+.25*j/len);}
 }
 const color=new Uint8Array(N*N*4),normal=new Uint8Array(N*N*4),rough=new Uint8Array(N*N*4);
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){
  const i=z*N+x,k=i*4,v=base[i],dx=base[z*N+(x+1)%N]-base[z*N+(x+N-1)%N],dy=base[((z+1)%N)*N+x]-base[((z+N-1)%N)*N+x];
  const shade=164+Math.round(v*82);color.set([shade-5,shade,shade-12,255],k);
  const nx=-dx*.65,ny=-dy*.35,inv=1/Math.hypot(nx,ny,1);normal.set([Math.round(nx*inv*127+128),Math.round(ny*inv*127+128),Math.round(inv*127+128),255],k);
  const r=220+Math.round(v*30);rough.set([r,r,r,255],k);
 }
 function texture(data,srgb=false){const t=new THREE.DataTexture(data,N,N);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(34,52.5);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=Math.min(8,ctx.renderer?.capabilities.getMaxAnisotropy()??1);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;}
 const material=pileMaterial(new THREE.MeshStandardMaterial({name:'Short-cut turf / directional pile',color:'#39752c',map:texture(color,true),normalMap:texture(normal),normalScale:new THREE.Vector2(.48,.48),roughnessMap:texture(rough),roughness:.96}));
 const plane=new THREE.PlaneGeometry(68,105);plane.rotateX(-Math.PI/2);
 const surface=new THREE.Mesh(plane,material);surface.name='regulation_turf_continuous_surface';surface.position.y=level+.045;surface.receiveShadow=true;parent.add(surface);
 const tileCount=10,tuftsPerTile=768,tileSize=3,count=tileCount*tileCount*tuftsPerTile,g=new THREE.BufferGeometry();
 // Three bent leaves per tuft, each with a rooted lower segment and tapered tip.
 const positions=[],colors=[];
 for(let leaf=0;leaf<3;leaf++){
  const a=leaf*2.094,w=.0027,dx=Math.cos(a),dz=Math.sin(a),h=.029+leaf*.003;
  const points=[[-dz*w,0,dx*w],[dz*w,0,-dx*w],[-dz*w*.55+dx*.004,h*.62,dx*w*.55+dz*.004],[dz*w*.55+dx*.004,h*.62,-dx*w*.55+dz*.004],[dx*.009,h,dz*.009]];
  for(const ix of[0,1,2,1,3,2,2,3,4]){positions.push(...points[ix]);const v=ix<2?.54:ix<4?.85:1;colors.push(.56*v,.88*v,.36*v);}
 }
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
 const bladeMat=pileMaterial(new THREE.MeshStandardMaterial({name:'Near-field turf leaves / metre scale',color:'#8eaf65',vertexColors:true,roughness:1,side:THREE.DoubleSide}),true);
 const blades=new THREE.InstancedMesh(g,bladeMat,count),dummy=new THREE.Object3D();blades.name='turf_nearfield_blades';blades.frustumCulled=false;blades.receiveShadow=true;blades.castShadow=false;blades.userData.exportExclude=true;
 const tuftSeed=Array.from({length:tuftsPerTile},()=>({x:random()*tileSize,z:random()*tileSize,yaw:random()*Math.PI*2,scale:.72+random()*.55}));
 let instance=0;for(let ix=0;ix<tileCount;ix++)for(let iz=0;iz<tileCount;iz++)for(const tuft of tuftSeed){dummy.position.set((ix-tileCount/2)*tileSize+tuft.x,0,(iz-tileCount/2)*tileSize+tuft.z);dummy.rotation.set(0,tuft.yaw,0);dummy.scale.setScalar(tuft.scale);dummy.updateMatrix();blades.setMatrixAt(instance++,dummy.matrix);}
 blades.visible=false;blades.position.y=level+.045;parent.add(blades);
 const direction=new THREE.Vector3();let active=false;
 ctx.lodUpdates??=[];ctx.lodUpdates.push(camera=>{
  const height=camera.position.y-(level+.045);active=height>0&&height<(active?12:10);blades.visible=active;if(!active)return;
  camera.getWorldDirection(direction);const d=direction.y<-.12?Math.min(8,height/-direction.y):3;
  const x=camera.position.x+direction.x*d,z=camera.position.z+direction.z*d;
  blades.position.set(Math.round(x/tileSize)*tileSize,level+.045,Math.round(z/tileSize)*tileSize);blades.updateMatrix();
 });
 return {surface,blades,metrics:{surfaceMetres:[68,105],textureTileMetres:2,bladeHeightMetres:[.021,.045],nearTufts:count,leavesPerTuft:3,nearDrawCalls:1,nearRadiusMetres:13,stableWorldTileMetres:tileSize,evidence:'B photo appearance; C grass species, pile and mowing width'}};
}
