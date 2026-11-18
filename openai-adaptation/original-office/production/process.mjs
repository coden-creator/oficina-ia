import {spawn} from 'node:child_process';
// Processes receive only rendering settings, never office passwords or connector keys.
export function runProcess(bin,args,{timeoutMs=900000}={}){return new Promise((resolve,reject)=>{
 const child=spawn(bin,args,{detached:true,shell:false,stdio:['ignore','pipe','pipe'],env:{PATH:'/usr/local/bin:/usr/bin:/bin',HOME:'/tmp',LANG:'C.UTF-8',NODE_PATH:process.env.NODE_PATH||'',RAYON_NUM_THREADS:'1',UV_THREADPOOL_SIZE:'1'}});let out='',err='',bytes=0,reason=null;
 const kill=()=>{try{process.kill(-child.pid,'SIGKILL')}catch{}};const timer=setTimeout(()=>{reason='PRODUCTION_TIMEOUT';kill()},timeoutMs);
 child.stdout.on('data',b=>{bytes+=b.length;if(bytes>2*1024*1024){reason='PRODUCTION_OUTPUT_LIMIT';kill()}else out+=b;});child.stderr.on('data',b=>{err=(err+b).slice(-32768)});
 child.once('error',()=>{reason='PRODUCTION_PROCESS_UNAVAILABLE'});child.once('close',code=>{clearTimeout(timer);kill();reason||=code!==0?'PRODUCTION_PROCESS_FAILED':null;reason?reject(Object.assign(Error(reason),{diagnostic:err})):resolve({stdout:out,stderr:err});});
 });}
