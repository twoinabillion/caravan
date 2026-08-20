#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const context = vm.createContext({console});

for (const relative of ['src/03-data.js', 'src/03f-npc-portraits.js', 'src/03g-scenes.js']) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  vm.runInContext(source, context, {filename:relative});
}

const D = vm.runInContext('D', context);
const extraEvents = [
  D.seoulOpenEvent,
  D.gateEvent,
  D.bridgeEvent,
  ...(D.seoulStops || []),
].filter(Boolean);
const eventIds = new Set([...D.events, ...extraEvents].map(event => event.id));
const budget = JSON.parse(fs.readFileSync(path.join(root, 'reports', 'asset-budget.json'), 'utf8'));
const engineSource = [
  '04a-engine-core.js',
  '04b-engine-crew.js',
  '04c-engine-travel.js',
  '04d-engine-director.js',
  '04e-engine-world.js',
].map(name => fs.readFileSync(path.join(root, 'src', name), 'utf8')).join('\n');
const build = engineSource.match(/const GAME_BUILD = '([^']+)'/)?.[1] || 'unknown';
const htmlBytes = budget.html.bytes;
const metrics = [
  '<!-- AUTO_METRICS_START -->',
  '| 항목 | 현재 값 |',
  '|---|---:|',
  `| 게임 빌드 | \`${build}\` |`,
  `| 이벤트 | ${eventIds.size}종 |`,
  `| 지도 노드 | ${Object.keys(D.nodes || {}).length}곳 |`,
  `| 장면 이미지 | ${Object.keys(D.scenes || {}).length}종 |`,
  `| 등록 초상 | ${Object.keys(D.portraits || {}).length}명 |`,
  `| 오프라인 단일 HTML | ${(htmlBytes / 1024 / 1024).toFixed(2)} MiB |`,
  '<!-- AUTO_METRICS_END -->',
].join('\n');

const currentPath = path.join(root, 'docs', 'CURRENT.md');
const current = fs.readFileSync(currentPath, 'utf8');
const next = current.replace(
  /<!-- AUTO_METRICS_START -->[\s\S]*?<!-- AUTO_METRICS_END -->/,
  metrics,
);
if (next === current) {
  console.log('CURRENT.md metrics already current.');
} else {
  fs.writeFileSync(currentPath, next);
  console.log('Updated docs/CURRENT.md metrics.');
}
