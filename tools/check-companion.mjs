import assert from 'node:assert/strict';
import {cpSync,existsSync,mkdtempSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const project=join(root,'etihad-stadium');
const scratch=mkdtempSync(join(tmpdir(),'etihad-check-'));
const read=path=>readFileSync(path,'utf8');
function run(command,args,cwd){
  const result=spawnSync(command,args,{cwd,encoding:'utf8',maxBuffer:8*1024*1024,timeout:120000});
  assert.equal(result.status,0,`${command} ${args.join(' ')}\n${result.error||''}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
function files(directory){return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(join(directory,entry.name)):[join(directory,entry.name)]);}
function importMap(html){const match=html.match(/<script type="importmap">([\s\S]*?)<\/script>/);assert.ok(match,'Missing inline import map');return JSON.parse(match[1]).imports;}
try{
  // The existing project checks write evidence files. Run an isolated copy so CI
  // checks never silently rewrite the collaborator's recorded validation.
  const copy=join(scratch,'etihad-stadium');cpSync(project,copy,{recursive:true,filter:path=>!path.split('/').includes('node_modules')});
  const sources=files(copy).filter(path=>/\.(?:js|mjs)$/.test(path)&&!path.includes('/vendor/')&&!path.includes('/dist/'));
  for(const path of sources)run(process.execPath,['--check',path],copy);
  const dependency=JSON.parse(read(join(copy,'vendor/DEPENDENCIES.json'))).three;
  assert.equal(dependency.version,JSON.parse(read(join(copy,'package.json'))).dependencies.three);
  for(const [path,expected] of Object.entries(dependency.files)){
    const bytes=readFileSync(join(copy,'vendor/three',path));assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,path);
  }
  const build=join(scratch,'rebuilt.html');run('python3',['scripts/export-html.py','--output',build],copy);
  const imports=importMap(read(build));assert.ok(Object.keys(imports).length>40);
  assert.deepEqual(importMap(read(join(copy,'dist/index.html'))),imports,'Etihad export is stale relative to its source');
  assert.deepEqual(importMap(read(join(root,'Etihad Stadium.html'))),imports,'Root Etihad HTML is stale');
  for(const [path,url] of Object.entries(imports)){
    assert.ok(url.startsWith('data:text/javascript;base64,'),`${path}: external module`);
    const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{input:Buffer.from(url.split(',')[1],'base64'),encoding:'utf8'});
    assert.equal(syntax.status,0,`${path}: ${syntax.stderr}`);
  }
  console.log('Etihad syntax, vendor hashes and both offline module graphs passed.');
  // Only model filenames declared by the manifest are read from the ZIP; never
  // extract arbitrary archive paths into the checkout.
  run('python3',['-c',`import json, pathlib, zipfile
root=pathlib.Path('.')
manifest=json.loads((root/'models/MODEL-MANIFEST.json').read_text())
with zipfile.ZipFile(root/'models/Etihad-2026-editable-models.zip') as z:
 for name in manifest['files']:
  assert pathlib.PurePosixPath(name).name==name and name.endswith('.glb')
  (root/'models'/name).write_bytes(z.read(name))
`],copy);
  const checks=readdirSync(join(copy,'scripts')).filter(name=>/^check-.*\.mjs$/.test(name)&&!/^check-v1[23]-architecture/.test(name)&&!['check-aisles.mjs','check-model.mjs','check-north-steps.mjs'].includes(name)).sort();
  for(const check of checks){run(process.execPath,['--experimental-loader','./scripts/local-loader.mjs','scripts/'+check],copy);console.log(`Etihad passed: ${check}`);}
  for(const path of ['README.md','README.zh-CN.md'])for(const match of read(join(project,path)).matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){
    const target=match[1].split('#')[0];if(!target||/^(?:https?:|mailto:)/.test(target))continue;
    assert.ok(existsSync(resolve(dirname(join(project,path)),decodeURIComponent(target))),`${path}: missing ${target}`);
  }
  console.log(`Etihad verified: ${sources.length} source modules, ${Object.keys(imports).length} embedded modules, vendor hashes, model ZIP reimports and ${checks.length} current-source checks. Historical topology checks, the documented north-aisle band finding and new browser visuals are outside this integration gate.`);
}finally{rmSync(scratch,{recursive:true,force:true});}
