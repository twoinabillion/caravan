# Design drafts (development only)

Sang's workflow: show a design draft in Studio and discuss/choose it **before** changing the game's visuals or structure. Selection is not approval to silently apply a build. Keep existing play/save intact.

Studio's **디자인 초안** opens these prototypes in a sandboxed iframe without scripts, same-origin access or game storage. No files here are embedded in the game build. The standalone viewer is `/design-review.html` on the Studio origin, not the game origin.

Add an entry to `manifest.json` with version `1` and `drafts`: `id` (lowercase letters/digits/hyphens), `file` (flat lowercase `.html` filename here), `title`, `description`, `revision`, optional `recommended`. HTML may reference local CSS and reviewed assets; no executable scripts. Bump revision after revising a draft. Keep provenance in the description, distinguishing sample content from the actual save. New raster assets still require the image contract.

## 길은 넓게, 생각은 잠깐 v1 · 2026-10-05

`road-whisper.html` / `.css`: 큰 생각 카드 대신 풍경 아래 잠깐 표시하는 기존 관찰 문장, 고정 목적지·기록 버튼의 미적용 초안. 가끔/끄기·문장 고정·이벤트 예시는 CSS/native 입력/hash로만 동작한다. 실제 Studio320/360폭과 표시/숨김을 직접 확인했다. 기존 원경·차량의 정적 부품 배치이며 실제 주행 재현이나 게임 구현은 아니다. [설계·검수 한계](road-whisper.md).

## 달구지의 손때 · 대화와 선택 v1 · 2026-10-05

`event-materials.html` / `.css`: 현재 부산 ‘사유가 없는 이송표’ 원문·선택·결과로 만든 독립 초안. 생성한 투명 금속 프레임과 빈 철판 버튼을 9-slice로 쓰고 사람 대화·단말 응답을 구별한다. ‘계속 읽기’·두 선택·결과·확대/닫기·기록·질감 제거·큰 글씨는 script 없는 hash/details/checkbox로 동작한다. 작은 화면은 본문 스크롤을 허용하고 선택 단계는 그림을 줄여 행동 공간을 확보하는 제안이다. 실제 현재 cursor를 복제하거나 게임을 진행하지 않으며 게임/저장/빌드 미변경. Studio 목록 등록 완료, 직접 창 표시·터치·320/360/480 시각 검수는 Chrome 연결 시간 초과로 미완료. [설계·출처·검수 한계](event-materials.md).

## 출발 준비 · 이름과 짐 v1 · 2026-10-05

`departure-prep.html` / `.css`: 타이틀 색감을 이어 이름·세 구성 선택·선택한 물자·시작 버튼으로 정리한 미적용 초안. 실제 시작 수치 유지, native radio/해시 안내로만 동작하며 게임·저장·빌드 미변경. 독립 초안360×728·320×568, 이름 입력·세 구성·방향키·안내/복귀·끝 스크롤 확인. Studio 목록 등록은 완료했으나 검토 iframe이 빈 화면으로 남아 내장 창 표시는 미해결이다. [출처·검수 범위](departure-prep.md).

## 부산 출발 전 · 타이틀 v2 · 2026-10-05

`title-departure.html` / `.css`: 큰 제목 → 부산 항구의 달구지 → 출발 버튼으로 정리한 미적용 초안. 기존 원경·기본 차량의 정적 합성이며 실제 캔버스/저장 재현은 아니다. ‘저장 기록 있음 예시’는 메뉴 배치만 비교한다. 각 버튼은 해시 안내창과 복귀로만 동작하며 게임·빌드·저장은 미변경. Studio 독립 디자인 검토 창에서320·360·480폭 관찰,480폭 지붕 크롭 수정, 안내·복귀 확인. 실제 게임 연결·짧은 높이·큰 글씨는 미검수. [방향·출처·검수 범위](title-departure.md).

## 시장 안으로 · 풍경은 옆으로 v1 · 2026-10-04

`settlement-continuity.html` / `.css`: 밀양 DAY1 17:51·맑음 기반 독립 초안. 네 장소는 native radio로 선택하며 들어가기·복귀는 해시 안내만 연다. 시장 그림은 정본 네 장을 참조한 신규 생성 컨셉이며 이름 있는 동료/보리를 넣지 않았다. 현재 게임 좌표·걷기·가림·NPC 대화는 구현하지 않았다. 주행 탭은 기존 원경·차량을 재사용한 CSS 연출 비교로 실제 캔버스의 복제가 아니다. 스크립트·스토리지·빌드 연결 없음. [출처와 검수 범위](settlement-continuity.md).

## 달려도, 멈춰도 같은 자리 v2 · 2026-10-04

`journey-continuity.html` / `.css`: 정차·주행·가상 도착의 풍경/상태줄/272px 패널 경계를 통일한 **미적용 초안**.
출발 전·주행 중 목적지 아래에 장소 예고 한 줄을 남긴다. 상단 ‘예고’를 켜고 꺼 유무를 비교할 수 있다.
기본 주행은 이전 STOP 기록의 밀양→양산 수치다. ‘도착 후’는 현재 양산14:50 및 탐색+2시간/피로약+5를 사용하는 독립 배치다.
큰 사진과 긴 설명은 ‘목적지 정보’에, 평범한 식사 기록은 한 줄에 둔다. 지도·기록·다음 행동 안내는 초안 안에서만 열고 닫는다.
출발 전은 가상 비교이며, 모든 장면이 실제 저장과 분리돼 있다. 기존 원경·차량 배치 유지, 게임 소스·빌드·저장 미변경.
Studio 직접 시각·조작 검수는 접근 제한으로 미완료. [설계·출처·검증 범위](journey-continuity.md).

## 풍경은 그대로, 할 일만 바뀌게 v1 · 2026-10-03

`journey-calm.html` / `.css`: 목적지·머물기 바깥 높이를272px로 통일하고, 선택한 행동 한 줄 → 예상치 → 실행으로 맞춘 **미적용 초안**.
목적지/머물기 전환, 다섯 행동 선택과 취소, 다음 행동 설명, 기존292/340px **높이만** 비교할 수 있다.
풍경의 ‘대구 풍경 예시’는 기존 밀양/대구 원경만 교차해서 보여 주며 차량 위치와 크기는 유지한다.
정적인 자산 배치이며 실제 주행·현재 저장·개조·날씨를 재현하지 않는다. 게임 소스·빌드·저장 미변경.
Studio 직접 시각·조작 검수는 접근 제한으로 미완료. [설계·출처·확인 범위](journey-calm.md).

## 이벤트 · 한 화면씩 읽기 v2 · 2026-10-02

`event-pages.html` / `.css`: 스크롤 대신 읽기 → 선택 → 반응으로 진행하는 **미적용 초안**.
실제 `rq_minji_request` 대사·두 선택·두 결과를 보존하고 큰 글씨·작은 화면만 읽기를 둘로 나눈다.
짧은 결과 뒤에 별도 확인 페이지를 붙이지 않고 동행/다음 장소를 한 줄로 안내한다.
기존 밀양 장소 삽화, script 없는 해시 이동과 선택적 앞 대사 기록을 사용한다.
48px 공식 초상과 이름을 대사 위에 두고 본문 폭은 그대로 쓴다. 상단 ‘민지’ / ‘순덕·상혁’으로
단독 대화와 실제 문답 발췌를 비교한다. 같은 화자의 얼굴은 반복하지 않고 서술에는 붙이지 않는다.
현재 밀양 장터의 저장·이벤트·빌드에는 연결하지 않았다.
**Studio 직접 시각·조작·무스크롤 확인은 접근 제한으로 미완료.**
[방향·출처·검수 범위](event-pages.md).

## 첫 임무 · 출발 전 v1 · 2026-09-29

Sang 승인 후 게임 소스에 연결했으며 새 코드 적용·실제 시각 검수가 대기 중이다.
이 초안 파일의 검토 동작과 저장 격리는 그대로 유지한다.

`departure-brief.html` / `.css`: 기존 운전석 그림, 목표 한 문장, ‘무엇/알아낼 것’ 세 줄,
길 복귀 버튼으로 재구성한 초안. 반복 제목·대화 도구줄·종이 카드 없이 그림의 청회색을
이어간다. 큰 글씨·원본 구도 비교·복귀 동작 설명은 초안 안에서만 동작한다.
게임 소스/빌드/저장 미변경. **실제 Studio 시각·조작·무스크롤 확인은 접근 제한으로 미완료.**
[방향·출처·검수 범위](departure-brief.md).

## 인트로 · 그림과 이야기 한 덩어리 v3 · 2026-09-29

`intro-recollection.html` / `intro-recollection.css`: 첫 설명 두 문장과 관련 문답을 합쳐 기본8화면으로 재구성했다. 큰 글씨·짧거나 좁은 화면에서는 긴 문답4개만 나눠12화면으로 읽는다. 그림은 높이40% 목표로 중앙 행동을 확대하며 원본 구도 비교도 제공한다. 제목·본문 스크롤 없음, 본문18/21px 유지. `intro-flow.html`은 이전 스크롤 안이다. **초안만 수정, 원문·게임·저장 미변경. 실제 시각/조작 검수는 Studio 접근 제한으로 미완료.** [방향·출처·검증 범위](intro-recollection.md).

## 상황별 UI · 사람 / 영상 / 차 안 v1 · 2026-09-28

`situated-talk.html`, `situated-record.html`, `situated-cabin.html` / 공통 `situated-ui.css`: 같은 공책·카드 모음으로 모든 상황을 처리하지 않는 세 가지 연결 초안. 민지 자기소개와 수락/거절, 부모님 영상의 복원문 재독, 빈자리/손님/야영 후 생활 흔적을 native 링크·details로 확인한다. 큰 글씨 선택도 제공한다. 현재 장면 근거와 별도 가정을 각 파일 위에 구분했다. 기존 자산을 재사용하고 게임·저장은 변경하지 않는다. Studio 직접 시각 검수는 접근 제한으로 미완료. [방향·출처·적용 전 조건](situated-ui.md).

## 결과 화면 · 한 번만 읽기 v1 · 2026-09-28

`result-quiet.html` / `.css`: 현재 부모님 영상 선택 결과의 반복 알림을 한 문장·다음 행동·선택적 기록으로 정리한 초안. 기존 문구 비교와 큰 글씨, 자원 변화/추가 알림 없는 가상 사례를 제공한다. 실제 게임과 저장은 바꾸지 않으며 Studio 창 내 시각 검수는 접근 제한으로 미완료다. [방향·출처·적용 전 조건](result-quiet.md).

## 한 사람부터 · 인물 원형 v1 · 2026-09-27

`road-person-identity.html` / `.css`: 이름 없는 여성 행인 한 명의 전신·같은 그림의 얼굴 확대·정적 크기 비교. 정본 4장을 첨부해 built-in imagegen으로 만든 1024×1536 투명 마스터. 원본 그림 관찰은 완료했으나 Studio 창 배치는 접근 제한으로 미검수. 실제 캔버스 이식·게임 연결·전체 얼굴 매핑은 하지 않았다. [출처·얼굴 구분 원칙·검수 한계](road-person-identity.md).

## 길 위의 사람들 · 도로 조우 v1 · 2026-09-27

`road-cue-study.html` / `.css`: 사람·짐의 면과 자세를 달구지 옆에서 비교하는 정적 초안. 기존 일반 사람 자산, 상세 고장차와 새 코드 도형을 전환하며 확대할 수 있다. 새 사건/게임 구현·래스터 생성·저장 변경 없음. Studio 직접 접근 정책으로 창 내 시각 검수는 미완료. [방향·출처·검수 한계](road-cue-study.md).

## 민지와 첫 구간 · 부탁에서 자리까지 v1 · 2026-09-27

`minji-first-journey.html` / `.css`: 명확한 동행 수락 → 사람 중심의 목표 → 세 가지 현장 선택 → 선택별 주행 흔적 → 첫 야영 → 다음 아침 합류를 비교하는 6장면 초안. 원래 데이터·공식 초상을 재사용하며 새 흐름은 아직 게임 미적용. [설계·출처·연결 전 확인 사항](minji-first-journey.md).

## 공책 여백 · 조금씩 다르게 v1 · 2026-09-27

`quest-margin-notes.html` / `.css`: 현재 검증키의 고쳐쓰기, 이미 읽은 장치 기록의 작은 계기판 낙서, 부모님 행선지의 밑줄. 새로운 손흔적3곳과 기존 흔적1곳, 장식 없는 기록1곳을 선택해 비교한다. 기존 공책 재질·손글씨를 재사용하며 실제 게임과 저장은 미변경. [내용·조건·검수](quest-margin-notes.md).

## 추적 위험 · 상태줄로 v1 · 2026-09-27

`pursuit-status.html` / `.css`: 풍경의 상시 박스를 상태줄의 센서·숫자로 바꾸는 배치 비교. native radio/select/details로 기존/제안,0~5단계,단발 상승 안내,설명 열기·닫기를 확인한다. 실제 게임은 미변경. [설계·검수](pursuit-status.md).

## 같은 여정 · 머물기도 한 화면에 v1 · 2026-09-27

`journey-unified.html` / `.css`: 정차 기준 장소·DAY·시간 헤더와 2×2 머물기 선택기. 행동 선택은 비용 예측만 바꾸고 명시적 실행 버튼에서 다음 동작을 확인한다. 기본278px 패널, 조건부5번째 행동 시 풍경에서48px를 빌리는 초안. 실제 게임/저장에는 미적용. [출처·한계·검수](journey-unified.md).

## 개발 버튼을 게임 밖으로 v1 · 2026-09-27

`studio-play-controls.html` / `.css`: 기기 설정 다음, 폰 테두리 밖의 ‘플레이 테스트’ 도구줄 배치 제안. 코드 적용/재시작 확인의 동작 설명과 대기/최신 상태를 비교한다. 실제 게임은 개략도로만 표시하고 게임/Studio 코드·저장·초기화에는 연결하지 않았다. [계획·연결 범위](studio-play-controls.md).

## 추적 위험 · 작은 신호 표시 v1 · 2026-09-27

`pursuit-indicator.html` / `.css`: 민트색 덮개 대신 풍경 오른쪽 아래에 감시 아이콘·숫자·5칸을 둔 **미적용 시안**. 정차/주행,0~5단계,탭해서 설명 펼침을 네이티브 radio/details로 비교한다. 기존 차량/배경 자산의 정적 배치이며 현재 저장이나 실제 주행을 재현하지 않는다. [설계·출처·검수 범위](pursuit-indicator.md). Studio 초안 창320·360·480폭과7개회귀검사 통과. 실제 게임 소스·저장·적용 대기 상태는 변경하지 않았다.

## 상혁의 공책 v1 · 2026-09-26

`quest-bound-notebook.html` / `quest-bound-notebook.css`는 기존 기록철형의 대체 **디자인 제안**이다. 실제 목표 화면에는 미적용. Codex가 형태를, Claude가 현재 메모·빈 페이지 문구를 맡았다. [문구와 추가 검토 후보](quest-bound-copy.md).

- 방향: 스마트폰에서 양면을 축소하지 않고 공책 한 면을 가까이 본다. 각 항목을 카드로 쪼개지 않고 같은 종이에 이어 쓴다. 기본 팔레트는 표지 `#424b3e`, 바탕 `#242d29`, 종이 `#e9e1c7`, 종이 단면 `#b6ad8e`, 잉크 `#2e4651`, 연필 `#665e47`.
- 본문은 왼쪽 정렬 손글씨25px/30px, 제목32px/30px. 확인한 기록·색인·작은 메모도 같은 손글씨. 정확한 비용/기능 버튼만 종이 밖에 읽기 쉬운 UI체를 유지한다. 반복 소제목과 작은 카드 장식은 생략했다.
- 공책 제본 여백/표지/페이지 단면은 CSS 재질 표현이다. 새 래스터 이미지·게임 엔진·저장 접근·자동 적용 없음. 색인은 네이티브 라디오/label, 기록과 경로 예시는 details로 동작한다. 길/목표 등의 하단 표시는 배치 예시이지 실제 이동 버튼이 아니다.
- 초안 폰트는 `PYTHONPATH=<fonttools 설치 위치> python3 tools/prepare-quest-font.py --bound-draft`로 생성. `quest-bound-font.css`만 쓰고 게임의 납품 WOFF2와 기존 `quest-font.css`는 보존한다. 모든 초안 한글 글리프 검증,44,812bytes. 실제 게임 전체 적용에는 동적 이름·물품 글리프 범위와80MB 예산 재검토 필요.
- 시각 검수: 실제4317의 디자인 초안 창360×728,320×728 및 별도 **초안** 페이지320×568. 메인/사이드 빈 페이지/완료 빈 페이지, 기록 펼침·접기·끝 스크롤, 경로 예시 표시, Tab/방향키 색인 전환 확인. 320폭에서 가로 넘침 없음. 경로 버튼은 첫 화면에서 보인다. 이것은 현재 게임 저장 화면 검수가 아니다.
- 검사: `node --test tests/test_notebook_draft.cjs tests/test_quest_journal.cjs tests/test_quest_folder.cjs` 16개 통과. 게임 CSS/JS/폰트 전후 SHA 동일. 빌더를 돌리거나 기존 새 코드 배지를 누르지 않았다.
- 상태 보존:12:48:45UTC 재조회, 김천DAY1 21:52·목표 열림·무주 선택·360×728, 로드/스타일1790423663961·대기1790425624528 그대로.

`quest-folder.html` / `quest-notebook.html`: alternative compositions using existing `parents_work` objective copy from `src/04f-engine-quests.js`. Chapter caption and shortened record labels are design proposals, not a narrative change. No acquired evidence, mission result or location is invented. Empty side/completed tabs are layout examples, not claims about the current save.

**이 안으로 요청 작성** only fills the Studio composer. It does not send a message, buy anything, navigate the game, or approve/apply code. The standalone viewer supplies a copyable request instead. Opinions remain in memory while the window is open; selected draft ID is remembered per project in Studio browser storage.
# 기록철형 승인 구현 · 2026-09-26

Sang이 v1 기록철형을 승인하고 손글씨 느낌을 요청했다. v2는 메인 제목과 짧은 메모를 손글씨로, 긴 설명/행동/임의의 사이드 미션 이름은 읽기 쉬운 UI 글꼴로 유지한다. 실제 게임은 `src/01b-quest-style.html` + `src/07d-ui-quests.js`가 소유한다. 초안 예시의 ‘찾을 기록’ 두 장을 가짜 획득물로 옮기지 않는다.

`quest-ledger-qa.html`은 등록된 디자인 안이 아니라 개발 검수판이다. `/game/tools/design-drafts/quest-ledger-qa.html`에서 빌드 CSS 전체와 실제 목표 UI를 불러오되, 게임 엔진/스토리지 없이 명시적 샘플만 사용한다. 메인/빈 사이드/샘플 미션 추적/완료, 접기, 큰 글씨, 경로 요청, Escape와 반복 렌더를 확인할 수 있다. **사용자의 현재 플레이 화면으로 간주하지 않는다.**

- 시각 확인: CSS viewport 360×728 기본,320×568 큰 글씨·기록 끝까지 스크롤,480×800. 실제 다음 행동 버튼 첫 화면 노출, 가로 넘침 없음.
- 회귀: `node --test tests/test_quest_folder.cjs tests/test_inline_style_assets.mjs tests/test_trip_destination_picker.cjs` — 9통과. `npm run build:html` 통과.
- 현재 플레이: 김천1일차21:52와무주 선택 보존, 코드 대기. 네이티브 Studio 창을 직접 관찰할 수 없어 새 코드 적용 후 실제 목표 화면 및 저장/새로고침은 미검수. 기존 `open/close`, `G.save`, `UI.openQuestAction`, live 복원 경로는 바꾸지 않았다.
- 손글씨 출처/재생성: [fonts/README](../../assets/fonts/README.md). 샌드박스 초안에서는 생성된 `quest-font.css`의 data-font로 표시하며 sandbox 권한을 추가하지 않는다.
# 기록철형 v3 · 주인공의 메모

2026-09-26 사용자가 목표 전체를 상혁의 담백한 혼잣말 기록으로 바꾸는 방향을 승인했다. 기존 기록철/손글씨 배치를 유지한 v3에 메인·조달·완료 문구 예시를 등록하고 Studio 초안 창에서 확인한 뒤 실제 목표 UI에 연결했다. 초안의 사이드/완료 예시는 가상 데이터이며 저장과 무관하다.

- 구현: `src/07d-ui-quests.js`의 `QuestJournal`이 표시만 변환한다. 저장된 목표·진행·알림 비교 문자열과 완료 영수증은 바꾸지 않는다. `src/07-ui.js`의 정차 목표 바로가기도 같은 제목을 쓴다.
- 메인/동료/지역 부탁의 본문과 조작 안내를 분리했다. 완료 단계만 회고로 표시하고 미확인 결과는 지운다. 옛 `mainHistory.expected`를 실제로 겪은 사실로 단정하지 않는다.
- 검사: `node --test tests/test_quest_folder.cjs tests/test_quest_journal.cjs tests/test_inline_style_assets.mjs tests/test_trip_destination_picker.cjs` — 15개 통과. 오프라인 HTML 빌드79,996,415bytes, 상한 유지. 현재 폰트109,624bytes.
- 시각 확인: **독립 검수판**에서 전체 빌드 CSS+실제 목표 렌더러 사용,360×728 및320×568 큰 글씨, 메인/사이드/완료·기록 펼침/끝·추적/해제·경로 요청·Escape 확인. 게임 진행/저장 없이 샘플만 사용했다. 앱 코드 오류는 없었고 브라우저 확장 content.js 오류1건은 별개였다.
- 실제 현재 화면은 네이티브 Studio 접근 제한으로 새 문구/새로고침 시각 확인 불가.12:25UTC endpoint 확인으로 김천 DAY1 21:52·무주 선택·목표 메인 열림·360×728 보존, 로드1790423663961/대기1790425541899를 확인했다. 적용 배지는 누르지 않았다.
# 부산에서 시동을 걸기 전 · 두 화면 v1 · 2026-10-05

`opening-wharf.html` / `.css`: 타이틀에서 부산 부두의 달구지를 보고, 같은 차의 뒷문 가까이에서 이름·짐을 적는 연결 초안. 정본4장 참조 신규 컨셉2장, native radio/hash만 사용하며 실제 시작 수치를 보존한다. Studio 초안 창에 등록·직접 관찰. 게임/저장/빌드는 미변경. [설계·출처·검수 범위](opening-wharf.md).
