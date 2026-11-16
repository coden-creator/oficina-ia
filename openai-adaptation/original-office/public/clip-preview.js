import {el,icon,button,link,jobHref} from './ui.js';

export function createClipPreview(job,{onPlay}){
 const media=job.artifact||job.preview,box=el('div','','clip-preview');
 if(!media){const empty=link('',jobHref(job),'job-preview');empty.append(icon('file'),el('span','Solicitud guardada'));return {element:empty,stop(){},dispose(){}};}
 const video=el('video');video.controls=true;video.preload='none';video.playsInline=true;video.setAttribute('aria-label','Vista previa de '+job.brief.objective);video.hidden=true;
 const cover=button('',start,{className:'clip-cover'});cover.setAttribute('aria-label','Reproducir vista previa: '+job.brief.objective);
 if(media.posterUrl){const img=el('img');img.alt='';img.width=360;img.height=640;img.loading='lazy';img.decoding='async';img.src=media.posterUrl;img.addEventListener('error',()=>img.remove(),{once:true});cover.append(img);}
 const label=el('span','','clip-play');label.append(icon('play'),el('span',job.artifact?'Ver video':'Ver fragmento'));cover.append(label);
 const error=el('p','','clip-error');error.setAttribute('role','status');error.hidden=true;box.append(cover,video,error);
 let disposed=false;
 async function start(){if(disposed)return;onPlay();cover.hidden=true;video.hidden=false;error.hidden=true;if(!video.getAttribute('src'))video.src=media.url;try{await video.play();if(disposed||!box.isConnected)video.pause();else video.focus();}catch{if(!disposed){error.textContent='No se pudo reproducir. Abrí la pieza para volver a intentarlo.';error.hidden=false;}}}
 video.addEventListener('play',()=>onPlay());
 const stop=()=>video.pause();
 const observer=new IntersectionObserver(entries=>{if(entries.every(e=>!e.isIntersecting))stop();});observer.observe(box);
 return {element:box,stop,dispose(){disposed=true;stop();observer.disconnect();video.removeAttribute('src');video.load();}};
}
