// A fixed HTTP route, not an administrative agent. No shell, Docker, credentials,
// private mounts, command endpoint, or user-selected upstream.
import http from 'node:http';
import {pathToFileURL} from 'node:url';

export const CANONICAL_HOST='service-oficina-jorge.flb2mp.easypanel.host';
export const REVIEW_HOST='service-oficina-review.flb2mp.easypanel.host';
export const ROUTE_VERSION='easypanel-app-route-v1';
const HOP=['connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailer','transfer-encoding','upgrade'];
function end(res,status,data,headers={}){
 res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(data));
}
function headersWithoutHop(headers){
 const out={...headers};
 for(const name of String(headers.connection||'').split(',').map(x=>x.trim().toLowerCase()))delete out[name];
 for(const name of HOP)delete out[name];
 return out;
}
export function createManagedRoute({upstream='http://service_oficina-jorge:3000'}={}){
 const target=new URL(upstream);if(target.protocol!=='http:'||target.username||target.password||target.pathname!=='/'||target.search||target.hash)throw Error('INVALID_FIXED_UPSTREAM');
 const server=http.createServer((req,res)=>{
  const host=String(req.headers.host||'').toLowerCase().replace(/:443$/,'');
  if(![CANONICAL_HOST,REVIEW_HOST].includes(host))return end(res,421,{error:'HOST_NOT_ALLOWED'});
  if(!req.url?.startsWith('/')||req.url.startsWith('//')||/[\r\n]/.test(req.url))return end(res,400,{error:'INVALID_PATH'});
  if(host===REVIEW_HOST){
   if(!['GET','HEAD'].includes(req.method))return end(res,409,{error:'OFFICE_MOVED',url:'https://'+CANONICAL_HOST});
   return end(res,308,{url:'https://'+CANONICAL_HOST+req.url},{Location:'https://'+CANONICAL_HOST+req.url});
  }
  if(req.method==='GET'&&req.url==='/office-route-health')return end(res,200,{role:'fixed-easypanel-route',version:ROUTE_VERSION});
  const headers=headersWithoutHop(req.headers);
  headers.host=CANONICAL_HOST;headers['x-forwarded-host']=CANONICAL_HOST;headers['x-forwarded-proto']='https';
  delete headers['x-office-route'];
  const remote=http.request({hostname:target.hostname,port:target.port||80,path:req.url,method:req.method,headers},response=>{
   const out=headersWithoutHop(response.headers);out['x-office-route']=ROUTE_VERSION;
   res.writeHead(response.statusCode||502,out);response.on('error',()=>res.destroy());response.pipe(res);
  });
  remote.setTimeout(600000,()=>remote.destroy());
  remote.on('error',()=>{if(!res.headersSent)end(res,503,{error:'OFFICE_UPDATING'},{'Retry-After':'5'});else res.destroy();});
  req.on('aborted',()=>remote.destroy());req.on('error',()=>remote.destroy());
  res.on('close',()=>{if(!res.writableFinished)remote.destroy();});req.pipe(remote);
 });
 server.headersTimeout=10000;server.requestTimeout=600000;
 server.on('upgrade',(_req,socket)=>socket.destroy());
 return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const server=createManagedRoute();server.listen(3000,'0.0.0.0');
 for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.close(()=>process.exit(0));server.closeIdleConnections();setTimeout(()=>process.exit(1),10000).unref();});
}
