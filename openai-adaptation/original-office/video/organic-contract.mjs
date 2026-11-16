import {motionSchema,validateMotionPlan,motionPrompt,MOTION_PROTOCOL} from './motion-contract.mjs';
import {AUTHORED_PROTOCOL,authoredPlanSchema,designSchema,visualReviewSchema,validateGraph,validateAuthoredPlan} from './authored-motion.mjs';
// Contracts for preproduction, not the diagnostic card renderer or permission to spend.
export const ORGANIC_PROTOCOL='organic-v1';
export const organicStages=Object.freeze(['research','strategy','script','creative_review','art_direction','edit_plan','motion_design','visual_review']);
export const criteria=Object.freeze([
 {id:'hook',label:'Apertura comprensible'}, {id:'audience',label:'Público y problema'},
 {id:'evidence',label:'Promesa sustentada'}, {id:'originality',label:'Novedad frente al historial'},
 {id:'visual',label:'Viabilidad y lectura visual'}, {id:'cta',label:'Claridad de la acción'}
]);
const str=(max=2000)=>({type:'string',minLength:1,maxLength:max});
const obj=properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
const array=(items,min=0,max=10)=>({type:'array',items,minItems:min,maxItems:max});
export function organicSchema(stage,brand,cta,evidenceIds=null,productionMode=null){
 const evidence=obj({sourceId:str(80),claim:str(1000)});
 const detail={
  edit_plan:productionMode===AUTHORED_PROTOCOL?authoredPlanSchema:motionSchema,
  motion_design:designSchema,visual_review:visualReviewSchema,
  research:obj({ideas:array(obj({angle:str(400),reason:str(1000)}),1,3),limitations:array(str(1000),0,8)}),
  strategy:obj({angle:str(1000),audience:str(1000),permittedClaims:array(str(1000),0,12)}),
  script:obj({hook:str(400),narration:str(8000),scenes:array(obj({text:str(300),narration:str(1500),action:str(2000),assets:array(str(300),0,8)}),3,8),closing: {type:'string',enum:[cta]}}),
  creative_review:obj({verdict:{type:'string',enum:['pass','changes','reject']},criteria:array(obj({id:{type:'string',enum:criteria.map(c=>c.id)},score:{type:'integer',minimum:0,maximum:10},reason:str(1000)}),6,6),corrections:array(str(1000),0,8)}),
  art_direction:obj({keyframes:array(obj({moment:{type:'string',enum:['opening','solution','closing']},composition:str(2000),motion:str(2000)}),3,3),assets:array(obj({description:str(1000),sourceId:str(80),availability:{type:'string',enum:['provided','needed']}}),0,20),audioNotes:str(2000)})
 };
 if(stage==='script'&&[MOTION_PROTOCOL,AUTHORED_PROTOCOL].includes(productionMode)){detail.script.properties.narration.maxLength=440;detail.script.properties.scenes.minItems=4;detail.script.properties.scenes.maxItems=4;detail.script.properties.scenes.items.properties.text.maxLength=productionMode===MOTION_PROTOCOL?28:2000;}
 if(!detail[stage])throw Error('INVALID_ORGANIC_STAGE');
 const schema=obj({brand:{type:'string',enum:[brand]},stage:{type:'string',enum:[stage]},summary:str(3000),evidence:array(evidence,0,30),detail:detail[stage]});
 if(evidenceIds!==null){const ids=[...new Set(evidenceIds)];if(ids.length)schema.properties.evidence.items.properties.sourceId={type:'string',enum:ids};else schema.properties.evidence.maxItems=0;}
 return schema;
}
function check(value,schema){
 if(schema.enum&&!schema.enum.includes(value))throw Error('ORGANIC_ENUM');
 if(schema.type==='object'){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==schema.required.length||schema.required.some(k=>!Object.hasOwn(value,k)))throw Error('ORGANIC_FIELDS');for(const k of schema.required)check(value[k],schema.properties[k]);}
 else if(schema.type==='array'){if(!Array.isArray(value)||value.length<schema.minItems||value.length>schema.maxItems)throw Error('ORGANIC_ARRAY');for(const item of value)check(item,schema.items);}
 else if(schema.type==='string'){if(typeof value!=='string'||(schema.minLength&&!value.trim())||value.length>(schema.maxLength??Infinity))throw Error('ORGANIC_TEXT');}
 else if(schema.type==='integer'&&(!Number.isInteger(value)||value<schema.minimum||value>schema.maximum))throw Error('ORGANIC_SCORE');
}
export function validateOrganicOutput(output,{stage,brand,brief}){
 check(output,organicSchema(stage,brand,brief.cta,null,brief.productionMode));
 const ids=new Set((brief.evidence||[]).map(e=>e.id));
 if(output.evidence.some(e=>!ids.has(e.sourceId)))throw Error('UNSUPPORTED_EVIDENCE');
 if(stage==='edit_plan')(brief.productionMode===AUTHORED_PROTOCOL?validateAuthoredPlan:validateMotionPlan)(output.detail);
 if(stage==='motion_design')validateGraph(JSON.parse(output.detail.graph));
 if(stage==='visual_review'&&output.detail.verdict==='changes'&&!output.detail.corrections.length)throw Error('MISSING_CORRECTIONS');
 if(stage==='script'&&brief.productionMode===MOTION_PROTOCOL){const d=output.detail;if(d.scenes.map(s=>s.narration.trim()).join(' ')!==d.narration.trim()||d.scenes.some(s=>s.text.trim().split(/\s+/).length>5))throw Error('MOTION_NARRATION_CONTRACT');}
 if(stage==='script'&&brief.productionMode===AUTHORED_PROTOCOL){const d=output.detail;d.narration=d.scenes.map(s=>s.narration.replace(/\s+/g,' ').trim()).join(' ');if(d.narration.length>440)throw Error('MOTION_NARRATION_CONTRACT');}
 if(stage==='creative_review'){
  if(new Set(output.detail.criteria.map(c=>c.id)).size!==6)throw Error('DUPLICATE_CRITERIA');
  const total=output.detail.criteria.reduce((n,c)=>n+c.score,0);
  // Internal editorial threshold, not a forecast of virality or owner approval.
  if(output.detail.verdict==='pass'&&(total<42||output.detail.criteria.some(c=>c.score<6)))throw Error('INVALID_CREATIVE_PASS');
  if(output.detail.verdict==='changes'&&!output.detail.corrections.length)throw Error('MISSING_CORRECTIONS');
 }
 if(stage==='art_direction'&&(new Set(output.detail.keyframes.map(k=>k.moment)).size!==3||output.detail.assets.some(a=>a.availability==='provided'&&!ids.has(a.sourceId))))throw Error('UNVERIFIED_ART_ASSETS');
 return output;
}
export const organicPrompts=Object.freeze({
 edit_plan:motionPrompt,
 research:'Valeria: analiza evidencia aportada y hasta tres ángulos originales. No hay navegación: declara ese límite y no inventes tendencias ni métricas. Consulta visualHistory, que incluye propuestas del mismo lote: elige un concepto distinto de los anteriores; no repitas la misma idea con otro título.',
 strategy:'Valeria: elige un ángulo coherente con objetivo, público y hechos comprobados. Explica la elección y las afirmaciones permitidas.',
 script:'Mateo: escribe narración y storyboard de 3 a 8 escenas con acciones visuales concretas, recursos necesarios y cierre con la CTA exacta. La duración final dependerá de la voz real. Cada pieza necesita un concepto visual propio, un objeto protagonista y transformaciones que cuenten esa idea. Cambiar palabras, colores o música de una misma plantilla no crea otra producción. Usa la dirección específica del brief; no repitas por defecto teléfono, mano y agenda. No produzcas tarjetas de texto como sustituto del video.',
 creative_review:'Nico: revisa el guion con los seis criterios. Cada nota exige una razón. Pass solo si total >=42/60 y cada nota >=6. Changes debe indicar correcciones concretas; reject descarta el concepto. No afirmes haber visto un video ni pronostiques viralidad.',
 art_direction:'Respuesta concisa: resumen de hasta 240 caracteres, composición y movimiento de hasta 450 caracteres cada uno, notas de audio hasta 500. Usa exactamente los momentos opening, solution y closing; agrupa en ellos los planos detallados del brief. Los sourceId deben copiar un id del brief, nunca inventarse. No agregues campos al esquema. Editor: define apertura, solución y cierre, composición y movimiento. Diseña composición, recorrido de cámara, coreografía de objetos, transiciones y mapa de sonido específicos del concepto. Cada video debe distinguirse por sus acciones y construcción visual, no solo por sus textos. Comparte identidad de marca y biblioteca autorizada, no la misma secuencia de escenas. Identifica recursos aportados o pendientes y notas de audio. No inventes logos ni generes voz; no ejecutes código ni prometas una exportación.'
});
