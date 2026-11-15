import test from 'node:test';
import assert from 'node:assert/strict';
import {OfficeAdapter as ManualAdapter} from '../src/adapter.mjs';
import {OfficeAdapter as PackagedAdapter} from '../original-office/codex/adapter.mjs';
import {inspectAccount} from '../original-office/scripts/check-codex-account.mjs';

function client(usage){
 const calls=[];
 return {calls,send(message){calls.push(message);},async request(method,params){
  calls.push({method,params});
  if(method==='account/read')return {account:{type:'chatgpt',planType:'plus',email:'private@example.invalid'}};
  if(method==='thread/start')return {thread:{id:'fixture-thread'}};
  if(method==='turn/start')return {turn:{id:'fixture-turn'}};
  if(method==='account/rateLimits/read')return typeof usage==='function'?usage():usage;
  if(method==='model/list')return {data:[{model:'fixture-model',isDefault:true,description:'private-extra'},{model:'hidden-model',hidden:true}],nextCursor:null};
  if(method==='initialize')return {};
  throw Error('Unexpected RPC method: '+method);
 }};
}

for(const [name,Adapter] of [['manual',ManualAdapter],['packaged',PackagedAdapter]]){
 for(const allowed of [false,null,undefined,'true'])test(`${name}: no turn when included usage is ${String(allowed)}, even with credits`,async()=>{
  const rpc=client({ordinaryUsageAllowed:allowed,rateLimits:{primary:{usedPercent:0},credits:{hasCredits:true,balance:'1000'}}});
  const adapter=new Adapter(rpc,{workspace:'/tmp/fixture',model:'fixture-model'});
  await adapter.initialize();const thread=await adapter.startThread();
  await assert.rejects(adapter.startTurn(thread,'Fixture text'),/INCLUDED_USAGE_NOT_CONFIRMED/);
  assert.equal(rpc.calls.some(c=>c.method==='turn/start'),false);
 });
 test(`${name}: included allowance rechecked before every turn`,async()=>{
  let allowed=true;
  const rpc=client(()=>({ordinaryUsageAllowed:allowed}));
  const adapter=new Adapter(rpc,{workspace:'/tmp/fixture',model:'fixture-model'});
  await adapter.initialize();const thread=await adapter.startThread();
  await adapter.startTurn(thread,'First fixture');allowed=false;
  await assert.rejects(adapter.startTurn(thread,'Second fixture'),/INCLUDED_USAGE_NOT_CONFIRMED/);
  assert.equal(rpc.calls.filter(c=>c.method==='turn/start').length,1);
  const reads=rpc.calls.filter(c=>c.method==='account/rateLimits/read');
  assert.equal(reads.length,2);
  assert.ok(reads.every(c=>c.params.supportsLunaReserve===false&&c.params.excludeResetCreditDetails===true));
 });
 test(`${name}: failed usage read cannot start a turn`,async()=>{
  const rpc=client(()=>{throw Error('Usage unavailable');});
  const adapter=new Adapter(rpc,{workspace:'/tmp/fixture',model:'fixture-model'});
  await adapter.initialize();const thread=await adapter.startThread();
  await assert.rejects(adapter.startTurn(thread,'Fixture'));
  assert.equal(rpc.calls.some(c=>c.method==='turn/start'),false);
 });
}

test('account diagnostic omits personal data and makes no inference/reset calls',async()=>{
 const rpc=client({ordinaryUsageAllowed:true,accountId:'private-id',rateLimits:{primary:{usedPercent:15,windowDurationMins:300},credits:{hasCredits:true,balance:'private-balance'}},rateLimitResetCredits:{credits:[{id:'private-reset'}]}});
 const result=await inspectAccount(rpc);
 assert.equal(result.ok,true);assert.equal(result.defaultModel,'fixture-model');
 assert.deepEqual(result.models,[{model:'fixture-model',isDefault:true}]);
 assert.equal(result.inferencePerformed,false);assert.equal(result.creditsRedeemed,false);
 assert.ok(!JSON.stringify(result).includes('private'));
 assert.deepEqual(rpc.calls.map(c=>c.method),['initialize','initialized','account/read','model/list','account/rateLimits/read']);
});
test('account diagnostic reports unknown allowance without raw upstream error',async()=>{
 const result=await inspectAccount(client(()=>{throw Error('private-secret');}));
 assert.equal(result.ok,false);assert.equal(result.usageQuerySucceeded,false);assert.equal(result.ordinaryUsageAllowed,null);
 assert.ok(!JSON.stringify(result).includes('private-secret'));
});
