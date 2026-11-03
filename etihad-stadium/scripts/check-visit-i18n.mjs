import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createVisitScore,isInsideStadium} from '../src/experience/visit-score.js';
import {buildArrivalRoute,arrivalDistance,buildCampusLoop} from '../src/experience/arrival-routes.js';
import {TRANSLATIONS,LANGUAGES,translateText} from '../src/ui/translations.js';
const score=createVisitScore();score.update(1000,false);assert.deepEqual(score.score,[0,0]);score.update(10,true);score.update(1000,false);assert.equal(score.seconds,10);score.update(4.99,true);assert.deepEqual(score.score,[0,0]);score.update(2,true,true);assert.equal(score.seconds,14.99);score.update(.01,true);assert.deepEqual(score.score,[1,0]);score.update(10000,true);assert.deepEqual(score.score,[1,0]);score.reset();assert.deepEqual(score.score,[0,0]);
for(const p of[{x:42,y:42,z:66},{x:52.2,y:1.07,z:9.84},{x:0,y:-3.48,z:0}])assert.equal(isInsideStadium(p),true);for(const p of[{x:350,y:205,z:370},{x:195,y:25,z:108},{x:233,y:24,z:173},{x:0,y:85,z:0}])assert.equal(isInsideStadium(p),false);
const gate={x:115.6,z:0,nx:1,nz:0},route=buildArrivalRoute(gate),length=route.getLength();for(let k=0;k<144;k++){let last=-Infinity;for(let t=0;t<1000;t+=.5){const d=arrivalDistance(k,144,length,t);assert.ok(d>=last&&d<=length);last=d;}assert.equal(last,length);}
assert.equal(Object.keys(LANGUAGES).length,5);for(const[cellsKey,cells]of TRANSLATIONS){assert.equal(cells.length,5);assert.ok(cells.every(s=>s.trim()));}
for(const lang of Object.keys(LANGUAGES)){assert.ok(translateText('曼城0:0曼联',lang).includes('0:0'));assert.ok(translateText('曼城1:0曼联',lang).includes('1:0'));assert.ok(translateText('球场探索',lang));assert.equal(translateText('CUSTOM 123',lang),'CUSTOM 123');}
const campus=buildCampusLoop([[146,-118],[157,-114],[157,128],[146,132]]);for(const p of campus.getSpacedPoints(1000)){assert.ok(p.x>=146&&p.x<=157&&p.z>=-118&&p.z<=132,'campus walk must not overshoot into parked cars');}
const original=JSON.parse(fs.readFileSync('validation/v14-ui-source-strings.json','utf8')),unknown=original.filter(s=>s!=='曼城 0 : 0 曼联'&&/[\u3400-\u9fff]/.test(translateText(s,'en')));assert.deepEqual(unknown,[]);
const report={version:'V14',languages:Object.keys(LANGUAGES),translationRows:TRANSLATIONS.size,capturedUIStrings:original.length,untranslatedEnglishStrings:unknown,visitTimer:'outside/inside/paused/reset/one goal passed',arrivalMonotonicNoRespawn:'144 supporters x 2000 time samples passed'};fs.writeFileSync('validation/v14-visit-i18n.json',JSON.stringify(report,null,2));console.log(report);
