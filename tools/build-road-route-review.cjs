// Mechanical, script-free Studio review export. Does not build/apply gameplay.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-routes/manifest.json'),'utf8'));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const generated=manifest.routes.filter(r=>r.master).length;
const junctions=[...new Set(manifest.routes.flatMap(r=>[r.from,r.to]))].map(node=>{
 const neighbours=manifest.routes.filter(r=>r.master&&(r.from===node||r.to===node));
 if(neighbours.length<2)return '';
 const title=escape(neighbours[0].endpoints.find(e=>e.id===node)?.name||node);
 const shots=neighbours.map(r=>{
  const start=r.from===node;
  return `<figure><figcaption>${escape(r.endpoints.map(e=>e.name).join(' ↔ '))}</figcaption><div class="junction-crop${start?' at-start':' at-end'}"><img src="../../assets/ui/road-routes/${escape(r.file)}" width="1024" height="576" alt="${title}: ${escape(r.id)}의 장소 끝부분" loading="lazy"></div></figure>`;
 }).join('');
 return `<details class="junction-review"><summary>${title} · ${neighbours.length}개 연결 구간</summary><p>같은 장소의 끝부분 비교입니다. 다른 구간 사이의 연속 주행이나 승인 증거가 아닙니다. 건물·산·시점이 바뀌면 공통 기준 그림으로 다시 맞춰야 합니다.</p><div class="junction-grid">${shots}</div></details>`;
}).join('\n');
const sections=[...manifest.routes].sort((a,b)=>(b.id==='daegu--miryang')-(a.id==='daegu--miryang')).map(r=>{
 const id=escape(r.id),names=r.endpoints.map(e=>escape(e.name)),image=`../../assets/ui/road-routes/${escape(r.file)}`;
 const status=r.master?`후보 생성 · 알파/규격 ${r.acceptance.geometry?'통과':'보완 필요'} · 시각/연속 출발 검수 미완료`:'제작 예정 · 아직 그림 없음';
 const controls=r.master?`<fieldset class="review-controls"><legend>움직임</legend><label><input class="review-play" type="checkbox">재생</label><label><input class="review-pause" type="checkbox">멈춤</label><label><input class="review-reverse" type="checkbox">반대 방향</label></fieldset>
 <fieldset class="review-positions"><legend>정지 위치</legend><label><input class="review-start" type="radio" name="p-${id}" checked>출발</label><label><input class="review-middle" type="radio" name="p-${id}">중간</label><label><input class="review-end" type="radio" name="p-${id}">도착</label></fieldset>
 <div class="scene" role="img" aria-label="${names.join('와 ')} 사이의 지형. 실제 저장 주행이 아닌 독립 예시."><div class="sky"></div><div class="travel-strip animated"><img class="terrain" src="${image}" width="1024" height="576" alt="" loading="lazy"><img class="terrain" src="${image}" width="1024" height="576" alt="" loading="lazy"></div><div class="road"><div class="road-marks animated"></div></div><img class="vehicle" src="../../assets/ui/journey-dalguji-base-v1.webp" width="1024" height="608" alt="" loading="lazy"></div>
 <div class="overview"><h2>지형 전체</h2><div class="panorama"><img src="${image}" width="1024" height="576" alt="${names.join(' → ')} 연결 지형 후보" loading="lazy"></div></div>`:'<p class="pending">다른 장소의 풍경을 대신 넣지 않습니다.</p>';
 return `<details class="route-review" name="corridor"${r.id==='daegu--miryang'?' open':''}><summary>${names.join(' ↔ ')} <small>${r.km}km</small></summary><p class="review-status">${status}</p>${controls}<p class="review-description">${names[0]}에서 ${names[1]}까지. 실측 지도가 아닌 게임용 연결 구도.</p></details>`;
}).join('\n');
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'self'; form-action 'none'; base-uri 'none'"><title>전 구간 · 연결 풍경 검수</title><link rel="stylesheet" href="scenery-route.css"><link rel="stylesheet" href="scenery-routes.css"></head><body><main class="draft"><header class="intro"><p class="eyebrow">58개 장소 · 78개 구간 · 왕복 156방향</p><h1>한 구간씩, 같은 길을</h1><p>${generated}/78개 후보 생성. 구간을 펼쳐 재생·멈춤·양방향을 비교하세요. 게임과 저장에는 미적용입니다.</p></header><p class="help">48초 독립 CSS 예시. 재생을 껐다 켜면 처음부터. 모션 감소에서는 정지 위치를 비교합니다.</p>${sections}<section class="junctions"><h2>도착한 장소, 다음 출발에서도 같은가</h2><p>독립 구간 후보를 한 장소 기준으로 모았습니다. 같은 도시가 바뀌어 보이는 것을 확인하는 검수 창이며, 완성된 이음새가 아닙니다.</p>${junctions}</section><details class="notes" open><summary>아직 완료로 처리하지 않은 것</summary><p>그림 생성은 승인과 다릅니다. 화풍·양쪽 장소·바닥 알파·360/480px 크롭·왕복 움직임을 확인해야 합니다.</p><p>서로 다른 구간의 같은 도시 끝부분은 별도 검수 대상입니다. 도착→다음 출발의 그림 교체나 로딩 문제를 이 초안 하나로 통과 처리하지 않습니다. 실제 개조·동료·날씨·사건 정차·재개·새로고침은 게임 적용 후 검증해야 합니다.</p><p>실제 카메라용 거리 함수는78구간 양방향을 대상으로 별도 테스트합니다. 이 초안은 실제 저장·게임 시간·완성된 렌더러를 재현하지 않습니다.</p></details><footer>전 구간 제작/검수 목록 · 현재 게임과 저장 미변경</footer></main></body></html>\n`;
fs.writeFileSync(path.join(root,'tools/design-drafts/scenery-routes.html'),html);
if(require.main===module)console.log(JSON.stringify({corridors:manifest.routes.length,generated,geometryPassed:manifest.routes.filter(r=>r.master&&r.acceptance.geometry).length,scriptFree:true}));
