import * as THREE from 'three';
import {createActors} from './models.js';
import {createRandom} from '../core/random.js';
// The same car silhouette, wheels and glazing as the animated fleet, baked once.
export function createParkedCars(ctx,bays){
 const scene=new THREE.Scene(),factory=createActors({...ctx,scene,...createRandom(943)}),car=factory.car('car',ctx.mat('#ffffff')),paint=car.root.children[0].material;car.root.position.set(0,0,0);car.root.scale.setScalar(1.6);car.root.updateMatrixWorld(true);
 const p=[],n=[],c=[],mask=[],v=new THREE.Vector3(),normal=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
 car.root.traverse(mesh=>{if(!mesh.isMesh)return;const geo=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry;normalMatrix.getNormalMatrix(mesh.matrixWorld);for(let i=0;i<geo.attributes.position.count;i++){v.fromBufferAttribute(geo.attributes.position,i).applyMatrix4(mesh.matrixWorld);normal.fromBufferAttribute(geo.attributes.normal,i).applyMatrix3(normalMatrix).normalize();p.push(...v);n.push(...normal);c.push(mesh.material.color.r,mesh.material.color.g,mesh.material.color.b);mask.push(mesh.material===paint?1:0);}if(geo!==mesh.geometry)geo.dispose();});
 const geometry=new THREE.BufferGeometry();for(const[key,array,size]of[['position',p,3],['normal',n,3],['color',c,3],['aCarPaint',mask,1]])geometry.setAttribute(key,new THREE.Float32BufferAttribute(array,size));
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.2});material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float aCarPaint;').replace('#include <color_vertex>',`#ifdef USE_COLOR
 vColor=color;
 #ifdef USE_INSTANCING_COLOR
 vColor*=mix(vec3(1.0),instanceColor,aCarPaint);
 #endif
 #endif`);};material.customProgramCacheKey=()=> 'etihad-parked-cars-v1';
 const mesh=new THREE.InstancedMesh(geometry,material,bays.length),dummy=new THREE.Object3D(),color=new THREE.Color(),palette=['#658fa4','#d2d6cf','#8e9995','#374e60','#a35850','#c6bda6'];bays.forEach((b,i)=>{dummy.position.set(b.x,.92,b.z);dummy.rotation.set(0,Math.PI/2,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,color.set(palette[i%palette.length]));});mesh.computeBoundingSphere();mesh.name='detailed_daily_parked_fleet';mesh.receiveShadow=true;return mesh;
}
