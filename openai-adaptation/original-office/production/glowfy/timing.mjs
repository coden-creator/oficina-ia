const normalize=s=>s.normalize('NFKC').replace(/\s+/g,' ').trim();
export function validateNarration(script){
 if(!script||script.scenes?.length!==4||typeof script.narration!=='string'||script.narration.length>1000)throw Error('VOICE_SCRIPT_LIMIT');
 if(normalize(script.scenes.map(s=>s.narration).join(' '))!==normalize(script.narration))throw Error('VOICE_SCENE_TEXT_MISMATCH');
 return script.narration;
}
export function buildTiming(script,alignment){
 const text=validateNarration(script),chars=alignment?.characters,starts=alignment?.character_start_times_seconds,ends=alignment?.character_end_times_seconds;
 if(!Array.isArray(chars)||!Array.isArray(starts)||!Array.isArray(ends)||chars.length!==starts.length||chars.length!==ends.length||normalize(chars.join(''))!==normalize(text))throw Error('VOICE_ALIGNMENT_INVALID');
 for(let i=0;i<chars.length;i++)if(!Number.isFinite(starts[i])||!Number.isFinite(ends[i])||starts[i]<0||ends[i]<starts[i]||(i&&starts[i]<starts[i-1])||ends[i]>55)throw Error('VOICE_ALIGNMENT_INVALID');
 const words=[];let word=null;
 for(let i=0;i<chars.length;i++){if(/\s/.test(chars[i])){if(word){words.push(word);word=null;}}else{word??={text:'',start:starts[i],end:ends[i]};word.text+=chars[i];word.end=ends[i];}}if(word)words.push(word);
 let index=0;const scenes=script.scenes.map((s,n)=>{const count=s.narration.trim().split(/\s+/).length;const slice=words.slice(index,index+count);index+=count;if(!slice.length)throw Error('VOICE_ALIGNMENT_INVALID');return {...s,index:n,start:n===0?0:slice[0].start,end:slice.at(-1).end};});
 if(index!==words.length)throw Error('VOICE_ALIGNMENT_INVALID');
 const duration=Math.ceil((ends.at(-1)+2.4)*30)/30;if(duration<10||duration>60)throw Error('VOICE_DURATION_INVALID');
 const captions=[];for(const scene of scenes){const sw=words.filter(w=>w.start>=scene.start&&w.start<=scene.end);for(let i=0;i<sw.length;i+=4){const group=sw.slice(i,i+4);captions.push({words:group,start:group[0].start,end:Math.min(duration,(sw[i+4]?.start??scene.end+.2))});}}
 return {duration,fps:30,width:1080,height:1920,scenes,words,captions,events:{messageOne:.5,messageTwo:1.6,phoneFocus:scenes[1].start,customer:scenes[1].start+.4,assistant:scenes[1].start+1.6,reply:scenes[1].start+3.1,appointment:scenes[2].start,calendar:scenes[2].start+.6,reminder:Math.min(scenes[2].end-.5,scenes[2].start+3),closing:scenes[3].start}};
}
