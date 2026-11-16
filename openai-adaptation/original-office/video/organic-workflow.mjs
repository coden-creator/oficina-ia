import {ORGANIC_PROTOCOL,organicPrompts,validateOrganicOutput} from './organic-contract.mjs';
import {brands} from './video-flow.mjs';
const copy=x=>structuredClone(x);
export function createOrganicWorkflow({flow,runner,enabled=false,allowedJobIds=[],production=null}){
 let turn=Promise.resolve();const processing=new Set();
 const allowed=new Set(allowedJobIds);
 const permit=id=>enabled&&allowed.has(id);
 const call=q=>{const next=turn.then(()=>runner.run(q));turn=next.catch(()=>{});return next;};
 async function executeInternal(brand,id,{phase='prepare',editorId=null}={}){
  if(!permit(id))return {waiting:true,reason:'WAITING_FOR_OWNER_TEST'};
  await runner?.refresh?.();
  if(!runner?.status?.().workflows?.includes(ORGANIC_PROTOCOL))return {waiting:true,reason:'ORGANIC_WORKER_UPDATE_REQUIRED'};
  let job=await flow.get(brand,id);
  if(['approved','discarded','awaiting_review','changes_requested'].includes(job.state))return job;
  const patch=async(fn,event)=>{job=await flow.updateOffice(brand,id,job.version,fn,event);return job;};
  await patch(j=>{j.state='running';j.blocker=null;j.execution={workflow:ORGANIC_PROTOCOL,phase,editorId,startedAt:new Date().toISOString()};},'organic_started');
  try{
   const stages=phase==='prepare'?['research','strategy','script','creative_review']:['art_direction'];
   let index=0;
   while(index<stages.length){
    const stage=stages[index];if(job.outputs[stage]){index++;continue;}
    await patch(j=>{j.stage=stage;},'specialist_started');
    const previous=Object.fromEntries(Object.entries(job.outputs).filter(([key])=>['research','strategy','script','creative_review'].includes(key)));
    const q={brand,jobId:id,stage,prompt:organicPrompts[stage],input:{brief:job.brief,previous,feedback:job.organicFeedback??null},context:{workflow:ORGANIC_PROTOCOL,brand,brandProfile:brands[brand],version:job.version,evidence:job.brief.evidence||[],editorId,restrictions:{noPaid:true,noPublish:true,noCloning:true,research:'supplied-evidence-only'}}};
    const result=await call(q);
    if(result?.status!=='completed')throw Error(result?.reason||'ORGANIC_STAGE_FAILED');
    const output=validateOrganicOutput(result.output,{stage,brand,brief:job.brief});
    if(result.provenance?.workflow!==ORGANIC_PROTOCOL)throw Error('UNVERIFIED_ORGANIC_PROVIDER');
    await patch(j=>{j.outputs[stage]={...copy(output),provenance:copy(result.provenance)};},'stage_completed');
    if(stage==='creative_review'){
     const review=output.detail;
     if(review.verdict==='reject'){
      await patch(j=>{j.state='changes_requested';j.blocker='CREATIVE_REJECTED';j.execution=null;},'creative_rejected');return job;
     }
     if(review.verdict==='changes'){
      if((job.organicAttempts||0)>=2){await patch(j=>{j.state='changes_requested';j.blocker='CREATIVE_REVISION_LIMIT';j.execution=null;},'creative_limit');return job;}
      await patch(j=>{
       j.revisions||=[];j.revisions.push({version:j.version,outputs:copy(j.outputs),artifact:j.artifact,approval:j.approval,reason:'organic_creative_changes'});
       j.version++;j.organicAttempts=(j.organicAttempts||0)+1;j.organicFeedback=review.corrections;j.outputs={research:j.outputs.research,strategy:j.outputs.strategy};j.artifact=null;j.approval=null;j.stage='script';
      },'automatic_creative_revision');index=stages.indexOf('script');continue;
     }
    }
    index++;
   }
   if(phase==='prepare')await patch(j=>{j.stage='art_direction';j.state='queued';j.execution=null;},'ready_for_editor');
   else if(production?.permits(job)){
    await patch(j=>{j.stage='production';j.editorId=editorId;},'production_started');
    const result=await production.render(job,async(stage,summary)=>patch(j=>{j.stage=stage;j.productionProgress=summary;},'production_progress'));
    await patch(j=>{j.artifact=result.artifact;j.outputs.production=result.production;j.outputs.qa=result.qa;j.stage='owner_review';j.state='awaiting_review';j.execution=null;j.productionProgress=null;},'narrated_video_ready');
   }else await patch(j=>{j.stage='production';j.state='blocked';j.blocker='REFERENCE_PRODUCTION_NOT_CONNECTED';j.execution=null;j.editorId=editorId;},'production_dependency');
  }catch(error){
   await patch(j=>{j.state='blocked';j.execution=null;j.blocker=/^[A-Z0-9_]{1,100}$/.test(error.message)?error.message:'ORGANIC_STAGE_FAILED';},'organic_blocked');
  }
  return job;
 }
 async function execute(brand,id,options){const key=brand+'/'+id;if(processing.has(key))return {waiting:true,reason:'PIECE_RUNNING'};processing.add(key);try{return await executeInternal(brand,id,options);}finally{processing.delete(key);}}
 return {execute,permits:permit};
}
