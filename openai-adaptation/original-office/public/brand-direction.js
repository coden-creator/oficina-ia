import {el,link} from './ui.js';
const drafts={
 velforce:{title:'Cada oportunidad avanza',lead:'Orden comercial, precisión y movimiento con propósito.',colors:[['Azul','347EF3'],['Violeta','7045E8'],['Tinta propuesta','0D1830'],['Fondo propuesto','F5F8FC']],type:'Sans serif de trazos firmes, títulos breves y cifras claras. La presentación usa DejaVu Sans; la tipografía final del video queda por revisar.',motion:'Seguimiento de una oportunidad entre etapas, asignación de responsable y fechas que se convierten en acciones. Cámara horizontal y transiciones que conservan el mismo objeto.',sound:'Contactos secos y discretos; pulso preciso, pausas al mostrar la siguiente acción. Selección musical propia pendiente.',source:'Presentación comercial de Velforce',url:'https://drive.google.com/file/d/172RjS77hdmKxySbzU85f-WB3nueCjk-w/view',basis:'Azul y violeta extraídos de la presentación existente. Composición, materiales y movimiento: propuesta nueva.',scenes:[['Contacto','Una oportunidad entra'],['Responsable','El equipo toma la tarea'],['Siguiente acción','El seguimiento continúa']]},
};
export function brandDirection(brand){
 const d=drafts[brand],section=el('section','','brand-direction');
 if(!d){section.append(el('h2','Recursos visuales'),el('p',['quiba','purify'].includes(brand)?'El desarrollo de esta identidad queda para una etapa posterior.':'La gestión de recursos visuales desde esta pantalla está pendiente.','muted'));return section;}
 section.dataset.brand=brand;section.append(el('h2','Dirección audiovisual propuesta'),el('p','Borrador para tu revisión','direction-status'));
 const board=el('div','','identity-board '+brand),title=el('h3',d.title),stages=el('ol','','identity-scenes');
 board.append(title,el('p',d.lead));for(const [name,description]of d.scenes){const stage=el('li');stage.append(el('strong',name),el('span',description));stages.append(stage);}board.append(stages);section.append(board);
 const swatches=el('ul','','brand-swatches');for(const [name,hex]of d.colors){const item=el('li'),color=el('span','','color-swatch');color.style.backgroundColor='#'+hex;color.setAttribute('aria-hidden','true');item.append(color,el('strong',name),el('span','#'+hex));swatches.append(item);}section.append(swatches,el('p',d.basis,'muted'));
 const notes=el('dl','','direction-notes');for(const [name,value]of [['Tipografía',d.type],['Movimiento y materiales',d.motion],['Sonido',d.sound]]){const row=el('div');row.append(el('dt',name),el('dd',value));notes.append(row);}section.append(notes,link('Ver fuente: '+d.source,d.url,'text-link'),el('p','Esta propuesta no cambia tus logos ni aprueba piezas automáticamente. Falta producir y revisar un fragmento de referencia.','quiet-copy'));return section;
}

// Discovery through the connected Metricool app, not a live VPS connection.
export const socialDiscovery=Object.freeze({date:'16 de noviembre de 2026',profiles:{glowfy:'Glowfy',purify:'Purify.gq',quiba:'Grupo Quiba',coden:'CODEn'}});
