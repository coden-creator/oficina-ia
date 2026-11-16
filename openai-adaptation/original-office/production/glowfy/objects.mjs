// Project-specific Canvas illustration. Absolute-time animation; no remote assets or model code.
const C={ink:'#23152F',purple:'#AD52E0',dark:'#63318A',cream:'#FAF7FD',pink:'#F2B4D0',green:'#246E56'};
const sat=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=sat(x);return x*x*x*(x*(x*6-15)+10)};
const mix=(a,b,k)=>a+(b-a)*k;
const at=(t,start,length=.55)=>ease((t-start)/length);
function rect(c,x,y,w,h,r,fill){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function text(c,s,x,y,size=32,color=C.ink,weight=600,family='Montserrat'){c.fillStyle=color;c.font=`${weight} ${size}px "${family}"`;c.fillText(s,x,y);}
function shadow(c,alpha=.15,blur=35,y=20){c.shadowColor=`rgba(54,25,70,${alpha})`;c.shadowBlur=blur;c.shadowOffsetY=y;}
function noShadow(c){c.shadowColor='transparent';c.shadowBlur=0;c.shadowOffsetY=0;}
function gradient(c,x,y,w,h,colors){const g=c.createLinearGradient(x,y,x+w,y+h);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g;}
function line(c,pts,color,width=3){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function pill(c,s,x,y,w,fill=C.purple,color='#fff'){rect(c,x,y,w,55,27,fill);text(c,s,x+23,y+36,22,color,600);}

function finger(c,x,y,w,h,rotation,nailColor){
 c.save();c.translate(x,y);c.rotate(rotation);
 shadow(c,.13,16,10);rect(c,-w/2,0,w,h,[w/2,w/2,w*.38,w*.38],gradient(c,-w/2,0,w,0,['#CE8F73','#F4C5AA','#E7AB8C']));noShadow(c);
 c.strokeStyle='#C5886F66';c.lineWidth=2;c.beginPath();c.arc(0,h*.72,w*.34,.18,Math.PI-.18);c.stroke();
 rect(c,-w*.34,9,w*.68,Math.min(76,h*.35),[w*.35,w*.35,19,19],gradient(c,-w*.34,9,w*.7,45,[nailColor,'#D99EBE',nailColor]));
 c.globalAlpha=.5;rect(c,-w*.23,20,7,36,4,'#FFFDFE');c.globalAlpha=1;c.restore();
}
function hand(c,t){
 c.save();c.rotate(-.16);
 shadow(c,.16,45,34);
 c.fillStyle=gradient(c,-110,0,230,70,['#CE8F73','#F5C4A9','#E1A184']);
 c.beginPath();c.moveTo(-105,95);c.bezierCurveTo(-130,170,-105,245,-71,292);c.lineTo(-61,435);c.quadraticCurveTo(10,461,90,427);c.lineTo(77,285);c.bezierCurveTo(130,245,148,170,113,102);c.closePath();c.fill();noShadow(c);
 finger(c,-88,-107,62,240,-.1,'#9B448A');finger(c,-26,-171,66,286,-.025,'#AF5B99');finger(c,42,-157,63,273,.07,'#8F397F');finger(c,102,-99,55,220,.16,'#A35493');
 c.save();c.translate(-101,165);c.rotate(-.68);finger(c,0,-29,70,151,0,'#A35493');c.restore();
 c.strokeStyle='#BC8B5A';c.lineWidth=13;c.beginPath();c.ellipse(42,57,30,9,.07,0,Math.PI);c.stroke();c.strokeStyle='#F5D99B';c.lineWidth=6;c.stroke();
 c.strokeStyle='#BD826B55';c.lineWidth=3;c.beginPath();c.moveTo(-60,192);c.bezierCurveTo(-15,205,28,204,55,185);c.stroke();
 // Brush applies one deliberate stroke; no oscillating motion after the action.
 const brush=at(t,.15,.65)*(1-at(t,2.5,.55));
 if(brush>0){c.save();c.globalAlpha=brush;c.translate(-24,-140+20*at(t,.9,.8));c.rotate(-.48);shadow(c,.13,12,6);rect(c,-8,-75,16,73,4,'#D9BB9E');rect(c,-10,-13,20,36,5,'#87336D');rect(c,-24,-215,48,150,9,gradient(c,-24,0,48,0,['#2C2232','#66556A','#211727']));noShadow(c);c.restore();}
 c.restore();
}
function polish(c){
 c.save();c.rotate(.12);shadow(c,.16,35,22);rect(c,-56,-29,112,130,26,gradient(c,-55,-30,112,120,['#CF98BD','#A44490','#6E2A61']));noShadow(c);
 c.strokeStyle='#EFCFE1';c.lineWidth=3;c.stroke();rect(c,-43,-145,86,122,12,gradient(c,-43,-140,86,0,['#302035','#6E5373','#291B2D']));
 for(let i=0;i<9;i++){c.fillStyle='#FFFFFF09';c.fillRect(-33+i*8,-132,2,95);}
 rect(c,-41,6,82,54,8,'#F6E8F0');text(c,'NAIL',-25,29,19,C.dark,600);text(c,'COLOR',-25,47,13,C.dark,500);
 c.globalAlpha=.45;rect(c,-41,-12,8,97,4,'#FFFFFF');c.restore();
}
function phone(c,t,e,variant=null){
 // Local phone coordinates; all content remains clipped to the glass.
 shadow(c,.25,55,31);rect(c,-188,-338,376,676,53,gradient(c,-188,-338,376,0,['#66586F','#24202A','#C7BBCB','#362D40']));noShadow(c);
 rect(c,-182,-332,364,664,49,'#24202A');rect(c,-169,-319,338,638,39,'#FEFCFF');
 c.save();c.beginPath();c.roundRect(-169,-319,338,638,39);c.clip();
 rect(c,-169,-319,338,134,0,'#F1E5F9');text(c,'09:41',-143,-282,15,C.ink,700);rect(c,89,-292,24,10,3,C.ink);rect(c,-55,-304,110,23,12,'#24202A');
 const active=at(t,e.phoneFocus,.65);
 text(c,active>.5?'Asistente de citas':'Mensajes',-142,-231,23,C.ink,700);
 text(c,active>.5?'Glowfy · ejemplo ilustrado':'Mientras estás atendiendo',-142,-204,13,'#785B89',500);
 if(active<1){c.save();c.globalAlpha=1-active;for(let i=0;i<3;i++){rect(c,-145,-156+i*115,290,91,17,'#F4EDF7');oval(c,-111,-121+i*115,18,18,'#DABFEA');rect(c,-79,-137+i*115,160,9,4,'#9C83AA');rect(c,-79,-115+i*115,111,7,3,'#CDBCD5');}c.restore();}
 const copy=variant==='reminder'?[['Tu cita es mañana','a las 16:00.'],['Te esperamos.','Recordatorio'],['¡Gracias!']]:variant==='reschedule'?[['¿Puedo cambiar','mi horario?'],['Hay lugar a','las 16:00.'],['Sí, a las 16:00.']]:[['¿Tienes lugar','mañana?'],['Sí. ¿11:00','o 16:00?'],['16:00, por favor.']];
 const items=[{start:e.customer,x:-145,y:-147,w:258,h:87,a:copy[0],mine:variant==='reminder'},{start:e.assistant,x:-116,y:-42,w:261,h:106,a:copy[1],mine:true},{start:e.reply,x:-145,y:82,w:250,h:75,a:copy[2],mine:false}];
 for(const item of items){const p=at(t,item.start,.4);if(!p)continue;c.save();c.globalAlpha=p;c.translate(0,(1-p)*18);rect(c,item.x,item.y,item.w,item.h,19,item.mine?'#EBD8F8':'#F0ECF2');item.a.forEach((s,i)=>text(c,s,item.x+18,item.y+33+i*29,26,C.ink,500));c.restore();}
 const confirm=at(t,e.appointment,.5);if(confirm){c.save();c.globalAlpha=confirm;rect(c,-145,184,290,85,18,'#E7F3EC');oval(c,-112,224,17,17,C.green);line(c,[[-120,224],[-114,230],[-103,217]],'#fff',3);text(c,variant==='reminder'?'Recordatorio listo':variant==='reschedule'?'Cita actualizada':'Cita agendada',-83,220,19,C.green,700);text(c,'Mañana · 16:00',-83,246,16,C.green,500);c.restore();}
 rect(c,-57,293,114,5,3,'#382C41');c.restore();
 // Edge highlights belong to the device, not the background.
 c.strokeStyle='#FFFFFF70';c.lineWidth=2;c.beginPath();c.moveTo(-173,-269);c.lineTo(-173,205);c.stroke();
}
function notification(c,t,start,x,y,angle,message){
 const on=at(t,start,.48),off=at(t,3.5,.5);if(on===0||off===1)return;
 c.save();c.globalAlpha=on*(1-off);c.translate(x+(1-on)*90-off*35,y+off*100);c.rotate(angle*(1-off));shadow(c,.15,32,18);
 rect(c,-265,-58,530,116,23,'#FFFDFE');noShadow(c);oval(c,-215,0,27,27,'#EBDDFA');
 c.strokeStyle=C.purple;c.lineWidth=3;c.beginPath();c.roundRect(-229,-12,28,22,7);c.stroke();line(c,[[-222,9],[-228,17],[-213,10]],C.purple,3);
 text(c,'NUEVO MENSAJE',-171,-16,17,'#8C6D9C',600);text(c,message,-171,21,25,C.ink,600);c.restore();
}

export {C,sat,ease,mix,at,rect,oval,text,shadow,noShadow,gradient,line,pill,hand,polish,phone};
