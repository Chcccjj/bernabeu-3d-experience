import {LocalizedError,t} from '../i18n/index.js';
const finiteVector = value => Array.isArray(value) && value.length === 3 && value.every(n => typeof n === 'number' && Number.isFinite(n));
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const round = n => Math.round(n * 1000) / 1000;
export const FORMATS = {'16:9':16/9, '9:16':9/16, '3:4':3/4, '1:1':1};

export function outputSize(format='16:9', longEdge=3840, limit=8192) {
  const ratio=FORMATS[format] || FORMATS['16:9'];
  const edge=Math.floor(clamp(Number(longEdge)||2048, 256, Math.min(8192,limit))/2)*2;
  return ratio>=1 ? {width:edge,height:Math.round(edge/ratio/2)*2} : {width:Math.round(edge*ratio/2)*2,height:edge};
}
export function normalizeView(value) {
  if(!value || value.v!==1 || !finiteVector(value.p) || !finiteVector(value.t)) return null;
  if(value.p.some(n=>Math.abs(n)>1500)||value.t.some(n=>Math.abs(n)>1500))return null;
  if(Math.hypot(...value.p.map((n,i)=>n-value.t[i]))<.08)return null;
  const modes=['exterior','interior','pitch','free','seat','walk','hotspot','study'];
  let mode=modes.includes(value.c)?value.c:'free';
  const p=[round(clamp(value.p[0],-650,650)),round(clamp(value.p[1],1.72,700)),round(clamp(value.p[2],-650,650))];
  if(mode==='walk'){
    if(walkable(p[0],p[2]))p[1]=round(walkEyeHeight(p[0]));
    else mode='hotspot';
  }
  return {v:1,p,t:value.t.map(n=>round(clamp(n,-650,650))),f:round(clamp(Number(value.f)||50,28,85)),m:['day','night','match'].includes(value.m)?value.m:'day',r:!!value.r,g:!!value.g,x:!!value.x,c:mode};
}
export function encodeView(value) {
  const view=normalizeView(value);if(!view)throw new LocalizedError('errors.view');
  return '#view='+btoa(JSON.stringify(view)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function decodeView(hash) {
  if(!/^#view=[\w-]{1,1200}$/.test(hash||''))return null;
  try{return normalizeView(JSON.parse(atob(hash.slice(6).replace(/-/g,'+').replace(/_/g,'/'))));}catch{return null;}
}
export function readBookmarks(storage) {
  try {
    const list=JSON.parse(storage.getItem('bernabeu.views.v1')||'[]');
    if(!Array.isArray(list))return [];
    return list.slice(0,8).map(item=>({name:String(item.name||t('share.defaultName',{number:''}).trim()).slice(0,32),view:normalizeView(item.view)})).filter(item=>item.view);
  }catch{return [];}
}
export function walkable(x,z) {
  if(Math.abs(x)>51&&Math.abs(x)<55.5&&Math.abs(z)<4.5)return false;
  return (Math.abs(x)<=61&&Math.abs(z)<=37.5)||(x>=-84&&x<=-55&&Math.abs(z)<=2.55);
}
export const walkEyeHeight=x=>1.82+clamp((x+64)/6,0,1)*.98;
export function chooseRecordingType(supported) {
  return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp9','video/webm;codecs=vp8,opus','video/webm;codecs=vp8','video/webm'].find(type=>supported(type))||null;
}
export function adaptiveRatio({ratio,base,ms,slow=0,fast=0},seconds=1) {
  slow=ms>35?slow+seconds:0;fast=ms<21?fast+seconds:0;
  if(slow>=3&&ratio>1)return {ratio:Math.max(1,ratio-.25),slow:0,fast:0};
  if(fast>=9&&ratio<base)return {ratio:Math.min(base,ratio+.25),slow:0,fast:0};
  return {ratio,slow,fast};
}
