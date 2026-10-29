import * as THREE from 'three';
import { canvasTexture, random } from './model/geometry.js';

export function createMaterials(renderer) {
  const standard = (color,roughness=.7,metalness=0, extra={}) => new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
  const noise=canvasTexture(256,256,(c,w,h)=>{
    const r=random(36), d=c.createImageData(w,h);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++) { const i=(y*w+x)*4,v=170+r()*45+(y%3)*4; d.data.set([v,v,v,255],i); } c.putImageData(d,0,0);
  },THREE.NoColorSpace); noise.wrapS=noise.wrapT=THREE.RepeatWrapping; noise.repeat.set(36,3);
  const ground=canvasTexture(512,512,(c,w,h)=>{
    c.fillStyle='#a6a59b';c.fillRect(0,0,w,h); const r=random(14);
    for(let i=0;i<42000;i++){const v=Math.floor(125+r()*55);c.fillStyle=`rgba(${v},${v},${v-4},.28)`;c.fillRect(r()*w,r()*h,1,1);}
    c.strokeStyle='#8e8d84';c.lineWidth=1;for(let y=0;y<h;y+=64){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}for(let x=0;x<w;x+=128){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
  }); ground.wrapS=ground.wrapT=THREE.RepeatWrapping;ground.repeat.set(22,22);ground.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return {
    silver:standard(0xd0d3d3,.33,.84,{roughnessMap:noise}),
    silverDark:standard(0x858e95,.39,.8),
    roof:standard(0x9da8b1,.42,.83,{roughnessMap:noise,side:THREE.DoubleSide}),
    membrane:standard(0xe2e6e7,.67,.08,{side:THREE.DoubleSide}),
    steel:standard(0xbcc5c9,.45,.65),
    darkSteel:standard(0x343d45,.58,.62),
    concrete:standard(0xa7a79f,.92),
    lightConcrete:standard(0xc9c7ba,.9),
    bowl:standard(0x68777e,.85),
    blue:standard(0x1b54a0,.49,.08),
    seat:standard(0xffffff,.53,.04),
    glass:standard(0x233d47,.2,.6,{envMapIntensity:1.6}),
    dark:standard(0x171f26,.75,.15),
    ground:standard(0xffffff,.96,0,{map:ground}),
    road:standard(0x4a4c4c,.99),
    white:standard(0xe5e5db,.8),
    light:new THREE.MeshBasicMaterial({color:0xe4f4ff}),
    warmLight:new THREE.MeshBasicMaterial({color:0xffdaa1}),
    led:new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),
    foliage:standard(0x405943,1),
    trunk:standard(0x655a49,1),
  };
}
