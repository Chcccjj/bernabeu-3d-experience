import * as THREE from 'three';
export function createMatchday(ctx,layout){
 const group=new THREE.Group();group.name='matchday_spectators';group.visible=false;layout.layers.seats.add(group);
 const positions=[];ctx.scene.updateMatrixWorld(true);const seat=layout.layers.seats.children.filter(o=>o.isInstancedMesh&&(o.name.startsWith('matchday_seats_detailed_')||o.name.startsWith('matchday_seats_upper_'))),matrix=new THREE.Matrix4();
 for(const mesh of seat)for(let i=0;i<mesh.count;i++){if(i%7===0)continue;mesh.getMatrixAt(i,matrix);const p=new THREE.Vector3().setFromMatrixPosition(matrix);if(Math.hypot(p.x-52.2,p.z-9.84047)<2)continue;positions.push({p,yaw:Math.atan2(matrix.elements[8],matrix.elements[10])});}
 const bodyMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92}),headMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1});
 const bodies=new THREE.InstancedMesh(new THREE.CylinderGeometry(.20,.25,.62,5,1),bodyMat,positions.length),heads=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.135,0),headMat,positions.length),dummy=new THREE.Object3D(),col=new THREE.Color();
 const shirts=['#72b6d8','#4991b9','#c2d9e4','#f0efea','#1f3e58','#7899ad'],skins=['#d9ab88','#a97859','#e7c4a3','#86543f'];
 positions.forEach(({p,yaw},i)=>{dummy.position.set(p.x,p.y+.46,p.z);dummy.rotation.set(0,yaw,0);dummy.scale.set(1,1,1);dummy.updateMatrix();bodies.setMatrixAt(i,dummy.matrix);bodies.setColorAt(i,col.set(shirts[(i*13+Math.floor(i/19))%shirts.length]));dummy.position.y=p.y+.91;dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);heads.setColorAt(i,col.set(skins[(i*7)%skins.length]));});
 bodies.name='instanced_spectator_shirts';heads.name='instanced_spectator_heads';for(const m of[bodies,heads]){m.receiveShadow=true;m.castShadow=false;m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();group.add(m);}
 const cheerTime={value:0},cheerBoost={value:0};
 for(const [mesh,head]of [[bodies,false],[heads,true]]){
  mesh.material.onBeforeCompile=shader=>{shader.uniforms.uCheerTime=cheerTime;shader.uniforms.uCheerBoost=cheerBoost;shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
uniform float uCheerTime; uniform float uCheerBoost;`).replace('#include <begin_vertex>',`#include <begin_vertex>
float phase=instanceMatrix[3].x*.61+instanceMatrix[3].z*.39;
float hop=(.5+.5*sin(uCheerTime*3.4+phase))*(.18+uCheerBoost*.18);
transformed.y+=hop;`);};mesh.material.customProgramCacheKey=()=> 'etihad-cheer-v1';
 }
 return {group,count:positions.length,update(time,boost=0){cheerTime.value=time;cheerBoost.value=boost;},setEnabled(value){group.visible=value;},dispose(){for(const m of[bodies,heads]){m.geometry.dispose();m.material.dispose();}group.removeFromParent();}};
}
export function createDisplays(ctx){
 const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const board=make(1024,576),ad=make(1024,128),boardTex=new THREE.CanvasTexture(board),adTex=new THREE.CanvasTexture(ad);boardTex.colorSpace=adTex.colorSpace=THREE.SRGBColorSpace;
 const boardMat=new THREE.MeshBasicMaterial({map:boardTex,toneMapped:false}),adMat=new THREE.MeshBasicMaterial({map:adTex,toneMapped:false});
 for(const {mesh,kind}of ctx.displaySurfaces??[])mesh.material=kind==='screen'?boardMat:adMat;
 let mode='day',last=-1;function update(match,time){const tick=mode==='match'?Math.floor(time):0;if(last===tick)return;last=tick;
  const c=board.getContext('2d'),a=ad.getContext('2d');c.fillStyle='#07121e';c.fillRect(0,0,1024,576);c.fillStyle='#81bbd7';c.font='600 30px Arial';c.textAlign='center';c.fillText('ETIHAD STADIUM',512,75);c.fillStyle='#ecf3f4';c.font=mode==='match'?'600 92px Arial':'600 110px Arial';c.fillText(mode==='match'?`CITY ${match.score[0]} : ${match.score[1]} UTD`:'MANCHESTER',512,255);c.font=mode==='match'?'600 46px Arial':'600 68px Arial';c.fillText(mode==='match'?'MANCHESTER DERBY':'CITY',512,345);c.fillStyle='#88b4c9';c.font='28px Arial';const seconds=Math.floor(time)%3600;c.fillText(mode==='match'?`DEMO · ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')} · ${match.label.split(' · ')[0]}`:'THE HOME OF MANCHESTER CITY',512,465);
  c.fillStyle='#2e6e8b';c.fillRect(85,510,854,4);c.fillStyle='#a4d5e8';c.fillRect(85,510,(tick*11)%854,4);
  a.fillStyle=mode==='match'?'#113f5d':'#183547';a.fillRect(0,0,1024,128);a.fillStyle='#e8f5fa';a.font='600 58px Arial';a.textAlign='center';const labels=['MANCHESTER CITY','ETIHAD','TOGETHER'];a.fillText(labels[Math.floor(time/6)%labels.length],512,84);boardTex.needsUpdate=adTex.needsUpdate=true;
 }
 return {setMode(value){mode=value;last=-1;},update,dispose(){boardTex.dispose();adTex.dispose();boardMat.dispose();adMat.dispose();}};
}
