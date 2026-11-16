import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {validateNarration,buildTiming} from './glowfy/timing.mjs';import {interfaceSounds} from './glowfy/sound.mjs';import {obtainNarration} from './voice-session.mjs';import {runProcess} from './process.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),digest=b=>createHash('sha256').update(b).digest('hex');
const loudness=s=>{const m=s.match(/\{\s*"input_i"[\s\S]*?\}/g);if(!m?.length)throw Error('AUDIO_MEASUREMENT_FAILED');return JSON.parse(m.at(-1));};
export function createGlowfyProduction({dataDir,connectionStore,authorizedJobId,voiceId}){
 let tail=Promise.resolve();
 const permits=job=>!!authorizedJobId&&job.id===authorizedJobId&&job.brandId==='glowfy';
 async function produce(job,onStage=async()=>{}){
  if(!permits(job))throw Error('VOICE_TEST_NOT_AUTHORIZED');if(!voiceId)throw Error('VOICE_CATALOG_SELECTION_REQUIRED');
  const script=job.outputs.script?.detail,text=validateNarration(script);
  if(job.outputs.creative_review?.detail?.verdict!=='pass')throw Error('CREATIVE_PASS_REQUIRED');
  const jobDir=path.join(dataDir,job.brandId,job.id),outDir=path.join(jobDir,'v'+job.version);await fs.mkdir(outDir,{recursive:true,mode:0o700});
  // Scope validated above; the ledger permits one synthesis for this test job only.
  await onStage('production','Preparando la narración de ElevenLabs');
  const voice=await obtainNarration({store:connectionStore,jobDir,text,voiceId});
  const beats=buildTiming(script,voice.alignment);await fs.writeFile(path.join(outDir,'beats.json'),JSON.stringify(beats),{mode:0o600});
  const sfx=interfaceSounds(beats);await fs.writeFile(path.join(outDir,'ui-sounds.wav'),sfx.bytes);await fs.writeFile(path.join(outDir,'sound-cues.json'),JSON.stringify(sfx.cues));
  await onStage('production','Animando las cuatro escenas y sus subtítulos');
  const config=path.join(outDir,'render.json');await fs.writeFile(config,JSON.stringify({outDir,beats}),{mode:0o600});
  await runProcess(process.execPath,[path.join(root,'glowfy/render.mjs'),config]);
  const voiceMix=path.join(outDir,'voice-normalized.wav'),mix=path.join(outDir,'mix.wav');
  const ff=async args=>runProcess('/usr/bin/ffmpeg',['-hide_banner','-nostdin','-y',...args]);
  await ff(['-i',voice.audioPath,'-af','loudnorm=I=-18:TP=-3:LRA=7','-ar','48000','-ac','2',voiceMix]);
  await ff(['-i',voiceMix,'-i',path.join(outDir,'ui-sounds.wav'),'-filter_complex',`[0:a]apad,atrim=duration=${beats.duration}[v];[v][1:a]amix=inputs=2:normalize=0:duration=first[m]`,'-map','[m]','-ar','48000','-ac','2',mix]);
  const measured=loudness((await ff(['-i',mix,'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'])).stderr);
  const filter=`loudnorm=I=-16:TP=-1.5:LRA=7:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`;
  const file=path.join(outDir,'Glowfy - Primera prueba.mp4');await ff(['-i',path.join(outDir,'picture.mp4'),'-i',mix,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-af',filter,'-ar','48000','-ac','2','-t',String(beats.duration),'-movflags','+faststart',file]);
  await onStage('qa','Comprobando imagen, audio y duración del archivo exportado');
  const probe=JSON.parse((await runProcess('/usr/bin/ffprobe',['-v','error','-show_streams','-show_format','-of','json',file])).stdout),v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
  await ff(['-v','error','-i',file,'-f','null','-']);
  const levels=loudness((await ff(['-i',file,'-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-'])).stderr);
  const passed=v?.codec_name==='h264'&&v.width===1080&&v.height===1920&&v.r_frame_rate==='30/1'&&a?.codec_name==='aac'&&a.sample_rate==='48000'&&a.channels===2&&Math.abs(Number(probe.format.duration)-beats.duration)<.15&&Math.abs(Number(levels.input_i)+16)<1&&Number(levels.input_tp)<=-1.3;
  if(!passed)throw Error('AUDIOVISUAL_TECHNICAL_QA_FAILED');
  const bytes=await fs.readFile(file),artifact={file,sha256:digest(bytes),bytes:bytes.length,version:job.version,kind:'narrated_brand_video',metadata:{width:1080,height:1920,fps:30,duration:beats.duration}};
  const qa={technical:{passed:true,width:1080,height:1920,fps:30,duration:beats.duration,audioCodec:'aac',sampleRate:48000,channels:2,integratedLufs:Number(levels.input_i),truePeakDbtp:Number(levels.input_tp),decoded:true},visual:'pending_owner_review',audio:'elevenlabs-with-character-alignment',commercialQuality:'pending_owner_review',subjectiveListeningVerified:false};
  await fs.writeFile(path.join(outDir,'qa.json'),JSON.stringify(qa,null,2));
  return {artifact,qa,production:{summary:'Cuatro escenas ilustradas, narración ElevenLabs, subtítulos alineados y efectos de interfaz. Pendiente de revisión audiovisual de Jorge.',evidence:[],voice:{provider:'elevenlabs',voiceId,model:voice.model,characters:voice.characters,submittedCharacters:voice.submittedCharacters,cached:voice.cached},sceneCount:4,provenance:{provider:'office-trusted-renderer',version:'glowfy-v1'}}};
 }
 return {permits,voiceConfigured:!!voiceId,render(job,stage){const next=tail.then(()=>produce(job,stage));tail=next.catch(()=>{});return next;}};
}
