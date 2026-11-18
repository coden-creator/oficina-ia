import test from 'node:test';
import assert from 'node:assert/strict';
import { AppServerClient, OfficeAdapter, checkResources } from '../src/adapter.mjs';
function fixture(account = 'chatgpt') {
  const sent = []; let rpc;
  rpc = new AppServerClient(m => { sent.push(m); if (!m.method || m.id === undefined) return;
    const result = m.method === 'account/read' ? { account: { type: account } } : m.method === 'account/rateLimits/read' ? {ordinaryUsageAllowed:true} : m.method === 'thread/start' ? {thread:{id:'t1'}} : {turn:{id:'u1'}};
    queueMicrotask(() => rpc.receive({id:m.id,result}));
  });
  const adapter = new OfficeAdapter(rpc,{workspace:'/tmp/isolated-office',model:'test-model'}); return {rpc,adapter,sent};
}
test('initialization handshake precedes account check',async()=>{const f=fixture();await f.adapter.initialize();assert.deepEqual(f.sent.map(m=>m.method),['initialize','initialized','account/read']);f.rpc.close();});
for (const type of ['apiKey','amazonBedrock','gcp',null]) test(`reject account ${type}`,async()=>{const f=fixture(type);await assert.rejects(f.adapter.initialize(),/CHATGPT_LOGIN/);assert.equal(f.adapter.ready,false);f.rpc.close();});
test('thread fails before initialization',async()=>{const f=fixture();await assert.rejects(f.adapter.startThread(),/NOT_INITIALIZED/);f.rpc.close();});
test('start thread and text turn with read-only settings',async()=>{const f=fixture();await f.adapter.initialize();const id=await f.adapter.startThread({instructions:'Internal test'});await f.adapter.startTurn(id,'hello');const request=f.sent.find(m=>m.method==='thread/start');assert.equal(request.params.sandbox,'read-only');assert.equal(request.params.modelProvider,'openai');assert.equal(request.params.approvalPolicy,'untrusted');assert.equal(f.sent.filter(m=>m.method==='account/read').length,3);await f.adapter.interrupt(id,'u1');f.rpc.close();});
test('reject SDK options instead of silently dropping permissions',async()=>{const f=fixture();await f.adapter.initialize();await assert.rejects(f.adapter.startThread({mcpServers:{}}),/UNSUPPORTED/);f.rpc.close();});
test('unknown thread rejected',async()=>{const f=fixture();await assert.rejects(f.adapter.startTurn('foreign','hello'),/UNKNOWN_THREAD/);f.rpc.close();});
test('empty input rejected',async()=>{const f=fixture();await f.adapter.initialize();await f.adapter.startThread();await assert.rejects(f.adapter.startTurn('t1',' '),/TEXT_REQUIRED/);f.rpc.close();});
for(const key of ['OPENAI_API_KEY','ANTHROPIC_API_KEY','OPENROUTER_API_KEY','AZURE_OPENAI_API_KEY']) test(`reject ${key}`,()=>assert.throws(()=>new OfficeAdapter({}, {workspace:'/tmp/x',model:'x',env:{[key]:'test'}}),/PAID_CREDENTIAL/));
test('reject relative workspace',()=>assert.throws(()=>new OfficeAdapter({}, {workspace:'x',model:'x'}),/ABSOLUTE/));
test('reject Claude model',()=>assert.throws(()=>new OfficeAdapter({}, {workspace:'/tmp/x',model:'claude-sonnet'}),/EXPLICIT/));
test('server request cannot invoke a tool',()=>{const f=fixture();f.rpc.receive({id:9,method:'item/tool/call',params:{}});assert.equal(f.sent[0].error.code,-32601);f.rpc.close();});
test('timeout clears pending map',async()=>{const r=new AppServerClient(()=>{}, {timeoutMs:5});await assert.rejects(r.request('test'),/RPC_TIMEOUT/);assert.equal(r.pending.size,0);r.close();});
test('close rejects pending and new requests',async()=>{const r=new AppServerClient(()=>{});const p=r.request('test');r.close();await assert.rejects(p,/TRANSPORT_CLOSED/);await assert.rejects(r.request('test'),/TRANSPORT_CLOSED/);});
test('remote errors are redacted',async()=>{let r;r=new AppServerClient(m=>queueMicrotask(()=>r.receive({id:m.id,error:{message:'secret'}})));await assert.rejects(r.request('test'),e=>e.message==='RPC_REMOTE_ERROR');r.close();});
test('send failure clears pending',async()=>{const r=new AppServerClient(()=>{throw new Error('private')});await assert.rejects(r.request('test'),/TRANSPORT_SEND_FAILED/);assert.equal(r.pending.size,0);r.close();});
test('resource caps use minimum including 70%',()=>{assert.equal(checkResources({hostCpu:8,hostMemoryBytes:25e9,cpu:5,memoryBytes:17e9}),true);assert.throws(()=>checkResources({hostCpu:8,hostMemoryBytes:25e9,cpu:5,memoryBytes:20e9}),/EXCEEDED/);assert.throws(()=>checkResources({hostCpu:4,hostMemoryBytes:25e9,cpu:5,memoryBytes:17e9}),/EXCEEDED/);});
