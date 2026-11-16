import os from 'node:os';
import fs from 'node:fs/promises';
import {brands} from './video-flow.mjs';
import {team,departments,editorIds,stageOwners,waitingReasons} from './office-team.mjs';
import {ORGANIC_PROTOCOL} from './organic-contract.mjs';
import {createOrganicWorkflow} from './organic-workflow.mjs';
const keys=Object.keys(brands);
const sumCPU=()=>os.cpus().reduce((a,c)=>{a.total+=Object.values(c.times).reduce((n,v)=>n+v,0);a.idle+=c.times.idle;return a;},{total:0,idle:0});
export function createResourceMonitor(){let before=sumCPU();return async()=>{const now=sumCPU(),delta=now.total-before.total,cpu=delta?1-(now.idle-before.idle)/delta:0;before=now;let memory=null;try{const text=await fs.readFile('/proc/meminfo','utf8');const n=k=>Number(new RegExp('^'+k+':\\s+(\\d+)','m').exec(text)?.[1]);memory=1-n('MemAvailable')/n('MemTotal');}catch{}return {ready:Number.isFinite(memory)&&cpu<.7&&memory<.7,cpu,memory};};}
const rank=j=>j.outputs.creative_review?.detail?.criteria?.reduce((n,c)=>n+c.score,0)??0;
const priority=(a,b)=>Number(!!b.brief.feedback)-Number(!!a.brief.feedback)||rank(b)-rank(a)||a.createdAt.localeCompare(b.createdAt);
export function createOfficeCoordinator({flow,runner,enabled=false,allowedJobIds=[],resourceMonitor=createResourceMonitor(),workflow=null,production=null,intervalMs=3000}){
 const worker=workflow||createOrganicWorkflow({flow,runner,enabled,allowedJobIds,production});
 const active=new Map();let timer=null,closed=false,ticking=false,lastReason=enabled?null:'WAITING_FOR_OWNER_TEST';
 const all=async()=>{const groups=await Promise.all(keys.map(b=>flow.list(b)));return groups.flat();};
 async function launch(job,phase,editorId=null){
  const key=job.brandId+'/'+job.id;if(active.has(key)||closed)return;
  const entry={phase,editorId,jobId:job.id,brand:job.brandId};active.set(key,entry);
  entry.promise=worker.execute(job.brandId,job.id,{phase,editorId}).catch(()=>{lastReason='ORGANIC_STAGE_FAILED';}).finally(()=>active.delete(key));
 }
 async function tick(){
  if(!enabled||closed||ticking)return;ticking=true;
  try{
   if(!(await resourceMonitor()).ready){lastReason='RESOURCE_LIMIT';return;}
   await runner?.refresh?.();
   if(!runner?.status?.().connected){lastReason='CODEX_UNAVAILABLE';return;}
   if(!runner.status().workflows?.includes(ORGANIC_PROTOCOL)){lastReason='ORGANIC_WORKER_UPDATE_REQUIRED';return;}
   lastReason=null;
   const jobs=(await all()).filter(j=>worker.permits(j.id)&&j.brief.qualityStandard==='cresova-reference-v1'&&j.state==='queued'&&!active.has(j.brandId+'/'+j.id)).sort(priority);
   if(![...active.values()].some(a=>a.phase==='prepare')){const job=jobs.find(j=>j.stage!=='art_direction');if(job)await launch(job,'prepare');}
   for(const id of editorIds){if([...active.values()].some(a=>a.editorId===id))continue;const job=jobs.find(j=>j.stage==='art_direction'&&!active.has(j.brandId+'/'+j.id));if(job)await launch(job,'edit',id);}
  }catch{lastReason='COORDINATION_UNAVAILABLE';}finally{ticking=false;}
 }
 async function recover(){
  // A half-finished inference is not silently repeated; completed outputs remain available.
  for(const j of await all()){if(j.brief.deliverable==='idea'&&j.ideaAuthorization?.source==='owner-idea-trigger')worker.authorizeIdea?.(j.id);}
  for(const j of await all())if(j.execution?.workflow===ORGANIC_PROTOCOL&&j.state==='running')await flow.updateOffice(j.brandId,j.id,j.version,x=>{x.state='blocked';x.blocker='INTERRUPTED_STAGE';x.execution=null;},'interrupted_stage');
 }
 async function snapshot(brand){
  if(!keys.includes(brand))throw Error('UNKNOWN_BRAND');
  const jobs=await flow.list(brand),connections=runner?.status?.()||{},now=new Date().toISOString();
  const agents=team.map(a=>({...a,status:connections.connected===true||a.id==='coordinador'?'idle':'unavailable',text:connections.connected===true||a.id==='coordinador'?'Sin tarea asignada':'Conexión de Codex sin verificar',jobId:null,version:null}));
  for(const job of jobs){
   const id=job.stage==='qa'?'calidad':job.execution?.editorId||job.editorId||stageOwners[job.stage],a=agents.find(x=>x.id===id);if(!a)continue;
   if(job.state==='running'){Object.assign(a,{status:'working',text:job.brief.objective,jobId:job.id,version:job.version,stage:job.stage});}
   else if(job.state==='blocked'&&a.status!=='working')Object.assign(a,{status:'blocked',text:waitingReasons[job.blocker]||'Revisar el bloqueo de la pieza.',jobId:job.id,version:job.version,stage:job.stage});
  }
  const director=agents[0],waiting=jobs.filter(j=>['awaiting_review','changes_requested'].includes(j.state));
  if(waiting.length&&director.status==='idle')Object.assign(director,{status:'waiting',text:`${waiting.length} ${waiting.length===1?'pieza espera':'piezas esperan'} tu revisión`,jobId:waiting[0].id,version:waiting[0].version});
  return {brand,observedAt:now,departments,agents,coordination:{enabled,reason:lastReason,message:waitingReasons[lastReason]||null,editorCapacity:3,activeEditors:[...active.values()].filter(a=>a.editorId&&a.brand===brand).map(a=>({editorId:a.editorId,jobId:a.jobId})),codexConnected:connections.connected===true,organicContractConnected:connections.workflows?.includes(ORGANIC_PROTOCOL)===true,externalResearch:false,voiceTestAuthorized:!!production?.voiceConfigured,publishingEnabled:false},decisions:jobs.filter(j=>['awaiting_review','changes_requested'].includes(j.state)).map(j=>j.id),attention:jobs.filter(j=>j.state==='blocked').map(j=>({id:j.id,reason:waitingReasons[j.blocker]||'Revisar la pieza.'}))};
 }
 return {snapshot,tick,recover,manualRun:async(b,id)=>{let j=await flow.get(b,id);if(enabled&&!worker.permits(id)&&j.brief.deliverable==='idea'){j=await flow.updateOffice(b,id,j.version,x=>{x.ideaAuthorization={source:'owner-idea-trigger',at:new Date().toISOString()};},'idea_authorized');worker.authorizeIdea(id);}if(!worker.permits(id))return {waiting:true,reason:'WAITING_FOR_OWNER_TEST'};if(j.state==='blocked')await flow.updateOffice(b,id,j.version,x=>{x.state='queued';x.blocker=null;},'owner_resume');void tick();return flow.get(b,id);},start(){if(enabled&&!timer){timer=setInterval(()=>tick().catch(()=>{lastReason='COORDINATION_UNAVAILABLE';}),intervalMs);timer.unref();}},async stop(){closed=true;clearInterval(timer);await Promise.allSettled([...active.values()].map(a=>a.promise));},active:()=>[...active.values()].map(({promise,...a})=>a)};
}
