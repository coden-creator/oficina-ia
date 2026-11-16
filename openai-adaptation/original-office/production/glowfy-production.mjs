import {cinematicTiming,publicProductionPlan} from './glowfy/cinematic-plan.mjs';
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {batchPlan,validateBatchScript} from './glowfy/batch-plan.mjs';
import {socialSoundtrack} from './glowfy/mix-social.mjs';
import {validateNarration,buildTiming} from './glowfy/timing.mjs';import {interfaceSounds} from './glowfy/sound.mjs';import {obtainNarration} from './voice-session.mjs';import {runProcess} from './process.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),digest=b=>createHash('sha256').update(b).digest('hex');
const loudness=s=>{const m=s.match(/\{\s*"input_i"[\s\S]*?\}/g);if(!m?.length)throw Error('AUDIO_MEASUREMENT_FAILED');return JSON.parse(m.at(-1));};
export function createGlowfyProduction({dataDir,connectionStore,authorizedJobId,authorizedJobIds=[],voiceId,voiceTake=1,voiceProfile='standard'}){
 let tail=Promise.resolve();
 const permits=job=>job.brandId==='glowfy'&&((!!authorizedJobId&&job.id===authorizedJobId)||!!batchPlan(job,authorizedJobIds));
 async function produce(job,onStage=async()=>{}){
  if(!permits(job))throw Error('VOICE_TEST_NOT_AUTHORIZED');if(!voiceId)throw Error('VOICE_CATALOG_SELECTION_REQUIRED');
  const plan=batchPlan(job,authorizedJobIds),script=job.outputs.script?.detail,text=validateNarration(script);validateBatchScript(script,plan);
  if(job.outputs.creative_review?.detail?.verdict!=='pass')throw Error('CREATIVE_PASS_REQUIRED');
  const jobDir=path.join(dataDir,job.brandId,job.id),outDir=path.join(jobDir,'v'+job.version);await fs.mkdir(outDir,{recursive:true,mode:0o700});
  // Scope validated above; each explicitly authorized take has its own one-request ledger.
  await onStage('production',plan?.cachedVoiceOnly?'Recuperando la narración guardada':'Preparando la narración de ElevenLabs');
  const take=plan?1:voiceTake;
  if(![1,2].includes(take))throw Error('VOICE_TEST_NOT_AUTHORIZED');
  const voiceDir=plan?.cachedVoiceOnly?path.join(dataDir,job.brandId,plan.voiceSourceId):take===1?jobDir:path.join(jobDir,'voice-take-'+take);await fs.mkdir(voiceDir,{recursive:true,mode:0o700});
  const voice=await obtainNarration({store:connectionStore,jobDir:voiceDir,text,voiceId,profile:voiceProfile,cachedOnly:!!plan?.cachedVoiceOnly,...(plan?{authorization:plan.authorization}: {})});
  const beats=buildTiming(script,voice.alignment,{social:voiceProfile==='social-v2'});if(plan){beats.uniqueProduction=true;beats.events.assistant=Math.min(beats.events.assistant,beats.events.phoneFocus+1);beats.variant=plan.variant;beats.sceneTitles=script.scenes.map(s=>s.text);beats.cta=script.closing;if(plan.cachedVoiceOnly)cinematicTiming(beats);}await fs.writeFile(path.join(outDir,'beats.json'),JSON.stringify(beats),{mode:0o600});
  if(voiceProfile!=='social-v2'){const sfx=interfaceSounds(beats);await fs.writeFile(path.join(outDir,'ui-sounds.wav'),sfx.bytes);await fs.writeFile(path.join(outDir,'sound-cues.json'),JSON.stringify(sfx.cues));}
  await onStage('production',plan?.cachedVoiceOnly?'Construyendo los seis planos del piloto':'Animando las cuatro escenas y sus subtítulos');
  const config=path.join(outDir,'render.json');await fs.writeFile(config,JSON.stringify({outDir,beats,social:voiceProfile==='social-v2'}),{mode:0o600});
  let preview=null;
  if(plan?.cachedVoiceOnly){const previewConfig=path.join(outDir,'preview-render.json');await fs.writeFile(previewConfig,JSON.stringify({outDir,beats,social:true,preview:true,from:0,to:7}));await onStage('production','Preparando un fragmento audiovisual de siete segundos');await runProcess(process.execPath,[path.join(root,'glowfy/render.mjs'),previewConfig]);}
  else await runProcess(process.execPath,[path.join(root,'glowfy/render.mjs'),config]);
  let selectedMusic=null;
  const voiceMix=path.join(outDir,'voice-normalized.wav'),mix=path.join(outDir,'mix.wav');
  const ff=async args=>runProcess('/usr/bin/ffmpeg',['-hide_banner','-nostdin','-y','-filter_complex_threads','1',...args]);
  await ff(['-i',voice.audioPath,'-af','loudnorm=I=-18:TP=-3:LRA=7','-ar','48000','-ac','2',voiceMix]);
  if(voiceProfile==='social-v2'){
   const soundtrack=socialSoundtrack(beats,job,{musicId:plan?.musicId,updatedEffects:!!plan});selectedMusic=soundtrack.music;await fs.writeFile(path.join(outDir,'sound-cues.json'),JSON.stringify(soundtrack,null,2));
   await ff(['-i',voiceMix,...soundtrack.input,'-filter_complex',soundtrack.filters,'-map','[m]','-ar','48000','-ac','2',mix]);
  }else await ff(['-i',voiceMix,'-i',path.join(outDir,'ui-sounds.wav'),'-filter_complex',`[0:a]apad,atrim=duration=${beats.duration}[v];[v][1:a]amix=inputs=2:normalize=0:duration=first[m]`,'-map','[m]','-ar','48000','-ac','2',mix]);
  const measured=loudness((await ff(['-i',mix,'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'])).stderr);
  const filter=`loudnorm=I=-16:TP=-1.5:LRA=7:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`;
  if(plan?.cachedVoiceOnly){const previewFile=path.join(outDir,'Glowfy - Fragmento audiovisual.mp4');await ff(['-i',path.join(outDir,'preview-silent.mp4'),'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-af',filter+',afade=t=out:st=6.8:d=0.2','-ar','48000','-ac','2','-t','7','-movflags','+faststart',previewFile]);const pb=await fs.readFile(previewFile);preview={file:previewFile,sha256:digest(pb),bytes:pb.length,version:job.version,kind:'audiovisual_preview',metadata:{duration:7,width:540,height:960,fps:12}};await onStage('production','Fragmento listo; exportando la pieza completa',{preview});await runProcess(process.execPath,[path.join(root,'glowfy/render.mjs'),config]);}
  const file=path.join(outDir,plan?'Glowfy - '+plan.key+'.mp4':'Glowfy - Primera prueba.mp4');await ff(['-i',path.join(outDir,'picture.mp4'),'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-af',filter,'-ar','48000','-ac','2','-t',String(beats.duration),'-movflags','+faststart',file]);
  await onStage('qa','Comprobando imagen, audio y duración del archivo exportado');
  const probe=JSON.parse((await runProcess('/usr/bin/ffprobe',['-v','error','-show_streams','-show_format','-of','json',file])).stdout),v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
  await ff(['-v','error','-i',file,'-f','null','-']);
  const levels=loudness((await ff(['-i',file,'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'])).stderr);
  const passed=v?.codec_name==='h264'&&v.width===1080&&v.height===1920&&v.r_frame_rate==='30/1'&&a?.codec_name==='aac'&&a.sample_rate==='48000'&&a.channels===2&&Math.abs(Number(probe.format.duration)-beats.duration)<.15&&Math.abs(Number(levels.input_i)+16)<1&&Number(levels.input_tp)<=-1.3;
  if(!passed)throw Error('AUDIOVISUAL_TECHNICAL_QA_FAILED');
  const bytes=await fs.readFile(file),artifact={file,sha256:digest(bytes),bytes:bytes.length,version:job.version,kind:'narrated_brand_video',metadata:{width:1080,height:1920,fps:30,duration:beats.duration}};
  const qa={reviewScope:'Technical measurements are not an aesthetic or listening verdict',technical:{passed:true,width:1080,height:1920,fps:30,duration:beats.duration,audioCodec:'aac',sampleRate:48000,channels:2,integratedLufs:Number(levels.input_i),truePeakDbtp:Number(levels.input_tp),decoded:true},visual:'pending_owner_review',audio:'elevenlabs-with-character-alignment',commercialQuality:'pending_owner_review',subjectiveListeningVerified:false};
  await fs.writeFile(path.join(outDir,'qa.json'),JSON.stringify(qa,null,2));
  return {artifact,preview,qa,production:{summary:voiceProfile==='social-v2'?'Reedición con tu voz dirigida, una variante musical de Glowfy, efectos sincronizados, cámara y subtítulos editoriales. Pendiente de tu revisión.':'Cuatro escenas ilustradas, narración ElevenLabs, subtítulos alineados y efectos de interfaz. Pendiente de revisión audiovisual de Jorge.',evidence:[],voice:{provider:'elevenlabs',voiceId,model:voice.model,settings:voice.settings,delivery:voice.delivery,profile:voiceProfile,take,characters:voice.characters,submittedCharacters:voice.submittedCharacters,cached:voice.cached},music:selectedMusic,plan:beats.cinematic?publicProductionPlan({...plan,shots:beats.shots}):null,batch:plan?{id:'glowfy-batch-3',variant:plan.variant,authorization:plan.authorization}:null,sceneCount:4,provenance:{provider:'office-trusted-renderer',version:voiceProfile==='social-v2'?'glowfy-social-v2':'glowfy-v1'}}};
 }
 return {permits,voiceConfigured:!!voiceId,render(job,stage){const next=tail.then(()=>produce(job,stage));tail=next.catch(()=>{});return next;}};
}
