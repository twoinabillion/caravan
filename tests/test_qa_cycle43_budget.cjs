'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const rows=require('./fixtures/qa-cycle43-budget/approved-delivery.json'),root=path.resolve(__dirname,'..');
test('approved Q75 deliveries preserve old hashes and match current bytes',()=>{assert.equal(rows.length,38);assert.equal(new Set(rows.map(r=>r.file)).size,38);for(const r of rows){assert.equal(r.quality,75);assert.match(r.old.sha256,/^[a-f0-9]{64}$/);assert.notEqual(r.old.sha256,r.new.sha256);const b=fs.readFileSync(path.join(root,r.file));assert.equal(b.length,r.new.bytes,r.file);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),r.new.sha256,r.file)}});
