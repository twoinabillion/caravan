import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
export function projectOriginalToCompressed(root,actual){
 const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));const original=read('tests/fixtures/qa-cycle68-atlas-codecs/baseline.json');const compressed=read('tests/fixtures/qa-cycle72-atlas-restoration/compressed-runtime-before.json');const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
 assert.deepEqual(actual,original);assert.equal(actual.routes.length,78);assert.equal(compressed.routes.length,78);
 for(let i=0;i<78;i++){const a=actual.routes[i],b=compressed.routes[i];assert.equal(a.id,b.id);assert.equal(sha(a.file),a.sha256);assert.equal(sha(b.file),b.sha256);}
 const projected=structuredClone(actual);for(let i=0;i<78;i++){projected.routes[i].file=compressed.routes[i].file;projected.routes[i].sha256=compressed.routes[i].sha256}assert.deepEqual(projected,compressed);return projected;
}
