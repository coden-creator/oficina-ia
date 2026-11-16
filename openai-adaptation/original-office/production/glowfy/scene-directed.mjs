// Trusted object vocabulary, composed by the office's declarative edit plan.
// No evaluated code, remote assets, mutable simulation, clocks or randomness.
import {C,at,mix,rect,oval,shadow,noShadow,gradient,line,label,center,captions} from './unique-common.mjs';
import {hand,polish} from './objects.mjs';
const ink='#25172F',ivory='#FAF7FD',lilac='#DBBCEB';
function solid(c,x,y,w,h,r,colors=['#FFFFFF','#EADBF1'],depth=12){
 for(let d=depth;d>0;d-=3)rect(c,x+d*.3,y+d,w,h,r,'#A988B5');
 shadow(c,.16,24,14);rect(c,x,y,w,h,r,gradient(c,x,y,w,h,colors));noShadow(c);
 c.strokeStyle='#FFFFFF90';c.lineWidth=1.5;c.beginPath();c.roundRect(x+1,y+1,w-2,h-2,r);c.stroke();
}
function background(c,setting,t){
 const dark=setting==='night';
 c.fillStyle=gradient(c,0,0,1080,1920,dark?['#170E21','#3C2249','#201327']:['#F6EEF5','#FBF7F1','#DECDE5']);c.fillRect(0,0,1080,1920);
 const light=c.createRadialGradient(230,550,10,540,900,1200);light.addColorStop(0,dark?'#CC93E51F':'#FFFFFFC0');light.addColorStop(1,'#FFFFFF00');c.fillStyle=light;c.fillRect(0,0,1080,1920);
 if(setting==='salon'||dark){
  c.save();c.globalAlpha=dark?.19:.35;
  for(let i=0;i<3;i++){const x=90+i*360;c.strokeStyle=dark?'#C28CD8':'#B69AC5';c.lineWidth=5;c.beginPath();c.roundRect(x,420,260,950,[140,140,8,8]);c.stroke();
   const fill=c.createLinearGradient(x,400,x+260,1200);fill.addColorStop(0,dark?'#E1BBEC10':'#FFFFFF80');fill.addColorStop(1,'#8D63952A');rect(c,x+10,430,240,930,[130,130,2,2],fill);}
  c.restore();
  for(let i=0;i<4;i++){c.save();c.globalAlpha=.09;c.strokeStyle=dark?'#CBA3DC':'#9B7AA8';c.lineWidth=2;c.beginPath();c.moveTo(540,1290);c.lineTo(-700+i*800,1920);c.stroke();c.restore();}
 }else if(setting==='tabletop'){
  c.save();c.globalAlpha=.11;c.translate(540,1000);c.rotate(-.12);
  for(let i=0;i<14;i++){c.strokeStyle='#94769B';c.lineWidth=i%3===0?2:1;c.beginPath();c.moveTo(-950,-800+i*125);c.bezierCurveTo(-350,-840+i*125,200,-760+i*125,950,-820+i*125);c.stroke();}c.restore();
 }else{
  c.save();c.globalAlpha=.22;c.strokeStyle='#AD86BF';c.lineWidth=3;
  for(let i=0;i<4;i++){c.beginPath();c.ellipse(700,980,240+i*65,550+i*55,-.27,0,Math.PI*2);c.stroke();}c.restore();
 }
 // Ground light and a fixed, extremely fine texture; stable on random seeking.
 const floor=c.createLinearGradient(0,1190,0,1700);floor.addColorStop(0,'#331F4200');floor.addColorStop(1,dark?'#10091E55':'#8C68941A');c.fillStyle=floor;c.fillRect(0,1190,1080,510);
 c.save();c.globalAlpha=.09;for(let i=0;i<140;i++)oval(c,(i*137.59)%1080,(i*251.13)%1920,.7,.7,dark?'#FFF':'#51355E');c.restore();
}
function smallText(c,lines,x,y,size=30,color=ink,max=420,step=size*1.25){lines.forEach((s,i)=>label(c,s,x,y+i*step,size,color,600,max));}
function phone(c,o,p){
 solid(c,-170,-300,340,600,49,['#85758D','#251D2D'],10);rect(c,-159,-290,318,580,41,'#211929');
 c.save();c.beginPath();c.roundRect(-149,-280,298,560,34);c.clip();rect(c,-149,-280,298,560,0,'#FBF8FD');
 rect(c,-149,-280,298,116,0,gradient(c,-149,-280,298,116,['#EBD6F6','#F6EAF9']));
 rect(c,-48,-268,96,20,10,'#28202F');label(c,'Glowfy',-124,-210,29,ink,700,230);label(c,'Ejemplo ilustrado',-124,-180,14,'#795C87',500,240);
 const texts=o.text.length?o.text:['Agenda y atención'];
 texts.forEach((s,i)=>{const a=o.action==='reveal'?at(p,i*.17+.12,.14):1;c.save();c.globalAlpha*=a;c.translate((1-a)*(i%2?-32:32),(1-a)*12);const x=i%2?-104:-128,w=255;solid(c,x,-134+i*109,w,83,19,i%2?['#E8CAF4','#EBD8F5']:['#F3EDF7','#ECE6F0'],2);label(c,s,x+17,-84+i*109,25,ink,600,w-34);c.restore();});
 rect(c,-45,252,90,4,2,'#715980');c.restore();c.strokeStyle='#FFFFFF95';c.lineWidth=2;line(c,[[-160,-225],[-160,205]],'#FFFFFF60',2);
}
function agenda(c,o,p){
 const reveal=o.action==='open'?mix(.6,1,at(p,.08,.3)):1;c.save();c.transform(1,.08,-.03,reveal,0,0);
 solid(c,-248,-220,496,440,22,['#D7B3E7','#AE7FC1'],16);solid(c,-235,-208,470,410,13,['#FFFDF9','#F2EBF1'],6);
 line(c,[[0,-205],[0,200]],'#C6ABCF',3);for(let i=0;i<7;i++){oval(c,-3,-175+i*53,8,8,'#95759F');oval(c,-5,-177+i*53,4,4,'#F7EDF9');}
 smallText(c,o.text.slice(0,1).length?o.text.slice(0,1):['Tu agenda'],-207,-151,29,ink,195);
 for(let i=0;i<5;i++){line(c,[[-204,-110+i*59],[-28,-110+i*59]],'#DCCFE3',2);line(c,[[30,-110+i*59],[205,-110+i*59]],'#DCCFE3',2);}
 const a=o.action==='reveal'?at(p,.2,.25):1;c.save();c.globalAlpha*=a;rect(c,25,-93+(1-a)*40,185,122,12,gradient(c,25,-93,185,122,['#EDDBF5','#DBB9EC']));smallText(c,o.text.slice(1).length?o.text.slice(1):['Según tu plan'],39,-52,23,ink,157,32);c.restore();c.restore();
}
function desk(c){
 solid(c,-460,-85,920,175,45,['#FFFBF7','#E4D3E7'],25);
 for(const x of [-355,315]){rect(c,x,98,38,180,12,gradient(c,x,98,38,180,['#D6BADF','#A180AE']));rect(c,x+4,101,5,170,2,'#FFFFFF60');}
 c.strokeStyle='#C3A7CF';c.lineWidth=2;line(c,[[-395,35],[-90,35],[-70,27],[-48,35],[395,35]],'#CBB2D4',2);
}
function mirror(c){
 solid(c,-206,-300,412,600,[206,206,18,18],['#C49FD1','#F1DBF8','#9B78AC'],14);
 rect(c,-186,-280,372,558,[186,186,9,9],gradient(c,-186,-280,372,558,['#F6F1F7','#BFAAC9','#EADCEC']));
 c.save();c.beginPath();c.roundRect(-186,-280,372,558,[186,186,9,9]);c.clip();c.fillStyle='#FFFFFF55';c.beginPath();c.moveTo(-186,-280);c.lineTo(-65,-280);c.lineTo(185,200);c.lineTo(185,280);c.lineTo(90,280);c.closePath();c.fill();c.restore();
 rect(c,-230,285,460,34,13,'#BE9FCA');
}
function chair(c){
 solid(c,-150,-190,300,240,[80,80,24,24],['#DCAED0','#A467A1'],17);for(let i=0;i<5;i++)line(c,[[-100+i*50,-150],[-100+i*50,8]],'#FFFFFF22',3);
 solid(c,-165,45,330,86,25,['#D6A5CA','#A469A0'],18);rect(c,-14,145,28,115,10,gradient(c,-14,145,28,115,['#AE8EB9','#E5D8EC','#A284AD']));oval(c,0,270,138,24,'#A188AC');
}
function plant(c){
 for(let i=0;i<7;i++){const a=-1.4+i*.42,x=Math.cos(a)*95,y=-100-Math.sin(i*.7+1)*110;line(c,[[0,155],[x*.45,-20],[x,y]],'#668B72',6);c.save();c.translate(x,y);c.rotate(a);oval(c,0,0,26,70,gradient(c,-25,-70,50,140,['#426951','#91AA80']));c.restore();}
 solid(c,-66,70,132,150,[8,8,40,40],['#F4E4EE','#D5BCD9'],4);oval(c,0,70,66,15,'#988291');
}
function message(c,o,p){
 const a=o.action==='reveal'?at(p,.07,.22):1;c.save();c.scale(.9+.1*a,.8+.2*a);solid(c,-270,-90,540,180,31,['#FFFFFF','#EBDDF4'],10);
 oval(c,-216,-13,27,27,'#DDC0EB');c.strokeStyle='#9B63B5';c.lineWidth=3;c.beginPath();c.roundRect(-231,-25,30,24,7);c.stroke();
 smallText(c,o.text.length?o.text:['Atención de Glowfy'],-165,-16,32,ink,390,39);c.restore();
}
function envelope(c,o,p){
 const a=o.action==='open'?at(p,.12,.28):0;
 c.save();c.translate(0,-a*65);solid(c,-190,-130,380,245,15,['#FFFFFF','#F7EFF9'],3);smallText(c,o.text.length?o.text:['Seguimiento'], -159,-55,31,ink,325,41);c.restore();
 solid(c,-220,-50,440,260,18,['#D6AFE8','#B88DCD'],7);
 c.fillStyle='#E1C6EE';c.beginPath();c.moveTo(-220,-50);c.lineTo(0,90-a*300);c.lineTo(220,-50);c.closePath();c.fill();
 line(c,[[-215,199],[0,60],[215,199]],'#EBD8F4',3);
}
function clock(c,o,p){
 shadow(c,.2,25,18);oval(c,0,0,156,156,gradient(c,-156,-156,312,312,['#E2C9EC','#9460AA']));noShadow(c);oval(c,0,0,141,141,'#FFFCFA');
 for(let i=0;i<12;i++){const a=i*Math.PI/6;line(c,[[Math.sin(a)*119,-Math.cos(a)*119],[Math.sin(a)*128,-Math.cos(a)*128]],'#AB87B9',i%3===0?4:2);}
 const angle=o.action==='turn'?mix(-.4,1.2,at(p,.1,.45)):.7;line(c,[[0,0],[Math.sin(angle)*94,-Math.cos(angle)*94]],ink,7);line(c,[[0,0],[-45,-50]],'#9660AD',10);oval(c,0,0,9,9,'#C48DE0');
 if(o.text[0])center(c,o.text[0],0,79,22,'#8F6B9D',600,205);
}
function ribbon(c,o,p){
 c.save();c.lineCap='round';const reveal=o.action==='draw'?at(p,.03,.7):1;
 for(let d=9;d>=0;d-=3){c.beginPath();for(let i=0;i<=100*reveal;i++){const a=i/100*Math.PI*2.15,x=Math.cos(a)*280,y=Math.sin(a)*140+i*.4+d;i?c.lineTo(x,y):c.moveTo(x,y);}c.lineWidth=14;c.strokeStyle=d?'#A47FBA':'#D8B0ED';c.stroke();}
 c.setLineDash([40,1250]);c.lineDashOffset=-p*150;c.lineWidth=3;c.strokeStyle='#FFF4FF';c.stroke();c.restore();
}
const painters={desk,phone,agenda,hand:(c,o,p)=>{c.save();c.scale(.85,.85);c.translate(0,-95);hand(c,o.action==='reveal'?p*4:3.5);c.restore();},polish:(c)=>polish(c),mirror,chair,plant,message,envelope,clock,ribbon};
function object(c,o,p,elapsed){
 let a=o.entry==='present'?1:at(p,o.delay/100,.17);c.save();c.globalAlpha*=a;
 let x=o.x,y=o.y,s=o.scale/100,r=o.rotation*Math.PI/180;
 if(o.entry==='left')x-=260*(1-a);if(o.entry==='right')x+=260*(1-a);if(o.entry==='rise')y+=100*(1-a);
 if(o.action==='withdraw'){const k=at(p,.4,.5);x+=240*k;y+=550*k;c.globalAlpha*=1-k;}
 if(o.action==='turn')r+=mix(-.14,.14,at(p,.12,.65));
 c.translate(x,y);c.rotate(r);c.scale(s,s);if(o.entry==='unfold')c.scale(1,.08+.92*a);
 painters[o.type](c,o,p,elapsed);c.restore();
}
function shot(c,t,b,s,logo,whiteLogo){
 const elapsed=t-s.start,p=Math.max(0,Math.min(1,elapsed/(s.end-s.start))),dark=s.setting==='night';background(c,s.setting,t);
 c.save();c.beginPath();c.rect(0,520,1080,805);c.clip();c.translate(520,960);
 const k=at(p,0,1);let zoom=1,dx=0,dy=0,angle=0;
 if(s.camera==='push')zoom=mix(.94,1.12,k);if(s.camera==='pull')zoom=mix(1.18,.95,k);
 if(s.camera==='track-left')dx=mix(55,-55,k);if(s.camera==='track-right')dx=mix(-55,55,k);
 if(s.camera==='orbit'){angle=mix(-.035,.035,k);dx=mix(26,-26,k);zoom=1.04;}
 if(s.camera==='overhead'){zoom=1.04;angle=mix(-.1,-.04,k);}
 c.translate(dx,dy);c.rotate(angle);c.scale(zoom,zoom);c.translate(-520,-960);
 for(const o of s.objects)object(c,o,p,elapsed);c.restore();
 const closing=s.scene===4,last=b.shots.at(-1)===s;
 c.save();c.globalAlpha*=elapsed<.3?at(elapsed,0,.3):1;
 const l=dark?whiteLogo:logo;if(l)c.drawImage(l,82,215,closing?310:220,(closing?310:220)*l.height/l.width);
 if(!last){s.headline.forEach((line,i)=>label(c,line,82,365+i*95,i===0?87:77,dark?'#FAEFFD':ink,i===0?400:700,850,i===0?'Instrument Serif':'Montserrat'));}
 else{label(c,'Conocé Glowfy',82,400,93,dark?'#F7EBFD':ink,400,850,'Instrument Serif');}
 c.restore();
 // Caption position and contrast are independent of object/camera choreography.
 rect(c,62,1332,910,112,26,dark?'#21132CEB':'#FAF7FDEB');captions(c,t,b,{y:1400,color:dark?'#FAF4FD':ink,accent:dark?'#E2B2FA':'#8744A5'});
 center(c,'Ejemplo ilustrado · Funciones según tu plan',520,1488,22,dark?'#D9C4E5':'#755E7D',500,880);
 if(last){c.save();c.globalAlpha=at(elapsed,.35,.5);rect(c,260,1145,550,94,47,dark?'#E3C4F2':'#49265B');center(c,'Conocé Glowfy',535,1206,38,dark?ink:'#FFF8FF',700,500);c.restore();}
}
export function draw(c,t,{width=1080,height=1920,beats:b,logo,whiteLogo}={}){
 c.save();c.scale(width/1080,height/1920);let i=b.shots.findIndex(s=>t>=s.start&&t<s.end);if(i<0)i=b.shots.length-1;const s=b.shots[i],blend=i>0&&s.transition!=='cut'?at(t,s.start,.26):1;
 if(blend<1){shot(c,b.shots[i-1].end-.001,b,b.shots[i-1],logo,whiteLogo);c.save();if(s.transition==='wipe'){c.beginPath();c.rect(0,0,1080*blend,1920);c.clip();}else c.globalAlpha=blend;shot(c,t,b,s,logo,whiteLogo);c.restore();}else shot(c,t,b,s,logo,whiteLogo);
 const fade=at(t,b.duration-.33,.33);if(fade){c.fillStyle=`rgba(25,13,33,${fade})`;c.fillRect(0,0,1080,1920);}c.restore();
}
