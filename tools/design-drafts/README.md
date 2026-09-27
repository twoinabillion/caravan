# Design drafts (development only)

Sang's workflow: show a design draft in Studio and discuss/choose it **before** changing the game's visuals or structure. Selection is not approval to silently apply a build. Keep existing play/save intact.

Studio's **디자인 초안** opens these prototypes in a sandboxed iframe without scripts, same-origin access or game storage. No files here are embedded in the game build. The standalone viewer is `/design-review.html` on the Studio origin, not the game origin.

Add an entry to `manifest.json` with version `1` and `drafts`: `id` (lowercase letters/digits/hyphens), `file` (flat lowercase `.html` filename here), `title`, `description`, `revision`, optional `recommended`. HTML may reference local CSS and reviewed assets; no executable scripts. Bump revision after revising a draft. Keep provenance in the description, distinguishing sample content from the actual save. New raster assets still require the image contract.

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
