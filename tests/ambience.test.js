import test from 'node:test';
import assert from 'node:assert/strict';
import {Ambience} from '../src/features/ambience.js';

function fixture(t){
  const contexts=[];
  class Audio {
    constructor(){this.sampleRate=32;this.currentTime=0;this.nodes=[];contexts.push(this);}
    node(){const node={gain:{value:0,setTargetAtTime(value){this.value=value;}},frequency:{value:0},Q:{value:0},playbackRate:{value:0},connect(){},disconnect(){},start(){},stop(){this.stopped=(this.stopped||0)+1;}};this.nodes.push(node);return node;}
    createGain(){return this.node();}createBiquadFilter(){return this.node();}createBufferSource(){return this.node();}createOscillator(){return this.node();}
    createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}
    createMediaStreamDestination(){return this.node();}
    resume(){return this.resuming||Promise.resolve();}close(){this.closed=(this.closed||0)+1;return Promise.resolve();}
  }
  const prior=globalThis.window;globalThis.window={AudioContext:Audio};
  const ambience=new Ambience();t.after(()=>{ambience.dispose();globalThis.window=prior;});
  return {ambience,contexts,Audio};
}
test('audio cancellation during resume keeps output muted and reuses a single context',async t=>{
  const {ambience,contexts,Audio}=fixture(t);let resume;
  Audio.prototype.resume=()=>new Promise(resolve=>resume=resolve);
  const enabling=ambience.enable(true);await ambience.enable(false);resume();await enabling;
  assert.equal(ambience.enabled,false);assert.equal(ambience.master.gain.value,0);assert.equal(contexts.length,1);
  Audio.prototype.resume=()=>Promise.resolve();await ambience.enable(true);assert.equal(ambience.enabled,true);assert.equal(contexts.length,1);
});
test('a rejected audio resume releases nodes and a later gesture can retry',async t=>{
  const {ambience,contexts,Audio}=fixture(t);Audio.prototype.resume=()=>Promise.reject(new Error('gesture required'));
  await assert.rejects(ambience.enable(true),/gesture required/);assert.equal(ambience.enabled,false);assert.equal(contexts[0].closed,1);assert.equal(ambience.context,null);
  Audio.prototype.resume=()=>Promise.resolve();await ambience.enable(true);assert.equal(contexts.length,2);assert.equal(ambience.enabled,true);
});
test('disposal during resume cannot resurrect audio or close resources twice',async t=>{
  const {ambience,contexts,Audio}=fixture(t);let resume;Audio.prototype.resume=()=>new Promise(resolve=>resume=resolve);
  const enabling=ambience.enable(true);ambience.dispose();resume();await enabling;ambience.dispose();await ambience.enable(true);
  assert.equal(ambience.enabled,false);assert.equal(contexts[0].closed,1);assert.equal(contexts.length,1);
});
