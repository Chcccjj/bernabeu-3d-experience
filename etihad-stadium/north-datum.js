import * as THREE from 'three';

const rows=[['L00','主环廊',60.650],['L01','俱乐部层',65.450],['L02','上层环廊',70.130],['L03','设备层',77.600],['L03M','设备夹层',82.175],['L04','套房层',89.650],['L05','空中酒吧',93.150],['RF','屋面基准',98.100]];
export const NORTH_CONTROL={
 units:'metres',referenceOnly:true,kind:'drawing elevation control; not floor construction geometry',
 datum:{absolutePitchFFL:54.999,modelPitchY:-5.18,originAbsoluteElevation:60.179,formula:'local Y = drawing FFL - 60.179'},
 levels:rows.map(([id,label,absoluteFFL])=>({id,label,absoluteFFL,localY:Number((absoluteFFL-60.179).toFixed(3))})),
 source:{councilRecord:'https://arcusbe.manchester.gov.uk/pr/s/detail/a1DSl000007GPxsMAG?c__r=Arcus_BE_Public_Register',drawings:['NSE-POP-NS-ZZ-DR-A-000301-P04','NSE-POP-NS-ZZ-DR-A-000302-P04','NSE-POP-NS-ZZ-DR-A-000310-C05'],status:'2025 approved application attachments; not 2026 as-built survey'},
 limits:'Only FFL elevations are checked. Control rectangles are not floor outlines. Existing massing, tiers and three generic concourses still require calibration.'
};
export function buildNorthDatum(scene){
 const group=new THREE.Group();group.name='North_Stand_Drawing_Datum_Control';group.userData=NORTH_CONTROL;group.visible=false;scene.add(group);
 const frames=NORTH_CONTROL.levels.map(level=>{
  const g=new THREE.Group();g.name=`north_datum_${level.id}_FFL_${level.absoluteFFL.toFixed(3).replace('.','_')}`;g.position.y=level.localY;g.userData={...level,referenceOnly:true,kind:'datum control rectangle; not a floor boundary'};
  const points=[-55,0,-160,55,0,-160,55,0,-160,55,0,-100,55,0,-100,-55,0,-100,-55,0,-100,-55,0,-160];
  for(let x=-40;x<=40;x+=20)points.push(x,0,-160,x,0,-100);
  for(const z of[-145,-130,-115])points.push(-55,0,z,55,0,z);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  const lines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:level.id==='L00'?'#d2ddd9':'#72a8bf',transparent:true,opacity:.75}));lines.name='drawing_datum_grid';g.add(lines);group.add(g);return {...level,group:g};
 });
 const v=[],bottom=NORTH_CONTROL.datum.modelPitchY,top=NORTH_CONTROL.levels.at(-1).localY;
 for(const x of[-58,58]){v.push(x,bottom,-163,x,top,-163);for(const y of[bottom,...NORTH_CONTROL.levels.map(p=>p.localY)])v.push(x-2,y,-163,x+2,y,-163);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(v,3));const ruler=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#bfd6d9',transparent:true,opacity:.85}));ruler.name='vertical_datum_rulers';group.add(ruler);
 return {group,frames,data:NORTH_CONTROL};
}
