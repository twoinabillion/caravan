#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builtPath = path.join(root, '서울까지400km.html');
const ids = ['me', 'minji', 'parkss', 'kangwoo', 'leo', 'jaeyi', 'eunsu'];

if (!fs.existsSync(builtPath)) {
  throw new Error('서울까지400km.html 없음: 먼저 npm run build:html 실행');
}

const html = fs.readFileSync(builtPath, 'utf8');
if (/__PORTRAIT_[a-z0-9_]+__/.test(html)) {
  throw new Error('빌드 결과에 치환되지 않은 주연 초상 플레이스홀더가 남아 있음');
}

for (const id of ids) {
  const pattern = new RegExp(`D\\.portraits\\.${id}\\s*=\\s*'data:image\\/png;base64,([^']*)'`, 'g');
  const matches = [...html.matchAll(pattern)]
    .map(match => Buffer.from(match[1], 'base64'))
    .filter(buffer => buffer.byteLength > 0);
  if (matches.length !== 1) {
    throw new Error(`${id}: 실제 내장 초상 수가 1개가 아님 (${matches.length})`);
  }
  const canonical = fs.readFileSync(path.join(root, 'assets', 'portraits', `${id}.png`));
  if (!matches[0].equals(canonical)) {
    throw new Error(`${id}: 빌드 초상이 canonical assets/portraits 파일과 다름`);
  }
}

console.log(`✅ 주연 초상 ${ids.length}개: 빌드와 canonical asset 바이트 일치`);
