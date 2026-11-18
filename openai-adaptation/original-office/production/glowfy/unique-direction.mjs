import fs from 'node:fs';
const plans=JSON.parse(fs.readFileSync(new URL('./batch-3.json',import.meta.url),'utf8'));
export const VISUAL_REVISION='glowfy-unique-20261116';
export const directions={
 booking:'Producción exclusiva: un espacio berenjena con conversaciones flotantes de diferentes profundidades; los mensajes se ordenan, dos opciones de horario aparecen como objetos y la elección se convierte en una reserva troquelada. Cámara sigue el trayecto mensaje-opción-reserva. No usar teléfono, manos, salón ni la plantilla anterior. Mantener el guion ya escrito y su CTA, si existen; el cambio es audiovisual.',
 reminder:'Producción exclusiva: escritorio cenital cálido, papeles y agenda. Una cita queda enterrada bajo mensajes; un barrido despeja los papeles; reloj y sobre se abren y revelan recordatorio, respuesta Gracias y estado enviado. Mecánica de papel, rotación, deslizamiento y pliegue. No usar teléfono ni la secuencia visual del video de reserva. Mantener el guion ya escrito y su CTA, si existen; el cambio es audiovisual.',
 reschedule:'Producción exclusiva: agenda como objeto en perspectiva, planos inclinados, ficha de cita manipulable, reloj de dígitos que cambia de 11:00 a 16:00 y recorrido del bloque entre dos filas. La hora elegida se ve pasar a la agenda. Composición arquitectónica y movimiento de arrastre/salto/aterrizaje. No usar teléfono, manos ni sobre. Narración 40–50 palabras, cuatro escenas, 480 caracteres máximo; CTA Conocé Glowfy.'
};
export async function applyUniqueDirection(flow,enabled=false){
 if(!enabled)return [];
 const revised=[];
 for(const p of plans){const j=await flow.get('glowfy',p.id);if(j.uniqueVisualRevision===VISUAL_REVISION)continue;if(['running','approved','discarded','awaiting_review'].includes(j.state))throw Error('VISUAL_REVISION_STATE_CONFLICT');
  await flow.updateOffice('glowfy',p.id,j.version,x=>{
   x.revisions||=[];x.revisions.push({version:x.version,outputs:structuredClone(x.outputs),artifact:x.artifact,approval:x.approval,reason:'owner_requested_unique_visual_production'});x.version++;
   x.brief.evidence=x.brief.evidence.filter(e=>!['piece_direction','unique_art_direction'].includes(e.id));x.brief.evidence.push({id:'unique_art_direction',text:directions[p.variant]+' Jorge corrigió: cada video debe tener animaciones y producción únicas; no basta cambiar los textos. Recursos del nuevo motor ya preparados. Ejemplos ilustrados, funciones según plan. No inventar afirmaciones ni nuevas voces.',source:'Corrección explícita de Jorge y dirección específica de producción',date:'2026-11-16'});
   delete x.outputs.art_direction;delete x.outputs.production;delete x.outputs.qa;x.artifact=null;x.approval=null;x.execution=null;x.productionProgress=null;x.blocker=null;x.state='queued';x.stage=x.outputs.creative_review?.detail?.verdict==='pass'?'art_direction':'research';x.uniqueVisualRevision=VISUAL_REVISION;
  },'unique_visual_direction_applied');revised.push(p.id);
 }
 return revised;
}
export function uniqueSoundCues(b){const e=b.events;const sets={
 booking:[['golpe-grave-01',0,-10],['burbuja-mensaje-01',.69,-11],['pop-ui-01',1.13,-12],['tick-cursor-01',1.57,-12],['whoosh-corto-01',e.phoneFocus,-11],['pop-ui-01',e.assistant,-11],['clic-boton-01',e.reply,-10],['burbuja-mensaje-01',e.reply+.12,-12],['whoosh-corto-01',e.calendar,-11],['ding-confirmacion-01',e.calendar+.8,-11],['destello-particulas-01',e.closing+.18,-11]],
 reminder:[['golpe-grave-01',0,-12],['pop-ui-01',.4,-11],['pop-ui-01',.92,-12],['pop-ui-01',1.44,-12],['whoosh-corto-01',e.phoneFocus,-12],['tick-cursor-01',e.phoneFocus+.8,-14],['whoosh-corto-01',e.assistant,-12],['burbuja-mensaje-01',e.reply,-10],['whoosh-corto-01',e.calendar,-12],['clic-boton-01',e.reminder,-11],['ding-confirmacion-01',e.reminder+.12,-12]],
 reschedule:[['golpe-grave-01',0,-10],['burbuja-mensaje-01',.45,-11],['whoosh-corto-01',e.phoneFocus,-10],['tick-cursor-01',e.assistant,-12],['clic-boton-01',e.reply,-11],['burbuja-mensaje-01',e.reply+.15,-12],['whoosh-corto-01',e.calendar,-11],['whoosh-corto-01',e.calendar+.45,-13],['ding-confirmacion-01',e.calendar+1.4,-10],['destello-particulas-01',e.closing+.18,-12]]};
 return (sets[b.variant]||[]).filter(([,time])=>time>=0&&time<b.duration-.5).map(([name,time,gainDb])=>({name,time,gainDb}));
}
