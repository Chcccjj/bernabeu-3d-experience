import {Window} from 'happy-dom';
import {readFileSync} from 'node:fs';

export function domFixture(t){
  const window=new Window({url:'http://localhost:5173/?lang=zh',width:1440,height:900,settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true,enableJavaScriptEvaluation:false}});
  window.document.write(readFileSync(new URL('../index.html',import.meta.url),'utf8'));
  const values={window,document:window.document,localStorage:window.localStorage,history:window.history,location:window.location,navigator:window.navigator,innerWidth:1440,innerHeight:900,devicePixelRatio:1};
  const previous=new Map();
  for(const [key,value] of Object.entries(values)){
    previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
  }
  window.testCleanups=[];
  t.after(async()=>{
    for(const cleanup of window.testCleanups.reverse())await cleanup();
    await window.happyDOM.close();
    for(const [key,descriptor] of previous)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
  });
  return window;
}
