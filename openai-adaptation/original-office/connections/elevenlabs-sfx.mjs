import {SFX_PLAN,SFX_MODEL,SFX_RATE} from '../production/sfx-review-plan.mjs';
const fail=code=>{throw Error(code)};
async function bounded(response,max){
 if(!response.ok){await response.body?.cancel();fail(response.status===401?'SFX_KEY_INVALID':response.status===403?'SFX_PERMISSION_REQUIRED':response.status===429?'SFX_RATE_LIMIT':response.status===422?'SFX_MODEL_OR_INPUT_REJECTED':'SFX_PROVIDER_FAILED');}
 const parts=[];let size=0;for await(const part of response.body){size+=part.length;if(size>max){fail('SFX_RESPONSE_TOO_LARGE');}parts.push(Buffer.from(part));}return Buffer.concat(parts);
}
export function createElevenLabsSfx({fetchImpl=globalThis.fetch}={}){
 const request=async(key,route,body)=>{try{return await fetchImpl('https://api.elevenlabs.io/v1'+route,{method:body?'POST':'GET',headers:{'xi-api-key':key,Accept:body?'audio/mpeg':'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(body?90000:12000)});}catch{fail('SFX_PROVIDER_UNAVAILABLE');}};
 async function quota(key){const data=JSON.parse(await bounded(await request(key,'/user/subscription'),65536));if(!Number.isFinite(data.character_count)||!Number.isFinite(data.character_limit))fail('SFX_QUOTA_UNVERIFIED');return {remainingCredits:Math.max(0,data.character_limit-data.character_count)};}
 async function generate(key,id){
  const item=SFX_PLAN.find(p=>p.id===id);if(!item)fail('SFX_ITEM_NOT_AUTHORIZED');
  if((await quota(key)).remainingCredits<Math.ceil(item.duration*SFX_RATE))fail('SFX_INCLUDED_QUOTA_REQUIRED');
  const response=await request(key,'/sound-generation?output_format=mp3_44100_128',{text:item.prompt,model_id:SFX_MODEL,duration_seconds:item.duration,prompt_influence:.8,loop:false});
  const bytes=await bounded(response,2*1024*1024),mime=response.headers.get('content-type')||'';
  if(bytes.length<512||(!mime.startsWith('audio/')&&!mime.startsWith('application/octet-stream')))fail('SFX_RESPONSE_INVALID');
  const cost=response.headers.get('character-cost'),requestId=response.headers.get('request-id');
  return {audio:bytes,model:SFX_MODEL,credits:cost!==null&&/^\d+(\.\d+)?$/.test(cost)?Number(cost):null,requestId:requestId&&/^[a-zA-Z0-9_-]{1,120}$/.test(requestId)?requestId:null};
 }
 return Object.freeze({quota,generate});
}
