// Navigation only: selecting a brand never connects accounts or authorizes actions.
import {BRANDS,brandId,createBrandContext} from './brand-context.js';
export {BRANDS,brandId} from './brand-context.js';
export const NAV=Object.freeze([{id:'inicio',label:'Inicio',icon:'⌂'},{id:'estudio',label:'Estudio de contenido',icon:'▷'},{id:'marcas',label:'Marcas',icon:'◈'},{id:'calendario',label:'Calendario',icon:'▦'},{id:'oficina',label:'Oficina y equipo',icon:'♧'},{id:'conexiones',label:'Conexiones y ajustes',icon:'⚙'}]);
export function routeId(hash){const id=String(hash||'').replace(/^#\/?/,'').split('/')[0];return NAV.some(n=>n.id===id)?id:'inicio';}
export function mountNavigation({config,office,brandContext=createBrandContext()}){
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const nav=document.createElement('nav');nav.className='tabs office-nav';nav.setAttribute('aria-label','Navegación principal');
 for(const n of NAV){const a=document.createElement('a');a.href='#/'+n.id;a.className='tab';a.dataset.route=n.id;const icon=document.createElement('span');icon.className='nav-icon';icon.setAttribute('aria-hidden','true');icon.textContent=n.icon;const label=document.createElement('span');label.textContent=n.label;a.append(icon,label);nav.append(a);}
 $('.sidebar').append(nav);
 const brandLabel=document.createElement('label');brandLabel.className='office-brand-select';brandLabel.htmlFor='office-brand';
 const caption=document.createElement('span');caption.textContent='Marca';caption.className='office-brand-caption';
 const select=document.createElement('select');select.id='office-brand';select.name='brand';select.autocomplete='off';select.setAttribute('translate','no');select.setAttribute('aria-label','Marca de trabajo');
 for(const b of BRANDS){const option=document.createElement('option');option.value=b.id;option.textContent=b.name;select.append(option);}
 const arrow=document.createElement('span');arrow.className='office-brand-arrow';arrow.textContent='⌄';arrow.setAttribute('aria-hidden','true');brandLabel.append(caption,select,arrow);$('.topbar .brand').after(brandLabel);
 const status=document.createElement('p');status.className='office-screen-reader';status.setAttribute('role','status');status.setAttribute('aria-live','polite');$('.topbar').append(status);
 const element=(tag,text,className)=>{const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e;};
 function page(id,title,description){let view=$('[data-view="'+id+'"]');if(!view){view=document.createElement('section');view.className='view';view.dataset.view=id;view.hidden=true;$('#views').append(view);}const card=element('div','', 'compat-unavailable nav-page');const h=element('h1',title);h.tabIndex=-1;card.append(h,element('p',description));view.prepend(card);return card;}
 const home=page('inicio','Tu oficina de contenido','Elige una marca y entra al Estudio para preparar contenido. Las conexiones y la generación autónoma siguen en preparación.');
 const links=element('div','','nav-shortcuts');for(const [id,label] of [['estudio','Ir al Estudio'],['oficina','Ver la oficina'],['conexiones','Ver conexiones']]){const a=element('a',label,'nav-shortcut');a.href='#/'+id;links.append(a);}home.append(links,element('p','Sin métricas inventadas: los trabajos y las aprobaciones se mostrarán aquí cuando esta vista esté conectada.','nav-note'));
 const brands=page('marcas','Identidad y recursos','La marca de trabajo se elige en la cabecera y se mantiene al navegar por la oficina.');
 const brandTitle=element('h2');brands.append(brandTitle,element('p','Aquí reuniremos su público, tono, reglas y recursos visuales. La edición del perfil todavía está pendiente.','nav-note'));
 page('calendario','Calendario','Todavía no conectado. Aquí reuniremos las piezas aprobadas, programadas y publicadas. No hay publicaciones ni programación automática desde esta versión.');
 const connections=page('conexiones','Conexiones y ajustes','Configura los servicios que usa tu oficina. Tú decides cuándo generar contenido y cuándo publicarlo.');const list=element('dl','','nav-connections');for(const [name,value] of [['Codex',config.provider==='codex-chatgpt-plan'?'Cuenta conectada al proceso de especialistas; resultados sujetos a revisión':'No conectado'],['Redes sociales','Sin publicación habilitada'],['Solicitudes internas',config.features?.videoWorkflow==='internal-workflow-only'?'Habilitadas en el Estudio; no equivale a generación autónoma':'Deshabilitadas en esta instalación']]){list.append(element('dt',name),element('dd',value));}connections.append(list);
 const studio=$('[data-view="estudio"] .compat-unavailable');if(studio){studio.querySelector('h2').textContent='Estudio de contenido';studio.querySelector('p').textContent='Las solicitudes de video todavía no están habilitadas en esta instalación. No se están generando videos ni consumiendo créditos.';}
 function writeBrandURL(){const url=new URL(location.href);url.searchParams.set('brand',brandContext.get().id);history.replaceState(null,'',url);}
 let lastRevision=-1;
 function updateBrand(state){select.value=state.id;select.disabled=state.busy;brandLabel.classList.toggle('is-busy',state.busy);brandTitle.textContent=state.name;if(state.revision!==lastRevision){status.textContent='Marca de trabajo: '+state.name;lastRevision=state.revision;}writeBrandURL();}
 select.onchange=()=>{if(!brandContext.select(select.value))updateBrand(brandContext.get());};
 brandContext.subscribe(updateBrand);
 window.addEventListener('popstate',()=>{const next=brandId(new URL(location.href).searchParams.get('brand'));if(!brandContext.select(next))writeBrandURL();});
 function route(focus=false){const id=routeId(location.hash);if(location.hash!=='#/'+id)history.replaceState(null,'','#/'+id);for(const e of $$('.view')){e.hidden=e.dataset.view!==id;e.classList.toggle('active',e.dataset.view===id);}for(const a of nav.querySelectorAll('a')){if(a.dataset.route===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}$('#side-chat').hidden=true;if(id==='oficina')requestAnimationFrame(()=>office.fit());if(focus){const h=$('[data-view="'+id+'"] h1, [data-view="'+id+'"] h2');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}}
 window.addEventListener('hashchange',()=>route(true));route();
 return {getBrand:()=>brandContext.get().id};
}
