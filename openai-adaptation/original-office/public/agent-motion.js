// Small, role-specific tools and gestures. Time advances only when OfficeHQ is
// visible and animation is enabled; working state comes from the coordinator.
export function drawWorkstation(c,p,t){
 const active=p.status==='working',phase=active?t:0;
 const ink=p.status==='unavailable'?'#596275':p.color,light='#d7e0ee';
 const x=p.x-51,y=p.y-50,w=49,h=30;
 c.fillStyle='#11151e';c.fillRect(p.x-56,p.y-16,112,17);c.fillStyle='#485264';c.fillRect(p.x-56,p.y-19,112,4);
 c.fillStyle='#445064';c.fillRect(x-3,y-3,w+6,h+6);c.fillStyle='#111722';c.fillRect(x,y,w,h);c.fillStyle='#62718a';c.fillRect(x+19,y+h+3,12,4);
 const line=(a,b,d,e,color=ink)=>{c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.moveTo(x+a,y+b);c.lineTo(x+d,y+e);c.stroke();};
 const box=(a,b,d,e,color=ink)=>{c.fillStyle=color;c.fillRect(x+a,y+b,d,e);};
 if(p.id==='estratega'){
  for(let i=0;i<3;i++){box(3+i*15,4,11,7,'#394a5e');box(3+i*15,14,8,2,light);box(3+i*15,19,10,2,ink);}
  const scan=active?12+Math.sin(phase*1.5)*10:15;c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.arc(x+scan,y+13,8,0,Math.PI*2);c.stroke();line(scan+6,19,scan+12,25);
 }else if(p.id==='guionista'){
  box(5,3,34,24,'#e0e5ed');for(let i=0;i<4;i++)box(8,7+i*5,active?5+(Math.floor(phase*8)+i*7)%25:22,2,'#48546d');
  c.save();c.translate(p.x+50,p.y-23);c.rotate(active?Math.sin(phase*5)*.12:-.15);c.fillStyle=ink;c.fillRect(-2,-10,3,16);c.fillStyle=light;c.fillRect(-2,6,3,3);c.restore();
 }else if(p.id==='viralidad'){
  for(let i=0;i<3;i++){box(3+i*15,4,11,21,'#384252');box(5+i*15,7,7,8,ink);}
  const selected=active?Math.floor(phase*.55)%3:1;line(5+selected*15,20,8+selected*15,23,light);line(8+selected*15,23,13+selected*15,17,light);
 }else if(p.id.startsWith('video')){
  if(p.id==='video2'){for(let i=0;i<13;i++){const h=3+(i*7)%11;box(3+i*3,12-h/2,2,h,ink);}}
  else if(p.id==='video3'){for(let i=0;i<3;i++){c.strokeStyle=i===1?ink:'#6e7e98';c.strokeRect(x+7+i*6,y+3+i*2,22,12);}}
  else{box(4,3,18,12,ink);box(25,3,20,12,'#4f5b71');line(30,6,40,9,light);line(40,9,30,12,light);}
  for(let i=0;i<3;i++){box(3,19+i*3,14+i*5,2,ink);box(22+i*3,19+i*3,17-i*3,2,'#68768c');}
  const playhead=active?3+(phase*10)%42:27;line(playhead,17,playhead,29,light);
 }else if(p.id==='calidad'){
  for(let i=0;i<3;i++){c.strokeStyle=ink;c.strokeRect(x+4,y+4+i*8,5,5);box(14,5+i*8,27-i*4,2,light);if(!active||i<=Math.floor(phase)%3){line(4,6+i*8,6,8+i*8);line(6,8+i*8,9,4+i*8);}}
  if(active)box(1,(phase*9)%28,47,1,'#8dc6a4');
 }else{
  for(let i=0;i<3;i++){box(4+i*15,3,11,4,ink);box(4+i*15,10,11,6,'#4b5970');box(4+i*15,19,11,6,'#354254');}
 }
 // Keyboard and actual working hands, separate from decorative idle poses.
 c.fillStyle='#263044';c.fillRect(p.x-41,p.y-12,38,8);c.fillStyle='#8090a7';for(let i=0;i<6;i++)c.fillRect(p.x-38+i*5,p.y-10,3,2);
 const bob=active?Math.sin(phase*3)*.8:0,sprite=p.sprites.get(active?'left':'down',0,false);c.drawImage(sprite,p.x+9,p.y-53+bob,sprite.width*2,sprite.height*2);
 if(active){c.fillStyle='#d9b69b';c.fillRect(p.x+4,p.y-18+Math.sin(phase*9)*1.5,10,4);c.fillRect(p.x+15,p.y-14+Math.sin(phase*9+2)*1.5,8,4);}
 const color=p.status==='blocked'?'#efb184':p.status==='waiting'?'#c3afff':active?'#61c6ae':'#65718a';
 c.fillStyle=color;c.beginPath();c.arc(p.x+43,p.y-48,5,0,Math.PI*2);c.fill();
 if(p.status==='blocked'||p.status==='waiting'){c.fillStyle='#11151e';c.font='bold 9px system-ui';c.textAlign='center';c.fillText(p.status==='blocked'?'!':'…',p.x+43,p.y-45);c.textAlign='left';}
}
