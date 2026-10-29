import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COPY,MESSAGES,LANGUAGE_CODES} from '../src/i18n/catalog.js';
import {translate,resolveLanguage,withLanguage,LocalizedError} from '../src/i18n/index.js';

const placeholders=text=>[...text.matchAll(/\{(\w+)\}/g)].map(match=>match[1]).sort();
test('all interface messages have complete Chinese, English and Spanish translations with matching parameters',()=>{
  assert.ok(Object.keys(COPY).length>250);
  for(const [key,values] of Object.entries(COPY)){
    assert.equal(values.length,3,key);
    values.forEach((value,index)=>{
      assert.equal(typeof value,'string',key);assert.ok(value.trim(),key);
      assert.deepEqual(placeholders(value),placeholders(values[0]),key);
      if(index>0)assert.equal(/\p{Script=Han}/u.test(value),false,key);
    });
  }
});
test('explicit link language takes priority over remembered language and browser language',()=>{
  assert.equal(resolveLanguage({query:'es',stored:'en',languages:['zh-CN']}),'es');
  assert.equal(resolveLanguage({query:'invalid',stored:'zh',languages:['es-ES']}),'zh');
  assert.equal(resolveLanguage({languages:['fr-FR','es-MX','en-US']}),'es');
  assert.equal(resolveLanguage({stored:'en-GB'}),'en');
  assert.equal(resolveLanguage({languages:['fr-FR']}),'zh');
  assert.equal(resolveLanguage(),'zh');
});
test('translated dynamic messages interpolate numbers, names and localized stop reasons',()=>{
  assert.equal(translate('roof.closing',{percent:37},'es'),'Cerrando · 37%');
  assert.equal(translate('photo.result',{width:3840,height:2160,size:10.1},'es'),'Lista: 3840 × 2160 · 10,1 MB');
  const text=translate('video.resultReason',{width:1920,height:1080,seconds:2.5,size:1.2,reason:{key:'video.background'}},'en');
  assert.ok(text.endsWith('The page went into the background. The current clip was saved.'));
  assert.equal(translate('share.delete',{name:'A & B <view>'},'en'),'Delete viewpoint A & B <view>');
  assert.equal(new LocalizedError('errors.view').key,'errors.view');
});
test('language links retain the original camera hash and unrelated parameters',()=>{
  const url=withLanguage('https://example.com/?utm_source=post&lang=zh#view=abc_123','es');
  assert.equal(url.hash,'#view=abc_123');assert.equal(url.searchParams.get('utm_source'),'post');assert.equal(url.searchParams.get('lang'),'es');
  assert.equal(withLanguage(url.href,'en').searchParams.getAll('lang').length,1);
});
test('static translation references and dynamic view groups resolve in every language',()=>{
  const sources=['src/main.js','src/i18n/index.js','src/scene.js','src/features/index.js','src/features/recorder.js','src/features/state.js','src/features/ambience.js'].map(path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')).join('\n');
  const prefixes=[...new Set(Object.keys(COPY).map(key=>key.split('.')[0]))].join('|');
  const pattern=new RegExp("['\"]((?:"+prefixes+")\\.[a-zA-Z][a-zA-Z0-9.]*[a-zA-Z0-9])['\"]",'g');
  const keys=[...sources.matchAll(pattern)].map(match=>match[1]);
  for(const view of ['interior','pitch','tour','free','seat','walk','hotspot','study'])for(const field of ['number','title','description'])keys.push(`view.${view}.${field}`);
  for(const key of keys)for(const language of LANGUAGE_CODES)assert.ok(MESSAGES[language][key],`${language}: ${key}`);
});
