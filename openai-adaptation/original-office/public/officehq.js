import {drawWorkstation} from './agent-motion.js';
// The scene is a view of observed work, never an autonomous source of activity.
import {makeSprites} from './sprites.js';
const W=1040,H=540;
const rooms=[
 {id:'direccion',name:'Dirección',note:'Prioridades y decisiones',x:16,y:16,w:220,h:324,color:'#b7a3ff'},
 {id:'contenido',name:'Ideas y guiones',note:'Investigar · escribir · seleccionar',x:252,y:16,w:504,h:154,color:'#62c8c4'},
 {id:'edicion',name:'Edición',note:'Tres puestos de producción',x:252,y:186,w:504,h:154,color:'#ea93b7'},
 {id:'calidad',name:'Calidad',note:'Antes de tu revisión',x:772,y:16,w:252,h:324,color:'#8dc6a4'},
 {id:'comercial',name:'Comercial y clientes',note:'Próxima etapa',x:16,y:370,w:320,h:154,color:'#68758a',planned:true},
 {id:'sistemas',name:'Sistemas y automatización',note:'Junie: conexión futura',x:352,y:370,w:336,h:154,color:'#68758a',planned:true},
 {id:'administracion',name:'Administración y finanzas',note:'Próxima etapa',x:704,y:370,w:320,h:154,color:'#68758a',planned:true}
];
const positions={coordinador:[126,212],estratega:[336,117],guionista:[504,117],viralidad:[672,117],video:[336,287],video2:[504,287],video3:[672,287],calidad:[898,212]};
const stateLabel={idle:'Sin tarea',working:'Trabajando',waiting:'Espera tu decisión',blocked:'Necesita atención',unavailable:'Sin verificar'};
export class OfficeHQ{
 constructor(canvas,overlay,agents,{onOpenChat,onOpenRoom}={}){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.overlay=overlay;this.t=0;this.pending=0;this.transfers=[];this.owners=new Map();this.cb={onOpenChat,onOpenRoom};
  canvas.width=W;canvas.height=H;canvas.classList.add('hq');canvas.setAttribute('aria-hidden','true');overlay.replaceChildren();overlay.className='studio-overlay';
  this.people=agents.filter(a=>positions[a.id]).map((a,i)=>{
   const tag=document.createElement('button');tag.type='button';tag.className='studio-agent';tag.style.setProperty('--agent-color',a.color);tag.dataset.agent=a.id;tag.onclick=()=>this.cb.onOpenChat?.(a.id);overlay.append(tag);
   const hero={hair:['#61517a','#735339','#322c43'][i%3],hairStyle:['short','ponytail','spiky','long'][i%4],clothes:a.color,accent:'#eef0f5',gearKind:i>3?'headset':null};
   return {...a,x:positions[a.id][0],y:positions[a.id][1],status:'unavailable',text:'Consultando el estado…',sprites:makeSprites(hero),tag};
  });
  this.labels=rooms.map(r=>{const b=document.createElement('button');b.type='button';b.className='studio-room-label';b.textContent=r.name;b.onclick=()=>this.cb.onOpenRoom?.(r.id);overlay.append(b);return {r,b};});
  new ResizeObserver(()=>this.fit()).observe(canvas.parentElement);this.fit();
  let last=performance.now();const loop=now=>{const dt=Math.min(.1,(now-last)/1000);last=now;if(canvas.offsetParent){this.update(dt);this.draw();}requestAnimationFrame(loop);};requestAnimationFrame(loop);
 }
 fit(){
  const box=this.canvas.parentElement.getBoundingClientRect(),scale=Math.min(1,(box.width-16)/W);this.scale=Math.max(.1,scale);
  this.canvas.style.width=W*this.scale+'px';this.canvas.style.height=H*this.scale+'px';this.canvas.parentElement.style.height=H*this.scale+16+'px';
  const left=(box.width-W*this.scale)/2,top=8;
  for(const p of this.people){p.tag.style.left=left+p.x*this.scale+'px';p.tag.style.top=top+(p.y+10)*this.scale+'px';p.tag.style.transform='translateX(-50%)';}
  for(const {r,b} of this.labels){b.style.left=left+(r.x+14)*this.scale+'px';b.style.top=top+(r.y+12)*this.scale+'px';b.style.maxWidth=(r.w-28)*this.scale+'px';}
 }
 setAgent(id,agent){const p=this.people.find(a=>a.id===id);if(!p)return;if(agent.status==='working'&&agent.jobId){const key=agent.jobId+':'+agent.version,old=this.owners.get(key);if(old&&old!==id)this.transfers.push({from:old,to:id,start:this.t});this.owners.set(key,id);if(this.owners.size>100)this.owners.delete(this.owners.keys().next().value);}Object.assign(p,agent);p.tag.replaceChildren();const name=document.createElement('strong'),state=document.createElement('span');name.textContent=p.nombre;state.textContent=stateLabel[p.status]||'Sin verificar';p.tag.append(name,state);p.tag.dataset.status=p.status;p.tag.setAttribute('aria-label',p.nombre+', '+p.rol+'. '+state.textContent);}
 setPending(n){this.pending=n;}
 setTasks(tasks){this.tasks=tasks;}
 setBrand(brand){if(this.brand===brand)return;this.brand=brand;this.owners.clear();this.transfers=[];}
 update(dt){this.t+=dt;this.transfers=this.transfers.filter(x=>this.t-x.start<1.6);}
 draw(){
  const c=this.ctx;c.imageSmoothingEnabled=false;c.fillStyle='#0d0e12';c.fillRect(0,0,W,H);
  for(const r of rooms){c.fillStyle=r.planned?'#141720':'#1b202b';c.fillRect(r.x,r.y,r.w,r.h);c.fillStyle=r.color;c.fillRect(r.x,r.y,4,r.h);c.strokeStyle='#303847';c.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);
   c.fillStyle='#8f9db3';c.font='12px system-ui';c.fillText(r.note,r.x+16,r.y+45);
   if(r.planned){c.strokeStyle='#313b4c';for(let i=0;i<3;i++)c.strokeRect(r.x+20+i*44,r.y+94,30,18);}
  }
  c.strokeStyle='#485164';c.lineWidth=2;for(const [x1,y1,x2,y2] of [[236,96,252,96],[504,170,504,186],[756,264,772,264]]){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
  for(const move of this.transfers){const a=positions[move.from],b=positions[move.to];if(!a||!b)continue;const q=Math.min(1,(this.t-move.start)/1.6),e=q*q*(3-2*q);c.fillStyle='#c3afff';c.fillRect(a[0]+(b[0]-a[0])*e-5,a[1]+(b[1]-a[1])*e-66,10,7);}
  for(const p of this.people)drawWorkstation(c,p,this.t);
  c.fillStyle='#a8b5c8';c.font='13px system-ui';c.fillText(this.pending?`${this.pending} pieza${this.pending===1?'':'s'} para Jorge`:'Bandeja al día',36,300);
 }
}
