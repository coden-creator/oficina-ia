import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {checkVideoStorage} from './storage-preflight.mjs';

test('checks writable storage without changing existing files',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'office-storage-'));
 try {
  fs.writeFileSync(path.join(dir,'existing'),'keep');
  checkVideoStorage(dir);
  assert.deepEqual(fs.readdirSync(dir),['existing']);
  assert.equal(fs.readFileSync(path.join(dir,'existing'),'utf8'),'keep');
  assert.throws(()=>checkVideoStorage('relative/path'));
  assert.throws(()=>checkVideoStorage(path.join(dir,'missing')));
  const link=path.join(dir,'link');fs.symlinkSync(dir,link);
  assert.throws(()=>checkVideoStorage(link),/VIDEO_STORAGE_UNSAFE_PATH/);
 } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
