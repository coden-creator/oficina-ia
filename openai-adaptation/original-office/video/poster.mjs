import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';

// Called only after the HTTP boundary verifies the stored MP4, brand, version
// and digest. Cache derivatives beside that version; never rewrite the video.
export function createPosterRenderer(){
 let tail=Promise.resolve();const pending=new Map();
 async function read(file){try{const s=await fs.lstat(file);if(!s.isFile()||s.isSymbolicLink()||s.size>512000)throw Error('INVALID_POSTER');return await fs.readFile(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 function extract(file){return new Promise((resolve,reject)=>{
  const child=spawn('/usr/bin/ffmpeg',['-v','error','-nostdin','-threads','1','-ss','0.5','-i',file,'-frames:v','1','-an','-vf','scale=360:640:force_original_aspect_ratio=decrease,pad=360:640:(ow-iw)/2:(oh-ih)/2:color=0x11141b','-threads','1','-q:v','3','-f','image2pipe','-vcodec','mjpeg','pipe:1'],{shell:false,stdio:['ignore','pipe','ignore'],env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8'}});
  const chunks=[];let size=0;const timer=setTimeout(()=>child.kill('SIGKILL'),20000);
  child.stdout.on('data',b=>{size+=b.length;if(size>512000)child.kill('SIGKILL');else chunks.push(b);});
  child.once('error',()=>{clearTimeout(timer);reject(Error('POSTER_UNAVAILABLE'));});
  child.once('close',code=>{clearTimeout(timer);const b=Buffer.concat(chunks);if(code!==0||size>512000||b[0]!==255||b[1]!==216)return reject(Error('POSTER_UNAVAILABLE'));resolve(b);});
 });}
 return async({root,file,sha256})=>{
  if(!/^[a-f0-9]{64}$/.test(sha256))throw Error('INVALID_MEDIA_HASH');
  const cache=path.join(root,`poster-${sha256}.jpg`);if(pending.has(cache))return pending.get(cache);
  const task=tail.then(async()=>{const existing=await read(cache);if(existing)return existing;const bytes=await extract(file);await fs.writeFile(cache,bytes,{flag:'wx',mode:0o600});return bytes;});
  pending.set(cache,task);tail=task.catch(()=>{});try{return await task;}finally{pending.delete(cache);}
 };
}
