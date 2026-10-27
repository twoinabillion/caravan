# 새 20명 발견 감사 — 수정 금지

당신은 새로 배정된 한 명의 게이머다. `/Users/sang/caravan/AGENTS.md`와 `docs/DEVELOPMENT_GUARDRAILS.md`를 읽는다. 본인 `qa-artifacts/discovery-twenty-20261020/playerNN/`에만 apply_patch로 파일을 만든다. 게임 src/assets/tools/생성HTML/빌드/Studio/실제저장/다른 담당자 폴더/공유 checkpoint·개인메모리 변경 금지. 추가 에이전트 생성 금지. 문제를 고치지 않는다.

`../harness.cjs`로 실제 현재 소스 엔진·격리 유한자원을 실행한다. 브라우저/사람/시각/음성 플레이가 아니다. 과거 정책/보고서/발견 내용, 미래 게임 source/outcome은 **본인의 모든 자연 시도가 끝날 때까지 읽지 않는다**. harness API는 `qa-artifacts/persona-playtest-20261018/runner.cjs`, `qa-artifacts/followup-playtest-20261019-1401/harness.cjs`만 읽어도 된다. 문서 자체의 과거 버그 단서는 완전 블라인드가 아닌 한계다.

새 config를 직접 작성: `{id:'playerNN',persona,seed:2060NN,name:'상혁',pack:'fuel'|'repair'|'provisions',reloadAfterChoice:true,reloadBeforeChoice:선택,maxActions:3000,maxDays:90,visitGoals:[배정 공개지도ID],choose,decide}`. CLI는 `if(require.main===module) require('../harness.cjs').run(config,process.argv[2]||'attempt01')`. 폴더/attempt는 덮지 않는다. 정책 변경 재시도 전 `policy-attempt01.cjs` 등으로 과거 정책을 보존한다.

choose는 현재 obs.choices에서 visible&&enabled인 index만 반환. 실제 노출한 컨트롤에 한해 `prepare-finale`/`camp-later`도 가능하다. 게임과 분리한 seeded PRNG로 다중 가능 선택의 **25% 확률은 균등 추첨**, 나머지75%는 성향 가중(모든 대안 양수)으로 선택한다. 카운터를 config.evidence()/qa로 남긴다. 유한 실현 비율을 quota로 맞추지 않는다. Math.random/게임 RNG/숨은 flags/fx/outcome/source import 금지.

decide의 공개 행동: travel{to},explore,camp,trade{index},work{id},repair,talk{cid},meet-recruit{cid},upgrade{id},reload,board-open,accept-quest{index},turnin-quest,camp-talk{cid},camp-meal,camp-repair. obs의 현재/과거 글·선택/비용/요구량·재고/동료·노선/예보·공개 journal/navigation만 사용한다. sideQuest는 {kind,to,need,ready,...}, prep은 위3ID뿐. 물/식량/연료 용량·공개 next-leg rationForecast/survivalWarning을 따르고, 작업 일일한도/불가반복에 갇히지 않는다.

감사 계측 수정: player71–73 최초 실행에서 엔진 출발 허용이 실제 UI의 연료 부족 비활성 버튼을 우회하는 점이 확인됐다. 이후 harness는 routes[].check.ok를 실제 `forecast.ok&&!forecast.shortage`로 투영하고 travel호출도 같은 조건으로 거절한다. `check.engineOk`는 차이를 설명하는 진단값이지 출발 허가가 아니다. 최초3개 원본은 보존하며, 해당3명은 계측 보정 후 같은 task에서 최대2개 추가 시도로 재검증한다. 사후 source를 본 뒤의 재검증은 blind 자연 플레이로 부르지 않는다. 지역에 시장이 없고 연료가 다음 구간에 모자라면 공개 탐색/작업/머물기·다른 열린 노선을 고려하고, 막힘 자체는 기록한다. 이 안내는 연료를 지급하거나 임의 위기를 호출할 권한이 아니다.

계측 v8 추가: 실제 ‘머물기’의 연료5L 미만 `연료 구하기` 컨트롤도 관측/행동 목록에 추가했다. obs.localControls에 `{id:'walkfuel',label:'연료 구하기',enabled:true}`가 있을 때만 decide가 `{type:'walkfuel'}`을 반환할 수 있다. 실제 버튼과 같은 `G.openRescue`로 기존 비용·확률의 위기를 열며 연료를 강제 지급하지 않는다. 최초74/75의 낮은 양수 연료 정차 뒤 야영 반복은 이 컨트롤 누락에도 영향받았으므로 제품 회복불가 버그라고 단정하지 않는다. 현재 v8부터 새 플레이는 이 컨트롤을 본다. 71–76의 기존 시도는 보존하며 유효 출발로 이미 본편을 끝낸 실행을 비율 때문에 재실행하지 않는다.

배정 지역은 다양성 목표이지 생존을 무시하는 강제 quota가 아니다. config.visitGoals가 공개 지도ID면 obs.routes[].distanceToStops[goal]을 쓸 수 있다. tour단계를 메모리로 고정해 main과 왕복하지 말고 일수/거리 예산 뒤 공개 메인목표를 따라 **실제 storyDone+SESSION 1 END**까지 간다. 사망은 본편 엔딩 완료가 아니다. 실패를 보존하고 같은ID/seed에서 공개 정책만 조절해 최대3시도, 못 마치면 root에 사실대로 알린다. 공급/동료/결과 강제·무한자원·치트·게임변경 금지. 성공을 엔딩비율/균등추첨비율 때문에 재실행하지 않는다.

자기 실패 포함 **trace 전편을 시간순으로 읽는다**. 매 발생의 entry/선택지/고지/선택/result/전후 시간·위치·동료·재고·메시지·다음 행동을 확인한다. 큰 본문은 반복 최초 참조로 줄여도 매 발생 문맥은 확인한다. keyword/coverage집계만으로 전편검토라 하지 않는다. 각 시도 종료 후 compact-review.cjs 같은 본인 전용 투영으로 전체를 읽고 실제 검토 행/선택 수를 보고한다.

모든 자연 시도 종료 후 **실제로 본 후보**만 source/파서/별도 fixture로 확인할 수 있다. 사후 fixture는 자연 발생/새 참가자로 세지 않는다. 인접 미관찰 대안이 노출되면 범위를 밝히고 이후 자연 시도에 이용하지 않는다. raw main은 실제 공책 UI가 아니고 raw 칩소수/빈 hint는 실제 표시결함 증거가 아니다. origin이 기억/기록/후일담이면 현재 시계/위치를 적용하지 않는다. fatal반환문과 실제 화면표시도 구분한다. 화자오류는 실제 buildStoryTurns로 별도 확인할 것.

결과 `findings.json`: `{player,persona,seed,attempts:[{path,status,storyDone,method}],review:{rowsReviewed,choiceOccurrencesReviewed,method},findings:[{id,severity,classification,eventId,attempt,n,quote,expected,actual,reproduction,confidence,boundary}],opinions:[],policyErrors:[],limits:[]}` 및 한국어 `report.md`. 각 주장에 trace n·인용·실제 시간/위치/동료/재고·다음 행동, 자연관측/사후진단 구분. 버그/서사모순/명료성/취향/정책/도구오류를 분리. 버그 개수 할당량 없음. 마지막 응답은 완료/실패·방문·선택수·경로·상위제보를 짧게 보내고 슬롯을 반환한다.
