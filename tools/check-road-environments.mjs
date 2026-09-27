#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'assets/ui/road-environment');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const nodes=vm.runInNewContext(fs.readFileSync(path.join(root,'src/03-data.js'),'utf8')+';D.nodes');
assert.deepEqual(Object.keys(manifest.locations).sort(),Object.keys(nodes).sort());
const hashes=new Set();let bytes=0;
for(const [id,entry] of Object.entries(manifest.locations)){
  const file=path.join(dir,entry.file),buffer=fs.readFileSync(file);
  assert.equal(buffer.toString('ascii',8,12),'WEBP',id+' delivery must be WebP');
  const hash=createHash('sha256').update(buffer).digest('hex');
  assert(!hashes.has(hash),id+' accidentally reuses another location image');hashes.add(hash);
  const dimensions=execFileSync('magick',['identify','-format','%w %h',file],{encoding:'utf8'}).trim();
  assert.equal(dimensions,manifest.delivery.join(' '),id+' delivery geometry');
  const alphaMean=crop=>Number(execFileSync('magick',[file,'-alpha','extract','-crop',crop,'+repage','-format','%[fx:mean]','info:'],{encoding:'utf8'}).trim());
  assert(alphaMean('1024x96+0+0')<.001,id+' has baked sky / lacks transparency');
  // Two source-over passes in the terrain buffer make 98% source alpha >99.9%.
  assert(alphaMean('1024x16+0+560')>.98,id+' has holes along ground anchor');
  assert(buffer.length<130000,id+' exceeds per-location size target');bytes+=buffer.length;
}
console.log(`PASS ${hashes.size} unique regions: 1024×576, transparent sky, opaque ground, WebP; ${bytes} bytes total. Style/crop still require visual QA.`);
