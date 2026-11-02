import test from 'node:test';
import assert from 'node:assert/strict';
import {outputSize,normalizeView,encodeView,decodeView,readBookmarks,walkable,walkEyeHeight,chooseRecordingType,adaptiveRatio} from '../src/features/state.js';

test('photo export respects target aspect, even video dimensions and device texture limits',()=>{
  assert.deepEqual(outputSize('16:9',3840),{width:3840,height:2160});
  assert.deepEqual(outputSize('9:16',3840),{width:2160,height:3840});
  assert.deepEqual(outputSize('3:4',3840),{width:2880,height:3840});
  for(const format of ['16:9','9:16','3:4','1:1']){
    const size=outputSize(format,3840,2048);assert.ok(Math.max(size.width,size.height)<=2048);assert.equal(size.width%2,0);assert.equal(size.height%2,0);
  }
});
test('shared views round-trip camera and mechanical states without accepting malformed payloads',()=>{
  const value={v:1,p:[-70.12345,42,66],t:[0,17,0],f:62,m:'match',r:true,g:true,x:true,c:'study'};
  assert.deepEqual(decodeView(encodeView(value)),normalizeView(value));
  for(const input of ['#view=', '#view=bad', '#view='+ 'x'.repeat(1300), '#other=abc', '#view=%3Cscript%3E'])assert.equal(decodeView(input),null);
  assert.equal(normalizeView({...value,p:[NaN,4,5]}),null);assert.equal(normalizeView({...value,p:[9000,4,5]}),null);
  assert.equal(normalizeView({...value,p:[0,0,0],t:[0,0,0]}),null);
  assert.equal(normalizeView({...value,m:'invalid',f:1000}).f,85);
  assert.equal(normalizeView({...value,c:'walk',p:[300,2.8,200]}).c,'hotspot');
  assert.equal(normalizeView({...value,c:'walk',p:[-82,40,0]}).p[1],1.82);
});
test('blocked browser storage and corrupt bookmarks are recoverable',()=>{
  assert.deepEqual(readBookmarks({getItem(){throw new Error('SecurityError');}}),[]);
  for(const value of ['null','{}','[null]','not-json'])assert.deepEqual(readBookmarks({getItem:()=>value}),[]);
});
test('a corrupt bookmark does not erase valid neighbors and valid entries fill the eight-slot budget',()=>{
  const view={v:1,p:[20,40,60],t:[0,10,0]};
  const list=[null,{},false,...Array.from({length:10},(_,i)=>({name:'View '+i,view}))];
  const result=readBookmarks({getItem:()=>JSON.stringify(list)});
  assert.equal(result.length,8);assert.equal(result[0].name,'View 0');assert.equal(result[7].name,'View 7');
});
test('normalization rejects camera targets collapsed by bounds and does not coerce string flags',()=>{
  assert.equal(normalizeView({v:1,p:[700,40,0],t:[800,40,0]}),null);
  const view=normalizeView({v:1,p:[0,40,0],t:[0,10,0],f:Infinity,r:'false',g:'true',x:1});
  assert.equal(view.f,50);assert.equal(view.r,false);assert.equal(view.g,false);assert.equal(view.x,false);
});
test('output sizing handles inherited format names and unusually small device limits',()=>{
  assert.deepEqual(outputSize('__proto__',3840),{width:3840,height:2160});
  for(const limit of [2,127,255,1024])for(const format of Object.keys({'16:9':1,'9:16':1,'3:4':1,'1:1':1})){
    const size=outputSize(format,Infinity,limit);
    assert.ok(size.width>=2&&size.height>=2);assert.ok(Math.max(size.width,size.height)<=limit);
    assert.equal(size.width%2,0);assert.equal(size.height%2,0);
  }
});
test('walk domain contains tunnel and pitch, excludes seats, walls and goal nets',()=>{
  assert.ok(walkable(-82,0));assert.ok(walkable(-58,-8));assert.ok(walkable(0,0));
  assert.equal(walkable(-85,0),false);assert.equal(walkable(-75,3),false);assert.equal(walkable(0,39),false);
  assert.equal(walkable(-53,0),false);assert.equal(walkable(53,0),false);assert.ok(walkable(-53,-8));
  assert.equal(walkEyeHeight(-82),1.82);assert.equal(walkEyeHeight(0),2.8);
  assert.ok(Math.abs(walkEyeHeight(-61.00001)-walkEyeHeight(-60.99999))<.0001);
});
test('recording selects an actually supported container and reports unsupported browsers',()=>{
  assert.equal(chooseRecordingType(t=>t==='video/webm'),'video/webm');
  assert.equal(chooseRecordingType(t=>t==='video/mp4'||t==='video/webm'),'video/mp4');
  assert.equal(chooseRecordingType(()=>false),null);
  assert.equal(chooseRecordingType(t=>t.startsWith('video/mp4')),'video/mp4;codecs=avc1.42E01E,mp4a.40.2');
});
test('automatic quality can recover after sustained headroom, with hysteresis and bounded ratios',()=>{
  let state={ratio:1.5,base:1.5,ms:40};
  for(let i=0;i<6;i++)state={...state,...adaptiveRatio(state)};
  assert.equal(state.ratio,1);
  state.ms=16;for(let i=0;i<18;i++)state={...state,...adaptiveRatio(state)};
  assert.equal(state.ratio,1.5);
  for(let i=0;i<20;i++)state={...state,...adaptiveRatio(state)};
  assert.equal(state.ratio,1.5);
});
