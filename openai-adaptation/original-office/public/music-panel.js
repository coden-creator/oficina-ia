import {el,link,button,requestJSON} from './ui.js';
export function mountMusicLibrary(page,brandContext){
 const box=el('details','','music-library'),summary=el('summary','Música de Glowfy'),body=el('div','','music-library-body');box.append(summary,body);page.append(box);
 let revision=brandContext.get().revision,loaded=false,loading=false,request=0;
 const stop=()=>body.querySelectorAll('audio').forEach(a=>a.pause());
 async function load(){
  if(loaded||loading||!box.open||brandContext.get().id!=='glowfy')return;const ticket=++request;loading=true;body.replaceChildren(el('p','Cargando las variantes…','muted'));body.setAttribute('aria-busy','true');
  try{const library=await requestJSON('/api/music/glowfy');if(ticket!==request||brandContext.get().id!=='glowfy')return;
   body.replaceChildren(el('p','Cuatro variantes elegidas por Jorge. Moderna, cálida y elegante.','quiet-copy'));
   const list=el('div','','music-library-list');
   for(const track of library.tracks){const row=el('article','','music-library-row'),label=el('div');label.append(el('h3',track.title),el('p',track.duration+' segundos','muted'));
    const player=el('audio');player.controls=true;player.preload='metadata';player.src=track.url;player.setAttribute('aria-label','Escuchar '+track.title);player.addEventListener('play',()=>{document.querySelectorAll('audio,video').forEach(a=>{if(a!==player)a.pause();});});
    const download=link('Descargar MP3',track.url,'text-link');download.download=track.id+'.mp3';download.setAttribute('aria-label','Descargar '+track.title);row.append(label,player,download);list.append(row);
   }body.append(list,el('p','Cada pieza conserva su variante durante las correcciones. La mezcla ajusta la música para acompañar la voz.','quiet-copy'));loaded=true;
  }catch{if(ticket===request)body.replaceChildren(el('p','No se pudo cargar la música.','form-error'),button('Volver a cargar',load));}
  finally{if(ticket===request){loading=false;body.removeAttribute('aria-busy');}}
 }
 box.addEventListener('toggle',()=>{if(box.open)load();else stop();});
 function route(){if(!location.hash.startsWith('#/estudio')){stop();return;}if(new URLSearchParams(location.hash.split('?')[1]||'').get('musica')==='1'&&!box.hidden){box.open=true;load();}}
 brandContext.subscribe(state=>{box.hidden=state.id!=='glowfy';if(state.revision!==revision){revision=state.revision;request++;loaded=false;loading=false;stop();box.open=false;body.replaceChildren();body.removeAttribute('aria-busy');}route();});window.addEventListener('hashchange',route);
 document.addEventListener('play',event=>{if(event.target.tagName==='VIDEO')stop();},true);
 return box;
}
