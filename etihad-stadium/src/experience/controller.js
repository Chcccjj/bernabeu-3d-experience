import * as THREE from 'three';
import {createNavigation} from './navigation.js';
import {createCameraJourney} from './camera-journey.js';
import {createMatchday,createDisplays} from './matchday.js';
import {createFootballMatch} from './football-match.js';
import {createEventSetup} from './event-setup.js';
export function createExperience(ctx,layout,{setTime,view,toast,prepareArchitecture}){
 const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
 const navigation=createNavigation(ctx,()=>view('exterior'));
 const journey=createCameraJourney(ctx,navigation,(active,progress,phase)=>{const button=$('#tour');button.setAttribute('aria-pressed',String(active));button.textContent=active?'Ⅱ 停止巡游':'▷ 电影巡游';$('#tour-status').hidden=!active&&progress!==1;$('#tour-status').textContent=phase;$('#tour-progress').value=Math.round(progress*100);$('#tour-progress').hidden=!active;});
 const football=createFootballMatch(ctx,layout),matchday=createMatchday(ctx,layout),displays=createDisplays(ctx),event=createEventSetup(ctx,-5.18);let mode='day',roof=0,roofTarget=0,lastShadow=0,uiHidden=false;
 const hud=document.createElement('aside');hud.className='match-hud';hud.hidden=true;hud.setAttribute('aria-label','曼彻斯特德比演示');hud.innerHTML='<small>SIMULATED MANCHESTER DERBY</small><strong id="derby-score">曼城0:0曼联</strong><span id="derby-phase">中圈开球</span><div><button data-activity-view="match">球场比赛</button><button data-activity-view="arrivals">入场人流</button><button data-activity-view="parking">停车场</button></div>';document.body.appendChild(hud);for(const b of hud.querySelectorAll('button'))b.onclick=()=>view(b.dataset.activityView);
 const listeners=[];function bind(element,type,fn,options){element.addEventListener(type,fn,options);listeners.push(()=>element.removeEventListener(type,fn,options));}
 function setMode(value){mode=value;hud.hidden=value!=='match';document.body.dataset.matchday=String(value==='match');ctx.state.matchday=value==='match';setTime(value!=='day');matchday.setEnabled(value==='match');football.setEnabled(value==='match');refreshHud();layout.activity?.setMatchday(value==='match');displays.setMode(value);if(value==='match')resetEvent();for(const b of all('[data-scene-mode]'))b.setAttribute('aria-pressed',String(b.dataset.sceneMode===value));$('#light-status').textContent={day:'DAYLIGHT',night:'NIGHT',match:'MATCH DAY · DEMO'}[value];$('#crowd-status').textContent=value==='match'?`${matchday.count.toLocaleString()} 位助威观众 · 曼城 vs 曼联`:'空场';ctx.refreshShadows();}
 function resetEvent(){event.setEnabled(false);$('#event-setup').setAttribute('aria-pressed','false');$('#event-status').textContent='足球比赛场地';}
 function setEvent(enabled){if(enabled){if(mode==='match')setMode('night');roofTarget=0;prepareArchitecture();view('top');}event.setEnabled(enabled);$('#event-setup').setAttribute('aria-pressed',String(enabled));$('#event-status').textContent=enabled?'临时保护层与舞台 · 布置示意':'正在恢复足球场';}
 function resetRoof(){roofTarget=0;$('#roof-structure').setAttribute('aria-pressed','false');}
 function setRoof(enabled){if(mode==='match')setMode('night');resetEvent();prepareArchitecture();view(enabled?'roofStructure':'exterior');roofTarget=enabled?1:0;$('#roof-structure').setAttribute('aria-pressed',String(enabled));}
 function hideUi(value){uiHidden=value;document.body.dataset.uiHidden=String(value);document.querySelector('main').inert=value;$('#ui-restore').hidden=!value;$('#hide-ui').setAttribute('aria-pressed',String(value));}
 for(const b of all('[data-scene-mode]'))bind(b,'click',()=>setMode(b.dataset.sceneMode));
 bind($('#roof-structure'),'click',()=>setRoof(roofTarget===0));bind($('#roof-restore'),'click',()=>setRoof(false));bind($('#event-setup'),'click',()=>setEvent(!event.enabled));bind($('#event-restore'),'click',()=>setEvent(false));bind($('#hide-ui'),'click',()=>hideUi(!uiHidden));bind($('#ui-restore'),'click',()=>hideUi(false));
 bind(window,'keydown',e=>{if(/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName))return;if(e.key.toLowerCase()==='h')hideUi(!uiHidden);if(e.code==='Digit3')setMode('match');});
 for(const b of all('[data-move]')){bind(b,'pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);navigation.press(b.dataset.move,true);});for(const name of['pointerup','pointercancel','lostpointercapture'])bind(b,name,()=>navigation.press(b.dataset.move,false));}
 bind(ctx.renderer.domElement,'navigationinput',()=>{if(journey.running)journey.cancel();});
 function refreshHud(){hud.querySelector('#derby-score').textContent=ctx.i18n?.t(`曼城${football.state.score[0]}:${football.state.score[1]}曼联`)??`曼城${football.state.score[0]}:${football.state.score[1]}曼联`;const label='模拟比赛 · '+football.state.label.split(' · ')[1];hud.querySelector('#derby-phase').textContent=ctx.i18n?.t(label)??label;}bind(document,'etihad:language',refreshHud);
 let timer=0,lastNavigation;
 function update(dt){journey.update();navigation.update(dt);football.update(dt);matchday.update(ctx.state.time,football.state.goal?1:0);displays.update(football.state,mode==='match'?football.clock:ctx.state.time);const eventMoving=event.update(dt);roof=THREE.MathUtils.lerp(roof,roofTarget,1-Math.exp(-dt*4));if(Math.abs(roof-roofTarget)<.001)roof=roofTarget;
  const offsets={roof:70,steel:32,cables:38,lighting:68,services:53};for(const[id,lift]of Object.entries(offsets))layout.layers[id].position.y+=roof*lift;
  if((eventMoving||roof!==roofTarget)&&performance.now()-lastShadow>200){ctx.refreshShadows();lastShadow=performance.now();}
  if(lastNavigation!==navigation.mode){lastNavigation=navigation.mode;$('#navigation-help').hidden=!navigation.mode;$('#navigation-help').textContent=navigation.mode==='fly'?'W A S D 移动 · Q / E 升降 · Shift 加速 · 拖动环视 · Esc 返回':'拖动环视 · Esc 返回建筑全景';$('#navigation-pad').hidden=navigation.mode!=='fly';}
  timer+=dt;if(timer>.5){timer=0;if(mode==='match')refreshHud();$('#render-status').textContent=`${ctx.fps??'—'} FPS · ${ctx.state.performanceMode?'性能优先':'标准画质'}`;}
  if(!event.enabled&&event.progress===0&&$('#event-status').textContent!==ctx.i18n?.t('足球比赛场地'))$('#event-status').textContent=ctx.i18n?.t('足球比赛场地')??'足球比赛场地';
 }
 return {restorePresentation(s){setMode(s.mode);roofTarget=s.roof?1:0;event.setEnabled(s.event);$('#roof-structure').setAttribute('aria-pressed',String(s.roof));$('#event-setup').setAttribute('aria-pressed',String(s.event));},journey,navigation,setMode,setEvent,resetEvent,setRoof,resetRoof,update,get mode(){return mode;},get roofProgress(){return roof;},get eventProgress(){return event.progress;},crowdCount:matchday.count,matchDiagnostics:()=>football.diagnostics(),dispose(){listeners.forEach(f=>f());navigation.dispose();football.dispose();matchday.dispose();displays.dispose();hud.remove();}};
}
