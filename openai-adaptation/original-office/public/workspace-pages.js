import {brandDirection,socialDiscovery} from './brand-direction.js';
import {el,icon,link,pageHeader,emptyState,badge,groupOf,isTechnical,dateLabel,jobHref,button} from './ui.js';
const section=(title,className='')=>{const node=el('section','',className);node.append(el('h2',title));return node;};
const row=job=>{const a=link(' ',jobHref(job),'work-row'),copy=el('div');copy.append(el('strong',job.brief.objective),el('span','Versión '+job.version+' · '+dateLabel(job.createdAt),'muted'));a.replaceChildren(icon(job.artifact?'play':'file'),copy,badge(job.state),icon('arrow'));return a;};
export function mountWorkspacePages({pages,config,data,brandContext}){
 const home=pages.inicio;home.append(pageHeader('El escritorio de Jorge','Decisiones, avances y asuntos que necesitan atención.',link('Abrir el Estudio','#/estudio','ui-button ui-primary')));
 const homeBody=el('div','','home-layout');home.append(homeBody);
 const profile=pages.marcas;profile.append(pageHeader('Identidad y recursos','El contexto que guía el contenido de esta marca.'));const profileBody=el('div');profile.append(profileBody);
 const calendar=pages.calendario;calendar.append(pageHeader('Calendario','Publicaciones aprobadas, con fecha y destino.'));
 calendar.append(emptyState('La programación todavía no está conectada','Podés revisar las piezas en el Estudio. Cuando se conecten las cuentas, acá verás las publicaciones que autorices.',{iconName:'calendar',action:link('Ver conexiones','#/conexiones')}));
 const calendarRule=el('div','','quiet-note');calendarRule.append(icon('check'),el('p','Cada publicación requiere tu aprobación para esa pieza y ese destino. Aceptar una prueba técnica no la programa.'));calendar.append(calendarRule);
 const connections=pages.conexiones;connections.append(pageHeader('Conexiones y ajustes','Configurá los servicios de tu oficina en un solo lugar.'));
 const grid=el('div','','connections-layout'),voice=el('div','','voice-settings'),services=el('div','','service-list');grid.append(voice,services);connections.append(grid);
 const codex=section('Codex','service-card'),codexState=el('span','','service-state');codex.prepend(icon('studio'));codex.append(codexState,el('p','Cuenta de ChatGPT para las solicitudes internas.','muted'));
 const networks=section('Redes sociales','service-card');networks.prepend(icon('calendar'));const networkStatus=el('span','Integración pendiente','service-state'),networkInfo=el('p','','muted');networks.append(networkStatus,networkInfo);const junie=section('Junie','service-card');junie.prepend(icon('link'));junie.append(el('span','Conexión futura','service-state'),el('p','Se integrará más adelante para colaborar con otras labores de Jorge.','muted'));services.append(codex,networks,junie);
 const keysNote=el('div','','quiet-note');keysNote.append(icon('link'),el('p','Estas conexiones pertenecen a la oficina. Elegir otra marca no cambia las claves guardadas.'));connections.append(keysNote);
 function render(state){
  const socialProfile=socialDiscovery.profiles[brandContext.get().id];networkInfo.textContent=(socialProfile?'Perfil localizado en Metricool: '+socialProfile+'. Facebook, Instagram'+(brandContext.get().id==='coden'?'.':' y TikTok.'):'Velforce no apareció en las cuentas de Metricool consultadas.')+' Verificado el '+socialDiscovery.date+'. Falta conectar la oficina y confirmar el acceso API del plan; publicar sigue deshabilitado.';
  codexState.textContent=state.status==='loading'?'Comprobando conexión…':state.status!=='ready'?'Sin verificar':state.caps?.runnerConnected===true?'Cuenta conectada':'Sin conexión';codexState.classList.toggle('is-connected',state.status==='ready'&&state.caps?.runnerConnected===true);
  homeBody.replaceChildren();profileBody.replaceChildren();
  if(state.status!=='ready'){
   const title=state.status==='loading'?'Cargando tus trabajos…':state.status==='error'?'No se pudieron cargar los trabajos':'El Estudio aún no está conectado';
   homeBody.append(emptyState(title,state.error||'Acá aparecerán las solicitudes y las piezas que necesiten tu decisión.',{action:state.status==='error'?button('Volver a cargar',()=>data.refresh()):null}));
   profileBody.append(el('p',state.status==='loading'?'Cargando el perfil de marca…':'El perfil no está disponible. Volvé a cargar los trabajos.','muted'));return;
  }
  const waiting=state.jobs.filter(j=>['awaiting_review','changes_requested'].includes(j.state)),progress=state.jobs.filter(j=>['queued','running'].includes(j.state)),attention=state.jobs.filter(j=>j.state==='blocked');
  const decision=section('Necesita tu decisión','decision-section');decision.append(el('p',waiting.length?'Tenés '+waiting.length+' '+(waiting.length===1?'pieza para revisar.':'piezas para revisar.'):'Todavía no hay videos para revisar.','section-description'));
  if(waiting.length){const first=waiting[0],spot=el('article','','decision-spotlight');spot.append(icon('play'),badge(first.state),el('h3',first.brief.objective),el('p',isTechnical(first)?'Prueba técnica disponible. Revisala antes de aceptarla.':'Vista previa disponible para tu revisión.'),link('Revisar pieza',jobHref(first),'ui-button ui-primary'));decision.append(spot);}
  else{decision.append(emptyState('Tu bandeja está al día',progress.length?'Hay '+progress.length+' '+(progress.length===1?'solicitud en proceso.':'solicitudes en proceso.'):'Podés guardar una solicitud para empezar.',{iconName:'check',action:link(progress.length?'Ver solicitudes':'Solicitar un video',progress.length?'#/estudio?estado=process':'#/estudio?nueva=1')}));}
  const columns=el('div','','desk-columns');
  for(const [title,jobs,empty] of [['En marcha',progress,'No hay solicitudes en marcha.'],['Requiere atención',attention,'No hay piezas bloqueadas.']]){const sectionNode=section(title,'desk-block'),list=el('div','','work-list');for(const job of jobs.slice(0,5))list.append(row(job));sectionNode.append(list);if(!jobs.length)sectionNode.append(el('p',empty,'muted'));columns.append(sectionNode);}
  const pipeline=section('Tu equipo de contenido','pipeline-section');const steps=el('ol','','team-flow');for(const [name,task] of [['Valeria','Investiga y define el enfoque'],['Mateo','Escribe guion y storyboard'],['Nico','Selecciona y pide correcciones'],['Lucía, Bruno e Inés','Preparan la edición'],['Control','Revisa la calidad audiovisual'],['Jorge','Aprueba la versión final']]){const li=el('li');li.append(el('strong',name),el('span',task));steps.append(li);}pipeline.append(steps,link('Ver equipo y actividad','#/oficina','text-link'));
  const left=el('div'),note=el('div','','director-note');note.append(icon('clock'),el('p',state.office?.coordination.message||'La oficina coordina las solicitudes de esta marca.'));left.append(note,decision,columns,link('Ver todos los trabajos','#/estudio?estado=all','text-link'));homeBody.append(left,pipeline);
  const brand=state.caps?.brandProfiles?.[brandContext.get().id];if(!brand){profileBody.append(emptyState('Perfil no disponible','No se pudo cargar el contexto de esta marca.'));return;}
  const identity=el('section','','brand-profile');identity.append(el('div',brand.name,'brand-wordmark'),el('p','Perfil de contenido actual','muted'));const facts=el('dl','','profile-facts');for(const [key,value] of [['Público',brand.audience],['Enfoque',brand.focus],['Canales previstos',brand.channels.map(x=>({instagram:'Instagram',facebook:'Facebook',tiktok:'TikTok'}[x]||x)).join(', ')]]){const pair=el('div');pair.append(el('dt',key),el('dd',value));facts.append(pair);}identity.append(facts);profileBody.append(identity);
  profileBody.append(brandDirection(brandContext.get().id));
 }
 data.subscribe(render);return {voiceContainer:voice};
}
