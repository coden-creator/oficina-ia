import {draw as drawReserva} from './scene-reserva.mjs';import {draw as drawRecordatorio} from './scene-recordatorio.mjs';import {draw as drawHorario} from './scene-horario.mjs';
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {spawn} from 'node:child_process';import {once} from 'node:events';import {draw as drawStandard} from './scene.mjs';import {draw as drawSocial} from './scene-social.mjs';
const [configPath]=process.argv.slice(2),config=JSON.parse(await fs.readFile(configPath,'utf8'));
const unique={booking:drawReserva,reminder:drawRecordatorio,reschedule:drawHorario};
const draw=config.beats.uniqueProduction?unique[config.beats.variant]:(config.social?drawSocial:drawStandard);if(!draw)throw Error('UNIQUE_SCENE_NOT_FOUND');
const root=path.dirname(fileURLToPath(import.meta.url));
const {createCanvas,GlobalFonts,loadImage}=createRequire(import.meta.url)('@napi-rs/canvas');
const assets=JSON.parse(await fs.readFile(path.join(root,'assets.json')));
for(const f of assets.fonts)if(!GlobalFonts.register(Buffer.from(f.base64,'base64'),f.family))throw Error('FONT_UNAVAILABLE');
const logo=await loadImage(Buffer.from(assets.logo.base64,'base64'));
const whiteLogo=createCanvas(logo.width,logo.height);const lg=whiteLogo.getContext('2d');lg.drawImage(logo,0,0);lg.globalCompositeOperation='source-in';lg.fillStyle='#FFFFFF';lg.fillRect(0,0,logo.width,logo.height);
const beats=config.beats,width=config.preview?540:1080,height=config.preview?960:1920,fps=config.preview?12:30;
const canvas=createCanvas(width,height),ctx=canvas.getContext('2d'),options={width,height,beats,logo,whiteLogo};
const stills=[.5,...beats.scenes.slice(1).map(s=>s.start+1.1),beats.duration-1];
for(let i=0;i<stills.length;i++){draw(ctx,stills[i],options);const frame=canvas.toBuffer('image/png');draw(ctx,0,options);draw(ctx,stills[i],options);if(!frame.equals(canvas.toBuffer('image/png')))throw Error('NONDETERMINISTIC_RENDER');await fs.writeFile(path.join(config.outDir,`frame-${i}.png`),frame);}
if(config.stillsOnly)process.exit(0);
const file=path.join(config.outDir,config.preview?'preview-silent.mp4':'picture.mp4');
const child=spawn('/usr/bin/ffmpeg',['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',width+'x'+height,'-r',String(fps),'-i','pipe:0','-an','-c:v','libx264','-threads','1','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',file],{stdio:['pipe','ignore','pipe']});let err='';child.stderr.on('data',x=>err=(err+x).slice(-4000));child.stdin.on('error',()=>{});const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error('ENCODE_FAILED')))});done.catch(()=>{});
try{for(let i=0;i<Math.ceil(beats.duration*fps);i++){draw(ctx,i/fps,options);const frame=canvas.data();if(child.stdin.destroyed)throw Error('ENCODE_FAILED');if(!child.stdin.write(frame))await Promise.race([once(child.stdin,'drain'),done.then(()=>{throw Error('ENCODE_CLOSED')})]);}child.stdin.end();await done;await fs.writeFile(path.join(config.outDir,'picture-proof.json'),JSON.stringify({width,height,fps,frames:Math.ceil(beats.duration*fps),duration:beats.duration,deterministicSeeks:true,sceneCount:beats.scenes.length}));}finally{if(child.exitCode===null)child.kill('SIGKILL');}
