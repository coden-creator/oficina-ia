import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {validApiKey} from './store.mjs';
const hash=s=>createHash('sha256').update(s).digest();
const messages={INVALID_API_KEY_FORMAT:'Revisa la clave: debe pegarse completa, sin espacios.',CONNECTION_KEY_REQUIRED:'Guarda una clave antes de verificarla.',CONNECTION_BUSY:'Hay otra operación en curso. Espera unos segundos.',CONNECTION_STORAGE_INVALID:'No se pudo leer la configuración guardada.',CONNECTION_STORAGE_UNSAFE:'El almacenamiento de claves no está disponible.'};
export function createConnectionsHttpHandler({store=null,origin}){
 const csrf=randomBytes(32).toString('hex');
 return async(req,res)=>{
  if(!req.url.startsWith('/api/connections'))return false;
  const send=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});res.end(JSON.stringify(value));return true};
  if(!['/api/connections','/api/connections/elevenlabs','/api/connections/elevenlabs/verify'].includes(req.url))return send(404,{error:'NOT_FOUND'});
  try{
   if(req.method==='GET'&&req.url==='/api/connections')return send(200,{available:!!store,csrfToken:store?csrf:null,elevenlabs:store?await store.status():{provider:'elevenlabs',configured:false,status:'unavailable',generationEnabled:false}});
   if(req.method!=='POST'||req.url==='/api/connections')return send(405,{error:'METHOD_NOT_ALLOWED'});
   if(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'ORIGIN_NOT_ALLOWED'});
   if(req.headers['content-type']!=='application/json')return send(415,{error:'JSON_REQUIRED'});
   if(typeof req.headers['x-office-csrf']!=='string'||!timingSafeEqual(hash(req.headers['x-office-csrf']),hash(csrf)))return send(403,{error:'CSRF_REQUIRED'});
   if(!store)return send(503,{error:'CONNECTIONS_UNAVAILABLE'});
   let bytes=0,body='';for await(const chunk of req){bytes+=chunk.length;if(bytes>2048)return send(413,{error:'BODY_TOO_LARGE'});body+=chunk}
   let input;try{input=JSON.parse(body)}catch{return send(400,{error:'INVALID_REQUEST'})}
   if(!input||typeof input!=='object'||Array.isArray(input))return send(400,{error:'INVALID_REQUEST'});
   if(req.url.endsWith('/verify')){if(Object.keys(input).length)return send(400,{error:'INVALID_REQUEST'});return send(200,{elevenlabs:await store.verify()})}
   if(Object.keys(input).join(',')!=='apiKey'||!validApiKey(input.apiKey))return send(400,{error:'INVALID_API_KEY_FORMAT',detail:messages.INVALID_API_KEY_FORMAT});
   return send(200,{elevenlabs:await store.save(input.apiKey)});
  }catch(e){const code=Object.hasOwn(messages,e?.message)?e.message:'CONNECTION_OPERATION_FAILED';return send(409,{error:code,detail:messages[code]||'No se pudo completar la operación. La clave no se muestra ni se genera audio.'})}
 };
}
