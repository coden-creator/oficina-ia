import {ChatGPTDraftRuntime,launchIsolatedCodex} from './chatgpt-runtime.mjs';
import {CodexOrganicSpecialist} from './organic-specialist.mjs';
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
 const legacy=new CodexVideoSpecialist({runtime}),organic=new CodexOrganicSpecialist({runtime});
 server=createSpecialistBroker({specialist:{status:()=>({...legacy.status(),workflows:['organic-v1']}),run:q=>q?.context?.workflow==='organic-v1'?organic.run(q):legacy.run(q)},refreshAccount:()=>runtime.adapter.checkAccount()});
 await listenPrivate(server,env.OFFICE_CODEX_SOCKET||'/run/office/codex.sock');
 console.log('Private specialist worker ready. Publishing and paid APIs disabled.');
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{runtime.close();server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),5000).unref();});
}catch(error){
 runtime?.close();server?.close();
 const codes=['OPERATOR_ENABLE_REQUIRED','API_KEYS_FORBIDDEN','MODEL_REQUIRED','WORKER_USER_REQUIRED','WORKER_NO_NEW_PRIVILEGES_REQUIRED','WORKER_CAPABILITIES_REQUIRED','WORKER_READ_ONLY_ROOT_REQUIRED','WORKER_CPU_LIMIT_REQUIRED','WORKER_MEMORY_LIMIT_REQUIRED','WORKER_PIDS_LIMIT_REQUIRED','WORKER_RESOURCE_LIMITS_UNAVAILABLE','WORKER_PRIVATE_DIRECTORIES_REQUIRED','WORKER_PRIVATE_AUTH_REQUIRED','ABSOLUTE_PATHS_REQUIRED','ISOLATED_HOME_REQUIRED','HOME_NOT_CLEAN','HOME_SYMLINK_REJECTED','CUSTOM_SKILLS_NOT_ALLOWED','OWNER_CHATGPT_LOGIN_REQUIRED','AUTH_SYMLINK_REJECTED','API_CREDENTIAL_REJECTED','ISOLATED_WORKSPACE_REQUIRED','EMPTY_WORKSPACE_REQUIRED','HOST_ISOLATION_NOT_VERIFIED','EXPLICIT_OPERATOR_ENABLE_REQUIRED','CHATGPT_CONNECTION_UNAVAILABLE','ABSOLUTE_SOCKET_REQUIRED','SOCKET_DIRECTORY_SYMLINK','PRIVATE_SOCKET_DIRECTORY_REQUIRED'];
 const code=codes.includes(error?.message)?error.message:error?.code==='EADDRINUSE'?'PRIVATE_SOCKET_IN_USE':'WORKER_STARTUP_FAILED';
 console.error(JSON.stringify({ready:false,error:code}));process.exitCode=1;
}
