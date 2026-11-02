import {LocalizedError} from '../i18n/index.js';
// A quiet procedural soundscape; no microphone, remote audio, or copyrighted recordings.
export class Ambience {
  constructor(){this.enabled=false;this.volume=.35;this.mode='day';this.nodes=[];this.walkDistance=0;this.request=0;this.disposed=false;}
  async enable(value){
    if(this.disposed)return;const request=++this.request;
    if(!value){this.enabled=false;this.update(this.mode);return;}
    try{
      if(!this.context){
        const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new LocalizedError('errors.audio');
        const ctx=this.context=new Audio();this.master=ctx.createGain();this.master.gain.value=0;
        this.master.connect(ctx.destination);this.destination=ctx.createMediaStreamDestination();this.master.connect(this.destination);
        const buffer=ctx.createBuffer(2,ctx.sampleRate*8,ctx.sampleRate);
        for(let channel=0;channel<2;channel++){
          const data=buffer.getChannelData(channel);let brown=0;
          for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.02)/1.02;data[i]=brown*3.4;}
        }
        for(const [frequency,q,level,rate] of [[340,.65,.5,.19],[1250,.6,.24,.31],[2600,.4,.1,.13]]){
          const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;source.playbackRate.value=1+rate;
          const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=q;
          const gain=ctx.createGain();gain.gain.value=level;
          const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=rate;depth.gain.value=level*.22;lfo.connect(depth);depth.connect(gain.gain);
          source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start();lfo.start();this.nodes.push(source,lfo);
        }
      }
      await this.context.resume();
      if(this.disposed||request!==this.request)return;
      this.enabled=true;this.update(this.mode);
    }catch(error){
      if(request===this.request){this.enabled=false;this.release();}
      throw error;
    }
  }
  update(mode,volume=this.volume){
    this.mode=mode;this.volume=volume;
    if(this.context)this.master.gain.setTargetAtTime(this.enabled?volume*(mode==='match'?.65:mode==='night'?.12:.065):0,this.context.currentTime,.3);
  }
  step(distance){
    this.walkDistance+=distance;if(!this.enabled||!this.context||this.walkDistance<.9)return;this.walkDistance=0;
    const ctx=this.context,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(105,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(42,ctx.currentTime+.12);
    gain.gain.setValueAtTime(.12*this.volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.13);osc.connect(gain);gain.connect(this.master);osc.start();osc.stop(ctx.currentTime+.15);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  release(){
    this.nodes.forEach(node=>{try{node.stop();node.disconnect();}catch{/* Release the remaining nodes too. */}});this.nodes=[];
    this.master?.disconnect();this.destination?.disconnect();
    this.context?.close().catch(()=>{});this.context=null;this.master=null;this.destination=null;
  }
  dispose(){if(this.disposed)return;this.disposed=true;++this.request;this.enabled=false;this.release();}
}
