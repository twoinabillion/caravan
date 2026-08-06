import {createHash} from 'node:crypto';
import {readFileSync, statSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const fail=message=>{ throw new Error(`release gate: ${message}`); };
const htmlPath=resolve(root,'서울까지400km.html');
const htmlBytes=statSync(htmlPath).size;
const targetBytes=31_000_000;
if(htmlBytes>targetBytes) fail(`HTML ${htmlBytes} bytes exceeds ${targetBytes}`);

const budget=JSON.parse(readFileSync(resolve(root,'reports/asset-budget.json'),'utf8'));
if(budget.html.bytes!==htmlBytes) fail(`asset report HTML size ${budget.html.bytes} is stale; actual ${htmlBytes}`);
if(budget.html.bytes>budget.html.maxBytes) fail('asset report exceeds hard maximum');

const artifacts=['caravan.ait','caravanproject.ait','seoul400km.ait'];
const hashes=artifacts.map(name=>createHash('sha256').update(readFileSync(resolve(root,name))).digest('hex'));
if(new Set(hashes).size!==1) fail(`AIT hashes differ: ${hashes.join(', ')}`);

const html=readFileSync(htmlPath,'utf8');
if(!html.includes("const GAME_BUILD = '2026-08-06-quality3'")) fail('generated HTML does not contain the current quality build');

console.log(`✅ release gate · HTML ${(htmlBytes/1_000_000).toFixed(2)}MB · AIT sha256 ${hashes[0].slice(0,12)} · quality3`);
