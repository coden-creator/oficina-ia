// Only the saved office connection can call these fixed official endpoints.
// No key, provider error body, or account identity is returned to the client.
const HOST='https://api.elevenlabs.io/v1';
const fail=code=>{throw Error(code)};
async function boundedJSON(response,max){
 if(!response.ok){await response.body?.cancel();fail(response.status===401?'VOICE_KEY_INVALID':response.status===403?'VOICE_PERMISSION_REQUIRED':response.status===429?'VOICE_RATE_LIMIT':'VOICE_PROVIDER_FAILED');}
 const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>max)fail('VOICE_RESPONSE_TOO_LARGE');chunks.push(Buffer.from(chunk));}return JSON.parse(Buffer.concat(chunks));
}
export function createElevenLabsSpeech({fetchImpl=globalThis.fetch,authorizedExistingVoiceId=null,profile='standard'}={}){
 const request=async(key,route,body)=>{
  try{return await fetchImpl(HOST+route,{method:body?'POST':'GET',headers:{'xi-api-key':key,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(body?90000:12000)});}catch{fail('VOICE_PROVIDER_UNAVAILABLE');}
 };
 async function catalog(key){
  const [subscription,voices,models]=await Promise.all([request(key,'/user/subscription').then(r=>boundedJSON(r,65536)),request(key,'/voices').then(r=>boundedJSON(r,2*1024*1024)),request(key,'/models').then(r=>boundedJSON(r,262144))]);
  const count=subscription.character_count,limit=subscription.character_limit;
  if(!Number.isFinite(count)||!Number.isFinite(limit))fail('VOICE_QUOTA_UNVERIFIED');
  // Catalogue plus the exact existing voice Jorge explicitly authorized. No clone/create API exists here.
  const available=voices.voices||[];
  if(authorizedExistingVoiceId&&!available.some(v=>v.voice_id===authorizedExistingVoiceId)){
   if(!/^[a-zA-Z0-9]{10,80}$/.test(authorizedExistingVoiceId))fail('VOICE_INPUT_INVALID');
   const selected=await boundedJSON(await request(key,'/voices/'+authorizedExistingVoiceId),262144);
   if(selected.voice_id!==authorizedExistingVoiceId)fail('VOICE_CATALOG_SELECTION_REQUIRED');available.push(selected);
  }
  return {models:(models||[]).filter(m=>m.can_do_text_to_speech).map(m=>({id:m.model_id,professionalVoices:m.serves_pro_voices===true,characterCostFactor:Number(m.token_cost_factor),style:m.can_use_style===true,speakerBoost:m.can_use_speaker_boost===true})),remainingCharacters:Math.max(0,limit-count),usageBasedBilling:subscription.can_extend_character_limit===true,voices:available.filter(v=>(v.category==='premade'||v.voice_id===authorizedExistingVoiceId)&&/^[a-zA-Z0-9]{10,80}$/.test(v.voice_id)).map(v=>({id:v.voice_id,name:String(v.name).slice(0,120),labels:v.labels||{},category:v.category,ownerAuthorized:v.voice_id===authorizedExistingVoiceId}))};
 }
 async function synthesize(key,{text,voiceId,plan}){
  if(typeof text!=='string'||!text.trim()||text.length>1000||(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))||typeof voiceId!=='string'||!/^[a-zA-Z0-9]{10,80}$/.test(voiceId))fail('VOICE_INPUT_INVALID');
  if(!plan||!['eleven_v4','eleven_v3','eleven_multilingual_v2'].includes(plan.model))fail('VOICE_MODEL_UNVERIFIED');
  const response=await request(key,'/text-to-speech/'+voiceId+'/with-timestamps?output_format=mp3_44100_128',{text,model_id:plan.model,voice_settings:plan.settings,...(plan.model==='eleven_v3'?{language_code:'es'}:{})});
  const data=await boundedJSON(response,20*1024*1024);const audio=Buffer.from(data.audio_base64||'','base64');
  if(audio.length<1024||audio.length>8*1024*1024||!data.alignment)fail('VOICE_RESPONSE_INVALID');
  const charged=response.headers.get('x-character-count');
  return {audio,alignment:data.alignment,requestId:response.headers.get('request-id')||null,characters:charged!==null&&/^\d+$/.test(charged)?Number(charged):null,submittedCharacters:text.length,model:plan.model,settings:plan.settings,profile,voiceId};
 }
 return {catalog,synthesize};
}
