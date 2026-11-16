import json,base64,math,hashlib,subprocess,io
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np
from scipy.io import wavfile

import argparse
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);parser.add_argument('--catalog',type=Path);parser.add_argument('--comparison',action='store_true');args=parser.parse_args()
ROOT=Path(__file__).resolve().parent;OUT=args.output.resolve();CACHE=OUT/'cache';CACHE.mkdir(parents=True,exist_ok=True)
REPO=ROOT.parents[3];SOURCE=REPO/'estudio-video/assets/sfx';APP=REPO/'openai-adaptation/original-office'
catalog=json.loads((args.catalog or ROOT/'catalog.json').read_text());assets=json.loads((APP/'production/glowfy/assets.json').read_text());count=len(catalog['items']);comparison=args.comparison;revision=catalog.get('revision',2)
labels=tuple(catalog.get('labels',['A · Anterior','B · Nueva propuesta'])) if comparison else ('A · Original de ElevenLabs','B · Procesado por el estudio')
for f in assets['fonts']:
 if f['family']=='Montserrat':(CACHE/('Montserrat-'+str(f['weight'])+'.ttf')).write_bytes(base64.b64decode(f['base64']))
font=lambda n,w=500:ImageFont.truetype(str(CACHE/('Montserrat-'+str(w)+'.ttf')),n)
logo=Image.open(io.BytesIO(base64.b64decode(assets['logo']['base64']))).convert('RGBA');logo.thumbnail((170,65),Image.Resampling.LANCZOS)
W,H,FPS,TPS,SR=720,1280,24,8,48000;BG='#fbf9fd';INK='#2a1933';MUTED='#685a70';ACCENT='#8b43b2';FAINT='#e4d7ee'
names={'golpe-grave':'Golpe grave','tick-cursor':'Tick de cursor','teclas-suaves':'Teclas suaves','pop-ui':'Pop de interfaz','destello-particulas':'Destello de partículas','burbuja-mensaje':'Mensaje recibido','clic-boton':'Clic de botón','ding-confirmacion':'Confirmación','whoosh-corto':'Transición corta','campana-recepcion':'Campana de recepción','papel-hojas':'Hojas de papel','llave-candado':'Llave y candado','cajas-carton':'Cajas de cartón','cuaderno':'Cuaderno','bombillo':'Bombillo','planta-crece':'Planta creciendo','bloques-madera':'Bloques de madera','sello-tinta':'Sello de tinta','check-lapiz':'Marca de lápiz','cuchara-taza':'Cuchara y taza','engranes':'Engranes','sobre-abrir':'Abrir sobre','hoja-arrugada':'Papel arrugado','calendario-arrancar':'Arrancar calendario','apagado':'Apagado'}
def wrap(draw,text,x,y,size=30,width=620,color=INK,weight=500):
 f=font(size,weight);line='';lines=[]
 for word in text.split():
  trial=(line+' '+word).strip()
  if draw.textlength(trial,font=f)>width and line:lines.append(line);line=word
  else:line=trial
 lines.append(line)
 for line in lines:draw.text((x,y),line,font=f,fill=color);y+=size*1.35
 return y
def base():
 im=Image.new('RGB',(W,H),BG);im.paste(logo,(50,52),logo);d=ImageDraw.Draw(im);d.text((50,148),f'Efectos regenerados · revisión {revision}' if comparison else 'Catálogo de efectos',font=font(24,600),fill=MUTED);return im
def intro(outro=False):
 im=base();d=ImageDraw.Draw(im)
 wrap(d,'Decime cuáles mejoraron.' if comparison and outro else f'{count} nuevas propuestas.' if comparison else 'Decime cuáles cambiamos.' if outro else '36 sonidos. Escuchalos y elegí.',50,300,56,weight=700)
 wrap(d,'Usá el número o el nombre que aparece en pantalla.',50,535,30)
 wrap(d,catalog.get('comparisonDescription','A: sonido anterior · B: nueva propuesta') if comparison else 'A: original de ElevenLabs · B: versión procesada',50,695,28,color=ACCENT,weight=600)
 wrap(d,'Cada versión se escucha dos veces. El volumen está igualado para comparar.',50,840,27,color=MUTED)
 wrap(d,'Mismos números: '+', '.join(str(i['number']) for i in catalog['items'])+'.' if comparison else 'Ejemplo: «12, original: el final suena roto».',50,1035,25,weight=600)
 d.text((50,1190),'Pendientes de tu revisión' if comparison else 'Diagnóstico · audios sin reparar',font=font(20),fill=MUTED);return im

events=[];chapters=[];sections=[];tick=5*TPS;sections.append({'start':0,'end':tick,'type':'intro'})
for position,item in enumerate(catalog['items'],1):
 n=item.get('number',position)
 start=tick;tick+=6;chapter={'number':n,'id':item['id'],'title':names[item['family']]+' '+item['id'].split('-')[-1],'start':start/TPS,'events':[],'technicalReview':any(f['level']=='review' for f in item['flags'])}
 for version in ['original','processed']:
  for repeat in [1,2]:
   length=math.ceil(item[version]['duration']*TPS);e={'number':n,'id':item['id'],'version':version,'repeat':repeat,'tick':tick,'ticks':length,'start':tick/TPS,'duration':item[version]['duration'],'gainDb':round(-10-item[version]['truePeakDbtp'],2),'sourceSha256':item[version]['sha256']};events.append(e);chapter['events'].append(e);tick+=length
   if repeat==1:tick+=4
  tick+=6
 chapter['end']=tick/TPS;chapters.append(chapter);sections.append({'start':start,'end':tick,'type':'item','item':item,'chapter':chapter})
sections.append({'start':tick,'end':tick+5*TPS,'type':'outro'});tick+=5*TPS;duration=tick/TPS
audio=np.zeros((int(duration*SR),2),dtype=np.float32);decoded={}
for e in events:
 key=(e['id'],e['version']);folder,ext=('generated','mp3') if e['version']=='original' else ('listos','wav');item=next(i for i in catalog['items'] if i['id']==e['id']);source=REPO/item['sourceA' if e['version']=='original' else 'sourceB'] if comparison else SOURCE/folder/(e['id']+'.'+ext)
 if key not in decoded:
  assert hashlib.sha256(source.read_bytes()).hexdigest()==e['sourceSha256']
  raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-f','f32le','-ar',str(SR),'-ac','2','pipe:1']);decoded[key]=np.frombuffer(raw,dtype=np.float32).reshape(-1,2)
 samples=decoded[key]*10**(e['gainDb']/20);a=round(e['start']*SR);audio[a:a+len(samples)]+=samples
assert np.abs(audio).max()<.4
wavfile.write(CACHE/'catalog-audio.wav',SR,audio)
def waveform(d,values,y,active,progress):
 maxv=max(max(values),.001);d.line((52,y,668,y),fill=FAINT,width=2)
 for i,v in enumerate(values):
  x=52+i*616/len(values);h=max(2,v/maxv*90);d.line((x,y-h/2,x,y+h/2),fill=ACCENT if active and i/len(values)<=progress else FAINT,width=3)
 if active:d.line((52+616*progress,y-58,52+616*progress,y+58),fill=ACCENT,width=2)
def draw_item(section,current):
 item,c=section['item'],section['chapter'];im=base();d=ImageDraw.Draw(im);d.text((565,60),f"N.º {c['number']:02d}" if comparison else f"{c['number']:02d} / 36",font=font(27,600),fill=ACCENT)
 wrap(d,c['title'],50,270,45,weight=700);d.text((50,420),item['id'],font=font(21),fill=MUTED)
 active=next((e for e in c['events'] if e['tick']<=current<e['tick']+e['ticks']),None)
 for version,label,y in [('original',labels[0],565),('processed',labels[1],820)]:
  isactive=bool(active and active['version']==version);d.text((50,y-65),label,font=font(25,600),fill=ACCENT if isactive else MUTED)
  progress=min(1,((current-active['tick'])/TPS)/active['duration']) if isactive else 0;waveform(d,item[version]['waveform'],y+35,isactive,progress)
 if active:status=(('Anterior' if active['version']=='original' else 'Nueva propuesta') if comparison else ('Original' if active['version']=='original' else 'Procesado'))+' · escucha '+str(active['repeat'])+' de 2'
 else:status='Prepará la escucha' if current<c['events'][0]['tick'] else 'Pausa para comparar'
 d.text((50,1015),status,font=font(29,600),fill=ACCENT)
 wrap(d,'Anotá el número + A o B + qué falla.',50,1115,24,color=MUTED)
 d.text((50,1190),'Nivel igualado · pendiente de revisión' if comparison else 'Nivel igualado · sin reparación',font=font(20),fill=MUTED)
 d.line((50,1240,670,1240),fill=FAINT,width=4);d.line((50,1240,50+620*(current-section['start'])/(section['end']-section['start']),1240),fill=ACCENT,width=4)
 return im

concat=[];frames=[]
for s in sections:
 if s['type'] in ['intro','outro']:
  p=CACHE/(s['type']+'.png');intro(s['type']=='outro').save(p);concat+=['file '+str(p),'duration '+str((s['end']-s['start'])/TPS)];frames.append(p)
 else:
  for current in range(s['start'],s['end']):
   p=CACHE/f"frame-{current:05d}.png";draw_item(s,current).save(p,compress_level=1);concat+=['file '+str(p),'duration '+str(1/TPS)];frames.append(p)
  print(json.dumps({'renderedEffect':s['chapter']['number'],'total':count}),flush=True)
concat.append('file '+str(frames[-1]));(CACHE/'frames.txt').write_text('\n'.join(concat)+'\n')
metadata=[';FFMETADATA1','title=Glowfy - Efectos para revision',f'comment={count} efectos regenerados; A anterior y B nueva propuesta; dos repeticiones.' if comparison else 'comment=36 efectos; A original y B procesado; dos repeticiones; solo ganancia de escucha, sin reparaciones.']
for c in chapters:metadata+=['[CHAPTER]','TIMEBASE=1/1000','START='+str(round(c['start']*1000)),'END='+str(round(c['end']*1000)),'title='+str(c['number']).zfill(2)+' - '+c['title']]
(CACHE/'chapters.ffmeta').write_text('\n'.join(metadata)+'\n')
manifest={'schemaVersion':1,'brandId':'glowfy','title':catalog.get('title',f'{count} efectos regenerados') if comparison else 'Catálogo de efectos para revisión','purpose':'Comparación para revisión de Jorge: no es un video de publicación','duration':duration,'width':W,'height':H,'fps':FPS,'sampleRate':SR,'tracks':count,'playbacks':len(events),'newPaidGenerations':count if comparison else 0,'listeningProcessing':catalog.get('listeningProcessing','Constant scalar gain per source to approximately -10 dBTP. Comparison B uses prepared new files: DC removal, silent margins trimmed, edge fades; ticks additionally band-limited and shortened to 160 ms. Details in generation-manifest.json; original generation files preserved. Final AAC encoding is lossy.') if comparison else 'Constant scalar gain per source to approximately -10 dBTP. No trimming, denoising, EQ, compression or repairs; final AAC encoding is lossy.','chapters':chapters}
(OUT/'catalog-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'Indice de efectos.txt').write_text('\n'.join(f"{int(c['start'])//60:02d}:{int(c['start'])%60:02d}  {c['number']:02d}. {c['title']}  ({c['id']})" for c in chapters)+'\n')
output=OUT/(f'Glowfy - Efectos regenerados v{revision}.mp4' if comparison else 'Glowfy - Catalogo de efectos v1.mp4')
args=['ffmpeg','-hide_banner','-y','-threads','2','-f','concat','-safe','0','-i',str(CACHE/'frames.txt'),'-i',str(CACHE/'catalog-audio.wav'),'-i',str(CACHE/'chapters.ffmeta'),'-map','0:v','-map','1:a','-map_metadata','2','-map_chapters','2','-vf','fps=24,format=yuv420p','-c:v','libx264','-threads','2','-preset','fast','-crf','23','-c:a','aac','-b:a','256k','-ar','48000','-t',str(duration),'-movflags','+faststart',str(output)]
with (OUT/'render.log').open('w') as log:subprocess.run(args,stderr=log,stdout=log,check=True)
manifest.update(file=f'glowfy-sfx-revision-{revision}.mp4' if comparison else 'glowfy-sfx-catalog.mp4',bytes=output.stat().st_size,sha256=hashlib.sha256(output.read_bytes()).hexdigest());(OUT/'catalog-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'complete':True,'duration':duration,'bytes':manifest['bytes'],'sha256':manifest['sha256']}),flush=True)
