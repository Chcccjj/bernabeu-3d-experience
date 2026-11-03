import * as THREE from 'three';
// Small, static sky reflection probe. No remote HDR, per-frame capture or mirror
// scene. Toon families are unaffected; metal and glazing receive a broad highlight.
export function createSkyEnvironment(renderer){
 const w=64,h=32,data=new Uint8Array(w*h*4),top=new THREE.Color('#e1e9ed'),horizon=new THREE.Color('#b5c7d1'),ground=new THREE.Color('#59666e');
 for(let y=0;y<h;y++){const t=1-y/(h-1),c=t<.5?top.clone().lerp(horizon,t*2):horizon.clone().lerp(ground,(t-.5)*2);for(let x=0;x<w;x++){const p=(y*w+x)*4;data[p]=Math.round(c.r*255);data[p+1]=Math.round(c.g*255);data[p+2]=Math.round(c.b*255);data[p+3]=255;}}
 const texture=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);texture.mapping=THREE.EquirectangularReflectionMapping;texture.needsUpdate=true;
 const generator=new THREE.PMREMGenerator(renderer),target=generator.fromEquirectangular(texture);generator.dispose();texture.dispose();return target;
}
