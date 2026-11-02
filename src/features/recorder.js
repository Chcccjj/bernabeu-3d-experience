import {chooseRecordingType,FORMATS} from './state.js';
import {CAMERA_VIEWS} from '../camera.js';
import {LocalizedError} from '../i18n/index.js';

// Each run owns its callbacks, tracks and timers. Late encoder events must never
// release the canvas or audio belonging to a newer recording.
export class SceneRecorder {
  constructor(engine,{onState,onProgress,onResult,onError,ambience}={}){
    Object.assign(this,{engine,onState,onProgress,onResult,onError,ambience});
    this.state='idle';this.token=0;this.disposed=false;
    this.onVisibility=()=>{if(document.hidden)this.stop('video.background');};
    document.addEventListener('visibilitychange',this.onVisibility);
  }
  change(state){this.state=state;if(!this.disposed)this.onState?.(state);}
  supported(){
    return typeof MediaRecorder!=='undefined'&&typeof this.engine.canvas.captureStream==='function'&&!!chooseRecordingType(t=>MediaRecorder.isTypeSupported(t));
  }
  isCurrent(run){return !this.disposed&&this.run===run&&!run.finished;}
  async start({format='16:9',preset='orbit',audio=false}={}){
    if(this.disposed||this.state!=='idle')return;
    if(!this.supported())throw new LocalizedError('errors.recordUnsupported');
    if(document.hidden)throw new LocalizedError('video.background');
    format=Object.hasOwn(FORMATS,format)?format:'16:9';
    preset=['orbit','tour','roof'].includes(preset)?preset:'orbit';
    const run={token:++this.token,restoreAudio:this.ambience?.enabled||false,chunks:[],finished:false};
    this.run=run;++this.engine.navigationId;this.change('preparing');this.engine.director.cancel();this.engine.setCutaway(false);
    try{
      if(audio&&this.ambience)await this.ambience.enable(true);
      if(!this.isCurrent(run))return;
      if(this.engine.roofClosed||this.engine.mechanisms?.roof>.001){const opened=await this.engine.setRoof(false);if(!this.isCurrent(run))return;if(!opened){this.finish(run);return;}}
      const sourcePose=preset==='roof'?{position:[130,180,160],target:[0,43,0],fov:48}:preset==='orbit'?{position:[300,155,260],target:[0,25,0],fov:48}:CAMERA_VIEWS.exterior;
      const framing=Math.max(1,Math.min(1.75,.82/FORMATS[format]));
      const pose={...sourcePose,position:sourcePose.position.map((n,i)=>i===1?n*(1+(framing-1)*.62):n*framing)};
      const reached=await this.engine.director.moveTo(pose,{mode:'exterior'});
      if(!this.isCurrent(run))return;
      if(!reached){this.finish(run);return;}
      if(document.hidden){this.finish(run);return;}
      run.size=this.engine.beginRecording(format);run.ownsCanvas=true;
      run.stream=this.engine.canvas.captureStream(30);
      if(audio&&this.ambience?.destination)for(const track of this.ambience.destination.stream.getAudioTracks())run.stream.addTrack(track.clone());
      const mimeType=chooseRecordingType(t=>MediaRecorder.isTypeSupported(t));
      const recorder=run.recorder=new MediaRecorder(run.stream,{mimeType,videoBitsPerSecond:9_000_000});
      recorder.ondataavailable=e=>{if(this.isCurrent(run)&&e.data.size)run.chunks.push(e.data);};
      recorder.onerror=e=>{if(this.isCurrent(run))this.fail(run,e.error||new LocalizedError('errors.encode'));};
      recorder.onstop=()=>{
        if(!this.isCurrent(run))return;
        const duration=((run.stoppedAt??performance.now())-run.started)/1000;
        const mime=recorder.mimeType,blob=new Blob(run.chunks,{type:mime});
        this.finish(run);
        if(blob.size<256){this.onError?.(new LocalizedError('errors.emptyRecording'));return;}
        this.onResult?.({blob,mime,extension:mime.startsWith('video/mp4')?'mp4':'webm',duration,...run.size,reason:run.stopReason||''});
      };
      run.duration=preset==='tour'?36:15;run.started=performance.now();run.initialFrames=this.engine.frames;
      recorder.start(400);this.change('recording');
      if(preset==='tour')this.engine.director.tour();
      else if(preset==='orbit')this.engine.director.captureOrbit(run.duration);
      else {this.engine.setRoof(true);run.roofTimer=setTimeout(()=>this.engine.setRoof(false),7500);}
      run.timer=setInterval(()=>{
        if(!this.isCurrent(run))return;
        const elapsed=(performance.now()-run.started)/1000;this.onProgress?.(Math.min(elapsed,run.duration),run.duration);
        if(elapsed>=run.duration)this.stop();
        else if(elapsed>3&&this.engine.frames<=run.initialFrames+2)this.stop('video.paused');
      },200);
    }catch(error){if(this.isCurrent(run))this.fail(run,error);}
  }
  stop(reason=''){
    const run=this.run;if(!run||run.finished)return;
    if(this.state==='preparing'){this.engine.director.cancel();this.finish(run);return;}
    if(this.state!=='recording')return;
    run.stopReason=reason;run.stoppedAt=performance.now();this.change('encoding');
    clearInterval(run.timer);clearTimeout(run.roofTimer);this.engine.director.cancel();
    // Encoders should send stop promptly. A broken encoder must not lock the UI.
    run.encodingTimer=setTimeout(()=>{if(this.isCurrent(run))this.fail(run,new LocalizedError('errors.encode'));},10000);
    try{run.recorder.stop();}catch(error){this.fail(run,error);}
  }
  finish(run=this.run){
    if(!run||run.finished)return;run.finished=true;
    clearInterval(run.timer);clearTimeout(run.roofTimer);clearTimeout(run.encodingTimer);
    if(run.recorder){
      run.recorder.ondataavailable=null;run.recorder.onerror=null;run.recorder.onstop=null;
      if(run.recorder.state!=='inactive')try{run.recorder.stop();}catch{/* Continue releasing tracks and canvas. */}
    }
    run.stream?.getTracks().forEach(track=>track.stop());
    if(run.ownsCanvas)this.engine.endRecording();
    if(this.ambience&&!run.restoreAudio)this.ambience.enable(false).catch(()=>{});
    if(this.run===run){this.run=null;this.change('idle');}
  }
  fail(run,error){
    if(!this.isCurrent(run))return;
    this.engine.director.cancel();this.finish(run);this.onError?.(error);
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;++this.token;
    this.engine.director.cancel();this.finish();document.removeEventListener('visibilitychange',this.onVisibility);
  }
}
