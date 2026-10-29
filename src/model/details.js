import * as THREE from 'three';
import {box,boxGeometry,instances,beams,textTexture,outline,TAU} from './geometry.js';

export function createArchitecturalDetails(m){
  const group=new THREE.Group();group.name='Entrance pavilion, public realm and player tunnel';
  const glass=new THREE.MeshStandardMaterial({color:0x9cbbc4,metalness:.12,roughness:.14,transparent:true,opacity:.35,depthWrite:false,envMapIntensity:1.6});
  const mullions=[],handles=[],fins=[];
  for(const side of [-1,1]){
    for(let i=0;i<10;i++){
      const x=-47+i*8.2,z=side*103.8;
      box(group,glass,x,4.3,z,7.7,7.5,.12);
      mullions.push({p:[x-3.9,4.3,z+.12*side],s:[.12,7.7,.17]});
      handles.push({p:[x,2,z+.25*side],s:[.055,.85,.08]});
    }
    box(group,m.silver,-10,8.6,side*105.5,86,.21,8);
    box(group,m.darkSteel,-10,8.35,side*105.5,86,.18,8);
    for(let i=0;i<27;i++)fins.push({p:[-51+i*3.2,8.2,side*105.5],s:[.075,.38,7.7]});
    box(group,m.warmLight,-10,8.05,side*107,82,.035,.055);
  }
  instances(group,boxGeometry,m.darkSteel,mullions);instances(group,boxGeometry,m.silver,handles);instances(group,boxGeometry,m.steel,fins);
  const benches=[],planters=[];
  for(const side of [-1,1])for(let i=0;i<7;i++){
    const x=-91+i*28,z=side*120;
    benches.push({p:[x,.53,z],s:[4.4,.25,1.25]});
    for(const dx of [-1.5,1.5])benches.push({p:[x+dx,.2,z],s:[.22,.4,.85]});
    planters.push({p:[x+7,.55,z],s:[4.5,1.1,3.2]});
    box(group,m.foliage,x+7,1.2,z,4.3,.45,3);
  }
  instances(group,boxGeometry,m.lightConcrete,benches);instances(group,boxGeometry,m.concrete,planters);
  // A ground-level, bounded route through a real opening in the lower bowl.
  const tunnel=new THREE.Group();tunnel.name='Player tunnel';
  const tunnelWall=new THREE.MeshStandardMaterial({color:0x182c47,roughness:.65});
  box(tunnel,m.concrete,-72.5,-.02,0,25,.2,6.3);
  box(tunnel,tunnelWall,-72.5,2.4,-3.05,25,4.9,.25);
  box(tunnel,tunnelWall,-72.5,2.4,3.05,25,4.9,.25);
  box(tunnel,m.darkSteel,-72.5,4.9,0,25,.25,6.4);
  box(tunnel,tunnelWall,-84.9,2.4,0,.3,4.9,6.3);
  box(tunnel,m.warmLight,-72.5,4.65,-2.85,24,.06,.07);
  box(tunnel,m.warmLight,-72.5,4.65,2.85,24,.06,.07);
  const badge=new THREE.Mesh(new THREE.PlaneGeometry(12,1.1),new THREE.MeshBasicMaterial({map:textTexture('THE WAY TO THE PITCH',{font:'500 58px Arial'}),transparent:true}));
  badge.position.set(-72,2.7,-2.9);tunnel.add(badge);
  group.add(tunnel);
  const ramp=box(tunnel,m.concrete,-61,.55,0,6.5,.14,5.8);ramp.rotation.z=Math.atan(.98/6);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(21,5.65),new THREE.MeshStandardMaterial({color:0x233b56,roughness:.97}));floor.rotation.x=-Math.PI/2;floor.position.set(-73,.1,0);tunnel.add(floor);
  return {group,tunnel};
}

// Only remove the short player-tunnel entrance; keep the rest of the seating bowl intact.
export function openTunnel(geometry){
  const pos=geometry.getAttribute('position'),index=geometry.index,kept=[];
  if(!index)return geometry;
  for(let i=0;i<index.count;i+=3){
    const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
    const xs=ids.map(id=>pos.getX(id)),zs=ids.map(id=>pos.getZ(id)),ys=ids.map(id=>pos.getY(id));
    // Remove crossing boundary triangles too, so no diagonal LED or tread
    // fragments protrude into the player tunnel.
    if(Math.min(...xs)<-60&&Math.max(...xs)>-86&&Math.min(...zs)<4.7&&Math.max(...zs)>-4.7&&Math.min(...ys)<5.4)continue;
    kept.push(...ids);
  }
  geometry.setIndex(kept);return geometry;
}
