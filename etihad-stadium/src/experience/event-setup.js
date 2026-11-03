import * as THREE from 'three';
export function createEventSetup(ctx,pitchY){
 const group=new THREE.Group();group.name='temporary_event_setup_demo';group.userData={temporary:true,evidence:'C - illustrative concert layout; not a surveyed stage plan'};group.visible=false;ctx.scene.add(group);
 const coverMaterial=new THREE.MeshStandardMaterial({color:'#8a949a',roughness:.93}),cover=new THREE.InstancedMesh(new THREE.BoxGeometry(8.47,.075,8.72),coverMaterial,96),dummy=new THREE.Object3D();cover.name='temporary_pitch_protection_tiles';cover.receiveShadow=true;group.add(cover);
 const stage=new THREE.Group();stage.name='temporary_concert_stage';group.add(stage);
 const steel=new THREE.MeshStandardMaterial({color:'#242b30',roughness:.65,metalness:.48}),black=new THREE.MeshStandardMaterial({color:'#11191e',roughness:.9}),screen=new THREE.MeshStandardMaterial({color:'#214c65',roughness:.5,emissive:'#438aa5',emissiveIntensity:.7});
 function box(x,y,z,w,h,d,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;stage.add(m);return m;}
 box(0,1,-37,42,2,20,black);box(0,8,-45,34,12,.35,screen);for(const x of[-23,23]){box(x,8,-43,.55,16,.55,steel);box(x,9,-38,1.4,7,1.1,black);}box(0,15.8,-43,46,.45,.45,steel);
 for(let x=-20;x<=20;x+=4)box(x,15.3,-43,.38,.35,.5,screen);
 stage.position.y=pitchY;let progress=0,target=0,last=-1;
 function update(dt){const next=THREE.MathUtils.lerp(progress,target,1-Math.exp(-dt*2.2));progress=Math.abs(next-target)<.001?target:next;if(progress===last)return false;last=progress;group.visible=progress>.001;
  for(let row=0;row<12;row++)for(let col=0;col<8;col++){const k=row*8+col,p=THREE.MathUtils.smoothstep(progress,row*.025,row*.025+.55);dummy.position.set(-29.75+col*8.5,pitchY+.13+(1-p)*1.6,-48.125+row*8.75);dummy.scale.set(1,1,Math.max(.002,p));dummy.rotation.set(0,0,0);dummy.updateMatrix();cover.setMatrixAt(k,dummy.matrix);}cover.instanceMatrix.needsUpdate=true;stage.visible=progress>.4;stage.position.y=pitchY+(1-THREE.MathUtils.smoothstep(progress,.4,1))*8;return true;
 }
 return {group,setEnabled(value){target=value?1:0;},update,get progress(){return progress;},get enabled(){return target===1;}};
}
