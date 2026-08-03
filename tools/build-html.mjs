#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/*
 * 이미지·오디오를 포함한 단일 HTML 빌더.
 * 이전 Bash 문자열 치환은 삽입할 때마다 20~30MB 문자열 전체를 복사했다.
 * 이 빌더는 각 템플릿을 한 번만 순회하고, 완성본을 임시 파일에 쓴 뒤
 * 성공했을 때만 최신 HTML로 바꿀다.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const output = path.join(root, '서울까지400km.html');
const temporary = `${output}.tmp`;

const before = [
  'src/01-style.html', 'src/02-dom.html', 'src/03-data.js',
  'src/03b-portraits.js', 'src/03c-icons.js', 'src/03d-bgm.js'
];
const after = [
  'src/04-engine.js', 'src/05-scene.js', 'src/06-mapgraph.js',
  'src/07-ui.js', 'src/08-offroad.js', 'src/09-close.html'
];
const introScenes = {
  INTRO_PASSENGER_SEAT:'assets/intro/01-passenger-seat.jpg',
  INTRO_CHEOLLIAN_2026:'assets/intro/02-cheollian-2026.jpg',
  INTRO_FIRST_EXPULSION:'assets/intro/03-first-expulsion-v2.jpg',
  INTRO_143_YEARS:'assets/intro/04-143-years.jpg',
  INTRO_BLANK_REASON:'assets/intro/05-blank-reason.jpg',
  INTRO_YEARS_TOGETHER:'assets/intro/06-years-together.jpg',
  INTRO_CAMPER_CONVERSION:'assets/intro/06-camper-conversion-v2.jpg',
  INTRO_ENVELOPE_SIGNAL:'assets/intro/07-envelope-signal.jpg',
  INTRO_DEPARTURE_CHOICE:'assets/intro/08-departure-choice.jpg',
  INTRO_PARENTS_DISCOVERY:'assets/intro/09-parents-discovery.jpg',
  INTRO_SILENCED_PRESENTATION:'assets/intro/10-silenced-presentation.jpg',
  INTRO_CURRENT_EXPULSION:'assets/intro/11-current-expulsion.jpg',
  INTRO_MOTHER_KEEPSAKES:'assets/intro/12-mother-keepsakes.jpg',
  INTRO_DASHBOARD_MODULE:'assets/intro/13-dashboard-module.jpg'
};
const upgradeScenes = {
  FUEL:'assets/upgrades/fuel.jpg', SEATING:'assets/upgrades/seating-v2.jpg',
  CHASSIS:'assets/upgrades/chassis.jpg', UTILITY:'assets/upgrades/utility.jpg',
  POWER:'assets/upgrades/power.jpg', CAMP:'assets/upgrades/camp.jpg',
  LIVING:'assets/upgrades/living.jpg'
};

const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const dataUri = (relative, mime) => {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) throw new Error(`자산 파일 없음: ${relative}`);
  return `data:${mime};base64,${fs.readFileSync(absolute).toString('base64')}`;
};
const replace = (source, pattern, resolve, label) => {
  let count = 0;
  const result = source.replace(pattern, (_, key) => { count++; return resolve(key); });
  if (!count) throw new Error(`${label} 플레이스홀더를 찾지 못함`);
  return {result, count};
};

const npc = replace(read('src/03f-npc-portraits.js'), /__NPC_([a-z0-9_]+)__/g,
  key => dataUri(`assets/portraits/${key}.png`, 'image/png'), 'NPC');
const scenes = replace(read('src/03g-scenes.js'), /__SCENE_([A-Z0-9_]+)__/g, key => {
  const relative = introScenes[key] || `assets/scenes/${key.toLowerCase().replaceAll('_', '-')}.jpg`;
  return dataUri(relative, 'image/jpeg');
}, '장면');
const upgrades = replace(scenes.result, /__UPGRADE_([A-Z0-9_]+)__/g,
  key => dataUri(upgradeScenes[key], 'image/jpeg'), '업그레이드');
const title = replace(read('src/03e-bgm-title.js'), /__BGM_TITLE__/g,
  () => dataUri('assets/audio/title.mp3', 'audio/mpeg'), '타이틀 BGM');
const audio = replace(read('src/03h-audio.js'), /__((?:BGM|SFX|VO)_[A-Z0-9_]+)__/g, key => {
  let relative;
  if (key.startsWith('BGM_')) relative = `assets/audio/bgm/${key.slice(4).toLowerCase()}.mp3`;
  else if (key.startsWith('SFX_')) relative = `assets/audio/sfx/${key.toLowerCase()}.mp3`;
  else relative = `assets/audio/voice/${key.slice(3).toLowerCase()}.mp3`;
  return dataUri(relative, 'audio/mpeg');
}, '오디오');

const chunks = [
  ...before.map(read), title.result, audio.result, npc.result, upgrades.result, ...after.map(read)
];
const html = chunks.join('\n');
const unresolved = [...new Set(html.match(/__(?:NPC|SCENE|UPGRADE|BGM|SFX|VO)_[A-Z0-9_]+__/g) || [])];
if (unresolved.length) throw new Error(`치환되지 않은 자산: ${unresolved.slice(0, 8).join(', ')}`);

try {
  fs.writeFileSync(temporary, html);
  fs.renameSync(temporary, output);
} finally {
  if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
}
console.log(`✅ 서울까지400km.html ${Buffer.byteLength(html)} bytes · NPC ${npc.count}·장면 ${scenes.count}·업그레이드 ${upgrades.count}·오디오 ${audio.count + title.count}`);
