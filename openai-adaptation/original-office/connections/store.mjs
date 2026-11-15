import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {createCipheriv,createDecipheriv,randomBytes,randomUUID} from 'node:crypto';
const PROVIDER='elevenlabs',AAD=Buffer.from('office-connections:v1:elevenlabs');
export const validApiKey=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{16,256}$/.test(value);
const fail=code=>{throw Error(code)};
async function checkedPath(file,directory=false){
 const absolute=path.resolve(file);let at=path.parse(absolute).root;
 for(const part of absolute.slice(at.length).split(path.sep).filter(Boolean)){
  at=path.join(at,part);const s=await fs.lstat(at);
  if(s.isSymbolicLink()||(at===absolute&&!directory?!s.isFile():!s.isDirectory()))fail('CONNECTION_STORAGE_UNSAFE');
 }
 return absolute;
}
async function readPrivate(file,max){
 await checkedPath(file);const h=await fs.open(file,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const s=await h.stat();if(!s.isFile()||s.size>max||(s.mode&0o077)!==0||(process.getuid&&s.uid!==process.getuid()))fail('CONNECTION_STORAGE_UNSAFE');return await h.readFile();}finally{await h.close()}
}
export async function createConnectionStore({directory,keyFile,verify,now=()=>new Date().toISOString()}){
 if(!path.isAbsolute(directory||'')||!path.isAbsolute(keyFile||'')||typeof verify!=='function')fail('CONNECTION_CONFIG_REQUIRED');
 await checkedPath(directory,true);const st=await fs.stat(directory);
 if((st.mode&0o077)!==0||(process.getuid&&st.uid!==process.getuid()))fail('CONNECTION_STORAGE_UNSAFE');
 const key=await readPrivate(keyFile,32);if(key.length!==32)fail('CONNECTION_ENCRYPTION_KEY_INVALID');
 const file=path.join(directory,PROVIDER+'.json');
 const expose=record=>({provider:PROVIDER,configured:!!record,maskedKey:record?'••••••••':null,status:record?.verification?.status||'not_configured',checkedAt:record?.verification?.checkedAt||null,updatedAt:record?.updatedAt||null,generationEnabled:false});
 async function read(){
  let bytes;try{bytes=await readPrivate(file,8192)}catch(e){if(e.code==='ENOENT')return null;throw e}
  try{
   const envelope=JSON.parse(bytes);if(envelope.version!==1||envelope.provider!==PROVIDER)throw Error();
   const iv=Buffer.from(envelope.iv,'base64'),tag=Buffer.from(envelope.tag,'base64'),data=Buffer.from(envelope.data,'base64');if(iv.length!==12||tag.length!==16||!data.length)throw Error();
   const cipher=createDecipheriv('aes-256-gcm',key,iv);cipher.setAAD(AAD);cipher.setAuthTag(tag);
   const clear=Buffer.concat([cipher.update(data),cipher.final()]);let record;
   try{record=JSON.parse(clear.toString())}finally{clear.fill(0)}
   if(!validApiKey(record.apiKey)||!['saved','verified','invalid','permissions_required','check_failed'].includes(record.verification?.status))throw Error();
   return record;
  }catch{fail('CONNECTION_STORAGE_INVALID')}
 }
 async function write(record){
  await checkedPath(directory,true);try{await readPrivate(file,8192)}catch(e){if(e.code!=='ENOENT')throw e}
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(AAD);
  const clear=Buffer.from(JSON.stringify(record)),data=Buffer.concat([cipher.update(clear),cipher.final()]);clear.fill(0);
  const bytes=JSON.stringify({version:1,provider:PROVIDER,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')});
  const tmp=path.join(directory,'.'+randomUUID()+'.tmp');const h=await fs.open(tmp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  try{await h.writeFile(bytes);await h.sync()}finally{await h.close()}
  try{await fs.rename(tmp,file);const dh=await fs.open(directory,constants.O_RDONLY);try{await dh.sync()}finally{await dh.close()}}finally{await fs.unlink(tmp).catch(()=>{})}
 }
 let tail=Promise.resolve();
 function locked(fn){const task=tail.then(async()=>{
  await checkedPath(directory,true);const lock=path.join(directory,'.connections.lock');let h;
  try{h=await fs.open(lock,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600)}catch(e){if(e.code==='EEXIST')fail('CONNECTION_BUSY');throw e}
  try{return await fn()}finally{await h.close();await fs.unlink(lock)}
 });tail=task.catch(()=>{});return task}
 // Refuse corrupt/unreadable records at startup instead of silently losing a saved key.
 await read();
 return Object.freeze({
  status:async()=>expose(await read()),
  save:apiKey=>locked(async()=>{
   if(!validApiKey(apiKey))fail('INVALID_API_KEY_FORMAT');const previous=await read();
   if(previous?.apiKey===apiKey)return expose(previous);
   const record={apiKey,createdAt:previous?.createdAt||now(),updatedAt:now(),verification:{status:'saved',checkedAt:null}};await write(record);return expose(record);
  }),
  verify:()=>locked(async()=>{
   const record=await read();if(!record)fail('CONNECTION_KEY_REQUIRED');let result;
   try{result=await verify(record.apiKey)}catch{result={status:'check_failed'}}
   const status=['verified','invalid','permissions_required'].includes(result?.status)?result.status:'check_failed';
   record.verification={status,checkedAt:now()};await write(record);return expose(record);
  })
 });
}
