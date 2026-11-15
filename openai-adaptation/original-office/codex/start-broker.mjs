import {ChatGPTDraftRuntime,launchIsolatedCodex} from './chatgpt-runtime.mjs';
import {CodexVideoSpecialist} from './video-specialist.mjs';
import {createSpecialistBroker,listenPrivate} from './broker.mjs';
import {checkWorkerIsolation} from './worker-isolation.mjs';
const env=process.env;
let runtime,server;
try{
 if(env.OFFICE_CODEX_ENABLE!=='1'||env.OFFICE_CODEX_ISOLATION_VERIFIED!=='1')throw Error('OPERATOR_ENABLE_REQUIRED');
 if(['OPENAI_API_KEY','ANTHROPIC_API_KEY','OPENROUTER_API_KEY','AZURE_OPENAI_API_KEY'].some(k=>env[k]))throw Error('API_KEYS_FORBIDDEN');
 if(!env.OFFICE_CODEX_MODEL)throw Error('MODEL_REQUIRED');
 checkWorkerIsolation();
 runtime=new ChatGPTDraftRuntime({workspace:'/home/node/empty-workspace',model:env.OFFICE_CODEX_MODEL,childFactory:()=>launchIsolatedCodex({binary:'/usr/local/bin/codex',home:'/home/node/codex-isolated',workspace:'/home/node/empty-workspace',enabled:true,isolationVerified:true})});
 await runtime.connect();
 server=createSpecialistBroker({specialist:new CodexVideoSpecialist({runtime}),refreshAccount:()=>runtime.adapter.checkAccount()});
 await listenPrivate(server,env.OFFICE_CODEX_SOCKET||'/run/office/codex.sock');
 console.log('Private specialist worker ready. Publishing and paid APIs disabled.');
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{runtime.close();server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),5000).unref();});
}catch{runtime?.close();server?.close();console.error('Private worker unavailable. Verify isolation, official owner login, model and private socket directory.');process.exitCode=1;}
