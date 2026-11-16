import fs from 'node:fs';import {createHash} from 'node:crypto';
let catalog,verified;
const metadata=()=>catalog??=JSON.parse(fs.readFileSync(new URL('./audio/glowfy-sfx-catalog.json',import.meta.url),'utf8'));
function asset(){if(verified)return verified;const data=fs.readFileSync(new URL('./audio/glowfy-sfx-catalog.mp4',import.meta.url)),m=metadata();if(data.length!==m.bytes||data.length>50*1024*1024||createHash('sha256').update(data).digest('hex')!==m.sha256)throw Error('CATALOG_INTEGRITY');return verified=data;}
export function catalogRange(header,size){
 if(header===undefined)return {start:0,end:size-1,partial:false};
 const m=/^bytes=(\d*)-(\d*)$/.exec(header);if(!m||(!m[1]&&!m[2]))return null;
 let start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2])),end=m[1]?(m[2]?Math.min(Number(m[2]),size-1):size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start||(!m[1]&&Number(m[2])<=0))return null;
 return {start,end,partial:true};
}
export function soundCatalogHttp(req,res){
 if(!req.url.startsWith('/api/sound-catalog/'))return false;
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'};
 const json=(code,value)=>{const data=Buffer.from(JSON.stringify(value));res.writeHead(code,{...headers,'Content-Type':'application/json','Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);return true;};
 if(!['GET','HEAD'].includes(req.method))return json(405,{error:'METHOD_NOT_ALLOWED'});
 try{
  if(req.url==='/api/sound-catalog/glowfy'){const m=metadata();return json(200,{brandId:'glowfy',title:m.title,duration:m.duration,count:m.tracks,url:'/api/sound-catalog/glowfy/video.mp4',chapters:m.chapters.map(({number,id,title,start})=>({number,id,title,start}))});}
  if(!['/api/sound-catalog/glowfy/video.mp4','/api/sound-catalog/glowfy/video.mp4?download=1'].includes(req.url))return json(404,{error:'CATALOG_NOT_FOUND'});
  const bytes=asset(),range=catalogRange(req.headers.range,bytes.length);if(!range){res.writeHead(416,{...headers,'Content-Range':`bytes */${bytes.length}`});res.end();return true;}
  const {start,end,partial}=range;res.writeHead(partial?206:200,{...headers,'Content-Type':'video/mp4','Content-Length':end-start+1,'Accept-Ranges':'bytes',...(partial?{'Content-Range':`bytes ${start}-${end}/${bytes.length}`}:{ }),'Content-Disposition':`${req.url.endsWith('download=1')?'attachment':'inline'}; filename="Glowfy-catalogo-efectos-v1.mp4"`});res.end(req.method==='HEAD'?undefined:bytes.subarray(start,end+1));return true;
 }catch{return json(503,{error:'CATALOG_UNAVAILABLE'});}
}
