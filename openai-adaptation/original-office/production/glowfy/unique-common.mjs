import {C,at,mix,rect,oval,text,shadow,noShadow,gradient,line} from './objects.mjs';
export {C,at,mix,rect,oval,text,shadow,noShadow,gradient,line};
export const clamp=x=>Math.max(0,Math.min(1,x));
export function label(c,s,x,y,size=32,color=C.ink,weight=600,max=850,family='Montserrat'){
 while(size>18){c.font=`${weight} ${size}px "${family}"`;if(c.measureText(s).width<=max)break;size-=1;}text(c,s,x,y,size,color,weight,family);
}
export function center(c,s,x,y,size=50,color=C.ink,weight=700,max=850,family='Montserrat'){
 while(size>18){c.font=`${weight} ${size}px "${family}"`;if(c.measureText(s).width<=max)break;size--;}text(c,s,x-c.measureText(s).width/2,y,size,color,weight,family);
}
export function heading(c,lines,t,start,{x=80,y=330,size=94,color=C.ink,accent=C.purple}={}){
 const p=start===0?1:at(t,start,.32);c.save();c.globalAlpha=p;c.translate(0,(1-p)*28);lines.forEach((s,i)=>label(c,s,x,y+i*(size+10),size,i===lines.length-1?accent:color,700,900-x));c.restore();
}
export function captions(c,t,b,{y=1535,color=C.ink,accent=C.dark}={}){
 const group=b.captions.find(x=>t>=x.start-.02&&t<x.end);if(!group)return;const raw=group.words.map(w=>w.text);let size=55;let widths;
 do{c.font=`700 ${size}px Montserrat`;widths=raw.map(w=>c.measureText(w).width);if(widths.reduce((a,b)=>a+b,0)+18*(raw.length-1)<=840)break;size--;}while(size>34);
 let x=520-(widths.reduce((a,b)=>a+b,0)+18*(raw.length-1))/2;c.save();c.globalAlpha=at(t,group.start-.02,.12);raw.forEach((w,i)=>{text(c,w,x,y,size,group.words[i].start<=t&&t<=group.words[i].end?accent:color,700);x+=widths[i]+18;});c.restore();
}
export function brand(c,logo,{dark=false,x=78,y=188,width=236}={}){if(logo)c.drawImage(logo,x,y,width,width*logo.height/logo.width);}
export function check(c,x,y,p=1,color=C.green){c.save();c.beginPath();c.rect(x-30,y-35,70*p,75);c.clip();line(c,[[x-21,y],[x-4,y+17],[x+29,y-24]],color,8);c.restore();}
export function sparkle(c,x,y,t,start,size=35,color=C.purple){const p=at(t,start,.22)*(1-at(t,start+.55,.3));if(!p)return;c.save();c.translate(x,y);c.rotate((t-start)*.9);c.scale(p,p);c.fillStyle=color;c.beginPath();c.moveTo(0,-size);c.quadraticCurveTo(size*.15,-size*.12,size,0);c.quadraticCurveTo(size*.15,size*.12,0,size);c.quadraticCurveTo(-size*.15,size*.12,-size,0);c.quadraticCurveTo(-size*.15,-size*.12,0,-size);c.fill();c.restore();}
export function footnote(c,s='Ejemplo ilustrado · Funciones según el plan',dark=false,y=1400){center(c,s,520,y,21,dark?'#D3BDDF':'#766780',500,850);}
export function cta(c,t,b,{y=1250,dark=false}={}){const p=at(t,b.events.closing,.45);c.save();c.globalAlpha=p;c.translate(0,(1-p)*35);rect(c,230,y,610,100,50,dark?'#E2BCF7':C.ink);center(c,b.cta||'Conocé Glowfy',520,y+65,43,dark?C.ink:'#FFF8FF',700,550);center(c,'getglowfy.com',520,y+156,28,dark?'#E5D3EE':C.dark,500);c.restore();}
export function curved(c,pts,color,width=5){c.beginPath();c.moveTo(...pts[0]);c.bezierCurveTo(...pts[1],...pts[2],...pts[3]);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
