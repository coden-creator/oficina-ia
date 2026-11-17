import fs from 'node:fs/promises';import {createRequire} from 'node:module';import {drawGraph,draw} from './scene-authored.mjs';
const {createCanvas,GlobalFonts,loadImage}=createRequire(import.meta.url)('@napi-rs/canvas');
const [input]=process.argv.slice(2),config=JSON.parse(await fs.readFile(input)),assets=JSON.parse(await fs.readFile(new URL('./assets.json',import.meta.url)));
for(const f of assets.fonts)GlobalFonts.register(Buffer.from(f.base64,'base64'),f.family);const logo=await loadImage(Buffer.from(assets.logo.base64,'base64')),whiteLogo=createCanvas(logo.width,logo.height),lc=whiteLogo.getContext('2d');lc.drawImage(logo,0,0);lc.globalCompositeOperation='source-in';lc.fillStyle='#FFF';lc.fillRect(0,0,logo.width,logo.height);
for(const scene of config.scenes){
 const canvas=createCanvas(720,1336),c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.fillStyle='#21102E';c.fillRect(0,0,720,1336);
 for(const [i,u] of [0,.28,.58,.88].entries()){
  const frame=createCanvas(1080,1920),f=frame.getContext('2d');
  if(config.beats)draw(f,scene.start+(scene.end-scene.start)*u,{width:1080,height:1920,beats:config.beats,logo,whiteLogo});else drawGraph(f,scene.graph,u,{logo,whiteLogo});
  const x=i%2*360,y=Math.floor(i/2)*668;c.drawImage(frame,x,y,360,640);
  c.fillStyle='#FFF';c.font='16px sans-serif';c.fillText(`Escena ${scene.scene} · ${Math.round(u*100)}%`,x+12,y+658);
 }
 await fs.writeFile(config.outDir+'/review-scene-'+scene.scene+'.jpg',canvas.toBuffer('image/jpeg',85));
}
if(config.choreography){
 const measurements=[];
 for(const scene of config.scenes){
  const sheet=createCanvas(880,1660),c=sheet.getContext('2d');c.fillStyle='#21102E';c.fillRect(0,0,880,1660);
  const start=scene.start,end=scene.end;
  const times=scene.scene===1?Array.from({length:16},(_,i)=>start+(end-start-.03)*i/15):[start-.36,start-.24,start-.12,start, ...Array.from({length:12},(_,i)=>start+.12+(end-start-.15)*i/11)];
  for(const [i,t] of times.entries()){
   const frame=createCanvas(1080,1920);draw(frame.getContext('2d'),Math.max(0,t),{beats:config.beats,logo,whiteLogo});
   const x=i%4*220,y=Math.floor(i/4)*415;c.drawImage(frame,x,y,220,391);c.fillStyle='#FFF';c.font='14px sans-serif';c.fillText(`${t.toFixed(2)}s`,x+8,y+409);
  }
  await fs.writeFile(config.outDir+'/motion-scene-'+scene.scene+'.jpg',sheet.toBuffer('image/jpeg',86));
  // Rendered pixel activity excludes captions and automatic brand layers. It is a
  // freeze diagnostic, explicitly not a proxy for expressive motion or taste.
  const small=createCanvas(144,256),f=small.getContext('2d'),rates=[];let prior=null,run=0,maxRun=0;
  for(let t=start;t<end;t+=1/12){
   draw(f,t,{width:144,height:256,beats:config.beats,logo,whiteLogo});const data=small.data();let changed=0,total=0;
   if(prior){for(let y=24;y<207;y++)for(let x=10;x<134;x++){const k=(y*144+x)*4;const delta=(Math.abs(data[k]-prior[k])+Math.abs(data[k+1]-prior[k+1])+Math.abs(data[k+2]-prior[k+2]))/3;if(delta>8)changed++;total++;}const fraction=changed/total;rates.push(fraction);run=fraction<.001?run+1:0;maxRun=Math.max(maxRun,run);}
   prior=Buffer.from(data);
  }
  measurements.push({scene:scene.scene,samples:rates.length,maxNearlyUnchangedSeconds:Number((maxRun/12).toFixed(2)),meanChangedAreaFraction:Number((rates.reduce((a,b)=>a+b,0)/Math.max(1,rates.length)).toFixed(4))});
 }
 await fs.writeFile(config.outDir+'/motion-measurements.json',JSON.stringify({scope:'Sampled image changes in story area at12fps; camera and shadows count too. Not an aesthetic verdict.',scenes:measurements}));
}
