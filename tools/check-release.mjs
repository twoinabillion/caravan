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
/* 빌드 문자열의 단일 소스는 src/04-engine.js — 게이트는 그 값을 읽어 대조만 한다 */
const engineSource=readFileSync(resolve(root,'src/04-engine.js'),'utf8');
const buildMatch=engineSource.match(/const GAME_BUILD = '([^']+)'/);
if(!buildMatch) fail('src/04-engine.js does not declare GAME_BUILD');
const gameBuild=buildMatch[1];
if(!html.includes(`const GAME_BUILD = '${gameBuild}'`)) fail('generated HTML does not contain the current build string');

/* 확대 금지 회귀 방지: 어떤 배포 셸도 user-scalable=no를 다시 들여올 수 없다 */
for(const shell of ['서울까지400km.html','index.html']){
  const doc=readFileSync(resolve(root,shell),'utf8');
  /* no / 0 / 1 / 1.0 — 확대 금지를 쓰는 모든 관용 표기를 막는다 */
  if(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0+)?\s*[,"';]/.test(doc))
    fail(`${shell} restricts zoom (user-scalable/maximum-scale)`);
}

console.log(`✅ release gate · HTML ${(htmlBytes/1_000_000).toFixed(2)}MB · AIT sha256 ${hashes[0].slice(0,12)} · ${gameBuild}`);
