import test from 'node:test';
import assert from 'node:assert/strict';
import {SceneRecorder} from '../src/features/recorder.js';

const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function fixture(t,{move=Promise.resolve(true),audio=Promise.resolve()}={}){
  const document=new EventTarget();document.hidden=false;
  const encoders=[],tracks=[],states=[],results=[],errors=[];
  class Encoder {
    static isTypeSupported(type){return type==='video/webm';}
    constructor(stream,{mimeType}){this.stream=stream;this.mimeType=mimeType;this.state='inactive';encoders.push(this);}
    start(){this.state='recording';}
    stop(){this.state='inactive';this.stops=(this.stops||0)+1;}
    complete(){this.ondataavailable?.({data:new Blob(['x'.repeat(512)])});this.onstop?.();}
  }
  t.mock.method(globalThis,'setInterval',()=>123);t.mock.method(globalThis,'clearInterval',()=>{});
  t.mock.method(globalThis,'setTimeout',()=>456);t.mock.method(globalThis,'clearTimeout',()=>{});
  const priorDocument=globalThis.document,priorRecorder=globalThis.MediaRecorder;
  globalThis.document=document;globalThis.MediaRecorder=Encoder;
  const engine={canvas:{captureStream(){const track={stops:0,stop(){this.stops++;}};tracks.push(track);return {getTracks:()=>[track],addTrack(){}};}},frames:50,
    director:{cancel(){},moveTo:()=>move,tour(){},captureOrbit(){}},setCutaway(){},setRoof:async()=>true,
    beginRecording(){engine.recording=true;return {width:1920,height:1080};},endRecording(){engine.recording=false;engine.ends=(engine.ends||0)+1;}};
  const ambience={enabled:false,enable(value){this.enabled=value;return value?audio:Promise.resolve();}};
  const recorder=new SceneRecorder(engine,{ambience,onState:s=>states.push(s),onResult:r=>results.push(r),onError:e=>errors.push(e)});
  t.after(()=>{recorder.dispose();globalThis.document=priorDocument;globalThis.MediaRecorder=priorRecorder;});
  return {recorder,engine,ambience,encoders,tracks,states,results,errors,document};
}

test('recording stops, emits a correctly typed result and releases its canvas once',async t=>{
  const f=fixture(t);await f.recorder.start();assert.equal(f.recorder.state,'recording');
  f.recorder.stop('video.background');assert.equal(f.recorder.state,'encoding');
  f.encoders[0].complete();assert.equal(f.recorder.state,'idle');assert.equal(f.results.length,1);
  assert.equal(f.results[0].extension,'webm');assert.equal(f.results[0].reason,'video.background');
  assert.equal(f.engine.ends,1);assert.equal(f.tracks[0].stops,1);f.recorder.dispose();assert.equal(f.engine.ends,1);
});
test('interrupted preparation restores audio without claiming another canvas',async t=>{
  const f=fixture(t,{move:Promise.resolve(false)});await f.recorder.start({audio:true});
  assert.equal(f.recorder.state,'idle');assert.equal(f.ambience.enabled,false);assert.equal(f.engine.ends,undefined);
});
test('cancelling during audio resume cannot start a late recording',async t=>{
  const audio=deferred(),f=fixture(t,{audio:audio.promise});const start=f.recorder.start({audio:true});
  assert.equal(f.recorder.state,'preparing');f.recorder.stop();audio.resolve();await start;
  assert.equal(f.recorder.state,'idle');assert.equal(f.ambience.enabled,false);assert.equal(f.encoders.length,0);
});
test('background cancels preparation and preserves an active recording',async t=>{
  const move=deferred(),f=fixture(t,{move:move.promise});const start=f.recorder.start();
  f.document.hidden=true;f.document.dispatchEvent(new Event('visibilitychange'));move.resolve(true);await start;
  assert.equal(f.recorder.state,'idle');assert.equal(f.encoders.length,0);
  f.document.hidden=false;await f.recorder.start();f.document.hidden=true;f.document.dispatchEvent(new Event('visibilitychange'));
  f.encoders[0].complete();assert.equal(f.results[0].reason,'video.background');
});
test('encoder failures recover immediately and stale callbacks cannot reset a newer run',async t=>{
  const f=fixture(t);await f.recorder.start({audio:true});const old=f.encoders[0],lateStop=old.onstop;
  old.onerror({error:new Error('encoder failed')});assert.equal(f.recorder.state,'idle');assert.equal(f.errors.length,1);
  assert.equal(f.engine.ends,1);assert.equal(f.ambience.enabled,false);
  await f.recorder.start();lateStop();assert.equal(f.recorder.state,'recording');assert.equal(f.engine.ends,1);
  f.recorder.stop();f.encoders[1].complete();assert.equal(f.engine.ends,2);assert.equal(f.results.length,1);
});
test('dispose during encoding drops late results and is idempotent',async t=>{
  const f=fixture(t);await f.recorder.start();f.recorder.stop();const late=f.encoders[0].onstop;
  f.recorder.dispose();f.recorder.dispose();late();assert.equal(f.results.length,0);assert.equal(f.engine.ends,1);
  const count=f.states.length;await f.recorder.start();assert.equal(f.states.length,count);
});
test('captureStream failure rolls back recording dimensions and audio',async t=>{
  const f=fixture(t);f.engine.canvas.captureStream=()=>{throw new Error('capture unavailable');};
  await f.recorder.start({audio:true});assert.equal(f.recorder.state,'idle');assert.equal(f.engine.ends,1);
  assert.equal(f.ambience.enabled,false);assert.equal(f.errors.length,1);
});
test('a MediaRecorder.stop exception cannot leave the UI encoding',async t=>{
  const f=fixture(t);await f.recorder.start();f.encoders[0].stop=()=>{throw new Error('stop failed');};
  f.recorder.stop();assert.equal(f.recorder.state,'idle');assert.equal(f.errors.length,1);assert.equal(f.tracks[0].stops,1);
});

test('an interrupted roof preparation restores audio and does not move the camera',async t=>{
  const f=fixture(t);f.engine.roofClosed=true;f.engine.setRoof=async()=>false;
  let moved=false;f.engine.director.moveTo=async()=>{moved=true;return true;};
  await f.recorder.start({audio:true});assert.equal(f.recorder.state,'idle');assert.equal(moved,false);assert.equal(f.ambience.enabled,false);
});
test('empty output is reported and the next recording can still start',async t=>{
  const f=fixture(t);await f.recorder.start();f.recorder.stop();f.encoders[0].onstop();
  assert.equal(f.errors[0].key,'errors.emptyRecording');assert.equal(f.recorder.state,'idle');assert.equal(f.results.length,0);
  await f.recorder.start();assert.equal(f.recorder.state,'recording');
});
test('an encoder that never emits stop times out and releases the recording lock',async t=>{
  const f=fixture(t);let timeout;t.mock.method(globalThis,'setTimeout',callback=>{timeout=callback;return 456;});
  await f.recorder.start();f.recorder.stop();timeout();assert.equal(f.recorder.state,'idle');assert.equal(f.errors[0].key,'errors.encode');assert.equal(f.engine.ends,1);
});
