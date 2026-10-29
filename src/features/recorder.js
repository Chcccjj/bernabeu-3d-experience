import {chooseRecordingType,FORMATS} from './state.js';
import {CAMERA_VIEWS} from '../camera.js';
import {LocalizedError} from '../i18n/index.js';

export class SceneRecorder {
  constructor(engine,{onState,onProgress,onResult,onError,ambience}={}){
    this.engine=engine;this.onState=onState;this.onProgress=onProgress;this.onResult=onResult;this.onError=onError;this.ambience=ambience;this.state='idle';this.token=0;
    this.onVisibility=()=>{if(document.hidden&&this.state==='recording')this.stop('video.background');};
    document.addEventListener('visibilitychange',this.onVisibility);
  }
  change(state){this.state=state;if(!this.disposed)this.onState?.(state);}
  supported(){return typeof MediaRecorder!=='undefined'&&typeof this.engine.canvas.captureStream==='function'&&!!chooseRecordingType(t=>MediaRecorder.isTypeSupported(t));}
  async start({format='16:9',preset='orbit',audio=false}={}){
    if(this.state!=='idle')return;
    if(!this.supported())throw new LocalizedError('errors.recordUnsupported');
    const token=++this.token;this.change('preparing');this.engine.director.cancel();this.engine.setCutaway(false);
    this.restoreAudio=this.ambience?.enabled||false;
    try{
      if(audio&&this.ambience)await this.ambience.enable(true);
      if(token!==this.token)return;
      if(this.engine.roofClosed){await this.engine.setRoof(false);if(token!==this.token)return;}
      const sourcePose=preset==='roof'?{position:[130,180,160],target:[0,43,0],fov:48}:preset==='orbit'?{position:[300,155,260],target:[0,25,0],fov:48}:CAMERA_VIEWS.exterior;
      const framing=Math.max(1,Math.min(1.75,.82/FORMATS[format]));
      const pose={...sourcePose,position:sourcePose.position.map((n,i)=>i===1?n*(1+(framing-1)*.62):n*framing)};
      const reached=await this.engine.director.moveTo(pose,{mode:'exterior'});
      if(token!==this.token)return;if(!reached){this.change('idle');return;}
      const size=this.engine.beginRecording(format);this.stream=this.engine.canvas.captureStream(30);
      if(audio&&this.ambience?.destination)for(const track of this.ambience.destination.stream.getAudioTracks())this.stream.addTrack(track.clone());
      const mimeType=chooseRecordingType(t=>MediaRecorder.isTypeSupported(t));
      this.recorder=new MediaRecorder(this.stream,{mimeType,videoBitsPerSecond:9_000_000});this.chunks=[];
      this.recorder.ondataavailable=e=>{if(e.data.size)this.chunks.push(e.data);};
      this.recorder.onerror=e=>this.fail(e.error||new LocalizedError('errors.encode'));
      this.recorder.onstop=()=>{
        const duration=(performance.now()-this.started)/1000;
        const mime=this.recorder.mimeType,blob=new Blob(this.chunks,{type:mime});
        const wasDiscarded=this.discard;this.finish();
        if(wasDiscarded)return;
        if(blob.size<256){this.onError?.(new LocalizedError('errors.emptyRecording'));return;}
        this.onResult?.({blob,mime,extension:mime.startsWith('video/mp4')?'mp4':'webm',duration,...size,reason:this.stopReason});
      };
      this.discard=false;this.stopReason='';this.duration=preset==='tour'?36:15;this.started=performance.now();this.initialFrames=this.engine.frames;
      this.recorder.start(400);this.change('recording');
      if(preset==='tour')this.engine.director.tour();
      else if(preset==='orbit')this.engine.director.captureOrbit(this.duration);
      else {this.engine.setRoof(true);this.roofTimer=setTimeout(()=>this.engine.setRoof(false),7500);}
      this.timer=setInterval(()=>{
        const elapsed=(performance.now()-this.started)/1000;this.onProgress?.(Math.min(elapsed,this.duration),this.duration);
        if(elapsed>=this.duration)this.stop();
        else if(elapsed>3&&this.engine.frames<=this.initialFrames+2)this.stop('video.paused');
      },200);
    }catch(error){if(token===this.token){this.finish();this.onError?.(error);}}
  }
  stop(reason=''){
    if(this.state==='preparing'){++this.token;this.engine.director.cancel();this.finish();return;}
    if(this.state!=='recording')return;
    this.stopReason=reason;this.change('encoding');clearInterval(this.timer);clearTimeout(this.roofTimer);this.engine.director.cancel();
    if(this.recorder?.state!=='inactive')this.recorder.stop();
  }
  finish(){
    clearInterval(this.timer);clearTimeout(this.roofTimer);this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;
    this.engine.endRecording();
    if(!this.disposed&&this.ambience&&!this.restoreAudio)this.ambience.enable(false);
    this.change('idle');
  }
  fail(error){
    this.discard=true;if(this.recorder?.state==='recording')this.recorder.stop();else this.finish();this.onError?.(error);
  }
  dispose(){this.disposed=true;++this.token;this.discard=true;if(this.recorder?.state==='recording')this.recorder.stop();this.finish();document.removeEventListener('visibilitychange',this.onVisibility);}
}
