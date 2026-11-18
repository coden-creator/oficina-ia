import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {batchPlan,validateBatchScript} from './batch-plan.mjs';import {createGlowfyProduction} from '../glowfy-production.mjs';import {socialSoundtrack} from './mix-social.mjs';
const plans=JSON.parse(fs.readFileSync(new URL('./batch-3.json',import.meta.url),'utf8')),ids=plans.map(p=>p.id);
test('batch production requires both operator scope and a known Glowfy plan',()=>{
 const p=createGlowfyProduction({authorizedJobIds:ids,voiceId:'hLV6NMOMeGIqdvcW8Uxr'});
 assert.equal(p.permits({id:ids[0],brandId:'glowfy'}),true);assert.equal(p.permits({id:ids[0],brandId:'velforce'}),false);assert.equal(p.permits({id:'other',brandId:'glowfy'}),false);
 assert.equal(batchPlan({id:ids[0],brandId:'glowfy'},[]),null);assert.equal(batchPlan({id:ids[0],brandId:'glowfy'},ids).variant,'booking');
});
test('three distinct music selections and the reviewed effect revisions are actually loaded',()=>{
 const beats={duration:20,events:{messageOne:.25,messageTwo:1,messageThree:2,phoneFocus:4,customer:4.2,assistant:5,reply:7,appointment:9,calendar:9.35,reminder:11,closing:14,cta:17}};
 const music=new Set();for(const p of plans){const s=socialSoundtrack(beats,{id:p.id,brandId:'glowfy'},{musicId:p.musicId,updatedEffects:true});music.add(s.music.id);assert.ok(s.cues.some(c=>c.file==='glowfy-r3-tick-cursor-01.wav'));assert.ok(s.cues.some(c=>c.file==='glowfy-r2-clic-boton-02.wav'));assert.ok(s.cues.some(c=>c.file==='glowfy-r3-destello-particulas-01.wav'));for(let i=0;i<s.input.length;i++)if(s.input[i]==='-i')assert.ok(fs.existsSync(s.input[i+1]));}assert.equal(music.size,3);
});
test('unrenderable batch text is rejected before narration',()=>{
 const plan=plans[0],s={narration:'Texto válido.',closing:'Conocé Glowfy',scenes:Array.from({length:4},()=>({text:'Título breve'}))};validateBatchScript(s,plan);assert.throws(()=>validateBatchScript({...s,narration:'x'.repeat(481)},plan),/BATCH_SCRIPT_LIMIT/);assert.throws(()=>validateBatchScript({...s,closing:'Otro'},plan),/BATCH_SCRIPT_LIMIT/);
});

test('unique visual direction preserves paid voice text and revisions and is applied once',async()=>{
 const {applyUniqueDirection,VISUAL_REVISION,uniqueSoundCues}=await import('./unique-direction.mjs');
 const original={narration:'Guion ya narrado',scenes:[],closing:'Conocé Glowfy'};
 const jobs=new Map(plans.map(p=>[p.id,{id:p.id,brandId:'glowfy',version:2,state:'blocked',brief:{evidence:[{id:'piece_direction',text:'old'}]},outputs:{script:{detail:structuredClone(original)},creative_review:{detail:{verdict:'pass'}},art_direction:{detail:{old:true}}},artifact:null,approval:null}]));let writes=0;
 const flow={get:async(_,id)=>structuredClone(jobs.get(id)),updateOffice:async(_,id,version,fn)=>{const j=jobs.get(id);assert.equal(j.version,version);fn(j);writes++}};
 assert.deepEqual(await applyUniqueDirection(flow,false),[]);assert.equal((await applyUniqueDirection(flow,true)).length,3);
 for(const j of jobs.values()){assert.equal(j.version,3);assert.deepEqual(j.outputs.script.detail,original);assert.equal(j.outputs.art_direction,undefined);assert.equal(j.revisions[0].version,2);assert.equal(j.uniqueVisualRevision,VISUAL_REVISION);assert.equal(j.stage,'art_direction');}
 assert.deepEqual(await applyUniqueDirection(flow,true),[]);assert.equal(writes,3);
 const e={phoneFocus:4,assistant:6,reply:9,calendar:12,reminder:14,closing:17};const signatures=plans.map(p=>JSON.stringify(uniqueSoundCues({variant:p.variant,events:e,duration:21})));assert.equal(new Set(signatures).size,3);
});
