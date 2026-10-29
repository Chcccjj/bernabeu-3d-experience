// Inline the verified Vite output without requiring Python on the build host.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=fileURLToPath(new URL('../',import.meta.url));
const dist=join(root,'dist');
const read=path=>readFileSync(path,'utf8');
let html=read(join(dist,'index.html'));
html=html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g,(_,path)=>{
  const source=read(join(dist,path)).replaceAll('</script','<\\/script');
  return '<script type="module">\n'+source+'\n</script>';
});
html=html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g,(_,path)=>'<style>\n'+read(join(dist,path))+'\n</style>');
assert(!/<script[^>]+src=|<link[^>]+rel="stylesheet"/.test(html),'The portable edition still references an external bundle');
assert(/data:(?:application\/octet-stream|image\/vnd\.radiance);base64,/.test(html),'The HDR environment was not embedded');
const licenseDir=join(root,'public/licenses');
const notices=readdirSync(licenseDir).filter(name=>name.endsWith('.txt')).sort().map(name=>read(join(licenseDir,name))).join('\n');
html=html.replace('</head>','<!-- Third-party notices\n'+notices+'\n-->\n</head>');
for(const target of [join(root,'伯纳乌球场.html'),join(dist,'伯纳乌球场.html')])writeFileSync(target,html);
console.log(`Portable offline edition: ${Buffer.byteLength(html).toLocaleString('en-US')} bytes; no external runtime dependencies.`);
