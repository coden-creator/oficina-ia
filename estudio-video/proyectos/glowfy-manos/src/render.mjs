import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {draw} from './scene.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {createCanvas,GlobalFonts,loadImage}=createRequire(import.meta.url)('@napi-rs/canvas');
const argv=process.argv.slice(2),opt=(name,fallback)=>{let i=argv.indexOf('--'+name);return i<0?fallback:argv[i+1]};
const beats=JSON.parse(await fs.readFile(path.join(root,'plan/beats.json'),'utf8'));
const from=Number(opt('from',0)),to=Number(opt('to',beats.duration)),fps=Number(opt('fps',30)),scale=Number(opt('scale',.5));
if(![from,to,fps,scale].every(Number.isFinite)||from<0||to<=from||to>beats.duration||fps<1||fps>60||scale<=0||scale>1)throw Error('Invalid render range');
const out=path.resolve(opt('out',path.join(root,'cache/range-v1'))),jpg=argv.includes('--jpg'),name=opt('name','Glowfy - Propuesta visual v1');
if(!name||/[\\/:]/.test(name))throw Error('Use a plain versioned name');
await fs.mkdir(out,{recursive:true});
const dest=path.join(out,name+'.mp4');
if((jpg&&(await fs.readdir(out)).some(f=>/^frame-\d+\.jpg$/.test(f)))||(!jpg&&await fs.stat(dest).then(()=>true,()=>false)))throw Error('Output exists; choose a new version');
const fonts=path.resolve(root,'../../assets/fonts');
const prepared=spawnSync('python3',[path.join(root,'src/prepare-fonts.py')],{encoding:'utf8'});
if(prepared.status!==0)throw Error('Local font preparation requires existing Python fontTools: '+prepared.stderr);
for(const weight of [400,500,600,700])if(!GlobalFonts.registerFromPath(path.join(root,`cache/fonts/Montserrat-${weight}.ttf`),'Montserrat'))throw Error('Local Montserrat instance missing');
if(!GlobalFonts.registerFromPath(path.join(fonts,'Instrument Serif/InstrumentSerif-Italic.ttf'),'Instrument Serif'))throw Error('Local serif missing');
const logoConfig=JSON.parse(await fs.readFile(path.join(root,'assets/logo.json'),'utf8')),logo=await loadImage(Buffer.from(logoConfig.base64,'base64'));
const width=Math.round(beats.width*scale/2)*2,height=Math.round(beats.height*scale/2)*2,count=Math.ceil((to-from)*fps-1e-8);
const canvas=createCanvas(width,height),ctx=canvas.getContext('2d'),options={width,height,beats,logo};
// Test arbitrary seeks before export: rendering order must not alter pixels.
for(const t of [0,2.4,4.8,7.8,11.2]){draw(ctx,t,options);const a=canvas.toBuffer('image/png');draw(ctx,11-t,options);draw(ctx,t,options);if(!a.equals(canvas.toBuffer('image/png')))throw Error('Non deterministic scene');}
let encoder,done,stderr='';const audio=opt('audio');
try{
 if(!jpg){const args=['-hide_banner','-loglevel','error','-n','-f','image2pipe','-framerate',String(fps),'-i','pipe:0'];if(audio){await fs.access(path.resolve(audio));args.push('-ss',String(from),'-i',path.resolve(audio));}
  args.push('-map','0:v:0');if(audio)args.push('-map','1:a:0','-c:a','aac','-b:a','192k','-af','apad');else args.push('-an');
  args.push('-c:v','libx264','-threads','2','-preset','fast','-crf','18','-pix_fmt','yuv420p','-frames:v',String(count),'-t',String(count/fps),'-movflags','+faststart',dest);
  encoder=spawn('ffmpeg',args,{stdio:['pipe','ignore','pipe']});encoder.stderr.on('data',d=>stderr=(stderr+d).slice(-2000));encoder.stdin.on('error',()=>{});
  done=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('close',code=>code===0?resolve():reject(Error('Encoding failed: '+stderr)))});done.catch(()=>{});
 }
 for(let i=0;i<count;i++){const t=from+i/fps;draw(ctx,t,options);if(jpg)await fs.writeFile(path.join(out,`frame-${String(i).padStart(5,'0')}.jpg`),canvas.toBuffer('image/jpeg'));else{if(encoder.stdin.destroyed)throw Error('Encoder stopped');if(!encoder.stdin.write(canvas.toBuffer('image/png')))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw Error('Encoder ended early')})]);}}
 if(encoder){encoder.stdin.end();await done;}
 const proof={version:1,kind:'creative-proposal',approval:false,from,to,fps,width,height,frames:count,deterministicSeeks:true,audio:!!audio,paidRequests:0,uploaded:false};
 if(!jpg)proof.sha256=createHash('sha256').update(await fs.readFile(dest)).digest('hex');
 await fs.writeFile(path.join(out,jpg?'range.json':name+'.json'),JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));
}finally{if(encoder&&encoder.exitCode===null)encoder.kill('SIGKILL')}
