import test from 'node:test';
import assert from 'node:assert/strict';
import {assessWorkerIsolation} from '../codex/worker-isolation.mjs';
const valid=()=>({uid:1000,status:'CapEff:\t0000000000000000\nNoNewPrivs:\t1\n',mountinfo:'35 20 0:32 / / ro,relatime - overlay overlay rw\n',cpuQuota:100000,cpuPeriod:100000,memoryLimit:768*1024**2,pidsLimit:128});
test('effective bounded non-root read-only container passes',()=>assert.deepEqual(assessWorkerIsolation(valid()),{verified:true,cpus:1,memoryBytes:805306368,pids:128}));
for(const [name,override,reason] of [
 ['root',{uid:0},'USER'],
 ['new privileges',{status:'CapEff:\t0000000000000000\nNoNewPrivs:\t0\n'},'NO_NEW_PRIVILEGES'],
 ['capabilities',{status:'CapEff:\t0000000000000001\nNoNewPrivs:\t1\n'},'CAPABILITIES'],
 ['writable root',{mountinfo:'35 20 0:32 / / rw,relatime - overlay overlay rw\n'},'READ_ONLY_ROOT'],
 ['unlimited CPU',{cpuQuota:NaN},'CPU_LIMIT'],
 ['excess CPU',{cpuQuota:200000},'CPU_LIMIT'],
 ['unlimited memory',{memoryLimit:NaN},'MEMORY_LIMIT'],
 ['excess memory',{memoryLimit:1024**3},'MEMORY_LIMIT'],
 ['unlimited pids',{pidsLimit:NaN},'PIDS_LIMIT'],
 ['excess pids',{pidsLimit:512},'PIDS_LIMIT']
])test(`refuse ${name} before loading owner credentials`,()=>assert.throws(()=>assessWorkerIsolation({...valid(),...override}),new RegExp(reason)));
