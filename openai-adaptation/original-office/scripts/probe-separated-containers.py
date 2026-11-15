# Test only: synthetic model, no login, paid API, VPS or public ports. Requires local Docker.
import subprocess,json,time,sys,uuid
from pathlib import Path
image=sys.argv[1] if len(sys.argv)>1 else 'oficina-runtime:review'
common=['--network','none','--cpus','1','--memory','512m','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--tmpfs','/tmp:rw,nosuid,nodev,size=128m']
suffix=uuid.uuid4().hex[:12]
vol='office-test-ipc-'+suffix;data='office-test-video-'+suffix;auth_volume='office-test-auth-'+suffix;worker='office-test-broker-'+suffix;web='office-test-web-'+suffix
fixture=Path(__file__).resolve().parent.parent/'test'/'fixtures'/'synthetic-broker.mjs'
js=r'''const auth='Basic '+Buffer.from('jorge:local-only-test-password').toString('base64');const call=async(path,body)=>{const r=await fetch('http://127.0.0.1:3000'+path,{method:body?'POST':'GET',headers:{Host:'127.0.0.1:3000',Authorization:auth,Origin:'https://127.0.0.1:3000','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('HTTP '+r.status);return r.json();};const config=await call('/api/config');if(config.provider!=='codex-chatgpt-plan')throw Error('not connected');const j=await call('/api/video-workflows/glowfy',{objective:'MODELO SIMULADO, prueba local',cta:'Conoce más'});const run=await call('/api/video-workflows/glowfy/'+j.id+'/run',{});if(run.state!=='awaiting_review')throw Error(JSON.stringify(run));const artifact=await fetch('http://127.0.0.1:3000'+run.artifact.url,{headers:{Host:'127.0.0.1:3000',Authorization:auth}});if(!artifact.ok||(await artifact.arrayBuffer()).byteLength<1000)throw Error('invalid video');await call('/api/video-workflows/glowfy/'+j.id+'/approve',{version:run.version,artifactHash:run.artifact.sha256});console.log(JSON.stringify({id:j.id,sha256:run.artifact.sha256,bytes:run.artifact.bytes,state:'approved',model:'synthetic',publishing:false}));'''
def run(cmd):return subprocess.check_output(cmd,text=True).strip()
try:
 run(['docker','run','-d','--name',worker,*common,'--mount',f'type=volume,src={vol},dst=/run/office','--mount',f'type=volume,src={auth_volume},dst=/home/node/codex-isolated','--mount',f'type=bind,src={fixture},dst=/app/fixture-broker.mjs,readonly',image,'node','/app/fixture-broker.mjs'])
 run(['docker','run','-d','--name',web,*common,'--mount',f'type=volume,src={vol},dst=/run/office','--mount',f'type=volume,src={data},dst=/data/video','-e','OFFICE_PASSWORD=local-only-test-password','-e','OFFICE_ORIGIN=https://127.0.0.1:3000','-e','OFFICE_ENABLE_VIDEO_WORKFLOW=1','-e','OFFICE_ENABLE_LOCAL_RENDER=1','-e','OFFICE_CODEX_SOCKET=/run/office/codex.sock',image])
 for i in range(20):
  r=subprocess.run(['docker','exec',web,'node','-e',"fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"],capture_output=True)
  if r.returncode==0:break
  time.sleep(.5)
 run(['docker','exec',web,'node','-e',"if(require('fs').existsSync('/home/node/codex-isolated/test-canary'))process.exit(1);console.log('AUTH_VOLUME_NOT_VISIBLE_TO_WEB');"])
 output=run(['docker','exec',web,'node','--input-type=module','-e',js]);print(output,flush=True)
 run(['docker','exec',worker,'node','-e',"if(require('fs').existsSync('/data/video/glowfy'))process.exit(1);console.log('JOBS_NOT_VISIBLE_TO_CODEX_WORKER');"])
 run(['docker','restart',web])
 check="const r=await fetch('http://127.0.0.1:3000/api/video-workflows/glowfy',{headers:{Host:'127.0.0.1:3000',Authorization:'Basic '+Buffer.from('jorge:local-only-test-password').toString('base64')}});const j=await r.json();if(j.length!==1||j[0].state!=='approved')throw Error('persistence');console.log('PERSISTENCE_AFTER_CONTAINER_RESTART_OK');"
 for i in range(20):
  r=subprocess.run(['docker','exec',web,'node','--input-type=module','-e',check],capture_output=True,text=True)
  if r.returncode==0:print(r.stdout.strip());break
  time.sleep(.5)
 else:raise RuntimeError(r.stderr)
finally:
 for name in [web,worker]:subprocess.run(['docker','rm','-f',name],capture_output=True)
 # These new volumes contain only this explicitly synthetic test.
 subprocess.run(['docker','volume','rm',vol,data,auth_volume],capture_output=True)
