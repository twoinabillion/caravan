#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const assert=(condition,message)=>{ if(!condition) throw new Error(message); };
const pngSize=relative=>{
  const data=fs.readFileSync(path.join(root,relative));
  assert(data.subarray(1,4).toString()==='PNG',`${relative}: PNG가 아님`);
  return [data.readUInt32BE(16),data.readUInt32BE(20)];
};

const manifest=JSON.parse(read('manifest.webmanifest'));
assert(manifest.id==='./','manifest id가 앱 범위와 일치해야 함');
assert(manifest.start_url==='./서울까지400km.html','manifest start_url 누락');
assert(manifest.scope==='./','manifest scope 누락');
assert(['standalone','fullscreen'].includes(manifest.display),'설치형 display 누락');
assert(Array.isArray(manifest.display_override)&&manifest.display_override.includes('fullscreen'),'fullscreen 앱 표시 누락');
assert(manifest.orientation==='portrait-primary','세로 게임 방향 잠금 누락');

for(const size of [192,512]){
  const icon=manifest.icons.find(item=>item.sizes===`${size}x${size}`);
  assert(icon,`${size}px 앱 아이콘 manifest 항목 누락`);
  const dimensions=pngSize(icon.src);
  assert(dimensions[0]===size&&dimensions[1]===size,`${icon.src}: 실제 크기 ${dimensions.join('x')}`);
}

const html=read('서울까지400km.html');
assert(html.includes('<link rel="manifest" href="manifest.webmanifest">'),'게임 HTML manifest 링크 누락');
assert(html.includes('apple-mobile-web-app-capable'),'iPhone 전체 화면 meta 누락');
assert(html.includes('id="bt-install"'),'게임 내 앱 설치 버튼 누락');
assert(html.includes("register('./service-worker.js',{updateViaCache:'none'})"),'서비스 워커 갱신 등록 누락');

const worker=read('service-worker.js');
assert(worker.includes("cache:'no-store'"),'온라인 최신 문서 우선 정책 누락');
assert(worker.includes("caches.match('./서울까지400km.html')"),'오프라인 게임 fallback 누락');
for(const item of ['manifest.webmanifest','app-icon-192.png','app-icon-512.png'])
  assert(worker.includes(item),`서비스 워커 셸 누락: ${item}`);

const pages=read('.github/workflows/pages.yml');
for(const item of ['manifest.webmanifest','service-worker.js','app-icon-192.png','app-icon-512.png'])
  assert(pages.includes(item),`GitHub Pages 배포 누락: ${item}`);

console.log('✅ PWA 설치 셸 · 192/512 아이콘 · 전체 화면 · 온라인 최신/오프라인 fallback 확인');
