import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHandDrawnStyle} from './production/hand-drawn-adapter.mjs';import {stageView,publicJob} from './video/http.mjs';
test('drawing primitives require explicit style, deterministic output, no default inherited brand color',()=>{
 assert.throws(()=>createHandDrawnStyle({}));const drawing=createHandDrawnStyle({color:'#123456'});
 const run=()=>{const calls=[];const ctx=new Proxy({}, {get:(o,k)=>o[k]??((...a)=>calls.push([k,...a])),set:(o,k,v)=>{o[k]=v;calls.push([k,v]);return true;}});drawing.circle(ctx,0.7,10,10,5,5);return calls;};assert.deepEqual(run(),run());assert.ok(run().some(x=>x[0]==='strokeStyle'&&x[1]==='#123456'));assert.ok(!JSON.stringify(run()).includes('#E20018'));
});
test('stage projection labels mocked provenance and changes, not fake QA/publication',()=>{
 const stages=stageView({stage:'creative_review',state:'changes_requested',artifact:null,outputs:{research:{summary:'Fixture evidence',provenance:'deterministic-test-fixture'},creative_review:{summary:'Needs changes',verdict:'changes'}}});assert.equal(stages.find(s=>s.id==='research').source,'simulated-test');assert.equal(stages.find(s=>s.id==='creative_review').status,'changes_requested');assert.equal(stages.find(s=>s.id==='production').status,'pending');
});
test('asset registry excludes sample audio/logos/photos and keeps unadapted primitives non-production',()=>{
 const m=JSON.parse(fs.readFileSync(new URL('./production/assets-manifest.json',import.meta.url)));assert.equal(m.liveRenderer,'none');assert.ok(m.excluded.includes('voices'));assert.ok(m.assets.every(a=>a.defaultBrandReuse===false&&a.brands.length===0));assert.equal(m.assets.filter(a=>a.packaged).length,1);
});
test('organic editorial scores remain separate from actual audiovisual QA and publication',()=>{
 const job={id:'test',brandId:'glowfy',version:1,brief:{objective:'Borrador',cta:'Conoce más',qualityStandard:'cresova-reference-v1'},state:'changes_requested',stage:'creative_review',outputs:{creative_review:{summary:'Cambiar apertura',detail:{verdict:'changes',criteria:[{id:'hook',score:5,reason:'No se entiende'}],corrections:['Aclarar apertura']}}},artifact:null};
 const result=publicJob(job);assert.equal(result.creativeReview.criteria[0].label,'Apertura comprensible');assert.equal(result.stages.find(s=>s.id==='creative_review').status,'changes_requested');assert.equal(result.quality.technical,'not-verified');assert.equal(result.quality.published,false);assert.equal(result.artifact,null);
});
