import http from 'node:http';
import path from 'node:path';
const offline=()=>({connected:false,inferenceVerified:false,paidApiEnabled:false,publishingEnabled:false});
export function createRemoteRunner({socketPath,timeoutMs=90000}){
 if(!path.isAbsolute(socketPath||''))throw Error('ABSOLUTE_SOCKET_REQUIRED');
 let state=offline(),observedAt=0;
 const request=(route,body)=>new Promise((resolve,reject)=>{
  const req=http.request({socketPath,path:route,method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json'}},res=>{
   let result='',size=0;
   res.on('data',b=>{size+=b.length;if(size>150000)req.destroy(Error('CODEX_RESPONSE_TOO_LARGE'));else result+=b;});
   res.on('error',reject);res.on('end',()=>{try{if(res.statusCode!==200)throw Error('CODEX_UNAVAILABLE');resolve(JSON.parse(result));}catch{reject(Error('CODEX_UNAVAILABLE'));}});
  });
  const timer=setTimeout(()=>req.destroy(Error('CODEX_TIMEOUT')),route==='/status'?Math.min(timeoutMs,3000):timeoutMs);req.on('close',()=>clearTimeout(timer));req.on('error',reject);
  req.end(body===undefined?undefined:JSON.stringify(body));
 });
 const refresh=async()=>{try{const s=await request('/status');state={...offline(),connected:s.connected===true&&s.paidApiEnabled===false&&s.publishingEnabled===false,inferenceVerified:s.inferenceVerified===true};observedAt=Date.now();}catch{state=offline();observedAt=0;}return state;};
 return {status:()=>Date.now()-observedAt<10000?{...state}:offline(),refresh,async run(q){
  if(!(await refresh()).connected)return {status:'blocked',reason:'CHATGPT_OWNER_CONNECTION_REQUIRED'};
  try{return await request('/run',q);}catch{state=offline();return {status:'blocked',reason:'CODEX_CONNECTION_UNAVAILABLE'};}
 }};
}
