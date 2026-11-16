export const SFX_BATCH='glowfy-sfx-r3';
export const SFX_MODEL='eleven_text_to_sound_v3';
export const SFX_RATE=40;
export const SFX_PLAN=Object.freeze([
 {id:'destello-particulas-01',number:16,title:'Destello de partículas 01',duration:1,prompt:'A quick upward glittering chime flourish, tiny bright bell tones tightly clustered into one short sparkle accent, smooth clean decay, no whoosh or background noise.'},
 {id:'destello-particulas-02',number:17,title:'Destello de partículas 02',duration:1.25,prompt:'A brief twinkling chime flourish descending from high to warm soft tones, a delicate sparkling accent with a short fading tail, no harsh whistle, hiss or background music.'},
 {id:'tick-cursor-01',number:33,title:'Tick de cursor 01',duration:.5,prompt:'One crisp computer mouse click, close and dry, a short plastic switch snap, no ringing, buzz or background noise.'},
 {id:'tick-cursor-02',number:34,title:'Tick de cursor 02',duration:.5,prompt:'One short rounded digital interface tick for moving a cursor, like a soft muted metronome click, dry and isolated, no pitched beep, chime or reverb.'}
].map(Object.freeze));
export const SFX_MAX_CREDITS=SFX_PLAN.reduce((n,p)=>n+Math.ceil(p.duration*SFX_RATE),0);
