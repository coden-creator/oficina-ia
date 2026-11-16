import {createPosterRenderer} from './poster.mjs';
import {audiovisualCriteria} from './audiovisual-standard.mjs';
import {publicProductionPlan} from '../production/glowfy/cinematic-plan.mjs';
import {byteRange} from './http-range.mjs';
import {criteria} from './organic-contract.mjs';
import {waitingReasons} from './office-team.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {stages,brands} from './video-flow.mjs';
import {REFERENCE_STANDARD,DIAGNOSTIC_STANDARD,validateQualityStandard} from '../production/reference-standard.mjs';
const labels={research:'Contexto y evidencia',strategy:'Estrategia',script:'Guion',creative_review:'Revisión creativa',art_direction:'Dirección de arte',edit_plan:'Montaje y sonido',production:'Producción',qa:'Control técnico y visual',owner_review:'Revisión de Jorge'};
export function stageView(j){return stages.map(id=>{const output=j.outputs[id];const complete=id==='production'?!!j.artifact:id==='owner_review'?j.state==='approved':!!output;const provenance=output?.provenance;return {id,label:labels[id],status:j.brief.deliverable==='idea'&&['production','qa'].includes(id)?'not_requested':['changes','reject'].includes(output?.verdict??output?.detail?.verdict)?'changes_requested':complete?'completed':j.stage===id?j.state==='running'?'running':j.state==='blocked'?'blocked':j.state==='changes_requested'?'changes_requested':j.state==='awaiting_review'?'awaiting_owner_review':'pending':'pending',summary:typeof output?.summary==='string'?output.summary.slice(0,2000):null,source:typeof provenance==='string'&&/fixture|test/i.test(provenance)?'simulated-test':provenance?.provider==='codex-chatgpt-plan'?'codex-chatgpt-plan':'not-verified'};});}

export const publicJob=j=>({ai:{model:Object.values(j.outputs).find(o=>o?.provenance?.model)?.provenance.model||null,reasoning:Object.values(j.outputs).find(o=>o?.provenance?.reasoning)?.provenance.reasoning||null,visualReview:j.outputs.qa?.internalVisualReview||null},id:j.id,brandId:j.brandId,version:j.version,stages:stageView(j),quality:{technical:j.outputs.qa?.technical?.passed===true?'passed':'not-verified',visual:j.state==='approved'?'accepted-by-owner':'pending-owner-review',published:false},concept:j.brief.deliverable==='idea'?{angle:j.outputs.strategy?.detail?.angle||null,summary:j.outputs.research?.summary||null,limitations:j.outputs.research?.detail?.limitations||[],art:j.outputs.art_direction?.detail||null}:null,brief:{objective:j.brief.objective,cta:j.brief.cta,deliverable:j.brief.deliverable||'video',qualityStandard:j.brief.qualityStandard??DIAGNOSTIC_STANDARD},state:j.state,stage:j.stage,discard:j.discard?{reason:j.discard.reason,version:j.discard.version,at:j.discard.at}:null,blocker:['blocked','changes_requested'].includes(j.state)?j.blocker==='REFERENCE_PRODUCTION_NOT_CONNECTED'?'La solicitud exige el acabado audiovisual de las referencias. Falta conectar escenas, narración y mezcla a ese nivel; se conserva el trabajo ya realizado.':waitingReasons[j.blocker]||'El flujo está bloqueado. Revisá la conexión o el resultado del especialista.':null,blockerCode:['blocked','changes_requested'].includes(j.state)&&/^[A-Z0-9_]{1,100}$/.test(j.blocker||'')?j.blocker:null,productionProgress:j.productionProgress||null,audio:j.outputs.production?.voice?{provider:'elevenlabs',model:j.outputs.production.voice.model,characters:j.outputs.production.voice.characters,submittedCharacters:j.outputs.production.voice.submittedCharacters}:null,music:j.outputs.production?.music?{id:j.outputs.production.music.id,title:j.outputs.production.music.title}:null,createdAt:j.createdAt,productionPlan:publicProductionPlan(j.productionPlan),audiovisualReview:j.audiovisualReviews?.filter(r=>r.version===j.version&&r.artifactHash===j.artifact?.sha256).at(-1)||null,audiovisualCriteria,preview:j.preview?.version===j.version?{sha256:j.preview.sha256,version:j.version,bytes:j.preview.bytes,kind:j.preview.kind,duration:j.preview.metadata?.duration,url:`/api/video-workflows/${j.brandId}/${j.id}/preview?v=${j.version}`} :null,creativeReview:j.outputs.creative_review?.detail?{verdict:j.outputs.creative_review.detail.verdict,criteria:j.outputs.creative_review.detail.criteria.map(c=>({...c,label:criteria.find(x=>x.id===c.id)?.label||c.id})),corrections:j.outputs.creative_review.detail.corrections}:null,storyboard:j.outputs.script?.detail||null,capabilities:j.capabilities,approval:j.approval?{version:j.approval.version,scope:j.approval.scope,at:j.approval.at}:null,artifact:j.artifact?{sha256:j.artifact.sha256,version:j.artifact.version,bytes:j.artifact.bytes,kind:j.artifact.kind,posterUrl:`/api/video-workflows/${j.brandId}/${j.id}/poster?v=${j.version}`,url:`/api/video-workflows/${j.brandId}/${j.id}/artifact?v=${j.version}`} :null});
export function createVideoHttpHandler({flow,dataDir,origin}){
 const poster=createPosterRenderer();
 const send=(res,code,value)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});res.end(JSON.stringify(value));};
 return async(req,res)=>{
  if(!req.url.startsWith('/api/video-workflows'))return false;
  try{
   if(req.url==='/api/video-workflows/capabilities'&&req.method==='GET'){await flow.refreshConnection?.();send(res,200,{...flow.capabilities(),brandProfiles:brands});return true;}
   const match=/^\/api\/video-workflows\/([a-z]+)(?:\/([a-z0-9-]{1,80})(?:\/(run|produce|rerender|approve|changes|discard|artifact|preview|poster|audiovisual-review))?)?(?:\?v=(\d+))?$/.exec(req.url);
   if(!match){send(res,404,{error:'NOT_FOUND'});return true;}
   const [,brand,id,action,version]=match;
   if(!flow.capabilities().brands.includes(brand)){send(res,404,{error:'UNKNOWN_BRAND'});return true;}
   if(req.method==='GET'||(req.method==='HEAD'&&['artifact','preview','poster'].includes(action))){
    if(['artifact','preview','poster'].includes(action)){
     const job=await flow.get(brand,id),media=action==='preview'?job.preview:job.artifact;if(!media||Number(version)!==job.version||media.version!==job.version)throw Error('artifact');
     const root=await fs.realpath(path.join(dataDir,brand,id,`v${job.version}`));const file=await fs.realpath(media.file);
     if(!file.startsWith(root+path.sep)||path.extname(file)!=='.mp4'||!['silent_animatic','technical_canvas_demo','narrated_brand_video','audiovisual_preview'].includes(media.kind))throw Error('artifact');
     const stat=await fs.stat(file);if(stat.size>50*1024*1024||stat.size<1)throw Error('artifact');
     const bytes=await fs.readFile(file);if(createHash('sha256').update(bytes).digest('hex')!==media.sha256)throw Error('artifact');
     if(action==='poster'){const jpeg=await poster({root,file,sha256:media.sha256});res.writeHead(200,{'Content-Type':'image/jpeg','Content-Length':jpeg.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});res.end(req.method==='HEAD'?undefined:jpeg);return true;}
     const headers={'Content-Type':'video/mp4','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Accept-Ranges':'bytes','Content-Disposition':`inline; filename="${brand}-${id}-v${job.version}.mp4"`};
     // No validator is advertised: an If-Range request must receive the full representation.
     const range=byteRange(req.headers['if-range']?undefined:req.headers.range,bytes.length);
     if(!range){res.writeHead(416,{...headers,'Content-Range':`bytes */${bytes.length}`,'Content-Length':0});res.end();return true;}
     const {start,end,partial}=range;res.writeHead(partial?206:200,{...headers,'Content-Length':end-start+1,...(partial?{'Content-Range':`bytes ${start}-${end}/${bytes.length}`}:{})});res.end(req.method==='HEAD'?undefined:bytes.subarray(start,end+1));return true;
    }
    if(action)throw Error('route');send(res,200,id?publicJob(await flow.get(brand,id)):(await flow.list(brand)).map(publicJob));return true;
   }
   if(req.method!=='POST'){send(res,405,{error:'METHOD_NOT_ALLOWED'});return true;}
   if(req.headers.origin&&req.headers.origin!==origin){send(res,403,{error:'ORIGIN_NOT_ALLOWED'});return true;}
   if(req.headers['content-type']!=='application/json'){send(res,415,{error:'JSON_REQUIRED'});return true;}
   let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16384){send(res,413,{error:'BODY_TOO_LARGE'});return true;}}
   const b=JSON.parse(body);if(!b||typeof b!=='object'||Array.isArray(b))throw Error('body');
   let job;
   if(!id){if(Object.keys(b).some(k=>!['objective','cta','audience','channel','evidence','style','qualityStandard','deliverable'].includes(k)))throw Error('body');if(b.style!==undefined&&b.style!=='technical-canvas-demo')throw Error('style');job=await flow.create({brandId:brand,brief:{objective:b.objective,cta:b.cta,...(b.deliverable!==undefined?{deliverable:b.deliverable}:{}),qualityStandard:validateQualityStandard(b.qualityStandard??REFERENCE_STANDARD),...(b.audience?{audience:b.audience}:{}),...(b.channel?{channel:b.channel}:{}),...(b.evidence?{evidence:b.evidence}:{}),...(b.style?{style:b.style}:{}),voice:'none',paid:false,publish:false}});}
   else if(action==='produce'){if(Object.keys(b).some(k=>!['version','productionMode'].includes(k))||!Number.isInteger(b.version))throw Error('body');job=await flow.produce(brand,id,b);}
   else if(action==='rerender'){if(Object.keys(b).some(k=>k!=='version')||!Number.isInteger(b.version))throw Error('body');job=await flow.rerender(brand,id,b);}
   else if(action==='run'){if(Object.keys(b).length)throw Error('body');job=await flow.run(brand,id);if(job?.waiting){send(res,409,{error:job.reason,detail:'La producción automática está preparada para la prueba. Jorge avisará cuándo iniciarla.'});return true;}}
   else if(action==='audiovisual-review'){job=await flow.recordAudiovisualReview(brand,id,b);}
   else if(action==='approve'){if(Object.keys(b).some(k=>!['version','artifactHash'].includes(k)))throw Error('body');job=await flow.approve(brand,id,{version:b.version,artifactHash:b.artifactHash,actor:'authenticated-office-user',source:'office-ui'});}
   else if(action==='changes'){if(Object.keys(b).some(k=>k!=='feedback')||typeof b.feedback!=='string'||b.feedback.length>2000)throw Error('body');job=await flow.requestChanges(brand,id,{feedback:b.feedback});}
   else if(action==='discard'){if(Object.keys(b).some(k=>!['version','reason'].includes(k)))throw Error('body');job=await flow.discard(brand,id,{version:b.version,reason:b.reason,actor:'authenticated-office-user',source:'office-ui'});}
   else{send(res,404,{error:'NOT_FOUND'});return true;}
   send(res,200,publicJob(job));return true;
  }catch{send(res,409,{error:'VIDEO_REQUEST_NOT_COMPLETED',detail:'Verifica datos, versión, conexión o archivo. No se confirma ninguna publicación.'});return true;}
 };
}
