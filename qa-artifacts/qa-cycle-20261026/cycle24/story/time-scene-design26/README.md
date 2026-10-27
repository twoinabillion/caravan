# 26차 시간별 장면 설계 — 읽기 전용, 미구현

24차의 실제 시간 불일치 8개 장면을 대상으로 한다. `source-evidence.json`에 현재 정의의 모든 선택·결과·메타, 관측 시각, 실제 자산 경로, 원래 정상 백업 경로와 관련 소스 해시를 보존했다. 이 문서는 생산 변경이나 그림 제작 완료 증거가 아니다. 기존 24차 이미지 검토는 원본 파일 검수이며 실제 UI 검수와 구분한다.

## 회상 여부 판정

8개 사건 모두 화면의 물리적 배경은 현재다. `storyOrigin`의 memory/video 전환, entry의 과거 장면 전환, 해당 그림을 과거로 지정하는 `timeKind`/turn.scene/stage는 없다. 결과의 회상 대사나 과거에 관한 설명만으로 배경 전체가 과거가 되지는 않는다.

| 사건 / 현재 키 | 실제 현재 문맥 | 회상으로 제외? | 반대 시각 그림 |
| --- | --- | --- | --- |
| talk_kw_16 / comp-talk-kangwoo-camp-v1 | 오늘의 건빵·별사탕을 내밀고 나누는 행동 | 아니오 | 낮 |
| talk_pss_18 / comp-talk-parkss-camp-v1 | 지금 처방 메모를 보여주고 이름을 써 준다. 옛 버릇의 설명은 대사 안에만 있다. | 아니오 | 낮 |
| perimeter_first / combat-walker-watch-v1 | 도로에서 지금 보행기의 경고사격을 받는다. | 아니오 | 밤 |
| crisis_drowsy / event-crisis-exhaustion | 지금 졸음운전 중이다. ‘오래전에도, 지금도’는 일반 설명이다. | 아니오 | 밤 |
| settlement_road_echo / settlement-road-echo | 이전 일감을 언급하지만 재회와 행렬은 지금이다. | 아니오 | 밤 |
| seoul_han / seoul-han | 지금 다리를 건넌다. 우편부 녹음·해도 재독·전우 이름은 현재 다리의 매체/행동이다. | 아니오 | 밤 |
| seoul_ruins / seoul-ruins | 지금 차량 앞 신호가 초록으로 바뀐다. AI의 143년 설명은 현재 대화다. | 아니오 | 밤 |
| story_bridge_last_quiet / event-vista-road | 지금 마지막 고개에서 시동을 껐다 켠다. 여정 동기 회상은 현재 행동에 덧붙는 말이다. | 아니오 | 밤 |

단순히 반대 시각을 보완하면 **새 낮 2 + 새 밤 6 = 8개**다. 현재 목록만으로 ‘밤 7 + 낮 2’라는 9개 수량의 근거는 없다. `seoul_ruins`의 빨간 신호 문제까지 낮 원본을 교체하기로 확정한다면 **낮 1개가 추가되어 낮 3 + 밤 6 = 9개**가 된다. 이 경우 새 낮/밤 모두 초록 신호이고, 옛 붉은 신호 키는 옛 저장본용으로 남긴다. 최종 수량은 root의 신호 상태 판정과 별개로 구분해야 한다.

같은 키를 쓰는 모든 사건을 검수했다고 확장하지 않는다. 예를 들어 event-vista-road는 여러 정경의 공용 fallback이고, 보행기 컷은 전투 사건에서도 쓴다. 첫 구현은 위 8개 사건 ID와 실제 기준 키의 조합을 명시적으로 등록하는 것이 안전하다. 같은 원인을 더 넓게 고칠 때는 해당 재사용 문맥의 회상/명시 장면을 별도로 확인해 등록한다.

## 현재 소유 경로

- `src/03-data.js:2392` 부근은 동료 개인 대화 그림을 사건 번호의 홀짝으로 낮/야영 컷에 배정한다. 실제 게임 시각을 보지 않는다. 이것이 낮에 야영 컷이 나오는 직접 원인이다.
- `src/07-ui.js:3297 eventSceneKeys`는 결과 명시 컷 → eventTurnScenes → 사건 scenes/scene/eventScenes → 지역/가족 규칙/타입 fallback 순으로 첫 유효 계층을 고른다. 현재 시각별 variant 선택 기능은 없다.
- `showEvent:4180`에서 첫 키를 정하고 `curStory.sceneKeys`를 만든 뒤, `G.restorePresentationView`가 옛 reading/view를 복원한다. `renderStoryScene:3383`은 저장된 keys 안에서 명시 turn.scene → stage → 순서 fallback을 선택한다. 살아 있는 시계로 여기서 그림을 매번 바꾸면 안 된다.
- `resolveChoice:4637`은 명시 결과 컷이 없으면 실제로 보이던 `priorScene`을 carry한다. 따라서 신규 entry에만 시간 선택을 넣으면 05:00에 두 시간 수면한 새 결과도 밤 그림을 그대로 이어받는다. 신규 결과에서 같은 등록된 장소의 시각 variant를 다시 고를 필요가 있다.
- `src/04h-engine-presentation.js:49/81`의 `G.presentationView`가 sceneKeys와 turn.scene/timeKind/timeLabel을 검증·보존한다. `G.capturePresentationView:137` / `G.restorePresentationView:124`가 entry와 paid reading/history를 소유한다. 기존 키를 등록에서 삭제하거나 새 이미지로 갈아끼우면 이 보존이 깨진다.

## 제안하는 최소 구현 소유

1. **03g 데이터:** 위 8개 사건의 기준 키별 `{day, night}` 레지스트리를 둔다. 새 그림에는 새 키/파일/설명을 쓰며 기존 key→원본 파일은 유지한다. 일반 공용 키를 전역 치환하지 않는다. 기존 장소·인물·차량과 같은 구도/정체성의 imagegen 변형을 사용하고 CSS 필터로 밤을 흉내 내지 않는다.
2. **07 새 reader의 키 선택:** 기존 eventSceneKeys 우선순위를 유지한 채 새 entry/새 paid 결과를 만드는 지점에서만 등록된 현재 장면의 키를 변형한다. 명시된 회상/후일담/영상과 등록되지 않은 장면은 그대로 둔다. 새 결과는 `G.resolvePresentedChoice`가 실제 시간 효과를 적용한 뒤의 시각으로 고른다. 기존 `priorScene`이 같은 등록 그룹이면 그 그룹의 새 시각 키로 바꾸고, 키가 같을 때만 기존 shot carry를 유지한다. 다른 명시 결과 컷을 덮지 않는다.
3. **04h 기존 receipt/reading 보존:** 현재 phase의 저장 reading/view에 유효한 sceneKeys가 있으면 이를 먼저 사용한다. 그 키를 variant resolver에 다시 넣지 않는다. entry history는 그대로 남기고 새 결과 view만 새 시각을 저장한다. 기존 `renderStoryScene`의 stages/turn.scene/keys.includes 소유는 바꾸지 않는다.
4. **시각 출처를 함께 고정:** 현재 `sceneMinute`/`event-orientation`은 live `S.min`으로 만들어지며 receipt/view에는 일·분 스냅샷이 없다. 새 receipt에만 작은 `sceneTime:{day,min}`을 추가해 entry 생성 때, 결과는 실제 효과 후에 기록하고 기존 04h validator/view owner가 선택적으로 보존하는 안을 권한다. 새 reader의 variant와 ‘지금 · 장소 · 시각’ 표기가 같은 스냅샷을 사용하도록 한다. turn의 명시 `timeKind/timeLabel`은 여전히 더 높은 우선순위다. 새 상태 전역 필드나 일반 이벤트 시간 게이트는 필요 없다.

옛 unpaid/paid의 saved keys는 source clock보다 항상 우선한다. 옛 receipt에 키도 시각도 없는 text-only/pre-reader 자료는 과거 그림을 알 수 없으므로 새로 추정한 시간을 소급 기입하지 않는다. 기존 정적 키 fallback을 유지하고 본문/화자/효과를 보존한다. 새 코드에서 만들어진 receipt는 sceneTime으로 첫 UI 전 중단·재개도 같은 시각을 고를 수 있다. 옛 unpaid에서 사용자가 **새로 결제한 결과**는 새 phase이므로 새 결과 시각을 고를 수 있지만, 옛 entry/history의 키는 유지한다.

## 시간 기준과 검증

게임의 실제 야간 정의는 `G.isNight()`의 **05:30 이전 또는 19:30 이후**다. 06:00/19:00이 아니다. 05:30~19:29는 낮이다. camp 패널의 별도 그림 선택은 06:00~17:00이며 문구 `G.campTimeLabel`도 별도 범주라 이번 사건 그림의 새 기준으로 가져오면 안 된다. 게임 규칙을 바꾸지 않고 기존 G.isNight 판정 결과를 새 reader 생성 때 기록하는 방향이 적절하다.

필수 회귀 범위:

- 각 8개 사건의 05:29/05:30/06:00/19:00/19:29/19:30/23:59/00:00 실제 키 선택. 소수 분 경계도 포함한다.
- entry → 모든 선택·모든 결과 → 새 paid reader → 길 복귀. 특히 졸음 120분과 road echo 35/15분이 낮밤 경계를 넘는 경우 entry/history와 결과가 각자의 키를 보존해야 한다.
- 새 entry/paid를 저장한 뒤 현재 시각을 바꾼 별도 fixture에서 reload해도 저장 키는 안 바뀐다. 이 시각 변조 fixture는 자연 여정으로 집계하지 않는다.
- frozen25의 옛 unpaid/paid/view/text-only 및 첫 UI 전 result receipt가 본문·화자·자원·기록·재지급 없이 보존된다. 기존 saved keys의 실제 per-turn render 선택을 비교한다.
- 명시 memory/epilogue scene을 가진 다른 사건과 다중 컷/옛 Leo stage는 영향을 받지 않는다. 등록되지 않은 키와 누락 자산은 기존 검증기로 거부한다.
- 새 그림은 원본 master/계약 규격, 실제 gallery 선확인 뒤 연결하고 실제 entry/result/reload crop을 root가 확인한다. 날씨·하늘을 강하게 특정하지 않는 낮/밤 변형으로 불필요한 새 기상 모순을 피한다.

이 문서는 설계만이며 생산 source, 계약, 그림 파일을 추가 수정하지 않았다.
