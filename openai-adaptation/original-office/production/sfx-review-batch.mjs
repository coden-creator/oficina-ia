import fs from 'node:fs/promises';import path from 'node:path';import {constants} from 'node:fs';import {createHash} from 'node:crypto';
import {SFX_BATCH,SFX_PLAN,SFX_MODEL,SFX_MAX_CREDITS} from './sfx-review-plan.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const stamp=hash(JSON.stringify({batch:SFX_BATCH,model:SFX_MODEL,plan:SFX_PLAN,promptInfluence:.8,loop:false}));
const base='/api/sfx-review/glowfy/revision-3';
async function save(file,data,exclusive=false){const p=exclusive?file:file+'.new',h=await fs.open(p,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);try{await h.writeFile(data);await h.sync();}finally{await h.close();}if(!exclusive)await fs.rename(p,file);const d=await fs.open(path.dirname(file),'r');try{await d.sync();}finally{await d.close();}}
async function read(file,max=65536){const h=await fs.open(file,constants.O_RDONLY|constants.O_NOFOLLOW);try{const s=await h.stat();if(!s.isFile()||s.size>max)throw Error('SFX_STORAGE_INVALID');return await h.readFile();}finally{await h.close();}}
export function createSfxReviewBatch({dataDir,store,enabled=false}){
 if(!path.isAbsolute(dataDir||''))throw Error('SFX_STORAGE_REQUIRED');const directory=path.join(dataDir,'.sound-reviews',SFX_BATCH);let running=false,failure=null;
 async function state(){const items=[];for(const p of SFX_PLAN){let ledger=null;try{ledger=JSON.parse(await read(path.join(directory,p.id+'.json')));}catch(e){if(e.code!=='ENOENT')throw e;}items.push({id:p.id,number:p.number,title:p.title,status:ledger?.status||'not_started',model:SFX_MODEL,sha256:ledger?.sha256||null,bytes:ledger?.bytes||null,credits:ledger?.credits??null,url:base+'/'+p.id+'.mp3'});}return {batch:SFX_BATCH,model:SFX_MODEL,enabled,running,failure,estimatedMaximumCredits:SFX_MAX_CREDITS,items};}
 async function run(){
  if(!enabled||running||!store)return;running=true;let lock;
  try{
   await fs.mkdir(directory,{recursive:true,mode:0o700});for(const p of [path.dirname(directory),directory]){const s=await fs.lstat(p);if(!s.isDirectory()||s.isSymbolicLink()||(s.mode&0o077))throw Error('SFX_STORAGE_INVALID');}
   try{lock=await fs.open(path.join(directory,'.batch-lock'),'wx',0o600);}catch(e){if(e.code==='EEXIST')throw Error('SFX_BATCH_LOCKED');throw e;}
   const status=await state();let remaining=SFX_MAX_CREDITS;
   for(const [i,p] of SFX_PLAN.entries()){const s=status.items[i];if(s.status==='completed'){if(s.credits!==null&&s.credits>Math.ceil(p.duration*40))throw Error('SFX_COST_EXCEEDED');remaining-=Math.ceil(p.duration*40);}else if(s.status!=='not_started')throw Error('SFX_RESULT_UNCERTAIN');}
   if(remaining&&((await store.sfxQuota()).remainingCredits<remaining))throw Error('SFX_INCLUDED_QUOTA_REQUIRED');
   for(const p of SFX_PLAN){
    const ledgerPath=path.join(directory,p.id+'.json'),audioPath=path.join(directory,p.id+'.mp3');let prior;
    try{prior=JSON.parse(await read(ledgerPath));}catch(e){if(e.code!=='ENOENT')throw e;}
    if(prior){if(prior.stamp!==stamp||prior.status!=='completed')throw Error('SFX_RESULT_UNCERTAIN');if(hash(await read(audioPath,2*1024*1024))!==prior.sha256)throw Error('SFX_CACHE_INVALID');continue;}
    try{await fs.lstat(audioPath);throw Error('SFX_RESULT_UNCERTAIN');}catch(e){if(e.code!=='ENOENT')throw e;}
    const intent={batch:SFX_BATCH,id:p.id,status:'submitted',stamp,model:SFX_MODEL,duration:p.duration,maximumCredits:Math.ceil(p.duration*40),at:new Date().toISOString()};
    await save(ledgerPath,JSON.stringify(intent),true);
    // Once intent is durable, an ambiguous provider result is never retried.
    const {audio,...meta}=await store.generateSfx(p.id);if(meta.model!==SFX_MODEL||audio.length<512)throw Error('SFX_RESPONSE_INVALID');
    await save(audioPath,audio,true);await save(ledgerPath,JSON.stringify({...intent,...meta,status:'completed',sha256:hash(audio),bytes:audio.length}));
    if(meta.credits!==null&&meta.credits>intent.maximumCredits)throw Error('SFX_COST_EXCEEDED');
   }
  }catch(e){failure=/^SFX_[A-Z_]+$/.test(e.message)?e.message:'SFX_BATCH_FAILED';}
  finally{if(lock){await lock.close();await fs.unlink(path.join(directory,'.batch-lock')).catch(()=>{});}running=false;}
 }
 async function http(req,res){
  if(!req.url.startsWith('/api/sfx-review/'))return false;
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));return true;};
  if(req.method!=='GET')return send(405,{error:'METHOD_NOT_ALLOWED'});
  try{if(req.url===base)return send(200,await state());const item=SFX_PLAN.find(p=>req.url===base+'/'+p.id+'.mp3');if(!item)return send(404,{error:'NOT_FOUND'});
   const s=JSON.parse(await read(path.join(directory,item.id+'.json')));if(s.status!=='completed'||s.stamp!==stamp)return send(409,{error:'SFX_NOT_READY'});const bytes=await read(path.join(directory,item.id+'.mp3'),2*1024*1024);if(hash(bytes)!==s.sha256)throw Error('SFX_CACHE_INVALID');
   res.writeHead(200,{'Content-Type':'audio/mpeg','Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});res.end(bytes);return true;
  }catch{return send(409,{error:'SFX_REVIEW_UNAVAILABLE'});}
 }
 return Object.freeze({run,state,http});
}
