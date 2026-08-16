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
const reportOutput = path.join(root, 'reports', 'asset-budget.json');
const WARN_BYTES = 32_000_000;
const MAX_BYTES = 39_000_000;   /* BGM 7슬롯 + 통합 이벤트 기록철 UI 허용 (docs/audio-guide.md) */
const embeddedAssets = new Map();

const before = [
  'src/02-dom.html', 'src/03-data.js'
];
const after = [
  'src/04a-engine-core.js', 'src/04b-engine-crew.js', 'src/04c-engine-travel.js',
  'src/04d-engine-director.js', 'src/04e-engine-world.js',
  'src/05-scene.js', 'src/06-mapgraph.js',
  'src/07-ui.js', 'src/07e-ui-audio.js',
  'src/08-offroad.js', 'src/09-close.html'
];
const introScenes = {
  INTRO_PASSENGER_SEAT:'assets/intro/01-passenger-seat.jpg',
  INTRO_CHEOLLIAN_2026:'assets/intro/02-cheollian-2026.jpg',
  INTRO_FIRST_EXPULSION:'assets/intro/03-first-expulsion-v2.jpg',
  INTRO_143_YEARS:'assets/intro/04-143-years.jpg',
  INTRO_BLANK_REASON:'assets/intro/05-blank-reason.jpg',
  INTRO_YEARS_TOGETHER:'assets/intro/06-years-together-v2.jpg',
  INTRO_CAMPER_CONVERSION:'assets/intro/06-camper-conversion-v3.jpg',
  INTRO_ENVELOPE_SIGNAL:'assets/intro/07-envelope-signal-v3.jpg',
  INTRO_DEPARTURE_CHOICE:'assets/intro/08-departure-choice-v3.jpg',
  INTRO_PARENTS_DISCOVERY:'assets/intro/09-parents-discovery.jpg',
  INTRO_SILENCED_PRESENTATION:'assets/intro/10-silenced-presentation.jpg',
  INTRO_CURRENT_EXPULSION:'assets/intro/11-current-expulsion-v2.jpg',
  INTRO_DOCK_AID:'assets/intro/14-dock-aid-v2.jpg',
  INTRO_APPEAL_DENIED:'assets/intro/15-appeal-denied.jpg',
  INTRO_MOTHER_KEEPSAKES:'assets/intro/12-mother-keepsakes-v2.jpg',
  INTRO_DASHBOARD_MODULE:'assets/intro/13-dashboard-module.jpg',
  INTRO_WORKSHOP_DEPARTURE:'assets/intro/16-workshop-shutter-v2.jpg'
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
  const buffer = fs.readFileSync(absolute);
  embeddedAssets.set(relative, {path:relative, mime, bytes:buffer.byteLength,
    encodedBytes:Buffer.byteLength(buffer.toString('base64'))});
  return `data:${mime};base64,${buffer.toString('base64')}`;
};
const replace = (source, pattern, resolve, label) => {
  let count = 0;
  const result = source.replace(pattern, (_, key) => { count++; return resolve(key); });
  if (!count) throw new Error(`${label} 플레이스홀더를 찾지 못함`);
  return {result, count};
};

const uiAssetPaths = {
  NAV_ARMORED_SHELL:{path:'assets/ui/nav-armored-shell-v2.webp', mime:'image/webp'},
  NAV_BUTTON_FACE:{path:'assets/ui/nav-button-face-v2.webp', mime:'image/webp'},
  NAV_BUTTON_PRESSED:{path:'assets/ui/nav-button-pressed-v2.webp', mime:'image/webp'},
  ROUTE_CONSOLE_SHELL:{path:'assets/ui/route-console-shell-option3.webp', mime:'image/webp'},
  ROUTE_MAP_TERRAIN:{path:'assets/ui/route-map-terrain-v1.webp', mime:'image/webp'},
  ROUTE_FACT_FUEL:{path:'assets/ui/route-fact-fuel-option3.png', mime:'image/png'},
  ROUTE_FACT_TIME:{path:'assets/ui/route-fact-time-option3.png', mime:'image/png'},
  ROUTE_FACT_DISTANCE:{path:'assets/ui/route-fact-distance-option3.png', mime:'image/png'},
  GOAL_FOLIO_SHELL:{path:'assets/ui/goal-folio-shell-v1.webp', mime:'image/webp'},
  MAP_NAVIGATOR_SHELL:{path:'assets/ui/map-navigator-shell-v1.webp', mime:'image/webp'},
  BAG_SUPPLY_ROLL:{path:'assets/ui/bag-supply-roll-v1.webp', mime:'image/webp'},
  STAY_JOURNEY_LEDGER:{path:'assets/ui/stay-journey-ledger-console-v1.webp', mime:'image/webp'},
  STAY_JOURNEY_LEDGER_NARROW:{path:'assets/ui/stay-journey-ledger-console-narrow-v1.webp', mime:'image/webp'},
  STAY_JOURNEY_LEDGER_INSERT:{path:'assets/ui/stay-journey-ledger-insert-v3.webp', mime:'image/webp'},
  STAY_ICON_EXPLORE:{path:'assets/ui/stay-icon-explore-v1.webp', mime:'image/webp'},
  STAY_ICON_CAMP:{path:'assets/ui/stay-icon-camp-v1.webp', mime:'image/webp'},
  STAY_ICON_REPAIR:{path:'assets/ui/stay-icon-repair-v1.webp', mime:'image/webp'},
  STAY_ICON_RADIO:{path:'assets/ui/stay-icon-radio-v1.webp', mime:'image/webp'},
  EVENT_FIELD_REPORT:{path:'assets/ui/event-field-report-panel-v2.webp', mime:'image/webp'},
  EVENT_FIELD_REPORT_TALL:{path:'assets/ui/event-field-report-panel-tall-v1.webp', mime:'image/webp'},
  EVENT_RESULT_TICKET:{path:'assets/ui/event-result-ticket-v1.webp', mime:'image/webp'},
  EVENT_LEDGER_BUTTON:{path:'assets/ui/event-ledger-button-v1.webp', mime:'image/webp'},
  EVENT_CHOICE_LEDGER:{path:'assets/ui/event-choice-ledger-slip-v1.webp', mime:'image/webp'}
};
const styles = replace(read('src/01-style.html'), /__UI_([A-Z0-9_]+)__/g, key => {
  const asset=uiAssetPaths[key];
  if(!asset) throw new Error(`알 수 없는 UI 자산: ${key}`);
  return dataUri(asset.path,asset.mime);
}, 'UI');

const portraits = replace(read('src/03b-portraits.js'), /__PORTRAIT_([a-z0-9_]+)__/g,
  key => dataUri(`assets/portraits/${key}.png`, 'image/png'), '주연 초상');
const npc = replace(read('src/03f-npc-portraits.js'), /__NPC_([a-z0-9_]+)__/g,
  key => dataUri(`assets/portraits/${key}.png`, 'image/png'), 'NPC');
const scenes = replace(read('src/03g-scenes.js'), /__SCENE_([A-Z0-9_]+)__/g, key => {
  const isArrival=key.startsWith('ARRIVAL_');
  const relative = introScenes[key] || `assets/scenes/${key.toLowerCase().replaceAll('_', '-')}.${isArrival?'webp':'jpg'}`;
  return dataUri(relative, isArrival?'image/webp':'image/jpeg');
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
  styles.result, ...before.map(read), portraits.result, read('src/03c-icons.js'), read('src/03d-bgm.js'),
  title.result, audio.result, npc.result, upgrades.result, ...after.map(read)
];
const html = chunks.join('\n');
const htmlBytes = Buffer.byteLength(html);
const unresolved = [...new Set(html.match(/__(?:PORTRAIT|NPC|SCENE|UPGRADE|BGM|SFX|VO)_[A-Z0-9_]+__/g) || [])];
if (unresolved.length) throw new Error(`치환되지 않은 자산: ${unresolved.slice(0, 8).join(', ')}`);

const categoryOf = relative => relative.includes('/audio/')?'audio'
  :relative.includes('/scenes/')||relative.includes('/intro/')||relative.includes('/upgrades/')?'scene'
  :relative.includes('/portraits/')?'portrait'
  :relative.includes('/ui/')?'ui':'other';
const assetEntries = [...embeddedAssets.values()].sort((a,b)=>b.encodedBytes-a.encodedBytes);
const categories = assetEntries.reduce((out,item)=>{
  const category=categoryOf(item.path), row=out[category]||(out[category]={files:0,bytes:0,encodedBytes:0});
  row.files++; row.bytes+=item.bytes; row.encodedBytes+=item.encodedBytes;
  return out;
},{});
const report={generatedAt:new Date().toISOString(),html:{bytes:htmlBytes,warnBytes:WARN_BYTES,maxBytes:MAX_BYTES},
  embedded:{files:assetEntries.length,bytes:assetEntries.reduce((sum,item)=>sum+item.bytes,0),categories},
  largest:assetEntries.slice(0,20)};
fs.mkdirSync(path.dirname(reportOutput),{recursive:true});
fs.writeFileSync(reportOutput,`${JSON.stringify(report,null,2)}\n`);
if(htmlBytes>MAX_BYTES) throw new Error(`단일 HTML 용량 초과: ${htmlBytes} / ${MAX_BYTES} bytes`);

try {
  fs.writeFileSync(temporary, html);
  fs.renameSync(temporary, output);
} finally {
  if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
}
console.log(`✅ 서울까지400km.html ${htmlBytes} bytes · 주연 초상 ${portraits.count}·NPC ${npc.count}·장면 ${scenes.count}·업그레이드 ${upgrades.count}·오디오 ${audio.count + title.count}`);
console.log(`📦 내장 자산 ${report.embedded.files}개 · 원본 ${report.embedded.bytes} bytes · base64 ${assetEntries.reduce((sum,item)=>sum+item.encodedBytes,0)} bytes`);
for(const [name,row] of Object.entries(categories))
  console.log(`   ${name.padEnd(8)} ${String(row.files).padStart(3)}개 · ${String(row.encodedBytes).padStart(9)} bytes`);
console.log('📊 용량 상위 20개');
assetEntries.slice(0,20).forEach((item,index)=>console.log(`   ${String(index+1).padStart(2)}. ${String(item.encodedBytes).padStart(8)} · ${item.path}`));
if(htmlBytes>WARN_BYTES) console.warn(`⚠️ HTML 권장 용량 초과: ${htmlBytes} / ${WARN_BYTES} bytes · reports/asset-budget.json 확인`);
