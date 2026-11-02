import * as THREE from 'three';
import {canvasTexture} from '../model/geometry.js';
import {CAMERA_VIEWS} from '../camera.js';
import {FORMATS,encodeView,decodeView,readBookmarks,chooseRecordingType} from './state.js';
import {Ambience} from './ambience.js';
import {SceneRecorder} from './recorder.js';
import './features.css';
import {t,withLanguage,formatDecimal,bindStaticUI,setText,setAttributeText,onLanguageChange,languageControl,LocalizedError} from '../i18n/index.js';

const HOTSPOTS=[
  {id:'skin',title:'hotspot.skin.title',point:[123,34,58],inside:false,view:{position:[180,37,125],target:[105,32,55],fov:48},text:'hotspot.skin.body'},
  {id:'roof',title:'hotspot.roof.title',point:[65,69,24],inside:false,view:{position:[100,160,140],target:[0,62,0],fov:48},text:'hotspot.roof.body'},
  {id:'screen',title:'hotspot.screen.title',point:[-38,55,33],inside:true,view:{position:[18,34,22],target:[-38,55,-15],fov:65},text:'hotspot.screen.body'},
  {id:'turf',title:'hotspot.turf.title',point:[10,2,12],inside:true,view:{position:[-46,16,39],target:[0,1,0],fov:62},text:'hotspot.turf.body'},
  {id:'tunnel',title:'hotspot.tunnel.title',point:[-61,3,0],inside:true,view:{position:[-48,4,-9],target:[-74,2.5,0],fov:65},text:'hotspot.tunnel.body'},
  {id:'storage',title:'hotspot.storage.title',point:[40,-6,-39],inside:false,section:true,view:{position:[118,90,112],target:[0,-6,-24],fov:48},text:'hotspot.storage.body'},
];
const PRESETS={
  aerial:{name:'全景外观',position:[263,230,280],target:[0,26,0],fov:42,mode:'day'},
  facade:{name:'金属近景',position:[180,37,125],target:[105,32,55],fov:48,mode:'day'},
  roof:{name:'屋顶鸟瞰',position:[80,205,78],target:[0,40,0],fov:48,mode:'day'},
  bowl:{name:'蓝白看台',...CAMERA_VIEWS.interior,mode:'match'},
  field:{name:'草坪中央',...CAMERA_VIEWS.pitch,mode:'day'},
  night:{name:'夜景外观',position:[260,130,255],target:[0,30,0],fov:48,mode:'night'},
};
const template=`
<div class="experience-tools glass" role="toolbar" aria-label="探索工具">
 <button data-tool="photo" aria-label="高清拍照"><svg><use href="#i-camera"/></svg><span>拍照</span></button>
 <button data-tool="video" aria-label="运镜录像"><svg><use href="#i-play"/></svg><span>录像</span></button>
 <button data-tool="explore" aria-label="探索与选座"><svg><use href="#i-interior"/></svg><span>探索</span></button>
 <button data-tool="share" aria-label="分享与收藏机位"><svg><use href="#i-arrow"/></svg><span>分享</span></button>
</div>
<aside class="experience-drawer glass" aria-label="探索工作台" hidden>
 <header class="drawer-heading"><div><small id="drawer-kicker">YOUR PERSPECTIVE</small><h2 id="drawer-title">高清拍照</h2></div><div class="drawer-actions">${languageControl()}<button class="icon-button" id="close-drawer" aria-label="关闭工作台"><svg><use href="#i-close"/></svg></button></div></header>
 <section data-panel="photo" hidden>
  <p class="drawer-intro">选好机位，导出属于你的伯纳乌。</p>
  <div class="preset-grid">${Object.entries(PRESETS).map(([id,p])=>`<button data-preset="${id}">${p.name}</button>`).join('')}</div>
  <label class="control-row">画幅<select id="photo-format"><option>16:9</option><option>9:16</option><option>3:4</option><option>1:1</option></select></label>
  <label class="control-row">导出尺寸<select id="photo-size"><option value="3840">4K · 长边 3840</option><option value="2048">高清 · 长边 2048</option><option value="1024">预览 · 长边 1024</option></select></label>
  <label class="control-row">文件格式<select id="photo-mime"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select></label>
  <label class="range-label" for="photo-fov">镜头视角 <output id="fov-value">50°</output></label><input id="photo-fov" type="range" min="28" max="85" step="1" value="50">
  <label class="range-label" for="photo-exposure">曝光 <output id="exposure-value">1.00</output></label><input id="photo-exposure" type="range" min="0.5" max="1.5" step="0.02" value="1">
  <label class="check-row"><input id="photo-grid" type="checkbox" checked>显示构图参考线</label>
  <button class="primary-action" id="export-photo">导出高清图片 <span>↗</span></button>
  <p class="tool-status" id="photo-status" role="status">图片只包含三维场景，界面不会入镜。</p><a id="photo-download" class="result-download" hidden>再次保存图片 ↓</a>
 </section>
 <section data-panel="video" hidden>
  <p class="drawer-intro">录下实时运镜，直接保存为视频。</p>
  <label class="control-row">画幅<select id="video-format"><option>16:9</option><option>9:16</option><option>3:4</option></select></label>
  <label class="control-row">运镜<select id="video-preset"><option value="orbit">15 秒 · 银色外立面</option><option value="tour">36 秒 · 飞入球场</option><option value="roof">15 秒 · 屋顶开合</option></select></label>
  <label class="check-row"><input id="video-audio" type="checkbox">录入环境声</label>
  <p class="micro-note" id="video-capability"></p>
  <button class="primary-action" id="record-start">开始录制 <span>●</span></button>
  <button class="secondary-action" id="record-stop" hidden>停止并保存当前片段</button>
  <progress id="record-progress" max="1" value="0" hidden></progress>
  <p class="tool-status" id="video-status" role="status">录制前会平滑移动到起始机位。</p>
  <video id="record-preview" controls playsinline preload="metadata" hidden></video><a id="video-download" class="result-download" hidden>保存视频 ↓</a>
 </section>
 <section data-panel="explore" hidden>
  <div class="explore-tabs" role="tablist" aria-label="探索方式"><button role="tab" data-tab="seats" aria-selected="true">选座</button><button role="tab" data-tab="routes" aria-selected="false">路线</button><button role="tab" data-tab="hotspots" aria-selected="false">建筑</button><button role="tab" data-tab="section" aria-selected="false">剖面</button></div>
  <div data-explore="seats">
   <p class="drawer-intro">选一个席位，看看属于它的球场视野。</p>
   <div class="seat-map" aria-label="虚拟看台分区"><button data-sector="north">长边 A</button><button data-sector="west">球门 A</button><span class="map-pitch">105 × 68</span><button data-sector="east">球门 B</button><button data-sector="south">长边 B</button></div>
   <div class="tier-buttons"><button data-row="10">下层</button><button data-row="32">中层</button><button data-row="56">上层</button></div>
   <label class="range-label" for="seat-row">排数 <output id="seat-row-label">32</output></label><input id="seat-row" type="range" min="1" max="64" value="32">
   <label class="control-row">席位<input id="seat-number" type="number" min="1" value="1" inputmode="numeric"></label>
   <button class="primary-action" id="visit-seat">查看这个席位 <span>↗</span></button><p class="tool-status" id="seat-status" role="status"></p>
   <p class="micro-note">模型中的虚拟排号与席位，不对应官方售票座位。进入看台后，也可以直接点击座椅选位。</p>
  </div>
  <div data-explore="routes" hidden>
   <p class="drawer-intro">从通道走上球场，听见空间逐渐打开。</p>
   <button class="route-card" id="walk-route"><span>01 / WALK ONTO THE PITCH</span><strong>球员通道 → 草坪边缘</strong><small>先平滑进入通道，再沿缓坡走出；可随时拖动接管。</small></button>
   <button class="route-card" id="walk-free"><span>02 / AT YOUR OWN PACE</span><strong>草坪自由步行</strong><small>W A S D 移动，Shift 加快；触屏使用方向按钮。</small></button>
   <label class="check-row"><input id="ambient-toggle" type="checkbox">开启环境声与步行脚步声</label>
   <label class="range-label" for="ambient-volume">音量 <output id="volume-value">35%</output></label><input id="ambient-volume" type="range" min="0" max="100" value="35">
   <p class="micro-note">环境声为程序合成，不使用麦克风。比赛日氛围更强；步行范围限定在通道与球场区域。</p>
  </div>
  <div data-explore="hotspots" hidden><p class="drawer-intro">选择建筑部位，镜头会带你靠近。</p><div class="hotspot-list">${HOTSPOTS.map(p=>`<button data-hotspot="${p.id}">${t(p.title)}<span>↗</span></button>`).join('')}</div><article id="hotspot-info" class="hotspot-info"><h3>建筑里的六个细节</h3><p>也可点击场景中的数字标记。</p></article></div>
  <div data-explore="section" hidden><p class="drawer-intro">让视线穿过地面，看见同一批草坪托盘。</p><button class="primary-action" id="section-toggle" aria-pressed="false">进入草坪收纳剖面 <span>↗</span></button><button class="secondary-action" id="section-pitch">收纳 / 恢复草坪</button><p class="tool-status" id="section-status">足球场模式</p><p class="micro-note">剖面隐藏外壳与地面，展示简化支架、转运与分层存放过程。此模式不是工程施工图。</p></div>
 </section>
 <section data-panel="share" hidden>
  <p class="drawer-intro">把此刻的角度、光影和建筑状态，一起分享。</p>
  <label class="stack-label" for="view-link">当前机位链接</label><input id="view-link" class="wide-input" type="text" readonly>
  <button class="primary-action" id="copy-view">复制机位链接 <span>↗</span></button>
  <div class="bookmark-form"><label class="stack-label" for="bookmark-name">收藏机位</label><input id="bookmark-name" class="wide-input" maxlength="32" placeholder="给这个角度起个名字"><button class="secondary-action" id="save-view">保存到我的机位</button></div>
  <div id="bookmark-list" class="bookmark-list"></div><p class="micro-note">最多保存 8 个机位，仅存于当前浏览器。分享链接无需接收者登录。</p>
 </section>
</aside>
<div class="composition-frame" aria-hidden="true" hidden><div class="thirds-grid"></div><span id="frame-label">16:9</span></div>`;

export class ExperienceTools {
  constructor(engine,{toast,onMode,syncRoof}={}){
    this.engine=engine;this.toast=toast||(()=>{});this.onMode=onMode;this.syncRoof=syncRoof;this.urls=new Set();this.engine.navigationId??=0;this.active=null;this.exploreTab='seats';this.bookmarks=readBookmarks(this.storage());
    this.root=document.createElement('div');this.root.id='upgrade-ui';this.root.innerHTML=template;document.querySelector('#experience').append(this.root);
    this.$=s=>this.root.querySelector(s);this.$$=s=>[...this.root.querySelectorAll(s)];
    bindStaticUI(this.root);setText(this.$('#drawer-title'),'tool.photoTitle');
    this.drawer=this.$('.experience-drawer');this.frame=this.$('.composition-frame');this.ambience=new Ambience();
    this.recorder=new SceneRecorder(engine,{ambience:this.ambience,onState:state=>this.recordState(state),onProgress:(elapsed,total)=>{this.$('#record-progress').value=elapsed/total;setText(this.$('#video-status'),'video.recording',{seconds:Math.round(elapsed*10)/10,total});},onResult:result=>this.videoResult(result),onError:error=>this.reportError(error,'#video-status')});
    this.bind();this.createMarkers();this.updateSeat(true);this.renderBookmarks();this.syncSection();
    this.unsubscribeLanguage=onLanguageChange(()=>{this.syncPhoto();if(this.active==='share')this.updateLink();});
    this.resize=()=>{this.syncExportLimits();if(this.active==='photo'||this.active==='video')this.fitFrame();};window.addEventListener('resize',this.resize);this.syncExportLimits();
    this.key=e=>{if(e.key==='Escape'&&this.active){e.stopImmediatePropagation();this.close();}};document.addEventListener('keydown',this.key);
    this.pointerDown=e=>{this.pointer=[e.clientX,e.clientY];};this.pointerUp=e=>this.pick(e);engine.canvas.addEventListener('pointerdown',this.pointerDown);engine.canvas.addEventListener('pointerup',this.pointerUp);
    this.previousCamera=engine.camera.position.clone();engine.onFrame=()=>this.update();
    const shared=decodeView(location.hash);if(shared)this.restore(shared);
    this.hashChange=()=>{const view=decodeView(location.hash);if(view)this.restore(view);};window.addEventListener('hashchange',this.hashChange);
    const type=this.recorder.supported()?chooseRecordingType(t=>MediaRecorder.isTypeSupported(t)):null;
    setText(this.$('#video-capability'),type?'video.supported':'video.unsupported',{format:type?.startsWith('video/mp4')?'MP4':'WebM'});this.$('#record-start').disabled=!type;
  }
  storage(){try{return window.localStorage;}catch{return {getItem:()=>null,setItem:()=>{throw new LocalizedError('errors.storage');}};}}
  reportError(error,selector){
    const key=error?.key||'errors.detail',params=error?.params||{message:error?.message||String(error)};
    if(selector)setText(this.$(selector),key,params);this.toast(key,params);
  }
  bind(){
    this.$$('[data-tool]').forEach(b=>b.addEventListener('click',()=>this.open(b.dataset.tool)));
    this.$('#close-drawer').addEventListener('click',()=>this.close());
    for(const id of ['photo-format','video-format'])this.$('#'+id).addEventListener('change',()=>this.fitFrame());
    this.$('#photo-grid').addEventListener('change',()=>this.frame.classList.toggle('no-grid',!this.$('#photo-grid').checked));
    this.$('#photo-fov').addEventListener('input',e=>{this.engine.camera.fov=Number(e.target.value);this.engine.camera.updateProjectionMatrix();this.$('#fov-value').value=`${e.target.value}°`;});
    this.$('#photo-exposure').addEventListener('input',e=>{this.engine.renderer.toneMappingExposure=Number(e.target.value);this.$('#exposure-value').value=formatDecimal(Number(e.target.value));});
    this.$$('[data-preset]').forEach(b=>b.addEventListener('click',()=>this.preset(b.dataset.preset)));
    this.$('#export-photo').addEventListener('click',()=>this.photo());
    this.$('#record-start').addEventListener('click',()=>this.recorder.start({format:this.$('#video-format').value,preset:this.$('#video-preset').value,audio:this.$('#video-audio').checked}).catch(e=>this.reportError(e,'#video-status')));
    this.$('#record-stop').addEventListener('click',()=>this.recorder.stop());
    const tabs=this.$$('[data-tab]');
    tabs.forEach((button,index)=>{
      const panel=this.$(`[data-explore="${button.dataset.tab}"]`);button.id=`explore-tab-${button.dataset.tab}`;panel.id=`explore-panel-${button.dataset.tab}`;
      button.setAttribute('aria-controls',panel.id);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);
      button.addEventListener('click',()=>this.selectTab(button.dataset.tab));
      button.addEventListener('keydown',event=>{
        const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:null;
        if(next===null)return;event.preventDefault();this.selectTab(tabs[next].dataset.tab);tabs[next].focus();
      });
    });
    this.$$('[data-row]').forEach(b=>b.addEventListener('click',()=>{this.$('#seat-row').value=b.dataset.row;this.updateSeat(true);}));
    this.$$('[data-sector]').forEach(b=>b.addEventListener('click',()=>{this.sector=b.dataset.sector;this.updateSeat(true);}));
    this.$('#seat-row').addEventListener('input',()=>this.updateSeat(true));this.$('#seat-number').addEventListener('change',()=>this.updateSeat());
    this.$('#visit-seat').addEventListener('click',()=>this.goSeat(this.selectedSeat));
    this.$('#walk-route').addEventListener('click',()=>this.walk(true));this.$('#walk-free').addEventListener('click',()=>this.walk(false));
    this.$('#ambient-toggle').addEventListener('change',e=>this.ambience.enable(e.target.checked).catch(error=>{e.target.checked=false;this.reportError(error);}));
    this.$('#ambient-volume').addEventListener('input',e=>{this.ambience.update(this.engine.mode,Number(e.target.value)/100);this.$('#volume-value').value=e.target.value+'%';});
    this.$$('[data-hotspot]').forEach(b=>b.addEventListener('click',()=>this.hotspot(b.dataset.hotspot)));
    this.$('#section-toggle').addEventListener('click',()=>this.section(!this.engine.cutaway));
    this.$('#section-pitch').addEventListener('click',()=>this.engine.setPitch(!this.engine.pitchStored));
    this.$('#copy-view').addEventListener('click',()=>this.copy());this.$('#save-view').addEventListener('click',()=>this.saveView());
    this.$('#record-preview').addEventListener('loadedmetadata',e=>{const v=e.target;this.lastVideoMetadata={width:v.videoWidth,height:v.videoHeight,duration:v.duration};v.dataset.verified=`${v.videoWidth}x${v.videoHeight}`;});
  }
  open(panel){
    if(this.active===panel){this.close();return;}
    if(this.busy())return;
    if(this.active)this.close(false);
    this.active=panel;this.drawer.hidden=false;document.body.classList.add('feature-panel-open');this.$$('.experience-drawer [data-panel]').forEach(s=>s.hidden=s.dataset.panel!==panel);
    setText(this.$('#drawer-title'),`tool.${panel}Title`);
    this.$$('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===panel)));
    ++this.engine.navigationId;this.engine.director.cancel();
    if(panel==='photo'||panel==='video'){
      this.studioPrevious={fov:this.engine.camera.fov,exposure:this.engine.renderer.toneMappingExposure};
      document.body.classList.add('studio-active');document.querySelector('#interface').inert=true;
      this.frame.hidden=false;this.fitFrame();this.syncPhoto();
    }
    if(panel==='share')this.updateLink();
    if(panel==='explore')this.selectTab(this.exploreTab);
    this.$('#close-drawer').focus({preventScroll:true});
  }
  busy(){
    if(this.disposed)return true;
    if(this.engine.exporting){this.toast('errors.exportBusy');return true;}
    if(this.recorder.state!=='idle'){this.toast('toast.stopRecording');return true;}
    return false;
  }
  close(focus=true){
    if(this.engine.exporting){this.toast('errors.exportBusy');return;}
    if(this.recorder.state!=='idle'){this.recorder.stop();this.toast('video.finishing');return;}
    const old=this.active;this.active=null;this.engine.navigationId++;this.drawer.hidden=true;this.frame.hidden=true;this.markers.visible=false;
    document.body.classList.remove('feature-panel-open','studio-active');document.querySelector('#interface').inert=document.body.classList.contains('ui-hidden');
    this.engine.canvas.style.cssText='';
    if(this.studioPrevious){this.engine.camera.fov=this.studioPrevious.fov;this.engine.camera.updateProjectionMatrix();this.engine.renderer.toneMappingExposure=this.studioPrevious.exposure;this.studioPrevious=null;}
    this.engine.resize();this.$$('[data-tool]').forEach(b=>b.setAttribute('aria-pressed','false'));
    if(focus&&old)this.$(`[data-tool="${old}"]`).focus({preventScroll:true});
  }
  fitFrame(){
    if(!['photo','video'].includes(this.active))return;
    const format=this.$(this.active==='photo'?'#photo-format':'#video-format').value,ratio=FORMATS[format],mobile=innerWidth<760;
    const availableW=mobile?innerWidth-32:innerWidth-420,availableH=mobile?Math.max(130,innerHeight-430):innerHeight-120;
    let w=availableW,h=w/ratio;if(h>availableH){h=availableH;w=h*ratio;}
    const left=mobile?(innerWidth-w)/2:26+(availableW-w)/2,top=mobile?20:60+(availableH-h)/2;
    Object.assign(this.engine.canvas.style,{position:'absolute',width:`${Math.round(w)}px`,height:`${Math.round(h)}px`,left:`${Math.round(left)}px`,top:`${Math.round(top)}px`});
    Object.assign(this.frame.style,{width:`${Math.round(w)}px`,height:`${Math.round(h)}px`,left:`${Math.round(left)}px`,top:`${Math.round(top)}px`});
    this.$('#frame-label').textContent=format;this.engine.resize();
  }
  syncPhoto(){
    this.$('#photo-fov').value=Math.round(this.engine.camera.fov);this.$('#fov-value').value=Math.round(this.engine.camera.fov)+'°';
    this.$('#photo-exposure').value=this.engine.renderer.toneMappingExposure;this.$('#exposure-value').value=formatDecimal(this.engine.renderer.toneMappingExposure);
  }
  syncExportLimits(){
    const limit=Math.min(this.engine.renderer.capabilities.maxTextureSize,innerWidth<720?2048:4096),select=this.$('#photo-size');
    for(const option of select.options)option.disabled=Number(option.value)>limit;
    if(select.selectedOptions[0].disabled)select.value=[...select.options].find(option=>!option.disabled).value;
  }
  async openRoof(){if(this.engine.roofClosed||this.engine.mechanisms.roof>.001){const done=await this.engine.setRoof(false);this.syncRoof?.();return done;}return true;}
  async preset(id){
    if(this.busy()||!PRESETS[id])return;
    const p=PRESETS[id],token=++this.engine.navigationId;this.engine.setCutaway(false);this.mode(p.mode);if(!await this.openRoof()||token!==this.engine.navigationId)return;
    const wide=['aerial','night'].includes(id),framing=wide?Math.max(1,Math.min(1.75,.82/this.engine.camera.aspect)):1;
    const pose={...p,position:p.position.map((n,i)=>i===1?n*(1+(framing-1)*.62):n*framing)};
    await this.engine.director.moveTo(pose,{mode:wide?'exterior':'hotspot'});if(token===this.engine.navigationId)this.syncPhoto();
  }
  mode(mode){this.engine.setMode(mode);this.ambience.update(mode);this.onMode?.(mode);}
  objectURL(blob){const url=URL.createObjectURL(blob);this.urls.add(url);return url;}
  releaseURL(url){if(url){URL.revokeObjectURL(url);this.urls.delete(url);}}
  async photo(){
    if(this.busy())return;
    const button=this.$('#export-photo'),status=this.$('#photo-status');button.disabled=true;setText(status,'photo.rendering');this.engine.director.cancel();
    try{
      const result=await this.engine.exportImage({format:this.$('#photo-format').value,longEdge:Number(this.$('#photo-size').value),mime:this.$('#photo-mime').value});
      this.lastPhoto=result;this.releaseURL(this.photoURL);this.photoURL=this.objectURL(result.blob);
      const link=this.$('#photo-download');link.href=this.photoURL;link.download=`Bernabeu-${this.engine.mode}-${result.width}x${result.height}.${result.mime==='image/jpeg'?'jpg':'png'}`;link.hidden=false;
      setText(status,'photo.result',{width:result.width,height:result.height,size:Math.round(result.blob.size/1048576*10)/10});status.dataset.size=`${result.width}x${result.height}`;link.click();
    }catch(e){this.reportError(e,'#photo-status');}finally{button.disabled=false;}
  }
  recordState(state){
    this.engine.canvas.dataset.recording=state;
    const busy=state!=='idle';this.$('#record-start').hidden=busy;this.$('#record-stop').hidden=!busy;this.$('#record-stop').disabled=state==='encoding';
    for(const id of ['video-format','video-preset','video-audio'])this.$('#'+id).disabled=busy;
    this.$('#record-progress').hidden=state!=='recording';
    if(state==='preparing'){
      this.$('#record-preview').pause();this.$('#record-preview').hidden=true;this.$('#video-download').hidden=true;
      setText(this.$('#video-status'),'video.preparing');
    }
    if(state==='idle')setText(this.$('#video-status'),'video.note');
    if(state==='idle'&&this.videoURL){this.$('#record-preview').hidden=false;this.$('#video-download').hidden=false;}
    if(state==='encoding')setText(this.$('#video-status'),'video.encoding');
  }
  videoResult(result){
    this.lastVideo=result;this.releaseURL(this.videoURL);this.videoURL=this.objectURL(result.blob);
    const player=this.$('#record-preview');player.src=this.videoURL;player.hidden=false;
    const link=this.$('#video-download');link.href=this.videoURL;link.download=`Bernabeu-${result.width}x${result.height}.${result.extension}`;setText(link,'video.downloadFormat',{format:result.extension.toUpperCase()});link.hidden=false;
    setText(this.$('#video-status'),result.reason?'video.resultReason':'video.result',{width:result.width,height:result.height,seconds:Math.round(result.duration*10)/10,size:Math.round(result.blob.size/1048576*10)/10,reason:{key:result.reason}});
  }
  selectTab(tab){
    this.exploreTab=tab;this.$$('[data-tab]').forEach(b=>{const selected=b.dataset.tab===tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});this.$$('[data-explore]').forEach(s=>s.hidden=s.dataset.explore!==tab);
    this.markers.visible=this.active==='explore'&&tab==='hotspots';
    if(tab==='section')this.syncSection();
  }
  updateSeat(reposition=false){
    const row=Math.min(64,Math.max(1,Number(this.$('#seat-row').value)||1)),ids=this.engine.bowl.rowSeats[row-1];
    const input=this.$('#seat-number');input.max=ids.length;
    if(reposition){
      const axis={north:[0,1],south:[0,-1],west:[-1,0],east:[1,0]}[this.sector||'north'];
      let best=0,score=-Infinity;ids.forEach((id,i)=>{const p=this.engine.bowl.seatRecords[id].p,n=Math.hypot(p[0],p[2]),value=(p[0]*axis[0]+p[2]*axis[1])/n;if(value>score){score=value;best=i;}});input.value=best+1;
    }
    const number=Math.min(ids.length,Math.max(1,Math.round(Number(input.value)||1)));input.value=number;
    this.selectedSeat={...this.engine.bowl.seatRecords[ids[number-1]],id:ids[number-1]};this.$('#seat-row-label').value=String(row);
    setText(this.$('#seat-status'),'seats.selected',{row,seat:number,count:ids.length});
  }
  async goSeat(seat){
    if(!seat||this.busy())return;const token=++this.engine.navigationId;this.engine.setCutaway(false);
    if(!await this.openRoof()||token!==this.engine.navigationId)return;
    this.highlightSeat(seat.id);const front=new THREE.Vector3(-Math.sin(seat.rot),0,-Math.cos(seat.rot)),[x,y,z]=seat.p;
    await this.engine.director.moveTo({position:[x+front.x*.08,y+1.2,z+front.z*.08],target:[0,1.7,0],fov:68},{mode:'seat'});
    if(token===this.engine.navigationId){const params={row:seat.row,seat:seat.number};setText(this.$('#seat-status'),'seats.viewing',params);this.toast('seats.toast',params);}
  }
  highlightSeat(id){
    for(const mesh of [this.engine.bowl.nearSeats,this.engine.bowl.farSeats]){
      if(this.highlight){mesh.setColorAt(this.highlight.id,this.highlight.color);}
    }
    const color=new THREE.Color();this.engine.bowl.nearSeats.getColorAt(id,color);this.highlight={id,color};
    for(const mesh of [this.engine.bowl.nearSeats,this.engine.bowl.farSeats]){mesh.setColorAt(id,new THREE.Color(0xe6bf71));mesh.instanceColor.needsUpdate=true;}
  }
  async walk(guided){
    if(this.busy())return;
    const token=++this.engine.navigationId;this.engine.setCutaway(false);if(this.engine.pitchStored||this.engine.mechanisms.pitch>.001)await this.engine.setPitch(false);
    if(token!==this.engine.navigationId||!await this.openRoof()||token!==this.engine.navigationId)return;
    this.toast(guided?'routes.enterGuided':'routes.enterFree');
    if(guided)this.engine.director.walkTour();else this.engine.director.moveTo({position:[-38,2.8,-8],target:[10,12,0],fov:70},{mode:'walk'});
    if(innerWidth<760)this.close(false);
  }
  async section(value){
    if(this.busy())return;const token=++this.engine.navigationId;
    this.engine.director.cancel();this.engine.setCutaway(value);this.syncSection();
    if(value)await this.engine.director.moveTo(HOTSPOTS.at(-1).view,{mode:'study'});
    else {if(!await this.openRoof()||token!==this.engine.navigationId)return;await this.engine.director.moveTo(CAMERA_VIEWS.exterior,{mode:'exterior'});}
  }
  syncSection(){
    const value=this.engine.cutaway,p=this.engine.mechanisms.pitch,moving=Math.abs(p-(this.engine.pitchStored?1:0))>.001,key=`${value}-${this.engine.pitchStored}-${moving}-${Math.round(p*100)}`;
    if(key===this.sectionKey)return;this.sectionKey=key;
    this.$('#section-toggle').setAttribute('aria-pressed',String(value));setText(this.$('#section-toggle'),value?'section.exit':'section.enter',{},true);
    setText(this.$('#section-status'),moving?(this.engine.pitchStored?'section.storing':'section.restoring'):(this.engine.pitchStored?'section.stored':'section.football'),{percent:Math.round((this.engine.pitchStored?p:1-p)*100)});
  }
  createMarkers(){
    this.markers=new THREE.Group();this.markers.name='Architecture exploration markers';this.engine.scene.add(this.markers);this.markers.visible=false;
    HOTSPOTS.forEach((p,i)=>{
      const map=canvasTexture(128,128,(c,w,h)=>{c.fillStyle='#14212bea';c.beginPath();c.arc(w/2,h/2,47,0,Math.PI*2);c.fill();c.strokeStyle='#dfc99c';c.lineWidth=3;c.stroke();c.fillStyle='#f4e8cf';c.font='500 46px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1).padStart(2,'0'),64,67);});
      const marker=new THREE.Sprite(new THREE.SpriteMaterial({map,depthWrite:false}));marker.position.set(...p.point);marker.scale.set(5.5,5.5,1);marker.userData.hotspot=p.id;this.markers.add(marker);
    });this.raycaster=new THREE.Raycaster();
  }
  async hotspot(id){
    if(this.busy())return;
    const p=HOTSPOTS.find(h=>h.id===id),token=++this.engine.navigationId;if(!p)return;
    const heading=document.createElement('h3'),body=document.createElement('p');setText(heading,p.title);setText(body,p.text);this.$('#hotspot-info').replaceChildren(heading,body);
    this.engine.setCutaway(!!p.section);if(!p.section&&(!await this.openRoof()||token!==this.engine.navigationId))return;
    await this.engine.director.moveTo(p.view,{mode:p.section?'study':'hotspot'});
  }
  pick(event){
    if(this.active!=='explore'||!this.pointer||Math.hypot(event.clientX-this.pointer[0],event.clientY-this.pointer[1])>6)return;
    const rect=this.engine.canvas.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),this.engine.camera);
    if(this.exploreTab==='hotspots'){
      const hits=this.raycaster.intersectObjects(this.markers.children.filter(s=>s.visible));if(hits[0])this.hotspot(hits[0].object.userData.hotspot);
    }else if(this.exploreTab==='seats'&&this.engine.camera.position.y<64&&Math.abs(this.engine.camera.position.x)<115&&Math.abs(this.engine.camera.position.z)<98&&!this.engine.director.moving){
      const hit=this.raycaster.intersectObject(this.engine.bowl.nearSeats)[0];
      if(hit?.instanceId!==undefined){const seat={...this.engine.bowl.seatRecords[hit.instanceId],id:hit.instanceId};this.$('#seat-row').value=seat.row;this.$('#seat-number').value=seat.number;this.updateSeat();this.goSeat(seat);}
    }
  }
  currentView(){const e=this.engine;return {v:1,p:e.camera.position.toArray(),t:e.director.controls.target.toArray(),f:e.camera.fov,m:e.mode,r:e.roofClosed,g:e.pitchStored,x:e.cutaway,c:e.director.mode};}
  updateLink(){const base=location.protocol==='file:'?'https://bernabeu-architecture-studio.justllama33.chatgpt.site':location.href.split('#')[0],url=withLanguage(base);url.hash=encodeView(this.currentView());this.$('#view-link').value=url.href;}
  async copy(){
    this.updateLink();const input=this.$('#view-link');
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(input.value);this.toast('share.copied');return;}}catch{/* Use a visible, selectable fallback. */}
    input.focus();input.select();let copied=false;try{copied=!!document.execCommand?.('copy');}catch{/* Keep the input selected for manual copying. */}
    this.toast(copied?'share.copied':'share.manual');
  }
  saveView(){
    const name=this.$('#bookmark-name').value.trim()||t('share.defaultName',{number:this.bookmarks.length+1});
    this.bookmarks.unshift({name,view:this.currentView()});this.bookmarks=this.bookmarks.slice(0,8);
    try{this.storage().setItem('bernabeu.views.v1',JSON.stringify(this.bookmarks));this.toast('share.saved');}catch{this.toast('share.temporary');}
    this.$('#bookmark-name').value='';this.renderBookmarks();
  }
  renderBookmarks(){
    const list=this.$('#bookmark-list');list.replaceChildren();
    this.bookmarks.forEach((bookmark,i)=>{
      const row=document.createElement('div'),button=document.createElement('button'),remove=document.createElement('button');button.textContent=bookmark.name;button.addEventListener('click',()=>this.restore(bookmark.view));remove.textContent='×';setAttributeText(remove,'aria-label','share.delete',{name:bookmark.name});
      remove.addEventListener('click',()=>{this.bookmarks.splice(i,1);try{this.storage().setItem('bernabeu.views.v1',JSON.stringify(this.bookmarks));}catch{}this.renderBookmarks();});row.append(button,remove);list.append(row);
    });
    if(!this.bookmarks.length){const empty=document.createElement('p');setText(empty,'share.empty');list.append(empty);}
  }
  async restore(view){
    if(this.busy())return;
    const token=++this.engine.navigationId;this.engine.director.cancel();this.mode(view.m);this.engine.setCutaway(view.x);
    if(!view.x&&!await this.openRoof())return;
    if(token!==this.engine.navigationId)return;
    this.toast('share.restoring');
    if(this.engine.pitchStored!==view.g||Math.abs(this.engine.mechanisms.pitch-(view.g?1:0))>.001)await this.engine.setPitch(view.g);if(token!==this.engine.navigationId)return;
    const arrived=await this.engine.director.moveTo({position:view.p,target:view.t,fov:view.f},{mode:view.x?'study':view.c});
    if(arrived&&token===this.engine.navigationId){if(view.r)await this.engine.setRoof(true);if(token!==this.engine.navigationId)return;this.syncRoof?.();this.syncSection();this.toast('share.restored');}
  }
  update(){
    const e=this.engine,inside=e.camera.position.y<64&&Math.abs(e.camera.position.x)<115&&Math.abs(e.camera.position.z)<98;
    if(this.markers.visible)this.markers.children.forEach((marker,i)=>{marker.visible=e.cutaway?!!HOTSPOTS[i].section:!HOTSPOTS[i].section&&HOTSPOTS[i].inside===inside;});
    if(this.ambience.mode!==e.mode)this.ambience.update(e.mode);
    if(e.director.mode==='walk'){const distance=e.camera.position.distanceTo(this.previousCamera);if(distance<1)this.ambience.step(distance);}this.previousCamera.copy(e.camera.position);
    if(this.active==='explore'&&this.exploreTab==='section')this.syncSection();
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;
    this.engine.navigationId++;this.unsubscribeLanguage?.();this.recorder.dispose();this.ambience.dispose();for(const url of this.urls)URL.revokeObjectURL(url);
    window.removeEventListener('resize',this.resize);window.removeEventListener('hashchange',this.hashChange);document.removeEventListener('keydown',this.key);this.engine.canvas.removeEventListener('pointerdown',this.pointerDown);this.engine.canvas.removeEventListener('pointerup',this.pointerUp);this.engine.onFrame=null;this.root.remove();
  }
}
