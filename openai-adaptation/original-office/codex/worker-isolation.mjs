// Read the effective kernel/container settings before touching account credentials.
import fs from 'node:fs';
export function assessWorkerIsolation({uid,status,mountinfo,cpuQuota,cpuPeriod,memoryLimit,pidsLimit}){
 if(uid!==1000)throw Error('WORKER_USER_REQUIRED');
 const field=name=>status.match(new RegExp('^'+name+':\\s*(\\S+)','m'))?.[1];
 if(field('NoNewPrivs')!=='1')throw Error('WORKER_NO_NEW_PRIVILEGES_REQUIRED');
 if(!/^0+$/.test(field('CapEff')||''))throw Error('WORKER_CAPABILITIES_REQUIRED');
 const root=mountinfo.split('\n').map(line=>line.split(' ')).find(fields=>fields[4]==='/');
 if(!root?.[5]?.split(',').includes('ro'))throw Error('WORKER_READ_ONLY_ROOT_REQUIRED');
 if(!Number.isSafeInteger(cpuQuota)||!Number.isSafeInteger(cpuPeriod)||cpuQuota<=0||cpuPeriod<=0||cpuQuota/cpuPeriod>1)throw Error('WORKER_CPU_LIMIT_REQUIRED');
 if(!Number.isSafeInteger(memoryLimit)||memoryLimit<=0||memoryLimit>768*1024**2)throw Error('WORKER_MEMORY_LIMIT_REQUIRED');
 if(!Number.isSafeInteger(pidsLimit)||pidsLimit<=0||pidsLimit>128)throw Error('WORKER_PIDS_LIMIT_REQUIRED');
 return {verified:true,cpus:cpuQuota/cpuPeriod,memoryBytes:memoryLimit,pids:pidsLimit};
}
export function checkWorkerIsolation(){
 const read=path=>fs.readFileSync(path,'utf8').trim();
 const first=paths=>{const path=paths.find(p=>fs.existsSync(p));if(!path)throw Error('WORKER_RESOURCE_LIMITS_UNAVAILABLE');return read(path);};
 let cpuQuota,cpuPeriod,memoryLimit,pidsLimit;
 try{
  if(fs.existsSync('/sys/fs/cgroup/cpu.max'))[cpuQuota,cpuPeriod]=read('/sys/fs/cgroup/cpu.max').split(/\s+/).map(Number);
  else{
   cpuQuota=Number(first(['/sys/fs/cgroup/cpu/cpu.cfs_quota_us','/sys/fs/cgroup/cpu,cpuacct/cpu.cfs_quota_us']));
   cpuPeriod=Number(first(['/sys/fs/cgroup/cpu/cpu.cfs_period_us','/sys/fs/cgroup/cpu,cpuacct/cpu.cfs_period_us']));
  }
  memoryLimit=Number(first(['/sys/fs/cgroup/memory.max','/sys/fs/cgroup/memory/memory.limit_in_bytes']));
  pidsLimit=Number(first(['/sys/fs/cgroup/pids.max','/sys/fs/cgroup/pids/pids.max']));
 }catch{throw Error('WORKER_RESOURCE_LIMITS_UNAVAILABLE');}
 const limits=assessWorkerIsolation({uid:process.getuid(),status:read('/proc/self/status'),mountinfo:read('/proc/self/mountinfo'),cpuQuota,cpuPeriod,memoryLimit,pidsLimit});
 for(const dir of ['/home/node/codex-isolated','/run/office']){
  const stat=fs.lstatSync(dir);
  if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid()||(stat.mode&0o077)!==0)throw Error('WORKER_PRIVATE_DIRECTORIES_REQUIRED');
 }
 const auth=fs.lstatSync('/home/node/codex-isolated/auth.json');
 if(!auth.isFile()||auth.isSymbolicLink()||auth.uid!==process.getuid()||(auth.mode&0o077)!==0)throw Error('WORKER_PRIVATE_AUTH_REQUIRED');
 return limits;
}
