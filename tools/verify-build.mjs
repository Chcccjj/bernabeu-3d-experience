import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {Window} from 'happy-dom';
import {preview} from 'vite';

const root=fileURLToPath(new URL('../',import.meta.url)),dist=join(root,'dist');
const read=path=>readFileSync(path,'utf8');
const offline=read(join(dist,'伯纳乌球场.html'));
assert.equal(offline,read(join(root,'伯纳乌球场.html')),'Offline editions differ');
const window=new Window({settings:{enableJavaScriptEvaluation:false,disableJavaScriptFileLoading:true,disableCSSFileLoading:true}});
window.document.write(offline);
const document=window.document;
assert.equal(document.querySelectorAll('script[src],link[rel=stylesheet]').length,0,'Offline HTML needs an external bundle');
for(const node of document.querySelectorAll('img[src],source[src],iframe[src],link[href]')){
  assert.match(node.getAttribute('src')||node.getAttribute('href'),/^data:/,'Offline runtime resource is not embedded');
}
const scripts=[...document.querySelectorAll('script[type=module]')];assert.equal(scripts.length,1);
for(const script of scripts){
  const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{input:script.textContent,encoding:'utf8'});
  assert.equal(syntax.status,0,syntax.stderr);
}
assert.match(scripts[0].textContent,/data:(?:application\/octet-stream|image\/vnd\.radiance);base64,/,'Missing HDR');
assert.ok(document.querySelector('style').textContent.includes('.experience-drawer'),'Missing workbench CSS');
for(const name of readdirSync(join(root,'public/licenses'))){
  assert.equal(read(join(root,'public/licenses',name)),read(join(dist,'licenses',name)));
  assert.ok(offline.includes(read(join(root,'public/licenses',name))),'Offline notices missing');
}
assert.equal(read(join(root,'public/ASSET-LICENSES.txt')),read(join(dist,'ASSET-LICENSES.txt')));
await window.happyDOM.close();

// Check local documentation/image references; do not make external requests.
const documents=['README.md','README.zh-CN.md','README.en.md','PROGRESS.md',...readdirSync(join(root,'docs')).filter(name=>name.endsWith('.md')).map(name=>'docs/'+name)];
for(const path of documents)for(const match of read(join(root,path)).matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){
  const target=match[1].split('#')[0];if(!target||/^(?:https?:|mailto:)/.test(target))continue;
  assert.ok(existsSync(resolve(dirname(join(root,path)),decodeURIComponent(target))),`${path}: missing ${target}`);
}

// Exercise the actual production preview server over HTTP. This checks files and
// MIME types; it does not execute WebGL or establish browser compatibility.
const server=await preview({root,preview:{host:'127.0.0.1',port:0,strictPort:true,open:false}});
try{
  const address=server.httpServer.address();assert.ok(address&&typeof address==='object');
  const base=`http://127.0.0.1:${address.port}/`,response=await fetch(base);
  assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/html/);
  const html=await response.text(),assets=[...html.matchAll(/(?:src|href)="(\.\/assets\/[^"?#]+)"/g)].map(m=>m[1]);
  assert.ok(assets.some(path=>path.endsWith('.js'))&&assets.some(path=>path.endsWith('.css')));
  for(const path of assets){
    const asset=await fetch(new URL(path,base));assert.equal(asset.status,200,path);
    assert.match(asset.headers.get('content-type'),path.endsWith('.css')?/text\/css/:/javascript/);assert.ok((await asset.arrayBuffer()).byteLength>0);
  }
  const portable=await fetch(new URL('伯纳乌球场.html',base));assert.equal(portable.status,200);assert.equal(await portable.text(),offline);
  console.log(`Build verified: ${assets.length} production assets, identical offline editions, embedded HDR/notices, module syntax, documentation links and HTTP/MIME checks.`);
}finally{await new Promise((resolve,reject)=>server.httpServer.close(error=>error?reject(error):resolve()));}
