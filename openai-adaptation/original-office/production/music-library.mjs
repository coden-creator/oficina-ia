import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('./audio/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('glowfy-music.json',root),'utf8'));
const tracks=manifest.tracks.filter(t=>t.approvedForBrand===true&&t.brandId==='glowfy');
export function musicLibrary(brandId){
 return {brandId,direction:brandId==='glowfy'?manifest.direction:null,tracks:brandId==='glowfy'?tracks.map(t=>({id:t.id,title:t.title,duration:t.duration,approvedForBrand:true,url:`/api/music/glowfy/${t.id}.mp3`})):[]};
}
export function readMusicTrack(id){
 const track=tracks.find(t=>t.id===id);if(!track)return null;
 const bytes=fs.readFileSync(new URL(track.file,root));
 if(createHash('sha256').update(bytes).digest('hex')!==track.sha256)throw Error('MUSIC_ASSET_INTEGRITY_FAILED');
 return {track,bytes};
}
export function selectGlowfyMusic(job){
 if(job?.brandId!=='glowfy'||typeof job.id!=='string'||!job.id||!tracks.length)throw Error('MUSIC_BRAND_OR_JOB_REQUIRED');
 // Stable for the same piece across edits. Distributes new pieces across the approved pool;
 // consecutive pieces may match. This is not a claim of editorial mood matching.
 const slot=createHash('sha256').update('glowfy-music-v1:'+job.id).digest().readUInt32BE(0)%tracks.length;
 const {track}=readMusicTrack(tracks[slot].id);
 return {...track,gainDb:Math.round((-27-track.integratedLufs)*100)/100};
}
export function musicHttp(req,res){
 if(!req.url.startsWith('/api/music/'))return false;
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'};
 const fail=status=>{res.writeHead(status,{...headers,'Content-Type':'application/json'});res.end(JSON.stringify({error:status===405?'METHOD_NOT_ALLOWED':'MUSIC_NOT_FOUND'}));return true;};
 if(!['GET','HEAD'].includes(req.method))return fail(405);
 const route=req.url.split('?')[0];
 if(/^\/api\/music\/(glowfy|velforce|quiba|purify|coden)$/.test(route)){
  const bytes=Buffer.from(JSON.stringify(musicLibrary(route.split('/').at(-1))));res.writeHead(200,{...headers,'Content-Type':'application/json','Content-Length':bytes.length});res.end(req.method==='HEAD'?undefined:bytes);return true;
 }
 const match=route.match(/^\/api\/music\/glowfy\/(glowfy-[a-d])\.mp3$/);if(!match)return fail(404);
 try{const result=readMusicTrack(match[1]);if(!result)return fail(404);res.writeHead(200,{...headers,'Content-Type':'audio/mpeg','Content-Length':result.bytes.length,'Content-Disposition':`inline; filename="${result.track.id}.mp3"`});res.end(req.method==='HEAD'?undefined:result.bytes);return true;}catch{res.writeHead(503,{...headers,'Content-Type':'application/json'});res.end(JSON.stringify({error:'MUSIC_ASSET_UNAVAILABLE'}));return true;}
}
