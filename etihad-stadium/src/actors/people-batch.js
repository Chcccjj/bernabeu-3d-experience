import * as THREE from 'three';
import {createActors} from './models.js';
import {createRandom} from '../core/random.js';
// Reuse the existing Little Worlds character, baked once. Limbs animate on GPU;
// the crowd carries only one root transform per person, not live scene hierarchies.
export function createPeopleBatch(ctx,count,{name='people',seed=417,athlete=false,coarse=false}={}){
 const cheapRound=coarse?new THREE.IcosahedronGeometry(1,0):null,sandbox=new THREE.Scene(),factory=createActors({...ctx,batch:cheapRound?{...ctx.batch,geo:{...ctx.batch.geo,round:cheapRound}}:ctx.batch,scene:sandbox,...createRandom(seed)}),person=factory.character(4),shirt=person.root.children[0].material;
 if(athlete){for(const leg of person.legs){const shorts=leg.children[0];shorts.material=ctx.M.white;shorts.userData.teamShorts=true;shorts.position.y=-.09;shorts.scale.y=.18;factory.part(leg,'box',ctx.M.skin1,0,-.23,0,.10,.17,.12);factory.part(leg,'box',ctx.M.white,0,-.33,0,.105,.15,.125);}for(const arm of person.arms){arm.children[0].position.y=-.045;arm.children[0].scale.y=.13;factory.part(arm,'box',ctx.M.skin1,0,-.19,0,.08,.19,.1);}}
 person.root.updateMatrixWorld(true);const positions=[],normals=[],colors=[],pivots=[],limbs=[],cloth=[];const v=new THREE.Vector3(),n=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
 person.root.traverse(mesh=>{if(!mesh.isMesh)return;const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry;normalMatrix.getNormalMatrix(mesh.matrixWorld);let limb=0,pivot=new THREE.Vector3();for(let i=0;i<2;i++){let node=mesh;while(node&&node!==person.root){if(node===person.legs[i]||node===person.arms[i]){limb=(node===person.legs[i]?1:-.72)*(i?1:-1);node.getWorldPosition(pivot);break;}node=node.parent;}}
  const c=mesh.material===shirt||mesh.userData.teamShorts?new THREE.Color('#ffffff'):mesh.material.color;
  for(let i=0;i<g.attributes.position.count;i++){v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(mesh.matrixWorld);n.fromBufferAttribute(g.attributes.normal,i).applyMatrix3(normalMatrix).normalize();positions.push(...v);normals.push(...n);colors.push(c.r,c.g,c.b);pivots.push(...pivot);limbs.push(limb);cloth.push(mesh.userData.teamShorts?2:mesh.material===shirt?1:0);}if(g!==mesh.geometry)g.dispose();
 });
 cheapRound?.dispose();const foot=Math.min(...positions.filter((_,i)=>i%3===1));for(let i=1;i<positions.length;i+=3){positions[i]-=foot;pivots[i]-=foot;}
 const geometry=new THREE.BufferGeometry();for(const[key,array,size]of[['position',positions,3],['normal',normals,3],['color',colors,3],['aHumanPivot',pivots,3],['aHumanLimb',limbs,1],['aHumanCloth',cloth,1]])geometry.setAttribute(key,new THREE.Float32BufferAttribute(array,size));
 const motion=new Float32Array(count*2);for(let i=0;i<count;i++){motion[i*2]=i*2.399963;motion[i*2+1]=1;}const motionAttr=new THREE.InstancedBufferAttribute(motion,2);motionAttr.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('aHumanMotion',motionAttr);
 const time={value:0},material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.92});material.onBeforeCompile=shader=>{shader.uniforms.uHumanTime=time;shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
 attribute vec3 aHumanPivot; attribute float aHumanLimb; attribute float aHumanCloth; attribute vec2 aHumanMotion; uniform float uHumanTime;
 vec3 humanRotate(vec3 v,float a){float c=cos(a),s=sin(a);return vec3(v.x,v.y*c-v.z*s,v.y*s+v.z*c);}`)
 .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
 float humanAngle=sin(uHumanTime*7.0+aHumanMotion.x)*.48*aHumanLimb*aHumanMotion.y;
 objectNormal=humanRotate(objectNormal,humanAngle);`)
 .replace('#include <begin_vertex>',`#include <begin_vertex>
 transformed=humanRotate(transformed-aHumanPivot,humanAngle)+aHumanPivot;
 transformed.y+=abs(sin(uHumanTime*7.0+aHumanMotion.x))*.022*aHumanMotion.y;`)
 .replace('#include <color_vertex>',`#if defined(USE_COLOR) || defined(USE_COLOR_ALPHA)
 vColor=vec3(1.0);
 #ifdef USE_COLOR
 vColor*=color;
 #endif
 #ifdef USE_INSTANCING_COLOR
 if(aHumanCloth>.5&&aHumanCloth<1.5)vColor*=instanceColor;
 if(aHumanCloth>1.5)vColor*=instanceColor.r>instanceColor.b?vec3(.08,.10,.13):vec3(.97);
 #endif
 #endif`);};material.customProgramCacheKey=()=> 'etihad-articulated-human-v1';
 const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.name=name;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=false;const dummy=new THREE.Object3D(),color=new THREE.Color();
 function set(index,x,y,z,yaw=0,scale=1,stride=1,shirtColor='#75b5d9'){dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.setScalar(scale);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);motion[index*2+1]=stride;mesh.setColorAt(index,color.set(shirtColor));}
 return {mesh,set,update(t){time.value=t;mesh.instanceMatrix.needsUpdate=true;motionAttr.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;},dispose(){geometry.dispose();material.dispose();mesh.removeFromParent();}};
}
