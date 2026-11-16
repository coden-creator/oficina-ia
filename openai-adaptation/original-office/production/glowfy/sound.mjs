// Original quiet UI cues, not sampled reference audio or generated music.
export function interfaceSounds(beats){
 const sr=48000,samples=Math.ceil(beats.duration*sr),data=Buffer.alloc(samples*4),waves=new Float32Array(samples);
 const e=beats.events,cues=[{t:e.messageOne,f:880,amp:.055,len:.1},{t:e.messageTwo,f:740,amp:.05,len:.1},{t:e.assistant,f:660,amp:.045,len:.08},{t:e.reply,f:840,amp:.04,len:.07},{t:e.appointment,f:988,amp:.045,len:.16},{t:e.calendar+.65,f:740,amp:.04,len:.1},{t:e.reminder,f:1108,amp:.035,len:.18}];
 for(const q of cues){const start=Math.round(q.t*sr),count=Math.round(q.len*sr);for(let i=0;i<count&&start+i<samples;i++){const x=i/sr,env=Math.min(1,x/.005)*Math.exp(-7*x/q.len)*(1-i/count);waves[start+i]+=q.amp*env*(Math.sin(2*Math.PI*q.f*x)+.25*Math.sin(2*Math.PI*q.f*2*x));}}
 for(let i=0;i<samples;i++){const v=Math.max(-1,Math.min(1,waves[i]));data.writeInt16LE(Math.round(v*32767),i*4);data.writeInt16LE(Math.round(v*32767),i*4+2);}
 const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(data.length+36,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);h.writeUInt32LE(sr,24);h.writeUInt32LE(sr*4,28);h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(data.length,40);return {bytes:Buffer.concat([h,data]),cues};
}
