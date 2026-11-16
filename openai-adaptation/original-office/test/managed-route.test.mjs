import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createManagedRoute,CANONICAL_HOST,REVIEW_HOST,ROUTE_VERSION} from '../deployment-review/managed-route.mjs';
async function listening(server){await new Promise(r=>server.listen(0,'127.0.0.1',r));return server.address().port;}
async function close(server){server.closeAllConnections();await new Promise(r=>server.close(r));}
function request(port,{host=CANONICAL_HOST,path='/',method='GET',headers={},body}={}){
 return new Promise((resolve,reject)=>{const q=http.request({hostname:'127.0.0.1',port,path,method,headers:{host,...headers}},r=>{let text='';r.on('data',b=>text+=b);r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,text}));});q.on('error',reject);q.end(body);});
}
test('fixed route forwards authentication, method, query and payload to the same App',async()=>{
 const seen=[];const upstream=http.createServer((q,r)=>{let body='';q.on('data',b=>body+=b);q.on('end',()=>{seen.push({method:q.method,url:q.url,headers:q.headers,body});r.writeHead(201,{'Content-Type':'application/json','X-Office-Route':'untrusted-upstream'});r.end('{"saved":true}');});});
 const target=await listening(upstream),route=createManagedRoute({upstream:'http://127.0.0.1:'+target}),port=await listening(route);
 try{const response=await request(port,{path:'/api/video-workflows/glowfy?v=2',method:'POST',headers:{authorization:'Basic synthetic-test-only',origin:'https://'+CANONICAL_HOST,'content-type':'application/json','x-forwarded-host':'wrong.example'},body:'{"objective":"local fixture"}'});
  assert.equal(response.status,201);assert.equal(response.headers['x-office-route'],ROUTE_VERSION);assert.equal(seen[0].headers.authorization,'Basic synthetic-test-only');assert.equal(seen[0].headers.host,CANONICAL_HOST);assert.equal(seen[0].headers.origin,'https://'+CANONICAL_HOST);assert.equal(seen[0].headers['x-forwarded-host'],CANONICAL_HOST);assert.equal(seen[0].method,'POST');assert.equal(seen[0].url,'/api/video-workflows/glowfy?v=2');assert.equal(seen[0].body,'{"objective":"local fixture"}');
 }finally{await close(route);await close(upstream);}
});
test('review bookmark redirects, but review writes are refused instead of replayed',async()=>{
 const route=createManagedRoute(),port=await listening(route);
 try{const read=await request(port,{host:REVIEW_HOST,path:'/?brand=glowfy'});assert.equal(read.status,308);assert.equal(read.headers.location,'https://'+CANONICAL_HOST+'/?brand=glowfy');const write=await request(port,{host:REVIEW_HOST,method:'POST',path:'/api/video-workflows/glowfy'});assert.equal(write.status,409);assert.equal(write.headers.location,undefined);}
 finally{await close(route);}
});
test('unknown hosts, absolute URLs and network paths never select another upstream',async()=>{
 const route=createManagedRoute(),port=await listening(route);
 try{assert.equal((await request(port,{host:'attacker.example'})).status,421);assert.equal((await request(port,{path:'//attacker.example'})).status,400);assert.equal((await request(port,{path:'http://attacker.example/'})).status,400);}
 finally{await close(route);}
});
test('route health is separate from App health and backend outages stay generic',async()=>{
 const unused=http.createServer(),target=await listening(unused);await close(unused);const route=createManagedRoute({upstream:'http://127.0.0.1:'+target}),port=await listening(route);
 try{const health=await request(port,{path:'/office-route-health'});assert.deepEqual(JSON.parse(health.text),{role:'fixed-easypanel-route',version:ROUTE_VERSION});const response=await request(port,{path:'/health'});assert.equal(response.status,503);assert.equal(response.headers['retry-after'],'5');assert.deepEqual(JSON.parse(response.text),{error:'OFFICE_UPDATING'});}
 finally{await close(route);}
});
test('video downloads and range responses are streamed without alteration',async()=>{
 const bytes=Buffer.from([0,1,2,3,254,255]);const upstream=http.createServer((_q,r)=>{r.writeHead(206,{'Content-Type':'video/mp4','Content-Range':'bytes 0-5/6','Content-Length':6});r.end(bytes);});
 const target=await listening(upstream),route=createManagedRoute({upstream:'http://127.0.0.1:'+target}),port=await listening(route);
 try{const data=await new Promise((resolve,reject)=>{http.get({hostname:'127.0.0.1',port,path:'/api/video-workflows/glowfy/fixture/artifact?v=1',headers:{host:CANONICAL_HOST,range:'bytes=0-5'}},r=>{assert.equal(r.statusCode,206);assert.equal(r.headers['content-range'],'bytes 0-5/6');const b=[];r.on('data',x=>b.push(x));r.on('end',()=>resolve(Buffer.concat(b)));}).on('error',reject);});assert.deepEqual(data,bytes);}
 finally{await close(route);await close(upstream);}
});
