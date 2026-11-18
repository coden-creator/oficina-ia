import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {createConnectionStore} from './store.mjs';
import {createElevenLabsVerifier} from './elevenlabs.mjs';
import {createOriginalShell} from '../server.mjs';
const KEY='synthetic_test_key_not_a_real_credential';
async function fixture(t,verify=async()=>({status:'verified'})){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'office-connection-test-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const directory=path.join(root,'data'),keyFile=path.join(root,'master');await fs.mkdir(directory,{mode:0o700});await fs.writeFile(keyFile,randomBytes(32),{mode:0o600});
 const options={directory,keyFile,verify};return {...options,options,store:await createConnectionStore(options)};
}
test('encrypted key persists across server instances; status never returns credential or identity',async t=>{
 const f=await fixture(t);assert.equal((await f.store.status()).configured,false);await f.store.save(KEY);await f.store.verify();
 const bytes=await fs.readFile(path.join(f.directory,'elevenlabs.json'),'utf8');assert.ok(!bytes.includes(KEY));assert.ok(!bytes.includes('verified'));
 const state=await(await createConnectionStore(f.options)).status();assert.equal(state.status,'verified');assert.equal(state.generationEnabled,false);assert.ok(!JSON.stringify(state).includes(KEY));assert.equal((await fs.stat(path.join(f.directory,'elevenlabs.json'))).mode&0o777,0o600);
});
test('replacement resets verification and a queued verification cannot mark the replacement as verified',async t=>{
 let ready,release;const entered=new Promise(r=>ready=r),pause=new Promise(r=>release=r);const f=await fixture(t,async key=>{assert.equal(key,KEY);ready();await pause;return {status:'verified'}});
 await f.store.save(KEY);const check=f.store.verify();await entered;const replacement=f.store.save(KEY+'_replacement');release();await check;await replacement;assert.equal((await f.store.status()).status,'saved');assert.equal((await f.store.status()).checkedAt,null);
});
test('provider failures are redacted; invalid/permission outcomes remain useful',async t=>{
 for(const status of ['invalid','permissions_required','check_failed']){const f=await fixture(t,async()=>({status,private:KEY}));await f.store.save(KEY);const result=await f.store.verify();assert.equal(result.status,status);assert.ok(!JSON.stringify(result).includes(KEY))}
 const f=await fixture(t,async()=>{throw Error(KEY)});await f.store.save(KEY);assert.equal((await f.store.verify()).status,'check_failed');
});
test('wrong master key, tampering, permissive storage and symlinks are refused without returning contents',async t=>{
 const f=await fixture(t);await f.store.save(KEY);const file=path.join(f.directory,'elevenlabs.json');
 await fs.writeFile(f.keyFile,randomBytes(32));await assert.rejects(createConnectionStore(f.options),/CONNECTION_STORAGE_INVALID/);
 await fs.writeFile(file,JSON.stringify({version:1,provider:'elevenlabs',data:KEY}));await assert.rejects(f.store.status(),/CONNECTION_STORAGE_INVALID/);
 await fs.chmod(f.directory,0o755);await assert.rejects(createConnectionStore(f.options),/CONNECTION_STORAGE_UNSAFE/);await fs.chmod(f.directory,0o700);
 await fs.unlink(file);await fs.symlink(f.keyFile,file);await assert.rejects(f.store.status(),/CONNECTION_STORAGE_UNSAFE/);
});
test('second instance cannot race an active verification; no lost key replacement',async t=>{
 let ready,release;const entered=new Promise(r=>ready=r),pause=new Promise(r=>release=r);const f=await fixture(t,async()=>{ready();await pause;return {status:'verified'}});const other=await createConnectionStore(f.options);
 await f.store.save(KEY);const verify=f.store.verify();await entered;await assert.rejects(other.save(KEY+'_new'),/CONNECTION_BUSY/);release();await verify;assert.equal((await other.status()).status,'verified');
});
test('ElevenLabs verifier only calls the fixed read-only endpoint and exposes no user data',async()=>{
 let calls=0;const verify=createElevenLabsVerifier({fetchImpl:async(url,opts)=>{calls++;assert.equal(url,'https://api.elevenlabs.io/v1/user');assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');assert.equal(opts.headers['xi-api-key'],KEY);assert.equal(opts.body,undefined);return new Response(JSON.stringify({user_id:'private-user',email:'private@example.test'}))}});
 assert.deepEqual(await verify(KEY),{status:'verified'});assert.equal(calls,1);
 for(const [status,expected] of [[401,'invalid'],[403,'permissions_required'],[429,'check_failed'],[500,'check_failed']])assert.deepEqual(await createElevenLabsVerifier({fetchImpl:async()=>new Response(KEY,{status})})(KEY),{status:expected});
 for(const body of ['invalid JSON',JSON.stringify({user_id:'x'.repeat(65536)}),'{}'])assert.deepEqual(await createElevenLabsVerifier({fetchImpl:async()=>new Response(body)})(KEY),{status:'check_failed'});
});
async function server(t,store){const origin='https://office.test',password='synthetic-local-password';const app=createOriginalShell({origin,password,connectionStore:store});await new Promise(r=>app.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>app.close(r)));
 const request=(route,{method='GET',headers={},body}={})=>new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port:app.address().port,path:route,method,headers:{Host:'office.test',Authorization:'Basic '+Buffer.from('jorge:'+password).toString('base64'),...headers}},res=>{let text='';res.on('data',x=>text+=x);res.on('end',()=>resolve({status:res.statusCode,text,data:JSON.parse(text)}))});req.on('error',reject);req.end(body===undefined?undefined:JSON.stringify(body))});return {origin,request};}
test('key HTTP routes enforce authentication, host, origin, CSRF, exact body and never echo key',async t=>{
 const f=await fixture(t),{request,origin}=await server(t,f.store),route='/api/connections/elevenlabs';
 assert.equal((await request('/api/connections',{headers:{Authorization:''}})).status,401);assert.equal((await request('/api/connections',{headers:{Host:'other.test'}})).status,403);
 const state=await request('/api/connections');assert.equal(state.data.available,true);
 const headers={'Content-Type':'application/json',Origin:origin,'X-Office-CSRF':state.data.csrfToken};
 for(const overrides of [{Origin:''},{Origin:'https://attacker.test'},{'X-Office-CSRF':'bad'},{'Sec-Fetch-Site':'cross-site'}])assert.equal((await request(route,{method:'POST',headers:{...headers,...overrides},body:{apiKey:KEY}})).status,403);
 assert.equal((await request(route,{method:'POST',headers,body:{apiKey:KEY,enabled:true}})).status,400);
 assert.equal((await request(route,{method:'POST',headers,body:{apiKey:'x'.repeat(2100)}})).status,413);
 const saved=await request(route,{method:'POST',headers,body:{apiKey:KEY}});assert.equal(saved.status,200);assert.equal(saved.data.elevenlabs.status,'saved');assert.ok(!saved.text.includes(KEY));
 const verified=await request(route+'/verify',{method:'POST',headers,body:{}});assert.equal(verified.data.elevenlabs.status,'verified');assert.ok(!verified.text.includes(KEY));
 assert.equal((await request(route+'/synthesize',{method:'POST',headers,body:{text:'Never generate'}})).status,404);
});
test('absent private storage is displayed as unavailable',async t=>{const {request}=await server(t,null);const result=await request('/api/connections');assert.equal(result.data.available,false);assert.equal(result.data.csrfToken,null)});
