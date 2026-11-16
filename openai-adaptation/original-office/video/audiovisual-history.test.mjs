import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {recentVisualHistory} from './audiovisual-standard.mjs';
import {createOrganicWorkflow} from './organic-workflow.mjs';
import {createVideoFlow} from './video-flow.mjs';

const hash='a'.repeat(64);
const observation={version:2,artifactHash:hash,criteria:[
 {id:'motion',status:'needs_change',note:'Repite el teléfono quieto; un zoom no cuenta una acción.'},
 {id:'voice',status:'not_checked',note:'No se afirma escucha subjetiva.'}
]};
const job=(id,extra={})=>({id,brandId:'glowfy',version:2,createdAt:'2026-11-16T12:00:00Z',state:'awaiting_review',brief:{objective:'Ejemplo sintético'},outputs:{},artifact:{sha256:hash},audiovisualReviews:[structuredClone(observation)],...extra});

test('an exported video with negative observations is a negative reference, not approved inspiration',()=>{
 const before=job('old',{productionPlan:{shots:[{action:'phone: rest',camera:'push'}]}}),snapshot=structuredClone(before);
 const [h]=recentVisualHistory([before],'current','glowfy');
 assert.equal(h.referenceUse,'negative-reference');assert.deepEqual(h.review.needsChanges,['motion']);
 assert.deepEqual(h.review.notChecked,['voice']);assert.match(h.visual,/phone: rest/);
 assert.equal(h.review.artifactHash,hash);assert.deepEqual(before,snapshot);
});

test('stale reviews and apparent approvals never qualify a different export',()=>{
 for(const changed of [{version:3},{artifact:{sha256:'b'.repeat(64)}}]){
  const [h]=recentVisualHistory([job('old',changed)],'current','glowfy');
  assert.equal(h.referenceUse,'unreviewed-example');assert.equal(h.review,null);
 }
 const approved=job('old',{state:'approved',approval:{version:2,artifactHash:hash},audiovisualReviews:[]});
 assert.equal(recentVisualHistory([approved],'current','glowfy')[0].referenceUse,'owner-approved');
 approved.approval.artifactHash='b'.repeat(64);
 assert.equal(recentVisualHistory([approved],'current','glowfy')[0].referenceUse,'unreviewed-example');
});

test('latest exact review supersedes old findings but checked does not mean owner approved',()=>{
 const j=job('old');j.audiovisualReviews.push({...structuredClone(observation),criteria:[{id:'motion',status:'checked',note:'Internal observation only'}]});
 const [h]=recentVisualHistory([j],'current','glowfy');assert.equal(h.referenceUse,'unreviewed-example');assert.deepEqual(h.review.needsChanges,[]);
});

test('history excludes other brands/current job and prioritizes recent negative references within its bound',()=>{
 const rows=Array.from({length:9},(_,i)=>job('video-'+i,{createdAt:`2026-11-16T12:0${i}:00Z`,audiovisualReviews:i===3?[observation]:[]}));
 rows.unshift(job('other',{brandId:'purify'}),job('current'));const h=recentVisualHistory(rows,'current','glowfy');
 assert.equal(h.length,7);assert.equal(h[0].id,'video-3');assert.ok(h.every(x=>!['current','other','video-0','video-1'].includes(x.id)));
 assert.deepEqual(recentVisualHistory(rows,'unknown'),[]);
});

test('the actual specialist request carries exact-version feedback without running a provider',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'history-context-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const flow=createVideoFlow({dataDir:dir}),brief={objective:'Prueba sintética',cta:'Conocé Glowfy',qualityStandard:'cresova-reference-v1',voice:'none',paid:false,publish:false};
 const old=await flow.create({brandId:'glowfy',brief}),current=await flow.create({brandId:'glowfy',brief});
 await flow.updateOffice('glowfy',old.id,1,j=>{j.version=2;j.state='awaiting_review';j.artifact={sha256:hash,version:2,file:path.join(dir,'glowfy',old.id,'v2','test.mp4')};j.audiovisualReviews=[observation];},'fixture');
 let request;const runner={status:()=>({workflows:['organic-v1']}),run:async q=>{request=q;return{status:'blocked',reason:'SYNTHETIC_STOP'};}};
 const work=createOrganicWorkflow({flow,runner,enabled:true,allowedJobIds:[current.id]});await work.execute('glowfy',current.id);
 assert.equal(request.input.visualHistory[0].referenceUse,'negative-reference');assert.equal(request.input.visualHistory[0].review.findings[0].note,observation.criteria[0].note);
 assert.match(request.prompt,/negative-reference/);assert.ok(JSON.stringify(request).length<23000);
 assert.equal((await flow.get('glowfy',current.id)).artifact,null);
});
