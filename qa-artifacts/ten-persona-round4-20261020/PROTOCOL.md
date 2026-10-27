# 새 10명 성향 감사 round4 — 발견 전용

Sang이 새 게이머10명을 다시 끝까지 보내라고 요청했다. 기존 정책 재실행이 아니라 새 독립 서브에이전트10개가 한 성향씩 작성·실행·전편 검토한다. 4동시 슬롯(주 디렉터 포함)을 지켜 순차 투입한다. 실제 소스 엔진/격리 메모리 저장을 사용한 자동 정책 플레이이며, 인간·브라우저·시각·음성·입력 QA가 아니다.

## 권한과 실행

- 각 담당자는 AGENTS.md와 docs/DEVELOPMENT_GUARDRAILS.md를 읽고 지정된 playerNN 폴더만 쓴다. 생산 src/assets/tools/HTML·공용 harness·다른 담당자의 폴더·기존 QA 수정 금지. 새 서버/브라우저탭/실제 사용자 저장/배지 조작 금지.
- 먼저 policy.cjs 주석에 성격·방문 목표·공개 정보에 근거한 선택 기준을 선언한다. 새 seed202001–202010 사용. `const {run}=require('../harness.cjs')`의 `run(config,'attempt01')`로 시작한다.
- 기존 정책을 import/복사해서 성향 이름만 바꾸지 않는다. 공통 관측 어댑터와 공개 API는 읽어 사용할 수 있다. 미래 결과/fx/숨은 플래그/성공률/보상표/미관측 대사로 현재 선택을 최적화하지 않는다. 소스 원문 검증은 실제 실행·관측 뒤, 해당 후보 사건만 한다.
- 자원/인물/아이템/플래그 주입·확률 변경·무한 자원·강제 엔딩 금지. 실제 거래·노동·모집·업그레이드·공개 본편 안내를 사용한다. 공개 가용 작업은 label 정규식으로 좁히지 말고 `status.ok`를 우선한다. 임의의 추가 연료 예비분이나 탐색횟수 제한으로 공개된 정상 경로를 영구 금지하지 않는다.
- `config.reloadAfterChoice=true`. `reloadBeforeChoice=true`도 가능하나 실제 UI Continue 검수는 아니다. 일반 `{type:'reload'}`와 야영 `'camp-later'`도 지원되며 실제 취소/뒤로 버튼 검수로 세지 않는다.
- 첫 실패·사망·한도·예외를 덮지 않는다. 공개 문구 오독/정책 오류를 설명하고 최대3번 새 attemptNN에서 보정할 수 있다. 동일 seed를 유지하며, 정책을 성공 확률/결과 지식으로 튜닝하지 않는다. 본편 `storyDone`까지 전체 후일담을 마친다. 그래도 못 가면 정확한 원인과 끝 상태를 보고하며 완료를 발명하지 않는다.
- 실제 기본 조작은 준비/오프닝·선택·도로 이동·현장 행동·거래·야영·서사·최종처분·세션끝을 관측 어댑터가 진행한다. 시각·청취·인간 반응·진짜 누르는 입력을 대신하지 않는다. 자동화된 perk 기본 선택/타이머 대체 등 어댑터 한계도 report에 명시한다.

## 관측 API

choose(obs,memory)는 현재 entryText/title/공개 선택지 label/hint/visible/enabled와 관측 state만 받는다. 보이지 않는 결과표는 없다. 허용 index를 반환한다. 야영 보류는 `'camp-later'`, 조건 부족 최종결정의 실제 준비 복귀는 `'prepare-finale'`로 지원된다.

decide(obs,memory)는 현재 at/day/min/night/자원/items/party/crew/upgrades·recruitQuest·main/navigation·routes(check/forecast/distanceToGoal/distanceToRecruit/distanceToSideQuest/distanceToStops)·stl.trade/actions(status)·sideQuest/boardOffers·camp 상태를 받는다. 관측된 목적지와 공개 지도에서만 visitGoals를 정한다. 단순 observer의 raw main 내부문구가 실제 공책 표시라는 보장은 없다.

허용행동은 기존 harness/runner 코드를 읽어 정확히 사용한다. 예: travel(to), explore, camp, trade(index), work(id), repair, upgrade(id), talk(cid), camp-talk(cid), camp-meal, camp-repair, reload, board-open, accept-quest(index), turnin-quest. 임의의 engine `G` 호출이나 state 쓰기를 정책에서 사용하지 않는다.

## 검토 산출물

- 매 실행의 trace/summary/격리save/coverage를 원본 보존한다. 전체 trace에서 모든 실제 선택의 진입→전체 공개 선택지→고른 선택→결과→전후 시간/자원/명단을 읽고 연결을 검토한다. 단순 키워드 검색만으로 전편을 읽었다고 하지 않는다.
- findings.json은 배열(0건도[])로 제출한다. 각 항목 id/category(bug,contradiction,opinion,harness)/severity/eventId/attempt/traceN/observed/expected/evidence/impact/confidence/suggestedScope. 기존 중복은 duplicateOf와 countAsNew:false로 표시한다. 구조화된 note 등 다른 필드는 가능하나 원 배열 형식은 지킨다.
- report.md에는 성향/정책 선언, 시도별 종료 증거, 실제 밟은 여정/선택과 느낀 점, 확정 후보/해석/취향/정책 실수, 저장·재생 범위와 미검증을 분리한다. 실제 화면을 못 봤으면 클리핑·크롭/버튼 문제를 확정하지 않는다. `ending`만이 아니라 `storyDone=true`와 마지막 후일담도 확인한다.
- 새 문제를 찾으려고 없는 문제를 만들지 않는다. 이미 고친 문구의 옛 paid receipt를 읽은 것은 새 코드 회귀가 아니다. 인간 선호/재미/완주율 통계로 정책의 엔딩 비율을 사용하지 않는다. 전 분기를 봤다거나 모든 버그를 찾았다고 하지 않는다.

주 디렉터는 중복·정책오류·제품 결함을 대조하고 실제 소유자/reader/공책 투영을 필요한 만큼 확인한다. 이번 라운드는 발견·판정·기록까지만 진행한다.
