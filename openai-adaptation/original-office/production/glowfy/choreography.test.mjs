import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {drawGraph,drawChoreography,transitionAt} from './scene-authored.mjs';import {projectSurface} from './motion-surface.mjs';import {validateGraph,AUTHORED_PROTOCOL} from '../../video/authored-motion.mjs';import {createVideoFlow} from '../../video/video-flow.mjs';import {publicJob} from '../../video/http.mjs';
const {createCanvas}=createRequire(import.meta.url)('@napi-rs/canvas');
const graph=color=>({background:color,gradients:{},sounds:[],nodes:Array.from({length:8},(_,i)=>({id:'n'+i,kind:'rect',x:100+i*80,y:600,w:50,h:100,fill:color}))});
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
 const runner={run:async q=>{assert.ok(q.images.length);if(q.stage==='motion_design'){designs++;if(q.input.correction){assert.equal(q.input.previousSceneGraph.nodes[0].x,600);assert.equal(q.input.previousSceneGraph.nodes[0].tracks,undefined);assert.match(q.input.correction,/Visible connection/);assert.match(q.input.correction,/Stronger key travel/);}assert.equal(q.images[0],job.motionReferenceImages[0]);const g=graph('#FAF7FD');g.nodes[0].tracks={x:[[0,100],[1,600,'out']]};return {status:'completed',provenance:{provider:'codex-chatgpt-plan',model:'fixture'},output:{detail:{scene:q.input.scene.scene,graph:JSON.stringify(g),rationale:'Test only'}}};}reviews++;assert.equal(q.images.length,4);if(reviews===1)return {status:'completed',provenance:{provider:'codex-chatgpt-plan',model:'fixture'},output:{detail:{verdict:'changes',observations:['Two findings for one scene'],corrections:[{scene:2,instruction:'Visible connection'},{scene:2,instruction:'Stronger key travel'}]}}};if(reviews===3)assert.ok(q.input.measurements.scenes.length===4);return {status:'completed',provenance:{provider:'codex-chatgpt-plan',model:'fixture'},output:{detail:{verdict:'pass',observations:['Synthetic fixture only'],corrections:[]}}};}};
 const r=await authorScenes({job,plan,beats,outDir:dir,runner,onStage:async()=>{}});assert.equal(designs,5);assert.equal(reviews,3);assert.equal(r.reviews.length,3);assert.ok((await fs.stat(path.join(dir,'authored','motion-scene-2.jpg'))).size>1000);
 await authorScenes({job,plan,beats,outDir:dir,runner,onStage:async()=>{}});assert.equal(designs,5);assert.equal(reviews,3);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});

test('the extended motion review budget persists across resume and cannot become an infinite correction loop',async()=>{
 const {authorScenes}=await import('./authored-plan.mjs'),dir=await fs.mkdtemp(path.join(os.tmpdir(),'motion-limit-'));try{
 const plan={title:'Fixture',scenes:[1,2,3,4].map(scene=>({scene}))},job={id:'fixture',version:1,motionChoreography:'continuity-v1',brief:{cta:'Conocé Glowfy'},outputs:{script:{detail:{}},edit_plan:{provenance:{model:'fixture'}},art_direction:{detail:{}}}},beats={duration:4,captions:[],words:[],scenes:[0,1,2,3].map(i=>({start:i,end:i+1,narration:'Fixture'}))};let calls=0;
 const runner={run:async q=>{calls++;return {status:'completed',provenance:{provider:'codex-chatgpt-plan',model:'fixture'},output:{detail:q.stage==='motion_design'?{scene:q.input.scene.scene,graph:JSON.stringify(graph('#FAF7FD')),rationale:'Synthetic'}:{verdict:'changes',observations:['Fixture unresolved'],corrections:[{scene:1,instruction:'Fixture unresolved'}]}}};}};
 await assert.rejects(authorScenes({job,plan,beats,outDir:dir,runner,onStage:async()=>{}}),/AUTHORED_VISUAL_REVISION_LIMIT/);const original=calls;assert.equal(calls,17);await assert.rejects(authorScenes({job,plan,beats,outDir:dir,runner,onStage:async()=>{}}),/AUTHORED_VISUAL_REVISION_LIMIT/);assert.equal(calls,original);assert.ok((await fs.stat(path.join(dir,'authored','review-continuity-v1-6.json'))).size>100);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
