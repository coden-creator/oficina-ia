"""Own short UI synthesis. No voice, music, samples, APIs or downloads."""
import argparse, json, math, pathlib, struct, wave
p=argparse.ArgumentParser();p.add_argument('--out',required=True);args=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
beats=json.loads((root/'plan/beats.json').read_text());sr=48000
samples=[0.0]*round(sr*beats['duration'])
events=beats['events']
cues=[('messageOne',.18,640,.13),('messageTwo',.18,720,.13),('customer',.11,440,.10),('assistant',.14,520,.11),('reply',.11,440,.10),('appointment',.38,880,.13)]
for name,duration,freq,gain in cues:
    # Entrance midpoint approximates visible settling, shared with the motion map.
    offset=round((events[name]+.22)*sr)
    for i in range(round(duration*sr)):
        t=i/sr;env=min(1,t/.006)*math.exp(-t*18)*(max(0,1-t/duration)**2)
        tone=math.sin(2*math.pi*(freq*t+50*(1-math.exp(-t*22))/22))
        if name=='appointment':tone=.65*math.sin(2*math.pi*freq*t)+.35*math.sin(2*math.pi*freq*1.5*t)
        if offset+i<len(samples):samples[offset+i]+=gain*env*tone
dest=pathlib.Path(args.out);dest.parent.mkdir(parents=True,exist_ok=True)
with dest.open('xb') as out:
    with wave.open(out,'wb') as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(sr)
        wav.writeframes(b''.join(struct.pack('<h',round(max(-1,min(1,s))*32767)) for s in samples))
print(json.dumps({'duration':beats['duration'],'sampleRate':sr,'cues':len(cues),'peak':max(map(abs,samples)),'voice':False,'music':False,'paidRequests':0}))
