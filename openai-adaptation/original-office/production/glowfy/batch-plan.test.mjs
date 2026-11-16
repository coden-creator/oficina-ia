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
