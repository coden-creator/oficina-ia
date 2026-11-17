import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
import {AUTHORED_PROTOCOL,validateAuthoredPlan,validateGraph,designPrompt,choreographyDesign} from '../../video/authored-motion.mjs';
import {runProcess} from '../process.mjs';
export const AUTHORED_RENDER_REVIEW='clean-brand-v3';
export const AUTHORED_MAX_REVISIONS=4;
export function correctionFor(review,scene){const items=review?.output?.detail?.corrections?.filter(c=>c.scene===scene)||[];return items.length?{scene,instruction:items.map((c,i)=>`${i+1}. ${c.instruction}`).join('\n')}:null;}
export function endingPose(graph){const g=structuredClone(graph);for(const n of g.nodes){for(const [k,points] of Object.entries(n.tracks||{}))n[k]=points.at(-1)[1];delete n.tracks;}if(g.camera){for(const [k,points] of Object.entries(g.camera.tracks||{}))g.camera[k]=points.at(-1)[1];delete g.camera.tracks;}delete g.transitionIn;g.sounds=[];return g;}
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function authoredPlan(job,ids){
 if(job?.brandId!=='glowfy'||!ids.includes(job.id)||job.brief?.productionMode!==AUTHORED_PROTOCOL||job.productionAuthorization?.protocol!==AUTHORED_PROTOCOL)return null;
 if(job.outputs.edit_plan?.provenance?.provider!=='codex-chatgpt-plan')throw Error('OFFICE_EDIT_PLAN_REQUIRED');
 const p=validateAuthoredPlan(job.outputs.edit_plan.detail);return {...p,authored:true,directed:true,key:p.title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ -]/g,'').slice(0,60),variant:'authored',maxNarrationCharacters:480,authorization:'Jorge: tres NUEVOS videos completos y distintos; uso incluido y voz existente; 2026-11-16'};
}
export async function authorScenes({job,plan,beats,outDir,runner,onStage}){
 const choreography=job.motionChoreography==='continuity-v1',renderer=choreography?'continuity-v1':AUTHORED_RENDER_REVIEW,revisionLimit=choreography?6:AUTHORED_MAX_REVISIONS;
 const folder=path.join(outDir,'authored');await fs.mkdir(folder,{recursive:true,mode:0o700});
 const sourceHash=hash({script:job.outputs.script.detail,plan,version:job.version});
 const read=async f=>{try{return JSON.parse(await fs.readFile(path.join(folder,f),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;return null;}};
 const write=async(f,data)=>{await fs.writeFile(path.join(folder,f),JSON.stringify(data,null,2),{flag:'wx',mode:0o600});};
 const call=async(stage,prompt,input,images=[])=>{
  const r=await runner.run({brand:'glowfy',jobId:job.id,stage,prompt,input:{brief:job.brief,...input},images,context:{workflow:'organic-v1',brand:'glowfy',version:job.version,restrictions:{noPaid:true,noPublish:true,noCloning:true}}});
  if(r?.status!=='completed')throw Error(r?.reason||'AUTHORED_SPECIALIST_FAILED');if(r.provenance?.provider!=='codex-chatgpt-plan')throw Error('UNVERIFIED_ORGANIC_PROVIDER');return r;
 };
 let scenes=[],review=null;const reviews=[];
 for(let attempt=0;attempt<=revisionLimit;attempt++){
  for(let i=0;i<4;i++){
   const correction=correctionFor(review,i+1);if(attempt&&!correction)continue;
   await onStage('production',`${attempt?'Corrigiendo':'Diseñando'} la escena ${i+1}/4 con ${job.outputs.edit_plan.provenance.model||'Codex'}${attempt?' · revisión '+attempt:''}`);
   const file=`scene-${i+1}-${renderer}-attempt-${attempt}.json`;let saved=await read(file);
   // Re-inspect the latest authored designs after a renderer fix; preserve prior inference/audio.
   if(!saved&&attempt===0&&!choreography){
    for(const prefix of ['isolated-tiles-v2-','']){for(let old=AUTHORED_MAX_REVISIONS;old>=0;old--){const previousFile=`scene-${i+1}-${prefix}attempt-${old}.json`,prior=await read(previousFile);if(prior){if(prior.sourceHash!==sourceHash)throw Error('AUTHORED_CACHE_CONFLICT');saved={...prior,seededFrom:previousFile,renderReview:renderer};await write(file,saved);break;}}if(saved)break;}
   }
   const start=beats.scenes[i].start,end=i===3?beats.duration:beats.scenes[i+1].start;
   if(saved&&saved.sourceHash!==sourceHash)throw Error('AUTHORED_CACHE_CONFLICT');
   if(!saved){
    const input={plan,scene:plan.scenes[i],...(i>0?{previousSceneGraph:endingPose(scenes[i-1].graph),continuity:'Previous scene graph is frozen at its exact final pose, including corrections made in this round. Preserve recognisable object geometry, labels and materials. Reframe purposefully; carry forward the completed state.'}:{}),spokenText:beats.scenes[i].narration,durationSeconds:end-start,wordTiming:beats.words.filter(w=>w.start>=start&&w.start<end).map(w=>({word:w.text,at:Number(((w.start-start)/(end-start)).toFixed(3))})),...(correction?{previousGraph:scenes[i].graph,correction:correction.instruction}:{}),artDirection:job.outputs.art_direction.detail};
    const images=[...(choreography?(job.motionReferenceImages||[]):[]),...(correction?['data:image/jpeg;base64,'+(await fs.readFile(path.join(folder,`review-scene-${i+1}.jpg`))).toString('base64')]:[])].slice(0,4);
    const result=await call('motion_design',designPrompt+(choreography?'\n'+choreographyDesign:''),input,images);if(result.output.detail.scene!==i+1)throw Error('AUTHORED_SCENE_ORDER');
    saved={sourceHash,attempt,...result};await write(file,saved);
   }
   scenes[i]={scene:i+1,start,end,graph:validateGraph(JSON.parse(saved.output.detail.graph)),provenance:saved.provenance,rationale:saved.output.detail.rationale,attempt};
  }
  const imageConfig=path.join(folder,'preview-config.json');await fs.writeFile(imageConfig,JSON.stringify({outDir:folder,scenes,choreography,beats:{...beats,authored:true,authoredScenes:scenes}}));
  await runProcess(process.execPath,[new URL('./authored-previews.mjs',import.meta.url).pathname,imageConfig]);
  await onStage('production','El director revisa cuatro secuencias de imágenes reales del render');
  const previousReview=review;
  const graphHash=hash({renderer,scenes:scenes.map(s=>s.graph)}),file=`review-${renderer}-${attempt}.json`;review=await read(file);
  if(review&&review.graphHash!==graphHash)throw Error('AUTHORED_REVIEW_CONFLICT');
  if(!review){
   const images=await Promise.all(scenes.map(async s=>'data:image/jpeg;base64,'+(await fs.readFile(path.join(folder,`review-scene-${s.scene}.jpg`))).toString('base64')));
   const r=await call('visual_review','Director de calidad: inspecciona las CUATRO imágenes adjuntas, cada una es una secuencia real de cuatro momentos (0/28/58/88%) de una escena. No son descripciones. Evalúa legibilidad, jerarquía, reconocibilidad, recortes, sombras, espacio negativo, acciones y coherencia con el guion. Critica defectos VISIBLES concretos: identifica texto/objeto y ubicación. Rechaza collage estático, diapositivas genéricas, objetos ilegibles o solapados. No inventes un problema porque la imagen no tiene sonido: estos cuadros no permiten juzgar voz, sincronía exacta ni movimiento entre muestras. No pidas cambiar el guion ni audio; corrige la construcción vectorial. Emite pass sólo cuando las cuatro escenas son visualmente presentables. Si changes, incluye una sola instrucción concreta por escena afectada, nunca detalles vagos ni nuevas exigencias incompatibles. Tu veredicto es revisión interna de imágenes, NO aprobación de Jorge ni certificación audiovisual completa.',{plan,rendererLayers:'Subtítulos automáticos. Leyenda inferior sólo si no hay aclaración propia en el grafo. CTA y logo de cierre sólo si faltan en el grafo, sin banda de fondo. La revisión corresponde al resultado compuesto.',narration:job.outputs.script.detail.narration,designNotes:scenes.map(s=>({scene:s.scene,rationale:s.rationale})),previousReview:previousReview?.output?.detail??null},images);
   review={sourceHash,graphHash,attempt,renderer,...r};await write(file,review);
  }
  reviews.push(review);
  if(choreography&&review.output.detail.verdict==='pass'){
   const motionFile=`motion-review-${renderer}-${attempt}.json`;let motion=await read(motionFile);
   if(motion&&motion.graphHash!==graphHash)throw Error('AUTHORED_REVIEW_CONFLICT');
   if(!motion){
    await onStage('production','Revisando movimiento y transiciones con secuencias densas');
    const images=await Promise.all(scenes.map(async s=>'data:image/jpeg;base64,'+(await fs.readFile(path.join(folder,`motion-scene-${s.scene}.jpg`))).toString('base64')));
    const measurements=JSON.parse(await fs.readFile(path.join(folder,'motion-measurements.json'),'utf8'));
    const result=await call('visual_review','Revisión de MONTAJE y MOVIMIENTO. Cada imagen tiene 16 cuadros consecutivos con tiempo real. La primera fila de escenas2–4 cubre la unión con la escena anterior en pasos de0.12s; las filas siguientes muestran el desarrollo. Jorge rechazó el lote previo por movimiento escaso y transiciones malas. Busca saltos no motivados, cambios de tamaño/posición, restablecer objetos sin causa, periodos de reposo excesivos y una cámara que deje de seguir la acción. Evalúa las acciones del objeto, no únicamente el movimiento de la cámara o cantidad de píxeles. Las mediciones sólo detectan congelación, no calidad. Rechaza una transición que desaparece por corte abrupto, un objeto irreconocible al girar, interfaz sin respuesta visible o la misma animación de entrada repetida. No inventes defectos de sonido: no se adjunta audio. Incluye correcciones concretas de escenas afectadas, manteniendo guion/voz. Pass es revisión interna de las secuencias muestreadas, nunca aprobación de Jorge.',{plan,measurements,transitions:scenes.map(s=>({scene:s.scene,transition:s.graph.transitionIn||null,camera:s.graph.camera||null,rationale:s.rationale})),previousReview:previousReview?.output?.detail??null},images);
    motion={sourceHash,graphHash,attempt,renderer,scope:'dense-motion-and-boundaries',...result};await write(motionFile,motion);
   }
   reviews.push(motion);review=motion;
  }
  if(review.output.detail.verdict==='pass')break;
  if(attempt===revisionLimit)throw Error('AUTHORED_VISUAL_REVISION_LIMIT');
 }
 beats.authored=true;beats.authoredScenes=scenes;beats.shots=scenes.map(s=>({id:'scene-'+s.scene,scene:s.scene,start:s.start,end:s.end}));
 return {scenes:scenes.map(s=>({scene:s.scene,start:s.start,end:s.end,nodeCount:s.graph.nodes.length,attempt:s.attempt,graphHash:hash(s.graph),provenance:s.provenance})),reviews:reviews.map(r=>({attempt:r.attempt,renderer:r.renderer,graphHash:r.graphHash,...r.output.detail,provenance:r.provenance})),reviewScope:choreography?'Composition, dense motion sequences and boundary windows; no subjective listening or owner approval':'Rendered image sequences only; owner evaluates the final audiovisual piece'};
}
export function authoredPublicPlan(plan,beats){return {title:plan.title,concept:plan.concept,difference:plan.difference,protocol:AUTHORED_PROTOCOL,shots:plan.scenes.map((s,i)=>({id:'scene-'+s.scene,title:s.title,action:s.action,camera:s.camera,sound:s.sound,start:beats.authoredScenes[i].start,end:beats.authoredScenes[i].end})),authoredScenes:beats.authoredScenes.map(s=>({scene:s.scene,nodes:s.graph.nodes.length,model:s.provenance.model}))};}
