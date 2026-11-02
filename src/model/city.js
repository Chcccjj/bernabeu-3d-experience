import * as THREE from 'three';
import {box,boxGeometry,instances,random,canvasTexture,beams} from './geometry.js';

export function createCity(materials) {
  const group=new THREE.Group();group.name='Madrid urban context';const r=random(1947), m=materials;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000),m.ground);ground.rotation.x=-Math.PI/2;ground.position.y=-.55;ground.receiveShadow=true;group.add(ground);
  box(group,m.lightConcrete,0,-.28,0,288,.42,258);
  const paving=[];
  for(let x=-140;x<145;x+=5) for(let z=-125;z<128;z+=5) {
    if(Math.abs(x)<123&&Math.abs(z)<108)continue;
    if(r()>.7)paving.push({p:[x,-.035,z],s:[4.94,.035,4.94],color:new THREE.Color().setHSL(.12,.04,.57+r()*.10)});
  }
  instances(group,boxGeometry,new THREE.MeshStandardMaterial({roughness:.96,color:0xffffff}),paving,{colors:true});
  const roads=[],marks=[],curbs=[];
  for(let i=-13;i<=13;i++) {
    const x=i*86+158;
    if(Math.abs(x)>140) {
      roads.push({p:[x,-.25,0],s:[i===0?28:18,.2,2700]});
      for(let z=-1300;z<=1300;z+=14)marks.push({p:[x,-.13,z],s:[.18,.015,5]});
      for(const side of [-1,1]) curbs.push({p:[x+side*(i===0?15:10),-.1,0],s:[.8,.23,2700]});
    }
    const z=i*86+144;
    if(Math.abs(z)>130) {
      roads.push({p:[0,-.26,z],s:[2700,.2,18]});
      for(let x=-1300;x<=1300;x+=14)marks.push({p:[x,-.13,z],s:[5,.015,.18]});
      for(const side of [-1,1])curbs.push({p:[0,-.1,z+side*10],s:[2700,.23,.8]});
    }
  }
  instances(group,boxGeometry,m.road,roads);instances(group,boxGeometry,m.white,marks);instances(group,boxGeometry,m.lightConcrete,curbs);
  const zebra=[];
  for(const z of [-144,144])for(const x of [-158,158])for(let i=0;i<8;i++)zebra.push({p:[x-10+i*2.7,-.1,z-17],s:[1.35,.02,5.5]});
  instances(group,boxGeometry,m.white,zebra);
  const buildingMaps=[];
  for(let v=0;v<4;v++)buildingMaps.push(canvasTexture(256,512,(c,w,h)=>{
    const bg=['#b4ad99','#c0b6a3','#b1aba1','#9eabb0'][v];c.fillStyle=bg;c.fillRect(0,0,w,h);
    for(let y=20;y<h;y+=44)for(let x=12;x<w;x+=34){
      c.fillStyle='#878579';c.fillRect(x-2,y-2,21,31);c.fillStyle=r()>.86?'#ada88e':'#4f5a5b';c.fillRect(x,y,17,25);
      c.fillStyle='#beb8a9';c.fillRect(x-3,y+25,23,3);c.fillRect(x+8,y,1,25);
      if(r()>.7){c.fillStyle='#8f8a7e';c.fillRect(x-4,y+19,25,2);}
    }
    c.fillStyle='rgba(70,67,60,.18)';for(let y=0;y<h;y+=44)c.fillRect(0,y,w,2);
  }));
  const near=[[],[],[],[]],far=[[],[],[],[]],rooftops=[],units=[],windows=[];
  for(let ix=-14;ix<14;ix++)for(let iz=-14;iz<14;iz++){
    const cx=ix*86+201,cz=iz*86+187;
    if(Math.abs(cx)<207&&Math.abs(cz)<181)continue;
    if(Math.hypot(cx,cz)>1450)continue;
    for(let k=0;k<3;k++){
      const x=cx+(k===0?-17:k===1?17:0)+(r()-.5)*4,z=cz+(k===2?21:-13)+(r()-.5)*5,w=k===2?49+r()*9:24+r()*7,d=k===2?20+r()*5:29+r()*8;
      const h=11+Math.floor(r()*7)*3.2+(Math.abs(cx)>750?r()*13:0),v=Math.floor(r()*4),t={p:[x,h/2-.35,z],s:[w,h,d]};
      (Math.hypot(cx,cz)<640?near:far)[v].push(t);
      if(Math.hypot(cx,cz)<470){
        rooftops.push({p:[x,h,z],s:[w+.5,.65,d+.5]});units.push({p:[x+3,h+1,z-5],s:[5,1.9,3]});
        if(k!==1){rooftops.push({p:[x,h+.65,z-d*.36],s:[w,.8,.35]},{p:[x-w*.47,h+.65,z],s:[.35,.8,d]});}
        for(let j=0;j<5;j++)windows.push({p:[x-w*.4+j*w*.2,h*.4,z+d/2+.025],s:[.5,h*.7,.03]});
      }
    }
  }
  const nearGroup=new THREE.Group(),farGroup=new THREE.Group(),detailGroup=new THREE.Group();
  buildingMaps.forEach((map,i)=>{
    // Flat caps stay neutral; windows belong to the vertical facades only.
    const wall=new THREE.MeshStandardMaterial({map,roughness:.86,color:0xffffff});
    const mats=[wall,wall,m.lightConcrete,m.lightConcrete,wall,wall];
    instances(nearGroup,boxGeometry,mats,near[i],{shadow:true});instances(farGroup,boxGeometry,mats,far[i]);
  });
  instances(detailGroup,boxGeometry,m.lightConcrete,rooftops);instances(detailGroup,boxGeometry,m.concrete,units,{shadow:true});
  const detailsLOD=new THREE.LOD();detailsLOD.addLevel(detailGroup,0);detailsLOD.addLevel(new THREE.Group(),800);group.add(nearGroup,farGroup,detailsLOD);
  // The isolated tower provides a recognisable change in the surrounding skyline.
  const tower=box(group,m.glass,-197,55,-181,25,110,26);tower.castShadow=true;
  const towerFins=[];for(let y=3;y<111;y+=3.1){towerFins.push({p:[-197,y,-181],s:[25.5,.22,26.5]});}
  instances(group,boxGeometry,m.silver,towerFins);box(group,m.concrete,-197,111,-181,26,1,27);
  const treePositions=[];
  for(let i=0;i<74;i++){
    const side=i%4,j=Math.floor(i/4),v=-124+j*14.8;
    treePositions.push(side<2?[v,side===0?125:-125]:[side===2?139:-139,v*.9]);
  }
  for(let i=0;i<240;i++){
    const x=(r()-.5)*1700,z=(r()-.5)*1700;
    if(Math.abs(x)>190||Math.abs(z)>180)treePositions.push([x,z]);
  }
  const trunks=[],foliage=[];
  treePositions.forEach(([x,z])=>{
    const h=5+r()*2;trunks.push({p:[x,h/2,z],s:[.36,h,.36]});
    for(let j=0;j<3;j++)foliage.push({p:[x+(r()-.5)*2,h+j*1.25,z+(r()-.5)*2],s:[2.3+r(),2.5+r(),2.3+r()],color:new THREE.Color().setHSL(.24+r()*.06,.19+r()*.12,.18+r()*.08)});
  });
  instances(group,boxGeometry,m.trunk,trunks);instances(group,new THREE.IcosahedronGeometry(1,1),m.foliage,foliage,{shadow:true,colors:true});
  const cars=[],carGlass=[],tires=[];
  for(let i=0;i<100;i++){
    const vertical=i%2===0,side=i%4<2?1:-1;
    const x=vertical?side*(153+r()*8):(r()-.5)*700,z=vertical?(r()-.5)*700:side*(140+r()*4);
    const angle=vertical?0:Math.PI/2;
    cars.push({p:[x,.6,z],s:[1.65,.9,4],r:[0,angle,0],color:[0xddddcf,0x263039,0x7b807b,0xa4a4a1,0x293c4e][i%5]});
    carGlass.push({p:[x,1.25,z],s:[1.4,.55,2],r:[0,angle,0]});
    for(const s of [-1,1])for(const f of [-1,1])tires.push({p:[x+(vertical?s*.85:f*1.2),.35,z+(vertical?f*1.2:s*.85)],s:[vertical?.2:.65,.5,vertical?.65:.2]});
  }
  instances(group,boxGeometry,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.4,metalness:.45}),cars,{shadow:true,colors:true});instances(group,boxGeometry,m.glass,carGlass);instances(group,boxGeometry,m.dark,tires);
  const bollards=[],lampEdges=[],lampHeads=[];
  for(let i=0;i<80;i++){
    const side=i%4,j=Math.floor(i/4),v=-132+j*14;const [x,z]=side<2?[v,side===0?117:-117]:[side===2?132:-132,v*.87];
    bollards.push({p:[x,.55,z],s:[.25,1.15,.25]});
    if(i%3===0){lampEdges.push([[x,0,z],[x,10,z]],[[x,10,z],[x+2,10.3,z]]);lampHeads.push({p:[x+2,10.25,z],s:[1.2,.18,.45]});}
  }
  instances(group,boxGeometry,m.silverDark,bollards);beams(group,lampEdges,m.silverDark,.08);const lamps=instances(group,boxGeometry,m.warmLight,lampHeads);
  const ao=canvasTexture(256,256,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,w*.23,w/2,h/2,w*.5);g.addColorStop(0,'rgba(0,0,0,.48)');g.addColorStop(.74,'rgba(0,0,0,.30)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(304,274),new THREE.MeshBasicMaterial({map:ao,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.015;group.add(contact);
  return {group,lamps,buildingMaps};
}
