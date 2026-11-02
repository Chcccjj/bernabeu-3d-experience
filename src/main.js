import '../styles.css';
import {BernabeuExperience} from './scene.js';
import {ExperienceTools} from './features/index.js';
import {initializeLocalization,setText,setAttributeText} from './i18n/index.js';
import './i18n/language.css';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let experience,experienceTools,toastTimer,uiVisible=true;
const canvas=$('#scene');
const disposeLocalization=initializeLocalization();
const views=['interior','pitch','tour','free','seat','walk','hotspot','study'];
function toast(key,params={}){setText($('#toast'),key,params);$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3700);setText($('#announcement'),key,params);}
function onView(view){
  document.body.dataset.view=view;
  $$('[data-view]').filter(b=>b.tagName==='BUTTON').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  $('#view-caption').hidden=view==='exterior';
  $('#flight-pad').hidden=!['free','walk'].includes(view);
  if(views.includes(view)){setText($('#view-number'),`view.${view}.number`);setText($('#view-title'),`view.${view}.title`);setText($('#view-description'),`view.${view}.description`);}
  let hints=view==='free'?(innerWidth<700?['look','touch']:['move','height','look']):['rotate','zoom','pan'];
  if(view==='walk')hints=innerWidth<700?['touchWalk','look']:['walk','speed','look'];
  if(view==='seat')hints=['look','seats'];
  const hint=$('#interaction-hint');hint.replaceChildren();hints.forEach((key,i)=>{if(i){const separator=document.createElement('i');separator.textContent='·';hint.append(separator);}const span=document.createElement('span');setText(span,'hint.'+key);hint.append(span);});
  setText($('#announcement'),view==='exterior'?'nav.exterior':`view.${view}.title`);
}
function onTour(progress){
  $('#tour-progress').hidden=progress===null;
  if(progress!==null){$('#tour-bar').style.width=`${progress*100}%`;setText($('#tour-chapter'),progress<.17?'tour.approach':progress<.47?'tour.skin':progress<.72?'tour.roof':'tour.legend');}
}
function onMechanism(value,roofClosed,pitchStored){
  $('#roof-toggle').setAttribute('aria-checked',String(roofClosed));setAttributeText($('#roof-toggle'),'aria-label',roofClosed?'roof.open':'roof.close');
  $('#pitch-toggle').setAttribute('aria-pressed',String(pitchStored));setAttributeText($('#pitch-toggle'),'aria-label',pitchStored?'pitch.restore':'pitch.store');
  const roofMoving=Math.abs(value.roof-(roofClosed?1:0))>.001,pitchMoving=Math.abs(value.pitch-(pitchStored?1:0))>.0001;
  setText($('#roof-status'),roofMoving?(roofClosed?'roof.closing':'roof.opening'):(roofClosed?'roof.closed':'roof.opened'),{percent:Math.round(value.roof*100)});
  setText($('#pitch-status'),pitchMoving?(pitchStored?'pitch.storing':'pitch.restoring'):(pitchStored?'pitch.stored':'pitch.football'),{percent:Math.round(value.pitch*100)});
  $('#roof-rule').style.width=`${value.roof*100}%`;$('#pitch-rule').style.width=`${value.pitch*100}%`;
  const azimuth=Math.atan2(experience.camera.position.x,experience.camera.position.z);$('#compass-needle').style.transform=`rotate(${-azimuth*180/Math.PI}deg)`;
}
function syncRoof(){
  $('#roof-toggle').setAttribute('aria-checked',String(experience.roofClosed));setAttributeText($('#roof-toggle'),'aria-label',experience.roofClosed?'roof.open':'roof.close');
}
async function requestView(view){
  if(!experience?.ready)return;if(experience.exporting){toast('errors.exportBusy');return;}if(experienceTools&&experienceTools.recorder.state!=='idle'){toast('toast.stopRecording');return;}experienceTools?.close(false);experience.setCutaway(false);const token=++experience.navigationId;
  const p=experience.camera.position,inside=p.y<64&&Math.abs(p.x)<115&&Math.abs(p.z)<98;
  const needsOpening=view==='tour'||(['interior','pitch'].includes(view)!==inside);
  if(needsOpening&&(experience.roofClosed||experience.mechanisms.roof>.001)){
    toast('toast.openRoof');const completed=experience.setRoof(false);syncRoof();const opened=await completed;if(!opened||token!==experience.navigationId)return;
  }
  if(view==='tour')experience.director.tour();else experience.director.setView(view);
  if(innerWidth<700){$('#settings-panel').classList.add('panel-hidden');$('#settings-toggle').setAttribute('aria-expanded','false');}
}
function hideUI(visible){
  if(experience?.exporting){toast('errors.exportBusy');return;}
  if(!visible&&experienceTools?.active){
    if(experienceTools.recorder.state!=='idle'){toast('toast.recordingVisible');return;}
    experienceTools.close(false);
  }
  uiVisible=visible;document.body.classList.toggle('ui-hidden',!visible);$('#show-ui').hidden=visible;$('#interface').inert=!visible||document.body.classList.contains('studio-active');if(!visible)$('#show-ui').focus({preventScroll:true});
}
async function fullscreen(){
  try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('toast.fullscreenMenu');}catch{toast('toast.fullscreenUnavailable');}
}
function showError(key){if(experience)experience.ready=false;experienceTools?.dispose();experienceTools=null;$('#loader').classList.add('completed');document.body.classList.add('is-ready');$('#error').hidden=false;setText($('#error-detail'),key);$$('#interface button,#interface select:not([data-language])').forEach(b=>b.disabled=true);}

$$('button[data-view]').forEach(b=>b.addEventListener('click',()=>requestView(b.dataset.view)));
function reflectMode(mode){$$('button[data-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mode===mode)));setText($('#scene-label'),'indicator.'+mode);setText($('#announcement'),`mode.${mode}Announcement`);}
$$('button[data-mode]').forEach(b=>b.addEventListener('click',()=>{if(!experience?.ready)return;experience.setMode(b.dataset.mode);reflectMode(b.dataset.mode);}));
$('#hero-tour').addEventListener('click',()=>requestView('tour'));
$('#roof-toggle').addEventListener('click',()=>{if(!experience?.ready)return;if(experience)++experience.navigationId;experience.director.cancel();experience.setRoof(!experience.roofClosed);syncRoof();});
$('#pitch-toggle').addEventListener('click',()=>{
  if(!experience?.ready)return;if(experience.director.mode==='walk')requestView('interior');const store=!experience.pitchStored;experience.setPitch(store);$('#pitch-toggle').setAttribute('aria-pressed',String(store));setAttributeText($('#pitch-toggle'),'aria-label',store?'pitch.restore':'pitch.store');
  toast(store?'toast.storePitch':'toast.restorePitch');
});
$('#reset-camera').addEventListener('click',()=>{document.body.classList.remove('has-interacted');requestView('exterior');});
$('.brand').addEventListener('click',e=>{e.preventDefault();document.body.classList.remove('has-interacted');requestView('exterior');});
$('#stop-tour').addEventListener('click',()=>experience?.director.cancel());
$('#quality-select').addEventListener('change',e=>experience?.setQuality(e.target.value));
$('#capture').addEventListener('click',()=>experienceTools?.open('photo'));
$('#settings-toggle').addEventListener('click',()=>{const hidden=$('#settings-panel').classList.toggle('panel-hidden');$('#settings-toggle').setAttribute('aria-expanded',String(!hidden));});
$$('[data-fly]').forEach(button=>{
  const release=()=>experience?.director.keys.delete(button.dataset.fly);
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);experience?.director.keys.add(button.dataset.fly);});
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  button.addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();experience?.director.keys.add(button.dataset.fly);}});
  button.addEventListener('keyup',release);button.addEventListener('blur',release);
});
$('#hide-ui').addEventListener('click',()=>hideUI(false));$('#show-ui').addEventListener('click',()=>hideUI(true));$('#fullscreen').addEventListener('click',fullscreen);
document.addEventListener('fullscreenchange',()=>{setAttributeText($('#fullscreen'),'aria-label',document.fullscreenElement?'header.exitFullscreen':'header.fullscreen');experience?.resize();});
$('#info-button').addEventListener('click',()=>$('#about').showModal());$('#close-about').addEventListener('click',()=>$('#about').close());
$('#about').addEventListener('click',e=>{if(e.target===$('#about')){const rect=e.target.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)e.target.close();}});
$('#retry').addEventListener('click',()=>location.reload());
document.addEventListener('keydown',e=>{
  if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.isContentEditable||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||$('#about').open)return;
  if(e.code==='KeyH'){e.preventDefault();hideUI(!uiVisible);}
  if(e.code==='KeyF'){e.preventDefault();fullscreen();}
  if(e.code==='Escape'){if(experience)++experience.navigationId;experience?.director.cancel();if(!uiVisible)hideUI(true);}
  if(e.code==='Home'){e.preventDefault();requestView('exterior');}
});
document.addEventListener('experience-error',e=>showError(e.detail));
if(innerWidth<700){$('#settings-panel').classList.add('panel-hidden');$('#settings-toggle').setAttribute('aria-expanded','false');}

async function boot(){
  try{
    experience=new BernabeuExperience(canvas,{
      onProgress:(n,key)=>{$('#loading-bar').style.width=`${n*100}%`;$('#loading-percent').textContent=`${Math.round(n*100)}%`;setText($('#loading-label'),key);},
      onView,onTour,onInteraction:()=>document.body.classList.add('has-interacted'),onMechanism,
    });
    await experience.init();experience.setMode('day');reflectMode('day');onView('exterior');
    $('#loader').classList.add('completed');document.body.classList.add('is-ready');
    window.bernabeuExperience=experience;
    experienceTools=new ExperienceTools(experience,{toast,onMode:reflectMode,syncRoof});window.bernabeuTools=experienceTools;
  }catch(error){if(experience?.disposed)return;console.error('Bernabéu initialization:',error);experience?.dispose();showError('errors.initialization');}
}
boot();
window.addEventListener('pagehide',e=>{if(!e.persisted){disposeLocalization();experienceTools?.dispose();experience?.dispose();}});
if(import.meta.hot)import.meta.hot.dispose(()=>{disposeLocalization();experienceTools?.dispose();experience?.dispose();});
