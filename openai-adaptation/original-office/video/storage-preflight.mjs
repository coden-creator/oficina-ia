import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

// Check the mounted directory before accepting requests. This does not prove
// that the mount is durable; deployment must verify that independently.
export function checkVideoStorage(directory) {
 if (typeof directory !== 'string' || !path.isAbsolute(directory)) throw Error('VIDEO_STORAGE_ABSOLUTE_PATH_REQUIRED');
 const target=path.resolve(directory);
 let current=path.parse(target).root;
 for (const part of target.slice(current.length).split(path.sep).filter(Boolean)) {
  current=path.join(current,part);
  const entry=fs.lstatSync(current);
  if (entry.isSymbolicLink() || !entry.isDirectory()) throw Error('VIDEO_STORAGE_UNSAFE_PATH');
 }
 const probe=path.join(target,`.office-storage-check-${randomUUID()}`);
 let created=false;
 try {
  const fd=fs.openSync(probe,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
  created=true;
  try { fs.writeFileSync(fd,'storage check'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
 } finally { if(created)fs.unlinkSync(probe); }
}
