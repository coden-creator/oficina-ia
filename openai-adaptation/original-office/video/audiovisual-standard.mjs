export const audiovisualCriteria=Object.freeze([
 {id:'story',label:'Historia y claridad',question:'¿La acción visual cuenta una idea comprensible desde la apertura?'},
 {id:'craft',label:'Composición y materiales',question:'¿Los detalles, la luz, la profundidad y la lectura en móvil están cuidados?'},
 {id:'motion',label:'Cámara y ritmo',question:'¿Los movimientos tienen intención, continuidad y pausas suficientes?'},
 {id:'voice',label:'Voz e interpretación',question:'¿La narración se entiende y tiene una intención natural?'},
 {id:'sound',label:'Música y efectos',question:'¿La mezcla acompaña las acciones y permite entender cada frase?'},
 {id:'originality',label:'Identidad y variedad',question:'¿Esta pieza se distingue visualmente de las anteriores y mantiene la marca?'}
]);
export const directionRules='Estándar audiovisual de Jorge: cada pieza debe ser agradable de mirar y tener una producción propia. Cuenta mediante acciones, no acumulación de textos. Define planos de distinta escala, luz/materiales y continuidad del objeto protagonista; especifica cada entrada, reposo y salida. Alterna ritmo y pausa según la narración. Escribe frases naturales y una intención de voz por escena; evita narrar notas internas o aclaraciones técnicas innecesarias. Diseña anticipaciones, contactos, ambiente, silencios y resolución musical con recursos autorizados. Compara con el historial de esta misma marca; cambiar palabras no basta. referenceUse=negative-reference identifica un render con correcciones pendientes: sus review.findings son defectos que evitar, no ejemplos aprobados para imitar. Un archivo exportado o un comité de guion aprobado no implica aprobación audiovisual. No confundas cambiar camera con una nueva acción del objeto; explicá qué sucede y qué entiende el espectador. La evaluación de guion no acredita el render: imagen y mezcla requieren revisión del archivo exacto después de exportar, y Jorge conserva la aprobación final.';
export function validateAudiovisualReview(review,job){
 if(!review||review.version!==job.version||review.artifactHash!==job.artifact?.sha256||!Array.isArray(review.criteria)||review.criteria.length!==audiovisualCriteria.length)throw Error('REVIEW_VERSION_REQUIRED');
 if(Object.keys(review).some(k=>!['version','artifactHash','criteria'].includes(k))||new Set(review.criteria.map(c=>c.id)).size!==audiovisualCriteria.length)throw Error('INVALID_AUDIOVISUAL_REVIEW');
 for(const c of review.criteria)if(!audiovisualCriteria.some(x=>x.id===c.id)||!['checked','needs_change','not_checked'].includes(c.status)||typeof c.note!=='string'||!c.note.trim()||c.note.length>1600||Object.keys(c).some(k=>!['id','status','note'].includes(k)))throw Error('INVALID_AUDIOVISUAL_REVIEW');
 return structuredClone(review);
}
export function recentVisualHistory(jobs,currentId,brand=jobs.find(j=>j.id===currentId)?.brandId){
 if(!brand)return [];
 const short=(text,max)=>typeof text==='string'?text.slice(0,max):'';
 const rows=jobs.filter(j=>j.brandId===brand&&j.id!==currentId&&(j.artifact||j.outputs?.strategy?.detail))
  .sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,7).map(j=>{
   // Reviews belong to one exact export. A past observation cannot silently
   // become an approval or a rejection of a different file/version.
   const review=j.artifact?j.audiovisualReviews?.filter(r=>r.version===j.version&&r.artifactHash===j.artifact.sha256).at(-1):null;
   const criteria=review?.criteria||[],changes=criteria.filter(c=>c.status==='needs_change');
   const approved=j.state==='approved'&&j.approval?.version===j.version&&j.approval?.artifactHash===j.artifact?.sha256;
   const referenceUse=approved?'owner-approved':changes.length?'negative-reference':j.artifact?'unreviewed-example':'concept-only';
   return {id:j.id,version:j.version,objective:short(j.brief.objective,160),concept:short(j.productionPlan?.concept||j.outputs?.strategy?.detail?.angle||j.outputs?.art_direction?.summary,240),
    visual:short(j.productionPlan?.shots?.map(s=>s.action+'; camera='+s.camera).join(' | ')||j.outputs?.art_direction?.detail?.keyframes?.map(k=>k.composition).join(' '),600),
    referenceUse,review:review?{version:review.version,artifactHash:review.artifactHash,needsChanges:changes.map(c=>c.id),notChecked:criteria.filter(c=>c.status==='not_checked').map(c=>c.id),findings:changes.slice(0,6).map(c=>({criterion:c.id,note:short(c.note,140)}))}:null,
    source:j.artifact?'Prior brand production; use referenceUse and the exact-version review, never infer performance or approval':'Prior brand proposal, no exported video; avoid repeating its concept'};
  });
 // The caller trims from the end to fit the model budget. Keep the recent
 // negative references ahead of optional inspiration, without adding old jobs.
 return rows.sort((a,b)=>Number(b.referenceUse==='negative-reference')-Number(a.referenceUse==='negative-reference'));
}
