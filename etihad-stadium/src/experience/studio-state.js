// View state is data only. Reject external/oversized values before touching cameras.
export function normalizeStudioState(value,layerIds=[]){
 if(!value||value.version!==2)return null;
 const vec=(v,lo,hi)=>Array.isArray(v)&&v.length===3&&v.every((n,i)=>typeof n==='number'&&Number.isFinite(n)&&n>=lo[i]&&n<=hi[i]);
 if(!vec(value.p,[-4000,-4,-4000],[4000,2500,4000])||!vec(value.t,[-4000,-10,-4000],[4000,600,4000]))return null;
 if(!Number.isFinite(value.zoom)||value.zoom<.45||value.zoom>5.5||!Number.isFinite(value.fov)||value.fov<20||value.fov>90)return null;
 if(!['day','night','match'].includes(value.mode)||!['perspective','orthographic'].includes(value.projection))return null;
 if(!Number.isFinite(value.explode)||value.explode<0||value.explode>1)return null;
 const layers={};for(const id of layerIds)layers[id]=value.layers?.[id]!==false;
 return {version:2,p:[...value.p],t:[...value.t],zoom:value.zoom,fov:value.fov,mode:value.mode,projection:value.projection,explode:value.explode,section:!!value.section,roof:!!value.roof,event:!!value.event,city:value.city!==false,layers};
}
export function encodeStudioState(state){return btoa(JSON.stringify(state)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export function decodeStudioState(encoded,ids){try{if(typeof encoded!=='string'||encoded.length>12000)return null;return normalizeStudioState(JSON.parse(atob(encoded.replaceAll('-','+').replaceAll('_','/'))),ids);}catch{return null;}}
