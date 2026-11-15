// TEST ONLY: synthetic specialist output. Never packaged or deployed.
import fs from 'node:fs';
fs.writeFileSync('/home/node/codex-isolated/test-canary','FAKE_TEST_DATA');
import {createSpecialistBroker,listenPrivate} from '/app/codex/broker.mjs';
import {CodexVideoSpecialist} from '/app/codex/video-specialist.mjs';
const runtime={status:()=>({transportConnected:true,chatgptAccountObserved:true,accountKind:'chatgpt',paidApiEnabled:false}),async draft(prompt){
const q=JSON.parse(prompt.split('\nDATA:\n')[1]);
return {source:'chatgpt-app-server',text:JSON.stringify({brand:q.brand,stage:q.stage,summary:'MODELO SIMULADO EN PRUEBA LOCAL',evidence:[],verdict:q.stage==='creative_review'?'pass':'not_applicable',cta:q.input.brief.cta,scenes:q.stage==='script'?[{text:'Prueba local',durationSeconds:2},{text:q.input.brief.cta,durationSeconds:2}]:[],visualPlan:q.stage==='art_direction'?{template:'text-cards',palette:'neutral-warm',motion:'soft',scenes:[{index:0,composition:'centered-text'},{index:1,composition:'centered-text'}]}:null})};}};
const server=createSpecialistBroker({specialist:new CodexVideoSpecialist({runtime})});await listenPrivate(server,'/run/office/codex.sock');console.log('Synthetic test worker listening');
