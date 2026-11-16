// Trusted, deterministic Glowfy illustration. No model-authored executable code.
import {C,at,mix,rect,oval,text,shadow,noShadow,gradient,line,hand,polish,phone} from './objects.mjs';
function background(c,t){
 c.fillStyle='#F8F2F7';c.fillRect(0,0,1080,1920);
 const g=c.createRadialGradient(790,570,50,680,860,1200);g.addColorStop(0,'#FFF8EC');g.addColorStop(.5,'#F0DDEB');g.addColorStop(1,'#CDA7D8');c.fillStyle=g;c.fillRect(0,0,1080,1920);
 // Architectural wall, arched mirror, beauty shelves and warm practical lighting.
 c.save();c.globalAlpha=.33;for(let i=0;i<10;i++){c.fillStyle='#AD7CA433';c.fillRect(i*125,0,2,1500);}c.restore();
 shadow(c,.11,45,10);rect(c,710,395,330,650,[165,165,12,12],gradient(c,710,395,330,650,['#E0B8D0','#F9E9EA','#DDBED8']));noShadow(c);
 c.strokeStyle='#FFF9ED';c.lineWidth=9;c.beginPath();c.roundRect(724,408,302,620,[151,151,6,6]);c.stroke();
 c.save();c.globalAlpha=.32;for(let y of [686,851]){rect(c,14,y,240,17,5,'#855D78');for(let i=0;i<6;i++){const x=24+i*39;rect(c,x,y-57-(i%3)*7,25,50+(i%3)*7,7,['#BB84AA','#D5B3C8','#9E6F99'][i%3]);rect(c,x+4,y-77-(i%3)*7,17,25,4,'#5A4058');}}c.restore();
 for(const x of [140,950]){line(c,[[x,0],[x,180]],'#A38194',3);const glow=c.createRadialGradient(x,210,5,x,210,190);glow.addColorStop(0,'#FFF2D9AA');glow.addColorStop(1,'#FFF2D900');c.fillStyle=glow;c.fillRect(x-190,20,380,380);oval(c,x,210,40,52,'#FFF1DA');}
 // The desk anchors contact shadows and the object choreography.
 c.fillStyle=gradient(c,0,1240,0,680,['#F2DDE9','#E8C9DC','#FAF0F4']);c.beginPath();c.moveTo(0,1330);c.quadraticCurveTo(540,1170,1080,1330);c.lineTo(1080,1920);c.lineTo(0,1920);c.closePath();c.fill();
 const wash=c.createLinearGradient(0,0,0,1920);wash.addColorStop(0,'#FCF8FAEE');wash.addColorStop(.3,'#FCF8FA55');wash.addColorStop(.7,'#FCF8FA00');wash.addColorStop(1,'#FAF7FDEE');c.fillStyle=wash;c.fillRect(0,0,1080,1920);
}
function title(c,s,y,color=C.ink){
 let size=76;
 const words=s.split(/\s+/);let lines=[],row='';c.font=`700 ${size}px Montserrat`;
 for(const w of words){if(c.measureText((row+' '+w).trim()).width>820&&row){lines.push(row);row=w;}else row=(row+' '+w).trim();}if(row)lines.push(row);
 lines.slice(0,3).forEach((l,i)=>text(c,l,90,y+i*(size+8),size,color,700));
}
function calendar(c,t,e){
 const appear=at(t,e.calendar,.7),hold=at(t,e.closing,.6);if(!appear)return;
 c.save();c.translate(mix(mix(1110,350,appear),640,hold),mix(900,760,hold));c.rotate(mix(.14,-.035,appear)*(1-hold));c.scale(mix(mix(.85,1,appear),.62,hold),mix(mix(.85,1,appear),.62,hold));c.globalAlpha=appear;
 shadow(c,.17,48,20);rect(c,-300,-310,600,620,32,'#FFFDFE');noShadow(c);
 rect(c,-300,-310,600,112,[32,32,0,0],'#E8D2F4');text(c,'Tu agenda',-266,-242,40,C.dark,700);text(c,'MIÉRCOLES',-265,-155,19,'#826A90',600);
 const rows=['10:00','11:00','12:00','15:00','16:00'];rows.forEach((s,i)=>{const y=-95+i*72;text(c,s,-266,y+10,19,'#9A87A5',500);line(c,[[-188,y+27],[265,y+27]],'#F0E8F3',2);});
 const insert=at(t,e.calendar+.65,.45);c.save();c.globalAlpha=insert;c.translate((1-insert)*65,0);rect(c,-180,157,425,93,14,'#E8D7F4');rect(c,-180,157,6,93,3,C.purple);text(c,'Manicure',-153,194,25,C.dark,700);text(c,'16:00 · Cita agendada',-153,227,19,C.dark,500);c.restore();
 const remind=at(t,e.reminder,.45);if(remind&&hold<1){c.save();c.globalAlpha=remind*(1-hold);c.translate(0,(1-remind)*30);shadow(c,.12,20,9);rect(c,-200,285,510,105,22,'#F4FFF8');noShadow(c);oval(c,-155,335,23,23,'#D8F0E2');line(c,[[-165,335],[-157,343],[-144,326]],C.green,4);text(c,'Recordatorio preparado',-117,331,21,C.green,600);text(c,'Funciones según tu plan',-117,359,17,C.green,500);c.restore();}
 c.restore();
}
function pending(c,t,e){
 if(t>=e.phoneFocus+.6)return;const fade=1-at(t,e.phoneFocus,.4);
 [{time:e.messageOne,x:510,y:715,msg:'¿Tienes lugar mañana?'},{time:e.messageTwo,x:605,y:904,msg:'¿Me confirmas mi cita?'}].forEach((n,i)=>{const a=at(t,n.time,.4);if(!a)return;c.save();c.globalAlpha=a*fade;c.translate(n.x+(1-a)*90,n.y-(1-a)*16);c.rotate(i?.035:-.04);shadow(c,.18,35,17);rect(c,-264,-57,528,114,23,'#FFFDFE');noShadow(c);oval(c,-213,0,29,29,'#E9D8F4');text(c,'…',-227,8,30,C.dark,700);text(c,'NUEVO MENSAJE',-166,-18,15,'#9276A1',600);text(c,n.msg,-166,18,23,C.ink,600);c.restore();});
}
function caption(c,t,beats){
 const active=beats.captions.find(x=>t>=x.start&&t<x.end);if(!active)return;
 let size=46;const lineText=active.words.map(w=>w.text).join(' ');c.font=`600 ${size}px Montserrat`;while(size>31&&c.measureText(lineText).width>800){size--;c.font=`600 ${size}px Montserrat`;}
 const total=c.measureText(lineText).width;const x=(1010-total)/2,y=t>=beats.events.closing?1310:1455;
 shadow(c,.08,20,5);rect(c,x-25,y-51,total+50,77,21,'#FFFDFEF5');noShadow(c);
 let cursor=x;for(const w of active.words){text(c,w.text,cursor,y,size,t>=w.start&&t<=w.end+.04?C.dark:'#675572',600);cursor+=c.measureText(w.text+' ').width;}
}
export function draw(c,t,{width=1080,height=1920,beats,logo}={}){
 const e=beats.events,focus=at(t,e.phoneFocus,.85),cal=at(t,e.calendar,.75),closing=at(t,e.closing,.8);
 c.save();c.scale(width/1080,height/1920);background(c,t);
 if(logo)c.drawImage(logo,90,185,250,250*logo.height/logo.width);
 let scene=beats.scenes[0];for(const s of beats.scenes)if(t>=s.start)scene=s;
 const enter=scene.index?at(t,scene.start,.4):1;c.save();c.globalAlpha=enter;c.translate(0,18*(1-enter));title(c,[scene.text,'La conversación sigue.','Un lugar en tu agenda.','Tu talento, en primer plano.'][scene.index],360,scene.index===3?C.dark:C.ink);c.restore();
 // One persistent phone: the consultation survives each camera move.
 c.save();c.translate(mix(385,-350,focus),mix(1085,1450,focus));c.rotate(-.1*focus);c.scale(1.08,1.08);c.globalAlpha=1-focus;hand(c,t);c.restore();
 c.save();c.translate(mix(165,-220,focus),mix(1325,1500,focus));c.globalAlpha=1-focus;polish(c);c.restore();
 let px=mix(mix(758,515,focus),795,cal),py=mix(mix(1120,1000,focus),927,cal),scale=mix(mix(.83,1.12,focus),.73,cal);
 px=mix(px,800,closing);py=mix(py,1040,closing);scale=mix(scale,.62,closing);
 c.save();c.translate(px,py);c.rotate(mix(.12,-.035,focus)+cal*.075);c.scale(scale,scale);phone(c,t,e);c.restore();
 calendar(c,t,e);pending(c,t,e);
 if(closing){c.save();c.translate(305,935);c.scale(.93,.93);c.globalAlpha=closing;hand(c,3);c.restore();}
 if(focus){c.save();c.globalAlpha=focus;text(c,'Ejemplo ilustrado · Funciones según el plan',132,closing?1240:1329,22,'#7E678B',500);c.restore();}
 caption(c,t,beats);
 if(closing){c.save();c.globalAlpha=closing;shadow(c,.12,22,8);rect(c,245,1385,580,90,45,C.dark);noShadow(c);text(c,'Conoce Glowfy',316,1443,37,'#FFFFFF',700);line(c,[[739,1429],[773,1429],[761,1417]],'#fff',4);line(c,[[773,1429],[761,1441]],'#fff',4);text(c,'getglowfy.com',373,1525,31,C.dark,600);c.restore();}
 c.restore();
}
