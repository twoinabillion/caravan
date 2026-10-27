# 신규30명 선택·탐험 감사 — 먼저 읽을 것

당신은 새 독립 subagent 한 명이다. 사람/브라우저 플레이어가 아니다. `/Users/sang/caravan`의 `AGENTS.md`, `docs/DEVELOPMENT_GUARDRAILS.md`를 읽는다. 이번 요청은 **문제 수집과 리포트만**, 생산 코드 수선 금지다. src/assets/tools/tests/생성HTML/이전QA/다른 참가자 폴더, 실제 Studio·브라우저·사용자 저장·서버를 건드리지 않는다. 하위 에이전트도 만들지 않는다.

root가 배정한 playerNN, seed218001–218030, 성향/집중점/일반 방문 목표를 사용한다. 이 폴더 roster.json에서 자기 행만 확인할 수 있다. 본인 `qa-artifacts/expedition-thirty-20261021/playerNN/` 안에만 apply_patch로 파일을 만든다. 첫 실행 전 역사적 정책/보고/버그 목록이나 생산 사건의 미래 결과를 읽지 않는다. 프로젝트 지침이 옛 함정을 알리므로 완전 맹검 연구는 아니다. 다른 참가자의 정책도 읽지 않는다.

## 독립 플레이

각자 새 policy.cjs를 작성한다. 과거 정책을 복사하지 않는다.

    module.exports={id:'playerNN',seed:2180NN,persona:'배정 성향',name:'상혁',pack:'fuel',
      reloadBeforeChoice:true,reloadAfterChoice:true,maxActions:3000,maxDays:90,
      acceptCompanions: true,visitGoals:['공개 일반 장소'],
      choose(o,m){return 활성/표시 선택지의 index;},
      decide(o,m){return {type:'travel',to:'공개 경로 ID'};},
      evidence(){return 실제 실행 PRNG/가중·균등 호출수와 의사결정 기록;}};
    if(require.main===module)require('../harness.cjs').run(module.exports,process.argv[2]||'attempt01');

pack은 fuel/repair/provisions 중 하나. 자기 별도 PRNG를 사용해 선택 호출의 약25%는 균등, 나머지는 성격 가중으로 고른다. **모든 활성/표시 선택지의 가중치는 양수**여야 한다. 일관된 정책으로 지역을 탐험하고 실제 메인 SESSION1END까지 목표로 하되 죽음/중단을 숨기지 않는다. 죽음은 메인 완주가 아니다. 특정 엔딩 선호는 현재 보이는 합법 선택지 라벨만 보고 표현할 수 있다. 강제 엔딩 quota/비공개 정답표/미래 fx 읽기 금지.

실행: `node qa-artifacts/expedition-thirty-20261021/playerNN/policy.cjs attempt01`. 실제 엔진·분리 Map 저장·UI/timer/audio 대역이다. 원본 trace/summary/save/coverage/같은 프로세스 evidence를 보존한다. 실패하면 당시 policy를 policy-attempt01.cjs로 먼저 보존하고 공개 관측에 근거한 계획만 개선해 같은 seed에서 최대3시도 가능. 이전 attempt 디렉터리 덮어쓰기 금지. 도구 오류와 자기 계획 실패는 별도 기록. 생산 수정·자원/아이템/동료/업그레이드/발견/플래그/RNG 주입·순간이동·무한자원 금지. 부족 예보를 무시해 출발하지 않는다. 공개적으로 발견하지 않은 숨은 장소를 목표 좌표로 주입하지 않는다.

### 공개 관측

선택: eventId,title,text,origin,controls,campConversation,choices[{index,id,label,hint,requirement,enabled,visible}],state. 미래 결과는 없음.

도로: at/day/min/night/weather, fuel/water/food/scrap/van/fatigue/items, party/crew/bond/injury, up/seatCapacity, main/navigation, routes(check/forecast/distanceToGoal/distanceToStops/distanceToRecruit/distanceToSideQuest/distanceToKnownPlaces), exploredHere/visits, knownPlaces(실제로 발견한 곳만), localControls, stl(trade/actions/recruit), upgrades(owned/cost/status/minutes), recipes(status/cost), sideQuest/boardOffers, campParticipants/campConversation/campPlan.

- navigate.atTarget 같은 없는 필드를 추측하지 않는다. `at===navigation.target`이나 공개 explore.mainEvidence를 쓴다. 같은 곳에서 앞 장면을 읽었더라도 다음 mainEvidence가 있으면 새 탐색 가능하다.
- market afford와 저장 용량은 다르다. 같은 실패 구매/거절 영입/의미 없는 야영을 반복하면 정책 실패다. 전후 상태가 안 바뀐 행동은 다른 합법 행동으로 바꾼다.
- 출발은 check.ok와 forecast.ok&&!forecast.shortage를 존중한다. 겉보기 부족이 아니어도 물0·허기·자정 경고를 읽는다. 음식1은 동료 전체 하루치가 아니다.
- 연료 구하기는 현재 G.canSeekFuel/G.seekFuel 소유자를 반영한다. 옛 관측기의 fuel<5 고정값을 복원하지 않는다. 주요 조우/야영/도구 가격도 현재 extension을 쓴다.
- 동료는 실제 좌석/자원/시간으로 영입한다. acceptCompanions는 boolean 또는 현재 공개 제안의 {cid,state} 함수. perkChoice0/1은 실제 획득한 후보 중 하나만 고른다.
- 알려진 새 장소를 탐색하고 싶으면 knownPlaces와 distanceToKnownPlaces를 이용한다. 목표 밖 장소를 못 갔으면 못 갔다고 적는다. 숨은 곳 발견과 실제 방문은 구분한다.
- 지원 actions: travel(to),explore,camp,trade(index),work(id),repair,talk(cid),meet-recruit(cid),upgrade(id),reload,board-open,accept-quest(index),turnin-quest,camp-talk(cid),camp-meal,camp-repair,walkfuel(공개 enabled),radio(실제 enabled),craft(공개 recipe id). 실제 영입 단계/서울 단계/scene chain은 loop가 처리한다.
- prepare-finale/camp-later는 현재 공개 control이 실제 제공될 때만 choose에서 사용한다. 후처리 evidence()는 관측/게임 RNG를 바꾸지 않는다.

## 실행 전체 검토 및 리포트

첫 실행 뒤에는 자연 관측의 원인 확인에 필요한 소스만 별도 조사할 수 있다. 소스 진단/추가 합성 재현은 자연 플레이와 구분한다. 실제 이어지는 전후 상태만 판단하고 전 경로를 추정하지 않는다.

새로 시작하는 참가자는 첫 실행 전에 원시 runner 파일을 열지 않는다. observation과 action 형식은 SCHEMA.md를 쓰고, 추가 필드는 자기 첫 실행의 자연 관측으로 확인한다. 이전 참가자에게 우연히 defaultDecision 일부가 노출된 경우 그 한계는 보존하며 소급해서 맹검이라고 주장하지 않는다. 반복 정책의 검토량을 불필요하게 늘리지 않도록 maxActions1200 / maxDays35 이하를 권장한다. 메인 완주/실패 기록은 여전히 모두 보존한다.

본인의 모든 보존 시도에서 **모든 선택 occurrence의 입구/선택/결과·전후 자원/위치/시각/인원·인접 행동**, 그리고 선택 외 도로/작업/야영/reload 흐름도 읽는다. 일부 키워드/몇 장면만 뽑아 전수 검토라고 하지 않는다. `node qa-artifacts/expedition-thirty-20261021/review.cjs playerNN attemptNN 0 15`는 선택 ordinal부터 연속15개를 전부 출력한다. 구간을 끝까지 이어 읽는다. rows.cjs는 전체 행을 연속 출력한다. 출력이 잘리면 구간을 줄여 읽는다. 읽은 총 rows/choices/구간을 기록한다.

findings.json / report.md 필수:

- player/persona/seed, 보존 시도와 검토수, main ending/session 실제 도달 여부(사망은 별도), 선택수·행수, 목표 실제 방문/미방문.
- findings[]: 고유 local ID, category/severity는 잠정, evidence{attempt,path,인접 n}, 사건/선택 index/짧은 인용, 실제 before/after, 기대와 이유, 다음 가능한 행동, 재현 가능성/다른 해석, 최소 수선 방향. 바로 고치지 않는다.
- opinions[]: 재미/답답함/말투/호흡/장점 등 주관적 반응. policyLimitations[]: 자기 계획·관측기/검증 한계. rejected[]: 확인 후 오류가 아닌 의심. **0건도 유효**, 억지 quota 없음.
- 자연 관측/진단, 확정 가능 오류/서사 모순/명료성/취향/정책 잘못/관측기 한계를 구분한다. 원시 소수/요구 fx가 아니라 실제 정산·cap·기지급 receipt를 확인한다. memory/지난밤/epilogue를 현재 시각으로 오인하지 않는다. 동료0이어도 현장/임시/무전 상대가 있을 수 있다.
- API 실행을 보이는 버튼 클릭/실제 공책 접근/레이아웃/스크린샷/소리/실기 검수라고 부르지 않는다. 이번 테스트로 모든 문제를 찾았다고 하지 않는다.

최종 root에게 main ending 여부·시도/선택/행 수·실제 방문·주요 문제·파일 경로를 짧게 전달한다. root가 중복을 합치고 담당 소스와 인접 원기록을 재확인해 최종 판정한다.
