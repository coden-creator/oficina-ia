// Private Unix-socket protocol: fixed specialist operations, never arbitrary RPC.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
export const disconnected=()=>({connected:false,inferenceVerified:false,paidApiEnabled:false,publishingEnabled:false,researchCoverage:'supplied-evidence-only'});
export function createSpecialistBroker({specialist,refreshAccount=async()=>{}}){
 let busy=false;
 const server=http.createServer(async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try{
   if(req.method==='GET'&&req.url==='/status'){
    await refreshAccount();const s=specialist.status();
    return send(200,{...disconnected(),connected:s.connected===true&&s.paidApiEnabled===false&&s.publishingEnabled===false,inferenceVerified:s.inferenceVerified===true,workflows:Array.isArray(s.workflows)?s.workflows.filter(w=>w==='organic-v1'):[],busy,model:s.model||null,reasoning:s.reasoning||null});
   }
   if(req.method!=='POST'||req.url!=='/run')return send(404,{error:'NOT_FOUND'});
   if(req.headers['content-type']!=='application/json')return send(415,{error:'JSON_REQUIRED'});
   if(busy)return send(409,{error:'CODEX_BUSY'});
   busy=true;
   try{
    let bytes=0,body='';for await(const b of req){bytes+=b.length;if(bytes>4300000)return send(413,{error:'REQUEST_TOO_LARGE'});body+=b;}
    const q=JSON.parse(body);
    if(!q||typeof q!=='object'||Array.isArray(q)||Object.keys(q).some(k=>!['brand','stage','jobId','prompt','input','context','images'].includes(k)))return send(400,{error:'INVALID_REQUEST'});
    await refreshAccount();const s=specialist.status();
    if(!s.connected||s.paidApiEnabled!==false||s.publishingEnabled!==false)return send(503,{error:'CODEX_NOT_CONNECTED'});
    const result=await specialist.run(q);
    return send(200,result);
   }finally{busy=false;}
  }catch{return send(503,{error:'CODEX_REQUEST_FAILED'});}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;
 return server;
}
export async function listenPrivate(server,socketPath){
 if(!path.isAbsolute(socketPath||''))throw Error('ABSOLUTE_SOCKET_REQUIRED');
 const dir=path.dirname(socketPath);
 if(await fs.realpath(dir)!==dir)throw Error('SOCKET_DIRECTORY_SYMLINK');
 const st=await fs.stat(dir);
 if(st.uid!==process.getuid()||(st.mode&0o077)!==0)throw Error('PRIVATE_SOCKET_DIRECTORY_REQUIRED');
 // Never unlink an existing socket automatically: it may belong to a live worker.
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(socketPath,resolve);});
 await fs.chmod(socketPath,0o600);
}
