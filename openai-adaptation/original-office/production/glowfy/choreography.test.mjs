import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {drawGraph,drawChoreography,transitionAt} from './scene-authored.mjs';import {projectSurface} from './motion-surface.mjs';import {validateGraph,AUTHORED_PROTOCOL} from '../../video/authored-motion.mjs';import {createVideoFlow} from '../../video/video-flow.mjs';import {publicJob} from '../../video/http.mjs';
const {createCanvas}=createRequire(import.meta.url)('@napi-rs/canvas');
const graph=color=>({background:color,gradients:{},sounds:[],nodes:Array.from({length:8},(_,i)=>({id:'n'+i,kind:'rect',x:100+i*80,y:600,w:50,h:100,fill:color}))});
test('a shared moving actor does not preview its future pose during a dissolve',()=>{
 const a=graph('#FFFFFF');a.nodes[0]={id:'actor',kind:'rect',x:0,y:800,w:10,h:100,fill:'#0000FF',tracks:{x:[[0,0],[1,600,'linear']]}};
 const b=structuredClone(a);b.nodes[0].tracks.x=[[0,600],[1,900,'linear']];b.transitionIn={duration:.6,intention:'Shared actor continues',outgoing:{alpha:[[0,1],[1,0,'smooth']]},incoming:{alpha:[[0,0],[1,1,'smooth']]}};
 const c=createCanvas(1080,1920).getContext('2d'),scenes=[{start:0,end:3,graph:a},{start:3,end:6,graph:b}];
 drawChoreography(c,2.85,scenes,{});assert.deepEqual([...c.getImageData(573,850,1,1).data],[0,0,255,255]);assert.deepEqual([...c.getImageData(603,850,1,1).data],[255,255,255,255]);
 drawChoreography(c,3.15,scenes,{});assert.deepEqual([...c.getImageData(618,850,1,1).data],[0,0,255,255]);assert.deepEqual([...c.getImageData(603,850,1,1).data],[255,255,255,255]);
});
test('authored curves flex between compatible paths and keep their anchor positions',()=>{
 const g=graph('#FFFFFF');g.nodes.slice(1).forEach(n=>n.alpha=0);g.nodes[0]={id:'ribbon',kind:'path',d:'M200 800 Q500 800 800 800 L800 900 Q500 900 200 900 Z',d2:'M200 800 Q500 400 800 800 L800 900 Q500 500 200 900 Z',fill:'#0000FF',tracks:{morph:[[0,0],[1,1,'linear']]}};validateGraph(g);
 const c=createCanvas(1080,1920).getContext('2d');for(const [t,y] of [[0,850],[.5,750],[1,650],[.5,750]]){drawGraph(c,g,t);assert.deepEqual([...c.getImageData(500,y,1,1).data],[0,0,255,255]);assert.deepEqual([...c.getImageData(202,850,1,1).data],[0,0,255,255]);}
 for(const mutate of [n=>n.d2+='L2 3',n=>n.d2='fetch(https://example.com)',n=>n.d2='M0 0 A5 5 0 0 0 2 2',n=>n.tracks.morph=[[0,0],[1,1.1]]]){const bad=structuredClone(g);mutate(bad.nodes[0]);assert.throws(()=>validateGraph(bad),/AUTHORED_MORPH_INVALID/);}
});
test('a whole-frame dissolve preserves opaque nested artwork instead of fading each shape',()=>{
 const a=graph('#FAF7FD');a.nodes[0]={id:'rear',kind:'rect',x:200,y:600,w:500,h:500,fill:'#FF0000'};a.nodes[1]={id:'front',kind:'rect',x:300,y:700,w:300,h:300,fill:'#0000FF'};
 const b=structuredClone(a);b.transitionIn={duration:.7,intention:'Same pose, opaque handoff',outgoing:{alpha:[[0,1],[1,0,'smooth']]},incoming:{alpha:[[0,0],[1,1,'smooth']]}};
 const c=createCanvas(1080,1920).getContext('2d'),scenes=[{start:0,end:3,graph:a},{start:3,end:6,graph:b}];
 for(const t of [3,2.7,3.2,3]){drawChoreography(c,t,scenes,{});assert.deepEqual([...c.getImageData(400,850,1,1).data],[0,0,255,255]);assert.deepEqual([...c.getImageData(250,850,1,1).data],[255,0,0,255]);}
});
test('a boundary composites both scenes and converges to the incoming identity',()=>{
 const a=graph('#FF0000'),b=graph('#0000FF');b.transitionIn={duration:.6,intention:'Synthetic spatial continuity',outgoing:{x:[[0,0],[1,-1080,'inOut']]},incoming:{x:[[0,1080],[1,0,'inOut']]}};validateGraph(b);
 const scenes=[{start:0,end:3,graph:a},{start:3,end:6,graph:b}],canvas=createCanvas(1080,1920),c=canvas.getContext('2d');
 drawChoreography(c,3,scenes,{});assert.deepEqual([...c.getImageData(100,800,1,1).data],[255,0,0,255]);assert.deepEqual([...c.getImageData(900,800,1,1).data],[0,0,255,255]);
 assert.equal(transitionAt(3.4,scenes),null);drawChoreography(c,3.4,scenes,{});const exact=canvas.toBuffer('image/png');drawGraph(c,b,.4/3);assert.deepEqual(canvas.toBuffer('image/png'),exact);
});
test('projected surfaces keep child textures, show depth and seek without previous-frame state',()=>{
 const g=graph('#FAF7FD');g.nodes=[{id:'face',kind:'plane',x:540,y:800,w:600,h:750,depth:30,side:'#21102E',tracks:{tiltY:[[0,-30],[1,25,'inOut']]}},...Array.from({length:7},(_,i)=>({id:'item'+i,parent:'face',kind:'rect',x:i%2*250+25,y:50+i*85,w:240,h:60,fill:i%2?'#AD52E0':'#21102E'}))];validateGraph(g);
 const c=createCanvas(1080,1920),ctx=c.getContext('2d');drawGraph(ctx,g,.8);const expected=c.toBuffer('image/png');drawGraph(ctx,g,.1);assert.notDeepEqual(c.toBuffer('image/png'),expected);drawGraph(ctx,g,.8);assert.deepEqual(c.toBuffer('image/png'),expected);
 assert.notDeepEqual(projectSurface(0,0,0,600,750,0,25),projectSurface(0,750,0,600,750,0,25));
});
test('new motion data rejects unbounded projection, bad cameras and recursive surfaces',()=>{
 for(const change of [g=>g.camera={zoom:0},g=>g.camera={tracks:{zoom:[[0,1],[1,20]]}},g=>g.transitionIn={duration:5,intention:'bad'},g=>{g.nodes[0]={id:'p',kind:'plane',w:600,h:600};g.nodes[1]={id:'q',kind:'plane',parent:'p',w:600,h:600}},g=>g.nodes[1].tiltY=90]){const g=graph('#FFFFFF');change(g);assert.throws(()=>validateGraph(g),/AUTHORED_/);}
});
test('visual correction preserves exact script, old artifact and narration cache while rebuilding direction',async()=>{
 const dataDir=await fs.mkdtemp(path.join(os.tmpdir(),'motion-repair-'));try{
 const flow=createVideoFlow({dataDir}),j=await flow.create({brandId:'glowfy',brief:{objective:'Synthetic correction',cta:'Conocé Glowfy',productionMode:AUTHORED_PROTOCOL}});const bytes=Buffer.from('fixture only');const artifact={file:path.join(dataDir,'glowfy',j.id,'v1','old.mp4'),version:1,sha256:createHash('sha256').update(bytes).digest('hex')};
 await fs.mkdir(path.dirname(artifact.file),{recursive:true});await fs.writeFile(artifact.file,bytes);
 await flow.updateOffice('glowfy',j.id,1,x=>{x.state='awaiting_review';x.artifact=artifact;x.productionAuthorization={protocol:AUTHORED_PROTOCOL};x.outputs={script:{detail:{narration:'Preserve exactly.'}},art_direction:{old:true},edit_plan:{old:true},production:{voice:{cacheVersion:1}}};},'fixture');
 const image='data:image/jpeg;base64,/9j/';
 await assert.rejects(flow.prepareRerender('glowfy',j.id,{version:1,feedback:'Motion correction',referenceImages:['https://example.com/private.jpg']}),/RENDER_REFERENCE_INVALID/);
 const n=await flow.prepareRerender('glowfy',j.id,{version:1,feedback:'Motion correction',referenceImages:[image]});assert.equal(n.version,2);assert.equal(n.productionAuthorization.cachedVoiceVersion,1);assert.equal(n.outputs.script.detail.narration,'Preserve exactly.');assert.equal(n.outputs.edit_plan,undefined);assert.equal(n.outputs.production,undefined);assert.equal(n.revisions[0].artifact.sha256,artifact.sha256);assert.equal(n.motionChoreography,'continuity-v1');assert.equal(n.approval,null);assert.deepEqual(await fs.readFile(artifact.file),bytes);assert.equal(JSON.stringify(publicJob(n)).includes(image),false);
 assert.equal((await flow.prepareRerender('glowfy',j.id,{version:1,feedback:'Motion correction'})).version,2);
 }finally{await fs.rm(dataDir,{recursive:true,force:true});}
});

test('the office attaches reference images and separately reviews dense motion before export',async()=>{
 const {authorScenes}=await import('./authored-plan.mjs'),dir=await fs.mkdtemp(path.join(os.tmpdir(),'office-choreography-'));try{
 const plan={title:'Synthetic',scenes:[1,2,3,4].map(scene=>({scene,title:'Synthetic',action:'Fixture only'}))},job={id:'fixture',version:2,brief:{cta:'Conocé Glowfy'},motionChoreography:'continuity-v1',motionReferenceImages:['data:image/jpeg;base64,/9j/'],outputs:{script:{detail:{narration:'Synthetic fixture'}},edit_plan:{provenance:{model:'fixture'}},art_direction:{detail:{}}}},beats={duration:8,captions:[],words:[],scenes:[0,1,2,3].map(i=>({start:i*2,end:i*2+2,narration:'Synthetic'}))};let designs=0,reviews=0;
 const runner={run:async q=>{assert.ok(q.images.length);if(q.stage==='motion_design'){designs++;if(q.input.correction){assert.equal(q.input.previousSceneGraph.nodes[0].x,600);assert.equal(q.input.previousSceneGraph.nodes[0].tracks,undefined);assert.equal(q.input.previousMotionTail.durationSeconds,2);assert.equal(q.input.previousMotionTail.nodes[0].lastKeyframes.x.at(-1)[1],600);if(q.input.scene.scene===2){assert.match(q.input.correction,/Visible connection/);assert.match(q.input.correction,/Stronger key travel/);}else{assert.equal(q.input.scene.scene,3);assert.equal(q.images.at(-1),'data:image/jpeg;base64,'+(await fs.readFile(path.join(dir,'authored','motion-scene-3.jpg'))).toString('base64'));}}assert.equal(q.images[0],job.motionReferenceImages[0]);const g=graph('#FAF7FD');g.nodes[0].tracks={x:[[0,100],[1,600,'out']]};return {status:'completed',provenance:{provider:'codex-chatgpt-plan',model:'fixture'},output:{detail:{scene:q.input.scene.scene,graph:JSON.stringify(g),rationale:'Test only'}}};}reviews++;assert.equal(q.images.length,4);if(reviews===1)return {status:'completed',provenance:{provider:'codex-chatgpt-plan',model:'fixture'},output:{detail:{verdict:'changes',observations:['Two findings for one scene'],corrections:[{scene:2,instruction:'Visible connection'},{scene:2,instruction:'Stronger key travel'}]}}};if(reviews===3){assert.ok(q.input.measurements.scenes.length===4);return {status:'completed',provenance:{provider:'codex-chatgpt-plan',model:'fixture'},output:{detail:{verdict:'changes',observations:['Temporal fixture defect'],corrections:[{scene:3,instruction:'Temporal correction'}]}}};}return {status:'completed',provenance:{provider:'codex-chatgpt-plan',model:'fixture'},output:{detail:{verdict:'pass',observations:['Synthetic fixture only'],corrections:[]}}};}};
 const r=await authorScenes({job,plan,beats,outDir:dir,runner,onStage:async()=>{}});assert.equal(designs,6);assert.equal(reviews,5);assert.equal(r.reviews.length,5);assert.ok((await fs.stat(path.join(dir,'authored','motion-scene-2.jpg'))).size>1000);
 await authorScenes({job,plan,beats,outDir:dir,runner,onStage:async()=>{}});assert.equal(designs,6);assert.equal(reviews,5);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});

test('the compositor repair budget persists across resume and cannot become an infinite correction loop',async()=>{
 const {authorScenes}=await import('./authored-plan.mjs'),dir=await fs.mkdtemp(path.join(os.tmpdir(),'motion-limit-'));try{
 const plan={title:'Fixture',scenes:[1,2,3,4].map(scene=>({scene}))},job={id:'fixture',version:1,motionChoreography:'continuity-v1',brief:{cta:'Conocé Glowfy'},outputs:{script:{detail:{}},edit_plan:{provenance:{model:'fixture'}},art_direction:{detail:{}}}},beats={duration:4,captions:[],words:[],scenes:[0,1,2,3].map(i=>({start:i,end:i+1,narration:'Fixture'}))};let calls=0;
 const runner={run:async q=>{calls++;return {status:'completed',provenance:{provider:'codex-chatgpt-plan',model:'fixture'},output:{detail:q.stage==='motion_design'?{scene:q.input.scene.scene,graph:JSON.stringify(graph('#FAF7FD')),rationale:'Synthetic'}:{verdict:'changes',observations:['Fixture unresolved'],corrections:[{scene:1,instruction:'Fixture unresolved'}]}}};}};
 await assert.rejects(authorScenes({job,plan,beats,outDir:dir,runner,onStage:async()=>{}}),/AUTHORED_VISUAL_REVISION_LIMIT/);const original=calls;assert.equal(calls,11);await assert.rejects(authorScenes({job,plan,beats,outDir:dir,runner,onStage:async()=>{}}),/AUTHORED_VISUAL_REVISION_LIMIT/);assert.equal(calls,original);assert.ok((await fs.stat(path.join(dir,'authored','review-continuity-kinematics-v3-3.json'))).size>100);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});

test('the opacity repair reuses the latest authored geometry but inspects fresh rendered sequences',async()=>{
 const {authorScenes}=await import('./authored-plan.mjs'),dir=await fs.mkdtemp(path.join(os.tmpdir(),'motion-opacity-cache-'));try{
 const plan={title:'Fixture',scenes:[1,2,3,4].map(scene=>({scene}))},job={id:'fixture',version:3,motionChoreography:'continuity-v1',brief:{cta:'Conocé Glowfy'},outputs:{script:{detail:{}},edit_plan:{provenance:{model:'fixture'}},art_direction:{detail:{}}}},beats={duration:4,captions:[],words:[],scenes:[0,1,2,3].map(i=>({start:i,end:i+1,narration:'Fixture'}))};
 const sourceHash=createHash('sha256').update(JSON.stringify({script:job.outputs.script.detail,plan,version:job.version})).digest('hex'),folder=path.join(dir,'authored');await fs.mkdir(folder);
 for(let scene=1;scene<=4;scene++)for(const attempt of [0,6]){const g=graph('#FAF7FD');g.nodes[0].x=100+attempt;await fs.writeFile(path.join(folder,`scene-${scene}-continuity-v1-attempt-${attempt}.json`),JSON.stringify({sourceHash,attempt,provenance:{provider:'codex-chatgpt-plan',model:'fixture'},output:{detail:{scene,rationale:'Cached fixture',graph:JSON.stringify(g)}}}));}
 const inherited=JSON.parse(await fs.readFile(path.join(folder,'scene-1-continuity-v1-attempt-6.json')));const richer=JSON.parse(inherited.output.detail.graph);richer.nodes[0].x=306;inherited.output.detail.graph=JSON.stringify(richer);await fs.writeFile(path.join(folder,'scene-1-continuity-composite-v2-attempt-1.json'),JSON.stringify(inherited));await fs.writeFile(path.join(folder,'motion-review-continuity-composite-v2-3.json'),JSON.stringify({output:{detail:{verdict:'changes',observations:['Previous motion finding'],corrections:[{scene:1,instruction:'Previous fixture correction'}]}}}));let calls=0;const runner={run:async q=>{calls++;assert.equal(q.stage,'visual_review');assert.equal(q.images.length,4);if(calls===1)assert.deepEqual(q.input.previousReview.observations,['Previous motion finding']);return {status:'completed',provenance:{provider:'codex-chatgpt-plan',model:'fixture'},output:{detail:{verdict:'pass',observations:['Fresh fixture inspection'],corrections:[]}}};}};
 const result=await authorScenes({job,plan,beats,outDir:dir,runner,onStage:async()=>{}});assert.equal(calls,2);assert.equal(beats.authoredScenes[0].graph.nodes[0].x,306);assert.match(result.scenes[0].seededFrom,/composite-v2-attempt-1/);assert.ok(result.reviews.every(r=>r.renderer==='continuity-kinematics-v3'));
 await authorScenes({job,plan,beats,outDir:dir,runner,onStage:async()=>{}});assert.equal(calls,2);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});


test('the final boundary correction updates its outgoing scene without changing earlier cached selections',async()=>{
 const {correctionFor}=await import('./authored-plan.mjs'),review={output:{detail:{corrections:[{scene:4,instruction:'Ocluir la varilla en el cuadro 0% sin tapar 17:00.'},{scene:4,instruction:'Conservar el contacto del apoyo.'}]}}};
 assert.equal(correctionFor(review,3),null);assert.match(correctionFor(review,3,true).instruction,/escena 4/);assert.match(correctionFor(review,3,true).instruction,/orden de oclusión/);assert.match(correctionFor(review,4,true).instruction,/contacto del apoyo/);assert.equal(correctionFor(review,2,true),null);assert.equal(review.output.detail.corrections.length,2);
});


test('the actual extended motion instructions fit the bounded worker request and validate flexing geometry',async()=>{
 const {CodexOrganicSpecialist}=await import('../../codex/organic-specialist.mjs'),{designPrompt,choreographyDesign}=await import('../../video/authored-motion.mjs');const prompt=designPrompt+'\n'+choreographyDesign;assert.ok(prompt.length>8000&&prompt.length<=10000);
 const g=graph('#FFFFFF');g.nodes[0]={id:'flex',kind:'path',d:'M0 0 Q50 0 100 0',d2:'M0 0 Q50 80 100 0',stroke:'#000000',tracks:{morph:[[0,0],[1,1]]}};const output={brand:'glowfy',stage:'motion_design',summary:'Fixture',evidence:[],detail:{scene:1,rationale:'Fixture',graph:JSON.stringify(g)}};let calls=0;const runtime={model:'fixture',status:()=>({transportConnected:true,chatgptAccountObserved:true,accountKind:'chatgpt',paidApiEnabled:false}),draft:async()=>{calls++;return {source:'chatgpt-app-server',text:JSON.stringify(output)}}},specialist=new CodexOrganicSpecialist({runtime});
 const q={brand:'glowfy',jobId:'fixture',stage:'motion_design',prompt,input:{brief:{cta:'Conocé Glowfy',productionMode:AUTHORED_PROTOCOL,evidence:[]}},context:{workflow:'organic-v1',brand:'glowfy'}};assert.equal((await specialist.run(q)).status,'completed');assert.equal((await specialist.run({...q,prompt:'x'.repeat(10001)})).reason,'INVALID_ORGANIC_REQUEST');assert.equal(calls,1);
});
