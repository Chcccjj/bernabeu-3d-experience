import {MESSAGES,LANGUAGE_CODES,LANG_TAGS} from './catalog.js';

export const LANGUAGE_STORAGE_KEY='bernabeu.language.v1';
const names={zh:'中文',en:'English',es:'Español'},shortNames={zh:'中',en:'EN',es:'ES'};
const numberFormats=Object.fromEntries(LANGUAGE_CODES.map(code=>[code,new Intl.NumberFormat(LANG_TAGS[code],{useGrouping:false,maximumFractionDigits:2})]));
let language='zh';
const listeners=new Set();
export const getLanguage=()=>language;
export const normalizeLanguage=value=>typeof value==='string'&&LANGUAGE_CODES.includes(value.toLowerCase().split(/[-_]/)[0])?value.toLowerCase().split(/[-_]/)[0]:null;
export function withLanguage(value,code=language){const url=new URL(value);url.searchParams.set('lang',normalizeLanguage(code)||'zh');return url;}
export function resolveLanguage({query,stored,languages=[]}={}){
  return normalizeLanguage(query)||normalizeLanguage(stored)||languages.map(normalizeLanguage).find(Boolean)||'zh';
}
export function translate(key,params={},code=language){
  code=normalizeLanguage(code)||'zh';
  const text=MESSAGES[code][key]??MESSAGES.zh[key]??key;
  return text.replace(/\{(\w+)\}/g,(_,name)=>{
    const value=params[name];
    if(value&&typeof value==='object'&&typeof value.key==='string')return translate(value.key,value.params||{},code);
    return typeof value==='number'?numberFormats[code].format(value):String(value??'');
  });
}
export const t=translate;
export const formatDecimal=(value,digits=2)=>new Intl.NumberFormat(LANG_TAGS[language],{useGrouping:false,minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
export class LocalizedError extends Error {
  constructor(key,params={}){super(t(key,params));this.key=key;this.params=params;}
}
const selectAll=(root,selector)=>[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
function directText(element,text){
  let node=[...element.childNodes].find(node=>node.nodeType===3&&node.textContent.trim());
  if(!node){node=document.createTextNode('');element.prepend(node);}
  if(node.textContent!==text)node.textContent=text;
}
function paintText(element){
  const key=element.getAttribute('data-i18n')||element.getAttribute('data-i18n-node');
  const params=JSON.parse(element.getAttribute('data-i18n-params')||'{}'),text=t(key,params);
  if(element.hasAttribute('data-i18n-node'))directText(element,text);
  else if(element.textContent!==text)element.textContent=text;
}
export function setText(element,key,params={},direct=false){
  if(!element)return;
  element.removeAttribute(direct?'data-i18n':'data-i18n-node');
  element.setAttribute(direct?'data-i18n-node':'data-i18n',key);
  element.setAttribute('data-i18n-params',JSON.stringify(params));paintText(element);
}
export function setAttributeText(element,attribute,key,params={}){
  if(!element)return;
  element.setAttribute('data-i18n-'+attribute,key);
  element.setAttribute('data-i18n-'+attribute+'-params',JSON.stringify(params));
  element.setAttribute(attribute,t(key,params));
}
export function translateDOM(root=document){
  for(const element of selectAll(root,'[data-i18n],[data-i18n-node]'))paintText(element);
  for(const attr of ['aria-label','title','placeholder'])for(const element of selectAll(root,`[data-i18n-${attr}]`)){
    const key=element.getAttribute('data-i18n-'+attr),params=JSON.parse(element.getAttribute('data-i18n-'+attr+'-params')||'{}');
    element.setAttribute(attr,t(key,params));
  }
  for(const select of selectAll(root,'[data-language]'))select.value=language;
  for(const name of selectAll(root,'[data-language-name]'))name.textContent=names[language];
  for(const name of selectAll(root,'[data-language-code]'))name.textContent=shortNames[language];
}
function metadata(){
  document.documentElement.lang=LANG_TAGS[language];document.documentElement.dataset.language=language;
  document.title=t('page.title');document.querySelector('meta[name="description"]')?.setAttribute('content',t('page.description'));
}
export function setLanguage(code,{persist=true,updateURL=true}={}){
  const next=normalizeLanguage(code);if(!next)return false;
  const changed=language!==next;language=next;
  if(persist)try{localStorage.setItem(LANGUAGE_STORAGE_KEY,language);}catch{/* Selection still works when storage is blocked. */}
  if(updateURL)try{history.replaceState(history.state,'',withLanguage(location.href));}catch{/* Portable file URLs may restrict history. */}
  metadata();translateDOM();if(changed)for(const listener of listeners)listener(language);return true;
}
export function onLanguageChange(listener){listeners.add(listener);return()=>listeners.delete(listener);}
export function languageControl(){
  return `<label class="language-control"><svg aria-hidden="true"><use href="#i-language"/></svg><span data-language-name aria-hidden="true">${names[language]}</span><span data-language-code aria-hidden="true">${shortNames[language]}</span><svg class="language-chevron" aria-hidden="true" viewBox="0 0 12 12"><path d="m3 4 3 3 3-3"/></svg><select data-language data-i18n-aria-label="language.label" aria-label="${t('language.label')}"><option value="zh" lang="zh-CN">中文</option><option value="en" lang="en">English</option><option value="es" lang="es">Español</option></select></label>`;
}
export function initializeLocalization(){
  let stored;try{stored=localStorage.getItem(LANGUAGE_STORAGE_KEY);}catch{}
  language=resolveLanguage({query:new URL(location.href).searchParams.get('lang'),stored,languages:navigator.languages||[navigator.language]});
  document.querySelector('#language-slot').innerHTML=languageControl();bindStaticUI(document);metadata();
  const change=event=>{if(event.target.matches('[data-language]'))setLanguage(event.target.value);};
  document.addEventListener('change',change);return()=>document.removeEventListener('change',change);
}

// Mixed-content targets update their text node, preserving SVGs, inputs and spans.
const textBindings=[
  ['.brand small','brand.tagline'],['.location','location','node'],
  ['.scene-indicator > span:last-child','indicator.experience'],
  ['#view-number','view.interior.number'],['#view-title','view.interior.title'],['#view-description','view.interior.description'],['#tour-chapter','tour.approach'],
  ['#scene-label','indicator.day'],['#roof-status','roof.opened'],['#pitch-status','pitch.football'],
  ['#intro-copy .eyebrow','hero.eyebrow'],['#intro-copy h1','hero.name','node'],['#intro-copy h1 > span','hero.title'],['#intro-copy .intro-cn','hero.subtitle'],['#hero-tour','hero.tour','node'],['#hero-tour > span','hero.duration'],
  ['#settings-toggle > span','settings.title'],['.panel-title > span:first-child','settings.kicker'],
  ['#settings-panel fieldset:nth-of-type(1) legend','settings.light','node'],['#settings-panel fieldset:nth-of-type(2) legend','settings.mechanisms','node'],['#settings-panel fieldset:nth-of-type(3) legend','settings.display','node'],
  ['label[for="quality-select"]','settings.quality'],['#quality-select option[value="auto"]','settings.auto'],['#quality-select option[value="high"]','settings.high'],['#quality-select option[value="performance"]','settings.performance'],
  ['#reset-camera','settings.reset','node'],['#capture','settings.capture','node'],['.panel-footer > span','settings.footer'],
  ['#roof-toggle .mechanism-name > span','roof.label','node'],['#pitch-toggle > span:not(.transform-arrow)','pitch.label','node'],
  ['#tour-progress > p','tour.description'],['.footer-left','footer.independent','node'],['#show-ui','header.show','node'],
  ['.loader-kicker','location'],['.loader h2 > span','loader.subtitle'],['.loading-bottom','loader.bottom'],['#loading-label','loading.start'],
  ['#error > h2','errors.title'],['#error-detail','errors.webgl'],['#retry','errors.retry'],
  ['#about > .eyebrow','about.kicker'],['#about > h2','about.title','node'],['#about > h2 > em','about.subtitle'],['#about > p:not([class])','about.intro'],
  ['.about-facts > div:nth-child(1) > span','about.pitch'],['.about-facts > div:nth-child(2) > span','about.screen'],['.about-facts > div:nth-child(3) > span','about.trays'],['.about-note','about.note'],
  ['.source-links > a:nth-child(1)','about.sbp'],['.source-links > a:nth-child(2)','about.l35'],['.source-links > a:nth-child(3)','about.official'],
  ['#drawer-kicker','drawer.kicker'],
  ['[data-panel="photo"] > .drawer-intro','photo.intro'],['#photo-format','photo.aspect','parent'],['#photo-size','photo.size','parent'],['#photo-size option[value="3840"]','photo.4k'],['#photo-size option[value="2048"]','photo.hd'],['#photo-size option[value="1024"]','photo.preview'],['#photo-mime','photo.file','parent'],
  ['label[for="photo-fov"]','photo.fov','node'],['label[for="photo-exposure"]','photo.exposure','node'],['#photo-grid','photo.grid','parent'],['#export-photo','photo.export','node'],['#photo-status','photo.note'],['#photo-download','photo.download'],
  ['[data-panel="video"] > .drawer-intro','video.intro'],['#video-format','photo.aspect','parent'],['#video-preset','video.preset','parent'],['#video-preset option[value="orbit"]','video.orbit'],['#video-preset option[value="tour"]','video.tour'],['#video-preset option[value="roof"]','video.roof'],
  ['#video-audio','video.audio','parent'],['#record-start','video.start','node'],['#record-stop','video.stop'],['#video-status','video.note'],['#video-download','video.download'],
  ['[data-explore="seats"] > .drawer-intro','seats.intro'],['[data-row="10"]','seats.lower'],['[data-row="32"]','seats.middle'],['[data-row="56"]','seats.upper'],['label[for="seat-row"]','seats.row','node'],['#seat-number','seats.number','parent'],['#visit-seat','seats.visit','node'],['[data-explore="seats"] > .micro-note','seats.note'],
  ['[data-explore="routes"] > .drawer-intro','routes.intro'],['#walk-route > span','routes.guidedKicker'],['#walk-route > strong','routes.guidedTitle'],['#walk-route > small','routes.guidedNote'],['#walk-free > span','routes.freeKicker'],['#walk-free > strong','routes.freeTitle'],['#walk-free > small','routes.freeNote'],
  ['#ambient-toggle','routes.audio','parent'],['label[for="ambient-volume"]','routes.volume','node'],['[data-explore="routes"] > .micro-note','routes.audioNote'],
  ['[data-explore="hotspots"] > .drawer-intro','hotspots.intro'],['#hotspot-info > h3','hotspots.title'],['#hotspot-info > p','hotspots.note'],
  ['[data-explore="section"] > .drawer-intro','section.intro'],['#section-pitch','section.togglePitch'],['#section-status','section.football'],['[data-explore="section"] > .micro-note','section.note'],
  ['[data-panel="share"] > .drawer-intro','share.intro'],['label[for="view-link"]','share.link'],['#copy-view','share.copy','node'],['label[for="bookmark-name"]','share.bookmark'],['#save-view','share.save'],['[data-panel="share"] > .micro-note','share.note'],
];
const attrBindings=[
  ['#experience','aria-label','experience.label'],['#scene','aria-label','canvas.label'],['.brand','aria-label','settings.reset'],
  ['#info-button','aria-label','header.about'],['#info-button','title','header.about'],['#hide-ui','aria-label','header.hide'],['#hide-ui','title','header.hideTitle'],['#fullscreen','title','header.fullscreenTitle'],
  ['#fullscreen','aria-label','header.fullscreen'],['#roof-toggle','aria-label','roof.close'],['#pitch-toggle','aria-label','pitch.store'],
  ['#settings-toggle','aria-label','settings.toggle'],['#settings-panel','aria-label','settings.title'],['.atmosphere','aria-label','settings.atmosphere'],['#quality-select','aria-label','settings.quality'],
  ['#flight-pad','aria-label','flight.label'],['.fly-forward','aria-label','flight.forward'],['.fly-left','aria-label','flight.left'],['.fly-back','aria-label','flight.back'],['.fly-right','aria-label','flight.right'],['.fly-up','aria-label','flight.up'],['.fly-down','aria-label','flight.down'],
  ['#stop-tour','aria-label','tour.stop'],['.view-dock','aria-label','nav.label'],['#close-about','aria-label','about.close'],
  ['.experience-tools','aria-label','tools.label'],['.experience-drawer','aria-label','drawer.label'],['#close-drawer','aria-label','drawer.close'],['.explore-tabs','aria-label','explore.label'],['.seat-map','aria-label','seats.map'],
  ['#bookmark-name','placeholder','share.name'],['#record-preview','aria-label','tool.videoTitle'],
];
export function bindStaticUI(root){
  for(const [selector,key,type] of textBindings)for(const element of root.querySelectorAll(selector))setText(type==='parent'?element.parentElement:element,key,{},type==='parent'||type==='node');
  for(const [selector,attr,key] of attrBindings)for(const element of root.querySelectorAll(selector))setAttributeText(element,attr,key);
  for(const mode of ['day','night','match'])for(const button of root.querySelectorAll(`button[data-mode="${mode}"]`)){setText(button.querySelector('span'),'mode.'+mode);setAttributeText(button,'aria-label','mode.'+mode);}
  for(const mode of ['exterior','interior','pitch','tour','free'])for(const button of root.querySelectorAll(`button[data-view="${mode}"]`)){setText(button.querySelector('span'),'nav.'+mode);setAttributeText(button,'aria-label','nav.'+mode);}
  for(const tool of ['photo','video','explore','share'])for(const button of root.querySelectorAll(`[data-tool="${tool}"]`)){setText(button.querySelector('span'),'tool.'+tool);setAttributeText(button,'aria-label',tool==='explore'?'tool.exploreLabel':tool==='share'?'tool.shareLabel':'tool.'+tool+'Title');}
  for(const button of root.querySelectorAll('[data-preset]'))setText(button,'preset.'+button.dataset.preset);
  for(const button of root.querySelectorAll('[data-tab]'))setText(button,'explore.'+button.dataset.tab);
  for(const button of root.querySelectorAll('[data-sector]'))setText(button,'seats.'+button.dataset.sector);
  for(const button of root.querySelectorAll('[data-hotspot]'))setText(button,'hotspot.'+button.dataset.hotspot+'.title',{},true);
  translateDOM(root);
}
