import {directedSoundCues} from './directed-plan.mjs';
import {cinematicSoundCues} from './cinematic-plan.mjs';
import {uniqueSoundCues} from './unique-direction.mjs';
import fs from 'node:fs';import {createHash} from 'node:crypto';
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {selectGlowfyMusic} from '../music-library.mjs';
const audio=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../audio');
// The cue map is shared with the animation; existing licensed studio assets are reused.
export function socialSoundtrack(beats,job,{musicId=null,updatedEffects=false}={}){
 const music=selectGlowfyMusic(job,musicId);
 const e=beats.events;
 let cues=[['golpe-grave-01',0,-9],['burbuja-mensaje-01',e.messageOne,-10],['pop-ui-01',e.messageTwo,-11],['tick-cursor-01',e.messageThree,-12],['whoosh-corto-01',e.phoneFocus,-11],['pop-ui-01',e.customer,-11],['burbuja-mensaje-01',e.assistant,-10],['clic-boton-01',e.reply,-10],['ding-confirmacion-01',e.appointment,-10],['whoosh-corto-01',e.calendar,-12],['pop-ui-01',e.calendar+.65,-10],['ding-confirmacion-01',e.reminder,-11],['whoosh-corto-01',e.closing,-11],['clic-boton-01',e.cta,-10]].filter(([,t])=>t>=0&&t<beats.duration-.5).map(([name,time,gainDb])=>({name,time,gainDb}));
 if(beats.uniqueProduction)cues=uniqueSoundCues(beats);if(beats.cinematic)cues=cinematicSoundCues(beats);if(beats.directed)cues=directedSoundCues(beats);if(beats.authored)cues=beats.authoredScenes.flatMap(s=>s.graph.sounds.map(c=>({...c,time:s.start+(s.end-s.start)*c.at})));
 if(updatedEffects&&!beats.uniqueProduction&&!beats.directed&&!beats.authored)cues.push({name:'destello-particulas-01',time:e.closing+.18,gainDb:-10});
 const replacements=updatedEffects?JSON.parse(fs.readFileSync(path.join(audio,'glowfy-sfx-production.json'),'utf8')).assets:[];
 const map={'golpe-grave-01':'golpe-grave-02','clic-boton-01':'clic-boton-02'};
 for(const cue of cues){const a=replacements.find(a=>a.id===(map[cue.name]||cue.name));if(a){const bytes=fs.readFileSync(path.join(audio,a.file));if(createHash('sha256').update(bytes).digest('hex')!==a.sha256)throw Error('SFX_ASSET_INTEGRITY_FAILED');cue.file=a.file;cue.revision=a.revision;}}
 const D=beats.duration,input=['-stream_loop','-1','-i',path.join(audio,music.file)],filters=[],names=[];
 // Voice is normalized separately; a full textured music bed ducks gently under speech.
 filters.push(`[0:a]aresample=48000,apad,atrim=duration=${D},asplit=2[v][detector]`);
 filters.push(`[1:a]aresample=48000,atrim=duration=${D},volume=${music.gainDb}dB,afade=t=in:st=0:d=0.12,afade=t=out:st=${D-1.2}:d=1.2[music]`);
 filters.push('[music][detector]sidechaincompress=threshold=.05:ratio=2:attack=15:release=220:makeup=1[mu]');
 cues.forEach((cue,i)=>{input.push('-i',path.join(audio,cue.file||cue.name+'.wav'));const delay=Math.round(cue.time*1000);filters.push(`[${i+2}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${cue.gainDb}dB,adelay=${delay}|${delay}[s${i}]`);names.push('[s'+i+']');});
 if(names.length)filters.push(`${names.join('')}amix=inputs=${names.length}:normalize=0:duration=longest[fx]`);else filters.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${D}[fx]`);
 filters.push(`[v][mu][fx]amix=inputs=3:normalize=0:duration=first,atrim=duration=${D}[m]`);
 return {input,filters:filters.join(';'),cues,music:{id:music.id,title:music.title,file:music.file,sha256:music.sha256,gainDb:music.gainDb,targetLufs:-27,ducking:true,source:'ElevenLabs Music; four variants selected by Jorge',approvedForBrand:true}};
}
