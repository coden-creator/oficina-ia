import {createRequire} from 'node:module';
const {Path2D}=createRequire(import.meta.url)('@napi-rs/canvas');
const paths=new WeakMap(),clamp=x=>Math.max(0,Math.min(1,x));
export function ease(x,k='smooth'){x=clamp(x);if(k==='linear')return x;if(k==='step')return x===1?1:0;if(k==='in')return x*x*x;if(k==='out')return 1-(1-x)**3;if(k==='inOut')return x<.5?4*x*x*x:1-(-2*x+2)**3/2;if(k==='back'){const z=x-1;return 1+2.70158*z*z*z+1.70158*z*z;}return x*x*(3-2*x);}
export function sample(points,u,fallback){if(!points?.length)return fallback;if(u<=points[0][0])return points[0][1];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(u<=b[0])return a[1]+(b[1]-a[1])*ease((u-a[0])/(b[0]-a[0]),b[2]);}return points.at(-1)[1];}
function paint(c,value,g){if(!value||value==='none')return null;if(!value.startsWith('@'))return value;const a=g.gradients[value.slice(1)];const v=a.type==='radial'?c.createRadialGradient(...a.coords):c.createLinearGradient(...a.coords);for(const [p,color] of a.stops)v.addColorStop(p,color);return v;}
function rounded(c,x,y,w,h,r=0){c.beginPath();c.roundRect(x,y,Math.max(.001,w),Math.max(.001,h),Math.min(Math.abs(r),Math.abs(w)/2,Math.abs(h)/2));}
export function drawGraph(c,g,u,{logo,whiteLogo}={}){
 c.fillStyle=g.background;c.fillRect(0,0,1080,1920);
 const children=new Map();for(const n of g.nodes){const k=n.parent||'';if(!children.has(k))children.set(k,[]);children.get(k).push(n);}
 const node=n=>{
  const v={x:0,y:0,w:0,h:0,r:0,alpha:1,rotate:0,sx:1,sy:1,reveal:1,value:0,...n};for(const [p,points] of Object.entries(n.tracks||{}))v[p]=sample(points,u,v[p]);
  if(v.alpha<=0||v.sx===0||v.sy===0)return;c.save();c.globalAlpha*=clamp(v.alpha);c.translate(v.x,v.y);c.rotate(v.rotate*Math.PI/180);c.scale(v.sx,v.sy);
  if(n.clip){const q=n.clip;rounded(c,q.x,q.y,q.w,q.h,q.r);c.clip();}
  if(n.kind==='group'){for(const child of children.get(n.id)||[])node(child);c.restore();return;}
  const fill=paint(c,n.fill??(n.kind==='text'?'#21102E':'none'),g),stroke=paint(c,n.stroke,g);c.lineWidth=n.sw??1;c.lineCap='round';c.lineJoin='round';if(n.dash)c.setLineDash(n.dash);
  if(n.shadow){c.shadowColor=n.shadow.color;c.shadowBlur=n.shadow.blur;c.shadowOffsetX=n.shadow.dx;c.shadowOffsetY=n.shadow.dy;}
  if(n.kind==='text'){
   c.font=`${n.weight||500} ${n.size}px "${n.font||'Montserrat'}"`;c.textAlign=n.align||'left';c.textBaseline='alphabetic';const text=n.text.replaceAll('{n}',String(Math.round(v.value)));
   if(v.reveal<1){const width=n.maxWidth||c.measureText(text).width,x=n.align==='center'?-width/2:n.align==='right'?-width:0;c.beginPath();c.rect(x,-n.size*1.25,width*clamp(v.reveal),n.size*1.6);c.clip();}
   if(n.tracking)c.letterSpacing=n.tracking+'px';if(fill){c.fillStyle=fill;n.maxWidth?c.fillText(text,0,0,n.maxWidth):c.fillText(text,0,0);}if(stroke){c.strokeStyle=stroke;c.strokeText(text,0,0);}c.letterSpacing='0px';
  }else if(n.kind==='logo'){const im=n.white?whiteLogo:logo;if(im)c.drawImage(im,0,0,v.w||240,v.h||(v.w||240)*im.height/im.width);}
  else{
   let p=null;if(n.kind==='path'){p=paths.get(n);if(!p){p=new Path2D(n.d);paths.set(n,p);}if(n.pathLength&&v.reveal<1){c.setLineDash([n.pathLength,n.pathLength]);c.lineDashOffset=n.pathLength*(1-clamp(v.reveal));}}
   else if(n.kind==='ellipse'){c.beginPath();c.ellipse(0,0,Math.max(.001,Math.abs(v.w)/2),Math.max(.001,Math.abs(v.h)/2),0,0,Math.PI*2);}
   else rounded(c,0,0,v.w*clamp(v.reveal),v.h,v.r);
   if(fill){c.fillStyle=fill;p?c.fill(p):c.fill();}if(stroke){c.strokeStyle=stroke;p?c.stroke(p):c.stroke();}
  }
  c.restore();
 };
 for(const n of children.get('')||[])node(n);
}
export function draw(c,t,{width=1080,height=1920,beats:b,logo,whiteLogo}){
 c.save();c.scale(width/1080,height/1920);const s=b.authoredScenes.find(s=>t>=s.start&&t<s.end)||b.authoredScenes.at(-1),u=clamp((t-s.start)/(s.end-s.start));drawGraph(c,s.graph,u,{logo,whiteLogo});
 // Shared accessibility/brand layer; the entire scene above is authored per project.
 const cap=b.captions.find(g=>t>=g.start&&t<g.end),closing=t>b.duration-2.3;
 if(cap&&!closing){const text=cap.words.map(w=>w.text).join(' ');c.font='600 44px Montserrat';const w=Math.min(940,c.measureText(text).width+56);rounded(c,(1080-w)/2,1654,w,88,22);c.fillStyle='rgba(33,16,46,0.91)';c.fill();c.textAlign='center';c.fillStyle='#FAF7FD';c.fillText(text,540,1713,900);}
 if(closing){const p=ease((t-(b.duration-2.3))/.45,'out');c.globalAlpha=p;const bg=c.createLinearGradient(0,1470,0,1920);bg.addColorStop(0,'rgba(33,16,46,0)');bg.addColorStop(.35,'rgba(33,16,46,0.94)');bg.addColorStop(1,'#21102E');c.fillStyle=bg;c.fillRect(0,1470,1080,450);c.textAlign='center';c.fillStyle='#FAF7FD';c.font='400 70px "Instrument Serif"';c.fillText('Conocé Glowfy',540,1650);if(whiteLogo)c.drawImage(whiteLogo,420,1700,240,240*whiteLogo.height/whiteLogo.width);c.globalAlpha=1;}
 c.textAlign='center';c.font='400 20px Montserrat';c.fillStyle=closing?'#D8C4E5':'#8B7894';c.fillText('Ejemplo ilustrado · Funciones según tu plan',540,1845);c.restore();
}
