// Glowfy social revision: continuous object choreography, editorial captions and a shared sound cue map.
import {C,at,mix,rect,oval,text,shadow,noShadow,gradient,line,hand,polish,phone} from './objects.mjs';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
const pulse=(t,at,d=.42)=>t<at||t>at+d?0:Math.sin((t-at)/d*Math.PI);
function bg(c,t,dark){
 const colors=dark?['#30143F','#180F27','#311B48']:['#FCF4F4','#EED6E8','#D7B3DB'];c.fillStyle=gradient(c,0,0,1080,1920,colors);c.fillRect(0,0,1080,1920);
 // Salon architecture carries parallax and material, without competing with the device.
 c.save();c.translate(Math.sin(t*.35)*12,Math.cos(t*.2)*7);
 for(let i=0;i<9;i++){c.fillStyle=dark?'#FFFFFF04':'#6B356F0B';c.fillRect(i*150-60,0,3,1920);}
 const glow=c.createRadialGradient(760,740,0,760,740,680);glow.addColorStop(0,dark?'#BD69EF38':'#FFFFFFB5');glow.addColorStop(1,'#FFFFFF00');c.fillStyle=glow;c.fillRect(0,0,1080,1700);
 c.strokeStyle=dark?'#DBA7F122':'#FFF8F5A0';c.lineWidth=10;c.beginPath();c.roundRect(741,385,330,840,[165,165,15,15]);c.stroke();
 c.globalAlpha=dark?.18:.3;for(const y of [840,1018]){rect(c,-35,y,260,15,4,dark?'#C19CCF':'#906B85');for(let i=0;i<6;i++){rect(c,i*43-18,y-59-(i%3)*8,29,56+(i%3)*8,7,['#B36FC2','#DC9DB8','#CFADDD'][i%3]);rect(c,i*43-13,y-83-(i%3)*8,19,27,3,'#5B345D');}}c.globalAlpha=1;
 for(let i=0;i<9;i++){const x=(i*197+Math.sin(t*.18+i)*45)%1140,y=430+(i*179)%1110+Math.sin(t*.23+i)*22;oval(c,x,y,2+i%3,2+i%3,dark?'#E7B9FF33':'#FFFFFF80');}
 c.restore();const vignette=c.createLinearGradient(0,1250,0,1920);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,dark?'#11091BBB':'#FFF7FD99');c.fillStyle=vignette;c.fillRect(0,1250,1080,670);
}
function headline(c,lines,t,start,dark){
 const p=start===0?1:at(t,start,.28);c.save();c.globalAlpha=p;c.translate(0,(1-p)*35);
 lines.forEach((s,i)=>{let size=104;c.font=`700 ${size}px Montserrat`;while(size>65&&c.measureText(s).width>850){size--;c.font=`700 ${size}px Montserrat`;}
 text(c,s,80,355+i*113,size,i===lines.length-1?(dark?'#DEAAFF':C.dark):(dark?'#FFF7FF':C.ink),700);});c.restore();
}
function notification(c,t,start,x,y,angle,message,exit){
 const enter=at(t,start,.26),out=at(t,exit,.27);if(!enter||out===1)return;
 c.save();c.translate(x+(1-enter)*180-out*900,y+Math.sin(t*1.4+start)*7);c.rotate(angle);c.globalAlpha=enter*(1-out);const s=1+.07*pulse(t,start,.35);c.scale(s,s);
 shadow(c,.22,34,18);rect(c,-280,-58,560,116,23,'#FFF8FF');noShadow(c);oval(c,-225,0,29,29,'#D8B6EF');text(c,'…',-240,7,32,C.dark,700);text(c,'WhatsApp',-176,-17,17,C.dark,700);text(c,message,-176,21,25,C.ink,600);c.restore();
}
function pointer(c,t,time,x,y){
 const appear=at(t,time-.35,.25)*(1-at(t,time+.5,.3));if(!appear)return;
 c.save();c.translate(x+(1-at(t,time-.35,.35))*90,y+(1-at(t,time-.35,.35))*70);c.globalAlpha=appear;c.rotate(-.25);
 shadow(c,.25,12,5);c.beginPath();c.moveTo(0,0);c.lineTo(4,57);c.lineTo(19,43);c.lineTo(34,70);c.lineTo(46,62);c.lineTo(30,37);c.lineTo(51,31);c.closePath();c.fillStyle='#FFFFFF';c.fill();noShadow(c);c.strokeStyle=C.dark;c.lineWidth=3;c.stroke();c.restore();
 const ring=clamp((t-time)/.45);if(ring>0&&ring<1){c.save();c.globalAlpha=1-ring;c.strokeStyle='#D9AAFF';c.lineWidth=5;c.beginPath();c.arc(x,y,18+ring*45,0,TAU);c.stroke();c.restore();}
}
function clock(c,t,show){
 if(show<=0)return;c.save();c.translate(800,1120);c.rotate(.1*Math.sin(t));c.scale(show,show);shadow(c,.2,30,15);oval(c,0,0,104,104,'#C08DDA');noShadow(c);oval(c,0,0,91,91,'#FFF9FF');for(let i=0;i<12;i++){const a=i*TAU/12;c.save();c.rotate(a);rect(c,-2,-81,4,i%3?8:14,2,'#9D77B2');c.restore();}line(c,[[0,0],[43,25]],C.dark,9);line(c,[[0,0],[0,-64]],C.dark,7);oval(c,0,0,8,8,C.purple);c.restore();
}
function agenda(c,t,e,variant=null){
 const enter=at(t,e.calendar,.5),out=at(t,e.closing,.55);if(enter===0||out===1)return;
 c.save();c.translate(mix(1050,460,enter)-out*950,940+Math.sin(t*.9)*9);c.rotate(mix(.18,-.04,enter));c.globalAlpha=enter;
 shadow(c,.28,50,24);rect(c,-338,-321,676,642,35,'#FFFBFF');noShadow(c);rect(c,-338,-321,676,112,[35,35,0,0],'#E7C8F8');text(c,'Tu agenda',-294,-249,44,C.dark,700);text(c,'MIÉRCOLES',-294,-159,22,'#89699D',600);
 const rows=['10:00','11:00','12:00','15:00','16:00'];rows.forEach((h,i)=>{const y=-93+i*74;text(c,h,-294,y+10,24,'#9A81A8',500);line(c,[[-194,y+30],[294,y+30]],'#EBE0F0',2);});
 const book=at(t,e.calendar+.65,.4);if(book){c.save();c.globalAlpha=book;const x=mix(510,-185,book),y=mix(variant==='reschedule'?-50:-175,164,book);rect(c,x,y,470,96,17,'#DFC5F1');rect(c,x,y,8,96,4,C.purple);text(c,'Manicure',x+24,y+37,32,C.dark,700);text(c,variant==='reschedule'?'16:00 · Nuevo horario':'16:00 · Cita agendada',x+24,y+73,23,C.dark,600);c.restore();}
 const remind=at(t,e.reminder,.32);if(remind){c.save();c.globalAlpha=remind;c.translate(0,20*(1-remind));shadow(c,.2,25,10);rect(c,-190,287,520,108,23,'#E8F6F0');noShadow(c);oval(c,-140,339,26,26,C.green);line(c,[[-153,340],[-142,350],[-126,328]],'#fff',4);text(c,variant==='reminder'?'Recordatorio enviado':variant==='reschedule'?'Horario actualizado':'Recordatorio listo',-95,335,29,C.green,700);text(c,'Según tu plan',-95,369,21,C.green,500);c.restore();}c.restore();
}
function caption(c,t,b,dark){
 const group=b.captions.find(x=>t>=x.start-.03&&t<x.end);if(!group)return;
 const raw=group.words.map(w=>w.text);let size=59;const key=raw.reduce((best,w,i)=>/glowfy|mensaj|cita|manos|clienta|respond|agenda/i.test(w)?i:best,-1);
 const measure=()=>raw.map((w,i)=>{c.font=i===key?`400 ${size*1.22}px "Instrument Serif"`:`700 ${size}px Montserrat`;return c.measureText(w).width;});let widths=measure();while(widths.reduce((a,b)=>a+b,0)+(raw.length-1)*14>840&&size>38){size--;widths=measure();}
 const width=widths.reduce((a,b)=>a+b,0)+(raw.length-1)*14;let x=520-width/2;const enter=at(t,group.start-.03,.15),y=1620+(1-enter)*16;c.save();c.globalAlpha=enter;
 if(dark){c.shadowColor='#11091BCC';c.shadowBlur=15;c.shadowOffsetY=3;}
 raw.forEach((w,i)=>{text(c,w,x,y,i===key?size*1.22:size,i===key?(dark?'#DFAFFF':C.dark):(dark?'#FFF9FF':C.ink),i===key?400:700,i===key?'Instrument Serif':'Montserrat');x+=widths[i]+14;});c.restore();
}
export function draw(c,t,{width=1080,height=1920,beats,logo,whiteLogo}={}){
 const e=beats.events,focus=at(t,e.phoneFocus,.55),cal=at(t,e.calendar,.55),close=at(t,e.closing,.55),dark=t>=e.phoneFocus;
 c.save();c.scale(width/1080,height/1920);bg(c,t,dark);
 if(logo)c.drawImage(dark?whiteLogo:logo,80,190,245,245*logo.height/logo.width);
 const variant=beats.variant;
 const idx=t<e.phoneFocus?0:t<e.calendar?1:t<e.closing?2:3;
 const fallback=[['¿JUSTO','AHORA?'],['GLOWFY','RESPONDE.'],['DEL CHAT','A TU AGENDA.'],['VOS, CON','TU CLIENTA.']];
 const words=beats.sceneTitles?.[idx]?.toUpperCase().split(/\s+/);const split=words?Math.ceil(words.length/2):0;const title=words?[words.slice(0,split).join(' '),words.slice(split).join(' ')].filter(Boolean):fallback[idx];
 headline(c,title,t,[0,e.phoneFocus,e.calendar,e.closing][idx],dark);
 // Camera follows the same objects. Subtle live motion continues during reading holds.
 const drift=Math.sin(t*.85)*10;
 c.save();c.translate(302-660*focus+620*close,1090+150*focus-120*close);c.rotate(-.08+Math.sin(t*.8)*.018);c.scale(1.08-.18*close,1.08-.18*close);c.globalAlpha=clamp(1-focus+close);if(!variant||variant==='booking'||close>.5)hand(c,t<3?t:3);else {shadow(c,.2,30,15);rect(c,-165,-205,345,390,30,'#FFF9FF');noShadow(c);rect(c,-165,-205,345,90,[30,30,0,0],'#E7C8F8');text(c,variant==='reminder'?'TU CITA':'CAMBIO',-130,-148,34,C.dark,700);text(c,variant==='reminder'?'16:00':'11:00',-95,-45,49,C.dark,700);if(variant==='reschedule'){const p=at(t,.4,.8);line(c,[[-85,-24],[105,-24]],C.purple,4);text(c,'16:00',-95,54,60,C.purple,700);c.globalAlpha*=p;line(c,[[35,85],[35,122],[22,108]],C.dark,5);}else {text(c,'MAÑANA',-130,55,38,C.purple,700);text(c,'Recordatorio',-130,122,28,C.dark,500);}}c.restore();
 if(focus<1&&(!variant||variant==='booking')){c.save();c.translate(153-300*focus,1350);c.globalAlpha=1-focus;polish(c);c.restore();}
 const push=.06*at(t,e.assistant,.4)-.04*at(t,e.reply,.45);
 const px=mix(mix(mix(735,510,focus),835,cal),730,close)+drift,py=mix(mix(1080,1000,focus),1060,close)+Math.cos(t*.7)*9;
 const scale=mix(mix(1.02,1.27+push,focus),.62,cal)+close*.10;
 c.save();c.translate(px,py);const vibration=pulse(t,e.messageOne,.2)*Math.sin(t*65)*.018+pulse(t,e.messageTwo,.2)*Math.sin(t*70)*.018;c.rotate(mix(.12,-.025,focus)+Math.sin(t*.6)*.025+vibration);c.scale(scale,scale);phone(c,t,e,variant);c.restore();
 const notices=variant==='reminder'?['¿A qué hora era?','Se perdió en el chat…','Mañana tengo mi cita']:variant==='reschedule'?['¿Puedo cambiar mi cita?','No llego a las once','¿Hay otro horario?']:['¿Tienes lugar mañana?','¿A qué hora puedo ir?','16:00, por favor'];
 notification(c,t,e.messageOne,510,755,-.035,notices[0],e.phoneFocus-.18);notification(c,t,e.messageTwo,560,935,.045,notices[1],e.phoneFocus-.12);notification(c,t,e.messageThree,500,1120,-.025,notices[2],e.phoneFocus-.06);
 const clockShow=at(t,e.assistant+.4,.3)*(1-at(t,e.appointment,.3))*(1-close);clock(c,t,clockShow*.75);
 pointer(c,t,e.reply,600,1100);agenda(c,t,e,variant);
 if(focus&&!close){text(c,'Ejemplo ilustrado · Funciones según el plan',120,1350,23,'#CDB5DA',500);}
 if(close){c.save();c.globalAlpha=close;const tap=pulse(t,e.cta,.3);rect(c,230,1370,620,98,49,'#DDB0FA');text(c,beats.cta||'Conoce Glowfy',308,1435,42,C.ink,700);line(c,[[748,1413],[785,1413],[771,1399]],C.dark,5);line(c,[[785,1413],[771,1427]],C.dark,5);if(tap){c.strokeStyle='#F9E9FF';c.lineWidth=4;c.beginPath();c.roundRect(230-tap*13,1370-tap*8,620+tap*26,98+tap*16,52);c.stroke();}text(c,'getglowfy.com',369,1525,31,'#F0DDF9',600);c.restore();}
 caption(c,t,beats,dark);
 c.restore();
}
