import {el,button,link,jobHref} from './ui.js';
const labels={idle:'Sin tarea',working:'Trabajando',waiting:'Espera tu decisión',blocked:'Necesita atención',unavailable:'Sin verificar'};
export function mountOfficePanel({office,view,data,config}){
 const status=el('p','','office-live-note');status.setAttribute('role','status');view.querySelector('.page-header').after(status);
 const roster=el('div','','office-roster');roster.setAttribute('aria-label','Equipo y tareas');view.append(roster);
 const drawer=el('dialog','','office-dialog agent-dialog'),head=el('header','','dialog-heading'),title=el('h2'),body=el('div','','agent-detail');title.id='agent-detail-title';drawer.setAttribute('aria-labelledby',title.id);const close=button('Cerrar',()=>drawer.close(),{iconName:'close'});head.append(title,close);drawer.append(head,body);view.append(drawer);
 const rooms=el('section','','future-departments');rooms.append(el('h2','Otros departamentos'));const planned=el('div','','department-lines');rooms.append(planned);view.append(rooms);
 for(const d of config.departments.filter(d=>d.state==='planned')){const row=el('article');row.append(el('h3',d.name),el('p',d.description),el('span','Próxima etapa','muted'));planned.append(row);}
 let current=null,selected=null;
 function details(id){const agent=current?.office?.agents.find(a=>a.id===id)||config.agents.find(a=>a.id===id);if(!agent)return;selected=id;title.textContent=agent.nombre;body.replaceChildren(el('p',agent.rol,'agent-role'),el('strong',labels[agent.status]||'Sin verificar'),el('p',agent.text||'El estado todavía no está disponible.'));const job=current?.jobs.find(j=>j.id===agent.jobId);if(job)body.append(link('Abrir pieza',jobHref(job),'ui-button ui-primary'));else body.append(el('p','Las solicitudes entran desde el Estudio. La oficina asigna el trabajo al equipo.','quiet-copy'));if(!drawer.open)drawer.showModal();}
 office.cb.onOpenChat=details;
 office.cb.onOpenRoom=id=>{if(['contenido','edicion','calidad'].includes(id))location.hash='#/estudio';else if(id==='direccion')location.hash='#/inicio';else{const d=config.departments.find(d=>d.id===id);selected=null;title.textContent=d?.name||'Departamento';body.replaceChildren(el('p',d?.description||''),el('p','Este departamento se incorporará en una etapa posterior.'));drawer.showModal();}};
 data.subscribe(state=>{
  current=state;office.setBrand(state.brand);const snapshot=state.office;status.textContent=state.status==='loading'?'Consultando la oficina…':!snapshot?'No se pudo verificar la actividad. Volvé a cargar los trabajos.':snapshot.coordination.message||'El equipo avanza con las solicitudes autorizadas.';
  roster.replaceChildren();for(const base of config.agents){const a=snapshot?.agents.find(a=>a.id===base.id)||{...base,status:'unavailable',text:'Sin verificar'};office.setAgent(a.id,a);const row=button('',()=>details(a.id),{className:'agent-row'});row.replaceChildren(el('span','',`agent-dot agent-${a.status}`),el('strong',a.nombre),el('span',a.rol,'agent-role'),el('span',labels[a.status]||'Sin verificar','agent-state'));roster.append(row);}
  office.setPending(snapshot?.decisions.length||0);office.draw();
  if(drawer.open&&selected)details(selected);
 });
 drawer.addEventListener('click',event=>{if(event.target.closest('a'))drawer.close();});
}
