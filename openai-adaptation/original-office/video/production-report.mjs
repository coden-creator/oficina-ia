// Authenticated operator inspection of generated production data only.
import fs from 'node:fs/promises';import path from 'node:path';import {constants} from 'node:fs';
export async function productionReport(dataDir,job){
 const report={id:job.id,version:job.version,reviews:[],designs:[],images:[]};
 if(job.brief.productionMode!=='glowfy-authored-motion-v2')return report;
 const expected=path.resolve(dataDir,job.brandId,job.id,'v'+job.version);let root;
 try{root=await fs.realpath(expected);}catch(e){if(e.code==='ENOENT')return report;throw e;}
 if(root!==expected)throw Error('REPORT_PATH_INVALID');
 const read=async name=>{try{const f=await fs.realpath(path.join(root,'authored',name));if(!f.startsWith(root+path.sep))throw Error('REPORT_PATH_INVALID');const h=await fs.open(f,constants.O_RDONLY|constants.O_NOFOLLOW);try{const s=await h.stat();if(!s.isFile()||s.size>1000000)throw Error('REPORT_FILE_INVALID');return await h.readFile();}finally{await h.close();}}catch(e){if(e.code==='ENOENT')return null;throw e;}};
 for(let attempt=0;attempt<5;attempt++){const b=await read(`review-${attempt}.json`);if(b){const r=JSON.parse(b);report.reviews.push({attempt,graphHash:r.graphHash,model:r.provenance?.model,...r.output?.detail});}}
 for(let scene=1;scene<=4;scene++){let latest=null;for(let attempt=0;attempt<5;attempt++){const b=await read(`scene-${scene}-attempt-${attempt}.json`);if(b){const r=JSON.parse(b);latest={scene,attempt,graph:JSON.parse(r.output.detail.graph),provenance:r.provenance};}}if(latest)report.designs.push(latest);const b=await read(`review-scene-${scene}.jpg`);if(b&&b[0]===255&&b[1]===216)report.images.push({scene,base64:b.toString('base64')});}
 return report;
}
