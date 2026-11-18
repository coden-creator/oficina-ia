// A project-specific 2.5D studio. All transforms are sampled from absolute time.
import {C,at,mix,rect,oval,shadow,noShadow,gradient,line,label,center,check,sparkle,captions,clamp} from './unique-common.mjs';
const palette={ink:'#21102E',cream:'#FAF7FD',lilac:'#D4AFE9',purple:'#AD52E0',pink:'#F2B4D0'};
function title(c,lines,x,y,size=92,{color=palette.ink,serif=false,alpha=1}={}){c.save();c.globalAlpha*=alpha;lines.forEach((s,i)=>label(c,s,x,y+i*size*1.05,size,color,serif?400:700,880,serif?'Instrument Serif':'Montserrat'));c.restore();}
function studio(c,t,dark=false){
 c.fillStyle=gradient(c,0,0,1080,1920,dark?['#160D24','#3A1B4B','#261532']:['#EDE0EF','#FCF7F1','#DEC9E8']);c.fillRect(0,0,1080,1920);
 const g=c.createRadialGradient(790,500,40,500,900,1100);g.addColorStop(0,dark?'#DA9FF01F':'#FFFFFFB0');g.addColorStop(.55,dark?'#8D4BAC11':'#FFF5E344');g.addColorStop(1,'#FFFFFF00');c.fillStyle=g;c.fillRect(0,0,1080,1920);
 // Recessed architectural arch, floor and a shaped diagonal key light.
 c.save();c.globalAlpha*=dark?.16:.4;c.strokeStyle=dark?'#BF80D6':'#C1A0CE';c.lineWidth=3;
 for(let i=0;i<5;i++){c.beginPath();c.roundRect(620+i*18,315+i*15,550-i*25,1100,260-i*10);c.stroke();}
 c.fillStyle=dark?'#AD70CE0A':'#FFFFFF35';c.beginPath();c.moveTo(330,0);c.lineTo(520,0);c.lineTo(1080,1100);c.lineTo(1080,1450);c.closePath();c.fill();c.restore();
 const floor=c.createLinearGradient(0,1170,0,1830);floor.addColorStop(0,'#63318A00');floor.addColorStop(1,dark?'#130A1C90':'#8D6E9A22');c.fillStyle=floor;c.fillRect(0,1170,1080,750);
 c.save();c.globalAlpha=.09;for(let i=0;i<130;i++){const x=(i*139.13)%1080,y=(i*251.77)%1920;oval(c,x,y,.8,.8,dark?'#FFFFFF':'#3D2150');}c.restore();
}
function floorShadow(c,x,y,w,h,alpha=.2){c.save();const g=c.createRadialGradient(x,y,0,x,y,w);g.addColorStop(0,`rgba(37,14,49,${alpha})`);g.addColorStop(1,'rgba(37,14,49,0)');c.translate(x,y);c.scale(1,h/w);c.fillStyle=g;c.translate(-x,-y);c.fillRect(x-w,y-w,w*2,w*2);c.restore();}
function plane(c,x,y,s,angle,tilt,fn){c.save();c.translate(x,y);c.rotate(angle);c.transform(s,tilt*s,-tilt*.25*s,s*.98,0,0);fn();c.restore();}
function edgeRect(c,x,y,w,h,r,fill,depth=10){for(let d=depth;d>0;d-=2)rect(c,x+d*.45,y+d,w,h,r,'#A681B6');shadow(c,.17,34,21);rect(c,x,y,w,h,r,fill);noShadow(c);c.strokeStyle='#FFFFFFB0';c.lineWidth=2;c.beginPath();c.roundRect(x+1,y+1,w-2,h-2,r);c.stroke();}
function chat(c,message,{w=630,meta='Tu clienta',selected=false}={}){
 const fill=selected?gradient(c,-w/2,-90,w,180,['#EBCBF7','#CFA3E8']):gradient(c,-w/2,-90,w,180,['#FFFFFF','#F5EAF8']);edgeRect(c,-w/2,-90,w,180,28,fill,9);
 oval(c,-w/2+62,-5,30,30,selected?'#FFFFFFA0':'#EEDFF5');c.strokeStyle='#9671AB';c.lineWidth=3;c.beginPath();c.roundRect(-w/2+45,-21,34,26,8);c.stroke();line(c,[[-w/2+51,3],[-w/2+47,14],[-w/2+63,4]],'#9671AB',3);
 label(c,meta,-w/2+113,-25,20,'#82618F',600,w-150);label(c,message,-w/2+113,29,40,palette.ink,600,w-155);
}
function trail(c,t,{x=520,y=900,w=340,h=210,dark=false,progress=1}={}){
 c.save();c.translate(x,y);c.rotate(-.1);c.lineWidth=11;c.strokeStyle=dark?'#9A62BC':'#CEACE1';c.beginPath();for(let i=0;i<=100*progress;i++){const a=i/100*Math.PI*2.3,px=Math.cos(a)*w,py=Math.sin(a)*h+i*.7;i?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();
 c.lineWidth=3;c.strokeStyle=dark?'#F3D0FF':'#FFFFFF';c.setLineDash([70,700]);c.lineDashOffset=-t*150;c.stroke();c.restore();
}
function timeTile(c,value,{active=false,w=330,h=270,p=1}={}){c.save();c.scale(p,p);edgeRect(c,-w/2,-h/2,w,h,34,active?gradient(c,-w/2,-h/2,w,h,['#AE5FD8','#723F91']):gradient(c,-w/2,-h/2,w,h,['#FFFEFE','#EDDEF4']),16);label(c,'Mañana',-w/2+35,-h/2+55,23,active?'#F4DCFF':'#93749F',500,w-70);center(c,value,0,35,86,active?'#FFFFFF':palette.ink,700,w-40);if(active){oval(c,w/2-40,h/2-38,23,23,'#F5E5FF');check(c,w/2-40,h/2-38,.55,'#6B3787');}c.restore();}
function tint(a,b,p){const nums=x=>x.match(/[a-f0-9]{2}/gi).map(n=>parseInt(n,16));const aa=nums(a),bb=nums(b);return '#'+aa.map((v,i)=>Math.round(mix(v,bb[i],p)).toString(16).padStart(2,'0')).join('');}
function paper(c,elapsed){
 const p=at(elapsed,0,.85),w=mix(400,680,p),h=mix(340,560,p);c.save();
 edgeRect(c,-w/2,-h/2,w,h,mix(34,24,p),gradient(c,-w/2,-h/2,w,h,[tint('AE5FD8','FFFFFF',p),tint('723F91','F6ECF8',p)]),mix(16,8,p));
 const reveal=at(elapsed,.25,.45);c.save();c.globalAlpha*=reveal;rect(c,-w/2,-h/2,w,110,[24,24,0,0],gradient(c,-w/2,0,w,0,['#DFC2EE','#F1DDF6']));label(c,'Tu próxima cita',-w/2+44,-h/2+72,39,palette.ink,600,w-100);label(c,'Manicure',-w/2+44,-58,72,palette.ink,600,w-88);c.restore();
 const timeSize=mix(86,108,p);c.font=`700 ${timeSize}px Montserrat`;const centered=-c.measureText('16:00').width/2;label(c,'16:00',mix(centered,-w/2+40,p),mix(35,116,p),timeSize,tint('FFFFFF','8D43B4',p),700,w-40);
 label(c,'Mañana',mix(-w/2+35,-w/2+47,p),mix(-h/2+55,6,p),mix(23,29,p),tint('F4DCFF','9675A7',p),500,w-88);
 const stamp=at(elapsed,.55,.3);c.save();c.translate(mix(w/2-40,w/2-100,p),mix(h/2-38,55,p));oval(c,0,0,mix(23,54,p),mix(23,54,p),tint('F5E5FF','E1EEE6',p));check(c,0,0,.55+.45*stamp,tint('6B3787','397855',p));c.restore();
 c.save();c.globalAlpha*=at(elapsed,.55,.3);c.setLineDash([4,12]);line(c,[[-w/2+25,h/2-104],[w/2-25,h/2-104]],'#C8AAD5',2);c.setLineDash([]);center(c,'Del chat a tu agenda',0,h/2-47,30,'#745185',500,w-90);c.restore();
 const fold=24+30*(1-p);c.save();c.globalAlpha*=p;c.fillStyle='#D9BFE4';c.beginPath();c.moveTo(w/2-fold,-h/2);c.lineTo(w/2,-h/2+fold);c.lineTo(w/2-fold,-h/2+fold);c.closePath();c.fill();c.restore();c.restore();
}
function beautyObject(c,x,y,s,angle=0){plane(c,x,y,s,angle,0,()=>{shadow(c,.18,25,20);rect(c,-50,-40,100,140,24,gradient(c,-50,0,100,60,['#A05A99','#E9B8DA','#9A518F']));noShadow(c);rect(c,-39,-157,78,124,15,gradient(c,-39,0,78,0,['#3F2A49','#7A5987','#302038']));for(let i=0;i<7;i++)rect(c,-26+i*8,-145,2,97,1,'#FFFFFF12');rect(c,-37,0,74,60,7,'#F7ECF5');center(c,'color',0,39,25,'#684378',500,65);rect(c,-40,-20,5,83,2,'#FFFFFF65');});}
function opening(c,t,b){
 studio(c,t);const end=b.shots[0].end,p=at(t,0,end);title(c,['Tantas','preguntas.'],88,425,118,{serif:true});
 // Establish the conversation in a large diagonal close-up, then reveal its layers.
 const zoom=mix(1.3,.95,p);floorShadow(c,580,1285,470,100,.22);
 plane(c,620,790,zoom,-.12+at(t,0,end)*.05,.04,()=>chat(c,'¿Tenés lugar?',{w:620}));
 const a=at(t,.35,.42);plane(c,mix(1100,650,a),1030,mix(.65,.9,a),.09,.025,()=>{c.globalAlpha*=a;chat(c,'¿Mañana?',{w:570});});
 const d=at(t,.9,.4);plane(c,mix(-200,340,d),1200,.72,-.055,-.025,()=>{c.globalAlpha*=d;chat(c,'¿A qué hora?',{w:570});});
}
function threadScene(c,t,b){
 studio(c,t);const s=b.shots[1],p=at(t,s.start,s.end-s.start);title(c,['Una conversación.'],84,385,79,{serif:true});title(c,['Muchas vueltas.'],84,477,68);
 trail(c,t,{x:510,y:950,w:310,h:225,progress:.25+.75*p});
 const items=[['¿Tenés lugar?',305,750,-.14,.68],['¿Mañana?',735,890,.08,.78],['Para manicure',415,1125,-.04,.86]];
 items.forEach(([str,x,y,a,z],i)=>plane(c,x+(i%2?1:-1)*35*p,y-55*p,z,a+p*.02,0,()=>chat(c,str,{w:540})));
 sparkle(c,720,1195,t,s.start+.15,24);beautyObject(c,930,1370,.8,-.15);
}
function options(c,t,b){
 studio(c,t,true);const s=b.shots[2],p=at(t,s.start,s.end-s.start);title(c,['El horario','empieza a encajar.'],86,390,87,{color:'#F9ECFF',serif:true});
 trail(c,t,{x:540,y:1000,w:350,h:245,dark:true,progress:at(t,s.start,.8)});
 floorShadow(c,520,1320,400,80,.35);
 const a=at(t,s.start+.15,.55),d=at(t,s.start+.43,.55);
 plane(c,340-25*p,850+45*p,(.95+.05*p)*a,-.16+.1*p,.06,()=>timeTile(c,'11:00'));
 plane(c,730-45*p,1125-80*p,(1.04+.08*p)*d,.12-.08*p,-.05,()=>timeTile(c,'16:00'));
 const m=at(t,s.start+.7,.5);c.save();c.globalAlpha*=m;label(c,'Disponibilidad por WhatsApp',88,1365,30,'#E2BEEB',500,840);c.restore();
}
function choice(c,t,b){
 studio(c,t,true);const s=b.shots[3],p=at(t,s.start,.7),hold=at(t,s.start+.7,Math.max(.6,s.end-s.start-.7));
 title(c,['Ese horario.'],88,406,113,{serif:true,color:'#F9EBFF'});title(c,['Esa clienta.'],88,514,74,{color:'#E3BCF3'});
 trail(c,t,{x:500,y:990,w:335,h:250,dark:true});
 plane(c,mix(690,520,p),mix(1060,940,p),(1.14+.12*p)+.03*hold,mix(.08,-.055,p),-.015,()=>timeTile(c,'16:00',{active:true,w:400,h:340}));
 const reply=at(t,s.start+.35,.5);plane(c,mix(-340,500,reply),1250,.87,-.045,0,()=>{c.globalAlpha*=reply;chat(c,'16:00, por favor.',{w:690,selected:true,meta:'Horario elegido'});});
 sparkle(c,815,770,t,s.start+.1,33,'#F4DAFF');sparkle(c,225,1100,t,s.start+.26,22,'#F4DAFF');
}
function ticketScene(c,t,b){
 studio(c,t);const s=b.shots[4],p=at(t,s.start,.85),hold=at(t,s.start+.85,Math.max(.8,s.end-s.start-.85));
 title(c,['Del chat'],88,382,103,{serif:true});title(c,['a tu agenda.'],88,489,96,{serif:true});
 // The selected tile becomes a physical paper object on the same studio plane.
 c.save();c.translate(520,1010);c.rotate(mix(.18,-.045,p));c.transform(1,.04,-.05,1,0,0);shadow(c,.16,50,38);rect(c,-445,-355,890,700,55,gradient(c,-445,-355,890,700,['#D4B5E5','#F5E8FC']));noShadow(c);c.restore();
 floorShadow(c,550,1330,390,70,.22);
 plane(c,520,mix(940,970,p),mix(1.26,1,p)*(1+.025*hold),mix(-.055,-.04,p),mix(-.015,0,p),()=>paper(c,t-s.start));
 beautyObject(c,943,1200,.72,.19);sparkle(c,180,1150,t,s.start+.85,25);
}
function closing(c,t,b,logo){
 studio(c,t);const s=b.shots[5],p=at(t,s.start,.85);c.save();c.globalAlpha*=p;
 if(logo)c.drawImage(logo,96,340,600,600*logo.height/logo.width);c.restore();
 title(c,['Tu próxima cita,','en su lugar.'],94,630,77,{serif:true,alpha:p});
 floorShadow(c,535,1330,390,75,.2);plane(c,520,1020,mix(.98,.79,p),mix(-.04,.025,p),0,()=>paper(c,2));beautyObject(c,902,1275,.8,-.08);
 const button=at(t,s.start+.35,.45);c.save();c.globalAlpha*=button;rect(c,220,1370,620,98,49,gradient(c,220,1370,620,98,['#422150','#6C3882']));center(c,'Conocé Glowfy',530,1434,42,'#FFFFFF',600,550);center(c,'getglowfy.com',530,1515,27,'#694779',500);c.restore();
}
const scenes=[opening,threadScene,options,choice,ticketScene,closing];
export function draw(c,t,{width=1080,height=1920,beats:b,logo,whiteLogo}={}){
 c.save();c.scale(width/1080,height/1920);let i=b.shots.findIndex(s=>t>=s.start&&t<s.end);if(i<0)i=b.shots.length-1;
 const entering=i>0?at(t,b.shots[i].start,.24):1;
 if(entering<1){scenes[i-1](c,t,b,logo);c.save();c.globalAlpha=entering;scenes[i](c,t,b,logo);c.restore();}else scenes[i](c,t,b,logo);
 const dark=i===2||i===3;
 if(i!==5&&logo){c.save();c.globalAlpha=.92;const l=dark?whiteLogo:logo;c.drawImage(l,84,215,220,220*l.height/l.width);c.restore();}
 // Subtitles are kept above the mobile platform controls, independent of camera movement.
 if(i!==5)captions(c,t,b,{y:1430,color:dark?'#FFF6FF':palette.ink,accent:dark?'#E6B5FF':'#8742A4'});
 const vignette=c.createLinearGradient(0,1580,0,1920);vignette.addColorStop(0,'#21102E00');vignette.addColorStop(1,dark?'#130A2440':'#B89ACA10');c.fillStyle=vignette;c.fillRect(0,1580,1080,340);
 if(i!==5){c.save();c.globalAlpha=.8;center(c,'Ejemplo ilustrado · Funciones según tu plan',520,1535,22,dark?'#DBC7E4':'#705C7A',500,850);c.restore();}
 c.restore();
}
