import * as THREE from 'three';
export const PITCH_EYE=-3.48;
export const EXPERIENCE_SHOTS={
 match:{p:[42,42,66],t:[0,-5,0],z:1,fov:65,label:'12 / 曼城 vs 曼联 · 模拟比赛'},
 arrivals:{p:[195,25,108],t:[108,2,62],z:1,fov:54,label:'13 / 比赛日 · 入场人流'},
 parking:{p:[233,24,173],t:[183,1,112],z:1,fov:60,label:'14 / 东侧停车场 · 日常进出'},
 exterior:{p:[350,205,370],t:[0,18,-13],z:1.15,fov:36,label:'01 / 伊蒂哈德 · 建筑全景'},
 pitch:{p:[8,PITCH_EYE,18],t:[0,12,-78],z:1,fov:66,look:'fixed',label:'10 / 草坪视角 · 拖动环视'},
 walk:{p:[8,PITCH_EYE,18],t:[0,7,-78],z:1,fov:66,look:'fly',label:'11 / 自由探索 · WASD 移动 · Q / E 升降'},
 inside:{p:[52.2,1.07,9.84047],t:[0,-4.2,0],z:1,fov:62,look:'fixed',label:'04 / 东看台 · 真实座席高度'}
};
export const TOUR_POINTS=[
 [430,240,440],[250,160,320],[-170,120,210],[-155,105,10],
 [0,85,0],[2,60,5],[6,32,12],[8,10,18],[8,PITCH_EYE,18],
 [24,6,12],[52.2,6,9.84047],[52.2,1.07,9.84047]
];
export const TOUR_TARGETS=[
 [0,20,0],[0,25,0],[0,25,0],[0,28,0],[0,0,0],[0,-2,0],
 [0,-3,-25],[0,4,-70],[0,12,-78],[0,-4.2,0],[0,-4.2,0],[0,-4.2,0]
];
export function cameraPositionAllowed(p){
 if(Math.abs(p.x)>225||p.z< -244||p.z>235||p.y>180||p.y<PITCH_EYE)return false;
 if(p.y>=72)return true;
 if(Math.abs(p.x)<=32.8&&Math.abs(p.z)<=50.8)return true;
 const stadium=Math.abs(p.x)<154&&p.z>-165&&p.z<165;
 const north=Math.abs(p.x)<114&&p.z<=-135;
 return !stadium&&!north&&p.y>=2.1;
}
export function createTourCurves(){return {p:new THREE.CatmullRomCurve3(TOUR_POINTS.map(p=>new THREE.Vector3(...p)),false,'centripetal'),t:new THREE.CatmullRomCurve3(TOUR_TARGETS.map(p=>new THREE.Vector3(...p)),false,'centripetal')};}
export function interiorTransition(from,to){
 const points=[from.clone()];
 const insideAperture=Math.pow(Math.abs(to.x)/56,2/.46)+Math.pow(Math.abs(to.z)/78,2/.46)<.96;
 const low=(to.y<12&&Math.abs(to.x)<65&&Math.abs(to.z)<65)||(to.y<55&&insideAperture);
 const sourceInside=Math.abs(from.x)<55&&Math.abs(from.z)<72&&from.y<65;
 if(sourceInside&&!low&&(Math.abs(to.x)>65||Math.abs(to.z)>78))points.push(new THREE.Vector3(8,25,18),new THREE.Vector3(2,55,5),new THREE.Vector3(0,85,0));
 if(low&&!sourceInside)points.push(new THREE.Vector3(0,Math.max(82,from.y),0),new THREE.Vector3(2,55,5),new THREE.Vector3(6,25,12),new THREE.Vector3(8,6,18));
 if(low&&Math.abs(to.x)>34)points.push(new THREE.Vector3(24,6,12),new THREE.Vector3(to.x,6,to.z));
 points.push(to.clone());return new THREE.CatmullRomCurve3(points,false,'centripetal');
}
