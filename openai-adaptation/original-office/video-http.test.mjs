import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import http from 'node:http';import {createOriginalShell} from './server.mjs';import {createVideoFlow} from './video/video-flow.mjs';import {createLocalRenderer} from './video/local-renderer.mjs';import {ChatGPTDraftRuntime} from './codex/chatgpt-runtime.mjs';import {CodexVideoSpecialist} from './codex/video-specialist.mjs';
const pw='fixture-only-http-video-password';
async function setup(adapters={}){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'office-http-video-'));const flow=createVideoFlow({dataDir:dir,adapters});const make=()=>createOriginalShell({password:pw,origin:'https://office.example.com',videoFlow:flow,videoDataDir:dir});let server=make();await new Promise(r=>server.listen(0,'127.0.0.1',r));return {flow,dir,get port(){return server.address().port;},async restart(){await new Promise(r=>server.close(r));server=make();await new Promise(r=>server.listen(0,'127.0.0.1',r));},async close(){await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});}};}
const request=(s,url,body,extra={},method=body===undefined?'GET':'POST')=>new Promise((resolve,reject)=>{const r=http.request({host:'127.0.0.1',port:s.port,path:url,method,headers:{Host:'office.example.com',Authorization:'Basic '+Buffer.from('jorge:'+pw).toString('base64'),'Content-Type':'application/json',...extra}},res=>{const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>{const bytes=Buffer.concat(chunks);let json;try{json=JSON.parse(bytes);}catch{}resolve({status:res.statusCode,json,bytes,headers:res.headers});});});r.on('error',reject);r.end(body===undefined?undefined:JSON.stringify(body));});
const brief={objective:'Prueba técnica interna',cta:'Conoce más',qualityStandard:'technical-test'};
test('ordinary office requests require reference production before consuming inference or rendering',async()=>{
 let calls=0;const s=await setup({runner:{async run(){calls++;throw Error('must not call')}},renderer:{profile:{id:'ffmpeg_text',productionReady:true},async render(){calls++;throw Error('must not render')}}});
 try{
  const j=(await request(s,'/api/video-workflows/glowfy',{objective:'Video de marca con el acabado de referencia',cta:'Conoce Glowfy'})).json;
  assert.equal(j.brief.qualityStandard,'cresova-reference-v1');
  const result=(await request(s,`/api/video-workflows/glowfy/${j.id}/run`,{})).json;
  assert.equal(result.state,'blocked');assert.equal(result.stage,'production');assert.equal(result.artifact,null);assert.equal(calls,0);
  assert.match(result.blocker,/acabado audiovisual/);assert.equal(result.quality.technical,'not-verified');
  await s.restart();assert.equal((await request(s,`/api/video-workflows/glowfy/${j.id}`)).json.brief.qualityStandard,'cresova-reference-v1');
  const revision=(await request(s,`/api/video-workflows/glowfy/${j.id}/changes`,{feedback:'Mantener el acabado de las referencias'})).json;
  assert.equal(revision.brief.qualityStandard,'cresova-reference-v1');
  assert.equal((await request(s,'/api/video-workflows/glowfy',{...brief,qualityStandard:'pretend-final'})).status,409);
  assert.equal((await request(s,'/api/video-workflows/capabilities')).json.production.ready,false);
 }finally{await s.close()}
});
test('HTTP creates brand isolated request, persists restart, and no connected Codex is honest blocked',async()=>{
 let launched=false;const runtime=new ChatGPTDraftRuntime({childFactory:()=>{launched=true;throw Error('must not launch');},workspace:'/tmp/not-used',model:'explicit-test-model'});const s=await setup({runner:new CodexVideoSpecialist({runtime})});try{
 const bad=await request(s,'/api/video-workflows/glowfy',brief,{Origin:'https://other.example.com'});assert.equal(bad.status,403);
 const j=(await request(s,'/api/video-workflows/glowfy',brief)).json;assert.equal(j.state,'queued');assert.equal((await request(s,'/api/video-workflows/purify')).json.length,0);
 const run=await request(s,`/api/video-workflows/glowfy/${j.id}/run`,{});assert.equal(run.json.state,'blocked');assert.equal(run.json.artifact,null);assert.equal(launched,false);assert.ok(!run.bytes.toString().includes(s.dir));
 await s.restart();assert.equal((await request(s,`/api/video-workflows/glowfy/${j.id}`)).json.state,'blocked');
 assert.equal((await request(s,`/api/video-workflows/glowfy/${j.id}/approve`,{version:1,artifactHash:'bad',actor:'spoof'})).status,409);
 assert.equal((await request(s,'/api/video-workflows/glowfy',{...brief,paid:true})).status,409);
 }finally{runtime.close();await s.close();}
});
const fixtureRunner={async run({stage}){return{status:'completed',provenance:'explicit-deterministic-test-fixture-NOT-AI',output:{summary:'Fixture: test only',evidence:[],...(stage==='script'?{scenes:[{text:'Prueba interna',durationSeconds:2}]}:{}),...(stage==='creative_review'?{verdict:'pass'}:{})}};}};
test('HTTP real MP4 render/download, hash approval, revision invalidation (specialists are fixtures)',async()=>{
 const s=await setup({runner:fixtureRunner,renderer:createLocalRenderer()});try{
 const page=await request(s,'/');assert.match(page.headers['content-security-policy'],/media-src 'self'/);
 const j=(await request(s,'/api/video-workflows/glowfy',brief)).json;
 const r=await request(s,`/api/video-workflows/glowfy/${j.id}/run`,{});assert.equal(r.json.state,'awaiting_review');assert.equal(r.json.artifact.kind,'silent_animatic');assert.ok(!r.bytes.toString().includes(s.dir));
 const video=await request(s,r.json.artifact.url);assert.equal(video.status,200);assert.equal(video.headers['content-type'],'video/mp4');assert.equal(video.headers['cross-origin-resource-policy'],'same-origin');assert.ok(video.bytes.length>1000);
 assert.equal(video.headers['accept-ranges'],'bytes');
 for(const [range,start,end] of [['bytes=0-127',0,127],['bytes=128-',128,video.bytes.length-1],['bytes=-64',video.bytes.length-64,video.bytes.length-1]]){const part=await request(s,r.json.artifact.url,undefined,{Range:range});assert.equal(part.status,206);assert.equal(part.headers['content-range'],`bytes ${start}-${end}/${video.bytes.length}`);assert.deepEqual(part.bytes,video.bytes.subarray(start,end+1));}
 for(const range of [`bytes=${video.bytes.length}-`,'bytes=4-2','bytes=0-2,5-8']){const part=await request(s,r.json.artifact.url,undefined,{Range:range});assert.equal(part.status,416);assert.equal(part.headers['content-range'],`bytes */${video.bytes.length}`);assert.equal(part.bytes.length,0);}
 const head=await request(s,r.json.artifact.url,undefined,{},'HEAD');assert.equal(head.status,200);assert.equal(Number(head.headers['content-length']),video.bytes.length);assert.equal(head.bytes.length,0);
 assert.equal((await request(s,r.json.artifact.url,undefined,{Range:'bytes=0-127','If-Range':'unverified'})).status,200);
 assert.equal((await request(s,r.json.artifact.url,undefined,{Range:'bytes=0-127',Authorization:''})).status,401);
 assert.equal((await request(s,r.json.artifact.url,undefined,{Authorization:''})).status,401);
 const review={version:r.json.version,artifactHash:r.json.artifact.sha256,criteria:['story','craft','motion','voice','sound','originality'].map(id=>({id,status:'not_checked',note:'Fixture: no actual subjective review'}))};
 assert.equal((await request(s,`/api/video-workflows/glowfy/${j.id}/audiovisual-review`,{...review,version:99})).status,409);
 assert.equal((await request(s,`/api/video-workflows/glowfy/${j.id}/audiovisual-review`,{...review,approved:true})).status,409);
 const reviewed=(await request(s,`/api/video-workflows/glowfy/${j.id}/audiovisual-review`,review)).json;assert.equal(reviewed.state,'awaiting_review');assert.equal(reviewed.approval,null);assert.equal(reviewed.audiovisualReview.artifactHash,r.json.artifact.sha256);assert.equal(reviewed.audiovisualReview.criteria.length,6);
 const approved=await request(s,`/api/video-workflows/glowfy/${j.id}/approve`,{version:r.json.version,artifactHash:r.json.artifact.sha256});assert.equal(approved.json.approval.scope,'accept_artifact_only');assert.equal(approved.json.capabilities.publish,false);
 const changed=await request(s,`/api/video-workflows/glowfy/${j.id}/changes`,{feedback:'Cambiar apertura'});assert.equal(changed.json.version,2);assert.equal(changed.json.approval,null);assert.equal((await request(s,r.json.artifact.url)).status,409);
 }finally{await s.close();}
});
test('HTTP rejects symlink cross-brand storage and does not expose internal paths',async()=>{
 const s=await setup();try{const j=(await request(s,'/api/video-workflows/glowfy',brief)).json;await fs.mkdir(path.join(s.dir,'purify'));await fs.symlink(path.join(s.dir,'glowfy',j.id),path.join(s.dir,'purify',j.id));const r=await request(s,`/api/video-workflows/purify/${j.id}`);assert.equal(r.status,409);assert.ok(!r.bytes.toString().includes(s.dir));}finally{await s.close();}
});
test('Canvas demo opt-in renders and serves authenticated MP4; specialists explicitly fixtures',async()=>{
 const {createCanvasDemoRenderer}=await import('./video/canvas-demo-renderer.mjs');
 const runner={async run({stage}){const r=await fixtureRunner.run({stage});if(stage==='script')r.output.scenes=[{text:'Prueba técnica',durationSeconds:2},{text:'Marca separada',durationSeconds:2},{text:'Sin publicación',durationSeconds:3}];if(stage==='art_direction')r.output.visualPlan={template:'phone-cards-demo',palette:'neutral-warm',motion:'snappy',scenes:[{index:0,composition:'phone-cards'},{index:1,composition:'phone-cards'},{index:2,composition:'closing-card'}]};return r;}};
 const s=await setup({runner,renderer:createCanvasDemoRenderer()});try{
 assert.equal((await request(s,'/api/video-workflows/glowfy',{...brief,style:'external-executable'})).status,409);
 const j=(await request(s,'/api/video-workflows/glowfy',{...brief,style:'technical-canvas-demo'})).json;
 const r=(await request(s,`/api/video-workflows/glowfy/${j.id}/run`,{})).json;assert.equal(r.state,'awaiting_review');assert.equal(r.artifact.kind,'technical_canvas_demo');assert.equal((await s.flow.get('glowfy',j.id)).artifact.metadata.visualPlanApplied,true);assert.equal(r.quality.published,false);assert.equal(r.stages[0].source,'simulated-test');
 const media=await request(s,r.artifact.url);assert.equal(media.status,200);assert.ok(media.bytes.length>1000);assert.equal((await request(s,r.artifact.url,undefined,{Authorization:''})).status,401);assert.equal((await request(s,r.artifact.url.replace('glowfy','purify'))).status,409);
 }finally{await s.close();}
});

test('preview media stays authenticated and scoped to its current job/version before final export',async()=>{const s=await setup();try{const j=await s.flow.create({brandId:'glowfy',brief});const dir=path.join(s.dir,'glowfy',j.id,'v1');await fs.mkdir(dir,{recursive:true});const bytes=Buffer.alloc(2048,13),file=path.join(dir,'preview.mp4');await fs.writeFile(file,bytes);const {createHash}=await import('node:crypto');await s.flow.updateOffice('glowfy',j.id,1,x=>{x.preview={file,version:1,kind:'audiovisual_preview',sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,metadata:{duration:7}};},'fixture_preview');const pub=(await request(s,`/api/video-workflows/glowfy/${j.id}`)).json;assert.equal(pub.artifact,null);assert.equal(pub.preview.duration,7);assert.equal((await request(s,pub.preview.url,undefined,{Authorization:''})).status,401);const part=await request(s,pub.preview.url,undefined,{Range:'bytes=64-127'});assert.equal(part.status,206);assert.deepEqual(part.bytes,bytes.subarray(64,128));assert.equal((await request(s,pub.preview.url.replace('v=1','v=2'))).status,409);assert.equal((await request(s,pub.preview.url.replace('glowfy','velforce'))).status,409);}finally{await s.close();}});
