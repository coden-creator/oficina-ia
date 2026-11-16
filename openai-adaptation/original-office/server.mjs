// Original visual shell only. Never imports the original backend or model runtimes.
import http from 'node:http';
import {team,departments} from './video/office-team.mjs';
import {createVideoHttpHandler} from './video/http.mjs';
import {createConnectionsHttpHandler} from './connections/http.mjs';
import {musicHttp} from './production/music-library.mjs';
import fs from 'node:fs';
import {createHash,timingSafeEqual} from 'node:crypto';
const digest=s=>createHash('sha256').update(s).digest();
export const capabilities=Object.freeze({ui:'original-visual-shell',functionalOffice:false,provider:'not-connected',autonomous:false,externalActionsEnabled:false,paidApiEnabled:false,features:{chat:'unavailable',tasks:'unavailable',crm:'not-connected',ads:'not-connected',render:'not-connected',voice:'not-connected',publication:'unavailable'}});
const files=new Map([['/','index.html'],...['style.css','negocio.css','officehq.js','sprites.js','compat-app.js','navigation.js','brand-context.js','ui.js','workspace-pages.js','compat.css','video-panel.js','music-panel.js','material-import.js','connections-panel.js','office-panel.js'].map(f=>['/'+f,f])]);
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8'};
export function createOriginalShell({password,origin,videoFlow=null,videoDataDir=null,deploymentMarker=null,connectionStore=null,officeCoordinator=null}){
 if(typeof password!=='string'||password.length<16)throw new Error('PASSWORD_REQUIRED');
 const publicURL=new URL(origin);if(publicURL.protocol!=='https:'||publicURL.username||publicURL.password||publicURL.pathname!=='/'||publicURL.search||publicURL.hash)throw new Error('HTTPS_ORIGIN_REQUIRED');
 const currentCapabilities=()=>{const flow=videoFlow?.capabilities();return {...capabilities,provider:flow?.runnerConnected?'codex-chatgpt-plan':'not-connected',features:{...capabilities.features,render:flow?.rendererConfigured?'configured-unverified':'not-connected',videoWorkflow:videoFlow?'internal-workflow-only':'unavailable'},video:flow||null};};
 const videoHandler=videoFlow?createVideoHttpHandler({flow:videoFlow,dataDir:videoDataDir,origin:publicURL.origin}):null;
 const connectionsHandler=createConnectionsHttpHandler({store:connectionStore,origin:publicURL.origin});
 const agents=team;
 const config={demo:false,paused:true,timezone:'America/Guatemala',agents,departments};
 const state={agents:Object.fromEntries(agents.map(a=>[a.id,{status:'unavailable',text:'Sin IA conectada',lastRun:null}])),approvals:[],log:[],deliverables:[],costs:null,chats:{},tasks:[],group:[],provenance:'fresh-shell-no-data-imported'};
 return http.createServer(async(req,res)=>{
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});res.end(JSON.stringify(value));};
  if(req.method==='GET'&&req.url==='/health')return send(200,{alive:true,mode:'original-visual-shell',...(deploymentMarker?{deploymentMarker}:{})});
  const raw=req.headers.authorization||'';
  if(!raw.startsWith('Basic ')||!timingSafeEqual(digest(Buffer.from(raw.slice(6),'base64').toString()),digest('jorge:'+password))){res.setHeader('WWW-Authenticate','Basic realm="Oficina", charset="UTF-8"');return send(401,{error:'AUTHENTICATION_REQUIRED'});}
  if(req.headers.host!==publicURL.host)return send(403,{error:'HOST_NOT_ALLOWED'});
  if(musicHttp(req,res))return;
  if(req.method==='GET'&&req.url.startsWith('/api/office/')){const brand=req.url.slice('/api/office/'.length);try{if(!officeCoordinator)return send(503,{error:'COORDINATION_UNAVAILABLE'});await videoFlow?.refreshConnection?.();return send(200,await officeCoordinator.snapshot(brand));}catch{return send(404,{error:'OFFICE_NOT_AVAILABLE'});}}
  if(await connectionsHandler(req,res))return;
  if(videoHandler&&await videoHandler(req,res))return;
  if(req.method!=='GET')return send(503,{error:'FEATURE_NOT_CONNECTED',externalActionsEnabled:false});
  if(req.url==='/api/config'){await videoFlow?.refreshConnection?.();return send(200,{...config,...currentCapabilities()});}
  if(req.url==='/api/state')return send(200,state);
  if(req.url==='/api/capabilities'||req.url==='/api/status'){await videoFlow?.refreshConnection?.();return send(200,currentCapabilities());}
  if(req.url==='/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Accel-Buffering':'no'});res.end('data: '+JSON.stringify({type:'snapshot',state})+'\n\n');return;}
  const staticPath=req.url.split('?')[0];
  if(files.has(staticPath)){
   const file=files.get(staticPath);res.writeHead(200,{'Content-Type':types[file.split('.').at(-1)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; media-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"});res.end(fs.readFileSync(new URL('./public/'+file,import.meta.url)));return;
  }
  return send(req.url.startsWith('/api/')?503:404,{error:req.url.startsWith('/api/')?'FEATURE_NOT_CONNECTED':'NOT_FOUND'});
 });
}
