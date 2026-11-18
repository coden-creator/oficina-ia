import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('runtime build pins official Codex package and Debian FFmpeg, does not autoauthenticate',()=>{
 const pkg=JSON.parse(fs.readFileSync(new URL('./runtime-package/package.json',import.meta.url)));const lock=JSON.parse(fs.readFileSync(new URL('./runtime-package/package-lock.json',import.meta.url)));assert.equal(pkg.dependencies['@openai/codex'],'0.167.0-alpha.4');const p=lock.packages['node_modules/@openai/codex'];assert.equal(p.version,pkg.dependencies['@openai/codex']);assert.match(p.resolved,/^https:\/\/registry\.npmjs\.org\/@openai\/codex\//);assert.match(p.integrity,/^sha512-/);
 const docker=fs.readFileSync(new URL('./Dockerfile.runtime',import.meta.url),'utf8');assert.match(docker,/ffmpeg=7:5\.1\.9-0\+deb12u1/);assert.match(docker,/npm ci --omit=dev --ignore-scripts/);assert.match(docker,/COPY --from=codex-install --chmod=755 \/codex-vendor\//);assert.match(docker,/USER node/);assert.match(docker,/CMD \["node","start.mjs"\]/);assert.ok(!/codex login|auth\.json|COPY \. /i.test(docker));
 const start=fs.readFileSync(new URL('./start.mjs',import.meta.url),'utf8');assert.ok(!/launchIsolatedCodex|ChatGPTDraftRuntime|\.connect\(/.test(start));
});
test('deny-all Docker context includes transitive static and worker code, excludes tests and secrets',()=>{
 const root=new URL('./',import.meta.url), rules=fs.readFileSync(new URL('.dockerignore',root),'utf8').split(/\r?\n/).filter(Boolean);assert.equal(rules[0],'**');
 const included=p=>rules.some(r=>r==='!'+p||r.startsWith('!')&&r.endsWith('/*.mjs')&&p.startsWith(r.slice(1,-5))&&p.endsWith('.mjs')&&!p.slice(r.slice(1,-5).length).includes('/'));
 const visit=(file,seen=new Set())=>{if(seen.has(file))return;seen.add(file);assert.ok(included(file),'Excluded dependency: '+file);const text=fs.readFileSync(new URL(file,root),'utf8');for(const m of text.matchAll(/(?:from\s*|import\s*\(|import\s*|new URL\(\s*)['"](\.[^'"]+\.(?:mjs|js))['"]/g)){const target=new URL(m[1],new URL(file,root));visit(target.href.slice(root.href.length),seen);}};
 visit('start.mjs');visit('public/compat-app.js');visit('public/video-panel.js');
 for(const f of ['video/canvas-demo/worker.mjs','video/canvas-demo/scene.mjs','public/material-import.js'])assert.ok(included(f));
 for(const f of ['.env','auth.json','video/process-runner.test.mjs','video/flow.test.mjs','TEST-RESULTS.txt'])assert.equal(included(f),false,f);
});
test('voice contract stays outside image/startup, no HTTP synthesis route or client approval',()=>{
 const rules=fs.readFileSync(new URL('.dockerignore',import.meta.url),'utf8');assert.ok(!rules.includes('!connectors'));
 for(const f of ['start.mjs','server.mjs','video/http.mjs']){const s=fs.readFileSync(new URL(f,import.meta.url),'utf8');assert.ok(!s.includes('createElevenLabsAdapter'));assert.ok(!s.includes('.synthesize('));}
 const server=fs.readFileSync(new URL('server.mjs',import.meta.url),'utf8');assert.ok(server.includes("voice:'not-connected'"));
});
