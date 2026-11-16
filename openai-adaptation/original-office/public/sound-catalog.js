import {el,link,button,requestJSON} from './ui.js';
export function mountSoundCatalog(page,brandContext){
 const box=el('details','','sound-catalog'),summary=el('summary','Revisar los efectos de sonido'),body=el('div','','sound-catalog-body');box.append(summary,body);page.append(box);
 let revision=brandContext.get().revision,loaded=false,loading=false,ticket=0;
 const stop=()=>body.querySelector('video')?.pause();
 async function load(){
  if(loaded||loading||!box.open||brandContext.get().id!=='glowfy')return;loading=true;const id=++ticket;body.replaceChildren(el('p','Cargando el catálogo…','muted'));body.setAttribute('aria-busy','true');
  try{const data=await requestJSON('/api/sound-catalog/glowfy');if(id!==ticket||brandContext.get().id!=='glowfy')return;
   const video=el('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.src=data.url;video.setAttribute('aria-label','Catálogo de los 36 efectos de sonido');
   const instructions=el('p','A: original de ElevenLabs. B: versión procesada. Cada una se escucha dos veces, con nivel igualado.','quiet-copy'),layout=el('div','','sound-catalog-layout'),preview=el('div','','sound-catalog-preview'),index=el('div','','sound-catalog-index');
   const download=link('Descargar video',data.url+'?download=1','ui-button');download.download='Glowfy-catalogo-efectos-v1.mp4';preview.append(video,download);
   index.append(el('h3','Ir a un efecto'),el('p','Para pedir un cambio, indicá número, A o B y qué falla.','quiet-copy'));const list=el('ol','','sound-chapters'),message=el('p','','inline-message');message.setAttribute('role','status');
   for(const c of data.chapters){const li=el('li'),control=button(String(c.number).padStart(2,'0')+'. '+c.title,async()=>{try{video.currentTime=c.start;await video.play();message.textContent='Escuchando '+c.title;}catch{message.textContent='Usá el botón de reproducción del video.';}},{className:'sound-chapter'});control.disabled=true;control.dataset.start=c.start;control.setAttribute('aria-label','Ir al efecto '+c.number+': '+c.title);li.append(control);list.append(li);}
   video.addEventListener('loadedmetadata',()=>list.querySelectorAll('button').forEach(b=>b.disabled=false));video.addEventListener('error',()=>{message.textContent='No se pudo cargar el video. Volvé a abrir el catálogo para intentarlo de nuevo.';loaded=false;});
   video.addEventListener('play',()=>document.querySelectorAll('audio,video').forEach(a=>{if(a!==video)a.pause();}));let current=-1;video.addEventListener('timeupdate',()=>{const n=data.chapters.findLastIndex(c=>video.currentTime>=c.start);if(current===n)return;current=n;[...list.querySelectorAll('button')].forEach((b,i)=>{if(i===n)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});});
   index.append(list,message);layout.append(preview,index);body.replaceChildren(instructions,layout);loaded=true;
  }catch{if(id===ticket)body.replaceChildren(el('p','No se pudo cargar el catálogo.','form-error'),button('Volver a cargar',load));}
  finally{if(id===ticket){loading=false;body.removeAttribute('aria-busy');}}
 }
 box.addEventListener('toggle',()=>box.open?load():stop());
 function route(){if(!location.hash.startsWith('#/estudio')){stop();return;}if(new URLSearchParams(location.hash.split('?')[1]||'').get('efectos')==='1'&&!box.hidden){box.open=true;load();}}
 brandContext.subscribe(state=>{box.hidden=state.id!=='glowfy';if(revision!==state.revision){revision=state.revision;ticket++;loading=false;loaded=false;stop();box.open=false;body.replaceChildren();body.removeAttribute('aria-busy');}route();});window.addEventListener('hashchange',route);
 document.addEventListener('play',event=>{const video=body.querySelector('video');if(video&&event.target!==video)video.pause();},true);
 return box;
}
