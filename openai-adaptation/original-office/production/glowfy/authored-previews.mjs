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
