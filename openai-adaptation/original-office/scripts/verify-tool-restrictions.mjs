// Configuration gate only, NOT a replacement for adversarial tool inventory testing.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {DISABLED_FEATURES} from '../codex/text-only-config.mjs';
const binary=process.argv[2];if(!path.isAbsolute(binary||''))throw Error('ABSOLUTE_BINARY_REQUIRED');
const home=fs.mkdtempSync(path.join(os.tmpdir(),'office-tools-gate-'));
try{
 const r=spawnSync(binary,['features','list',...DISABLED_FEATURES.flatMap(f=>['--disable',f])],{env:{HOME:home,CODEX_HOME:home,PATH:path.dirname(binary),LANG:'C.UTF-8'},encoding:'utf8',timeout:15000});
 if(r.error||r.status!==0){
  // Never report an empty feature list as evidence of disabled features.
  // Keep stderr private: it can contain paths or environment details.
  console.log(JSON.stringify({configurationGatePassed:false,reason:'CODEX_FEATURE_QUERY_FAILED',errorCode:r.error?.code??null,exitStatus:r.status,authAttempted:false,inferenceAttempted:false,adversarialToolIsolationVerified:false}));
  process.exitCode=1;
 }else{
 const observed=new Map();for(const line of (r.stdout||'').split('\n')){const m=/^(\S+)\s+.*\s+(true|false)\s*$/.exec(line);if(m)observed.set(m[1],m[2]==='true');}
 const enabledOrMissing=DISABLED_FEATURES.filter(f=>observed.get(f)!==false);
 console.log(JSON.stringify({configurationGatePassed:r.status===0&&enabledOrMissing.length===0,enabledOrMissing,authAttempted:false,inferenceAttempted:false,adversarialToolIsolationVerified:false}));
 if(r.status!==0||enabledOrMissing.length)process.exitCode=1;
 }
}finally{fs.rmSync(home,{recursive:true,force:true});}
