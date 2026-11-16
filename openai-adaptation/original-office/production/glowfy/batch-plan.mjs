import {pilotPlan} from './cinematic-plan.mjs';
import fs from 'node:fs';
const plans=JSON.parse(fs.readFileSync(new URL('./batch-3.json',import.meta.url),'utf8'));
export function batchPlan(job,authorizedJobIds=[]){
 if(job?.brandId!=='glowfy'||!authorizedJobIds.includes(job.id))return null;
 return plans.find(p=>p.id===job.id)||pilotPlan(job,authorizedJobIds);
}
export function validateBatchScript(script,plan){
 if(!plan)return;
 if(script.narration.length>plan.maxNarrationCharacters||script.scenes.some(s=>s.text.length>28||s.text.trim().split(/\s+/).length>5)||script.closing!=='Conocé Glowfy')throw Error('BATCH_SCRIPT_LIMIT');
}
