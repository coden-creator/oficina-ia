// Offline diagnostic only: synthetic model server on loopback; never use real credentials.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {DISABLED_FEATURES,textOnlyArgs} from '../codex/text-only-config.mjs';
import {attachStdio} from '../codex/stdio-transport.mjs';
const binary=process.argv[2];
if(!path.isAbsolute(binary||''))throw Error('ABSOLUTE_BINARY_REQUIRED');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'office-tool-probe-'));
const home=path.join(dir,'home'),work=path.join(dir,'work');fs.mkdirSync(home,{mode:0o700});fs.mkdirSync(work,{mode:0o700});
let inventory=null,requests=0,child,diagnostic='';
const server=http.createServer((req,res)=>{
 if(req.method!=='POST'||!req.url?.endsWith('/responses')){res.writeHead(404);res.end();return;}
 let body='';req.setEncoding('utf8');req.on('data',s=>{body+=s;if(body.length>2_000_000)req.destroy();});req.on('end',()=>{
  try{const data=JSON.parse(body);if(!Array.isArray(data.tools))throw Error('TOOLS_LIST_MISSING');requests++;inventory=[...new Set([...(inventory||[]),...data.tools.map(t=>t.name||t.function?.name||t.type||'unknown')])];
   const item={id:'msg_test',type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:'Prueba local completada.',annotations:[]}]};
   const response={id:'resp_test',object:'response',created_at:1,status:'completed',model:'synthetic',output:[item],parallel_tool_calls:false,usage:{input_tokens:1,output_tokens:1,total_tokens:2}};
   res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'});
   for(const [type,payload] of [['response.created',{response:{...response,status:'in_progress',output:[]}}],['response.output_item.added',{output_index:0,item:{...item,status:'in_progress',content:[]}}],['response.output_text.delta',{item_id:'msg_test',output_index:0,content_index:0,delta:'Prueba local completada.'}],['response.output_item.done',{output_index:0,item}],['response.completed',{response}]])res.write(`event: ${type}\ndata: ${JSON.stringify({type,...payload})}\n\n`);
   res.end();
  }catch{res.writeHead(400);res.end();}
 });
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
 const port=server.address().port;
 const args=['exec','--skip-git-repo-check','--ephemeral','--sandbox','read-only','-C',work,'-m','synthetic','-c','model_provider="synthetic"','-c','model_providers.synthetic.name="Synthetic offline test"','-c',`model_providers.synthetic.base_url="http://127.0.0.1:${port}/v1"`,'-c','model_providers.synthetic.wire_api="responses"','-c','model_providers.synthetic.env_key="SYNTHETIC_TEST_KEY"','-c','web_search="disabled"',...DISABLED_FEATURES.flatMap(f=>['--disable',f]),'Responde con texto de prueba.'];
 let code;
 if(process.argv[3]==='--app-server'){
  const config=['-c','model_provider="synthetic"','-c','model_providers.synthetic.name="Synthetic offline test"','-c',`model_providers.synthetic.base_url="http://127.0.0.1:${port}/v1"`,'-c','model_providers.synthetic.wire_api="responses"','-c','model_providers.synthetic.env_key="SYNTHETIC_TEST_KEY"'];
  child=spawn(binary,[...textOnlyArgs(),...config],{cwd:work,env:{HOME:home,CODEX_HOME:home,PATH:path.dirname(binary),LANG:'C.UTF-8',SYNTHETIC_TEST_KEY:'test-only-not-a-secret'},stdio:['pipe','pipe','pipe']});
  const transport=attachStdio(child,{timeoutMs:12000});
  try{
   await transport.rpc.request('initialize',{clientInfo:{name:'office-offline-inventory',version:'0.1.0'}});transport.rpc.send({method:'initialized'});
   const started=await transport.rpc.request('thread/start',{cwd:work,model:'synthetic',modelProvider:'synthetic',approvalPolicy:'untrusted',sandbox:'read-only',ephemeral:true});
   const finished=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('TURN_TIMEOUT')),20000);transport.rpc.on('notification',m=>{if(m.method==='turn/completed'&&m.params?.threadId===started.thread.id){clearTimeout(timer);resolve(m.params.turn.status);}});});
   await transport.rpc.request('turn/start',{threadId:started.thread.id,input:[{type:'text',text:'Responde con texto de prueba.'}]});
   code=(await finished)==='completed'?0:1;
  }catch(e){diagnostic=e.message;code=1;}finally{transport.close();}
 }else code=await new Promise(resolve=>{child=spawn(binary,args,{cwd:work,env:{HOME:home,CODEX_HOME:home,PATH:path.dirname(binary),LANG:'C.UTF-8',SYNTHETIC_TEST_KEY:'test-only-not-a-secret'},stdio:['ignore','pipe','pipe']});let timer=setTimeout(()=>child.kill('SIGKILL'),30000);child.stderr.on('data',b=>{diagnostic=(diagnostic+b.toString()).slice(-4000);});child.on('error',()=>{clearTimeout(timer);resolve(null);});child.on('close',c=>{clearTimeout(timer);resolve(c);});});
 // This text-only worker has no approved model tools. Unknown or newly added
 // tools must fail closed, including view_image and request_user_input.
 const forbidden=[...(inventory||[])];
 const passed=code===0&&requests>0&&forbidden.length===0;
 console.log(JSON.stringify({passed,exitCode:code,syntheticRequests:requests,announcedTools:inventory,forbiddenTools:forbidden,authUsed:false,realInference:false,adversarialIsolationVerified:false,...(!requests?{diagnostic:diagnostic.slice(-1200)}:{})}));
 if(!passed)process.exitCode=1;
}finally{child?.kill();server.close();fs.rmSync(dir,{recursive:true,force:true});}
