import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import http from 'node:http';
import {createSfxReviewBatch} from './sfx-review-batch.mjs';import {SFX_MODEL,SFX_PLAN,SFX_MAX_CREDITS} from './sfx-review-plan.mjs';import {createElevenLabsSfx} from '../connections/elevenlabs-sfx.mjs';import {createOriginalShell} from '../server.mjs';
const dir=async t=>{const p=await fs.mkdtemp(path.join(os.tmpdir(),'sfx-batch-test-'));t.after(()=>fs.rm(p,{recursive:true,force:true}));return p;};
const audio=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(2048,23)]);
test('disabled batch is inert; four fixed requests are durable and do not repeat after restart',async t=>{
 const dataDir=await dir(t);const calls=[];const store={sfxQuota:async()=>({remainingCredits:1000}),generateSfx:async id=>{calls.push(id);return {audio,model:SFX_MODEL,credits:10,requestId:'synthetic'};}};
 await createSfxReviewBatch({dataDir,store}).run();assert.equal(calls.length,0);
 const batch=createSfxReviewBatch({dataDir,store,enabled:true});await batch.run();assert.deepEqual(calls,SFX_PLAN.map(p=>p.id));assert.equal((await batch.state()).items.every(i=>i.status==='completed'),true);
 await createSfxReviewBatch({dataDir,store,enabled:true}).run();assert.equal(calls.length,4);
});
test('ambiguous request and insufficient included quota never cause a retry or overage',async t=>{
 const dataDir=await dir(t);let calls=0;const store={sfxQuota:async()=>({remainingCredits:SFX_MAX_CREDITS-1}),generateSfx:async()=>{calls++;throw Error('ambiguous provider failure');}};
 const low=createSfxReviewBatch({dataDir,store,enabled:true});await low.run();assert.equal((await low.state()).failure,'SFX_INCLUDED_QUOTA_REQUIRED');assert.equal(calls,0);
 store.sfxQuota=async()=>({remainingCredits:1000});const first=createSfxReviewBatch({dataDir,store,enabled:true});await first.run();assert.equal(calls,1);const second=createSfxReviewBatch({dataDir,store,enabled:true});await second.run();assert.equal(calls,1);assert.equal((await second.state()).failure,'SFX_RESULT_UNCERTAIN');
});
test('v3 adapter uses fixed official host, fixed plan, declared cost and no redirects',async()=>{
 const calls=[],provider=createElevenLabsSfx({fetchImpl:async(url,options)=>{calls.push({url,options});return url.endsWith('/user/subscription')?Response.json({character_count:0,character_limit:1000}):new Response(audio,{headers:{'content-type':'audio/mpeg','character-cost':'40','request-id':'test-id'}});}});
 await assert.rejects(()=>provider.generate('synthetic-private-key','arbitrary-effect'),/SFX_ITEM_NOT_AUTHORIZED/);assert.equal(calls.length,0);
 const result=await provider.generate('synthetic-private-key',SFX_PLAN[0].id);assert.equal(result.model,SFX_MODEL);assert.equal(result.credits,40);assert.equal(calls.length,2);assert.equal(calls[1].url,'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128');assert.equal(calls[1].options.redirect,'error');const body=JSON.parse(calls[1].options.body);assert.equal(body.model_id,'eleven_text_to_sound_v3');assert.equal(body.text,SFX_PLAN[0].prompt);assert.equal(body.loop,false);
});
test('review downloads require office authentication; HTTP cannot trigger generation or change plans',async t=>{
 const dataDir=await dir(t);let calls=0;const batch=createSfxReviewBatch({dataDir,store:{sfxQuota:async()=>({remainingCredits:1000}),generateSfx:async()=>{calls++;return {audio,model:SFX_MODEL,credits:1};}},enabled:true});await batch.run();const password='synthetic-private-sfx-password';const server=createOriginalShell({password,origin:'https://office.test',sfxReview:batch});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const get=(url,method='GET',auth=true)=>new Promise(resolve=>{const q=http.request({host:'127.0.0.1',port:server.address().port,path:url,method,headers:{host:'office.test',...(auth?{authorization:'Basic '+Buffer.from('jorge:'+password).toString('base64')}:{})}},r=>{const chunks=[];r.on('data',c=>chunks.push(c));r.on('end',()=>resolve({status:r.statusCode,bytes:Buffer.concat(chunks)}));});q.end();});
 const root='/api/sfx-review/glowfy/revision-3';assert.equal((await get(root,'GET',false)).status,401);assert.equal((await get(root,'POST')).status,405);assert.equal((await get(root.replace('glowfy','velforce'))).status,404);assert.equal((await get(root+'/../secret')).status,404);assert.deepEqual((await get(root+'/'+SFX_PLAN[0].id+'.mp3')).bytes,audio);assert.equal(calls,4);
});
