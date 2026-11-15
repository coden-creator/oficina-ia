import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateRuntimeHomeEntries as packaged,launchIsolatedCodex,ChatGPTDraftRuntime} from '../original-office/codex/chatgpt-runtime.mjs';

function home(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'office-home-test-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 return dir;
}
test('packaged connection preserves only allowlisted local startup diagnostics',async()=>{
 for(const [message,expected] of [['HOME_NOT_CLEAN','HOME_NOT_CLEAN'],['HOST_ISOLATION_NOT_VERIFIED','HOST_ISOLATION_NOT_VERIFIED'],['private-token /private/path','CHATGPT_CONNECTION_UNAVAILABLE']]){
  const runtime=new ChatGPTDraftRuntime({workspace:'/tmp/fixture-only',model:'fixture',childFactory:()=>{throw Error(message);}});
  await assert.rejects(runtime.connect(),error=>error.message===expected);
  assert.equal(runtime.status().transportConnected,false);
 }
});
test('packaged runtime still refuses to launch without verified isolation after official login files exist',t=>{
 const dir=home(t),workspace=home(t);
 fs.writeFileSync(path.join(dir,'auth.json'),'{}');
 fs.writeFileSync(path.join(dir,'auth.lock'),'');
 fs.mkdirSync(path.join(dir,'log'));fs.mkdirSync(path.join(dir,'tmp'));
 assert.throws(()=>launchIsolatedCodex({binary:process.execPath,home:dir,workspace,enabled:true}),/HOST_ISOLATION_NOT_VERIFIED/);
});
for(const [name,validate] of [['packaged',packaged]]){
 test(`${name}: official login locks and log directory are accepted without modifying files`,t=>{
  const dir=home(t);fs.mkdirSync(path.join(dir,'log'));fs.mkdirSync(path.join(dir,'tmp'));
  fs.writeFileSync(path.join(dir,'log','codex-login.log'),'synthetic-log');
  fs.writeFileSync(path.join(dir,'auth.json'),'synthetic-session');
  fs.writeFileSync(path.join(dir,'models_cache.json'),'{}');
  for(const file of ['auth.json.lock','auth.lock'])fs.writeFileSync(path.join(dir,file),'');
  assert.equal(validate(dir),true);
  assert.equal(fs.readFileSync(path.join(dir,'auth.json'),'utf8'),'synthetic-session');
  assert.equal(fs.readFileSync(path.join(dir,'log','codex-login.log'),'utf8'),'synthetic-log');
 });
 for(const entry of ['config.toml','AGENTS.md','plugins','unexpected.json'])test(`${name}: official login state does not permit ${entry}`,t=>{
  const dir=home(t);fs.mkdirSync(path.join(dir,'log'));
  fs.writeFileSync(path.join(dir,'auth.lock'),'');fs.writeFileSync(path.join(dir,entry),'');
  assert.throws(()=>validate(dir),/HOME_NOT_CLEAN/);
 });
 test(`${name}: lock files and log directory cannot be symlinks or wrong types`,t=>{
  for(const entry of ['auth.json.lock','auth.lock','models_cache.json','log','tmp']){
   const dir=home(t);const file=path.join(dir,entry);
   fs.symlinkSync('/tmp',file);
   assert.throws(()=>validate(dir),/HOME_SYMLINK_REJECTED/);fs.unlinkSync(file);
   if(['log','tmp'].includes(entry))fs.writeFileSync(file,'');else fs.mkdirSync(file);
   assert.throws(()=>validate(dir),/HOME_NOT_CLEAN/);
  }
 });
}
