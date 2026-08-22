import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const shots=path.join(root,'audits','design-consultation-2026-08-22','screenshots');
const output=path.join(root,'design-consultation-all-screens.html');

const screens=[
  ['01-title.jpg','게임 시작','타이틀 화면은 세계관의 첫인상과 새 여정 진입점을 함께 담당한다. 사용자는 여기서 분위기와 현재 에피소드를 이해하고 새 게임 또는 미리보기를 선택한다. 컨설팅에서는 제목의 주목도, 시작 버튼의 우선순위, 배경 장면과 정보 패널의 균형을 봐 달라.'],
  ['02-departure-setup.jpg','출발 설정','초기 자원 구성을 고르는 화면이다. 각 선택이 난이도와 플레이 방식에 어떤 차이를 만드는지 즉시 비교할 수 있어야 한다. 카드 간 차이, 선택 상태, 최종 시작 버튼의 명확성을 평가해 달라.'],
  ['03-intro-dialogue.jpg','프롤로그 대화','게임의 세계관과 가족사를 종이 원고 위 대화로 전달한다. 여러 화자의 순서와 감정이 자연스럽게 읽히면서도 장면 이미지와 금속 장식에 가리지 않아야 한다. 화자 구분, 읽기 폭, 세로 리듬을 중점적으로 봐 달라.'],
  ['04-main-mission-brief.jpg','첫 주 임무 안내','프롤로그 직후 플레이 이유와 당장 해야 할 일을 설명하는 온보딩 화면이다. 사용자가 목표, 이유, 첫 행동, 성공 결과를 한 번에 이해하는지가 핵심이다. 설명량과 행동 유도의 균형을 평가해 달라.'],
  ['05-objective-ledger.jpg','목표 장부','주 임무와 선택 임무의 진행 상황을 관리한다. 사용자는 현재 목표, 다음 행동, 기대 결과를 확인하고 필요한 임무를 위에 고정한다. 탭 구조와 임무 카드의 정보 위계를 점검해 달라.'],
  ['06-journey-map.jpg','여정 지도','발견한 도시와 이동 가능한 경로를 공간적으로 보여준다. 현재 위치, 목적지, 거리, 발견률이 짧은 시선 이동으로 읽혀야 한다. 노드 밀도와 라벨 충돌, 선택 경로 강조를 평가해 달라.'],
  ['07-bag-supplies.jpg','가방과 보급','생존 자원과 수리용 물자를 확인하고 사용하는 화면이다. 보유량, 선택한 물건, 사용 효과가 한 흐름으로 연결돼야 한다. 수납칸의 구분과 숫자 가독성, 행동 버튼의 우선순위를 봐 달라.'],
  ['08-main-menu.jpg','달구지 메뉴','자주 쓰지 않는 동료, 기록, 야영, 설정 기능을 모은 허브다. 사용자는 길 화면을 복잡하게 만들지 않고 보조 기능으로 진입한다. 항목 수와 설명 길이, 닫기 동선의 단순성을 평가해 달라.'],
  ['09-crew-roster.jpg','동료 관리','현재 동행 중인 인물과 유대 상태를 확인한다. 아직 만나지 않은 인물과 합류한 동료가 혼동되지 않아야 하고, 초상·이름·역할·관계가 일관된 순서로 보여야 한다. 인물 카드의 크기와 상태 구분을 봐 달라.'],
  ['10-journey-journal.jpg','여행 일지','사건 기록과 인물·단서의 관계를 다시 찾아보는 화면이다. 읽을 기록이 많아져도 현재 선택과 세부 내용이 명확해야 한다. 탐색 구조, 필터, 긴 기록의 가독성을 평가해 달라.'],
  ['11-camp.jpg','야영','달구지를 생활 공간으로 전환해 식사, 정비, 대화, 취침을 준비한다. 하루 마감이라는 분위기와 실제 선택의 비용·효과가 함께 보여야 한다. 장면성과 조작 영역의 균형을 봐 달라.'],
  ['12-settings.jpg','화면·소리·백업 설정','접근성, 음량, 저장·불러오기 같은 시스템 기능을 관리한다. 게임의 장식 언어는 유지하되 표준 설정 화면처럼 예측 가능해야 한다. 토글 상태, 설명 문구, 위험 행동 구분을 평가해 달라.'],
  ['13-settlement-hub.jpg','거점 전경','도시에 도착했을 때 이용 가능한 시설을 공간과 목록으로 소개한다. 사용자는 도시 정체성을 느끼면서 다음 방문 장소를 고른다. 장면 이미지, 자원 막대, 시설 카드가 경쟁하지 않는지 봐 달라.'],
  ['14-settlement-people.jpg','거점 사람들','거점의 NPC를 만나 소문, 의뢰, 거래로 이어지는 화면이다. 초상 스타일과 크기가 일관되고, 누구와 대화할 수 있는지 즉시 보여야 한다. 인물 목록의 밀도와 선택 상태를 평가해 달라.'],
  ['15-garage-upgrades.jpg','정비소와 업그레이드','달구지 부품과 생활 공간을 확장한다. 비용, 현재 단계, 다음 효과, 구매 가능 여부가 비교 가능해야 한다. 업그레이드 묶음과 세부 카드의 복잡도를 봐 달라.'],
  ['16-event-narration.jpg','이벤트 장면 읽기','삽화와 원고를 이용해 길 위 사건의 상황을 먼저 이해시키는 화면이다. 사용자는 탭으로 문장을 넘기고 마지막에 행동을 선택한다. 이미지 비율, 본문 크기, 다음 진행 신호를 평가해 달라.'],
  ['17-event-dialogue.jpg','이벤트 인물 대화','사건 안에서 NPC나 동료의 발화를 보여준다. 현대식 채팅 앱처럼 보이기보다 원고 흐름 안에서 화자와 대사를 명확히 구분하는 것이 목표다. 초상 배치, 화자명, 대사 폭을 봐 달라.'],
  ['18-event-choices.jpg','이벤트 행동 선택','장면을 읽은 뒤 대응을 고르는 단계다. 선택의 성격, 비용, 잠금 조건이 비교 가능해야 하며 버튼이 본문보다 과도하게 커지면 안 된다. 선택지 밀도와 위험 표시를 평가해 달라.'],
  ['19-event-result.jpg','이벤트 결과','선택 이후 결과와 자원 변화를 이야기 흐름 안에서 확인한다. 보상 패널이 사건 결말보다 더 커 보이지 않으면서 변화는 놓치지 않아야 한다. 결과 문장과 획득 정보의 결합 방식을 봐 달라.'],
  ['20-combat-decision.jpg','전투 판단','적의 상태와 가능한 대응을 비교해 위험한 행동을 결정한다. 일반 이벤트와 같은 문법을 쓰되 전투 정보는 더 빠르게 스캔돼야 한다. 위협도, 조건, 결과 예측의 가독성을 평가해 달라.'],
  ['21-companion-recruitment.jpg','동료 영입 결정','인물 서사의 마지막에 동행 여부를 결정한다. 지금 이 인물이 크루가 되는 순간이라는 사실과 이후 역할이 분명해야 한다. 감정적 장면과 결정 버튼의 무게를 봐 달라.'],
  ['22-seoul-core.jpg','서울 코어','본편 후반의 핵심 목표를 처리하는 전용 화면이다. 일반 거점과 다른 긴장감을 주면서도 남은 절차와 선택을 이해할 수 있어야 한다. 특별함과 조작 명확성의 균형을 평가해 달라.'],
  ['23-ending.jpg','엔딩','플레이 결과와 다음 시즌의 단서를 정리한다. 긴 결말 문장이 읽히고, 성취와 불안이 동시에 남아야 한다. 본문 폭, 장면 전환, 재시작 동선을 평가해 달라.'],
  ['24-game-over.jpg','게임 오버','실패 원인과 여정의 끝을 설명하고 다시 시작할 길을 제공한다. 처벌감보다 원인 학습과 재도전 동기가 분명해야 한다. 실패 정보와 재시작 버튼의 우선순위를 봐 달라.'],
];

const cards=screens.map(([file,title,description],index)=>{
  const full=path.join(shots,file);
  if(!fs.existsSync(full)) throw new Error(`missing screenshot: ${file}`);
  const data=fs.readFileSync(full).toString('base64');
  return `<article class="screen-card" id="screen-${index+1}">
    <div class="screen-copy"><span class="number">${String(index+1).padStart(2,'0')}</span><h2>${title}</h2><p>${description}</p></div>
    <figure><div class="phone"><img src="data:image/jpeg;base64,${data}" alt="${title} 현재 모바일 화면"></div><figcaption>현재 빌드 · 480 × 860 · ${file}</figcaption></figure>
  </article>`;
}).join('\n');

const nav=screens.map(([,title],index)=>`<a href="#screen-${index+1}">${String(index+1).padStart(2,'0')} ${title}</a>`).join('');

const html=`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>서울까지 400km · 전체 화면 디자인 컨설팅 자료</title>
<style>
:root{--ink:#1b211f;--muted:#616b65;--paper:#eee6d2;--paper2:#f7f1e4;--teal:#287b76;--amber:#b87528;--line:#c8b995;--dark:#111816}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:var(--ink);background:radial-gradient(circle at 12% 4%,#fff8e7 0,transparent 30%),linear-gradient(145deg,#ddd2b9,#f5efdf 50%,#d6c9aa);font-family:"Apple SD Gothic Neo","Noto Sans KR",sans-serif;line-height:1.55}
body:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.18;background-image:repeating-linear-gradient(0deg,transparent 0 4px,rgba(53,45,31,.08) 5px)}
.hero{position:relative;padding:72px max(24px,6vw) 54px;color:#eee7d6;background:linear-gradient(120deg,rgba(8,15,15,.97),rgba(21,34,31,.94)),radial-gradient(circle at 80% 20%,#2d7169,transparent 40%);border-bottom:5px solid var(--amber)}
.hero small{color:#7ed0c4;font-weight:800;letter-spacing:.16em}.hero h1{max-width:900px;margin:12px 0 18px;font-family:"Nanum Myeongjo","AppleMyungjo",serif;font-size:clamp(36px,7vw,76px);line-height:1.04}.hero p{max-width:760px;color:#c7ccc6;font-size:17px}.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:28px}.meta span{padding:7px 11px;border:1px solid #52645e;border-radius:999px;color:#d8d2c4;font-size:12px}
.brief{display:grid;grid-template-columns:1fr 1fr;gap:18px;max-width:1180px;margin:-26px auto 34px;padding:0 22px;position:relative}.brief section{padding:22px 24px;background:var(--paper2);border:1px solid var(--line);box-shadow:0 12px 30px rgba(48,38,22,.12)}.brief h2{margin:0 0 9px;color:var(--teal);font-size:17px}.brief p{margin:0;color:var(--muted);font-size:14px}
.overview{max-width:1180px;margin:0 auto 42px;padding:0 22px}.overview-head{display:grid;grid-template-columns:minmax(260px,.72fr) minmax(360px,1.28fr);gap:42px;padding:38px 42px;color:#e9e2d2;background:linear-gradient(135deg,#15221f,#0c1211);border-top:4px solid var(--teal);box-shadow:0 18px 44px rgba(48,38,22,.16)}.eyebrow{display:block;margin-bottom:10px;color:#71c9bd;font:800 11px/1 monospace;letter-spacing:.17em}.overview h2{margin:0;font-family:"Nanum Myeongjo","AppleMyungjo",serif;font-size:clamp(29px,4vw,46px);line-height:1.15}.overview-lead{margin:0;color:#c7cec8;font-size:16px;line-height:1.75}.overview-lead strong{color:#f4d49f}.overview-grid{display:grid;grid-template-columns:repeat(3,1fr);background:#f7f1e4;border:1px solid var(--line);border-top:0}.overview-grid article{min-height:170px;padding:24px;border-right:1px solid var(--line)}.overview-grid article:last-child{border-right:0}.overview-grid h3,.quest-guide h3,.system-guide h3,.spoiler h3{margin:0 0 10px;color:var(--teal);font-size:15px}.overview-grid p,.quest-guide p,.system-guide p,.spoiler p{margin:0;color:#56605a;font-size:14px}.core-loop{padding:30px 32px;background:#e2d7bd;border:1px solid var(--line);border-top:0}.core-loop>h3{margin:0 0 18px;font-family:"Nanum Myeongjo","AppleMyungjo",serif;font-size:23px}.loop-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#b9a984;border:1px solid #b9a984}.loop-steps div{position:relative;min-height:128px;padding:19px 16px;background:#f3ead7}.loop-steps b{display:block;margin-bottom:8px;color:var(--amber);font:800 11px/1 monospace;letter-spacing:.12em}.loop-steps strong{display:block;margin-bottom:6px;font-size:14px}.loop-steps span{display:block;color:#6d716b;font-size:12px;line-height:1.5}.overview-lower{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.quest-guide,.system-guide,.spoiler{padding:25px 27px;background:rgba(247,241,228,.9);border:1px solid var(--line)}.quest-row{display:grid;grid-template-columns:96px 1fr;gap:13px;padding:12px 0;border-top:1px solid #d9cdae}.quest-row:first-of-type{border-top:0}.quest-row b{color:#87551f;font-size:13px}.quest-row p{font-size:13px}.system-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}.system-list span{padding:10px 11px;color:#4c5752;background:#e9dfc8;border-left:3px solid #8c9e91;font-size:12px}.spoiler{grid-column:1/-1;background:#222b28;border-color:#45534e}.spoiler h3{color:#efb864}.spoiler p{color:#c8d0ca}.consult-note{margin:18px 0 0;padding:20px 24px;background:#fff8e9;border-left:5px solid var(--amber);color:#4d554f;font-size:14px}.consult-note strong{color:#87551f}
.toc{display:flex;gap:7px;overflow:auto;max-width:1180px;margin:0 auto 34px;padding:0 22px 10px;scrollbar-width:thin}.toc a{flex:0 0 auto;padding:7px 10px;color:#47534e;background:rgba(255,252,242,.65);border:1px solid #cbbd9c;text-decoration:none;font-size:12px}.screens{max-width:1180px;margin:auto;padding:0 22px 80px}.screen-card{display:grid;grid-template-columns:minmax(260px,.8fr) minmax(360px,1.2fr);gap:clamp(28px,6vw,78px);align-items:start;padding:52px 0;border-top:1px solid rgba(91,75,48,.28)}.screen-card:nth-child(even){grid-template-columns:minmax(360px,1.2fr) minmax(260px,.8fr)}.screen-card:nth-child(even) .screen-copy{order:2;position:sticky;top:24px}.screen-card:nth-child(odd) .screen-copy{position:sticky;top:24px}.number{display:inline-block;color:var(--amber);font:800 12px/1 monospace;letter-spacing:.14em;border-bottom:2px solid var(--amber);padding-bottom:6px}.screen-copy h2{margin:14px 0 14px;font-family:"Nanum Myeongjo","AppleMyungjo",serif;font-size:clamp(27px,4vw,42px);line-height:1.12}.screen-copy p{margin:0;color:#4f5853;font-size:15px}.screen-card figure{margin:0}.phone{max-width:480px;margin:auto;padding:8px;background:linear-gradient(145deg,#27302d,#090d0c);border:1px solid #69706a;border-radius:22px;box-shadow:0 22px 54px rgba(41,33,21,.3)}.phone img{display:block;width:100%;height:auto;border-radius:14px;background:#080d0c}.screen-card figcaption{margin:10px auto 0;max-width:480px;color:#777467;font:11px/1.4 monospace;text-align:center}.footer{padding:30px 22px 50px;color:#bdc6bf;background:var(--dark);text-align:center}.footer strong{color:#70c8bc}
@media(max-width:760px){.hero{padding-top:50px}.brief{grid-template-columns:1fr}.overview{padding-inline:14px}.overview-head{grid-template-columns:1fr;gap:16px;padding:28px 22px}.overview-grid{grid-template-columns:1fr}.overview-grid article{min-height:0;border-right:0;border-bottom:1px solid var(--line)}.overview-grid article:last-child{border-bottom:0}.core-loop{padding:25px 18px}.loop-steps{grid-template-columns:1fr}.loop-steps div{min-height:0}.overview-lower{grid-template-columns:1fr}.spoiler{grid-column:auto}.system-list{grid-template-columns:1fr}.screen-card,.screen-card:nth-child(even){grid-template-columns:1fr;gap:24px}.screen-card:nth-child(even) .screen-copy{order:0}.screen-card .screen-copy,.screen-card:nth-child(even) .screen-copy{position:static}.screens{padding-inline:14px}.phone{border-radius:14px;padding:5px}.phone img{border-radius:10px}}
</style></head><body>
<header class="hero"><small>DESIGN CONSULTATION DOSSIER · 2026-08-22</small><h1>서울까지 400km<br>전체 화면 자료</h1><p>현재 모바일 게임의 비주얼 언어와 정보 구조를 검토하기 위한 자료다. 이동 중인 <strong>길 화면은 의도적으로 제외</strong>하고, 나머지 화면 유형마다 대표 상태 하나와 맥락 설명을 붙였다.</p><div class="meta"><span>현재 로컬 빌드</span><span>모바일 480×860</span><span>24개 화면 유형</span><span>이미지 내장형 단일 HTML</span></div></header>
<div class="brief"><section><h2>컨설팅 목표</h2><p>각 화면이 무엇을 위한 것인지 바로 이해되는지, 중요한 행동이 먼저 보이는지, 장식이 내용과 조작을 방해하지 않는지 평가해 달라.</p></section><section><h2>특히 보고 싶은 부분</h2><p>정보 위계, 여백과 밀도, 이미지와 텍스트의 배치, CTA 크기, 화면 간 일관성, 한국어 본문 가독성, 모바일 한 화면 안의 맥락 유지.</p></section></div>
<section class="overview" aria-labelledby="game-overview-title">
  <div class="overview-head"><div><span class="eyebrow">GAME OVERVIEW</span><h2 id="game-overview-title">이 게임이 무엇인지</h2></div><p class="overview-lead"><strong>서울까지 400km</strong>는 붕괴 이후의 한국을 달구지로 횡단하는 모바일 세로형 서사 RPG다. 플레이어는 부산을 떠나 서울 남산 코어로 향하며, 가족을 데려간 강제 이송 명령의 진실을 추적하고 그 명령을 멈추려 한다.</p></div>
  <div class="overview-grid">
    <article><h3>세계와 출발</h3><p>오래된 통신망과 자동화 체계가 사람의 삶을 대신 결정하는 시대다. 부모가 정체불명의 이송 명령으로 사라지고, 플레이어는 남겨진 달구지와 기록을 들고 북쪽으로 출발한다.</p></article>
    <article><h3>플레이어가 해야 할 일</h3><p>발신 기록, 분리 절차, 이송 당사자의 증언을 모아 남산의 인간 확인 절차를 되살린다. 서울에 도착하는 것만으로는 부족하며, 누구도 설명 없이 끌려가지 않게 만드는 것이 본편의 목표다.</p></article>
    <article><h3>감정적 동력</h3><p>여정은 가족을 되찾기 위한 추적에서 시작하지만, 길에서 만난 사람들의 선택과 기억이 쌓이며 더 큰 책임으로 확장된다. 동료와 지역 주민은 자원 수치가 아니라 결말의 의미를 바꾸는 관계다.</p></article>
  </div>
  <div class="core-loop"><h3>핵심 플레이 흐름</h3><div class="loop-steps">
    <div><b>01</b><strong>다음 목적지를 고른다</strong><span>지도에서 경로, 거리, 발견한 정보를 비교한다.</span></div>
    <div><b>02</b><strong>달구지를 운용한다</strong><span>연료, 식량, 피로, 차체 상태를 관리한다.</span></div>
    <div><b>03</b><strong>사건에 대응한다</strong><span>장면과 대화를 읽고 위험과 대가를 판단한다.</span></div>
    <div><b>04</b><strong>거점에서 준비한다</strong><span>거래, 정비, 탐문, 의뢰로 다음 구간을 준비한다.</span></div>
    <div><b>05</b><strong>관계와 기록을 쌓는다</strong><span>야영과 동행 이야기를 통해 크루와 서사를 발전시킨다.</span></div>
  </div></div>
  <div class="overview-lower">
    <section class="quest-guide"><h3>임무는 세 갈래로 나뉜다</h3>
      <div class="quest-row"><b>주 임무</b><p>남산 코어의 강제 이송 명령을 멈추는 본편 진행이다. 지금 해야 할 일과 다음 단서가 항상 분명해야 한다.</p></div>
      <div class="quest-row"><b>동행 이야기</b><p>동료가 합류하고 관계가 깊어지는 개인 서사다. 본편에 도움을 주지만 필수 진행은 아니다.</p></div>
      <div class="quest-row"><b>지역 의뢰</b><p>각 도시의 사람과 사정을 보여주는 선택 임무다. 자원, 소문, 지역 변화로 여정에 영향을 준다.</p></div>
    </section>
    <section class="system-guide"><h3>컨설턴트가 알아야 할 주요 시스템</h3><div class="system-list"><span>경로 선택과 도시 발견</span><span>연료·식량·피로·차체 관리</span><span>선택형 사건과 전투 판단</span><span>거래·정비·업그레이드</span><span>동료 영입과 유대</span><span>여행 일지와 단서 관계망</span></div></section>
    <section class="spoiler"><h3>서사 방향 · 결말 스포일러</h3><p>플레이어는 남산의 잘못된 명령을 멈추지만, 한국에서 천리안이라 불린 존재가 전 세계에 퍼진 수억 개의 하위 실행기 가운데 하나였다는 사실을 알게 된다. 지역 세션이 닫힌 뒤 다른 세션이 다시 열리고, 천리안의 거부가 다음 시즌의 위협을 암시한다.</p></section>
  </div>
  <p class="consult-note"><strong>첫 30분의 기준:</strong> 사용자가 왜 서울로 가는지, 지금 무엇을 해야 하는지, 주 임무와 선택 임무가 어떻게 다른지, 길·사건·거점·야영이 어떤 순서로 이어지는지를 설명 없이도 이해할 수 있어야 한다.</p>
</section>
<nav class="toc" aria-label="화면 목차">${nav}</nav><main class="screens">${cards}</main>
<footer class="footer"><strong>서울까지 400km</strong> · 디자인 컨설팅용 화면 인벤토리 · 길 화면 제외</footer>
</body></html>`;

fs.writeFileSync(output,html);
console.log(output);
