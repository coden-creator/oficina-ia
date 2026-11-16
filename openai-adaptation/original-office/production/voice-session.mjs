import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
async function write(file,bytes){const temp=file+'.new';const h=await fs.open(temp,'wx',0o600);try{await h.writeFile(bytes);await h.sync()}finally{await h.close()}await fs.rename(temp,file);}
export async function obtainNarration({store,jobDir,text,voiceId,profile='standard'}){
 const stamp=hash(JSON.stringify(profile==='standard'?{text,voiceId,model:'eleven_multilingual_v2'}:{text,voiceId,profile})),ledger=path.join(jobDir,'speech-attempt.json'),audioPath=path.join(jobDir,'speech.mp3'),metaPath=path.join(jobDir,'speech.json');
 try{const old=JSON.parse(await fs.readFile(ledger));if(old.stamp!==stamp)throw Error('VOICE_TEST_ALREADY_USED');if(old.state!=='completed')throw Error('VOICE_RESULT_UNCERTAIN');const meta=JSON.parse(await fs.readFile(metaPath));const audio=await fs.readFile(audioPath);if(hash(audio)!==old.sha256)throw Error('VOICE_CACHE_INVALID');return {...meta,audioPath,cached:true};}catch(e){if(e.code!=='ENOENT')throw e;}
 const catalog=await store.speechCatalog();if(!catalog.voices.some(v=>v.id===voiceId&&(v.category==='premade'||v.ownerAuthorized===true)))throw Error('VOICE_CATALOG_SELECTION_REQUIRED');
 const candidates=profile==='social-v2'?['eleven_v4','eleven_v3','eleven_multilingual_v2']:['eleven_multilingual_v2'];
 const model=candidates.map(id=>(catalog.models||[]).find(m=>m.id===id&&m.professionalVoices)).find(Boolean);
 if(!model||!Number.isFinite(model.characterCostFactor)||model.characterCostFactor<=0||model.characterCostFactor>2)throw Error('VOICE_MODEL_UNVERIFIED');
 const maximumCredits=Math.ceil(text.length*model.characterCostFactor);
 if(maximumCredits>1000||catalog.remainingCharacters<maximumCredits)throw Error('VOICE_INCLUDED_QUOTA_REQUIRED');
 const expressive=profile==='social-v2';const settings={stability:model.id==='eleven_v3'?.5:expressive?.3:.5,similarity_boost:.75,speed:expressive?1.12:1,...(model.style?{style:expressive?.55:.15}:{}),...(model.speakerBoost?{use_speaker_boost:true}:{})};
 const plan={model:model.id,settings};
 // A durable intent precedes the sole billable request; ambiguous outcomes never retry.
 let h;try{h=await fs.open(ledger,'wx',0o600)}catch(e){if(e.code==='EEXIST')throw Error('VOICE_RESULT_UNCERTAIN');throw e}
 try{await h.writeFile(JSON.stringify({state:'submitted',stamp,submittedCharacters:text.length,authorization:'Jorge: primera prueba completa Glowfy, 2026-11-16',at:new Date().toISOString()}));await h.sync();}finally{await h.close();}
 const {audio,...meta}=await store.synthesize({text,voiceId,plan});await write(audioPath,audio);await write(metaPath,JSON.stringify(meta));await write(ledger,JSON.stringify({state:'completed',stamp,sha256:hash(audio),submittedCharacters:text.length,characters:meta.characters,at:new Date().toISOString()}));return {...meta,audioPath,cached:false};
}
