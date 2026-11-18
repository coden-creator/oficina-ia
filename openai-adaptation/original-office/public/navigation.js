import {BRANDS,brandId,createBrandContext} from './brand-context.js';
import {el,icon,button} from './ui.js';
export {BRANDS,brandId} from './brand-context.js';
export const NAV=Object.freeze([{id:'inicio',label:'Inicio',icon:'home'},{id:'estudio',label:'Estudio de contenido',icon:'studio'},{id:'marcas',label:'Marcas',icon:'brand'},{id:'calendario',label:'Calendario',icon:'calendar'},{id:'oficina',label:'Oficina y equipo',icon:'team'},{id:'conexiones',label:'Conexiones y ajustes',icon:'settings'}]);
export function routeId(hash){const id=String(hash||'').replace(/^#\/?/,'').split(/[/?]/)[0];return NAV.some(n=>n.id===id)?id:'inicio';}
export function mountNavigation({office,brandContext=createBrandContext()}){
 const $=s=>document.querySelector(s),nav=el('nav','','office-nav');nav.id='office-navigation';nav.setAttribute('aria-label','Navegación principal');
 const navTitle=el('p','Tu espacio','nav-section-label');$('.sidebar').append(navTitle,nav);
 for(const item of NAV){const a=el('a','','office-nav-link');a.href='#/'+item.id;a.dataset.route=item.id;a.append(icon(item.icon),el('span',item.label));nav.append(a);}
 $('.sidebar').append(el('p','Cada pieza pasa por tu revisión.','sidebar-note'));
 const brandLabel=el('label','','office-brand-select');brandLabel.htmlFor='office-brand';const caption=el('span','Marca','office-brand-caption');
 const select=el('select');select.id='office-brand';select.name='brand';select.autocomplete='off';select.setAttribute('translate','no');select.setAttribute('aria-label','Marca de trabajo');
 for(const brand of BRANDS){const option=el('option',brand.name);option.value=brand.id;select.append(option);}
 const arrow=el('span','⌄','office-brand-arrow');arrow.setAttribute('aria-hidden','true');brandLabel.append(caption,select,arrow);$('.topbar .brand').after(brandLabel);
 const status=el('p','','office-screen-reader');status.setAttribute('role','status');$('.topbar').append(status);
 const toggle=button('Menú',()=>{const open=document.body.classList.toggle('nav-open');toggle.setAttribute('aria-expanded',String(open));},{iconName:'menu',className:'mobile-menu-toggle'});toggle.setAttribute('aria-label','Menú');toggle.setAttribute('aria-controls','office-navigation');toggle.setAttribute('aria-expanded','false');$('.topbar').append(toggle);
 const activeHeading=()=>$('.view.active .workspace-page h1')||$('.view.active>.page-header h1');
 const skip=el('a','Saltar al contenido','skip-link');skip.href='#views';skip.onclick=event=>{event.preventDefault();activeHeading()?.focus();};document.body.prepend(skip);
 const pages={};for(const item of NAV){let view=$('[data-view="'+item.id+'"]');if(!view){view=el('section','','view');view.dataset.view=item.id;view.hidden=true;$('#views').append(view);}if(item.id!=='oficina'){const page=el('div','','workspace-page');view.append(page);pages[item.id]=page;}}
 function writeBrandURL(){const url=new URL(location.href);url.searchParams.set('brand',brandContext.get().id);history.replaceState(null,'',url);}
 let lastRevision=-1;
 function updateBrand(state){select.value=state.id;select.disabled=state.busy;if(state.revision!==lastRevision){status.textContent='Marca de trabajo: '+state.name;lastRevision=state.revision;}writeBrandURL();}
 select.onchange=()=>{if(!brandContext.select(select.value))updateBrand(brandContext.get());};brandContext.subscribe(updateBrand);
 window.addEventListener('popstate',()=>{const next=brandId(new URL(location.href).searchParams.get('brand'));if(!brandContext.select(next))writeBrandURL();});
 function route(focus=false){const id=routeId(location.hash),raw=location.hash.replace(/^#\/?/,'').split('?')[0];if(raw!==id)history.replaceState(null,'','#/'+id);for(const view of document.querySelectorAll('.view')){view.hidden=view.dataset.view!==id;view.classList.toggle('active',view.dataset.view===id);}for(const a of nav.querySelectorAll('a')){if(a.dataset.route===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}$('#side-chat').hidden=true;document.body.classList.remove('nav-open');toggle.setAttribute('aria-expanded','false');if(id==='oficina')requestAnimationFrame(()=>office.fit());if(focus){const heading=activeHeading();if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}}
 window.addEventListener('hashchange',()=>route(true));window.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('nav-open')){document.body.classList.remove('nav-open');toggle.setAttribute('aria-expanded','false');toggle.focus();}});route();
 return {pages,route};
}
