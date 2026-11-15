// The original office scene is preserved. Operational views use the adapted backend.
import {OfficeHQ} from './officehq.js';
import {mountVideoPanel} from './video-panel.js';
import {mountNavigation} from './navigation.js';
import {createBrandContext} from './brand-context.js';
import {mountConnectionsPanel} from './connections-panel.js';
import {mountWorkspacePages} from './workspace-pages.js';
import {createWorkspaceData,pageHeader,button} from './ui.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],notice=$('#compat-notice');
const config=await fetch('/api/config').then(response=>{if(!response.ok)throw Error('config');return response.json();}).catch(()=>{notice.textContent='No se pudo cargar la oficina. Recargá la página o volvé a iniciar sesión.';throw Error('OFFICE_CONFIG_UNAVAILABLE');});
for(const control of $$('input,textarea,select,button'))control.disabled=true;
for(const form of $$('form'))form.addEventListener('submit',event=>event.preventDefault());
for(const node of $$('.brand-text b'))node.textContent='Oficina';
for(const node of $$('.brand-text small'))node.textContent='Contenido';
$('#run-all').hidden=true;$('#demo-day').hidden=true;
const openChat=id=>{$('#side-chat').hidden=false;$('#side-chat-head').textContent=(config.agents.find(agent=>agent.id===id)?.nombre||id)+' · Chat pendiente';$('#side-chat-msgs').textContent='El chat de este personaje todavía no está conectado. Las solicitudes se gestionan desde el Estudio.';};
const office=new OfficeHQ($('#office'),$('#overlay'),config.agents,{onApprovalClick:()=>{},onOpenChat:openChat,onOpenGroup:openChat,onOpenRoom:()=>{location.hash='#/oficina';}});
for(const a of office.people)office.setAgent(a.id,{status:'unavailable',text:'Chat sin conectar',lastRun:null});
for(const close of $$('[data-side-close]')){close.disabled=false;close.addEventListener('click',()=>{$('#side-chat').hidden=true;});}
$('#ticker').textContent='Escenario visual; chats de los personajes sin conectar. Los movimientos no indican trabajo de los agentes.';
for(const view of $$('.view'))if(view.dataset.view!=='oficina')for(const child of [...view.children]){child.hidden=true;child.classList.add('compat-preserved-unavailable');}
$('#stats').hidden=true;
$('#clock').textContent=new Intl.DateTimeFormat('es-GT',{dateStyle:'medium',timeZone:config.timezone}).format(new Date());
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');let paused=reducedMotion.matches,painted=false;
const originalUpdate=office.update.bind(office),originalDraw=office.draw.bind(office),originalFit=office.fit.bind(office);
office.update=delta=>{if(!paused&&$('[data-view="oficina"]').classList.contains('active'))originalUpdate(delta);};
office.draw=()=>{if(!paused||!painted){originalDraw();painted=true;}};
office.fit=(...args)=>{painted=false;return originalFit(...args);};
const animation=button(paused?'Reanudar animación':'Pausar animación',()=>{paused=!paused;painted=false;animation.querySelector('span').textContent=paused?'Reanudar animación':'Pausar animación';});
reducedMotion.addEventListener('change',event=>{paused=event.matches;painted=false;animation.querySelector('span').textContent=paused?'Reanudar animación':'Pausar animación';});
$('[data-view="oficina"]').prepend(pageHeader('Oficina y equipo','El escenario original y los roles del departamento de contenido.',animation));
const brandContext=createBrandContext(new URL(location.href).searchParams.get('brand'));
const {pages,route}=mountNavigation({office,brandContext});
const data=createWorkspaceData({brandContext,enabled:config.features.videoWorkflow==='internal-workflow-only'});
const {voiceContainer}=mountWorkspacePages({pages,config,data,brandContext});
mountConnectionsPanel(voiceContainer);
mountVideoPanel(pages.estudio,{brandContext,data});
for(const heading of $$('h1'))heading.tabIndex=-1;
document.body.classList.add('office-ui');notice.hidden=true;route();
