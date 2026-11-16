import http from 'node:http';import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {musicLibrary,readMusicTrack,selectGlowfyMusic} from './music-library.mjs';import {socialSoundtrack} from './glowfy/mix-social.mjs';import {createOriginalShell} from '../server.mjs';
test('owner-selected tracks are complete, distinct, brand-scoped and stable across revisions',()=>{
 const tracks=musicLibrary('glowfy').tracks;assert.equal(tracks.length,4);assert.equal(new Set(tracks.map(t=>readMusicTrack(t.id).track.sha256)).size,4);
 for(const t of tracks){const {track,bytes}=readMusicTrack(t.id);assert.equal(createHash('sha256').update(bytes).digest('hex'),track.sha256);assert.equal(track.approvedForBrand,true);}
 assert.deepEqual(musicLibrary('velforce').tracks,[]);assert.equal(readMusicTrack('../glowfy-a'),null);assert.throws(()=>selectGlowfyMusic({id:'x',brandId:'velforce'}));
 const selected=new Set();for(let i=0;i<40;i++){const j={id:'piece-'+i,brandId:'glowfy',version:1};const a=selectGlowfyMusic(j);selected.add(a.id);assert.equal(selectGlowfyMusic({...j,version:6}).id,a.id);}assert.equal(selected.size,4);
});
test('music HTTP authenticates, isolates brands, downloads original bytes and rejects writes',async t=>{
 const password='synthetic-music-test-password',server=createOriginalShell({password,origin:'https://office.test'});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const get=(url,options={})=>new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port:server.address().port,path:url,method:options.method||'GET',headers:{host:'office.test',authorization:'Basic '+Buffer.from('jorge:'+password).toString('base64'),...options.headers}},res=>{const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>{const bytes=Buffer.concat(chunks);resolve({status:res.statusCode,headers:{get:key=>res.headers[key]},json:async()=>JSON.parse(bytes),arrayBuffer:async()=>bytes})});});req.on('error',reject);req.end();});
 assert.equal((await get('/api/music/glowfy',{headers:{authorization:''}})).status,401);assert.equal((await get('/api/music/glowfy',{headers:{host:'wrong.test'}})).status,403);
 const list=await (await get('/api/music/glowfy')).json();assert.equal(list.tracks.length,4);assert.equal(JSON.stringify(list).includes('/app/'),false);
 assert.deepEqual((await (await get('/api/music/velforce')).json()).tracks,[]);assert.equal((await get('/api/music/velforce/glowfy-a.mp3')).status,404);assert.equal((await get('/api/music/glowfy',{method:'POST'})).status,405);
 for(const track of list.tracks){const r=await get(track.url);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'audio/mpeg');assert.equal(createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),readMusicTrack(track.id).track.sha256);}
 assert.equal((await get('/api/music/glowfy/glowfy-z.mp3')).status,404);const head=await get(list.tracks[0].url,{method:'HEAD'});assert.equal(head.status,200);assert.ok(Number(head.headers.get('content-length'))>10000);assert.equal((await head.arrayBuffer()).byteLength,0);
});
test('each approved MP3 decodes and real FFmpeg mix accepts its gain and ducking',()=>{
 const seen=new Set();for(let i=0;seen.size<4&&i<100;i++){const job={id:'mix-'+i,brandId:'glowfy'},selected=selectGlowfyMusic(job);if(seen.has(selected.id))continue;seen.add(selected.id);
  const file=fileURLToPath(new URL('./audio/'+selected.file,import.meta.url));const measured=spawnSync('ffmpeg',['-hide_banner','-i',file,'-af',`volume=${selected.gainDb}dB,loudnorm=I=-27:TP=-2:LRA=11:print_format=json`,'-f','null','-'],{encoding:'utf8',timeout:20000});assert.equal(measured.status,0,measured.stderr);const levels=JSON.parse(measured.stderr.match(/\{\s*"input_i"[\s\S]*?\}/).at(0));assert.ok(Math.abs(Number(levels.input_i)+27)<.15);assert.ok(Number(levels.input_tp)<-2);
  const names=['messageOne','messageTwo','messageThree','phoneFocus','customer','assistant','reply','appointment','calendar','reminder','closing','cta'];const beats={duration:4,events:Object.fromEntries(names.map((n,i)=>[n,i*.25]))},sound=socialSoundtrack(beats,job);
  const mix=spawnSync('ffmpeg',['-hide_banner','-v','error','-filter_complex_threads','1','-f','lavfi','-i','sine=frequency=220:duration=4',...sound.input,'-filter_complex',sound.filters,'-map','[m]','-f','null','-'],{encoding:'utf8',timeout:20000});assert.equal(mix.status,0,mix.stderr);assert.equal(sound.music.id,selected.id);assert.equal(sound.music.ducking,true);
 }assert.equal(seen.size,4);
});
