// Account/catalog diagnostics only. Never starts a thread, turn or credit reset.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {launchIsolatedCodex} from '../codex/chatgpt-runtime.mjs';
import {attachStdio} from '../codex/stdio-transport.mjs';

const plans=new Set(['free','go','plus','pro','prolite','promax','team','self_serve_business_prolite','self_serve_business_usage_based','business','ent26','enterprise_cbp_automation','enterprise_cbp_usage_based','enterprise','edu','edu_plus','edu_pro','sci','sci_plus','unknown']);
const modelId=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(value)?value:null;
const bool=value=>typeof value==='boolean'?value:null;
const window=value=>value&&Number.isInteger(value.usedPercent)&&value.usedPercent>=0?{
 usedPercent:value.usedPercent,
 windowDurationMins:Number.isInteger(value.windowDurationMins)?value.windowDurationMins:null,
 resetsAt:Number.isInteger(value.resetsAt)?value.resetsAt:null
}:null;

export async function inspectAccount(rpc){
 await rpc.request('initialize',{clientInfo:{name:'office-account-check',version:'0.1.0'}});
 rpc.send({method:'initialized'});
 const account=await rpc.request('account/read',{refreshToken:false});
 if(account?.account?.type!=='chatgpt')throw Error('CHATGPT_ACCOUNT_REQUIRED');
 const [catalog,usage]=await Promise.allSettled([
  rpc.request('model/list',{limit:100,includeHidden:false}),
  rpc.request('account/rateLimits/read',{excludeResetCreditDetails:true,supportsLunaReserve:false})
 ]);
 const catalogRead=catalog.status==='fulfilled'&&Array.isArray(catalog.value?.data);
 const usageRead=usage.status==='fulfilled'&&usage.value!==null&&typeof usage.value==='object';
 const models=catalogRead?catalog.value.data.filter(m=>m&&!m.hidden&&modelId(m.model)).map(m=>({model:m.model,isDefault:m.isDefault===true})):[];
 const limits=usageRead?usage.value:null;
 return {
  ok:models.length>0&&limits!==null,
  accountKind:'chatgpt',plan:plans.has(account.account.planType)?account.account.planType:'unknown',
  models,defaultModel:models.find(m=>m.isDefault)?.model??null,
  modelsComplete:catalogRead&&!catalog.value?.nextCursor,
  usageQuerySucceeded:usageRead,ordinaryUsageAllowed:bool(limits?.ordinaryUsageAllowed),
  primary:window(limits?.rateLimits?.primary),secondary:window(limits?.rateLimits?.secondary),
  hasCredits:bool(limits?.rateLimits?.credits?.hasCredits),
  inferencePerformed:false,creditsRedeemed:false,officeConnected:false
 };
}

async function main(){
 let transport;
 const safeErrors=new Set(['CHATGPT_ACCOUNT_REQUIRED','HOME_NOT_CLEAN','HOME_SYMLINK_REJECTED','CUSTOM_SKILLS_NOT_ALLOWED','AUTH_SYMLINK_REJECTED','API_CREDENTIAL_REJECTED','OWNER_CHATGPT_LOGIN_REQUIRED','PRIVATE_AUTH_PERMISSIONS_REQUIRED','EMPTY_WORKSPACE_REQUIRED','RPC_TIMEOUT','RPC_REMOTE_ERROR','TRANSPORT_CLOSED']);
 try{
  const home='/home/node/codex-isolated';
  for(const name of [home,home+'/auth.json']){
   const stat=fs.lstatSync(name);
   if(stat.isSymbolicLink()||stat.uid!==process.getuid()||(stat.mode&0o077)!==0)throw Error('PRIVATE_AUTH_PERMISSIONS_REQUIRED');
  }
  const child=launchIsolatedCodex({binary:'/usr/local/bin/codex',home,workspace:'/home/node/empty-workspace',enabled:true,isolationVerified:true});
  transport=attachStdio(child,{timeoutMs:20000});
  const result=await inspectAccount(transport.rpc);
  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
 }catch(error){
  console.log(JSON.stringify({ok:false,error:safeErrors.has(error.message)?error.message:'ACCOUNT_CHECK_UNAVAILABLE',inferencePerformed:false,creditsRedeemed:false,officeConnected:false}));
  process.exitCode=1;
 }finally{transport?.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
