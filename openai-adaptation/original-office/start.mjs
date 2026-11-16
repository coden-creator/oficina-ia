import {createOriginalShell} from './server.mjs';
import {createVideoFlow} from './video/video-flow.mjs';
import {selectRenderer} from './video/renderer-selection.mjs';
import {checkVideoStorage} from './video/storage-preflight.mjs';
import {createRemoteRunner} from './video/remote-runner.mjs';
import {createConnectionStore} from './connections/store.mjs';
import {createElevenLabsVerifier} from './connections/elevenlabs.mjs';
import fs from 'node:fs';
import {createOfficeCoordinator} from './video/office-coordinator.mjs';
try{
 if(['OPENAI_API_KEY','ANTHROPIC_API_KEY','OPENROUTER_API_KEY','CLAUDE_CODE_OAUTH_TOKEN'].some(k=>process.env[k]))throw Error('NO_MODEL_CREDENTIALS');
 const port=Number(process.env.PORT||3000);if(!Number.isInteger(port)||port<1||port>65535)throw Error('INVALID_PORT');
 const videoDataDir=process.env.OFFICE_VIDEO_DATA_DIR;
 if(process.env.OFFICE_ENABLE_VIDEO_WORKFLOW==='1')checkVideoStorage(videoDataDir);
 const renderer=selectRenderer({local:process.env.OFFICE_ENABLE_LOCAL_RENDER==='1',canvasDemo:process.env.OFFICE_ENABLE_CANVAS_DEMO==='1',dependenciesVerified:process.env.OFFICE_CANVAS_DEPENDENCIES_VERIFIED==='1'});
 const runner=process.env.OFFICE_CODEX_SOCKET?createRemoteRunner({socketPath:process.env.OFFICE_CODEX_SOCKET}):null;
 const videoFlow=process.env.OFFICE_ENABLE_VIDEO_WORKFLOW==='1'?createVideoFlow({dataDir:videoDataDir,adapters:{...(renderer?{renderer}:{}),...(runner?{runner}:{})}}):null;
 const officeCoordinator=videoFlow?createOfficeCoordinator({flow:videoFlow,runner,enabled:process.env.OFFICE_AUTONOMY_ENABLED==='1',allowedJobIds:(process.env.OFFICE_AUTONOMY_JOB_IDS||'').split(',').filter(Boolean)}):null;
 if(officeCoordinator){await officeCoordinator.recover();videoFlow.setReferenceRunner(officeCoordinator.manualRun);officeCoordinator.start();}
 const password=process.env.OFFICE_PASSWORD_FILE?fs.readFileSync(process.env.OFFICE_PASSWORD_FILE,'utf8').trim():process.env.OFFICE_PASSWORD;
 const connectionStore=process.env.OFFICE_ENABLE_CONNECTION_SETTINGS==='1'?await createConnectionStore({directory:process.env.OFFICE_CONNECTIONS_DIR,keyFile:process.env.OFFICE_CONNECTIONS_KEY_FILE,verify:createElevenLabsVerifier()}):null;
 const server=createOriginalShell({password,origin:process.env.OFFICE_ORIGIN,videoFlow,videoDataDir,connectionStore,officeCoordinator,deploymentMarker:process.env.OFFICE_DEPLOYMENT_MARKER||null});
 server.on('error',()=>{console.error('Office shell refused to start. Check private configuration.');process.exit(1);});
 server.listen(port,process.env.HOST||'0.0.0.0',()=>console.log('Office web ready. Check /api/config for the current private worker connection.'));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{const timer=setTimeout(()=>process.exit(1),10000);timer.unref();void officeCoordinator?.stop();server.close(()=>process.exit(0));server.closeIdleConnections();});
}catch{console.error('Office startup failed. Check private configuration and the dedicated writable video storage; model credentials are forbidden.');process.exit(1);}
