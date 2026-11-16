import {MOTION_PROTOCOL,validateMotionPlan} from '../../video/motion-contract.mjs';
export function directedPlan(job,ids){
 if(job?.brandId!=='glowfy'||!ids.includes(job.id)||job.brief?.productionMode!==MOTION_PROTOCOL||job.productionAuthorization?.protocol!==MOTION_PROTOCOL)return null;
 const output=job.outputs.edit_plan;if(output?.provenance?.provider!=='codex-chatgpt-plan')throw Error('OFFICE_EDIT_PLAN_REQUIRED');
 const p=validateMotionPlan(output.detail);
 return {...p,directed:true,key:p.title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ -]/g,'').slice(0,60),variant:'directed',maxNarrationCharacters:480,authorization:'Jorge: las tres ideas deben llegar directamente a video final; 2026-11-16'};
}
export function directedTiming(beats,plan){
 const {title,concept,difference,musicId,shots}=plan;validateMotionPlan({title,concept,difference,musicId,shots});beats.directed=true;beats.cta='Conocé Glowfy';
 beats.shots=plan.shots.map((s,i)=>{const siblings=plan.shots.filter(x=>x.scene===s.scene),index=siblings.indexOf(s),scene=beats.scenes[s.scene-1],end=s.scene===4?beats.duration:beats.scenes[s.scene].start,start=scene.start,length=(end-start)/siblings.length;return {...s,id:'shot-'+(i+1),start:start+length*index,end:start+length*(index+1)};});
 if(beats.shots.some(s=>s.end-s.start<1.05))throw Error('DIRECTED_SHOT_TOO_SHORT');
 return beats;
}
export function directedSoundCues(beats){return beats.shots.flatMap(s=>s.sound.map(c=>({...c,time:s.start+(s.end-s.start)*c.at/100}))).filter(c=>c.time<beats.duration-.4);}
export function directedPublicPlan(plan,beats){return {title:plan.title,concept:plan.concept,difference:plan.difference,voiceDirection:'Narración de la oficina, voz existente autorizada de Jorge; alineación real por palabra.',soundDirection:'Música y efectos elegidos por el editor de la oficina desde la biblioteca Glowfy.',shots:beats.shots.map(s=>({id:s.id,title:s.title,scale:s.camera,action:s.objects.map(o=>o.type+': '+o.action).join(', '),camera:s.camera,transition:s.transition,sound:s.sound.map(c=>c.intention).join('; '),start:s.start,end:s.end}))};}
