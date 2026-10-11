// Script-free Studio study. All incident routes reference the same place asset.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {measure,seamPlan}=require('./road-seam-plan.cjs');
const measurements=new Map();
(async()=>{
const c=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-routes/cities.json'),'utf8'));
const routes=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/road-routes/manifest.json'),'utf8')).routes;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const city=id=>c.cities.find(n=>n.id===id);
const img=(id,cls)=>`<img class="${cls}" src="../../${escape(city(id).file)}" width="1024" height="576" alt="" loading="lazy">`;
for(const file of [...c.cities.map(n=>n.file),...routes.map(r=>'assets/ui/road-routes/'+r.file)]) measurements.set(file,await measure(path.join(root,file)));
function world(r,reverse){
 const from=reverse?r.to:r.from,to=reverse?r.from:r.to;
 const mid=`../../assets/ui/road-routes/${escape(r.file)}`;
 const connector=(id,edge,cls)=>{
  const plan=seamPlan(measurements.get(city(id).file),measurements.get('assets/ui/road-routes/'+r.file),{edge,reverse});
  const key=r.id+'-'+(reverse?'r':'f')+'-'+edge;
  // One unwarped tail, subpixel-width strips only where the ridge changes.
  // Two source pixels overlap to avoid alpha gutters at fractional CSS scale.
  const tail=plan.strips.findIndex(s=>s.x>1024*.58);
  const pieces=plan.strips.slice(0,tail);
  pieces.push({...plan.strips[tail],width:1024-plan.strips[tail].x});
  const strips=pieces.map(s=>`<svg x="${s.x}" width="${s.width+2}" height="1728" viewBox="${s.x} 0 ${s.width+2} 1728" overflow="hidden"><use href="#${key}" transform="translate(0 ${(1728*(1-s.scale)).toFixed(3)}) scale(1 ${s.scale})"/></svg>`).join('');
  return `<svg class="connector ${cls}" viewBox="0 0 1024 1728" aria-hidden="true"><defs><image id="${key}" href="${mid}" x="-1024" width="3072" height="1728"${reverse?' transform="translate(1024 0) scale(-1 1)"':''}/></defs>${strips}</svg>`;
 };
 return `<div class="city-world"><div class="legacy-connector first${reverse?' mirrored':''}"><img src="${mid}" alt=""></div><div class="legacy-connector second${reverse?'':' mirrored'}"><img src="${mid}" alt=""></div>${connector(from,'right','first')}${connector(to,'left','second mirrored')}${img(from,'city from')}${img(from,'city from-extension')}${img(to,'city to')}${img(to,'city to-extension')}</div>`;
}
function scene(r,reverse){return `<div class="scene" role="img" aria-label="${escape(city(reverse?r.to:r.from).name)}에서 ${escape(city(reverse?r.from:r.to).name)}까지의 독립 주행 예시"><div class="sky"></div>${world(r,reverse)}<div class="road"><div class="road-marks animated"></div></div><img class="vehicle" src="../../assets/ui/journey-dalguji-base-v1.webp" width="1024" height="608" alt="" loading="lazy"></div>`;}
const sections=[...routes].sort((a,b)=>(b.id==='daegu--miryang')-(a.id==='daegu--miryang')).map(r=>`<details class="city-route" name="corridor"${r.id==='daegu--miryang'?' open':''}><summary>${escape(city(r.from).name)} ↔ ${escape(city(r.to).name)} · ${r.km}km</summary><fieldset class="city-controls"><legend>독립 예시 조작</legend><label><input class="play" type="checkbox">재생</label><label><input class="pause" type="checkbox">멈춤</label><label><input class="reverse" type="checkbox">왕복</label><label><input class="legacy" type="checkbox">이전 접합</label></fieldset><fieldset class="city-positions"><legend>정지 위치</legend>${[['start','출발'],['join','첫 이음새'],['middle','중간'],['last-join','마지막 이음새'],['end','도착']].map(([k,t])=>`<label><input class="${k}" type="radio" name="${escape(r.id)}"${k==='start'?' checked':''}>${t}</label>`).join('')}</fieldset><div class="forward-view">${scene(r,false)}</div><div class="reverse-view">${scene(r,true)}</div><p class="caption">장소 그림은 그대로 두고, 경계 산 높이를 맞춘 뒤 짧은 재질 접합만 사용합니다. 이전 접합을 켜서 중첩을 비교하세요. 보정에 따른 지형 늘어짐·색 차이는 아직 검수 중입니다.</p></details>`).join('\n');
const nodes=c.cities.map(n=>`<details class="city-junction"><summary>${escape(n.name)} · ${c.routes.filter(r=>r.from===n.id||r.to===n.id).length}개 연결</summary><div class="anchor-view"><div class="sky"></div>${img(n.id,'anchor')}</div><p class="caption">이곳의 모든 도착·출발은 이 그림과 같은 방향·크기를 사용합니다. 다른 길을 골라도 도시가 바뀌지 않습니다.</p></details>`).join('\n');
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'self'; form-action 'none'; base-uri 'none'"><title>58개 장소 · 정본 공유 이음새</title><link rel="stylesheet" href="scenery-route.css"><link rel="stylesheet" href="scenery-cities.css"></head><body><main class="draft"><header class="intro"><p class="eyebrow">58개 장소 · 78개 길 · 양방향156개</p><h1>도시는 하나, 길은 여러 갈래</h1><p>모든 장소에 정본을 지정했습니다. 도착한 도시를 다음 출발에서도 그대로 봅니다. 이전 구간 그림의 도시 부분은 사용하지 않습니다.</p></header><p class="help">48초 독립 예시. 양쪽 이음새·왕복·이전 접합을 비교하세요. 현재 플레이·저장·게임 UI에는 미적용입니다.</p>${sections}<section class="cities"><h2>전체 장소 정본</h2>${nodes}</section><details class="notes" open><summary>검수와 적용은 별도</summary><p>재사용한 기존 장소 그림58장과 구간 그림78장의 가운데 부분으로 만든 새 조립 초안입니다. 장소 정합성은 구조적으로 고정되지만, 산·지면 높이와 좁은 경계의 겹침까지 자연스럽다는 뜻은 아닙니다.</p><p>현재 플레이의 사건 정차·재개·날씨·개조·동료는 이 독립 예시로 검수하지 않습니다. 디자인 승인과 실제 플레이 검수 전에는 활성화하지 않습니다.</p></details><footer>정본 공유 v3 · 접합 정교화 후보 · 게임 및 저장 미변경</footer></main></body></html>\n`;
fs.writeFileSync(path.join(root,'tools/design-drafts/scenery-cities.html'),html);
console.log(JSON.stringify({places:c.cities.length,corridors:routes.length,directions:routes.length*2,scriptFree:true}));
})().catch(error=>{console.error(error);process.exitCode=1;});
