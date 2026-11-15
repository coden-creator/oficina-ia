import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import http from 'node:http';
import {createSpecialistBroker,listenPrivate} from '../codex/broker.mjs';
import {createRemoteRunner} from '../video/remote-runner.mjs';
import {CodexVideoSpecialist} from '../codex/video-specialist.mjs';
import {createVideoFlow} from '../video/video-flow.mjs';
import {createLocalRenderer} from '../video/local-renderer.mjs';
const connected=()=>({connected:true,inferenceVerified:false,paidApiEnabled:false,publishingEnabled:false});
async function setup(specialist){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'office-broker-'));const socket=path.join(dir,'worker.sock');const server=createSpecialistBroker({specialist});await listenPrivate(server,socket);return {dir,socket,server,runner:createRemoteRunner({socketPath:socket,timeoutMs:2000}),async close(){await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});}};}
const post=(socket,route,body)=>new Promise((resolve,reject)=>{const req=http.request({socketPath:socket,path:route,method:'POST',headers:{'Content-Type':'application/json'}},res=>{let text='';res.on('data',b=>text+=b);res.on('end',()=>resolve({status:res.statusCode,text}));});req.on('error',reject);req.end(JSON.stringify(body));});
test('private broker rejects arbitrary operations, oversized bodies and stale connections',async()=>{
 const s=await setup({status:connected,run:async()=>({status:'blocked',reason:'fixture'})});try{
  assert.equal((await s.runner.refresh()).connected,true);
  assert.equal((await post(s.socket,'/account/login/start',{})).status,404);
  assert.equal((await post(s.socket,'/run',{cwd:'/etc',config:{}})).status,400);
  assert.equal((await post(s.socket,'/run',{prompt:'x'.repeat(33000)})).status,413);
  await new Promise(r=>s.server.close(r));assert.equal((await s.runner.refresh()).connected,false);
 }finally{await s.close();}
});
test('API-account state is refused before a specialist call',async()=>{let called=false;const s=await setup({status:()=>({...connected(),paidApiEnabled:true}),run:async()=>{called=true;}});try{assert.equal((await s.runner.run({})).status,'blocked');assert.equal(called,false);}finally{await s.close();}});
test('broker bounds concurrency without executing duplicate work',async()=>{
 let finish;const s=await setup({status:connected,run:()=>new Promise(r=>{finish=r;})});try{
  const first=post(s.socket,'/run',{});while(!finish)await new Promise(r=>setTimeout(r,5));
  assert.equal((await post(s.socket,'/run',{})).status,409);finish({status:'blocked'});assert.equal((await first).status,200);
 }finally{await s.close();}
});
test('real socket + validated specialist + real MP4 + approval (model responses explicitly simulated)',async()=>{
 const runtime={status:()=>({transportConnected:true,chatgptAccountObserved:true,accountKind:'chatgpt',paidApiEnabled:false}),async draft(prompt){
  const q=JSON.parse(prompt.split('\nDATA:\n')[1]);
  const output={brand:q.brand,stage:q.stage,summary:'SIMULATED MODEL FOR INTEGRATION TEST',evidence:[],verdict:q.stage==='creative_review'?'pass':'not_applicable',cta:q.input.brief.cta,scenes:q.stage==='script'?[{text:'Prueba local',durationSeconds:2},{text:q.input.brief.cta,durationSeconds:2}]:[],visualPlan:q.stage==='art_direction'?{template:'text-cards',palette:'neutral-warm',motion:'soft',scenes:[{index:0,composition:'centered-text'},{index:1,composition:'centered-text'}]}:null};
  return {source:'chatgpt-app-server',text:JSON.stringify(output)};
 }};
 const s=await setup(new CodexVideoSpecialist({runtime}));try{
  const dataDir=path.join(s.dir,'jobs');const flow=createVideoFlow({dataDir,adapters:{runner:s.runner,renderer:createLocalRenderer()}});
  const job=await flow.create({brandId:'glowfy',brief:{objective:'Prueba simulada de conexión',cta:'Conoce más',voice:'none',paid:false,publish:false}});
  const result=await flow.run('glowfy',job.id);assert.equal(result.state,'awaiting_review',result.blocker);assert.ok(result.artifact.bytes>1000);
  await flow.approve('glowfy',job.id,{version:1,artifactHash:result.artifact.sha256,actor:'test',source:'test'});
  const revised=await flow.requestChanges('glowfy',job.id,{feedback:'Nueva apertura'});assert.equal(revised.version,2);assert.equal(revised.approval,null);assert.equal((await flow.list('velforce')).length,0);
  assert.equal((await createVideoFlow({dataDir}).get('glowfy',job.id)).version,2);
 }finally{await s.close();}
});

test('office configuration reflects live worker connectivity and disconnection',async()=>{
 const {createOriginalShell}=await import('../server.mjs');
 const s=await setup({status:connected,run:async()=>({status:'blocked'})});
 const flow=createVideoFlow({dataDir:path.join(s.dir,'data'),adapters:{runner:s.runner}});
 const web=createOriginalShell({password:'fixture-only-office-password',origin:'https://office.example.com',videoFlow:flow,videoDataDir:path.join(s.dir,'data')});
 await new Promise(r=>web.listen(0,'127.0.0.1',r));
 const get=()=>new Promise((resolve,reject)=>{http.get({host:'127.0.0.1',port:web.address().port,path:'/api/config',headers:{Host:'office.example.com',Authorization:'Basic '+Buffer.from('jorge:fixture-only-office-password').toString('base64')}},res=>{let text='';res.on('data',b=>text+=b);res.on('end',()=>resolve(JSON.parse(text)));}).on('error',reject);});
 try{assert.equal((await get()).provider,'codex-chatgpt-plan');await new Promise(r=>s.server.close(r));assert.equal((await get()).provider,'not-connected');}finally{await new Promise(r=>web.close(r));await s.close();}
});
