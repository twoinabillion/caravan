// Disposable real-runtime QA in an opaque iframe. No live URL, save or network.
import fs from 'node:fs';
const root='artifacts/minji-first-journey';
fs.mkdirSync(root,{recursive:true});
const setup=`UI.boot();
document.addEventListener('DOMContentLoaded',async()=>{
  G.newGame('story','상혁'); S.at='miryang';S.day=3;S.min=540;
  S._storyQueue=[];S.flags.onboarding_event_guide=true;S.flags.armed_age=true;
  const mode=new URLSearchParams(location.search).get('scene')||'request';
  const method=new URLSearchParams(location.search).get('method')||'pulley';
  const event=id=>D.events.find(row=>row.id===id);
  if(mode!=='request'){
    G.startRecruitQuest('minji');
    if(!['crew','notebook'].includes(mode)){
      S.at='ulsan';S.up.winch=1;S.recruitQ.stage='road';S.recruitQ.choice=method;S.recruitQ.roadDay=3;S.recruitQ.roadFrom='ulsan';
    }
  }
  await UI.restoreQaView({screen:'game',journey:{mode:'local'}});
  if(mode==='request') UI.showEvent(event('rq_minji_request'));
  if(mode==='crew') document.querySelector('#dk-crew').click();
  if(mode==='notebook'){QuestLedgerUI.pendingUpdateKind='side';QuestLedgerUI.open();}
  if(mode==='task'){S.recruitQ.stage='task';UI.showEvent(event('rq_minji_task'));}
  if(mode==='camp'){S.min=1200;G.prepareCamp('talk','minji');UI.showEvent(G.campConversationEvent());}
  if(mode==='join'){S.day=4;S.recruitQ.stage='ready';UI.showEvent(event('rq_minji_join'));}
  if(mode==='road'){
    S.driving={from:'ulsan',to:'gyeongju',km:38,gone:0,road:'normal',slots:[],snapshot:{},speed:0};S.at=null;
    G.prepareRecruitGuest(S.driving);G.prepareRecruitMemory(S.driving);UI.renderAll();
  }
  G.save();UI.clearToasts();
  document.documentElement.classList.toggle('ui-large-text',new URLSearchParams(location.search).has('large'));
});`;
let html=fs.readFileSync('서울까지400km.html','utf8');
if(!html.includes('UI.boot();')) throw Error('boot hook missing');
html=html.replace('UI.boot();',setup);
const isolation=`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; media-src data:; connect-src 'none'"><script>
for(const name of ['localStorage','sessionStorage']){const map=new Map();Object.defineProperty(window,name,{value:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),clear:()=>map.clear()}});}
window.addEventListener('error',e=>{const p=document.createElement('pre');p.textContent='QA ERROR: '+e.message;document.body.appendChild(p);});
</script>`;
html=html.replace('<meta charset="utf-8">','<meta charset="utf-8">'+isolation);
if(!html.includes(isolation))throw Error('storage isolation hook missing');
fs.writeFileSync(root+'/runtime.html',html);
fs.writeFileSync(root+'/index.html',`<!doctype html><html lang="ko"><meta charset="utf-8"><title>민지 · 실제 코드 분리 검수</title>
<style>body{margin:0;background:#171e1b;color:#e2dfd1;font:15px/1.5 sans-serif}header{padding:12px;display:flex;gap:14px;flex-wrap:wrap}select,button{font:inherit;padding:5px}iframe{display:block;margin:0 auto;border:1px solid #687167;width:360px;height:728px}label{white-space:nowrap}</style>
<header><b>실제 코드 · 분리 검수 / 사용자 저장과 무관</b><label>장면 <select id="scene"><option value="request">수락·거절</option><option value="crew">임시 동행 화면</option><option value="notebook">공책</option><option value="task">현장 작업</option><option value="road">첫 주행</option><option value="camp">첫 야영</option><option value="join">합류·보류</option></select></label><label>방법 <select id="method"><option value="pulley">도르래</option><option value="winch">윈치</option><option value="shield">차량 방패</option></select></label><label>폭 <select id="width"><option>320</option><option selected>360</option><option>480</option></select></label><label>높이 <select id="height"><option>568</option><option selected>728</option><option>844</option></select></label><label><input id="large" type="checkbox">큰 글씨</label><button id="reset">샘플 장면 다시 열기</button></header>
<iframe title="독립 런타임" sandbox="allow-scripts" src="runtime.html?scene=request"></iframe>
<script>const $=id=>document.getElementById(id),f=document.querySelector('iframe');function open(){f.style.width=$('width').value+'px';f.style.height=$('height').value+'px';f.src='runtime.html?scene='+$('scene').value+'&method='+$('method').value+($('large').checked?'&large=1':'');}document.querySelectorAll('select,input').forEach(e=>e.onchange=open);$('reset').onclick=open;</script></html>`);
console.log(root+'/index.html');
