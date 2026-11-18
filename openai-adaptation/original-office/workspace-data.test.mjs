import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate} from 'node:timers/promises';
import {createBrandContext} from './public/brand-context.js';
import {createWorkspaceData} from './public/ui.js';

function pendingRequests(t){
 const pending=[];
 t.mock.method(globalThis,'fetch',url=>new Promise(resolve=>pending.push({url,reply(value,status=200){resolve(new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}}));}})));
 return pending;
}

test('late responses cannot replace the current brand, even after A → B → A',async t=>{
 const pending=pendingRequests(t),brandContext=createBrandContext('glowfy');
 const data=createWorkspaceData({brandContext,enabled:true});
 brandContext.select('velforce');brandContext.select('glowfy');
 assert.equal(pending.length,6);
 pending[4].reply({runnerConnected:false});pending[5].reply([{id:'current',brandId:'glowfy'}]);
 await setImmediate();assert.equal(data.get().jobs[0].id,'current');
 pending[0].reply({runnerConnected:true});pending[1].reply([{id:'old',brandId:'glowfy'}]);
 pending[2].reply({});pending[3].reply([{id:'other-brand',brandId:'velforce'}]);
 await setImmediate();assert.deepEqual(data.get().jobs,[{id:'current',brandId:'glowfy'}]);
 assert.equal(data.get().caps.runnerConnected,false);
});

test('loading and failed requests clear the previous brand; refresh can recover',async t=>{
 const pending=pendingRequests(t),brandContext=createBrandContext('glowfy');
 const data=createWorkspaceData({brandContext,enabled:true});
 pending[0].reply({});pending[1].reply([{id:'first',brandId:'glowfy'}]);await setImmediate();
 brandContext.select('velforce');assert.equal(data.get().status,'loading');assert.deepEqual(data.get().jobs,[]);
 pending[2].reply({});pending[3].reply({detail:'No disponible'},503);await setImmediate();
 assert.equal(data.get().status,'error');assert.deepEqual(data.get().jobs,[]);
 const refresh=data.refresh();pending[4].reply({});pending[5].reply([{id:'recovered',brandId:'velforce'}]);await refresh;
 assert.equal(data.get().status,'ready');assert.equal(data.get().jobs[0].id,'recovered');
});

test('wrong-brand payload is rejected instead of shown',async t=>{
 const pending=pendingRequests(t),brandContext=createBrandContext('glowfy');
 const data=createWorkspaceData({brandContext,enabled:true});
 pending[0].reply({});pending[1].reply([{id:'wrong',brandId:'velforce'}]);await setImmediate();
 assert.equal(data.get().status,'error');assert.deepEqual(data.get().jobs,[]);
});

test('unavailable workflows make no requests',t=>{
 const pending=pendingRequests(t),brandContext=createBrandContext('glowfy');
 const data=createWorkspaceData({brandContext,enabled:false});brandContext.select('velforce');
 assert.equal(data.get().status,'unavailable');assert.equal(data.get().brand,'velforce');assert.equal(pending.length,0);
});
