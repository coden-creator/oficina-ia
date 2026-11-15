import {validateScriptForRenderer,validateVisualPlan} from './visual-contract.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { constants } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
export const brands = Object.freeze({
 glowfy:{name:'Glowfy',audience:'Manicuristas y profesionales de belleza',focus:'Agenda, reservas y respuesta a mensajes',channels:['instagram','facebook','tiktok']},
 velforce:{name:'Velforce',audience:'Negocios que reciben muchos mensajes y necesitan seguimiento',focus:'Organización de prospectos y seguimiento comercial',channels:['instagram','facebook','tiktok']},
 quiba:{name:'QUIBA',audience:'Clientes de vidrio y aluminio',focus:'Ventanas y barandales con portafolio real',channels:['instagram','facebook','tiktok']},
 purify:{name:'Purify',audience:'Hogares interesados en filtración de agua',focus:'Filtración doméstica sin promesas médicas',channels:['instagram','facebook','tiktok']},
 coden:{name:'CODEn',audience:'Negocios, emprendimientos y pymes',focus:'Glowfy y Velforce; asesoría secundaria',channels:['instagram','facebook']}
});
export const stages=['research','strategy','script','creative_review','art_direction','production','qa','owner_review'];
const roles={research:'Investigación: registra fuentes y fecha; sin navegación declara esa limitación; no inventes tendencias.',strategy:'Estrategia: dolor concreto, oferta comprobada y una sola llamada a la acción. No prometas ventas ni viralidad.',script:'Guion: hook en primeros dos segundos y escenas breves legibles en móvil. Devuelve scenes [{text,durationSeconds}], summary y evidence. Máximo 8 escenas, 60 segundos.',creative_review:'Evaluación independiente del guion: devuelve verdict pass o changes, summary, evidence y correcciones concretas. No sustituye aprobación humana.',art_direction:'Arte: composición, profundidad, entrada/reposo/salida, tres cuadros clave, movimiento determinista. No inventes logos, colores ni reutilices música sin licencia.'};
const digest=b=>createHash('sha256').update(b).digest('hex');
const clone=x=>JSON.parse(JSON.stringify(x));
const validId=x=>typeof x==='string'&&/^[a-z0-9-]{1,80}$/.test(x);
function ensureBrand(b){if(!Object.hasOwn(brands,b))throw new Error('Marca no admitida');}
function validateBrief(b){
 if(!b||typeof b!=='object'||Array.isArray(b))throw new Error('Brief requerido');
 const allowed=new Set(['objective','cta','voice','evidence','feedback','audience','channel','format','style','reference','paid','publish']);
 for(const k of Object.keys(b))if(!allowed.has(k))throw new Error(`Campo de brief no admitido: ${k}`);
 for(const k of ['objective','cta'])if(typeof b[k]!=='string'||!b[k].trim()||b[k].length>2000)throw new Error(`Brief inválido: ${k}`);
 for(const k of ['feedback','audience','channel','format','style','reference'])if(b[k]!==undefined&&(typeof b[k]!=='string'||b[k].length>4000))throw new Error(`Brief inválido: ${k}`);
 if(b.voice&&b.voice!=='none')throw new Error('Esta versión solo admite animática sin voz; no clona ni genera voz');
 for(const k of ['paid','publish'])if(b[k]!==undefined&&b[k]!==false)throw new Error('Publicación/gasto no habilitados');
 if(b.evidence!==undefined){if(!Array.isArray(b.evidence)||b.evidence.length>30)throw new Error('Evidencia inválida');const ids=new Set();for(const e of b.evidence){if(!e||typeof e!=='object'||Array.isArray(e)||Object.keys(e).some(k=>!['id','text','source','date'].includes(k))||typeof e.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(e.id)||ids.has(e.id)||typeof e.text!=='string'||!e.text.trim()||e.text.length>8000)throw new Error('Evidencia inválida');ids.add(e.id);for(const k of ['source','date'])if(e[k]!==undefined&&(typeof e[k]!=='string'||e[k].length>2000))throw new Error('Fuente inválida');}}
 if(JSON.stringify(b).length>120000)throw new Error('Brief demasiado grande');
}
// Every existing ancestor is checked. Private directory ownership is also required at deployment;
// no pathname API can protect against a privileged attacker replacing directories concurrently.
async function safePath(target,{directory=false,create=false}={}){
 const abs=path.resolve(target);let current=path.parse(abs).root;
 const parts=abs.slice(current.length).split(path.sep).filter(Boolean);
 for(let i=0;i<parts.length;i++){current=path.join(current,parts[i]);const dir=i<parts.length-1||directory;let st;
  try{st=await fs.lstat(current);}catch(e){if(e.code==='ENOENT'&&create&&dir){try{await fs.mkdir(current,{mode:0o700});}catch(x){if(x.code!=='EEXIST')throw x;}st=await fs.lstat(current);}else throw e;}
  if(st.isSymbolicLink()||(dir?!st.isDirectory():!st.isFile()))throw new Error('Ruta insegura o tipo de archivo inválido');
 }
 return abs;
}
async function safeRead(target,maxBytes=5*1024*1024){await safePath(target);const h=await fs.open(target,constants.O_RDONLY|constants.O_NOFOLLOW);try{const st=await h.stat();if(!st.isFile()||st.size>maxBytes)throw new Error('Archivo inválido o demasiado grande');return await h.readFile();}finally{await h.close();}}
function validateOutput(stage,o){if(!o||typeof o!=='object'||typeof o.summary!=='string'||!Array.isArray(o.evidence))throw new Error(`Salida inválida en ${stage}`);if(JSON.stringify(o).length>100000)throw new Error('Salida demasiado grande');if(stage==='script'){if(!Array.isArray(o.scenes)||o.scenes.length<1||o.scenes.length>8)throw new Error('Escenas inválidas');let total=0;for(const s of o.scenes){if(typeof s.text!=='string'||!s.text.trim()||s.text.length>140||!Number.isFinite(s.durationSeconds)||s.durationSeconds<2||s.durationSeconds>10)throw new Error('Texto/tiempo de escena inválido');total+=s.durationSeconds;}if(total>60)throw new Error('Duración excede 60s');}if(stage==='creative_review'&&!['pass','changes'].includes(o.verdict))throw new Error('Veredicto inválido');}

function validateHistoryIntegrity(j){
 if(j.draftHash!==undefined&&j.draftHash!==null){const expected=digest(JSON.stringify({brandId:j.brandId,version:j.version,brief:j.brief,script:j.outputs.script}));if(j.draftHash!==expected)throw Error('Hash de guion inválido');}
 if(j.revisions!==undefined){if(!Array.isArray(j.revisions)||j.revisions.length>100)throw Error('Historial de revisión inválido');for(const r of j.revisions){if(!r||typeof r!=='object')throw Error('Snapshot inválido');if(r.reason==='creative_review_changes'||r.snapshotHash!==undefined){const {snapshotHash,reason,...snapshot}=r;if(typeof snapshotHash!=='string'||snapshotHash!==digest(JSON.stringify(snapshot)))throw Error('Hash de snapshot inválido');if(snapshot.draftHash!==null&&snapshot.draftHash!==undefined){const expected=digest(JSON.stringify({brandId:j.brandId,version:snapshot.version,brief:snapshot.brief,script:snapshot.outputs?.script}));if(snapshot.draftHash!==expected)throw Error('Hash histórico de guion inválido');}}}}
}

export function createVideoFlow({dataDir,adapters={},creativeRevision={}}){
 const revisionPolicy={maxAttempts:creativeRevision.maxAttempts??0,authorized:creativeRevision.authorized===true,source:creativeRevision.source??null};
 if(!Number.isInteger(revisionPolicy.maxAttempts)||revisionPolicy.maxAttempts<0||revisionPolicy.maxAttempts>2)throw new Error('Máximo de correcciones automáticas permitido: 0 a 2');
 if(revisionPolicy.authorized&&(typeof revisionPolicy.source!=='string'||!revisionPolicy.source.trim()||revisionPolicy.source.length>1000))throw new Error('Fuente de autorización de producción requerida');
 if(!path.isAbsolute(dataDir))throw new Error('Directorio absoluto requerido');
 dataDir=path.resolve(dataDir);
 let tail=Promise.resolve();
 const serial=fn=>{const next=tail.then(async()=>{
  await safePath(dataDir,{directory:true,create:true});const lock=path.join(dataDir,'.flow.lock');let h;
  try{h=await fs.open(lock,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);}catch(e){if(e.code==='EEXIST')throw new Error('Almacén ocupado; otra instancia o bloqueo pendiente de recuperación');throw e;}
  try{await h.writeFile(JSON.stringify({pid:process.pid,at:new Date().toISOString()}));return await fn();}finally{await h.close();await fs.unlink(lock);}
 });tail=next.catch(()=>{});return next;};
 const file=(b,id)=>{ensureBrand(b);if(!validId(id))throw new Error('ID inválido');return path.join(dataDir,b,id,'job.json');};
 const save=async j=>{const payload=JSON.stringify(j,null,2);if(Buffer.byteLength(payload)>5*1024*1024)throw new Error('Ficha demasiado grande; archivar historial antes de continuar');const f=file(j.brandId,j.id);await safePath(path.dirname(f),{directory:true,create:true});try{await safePath(f);}catch(e){if(e.code!=='ENOENT')throw e;}const tmp=f+'.'+randomUUID();const h=await fs.open(tmp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);try{await h.writeFile(payload);await h.sync();}finally{await h.close();}await safePath(path.dirname(f),{directory:true});await fs.rename(tmp,f);const dh=await fs.open(path.dirname(f),constants.O_RDONLY);try{await dh.sync();}finally{await dh.close();}};
 const get=async(b,id)=>{const j=JSON.parse(await safeRead(file(b,id)));if(j.schemaVersion!==1||j.brandId!==b||j.id!==id||!Number.isSafeInteger(j.version)||j.version<1||!Array.isArray(j.history)||!j.outputs||typeof j.outputs!=='object'||!['queued','running','blocked','changes_requested','awaiting_review','approved'].includes(j.state))throw new Error('Identidad o esquema de ficha inválido');validateBrief(j.brief);if(j.creativeLoop&&(!Number.isInteger(j.creativeLoop.attempts)||j.creativeLoop.attempts<0||j.creativeLoop.attempts>2||!Number.isInteger(j.creativeLoop.limit)||j.creativeLoop.limit<0||j.creativeLoop.limit>2))throw new Error('Contador de revisión inválido');if(j.artifact){const expected=path.join(dataDir,b,id,`v${j.version}`)+path.sep;if(typeof j.artifact.file!=='string'||!path.resolve(j.artifact.file).startsWith(expected)||j.artifact.version!==j.version||!/^[a-f0-9]{64}$/.test(j.artifact.sha256))throw new Error('Artefacto fuera de ficha');}validateHistoryIntegrity(j);return j;};
 const event=(j,type,detail)=>j.history.push({at:new Date().toISOString(),type,detail});
 const publicJob=j=>clone(j);
 async function createInternal({brandId,brief}){ensureBrand(brandId);validateBrief(brief);if((await list(brandId)).length>=1000)throw new Error('Límite de 1000 piezas por marca alcanzado');const j={schemaVersion:1,id:randomUUID(),brandId,version:1,creativeLoop:{attempts:0,limit:revisionPolicy.maxAttempts,authorizationSource:revisionPolicy.authorized?revisionPolicy.source:null,stopReason:null},brief:clone(brief),state:'queued',stage:stages[0],outputs:{},artifact:null,approval:null,history:[],createdAt:new Date().toISOString(),capabilities:{paid:false,publish:false,voiceClone:false},cost:{amount:null,evidence:'No paid API enabled; inference usage/plan quota not measured'}};event(j,'created','Production requested; final review mandatory');await save(j);return publicJob(j);}
 async function list(brandId){ensureBrand(brandId);let ids;try{await safePath(path.join(dataDir,brandId),{directory:true});ids=await fs.readdir(path.join(dataDir,brandId));if(ids.length>1000)throw new Error('Límite de piezas excedido');}catch(e){if(e.code==='ENOENT')return [];throw e;}const jobs=[];for(const id of ids.filter(validId)){try{jobs.push(await get(brandId,id));}catch(e){if(e.code!=='ENOENT')throw e;}}return jobs.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 function revisionGate(j){
  const loop=j.creativeLoop;
  if(!revisionPolicy.authorized||!revisionPolicy.source||!loop?.authorizationSource)return 'AUTOMATIC_REVISION_NOT_AUTHORIZED';
  if(loop.attempts>=Math.min(loop.limit,revisionPolicy.maxAttempts))return 'AUTOMATIC_REVISION_LIMIT_REACHED';
  let status;try{status=adapters.runner?.status?.();}catch{return 'RUNNER_STATUS_UNAVAILABLE';}
  if(status?.connected!==true)return 'RUNNER_NOT_READY';
  if(status.paidApiEnabled!==false||status.publishingEnabled!==false)return 'RUNNER_CAPABILITIES_NOT_ALLOWED';
  if(j.outputs.creative_review?.provenance?.provider!=='codex-chatgpt-plan')return 'UNVERIFIED_REVIEW_PROVIDER';
  return null;
 }
 async function reviseOrStop(j){
  const review=j.outputs.creative_review;
  const stop=revisionGate(j);if(stop){j.state='changes_requested';j.blocker=review.summary;j.creativeLoop||={attempts:0,limit:0,authorizationSource:null};j.creativeLoop.stopReason=stop;event(j,'creative_revision_stopped',stop);await save(j);return false;}
  if(j.version>=100)throw new Error('Límite de 100 revisiones alcanzado');
  const snapshot={version:j.version,brief:clone(j.brief),outputs:clone(j.outputs),artifact:j.artifact,approval:j.approval,draftHash:j.draftHash??null};
  j.revisions||=[];j.revisions.push({...snapshot,snapshotHash:digest(JSON.stringify(snapshot)),reason:'creative_review_changes'});
  j.creativeLoop.attempts++;j.creativeLoop.stopReason=null;j.version++;j.approval=null;j.artifact=null;j.draftHash=null;
  j.creativeFeedback={summary:review.summary.slice(0,4000),previousVersion:j.version-1,reviewHash:digest(JSON.stringify(review)),scope:'revise_script_only_no_new_permissions'};
  j.outputs={research:j.outputs.research,strategy:j.outputs.strategy};j.stage='script';j.state='running';
  event(j,'automatic_creative_revision',{attempt:j.creativeLoop.attempts,version:j.version,source:revisionPolicy.source});await save(j);return true;
 }
 async function runInternal(b,id){const j=await get(b,id);if(['approved','awaiting_review','changes_requested'].includes(j.state))return j;j.state='running';j.blocker=null;event(j,'run','Single-worker queue');await save(j);
 try{
 creativeCycle: while(true){
 for(const stage of Object.keys(roles)){
  j.stage=stage;
  if(stage==='creative_review'&&j.outputs[stage]?.verdict==='changes'){if(await reviseOrStop(j))continue creativeCycle;return j;}
  if(j.outputs[stage])continue;
  if((j.creativeLoop?.attempts||0)>0){if(!revisionPolicy.authorized||!revisionPolicy.source)throw new Error('AUTOMATIC_REVISION_NOT_AUTHORIZED');const status=adapters.runner?.status?.();if(status?.connected!==true||status.paidApiEnabled!==false||status.publishingEnabled!==false)throw new Error('RUNNER_NOT_READY_FOR_REVISION');}
  if(!adapters.runner?.run)throw new Error('Codex no conectado: falta ejecutor de especialistas. No se ha generado contenido con IA.');
  const context={brand:b,brandProfile:brands[b],evidence:j.brief.evidence||[],brandId:b,brief:j.brief,version:j.version,creativeFeedback:j.creativeFeedback??null,rendererCapabilities:adapters.renderer?.profile||null,constraints:{noPaid:true,noPublish:true,noCloning:true,brandFactsAreUserContext:true},previous:clone(j.outputs)};
  const result=await adapters.runner.run({brand:b,stage,prompt:roles[stage],jobId:id,input:{brief:j.brief,previous:clone(j.outputs),creativeFeedback:j.creativeFeedback??null},context});
  if(result?.status!=='completed')throw new Error(result?.reason||`Especialista ${stage} no completado`);
  validateOutput(stage,result.output);if(stage==='script'&&adapters.renderer?.profile)validateScriptForRenderer(result.output,adapters.renderer.profile);if(stage==='art_direction'&&result.output.visualPlan&&adapters.renderer?.profile)validateVisualPlan(result.output.visualPlan,j.outputs.script,adapters.renderer.profile);j.outputs[stage]={...clone(result.output),provenance:result.provenance||'adapter-not-specified'};if(stage==='script')j.draftHash=digest(JSON.stringify({brandId:j.brandId,version:j.version,brief:j.brief,script:j.outputs.script}));event(j,'stage_completed',stage);await save(j);
  if(stage==='creative_review'&&result.output.verdict==='changes'){if(await reviseOrStop(j))continue creativeCycle;return j;}
 }
 break;
 }
 j.stage='production';await save(j);if(!adapters.renderer?.render)throw new Error('Motor de render no conectado');
 const outDir=path.join(dataDir,b,id,`v${j.version}`);await safePath(outDir,{directory:true,create:true});
 const rendered=await adapters.renderer.render({jobId:id,brand:b,brandContext:brands[b],brief:j.brief,script:j.outputs.script,art:j.outputs.art_direction,outDir});
 const realDir=await fs.realpath(outDir),realFile=await fs.realpath(rendered.file);if(!realFile.startsWith(realDir+path.sep))throw new Error('Artefacto fuera de carpeta de pieza');
 await safePath(rendered.file);const bytes=await safeRead(realFile,256*1024*1024);if(bytes.length<1)throw new Error('Artefacto vacío');
 j.artifact={file:realFile,sha256:digest(bytes),bytes:bytes.length,version:j.version,kind:rendered.kind||'silent_animatic',metadata:rendered.metadata||null};
 j.stage='qa';if(!adapters.renderer?.inspect)throw new Error('Inspector técnico no conectado');const qa=await adapters.renderer.inspect(realFile);j.outputs.qa={technical:qa,visual:'pending_owner_review',audio:'not_requested_silent',commercialQuality:'not_verified'};
 if(qa?.passed!==true)throw new Error('QA técnico no pasó');
 j.stage='owner_review';j.state='awaiting_review';event(j,'rendered','Animática disponible; falta revisión visual/humana y aprobación. No publicada.');
 }catch(e){j.state='blocked';j.blocker=String(e.message||e).slice(0,1000);event(j,'blocked',j.blocker);}
 await save(j);return publicJob(j);}
 async function approve(b,id,a){return serial(async()=>{const j=await get(b,id);if(j.state!=='awaiting_review'||!j.artifact)throw new Error('No hay artefacto revisable');if(!a||a.version!==j.version||a.artifactHash!==j.artifact.sha256||!a.actor||!a.source)throw new Error('Aprobación requiere versión/hash/autor/fuente exactos');if(digest(await safeRead(j.artifact.file,256*1024*1024))!==j.artifact.sha256)throw new Error('Artefacto cambió desde QA');j.approval={version:j.version,artifactHash:a.artifactHash,actor:String(a.actor),source:String(a.source),at:new Date().toISOString(),scope:'accept_artifact_only'};j.state='approved';event(j,'approved','No autoriza publicación');await save(j);return j;});}
 async function requestChanges(b,id,{feedback}){return serial(async()=>{if(typeof feedback!=='string'||!feedback.trim()||feedback.length>4000)throw new Error('Corrección requerida');const j=await get(b,id);if(j.version>=100)throw new Error('Límite de 100 revisiones alcanzado');j.revisions||=[];j.revisions.push({version:j.version,outputs:j.outputs,artifact:j.artifact,approval:j.approval});j.version++;j.brief.feedback=feedback;j.outputs={};j.artifact=null;j.approval=null;j.draftHash=null;j.creativeFeedback=null;j.state='queued';j.stage=stages[0];event(j,'revision',feedback);await save(j);return j;});}
 return {refreshConnection:()=>adapters.runner?.refresh?.(),create:args=>serial(()=>createInternal(args)),list,get,run:(b,id)=>serial(()=>runInternal(b,id)),approve,requestChanges,capabilities:()=>({brands:Object.keys(brands),stages,runnerConfigured:!!adapters.runner?.run,runnerConnected:adapters.runner?.status?.()?.connected===true,rendererConfigured:!!adapters.renderer?.render,rendererVerified:false,automaticCreativeRevision:{configuredMax:revisionPolicy.maxAttempts,authorized:revisionPolicy.authorized,finalHumanApprovalRequired:true},publish:false,paid:false,voice:false})};
}
