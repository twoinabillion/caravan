// Disposable component QA. Real built CSS and UI functions; NO engine/save access.
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),ui=read('src/07-ui.js');
const section=(a,b)=>ui.slice(ui.indexOf(a),ui.indexOf(b,ui.indexOf(a)));
const styles=[...read('서울까지400km.html').matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(m=>m[0]).join('\n');
const controller=section('  function stayActionModel(','  let stoppedStageFitFrame=');
const wire=section('  function wireJourneyMode(','  function renderPanel(');
const dom=read('src/02-dom.html');
// Pursuit has its own actual-source fixture; its removed stage box is not recreated here.
const risk='';
const modelCode=section('    let localActions=[];','    const localActive=');
const html=`<!doctype html><html lang="ko" data-journey-layout="scene" data-journey-ui="unified" data-journey-mode="local"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>여정 UI · 실제 소스 분리 검수</title>${styles}
<style>body{overflow:auto}#qa-controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px;color:#eee;background:#18251f;font:14px sans-serif}#qa-controls select,#qa-controls button{font:14px sans-serif;padding:5px}#frame{height:var(--qa-height,728px)}#app{height:100%;width:var(--qa-width,360px)}#stage{background:#35414a}#qa-scene{padding:90px 20px;color:#b8c3c1;font:13px/1.6 sans-serif}#qa-overlay{position:absolute;inset:0;z-index:60;background:#18251f;padding:30px}#qa-overlay[hidden]{display:none}#qa-back{padding:15px;border:1px solid #a4ad88}#qa-result{padding:12px}#qa-controls label{white-space:nowrap}</style>
<div id="qa-controls"><b>분리 검수판 · 실제 저장 아님</b><label>너비 <select id="qa-width"><option>320</option><option selected>360</option><option>480</option></select></label><label>높이 <select id="qa-height"><option>568</option><option selected>728</option></select></label><label>상태 <select id="qa-mode"><option value="four">정차 · 네 행동</option><option value="drive">주행</option><option value="five">정착지 · 다섯 행동</option><option value="max">가상 최대 조건</option><option value="blocked">탐색 불가</option><option value="guest">임시 동행</option></select></label><button id="qa-reload">선택 보존 재렌더</button></div>
<div id="frame"><div id="app" data-screen="game"><div id="scr-game" class="on"><div id="stage"><div class="journey-location"><strong id="journey-place">세종 신도시</strong><span id="journey-date">DAY 3 · 08:52</span></div><p id="qa-scene">레이아웃 검수용 풍경 영역<br>날씨·차량 애니메이션은 실행하지 않음</p>${risk}<div id="stage-time">이전 시계 · 보이면 오류</div><div id="road-status">이전 자원 · 보이면 오류</div></div><div id="journey-vehicle"><span>연료 ∞</span><span>차체 61%</span><span>안개</span></div><div id="main"><div id="panel"></div><nav id="dock"><button>길</button><button>목표</button><button>동료</button><button>가방</button><button>메뉴</button></nav></div><section id="qa-overlay" hidden><h2 id="qa-action"></h2><p>기존 게임 동작에 전달되는지 확인하는 대역 화면입니다. 실제 자원은 바꾸지 않습니다.</p><button id="qa-back">돌아가기 · 취소</button></section></div></div></div><p id="qa-result">실행 없음 · 선택은 미리 보기만</p>
<script>
const $=s=>document.querySelector(s),esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
let S={at:'sejong',day:3,min:532.352,van:61,vanMax:100,fatigue:30,flags:{},up:{}},journeyConsoleMode='local',stayActionAt=null,stayActionId=null,routeMapOpen=false;
const D={nodes:{sejong:{name:'세종 신도시'},gongju:{name:'공주 산성'}},recruitQuests:{minji:{name:'민지',guest:{ic:''},hint:'차체를 함께 살핀다.',roadHint:'다음 정차에서 이야기한다.'}},comps:{minji:{name:'민지'}}};
let mode='four',runs=0;
const act=id=>{$('#qa-result').textContent='실행 '+(++runs)+'회 · '+id;$('#qa-action').textContent=stayLabel(id)+' 화면';$('#qa-overlay').hidden=false;$('#qa-back').focus();};
const G={hasPerk:()=>false,mealNeed:()=>1,neighbors:()=>[],exploreStatus:()=>({ok:mode!=='blocked',mins:120,fatigue:0,tries:0,reason:'밤에는 주변을 탐색할 수 없다. 야영한 뒤 다시 확인하자.'}),isNight:()=>mode==='blocked',driverLv:()=>2,isInjured:()=>false,durationLabel:()=> '2시간',hasResource:()=>mode!=='blocked',isInfiniteResourceMode:()=>mode!=='max',explore:()=>act('explore'),fieldRepair:()=>act('repair'),fixRadio:()=>{act('radio');return false;},openRescue:()=>act('walkfuel'),openRecruitStep:()=>act('recruitstep')};
const showCampHub=()=>act('camp'),showStl=()=>act('stl'),showCraft=()=>act('craft'),closeModal=()=>{},renderAll=()=>{},faceOf=()=>'',rememberJourneyView=()=>{},resetStoppedStageFit=()=>{},scheduleStoppedStageFit=()=>{},wireRouteConsole=()=>{};
${controller}${wire}
function render(){
const p=$('#panel'),drive=mode==='drive';document.documentElement.dataset.journeyLayout=drive?'driving':'scene';document.documentElement.dataset.journeyMode=journeyConsoleMode;
$('#journey-place').textContent=drive?'세종 → 공주':'세종 신도시';
if(drive){p.innerHTML='<p>기존 주행 목적지 미리보기 유지<br>공주 산성 · 16km</p>';return;}
const n={name:'세종 신도시',stl:mode==='five'||mode==='max'?'jeonju':null};S.flags={armed_age:mode==='max'};S.fuel=mode==='max'?0:42;
S.recruitQ=mode==='max'?{id:'minji',stage:'ready'}:mode==='guest'?{id:'minji',stage:'road',target:'gongju'}:null;
${modelCode}
p.innerHTML='<section class="journey-deck">'+journeyModeTabsHtml(journeyConsoleMode)+'<div class="journey-mode-panel" id="journey-mode-local" '+(journeyConsoleMode==='local'?'':'hidden')+'>'+stayConsoleHtml(localActions,recruitStatus)+'</div><div class="journey-mode-panel" id="journey-mode-route" '+(journeyConsoleMode==='route'?'':'hidden')+'><p>목적지 패널 · 기존 기능 유지</p></div></section>';
wireStayConsole(p,localActions,n);wireJourneyMode(p,[]);
}
$('#qa-mode').onchange=e=>{mode=e.target.value;render();};$('#qa-width').onchange=e=>document.documentElement.style.setProperty('--qa-width',e.target.value+'px');$('#qa-height').onchange=e=>document.documentElement.style.setProperty('--qa-height',e.target.value+'px');$('#qa-reload').onclick=render;$('#qa-back').onclick=()=>{$('#qa-overlay').hidden=true;$('#stay-detail [data-a]').focus();};render();
</script></html>`;
fs.mkdirSync('artifacts/journey-unified',{recursive:true});fs.writeFileSync('artifacts/journey-unified/component.html',html);
console.log('artifacts/journey-unified/component.html — actual CSS/UI component, mocked engine, no save access');
