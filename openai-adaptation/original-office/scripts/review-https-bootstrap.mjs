// No password, Codex session or video volume is mounted during HTTPS validation.
import http from 'node:http';
const server=http.createServer((req,res)=>{
 const health=req.method==='GET'&&req.url==='/health';
 res.writeHead(health?200:503,{'Content-Type':'application/json','Cache-Control':'no-store'});
 res.end(JSON.stringify(health?{service:'office-review-bootstrap',credentialsConfigured:false,deploymentMarker:process.env.OFFICE_DEPLOYMENT_MARKER}:{message:'Preparando la oficina de revisión.'}));
});
server.listen(3000,'0.0.0.0');
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));
