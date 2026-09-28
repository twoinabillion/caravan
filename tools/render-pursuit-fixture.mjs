// Disposable component QA: real built styles/DOM/controller, no game engine or save access.
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const built=read('서울까지400km.html');
const styles=[...built.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(m=>m[0]).join('\n');
const dom=read('src/02-dom.html'),ui=read('src/07-ui.js');
const button=dom.match(/<button id="pursuit-indicator"[\s\S]*?<\/button>/)[0];
const help=dom.match(/<section id="pursuit-help"[\s\S]*?<\/section>/)[0];
const controller=ui.slice(ui.indexOf('  let pursuitUi=null;'),ui.indexOf('  function renderHud(){'));
const notice=dom.match(/<div id="pursuit-notice"[\s\S]*?<\/div>/)[0];
const html=`<!doctype html><html lang="ko" data-journey-layout="scene" data-journey-ui="unified"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>추적 표시 · 실제 소스 분리 검수</title>${styles}
<style>body{overflow:auto}#qa-controls{padding:12px;display:flex;gap:12px;flex-wrap:wrap;color:#eee}#qa-controls select{font:16px sans-serif}#frame{height:728px}#app{height:100%;width:360px}#scr-game #stage{flex:0 0 var(--qa-stage,304px);height:var(--qa-stage,304px);min-height:0;background:#303b40}#qa-road{padding:60px 12px;color:#bcc5c4;font-size:14px}#qa-next{display:block;padding:12px;margin:20px;background:#58684a;border:1px solid #9aab89;border-radius:4px}#qa-status{padding:12px}#qa-overlay{position:absolute;inset:0;z-index:30;padding:20px;background:#192a26;color:#eee}#qa-overlay[hidden]{display:none}</style>
<div id="qa-controls"><b>분리 검수판 · 실제 플레이 아님</b><label>너비 <select id="qa-width"><option>320</option><option selected>360</option><option>480</option></select></label><label>풍경 높이 <select id="qa-height"><option>125</option><option>254</option><option selected>304</option></select></label><label>추적 단계 <select id="qa-risk">${[0,1,2,3,4,5].map(n=>`<option${n===2?' selected':''}>${n}</option>`).join('')}</select></label><button id="qa-reload">검수판 다시 읽기</button></div>
<div id="frame"><div id="app" data-screen="game"><div id="scr-game" class="on"><div id="stage"><p id="qa-road">실제 CSS / 표시 컴포넌트<br>풍경·차량·게임 진행은 이 검수판에서 실행하지 않습니다.</p>${button}</div>${help}<button id="qa-next">다음 화면 열기 · 검수용</button><p id="qa-status">다음 행동 대기</p><section id="qa-overlay" hidden><p>다음 화면 · 표시 설명이 뒤에 남지 않아야 합니다.</p><button id="qa-back">돌아가기</button></section></div></div></div>
<script>const $=s=>document.querySelector(s);const S={pursuit:2};const modalOpen=()=>!$('#qa-overlay').hidden;${controller}
renderPursuitIndicator();
$('#qa-risk').onchange=e=>{S.pursuit=+e.target.value;renderPursuitIndicator();};
$('#qa-width').onchange=e=>{$('#app').style.width=e.target.value+'px';positionPursuitHelp();};
$('#qa-height').onchange=e=>{$('#app').style.setProperty('--qa-stage',e.target.value+'px');positionPursuitHelp();};
$('#qa-next').onclick=()=>{closePursuitHelp();$('#qa-status').textContent='다음 행동 도달';$('#qa-overlay').hidden=false;$('#qa-back').focus();};
$('#qa-back').onclick=()=>{$('#qa-overlay').hidden=true;$('#qa-next').focus();};
$('#qa-reload').onclick=()=>location.reload();</script></html>`;
fs.mkdirSync('artifacts/pursuit-indicator',{recursive:true});
// Replace only fixture scaffolding: source-owned control now lives in the shared strip.
const fixture=html
  .replace('#scr-game #stage{flex:0 0 var(--qa-stage,304px);height:var(--qa-stage,304px);min-height:0;', '#app #scr-game #stage{flex:0 0 var(--qa-stage,304px)!important;height:var(--qa-stage,304px)!important;min-height:0!important;')
  .replace(button+'</div>'+help,'</div>'+help+notice+'<div id="journey-vehicle"><div id="journey-resources"><span><i class="trip-symbol trip-fuel"></i>연료 ∞</span><span><i class="trip-symbol trip-wrench"></i>차체 61%</span><span>안개</span></div>'+button+'</div>')
  .replace('</style>\n<div id="qa-controls">','</style><style>#qa-next{height:44px;flex:none}#qa-status{color:#ddd}#stage .journey-location{display:flex}</style>\n<div id="qa-controls">')
  .replace('<p id="qa-road">','<div class="journey-location"><strong>세종 신도시</strong><span>DAY 3 · 08:52</span></div><p id="qa-road">')
  .replace('<button id="qa-reload">','<label>상태 <select id="qa-mode"><option value="scene">정차</option><option value="driving">주행</option><option value="map">지도</option></select></label><label>글씨 <select id="qa-font"><option value="13">보통</option><option value="18">크게</option></select></label><button id="qa-render">같은 상태 재렌더</button><button id="qa-reload">')
  .replace("$('#qa-reload').onclick=", "$('#qa-render').onclick=renderPursuitIndicator;$('#qa-mode').onchange=e=>{closePursuitHelp();document.documentElement.dataset.journeyLayout=e.target.value==='driving'?'driving':'scene';document.documentElement.dataset.routeMap=e.target.value==='map'?'open':'closed';};$('#qa-font').onchange=e=>{document.documentElement.style.setProperty('--reading-detail-size',e.target.value+'px');positionPursuitHelp();};$('#qa-reload').onclick=");
fs.writeFileSync('artifacts/pursuit-indicator/component.html',fixture);
console.log('artifacts/pursuit-indicator/component.html — isolated, no saves or engine');
