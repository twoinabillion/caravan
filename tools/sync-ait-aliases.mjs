import {
  copyFileSync,
  existsSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const configPath = resolve(root, 'granite.config.ts');
const config = readFileSync(configPath, 'utf8');
const appName = config.match(/\bappName:\s*['"]([^'"]+)['"]/)?.[1];

if (!appName) {
  throw new Error('granite.config.ts에서 appName을 찾지 못했습니다.');
}

const canonical = resolve(root, `${appName}.ait`);
if (!existsSync(canonical)) {
  throw new Error(`AIT 빌드 결과가 없습니다: ${canonical}`);
}

const bundle = readFileSync(canonical);
if (bundle.subarray(0, 8).toString('ascii') !== 'AITBUNDL') {
  throw new Error(`${basename(canonical)}이 정상적인 AIT 번들이 아닙니다.`);
}

const aliases = ['caravanproject.ait', 'seoul400km.ait'];
for (const name of aliases) {
  copyFileSync(canonical, resolve(root, name));
}

const sizeMb = (statSync(canonical).size / 1024 / 1024).toFixed(1);
const hash = createHash('sha256').update(bundle).digest('hex').slice(0, 12);
console.log(`✅ ${basename(canonical)} + 호환 파일 2개 동기화 (${sizeMb} MB, sha256 ${hash})`);
