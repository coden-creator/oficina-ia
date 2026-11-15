// Fixed read-only account endpoint. No synthesis, cloning, uploads or redirects.
export function createElevenLabsVerifier({fetchImpl=globalThis.fetch,timeoutMs=8000}={}){
 return async apiKey=>{
  try{
   const response=await fetchImpl('https://api.elevenlabs.io/v1/user',{method:'GET',headers:{'xi-api-key':apiKey,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(timeoutMs)});
   if(!response.ok){await response.body?.cancel();return {status:response.status===401?'invalid':response.status===403?'permissions_required':'check_failed'}}
   const reader=response.body?.getReader();if(!reader)return {status:'check_failed'};
   let length=0;const chunks=[];
   try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>65536){await reader.cancel();return {status:'check_failed'}}chunks.push(Buffer.from(value))}}finally{reader.releaseLock()}
   const data=JSON.parse(Buffer.concat(chunks).toString());return {status:typeof data.user_id==='string'&&data.user_id.length>0?'verified':'check_failed'};
  }catch{return {status:'check_failed'}}
 };
}
