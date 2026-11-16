export const audiovisualCriteria=Object.freeze([
 {id:'story',label:'Historia y claridad',question:'¿La acción visual cuenta una idea comprensible desde la apertura?'},
 {id:'craft',label:'Composición y materiales',question:'¿Los detalles, la luz, la profundidad y la lectura en móvil están cuidados?'},
 {id:'motion',label:'Cámara y ritmo',question:'¿Los movimientos tienen intención, continuidad y pausas suficientes?'},
 {id:'voice',label:'Voz e interpretación',question:'¿La narración se entiende y tiene una intención natural?'},
 {id:'sound',label:'Música y efectos',question:'¿La mezcla acompaña las acciones y permite entender cada frase?'},
 {id:'originality',label:'Identidad y variedad',question:'¿Esta pieza se distingue visualmente de las anteriores y mantiene la marca?'}
]);
export const directionRules='Estándar audiovisual de Jorge: cada pieza debe ser agradable de mirar y tener una producción propia. Cuenta mediante acciones, no acumulación de textos. Define planos de distinta escala, luz/materiales y continuidad del objeto protagonista; especifica cada entrada, reposo y salida. Alterna ritmo y pausa según la narración. Escribe frases naturales y una intención de voz por escena; evita narrar notas internas o aclaraciones técnicas innecesarias. Diseña anticipaciones, contactos, ambiente, silencios y resolución musical con recursos autorizados. Compara con el historial de esta misma marca; cambiar palabras no basta. La evaluación de guion no acredita el render: imagen y mezcla requieren revisión del archivo exacto después de exportar, y Jorge conserva la aprobación final.';
export function validateAudiovisualReview(review,job){
 if(!review||review.version!==job.version||review.artifactHash!==job.artifact?.sha256||!Array.isArray(review.criteria)||review.criteria.length!==audiovisualCriteria.length)throw Error('REVIEW_VERSION_REQUIRED');
 if(Object.keys(review).some(k=>!['version','artifactHash','criteria'].includes(k))||new Set(review.criteria.map(c=>c.id)).size!==audiovisualCriteria.length)throw Error('INVALID_AUDIOVISUAL_REVIEW');
 for(const c of review.criteria)if(!audiovisualCriteria.some(x=>x.id===c.id)||!['checked','needs_change','not_checked'].includes(c.status)||typeof c.note!=='string'||!c.note.trim()||c.note.length>1600||Object.keys(c).some(k=>!['id','status','note'].includes(k)))throw Error('INVALID_AUDIOVISUAL_REVIEW');
 return structuredClone(review);
}
export function recentVisualHistory(jobs,currentId){return jobs.filter(j=>j.id!==currentId&&j.artifact).slice(0,5).map(j=>({id:j.id,objective:j.brief.objective.slice(0,160),concept:(j.productionPlan?.concept||j.outputs.art_direction?.summary||'').slice(0,240),visual:j.outputs.art_direction?.detail?.keyframes?.map(k=>k.composition.slice(0,260)).join(' ').slice(0,600)||'',source:'Prior brand production; not evidence of performance'}));}
