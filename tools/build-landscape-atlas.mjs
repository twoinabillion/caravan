import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sources, groups, places, routeFlows, newRoutes, featured } from './landscape-atlas-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root,p), 'utf8'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const write = (p,s) => {fs.mkdirSync(path.dirname(path.join(root,p)), {recursive:true});fs.writeFileSync(path.join(root,p), s);};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const routes = read('assets/ui/road-routes/manifest.json').routes;
const jobs = read('tools/landscape-atlas-prompts.json').jobs;
const receipts = read('tools/landscape-atlas-generation.json');
if(routes.length !== 78 || Object.keys(places).length !== 58) throw Error('Unexpected graph size; update authored coverage');
for(const r of routes) if(!routeFlows[r.id] || !places[r.from] || !places[r.to]) throw Error('Missing brief: '+r.id);
const names = Object.fromEntries(routes.flatMap(r=>r.endpoints.map(p=>[p.id,p.name])));
const size = p => execFileSync('magick', ['identify','-format','%w %h',path.join(root,p)], {encoding:'utf8'}).trim().split(' ').map(Number);
const head = (title,css) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'self'; form-action 'none'; base-uri 'none'"><title>${esc(title)}</title><link rel="stylesheet" href="${css}"></head><body>`;
const foot = '</body></html>\n';
const catalogue = 'tools/design-drafts/landscape-atlas.html';
const pageRoot = 'tools/design-drafts/landscape-atlas';
const deliveryRoot = 'assets/ui/road-studies/atlas-v1';
const records = [];
const sourceList = ids => `<ul>${[...new Set(ids)].map(k=>`<li><a href="${esc(sources[k].url)}" target="_blank" rel="noreferrer">${esc(sources[k].title)}</a><p>${esc(sources[k].supports)}</p></li>`).join('')}</ul>`;
const widths = `<details class="atlas-width"><summary>비교 화면 폭 · 기본 360px</summary><fieldset><legend>초안 너비</legend>${[320,360,480].map(w=>`<label><input id="size-${w}" name="size" type="radio"${w===360?' checked':''}>${w}px</label>`).join('')}</fieldset></details>`;

for(const r of routes) {
  const fresh = newRoutes.includes(r.id), seed = r.id === 'busan--yangsan';
  const master = fresh ? `assets/masters/landscape-atlas-v1/${r.id}.png` : seed ? 'assets/masters/busan-yangsan-continuity-v1/master.png' : r.master;
  const delivery = `${deliveryRoot}/${r.id}.webp`;
  const before = size(master);
  if(before[0]<2160 || before[1]<720) throw Error('Refusing upscale: '+master);
  fs.mkdirSync(path.join(root,deliveryRoot), {recursive:true});
  // Uniform scaling only; two old 2170x725 masters lose <3 vertical pixels.
  execFileSync('magick',[path.join(root,master),'-resize','2160x720^','-background','none','-gravity','center','-extent','2160x720','-colorspace','sRGB','-quality','90',path.join(root,delivery)]);
  const status = fresh ? 'new' : seed ? 'seed' : 'reused';
  const label = fresh ? '새 풍경 후보' : seed ? '부산 기준 후보' : '기존 큰 원본 재구성';
  const ids = [...new Set([...places[r.from].sources,...places[r.to].sources])];
  const remaining = fresh
    ? '새 원본의 색감·지형 구성 확인. 원본 경계의 색 번짐과 반투명 지면, 실제 날씨 합성·도시 정본 접합은 추가 검수 필요.'
    : seed ? '기존 부산 기준 초안 재사용. 도시 정본과의 출발·도착 접합은 아직 미구현.'
    : '기존 그림 전체를 재구성한 비교본. 아래 새 지형 방향에 맞게 다시 그린 그림은 아니며, 세부 고증·색감·끝점은 재검토 대상.';
  const record = {
    id:r.id,from:r.from,to:r.to,km:r.km,group:places[r.from].group,
    status, label, flow:routeFlows[r.id], geographySources:ids, master, masterSize:before,
    masterSha256:hash(master), delivery, deliverySize:size(delivery), sha256:hash(delivery),
    normalization:'Uniform proportional resize + center extent 2160x720. Alpha retained. No sharpening, column warping or upscaling.',
    provenance:fresh ? {...receipts[r.id],promptFile:'tools/landscape-atlas-prompts.json',promptId:r.id,references:jobs.find(j=>j.id===r.id).references}
      : seed ? {receipt:'assets/masters/busan-yangsan-continuity-v1/provenance.json'}
      : {receipt:'assets/ui/road-routes/manifest.json',routeId:r.id,prompt:r.provenance?.prompt??null,promptRecord:r.provenance?.promptRecord},
    checks:{geometry:true,sourcePreserved:true,contactSheetReviewed:true,productionEndpointContinuity:false,gameplayCrop:false,weather:false,upgrades:false},
    remaining
  };
  records.push(record);
  const page = `${pageRoot}/${r.id}.html`, title = `${names[r.from]} → ${names[r.to]}`;
  const sourceImg = `../../../${delivery}`;
  const html = head(title+' · 풍경 초안','../landscape-atlas.css')+`
<main class="landscape-study atlas-route" id="top">
  ${widths}
  <header class="intro"><a class="atlas-back" href="../landscape-atlas.html#${r.id}">‹ 전체 78길</a><p class="status">${label} · 게임 미적용</p><h1>${esc(title)}</h1><p>같은 풍경 안에서 이동 · 게임상 ${r.km}km</p></header>
  <fieldset class="positions"><legend>구간 선택</legend>${[['auto','자동 60초'],['start','출발'],['middle','중간'],['end','도착 쪽']].map(([v,t])=>`<label><input type="radio" name="position" value="${v}"${v==='auto'?' checked':''}><span>${t}</span></label>`).join('')}</fieldset>
  <div class="atlas-switches"><label><input id="pause" type="checkbox">일시정지</label><label><input id="reverse" type="checkbox">역방향</label><a href="${r.id}.html">처음부터</a></div>
  <figure class="journey"><div class="scenery" role="img" aria-label="${esc(title+'의 독립 풍경 후보. '+routeFlows[r.id])}"><div class="sky"></div><img class="terrain animated" src="${sourceImg}" alt=""><div class="road"></div><div class="posts animated"></div><div class="edge-line"></div><div class="road-marks animated"></div><img class="dalguji" src="../../../assets/ui/journey-dalguji-base-v1.webp" alt=""><div class="scene-label"><span class="atlas-forward">${esc(names[r.from])}</span><span class="atlas-backward">${esc(names[r.to])}</span><span>풍경·속도 검토용</span></div></div><div class="progress" aria-hidden="true"><span class="animated"></span></div><figcaption>하나의 긴 원경 · 도로는 별도 속도 · 60초 뒤 정지<br>역방향은 그림을 뒤집지 않고 반대쪽부터 봅니다.</figcaption></figure>
  <section class="explanation"><h2>이 길의 흐름</h2><p>${esc(routeFlows[r.id])}</p><p class="reduced-note">동작 줄이기 설정이 켜져 있습니다. 구간 선택으로 비교하세요.</p>
  <details><summary>두 장소의 지형 기준</summary><p><b>${esc(names[r.from])}</b> — ${esc(places[r.from].terrain)}${places[r.from].fictional?' (가상 장소)':''}</p><p><b>${esc(names[r.to])}</b> — ${esc(places[r.to].terrain)}${places[r.to].fictional?' (가상 장소)':''}</p><p>실제 지형을 참고한 미술적 압축입니다. 실측 도로·조망 방향·건물 위치를 그대로 재현한 것은 아닙니다. 거리는 기존 게임 값이며 변경하지 않았습니다.</p>${sourceList(ids)}</details>
  <details><summary>원본 전체와 검수 상태</summary><figure><img loading="lazy" src="${sourceImg}" alt="${esc(title)} 전체 파노라마"><figcaption>${label} · ${before.join('×')} 원본 → 2160×720 · 한 화면 약1080px</figcaption></figure><p>${esc(remaining)}</p><p>그림의 지형·건물은 한 레이어입니다. 원경과 건물 각각의 다층 시차, 사건·제동·날씨·개조·저장은 이 CSS 비교에 연결하지 않았습니다. 기존 도시 정본은 보존했습니다.</p><p><a href="../../../${master}" target="_blank" rel="noreferrer">보존한 큰 원본</a> · <a href="manifest.json" target="_blank" rel="noreferrer">출처·생성 기록</a></p></details>
  <nav class="atlas-next"><a href="../landscape-atlas.html#${r.id}">전체 목록으로 돌아가기</a><a href="${routes[(routes.indexOf(r)+1)%routes.length].id}.html">다음 길 보기 →</a></nav></section>
</main>`+foot;
  write(page,html);
}

write(`${pageRoot}/manifest.json`,JSON.stringify({version:1,createdAt:'2026-10-15',status:'independent-design-study-not-approved-for-game',geography:'Sources support regional landform, not exact route/landmark reconstruction. Existing art has not retroactively been generated with new briefs.',sources,places,routes:records},null,2)+'\n');
const card = r=>`<article class="atlas-card" id="${r.id}"><a href="landscape-atlas/${r.id}.html"><img loading="lazy" width="2160" height="720" src="../../${r.delivery}" alt=""><span class="atlas-kind">${r.label}</span><h3>${esc(names[r.from])} → ${esc(names[r.to])}</h3><p>${esc(r.flow)}</p><span class="atlas-open">풍경 재생 →</span></a></article>`;
const index = head('전체 78길 · 한 풍경 안에서','landscape-atlas.css')+`
<main class="atlas-index">${widths}<header class="intro"><p class="status">전체 확장 초안 · 실제 게임 미적용</p><h1>길마다 다르게,<br>한 풍경 안에서.</h1><p>58개 장소 · 78개 길<br>새 후보 5개 + 부산 기준 후보 + 기존 큰 원본 72개</p></header>
<section class="atlas-lead"><p>마음에 든 부산의 색감과 느린 원경을 전 구간 비교에 확장했습니다. 지역의 개성은 남기고, 세 장의 그림이 바뀌는 대신 한 장 안을 이동합니다.</p><p class="atlas-caution">전체를 새로 그리거나 실제 지형으로 검증 완료한 상태는 아닙니다. 기존 원본 72개는 새 지형 방향과 대조할 비교본입니다. 게임 반영은 초안 검토 뒤 별도로 진행합니다.</p></section>
<section class="atlas-section"><h2>먼저 비교할 여섯 길</h2>${featured.map(id=>card(records.find(r=>r.id===id))).join('')}</section>
<section class="atlas-section"><h2>전체 78길</h2><p>원본의 좌→우 제작 방향으로 표기했습니다. 각 길에서 역방향도 볼 수 있습니다.</p>${Object.entries(groups).map(([group,label])=>`<details class="atlas-region"><summary>${label} · ${records.filter(r=>r.group===group).length}길</summary>${records.filter(r=>r.group===group).map(r=>card({...r,id:r.id})).join('')}</details>`).join('')}</section>
<section class="atlas-section"><details><summary>58개 장소 · 지형 방향</summary>${Object.entries(groups).map(([group,label])=>`<h3>${label}</h3><dl>${Object.entries(places).filter(([,p])=>p.group===group).map(([id,p])=>`<dt>${esc(names[id])}${p.fictional?' · 가상 장소':''}</dt><dd>${esc(p.terrain)}</dd>`).join('')}</dl>`).join('')}</details>
<details><summary>실제 기반의 범위와 남은 작업</summary><p>공식 지형·수계 자료는 큰 지역 성격을 잡는 데 사용했습니다. 개별 도로·카메라 방향·폐허 건물은 게임을 위한 추론입니다. 가상 장소와 게임 거리도 현실 정보로 둔갑시키지 않았습니다.</p><p>생성 이미지와 원본 비교는 미술 검수이지 실제 게임 적용 검수가 아닙니다. 같은 도시의 도착→정차→다음 출발, 역방향·재접속·사건 제동·날씨·개조 합성은 승인 후 구현·검수해야 합니다.</p>${sourceList(Object.keys(sources))}<p>자료 확인: 2026-10-15. 새5장: builtin image_gen.imagegen, 정본4장 + 부산 후보 참조. 프롬프트·원본·출처 보존.</p><p><a href="landscape-atlas/manifest.json" target="_blank" rel="noreferrer">전체 제작·출처 기록</a></p></details></section></main>`+foot;
// Featured cards use the sole anchors; repeated regional cards need unique IDs.
write(catalogue,index.replace(/<article class="atlas-card" id="([^"]+)">/g, (()=>{const used=new Set();return (m,id)=>{if(used.has(id))return '<article class="atlas-card">';used.add(id);return m;};})()));
console.log(JSON.stringify({routes:records.length,places:Object.keys(places).length,newMasters:newRoutes.length,reused:records.filter(r=>r.status==='reused').length,deliveryBytes:records.reduce((s,r)=>s+fs.statSync(path.join(root,r.delivery)).size,0)}));
