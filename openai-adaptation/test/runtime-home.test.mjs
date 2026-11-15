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
 fs.writeFileSync(path.join(dir,'.sandbox_migration'),'v1\n');
 fs.writeFileSync(path.join(dir,'.sqlite-maintenance.lock'),'');
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
 test(`${name}: post-turn migration marker and SQLite maintenance lock survive restart validation`,t=>{
  const dir=home(t);
  const entries=['.sandbox_migration','.sqlite-maintenance.lock','auth.json','auth.json.lock','auth.lock','goals_1.sqlite','installation_id','logs_2.sqlite','logs_2.sqlite-shm','logs_2.sqlite-wal','memories_1.sqlite','models_cache.json','queue_1.sqlite','queue_1.sqlite-shm','queue_1.sqlite-wal','state_5.sqlite','state_5.sqlite-shm','state_5.sqlite-wal'];
  for(const file of entries)fs.writeFileSync(path.join(dir,file),file==='.sandbox_migration'?'v1\n':'synthetic-state');
  for(const folder of ['log','tmp','skills/.system'])fs.mkdirSync(path.join(dir,folder),{recursive:true});
  const before=fs.readdirSync(dir).sort();
  assert.equal(validate(dir),true);assert.equal(validate(dir),true);
  assert.deepEqual(fs.readdirSync(dir).sort(),before);
  assert.equal(fs.readFileSync(path.join(dir,'.sandbox_migration'),'utf8'),'v1\n');
  assert.equal(fs.readFileSync(path.join(dir,'auth.json'),'utf8'),'synthetic-state');
 });
 for(const entry of ['config.toml','AGENTS.md','plugins','unexpected.json','.sandbox_migration.toml','.sqlite-maintenance.lock.bak'])test(`${name}: official login state does not permit ${entry}`,t=>{
  const dir=home(t);fs.mkdirSync(path.join(dir,'log'));
  fs.writeFileSync(path.join(dir,'auth.lock'),'');fs.writeFileSync(path.join(dir,entry),'');
  assert.throws(()=>validate(dir),/HOME_NOT_CLEAN/);
 });
 test(`${name}: lock files and log directory cannot be symlinks or wrong types`,t=>{
  for(const entry of ['auth.json.lock','auth.lock','models_cache.json','.sandbox_migration','.sqlite-maintenance.lock','log','tmp']){
   const dir=home(t);const file=path.join(dir,entry);
   fs.symlinkSync('/tmp',file);
   assert.throws(()=>validate(dir),/HOME_SYMLINK_REJECTED/);fs.unlinkSync(file);
   if(['log','tmp'].includes(entry))fs.writeFileSync(file,'');else fs.mkdirSync(file);
   assert.throws(()=>validate(dir),/HOME_NOT_CLEAN/);
  }
 });
}
