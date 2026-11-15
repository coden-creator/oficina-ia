// Compatibility boot: original HTML/CSS/OfficeHQ retained; original operational JS NOT loaded.
import {OfficeHQ} from './officehq.js';
import {mountVideoPanel} from './video-panel.js';
import {mountNavigation} from './navigation.js';
import {createBrandContext} from './brand-context.js';
import {mountConnectionsPanel} from './connections-panel.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const notice=$('#compat-notice');
const config=await fetch('/api/config').then(r=>{if(!r.ok)throw Error('config');return r.json();}).catch(()=>{notice.textContent='No se pudo cargar la oficina. Revisa la conexión o vuelve a iniciar sesión. Las acciones siguen deshabilitadas.';throw new Error('OFFICE_CONFIG_UNAVAILABLE');});
// Disable original operational forms before exposing navigation. No data keys or outbound actions.
for(const e of $$('input,textarea,select,button'))e.disabled=true;
for(const f of $$('form'))f.addEventListener('submit',e=>e.preventDefault());
for(const b of $$('.brand-text b'))b.textContent='Oficina';
$('#run-all').hidden=true;$('#demo-day').hidden=true;
const openChat=id=>{
 $('#side-chat').hidden=false;$('#side-chat-head').textContent=(config.agents.find(a=>a.id===id)?.nombre||id)+' · Sin conexión';
 $('#side-chat-msgs').textContent='Este chat conserva su lugar en la oficina original. Todavía no tiene IA conectada; no se enviará ningún mensaje.';
};
const office=new OfficeHQ($('#office'),$('#overlay'),config.agents,{onApprovalClick:()=>{},onOpenChat:openChat,onOpenGroup:openChat,onOpenRoom:()=>{location.hash='#/oficina';}});
for(const a of office.people)office.setAgent(a.id,{status:'unavailable',text:'Sin IA conectada',lastRun:null});
for(const b of $$('[data-side-close]')){b.disabled=false;b.addEventListener('click',()=>{$('#side-chat').hidden=true;});}
$('#ticker').textContent='Personajes y salas originales. Animación ambiental, no ejecución de agentes.';
for(const view of $$('.view'))if(view.dataset.view!=='oficina'){
 for(const child of [...view.children]){child.hidden=true;child.classList.add('compat-preserved-unavailable');}
 const banner=document.createElement('div');banner.className='compat-unavailable';
 const title=document.createElement('h2');title.textContent=view.dataset.view;
 const detail=document.createElement('p');detail.textContent='Sección original conservada. Su conexión está pendiente; no mostramos datos de ejemplo ni resultados en cero.';
 banner.append(title,detail);view.prepend(banner);
}
$('#clock').textContent=new Date().toLocaleString('es-MX',{timeZone:config.timezone});
notice.textContent=config.provider==='codex-chatgpt-plan'?'Oficina de contenido · Codex conectado para solicitudes. La animación de la oficina es ambiental. Cada pieza requiere tu revisión.':'Interfaz original recuperada · Sin IA ni servicios conectados. La animación es visual, no trabajo real.';

const brandContext=createBrandContext(new URL(location.href).searchParams.get('brand'));
mountNavigation({config,office,brandContext});
mountConnectionsPanel(document.querySelector('[data-view="conexiones"]'));
if(config.features.videoWorkflow==='internal-workflow-only')mountVideoPanel(document.querySelector('[data-view="estudio"]'),{brandContext});
