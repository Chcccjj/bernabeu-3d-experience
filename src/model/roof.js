import * as THREE from 'three';
import {TAU,outline,geometry,beams,band,annulus,canvasTexture,instances,boxGeometry,box} from './geometry.js';
import {facadePoint,facadeHeight} from './envelope.js';

export function createRoof(m) {
  const group=new THREE.Group();group.name='Fixed cable-supported roof and folding membranes';
  const p=[],uv=[],idx=[],segments=384,rings=18;
  const roofPoint=(t,f)=>{
    const outer=facadePoint(t,1),inner=outline(55.5,37.8,t,5.8);
    return new THREE.Vector3(THREE.MathUtils.lerp(inner.x,outer.x,f),THREE.MathUtils.lerp(65.2,60.1+facadeHeight(t),f)+Math.sin(f*Math.PI)*2.4,THREE.MathUtils.lerp(inner.z,outer.z,f));
  };
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
    const q=roofPoint(i/segments*TAU,j/rings);p.push(...q.toArray());uv.push(i/segments*30,j/rings);
    if(j<rings&&i<segments){const a=j*(segments+1)+i,b=a+segments+1;idx.push(a,a+1,b,a+1,b+1,b);}
  }
  const fixed=new THREE.Mesh(geometry(p,idx,uv),m.roof);fixed.castShadow=true;fixed.receiveShadow=true;group.add(fixed);
  const seam=[];
  for(let i=0;i<216;i++)for(let j=0;j<rings;j++){
    const a=roofPoint(i/216*TAU,j/rings),b=roofPoint(i/216*TAU,(j+1)/rings);a.y+=.035;b.y+=.035;seam.push(...a.toArray(),...b.toArray());
  }
  const seams=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(seam,3)),new THREE.LineBasicMaterial({color:0x5f6a74,transparent:true,opacity:.31}));group.add(seams);
  group.add(band(55.5,37.8,63.7,65.35,m.steel,5.8,256,true));
  const truss=[],thin=[],outerRing=[],posts=[],lights=[];
  for(let i=0;i<44;i++){
    const t=i/44*TAU,a=outline(113.5,97.5,t),b=outline(56.2,38.5,t,5.8),topY=57.8+facadeHeight(t)*.75;
    const lower=58.8;
    truss.push([[a.x,topY,a.z],[b.x,61.8,b.z]],[[a.x,topY-3.2,a.z],[b.x,lower,b.z]]);
    for(let j=0;j<8;j++){
      const f=j/8,k=(j+1)/8,x=THREE.MathUtils.lerp(a.x,b.x,f),z=THREE.MathUtils.lerp(a.z,b.z,f),nx=THREE.MathUtils.lerp(a.x,b.x,k),nz=THREE.MathUtils.lerp(a.z,b.z,k);
      thin.push([[x,THREE.MathUtils.lerp(topY,61.8,f),z],[nx,THREE.MathUtils.lerp(topY-3.2,lower,k),nz]],[[x,THREE.MathUtils.lerp(topY-3.2,lower,f),z],[x,THREE.MathUtils.lerp(topY,61.8,f),z]]);
    }
    posts.push([[a.x,51,a.z],[a.x,topY,a.z]],[[a.x*.94,51,a.z*.94],[a.x,topY,a.z]]);
    const v=outline(60.4,42.9,t,4.6);lights.push({p:[v.x,60.6,v.z],s:[2,.25,1],r:[0,Math.atan2(v.x,v.z),0]});
  }
  beams(group,truss,m.steel,.28,6);beams(group,thin,m.steel,.095,4);beams(group,posts,m.darkSteel,.45,6);
  // Inner tension ring, with visible hangers for the continuous video display.
  for(let i=0;i<192;i++){
    const a=outline(58.5,41,i/192*TAU,5),b=outline(58.5,41,(i+1)/192*TAU,5);
    outerRing.push([[a.x,61.6,a.z],[b.x,61.6,b.z]],[[a.x,59.6,a.z],[b.x,59.6,b.z]]);
    if(i%4===0)outerRing.push([[a.x,59.6,a.z],[a.x,54,a.z]]);
  }beams(group,outerRing,m.darkSteel,.1,5);
  const lightMesh=instances(group,boxGeometry,m.light,lights);
  const screenCanvas=document.createElement('canvas');screenCanvas.width=2048;screenCanvas.height=256;const c=screenCanvas.getContext('2d');
  const screenTex=new THREE.CanvasTexture(screenCanvas);screenTex.colorSpace=THREE.SRGBColorSpace;screenTex.wrapS=THREE.RepeatWrapping;screenTex.repeat.x=4;
  const screenMat=new THREE.MeshBasicMaterial({map:screenTex,side:THREE.DoubleSide,toneMapped:false});
  const screen=band(58.1,40.6,53.5,58.6,screenMat,5,256,true);screen.name='360 degree continuous LED screen';group.add(screen);
  group.add(annulus(58.6,41.1,57.9,40.4,58.7,m.dark,{n:5}));
  group.add(annulus(58.6,41.1,57.9,40.4,53.4,m.dark,{n:5}));
  const leaves=[],carriages=[];
  for(const side of [-1,1]){
    const leaf=new THREE.Group();leaf.name=side===1?'North folding membrane':'South folding membrane';
    const v=[],ix=[],u=[],folds=24;
    for(let j=0;j<=folds;j++)for(let k=0;k<3;k++){
      const x=(k-1)*55.35,z=-side*j/folds*37.8,y=(j%2?.34:0)+Math.sin(k/2*Math.PI)*.2;
      v.push(x,y,z);u.push(k/2,j/folds);
      if(j<folds&&k<2){const a=j*3+k;ix.push(a,a+1,a+3,a+1,a+4,a+3);}
    }
    const membrane=new THREE.Mesh(geometry(v,ix,u),m.membrane);membrane.castShadow=true;membrane.receiveShadow=true;leaf.add(membrane);
    for(let j=0;j<=12;j++){
      const cross=new THREE.Group();beams(cross,[[[-55.35,-.32,0],[0,.06,0]],[[0,.06,0],[55.35,-.32,0]]],m.steel,.105,6);cross.position.z=-side*j/12*37.8;leaf.add(cross);
    }
    leaf.position.set(0,65.45,side*37.8);leaves.push(leaf);group.add(leaf);
  }
  const tracks=[];for(const x of [-55.8,55.8])tracks.push([[x,65.3,-38.7],[x,65.3,38.7]]);beams(group,tracks,m.darkSteel,.16,6);
  let lastFrame=-1;
  function drawScreen(time,mode,animate=true){
    const frame=Math.floor(time*(animate?3:0));if(frame===lastFrame&&drawScreen.mode===mode)return;lastFrame=frame;drawScreen.mode=mode;
    c.fillStyle=mode==='match'?'#12346d':'#10233f';c.fillRect(0,0,2048,256);
    c.fillStyle='#a9c1e1';c.fillRect(0,0,2048,3);c.fillRect(0,253,2048,3);
    c.textBaseline='middle';c.fillStyle='#f8f9f5';c.font='500 92px Arial';c.textAlign='center';
    if(mode==='match'){
      c.fillText('REAL MADRID',408,112);c.font='400 138px Arial';c.fillText('0 : 0',1050,116);c.font='500 65px Arial';c.fillText('MATCH DAY',1650,107);c.font='400 25px Arial';c.fillStyle='#adc5e9';c.fillText('EXHIBITION ATMOSPHERE',1650,176);
      const offset=(frame*8)%2048;c.fillStyle='#c5d6ee';c.fillRect(offset,236,180,3);
    }else{c.fillText('SANTIAGO BERNABÉU',710,122);c.font='400 36px Arial';c.fillStyle='#c5d0dc';c.fillText('THE HOME OF REAL MADRID',1690,124);}
    screenTex.needsUpdate=true;
  }
  drawScreen(0,'day');
  return {group,leaves,lightMesh,screenTex,drawScreen,update(progress){
    for(const leaf of leaves){leaf.scale.z=.065+.935*progress;leaf.position.y=65.45+(1-progress)*.25;}
  }};
}
