// TEST ONLY: fake protocol process, never a real model or authentication.
import readline from 'node:readline';
const send=x=>process.stdout.write(JSON.stringify(x)+'\n');
readline.createInterface({input:process.stdin}).on('line',line=>{const m=JSON.parse(line);if(m.id===undefined)return;
 if(m.method==='initialize')send({id:m.id,result:{}});
 else if(m.method==='account/read')send({id:m.id,result:{account:{type:process.env.TEST_ACCOUNT||'chatgpt'}}});
 else if(m.method==='account/rateLimits/read')send({id:m.id,result:{ordinaryUsageAllowed:true}});
 else if(m.method==='thread/start')send({id:m.id,result:{thread:{id:'fixture-thread'}}});
 else if(m.method==='turn/start'){send({id:m.id,result:{turn:{id:'fixture-turn'}}});send({method:'item/agentMessage/delta',params:{threadId:'fixture-thread',turnId:'fixture-turn',delta:'FIXTURE ONLY'}});send({method:'turn/completed',params:{threadId:'fixture-thread',turn:{id:'fixture-turn',status:'completed'}}});}
 else send({id:m.id,result:{}});
});
