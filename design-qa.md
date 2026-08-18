# 인트로 1번 완전 일치 + 3번 압정 Design QA (2026-08-18)

- Source visual truth: `/Users/sang/.codex/generated_images/019fe565-5708-73b1-b061-eeb593218d5a/exec-4cfb477f-8b99-48c9-80e8-8946640cbb57.png` (1번의 프레임·배치·크기·줄바꿈)
- Supporting source: `/Users/sang/.codex/generated_images/019fe565-5708-73b1-b061-eeb593218d5a/exec-af8ac746-b35d-410c-af7b-881b568f5d19.png` (3번의 초상 압정만 채택)
- Implementation screenshot: `/Users/sang/caravan/audits/intro-portrait-hybrid-2026-08-18/implementation-480x860.png`
- Focused paper screenshot: `/Users/sang/caravan/audits/intro-portrait-hybrid-2026-08-18/paper-480x860.png`
- Exact comparison evidence: `/Users/sang/caravan/audits/intro-portrait-hybrid-2026-08-18/comparison-target-left-implementation-right-v3.png` (왼쪽 1번, 오른쪽 구현)
- Responsive evidence: 같은 폴더의 `implementation-390x844.png`, `implementation-320x720.png`, `paper-390x844.png`, `paper-320x720.png`, `metrics.json`
- Browser / viewport: Chromium, 480×860·390×844·320×720 CSS px, device scale factor 1
- State: `처음에는 편리한 도구였다`, `처음엔 뭘 했는데?`와 할아버지 답변이 동시에 보이는 프롤로그 턴. 자동 진행 OFF 뒤 15회 직접 넘김.

## Findings

- P0: 없음.
- P1: 없음.
- P2: 없음. 이전 구현에서 가장 크게 달랐던 할아버지 말풍선 4줄·104px 높이를 1번과 같은 3줄·약 71px로 고쳤고, 어린 주인공 말풍선도 한 줄·약 34px로 맞췄다.
- P2: 없음. 제목의 글자 면이 상단 청록선에 붙어 보이던 상태를 고쳐, 두 청록선 사이의 시각 중심으로 6px 내렸다. 제목 블록 전체 높이는 유지해 아래 이름·초상·말풍선 좌표는 바뀌지 않았다.
- P3: 실제 게임은 상단 장면과 세로 종이를 함께 쓰므로 전체 화면의 종횡비는 가로 시안과 다르다. 비교 가능한 종이 상단은 468×343으로 동일하게 정규화했다.

## Required fidelity surfaces

- Fonts and typography: 1번의 명조 제목, 갈색 화자 이름, 작은 본문 크기와 3줄 답변 줄바꿈을 그대로 맞췄다.
- Spacing and layout rhythm: 480px 종이 기준 어린 주인공 초상은 `(x≈352,y≈80,w=42,h=43)`, 말풍선은 `(x≈235,y≈99,w=115,h≈34)`다. 할아버지 초상은 `(x≈43,y≈146,w=46,h=48)`, 말풍선은 `(x≈95,y≈165,w=242,h≈71)`로 1번 목표 좌표와 0–2px 안이다.
- Colors and visual tokens: 1번의 종이·초상선·이름·말풍선 재질을 유지하고 3번의 금속 압정만 더했다.
- Image quality and asset fidelity: `player_child.png`와 `grandfather.png` 정본을 사용하며, 압정도 추출된 투명 PNG 실자산이다.
- Copy and content: 제목, 이름, 질문, 할아버지 답변은 게임 데이터 원문이며 이름 입력값도 계속 반영된다.

## Comparison history

1. Earlier finding — P1: 첫 구현은 할아버지 답변이 4줄·104px로 늘어나 1번의 3줄·70px 구성과 명백히 달랐다. 어린 주인공 말풍선과 두 초상도 목표보다 컸다.
   - Fix: 화자별 초상 크기, 말풍선 고정 폭, 본문 크기·행간·패딩을 1번의 측정값으로 분리했다.
2. Earlier finding — P2: 390px에서 왼쪽 초상이 안전 레일을 0.6px 침범했다.
   - Fix: 왼쪽 레인을 1px 안쪽으로 보정했다.
   - Post-fix evidence: `metrics.json`; 세 뷰포트 모두 `hookSafe: true`다.
3. Earlier finding — P2: 제목 글자가 종이 상단 청록선에 붙어 두 선 사이에 놓인 표제처럼 읽히지 않았다.
   - Fix: 제목의 7px 하단 패딩을 6px 상단·1px 하단으로 재배분했다. 전체 높이는 고정되어 대화 영역에는 이동이 없다.
   - Post-fix evidence: `comparison-target-left-implementation-right-v3.png`; 제목은 두 선 사이에 들어가고 기존 화자·초상·말풍선 좌표는 `metrics.json`에서 동일하다.
4. Final comparison: `comparison-target-left-implementation-right-v3.png`에서 제목·화자·초상·말풍선 위치와 줄바꿈이 같은 구도로 읽히며, 구현에만 3번 압정이 추가됐다.

## Interaction and responsive verification

- 프롤로그 시작, 자동 진행 OFF, 15회 직접 넘김, 제목·두 화자·두 초상·두 압정 표시를 확인했다.
- 480×860, 390×844, 320×720 모두 `hookSafe: true`, `horizontalOverflow: false`, page errors 0.
- 320px에서는 화면 폭에 맞춰 긴 답변이 더 감기지만 초상·갈고리·본문이 겹치지 않는다.

## Focused region comparison

1번 원본을 468×343으로 정규화하고 구현 종이의 같은 468×343 상단을 잘라 나란히 비교했다. 이 비교에서 초상 끝점, 이름 기준선, 질문 한 줄, 답변 세 줄, 갈고리 앞 여백을 판독했다.

## Follow-up polish

- 남은 P3 없음.

final result: passed

---

# 정착지 타일 월드 Design QA

- Source visual truth: `/Users/sang/Desktop/images (4).jpeg`
- Supporting source: `/Users/sang/Desktop/pokemon-gold-gen1recomp.avif`
- Implementation: `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/390x844-daegu-walk.png`
- Full-view comparison: `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/reference-vs-daegu-sprites-v2.png`
- Before / after comparison: `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/daegu-sprites-before-vs-after.png`
- Focused map comparison: `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/daegu-sprite-focus-before-vs-after.png`
- Interaction state comparison: `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/daegu-button-states-v1.png`
- Browser / viewport: Chrome, 390×844 CSS px, device scale factor 1
- Source pixels: 469×426
- Implementation pixels: 390×844; comparison crop 390×520 normalized to 469×426
- State: 대구 돔 시장 정착지 허브, 돔 중앙 장터 선택, 이동 시작 전. 정비소 선택 상태도 별도 확인했다.

## Findings

- P0: 없음.
- P1: 없음.
- P2: 없음.
- P3: 참고 화면은 보라·연두의 밝은 게임보이 팔레트이고 구현은 Caravan의 회색·녹·주황 팔레트다. 타일 명도 단계, 도로/건물 분리, 밝은 창 대비는 동일한 문법을 따르며 세계관 연속성을 위해 색상 차이는 의도적으로 유지한다.

## Required fidelity surfaces

- Fonts and typography: 실제 타일 월드 위에는 글자를 올리지 않는다. 도시명과 시설 설명은 게임 공통 HUD에만 남아 참고 화면의 깨끗한 플레이 필드를 보존한다.
- Spacing and layout rhythm: 넓은 직교 도로, 가장자리 건물, 중앙 이동 공간, 동일 규격 스프라이트로 정리됐다. 랜드마크는 일반 점포보다 크다. 하단은 2×2 동일 높이 버튼과 한 행의 주/보조 행동으로 고정되어 상태를 바꿔도 레이아웃이 움직이지 않는다.
- Colors and visual tokens: 제한된 8색 안팎의 도시별 팔레트, 단색 면, 한 단계 밝은 벽 무늬, 황색 창을 사용한다. 그라디언트·광원 번짐·반투명 선택 링은 제거했다.
- Image quality and asset fidelity: 참조 이미지를 배경으로 사용하지 않는다. 1× 논리 타일 버퍼를 nearest-neighbor로 확대해 경계가 흐려지지 않는다. 포켓몬 원본 스프라이트를 복제하지 않고 Caravan 고유 건물·달구지·인물 타일을 사용한다. 최종 v3는 ImageGen 시설 4종만 채택하고, 1×에서 더 또렷한 v2 인물·군중은 그대로 보존한 224×70·47색 하이브리드 아틀라스다. 시설은 지붕·벽·창·출입구·생존 소품이 분리되며 런타임 크롭·좌표·히트 영역은 바뀌지 않는다.
- Copy and content: 대구 돔 시장, 돔 중앙 장터, 선수 통로 정비소 등 Caravan의 장소와 행동 이름은 그대로 유지한다.

## Comparison history

1. Earlier finding — P1: 이전 구현은 원형 경기장, 벡터형 사람, 광원 번짐, 선택 링, 과도한 군중으로 현실적인 미니어처처럼 보여 선택한 고전 탑다운 참고와 시각 문법이 달랐다.
   - Earlier evidence: `/Users/sang/Desktop/포켓몬식 대도시 코드맵/390x844-daegu-walk.png`
   - Fix: 12px 타일 도로, 직각 건물, 제한 팔레트, 6–9px 스프라이트, `!` 상호작용 표시, 픽셀 선택 코너로 렌더러를 교체했다.
2. Earlier finding — P2: 첫 타일 패스에는 도시 설명이 지도 위에 겹치고 대구 돔 정면이 검은 빈 상자처럼 보였다.
   - Fix: 중복 제목·설명 오버레이를 제거하고 벽돌 무늬, 지붕, 창, 문이 있는 대형 돔 건물로 수정했다.
   - Post-fix evidence: `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/reference-vs-daegu-tile-final.png`
3. Earlier finding — P2: 하단 2×2 장소 선택과 `들어간다`/`달구지로 돌아간다`가 단색 CSS 사각형이라 타일 월드의 손맛과 맞지 않았고 선택 상태가 왼쪽 선 하나에 과하게 의존했다.
   - Earlier evidence: `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/before/390x844-daegu-plain-buttons.png`
   - Fix: 동일한 황동·캔버스 픽셀 UI 키트를 지도 프레임과 다섯 버튼 상태에 적용하고, 실제 아이콘·슬롯 번호·선택 LED를 추가했다. 버튼 안의 글자 크기를 키우는 대신 구조와 상태 신호로 빈 공간을 채웠다.
   - Post-fix evidence: `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/daegu-buttons-before-vs-after.png`
4. Earlier finding — P2: 시설은 단순한 색 블록이라 장터·정비소·모닥불·보관소의 기능이 소품 없이 지붕색만으로 갈렸고, 사람은 6–9px 막대형 실루엣이라 직업과 보행 자세를 읽기 어려웠다.
   - Earlier evidence: `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/before/390x844-daegu-basic-houses-people.png`
   - Fix: 네 시설과 여덟 사람을 하나의 투명 픽셀 아틀라스로 교체했다. 배경 건물에는 창 반사점, 세로 벽 패널, 문손잡이, 옥상 설비를 추가했다. 크기·좌표·선택 코너는 유지해 플레이 밀도는 바뀌지 않는다.
   - Post-fix evidence: `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/daegu-sprite-focus-before-vs-after.png`

## Interaction and responsive verification

- 320×578, 390×844, 475×948: 가로 오버플로 0, 화면 밖 컨트롤 0, 44px 미만 터치 컨트롤 0.
- 바닥 터치 이동, 시설 선택/도착, 주민 접근/대화, 합류 인물 접근/첫 사건, 동료 접근/대화를 확인했다.
- Chrome page errors: 0. 10개 캡처 상태에서 오버플로·화면 밖 컨트롤·44px 미만 터치 컨트롤이 모두 0이다.
- `tests/test_settlement_story_overhaul.py`, `tests/test_ui_coherence_overhaul.py`, `tests/test_smoke.py`를 통과했다.

## Focused region comparison

지도 부분을 390×532 동일 영역으로 잘라 개선 전·후를 나란히 비교했다. 네 시설의 지붕/벽/소품 분리와 인물의 모자/가방/보행 자세가 전체 화면보다 확대 영역에서 명확하게 확인됐다. 선택 코너와 인물 크기는 이전과 동일한 좌표 범위를 유지한다.

## Follow-up polish

- P3: 각 도시별 울타리·표지판·나무 같은 1–2개의 고유 타일을 더 추가할 수 있다. 현재 수용 여부를 막는 문제는 아니다.

final result: passed

## Settlement sprite atlas v2 — 실제 크기 1:1 재작화 (2026-08-17 오후)

v1 아틀라스는 건물 56×48·사람 16×24로 크게 그린 뒤 50×43·11×17·7×12로 비정수
축소해 그렸다. nearest-neighbor 비정수 축소는 픽셀 행을 불균등하게 떨어뜨려,
주변 UI는 또렷한데 지도 안 건물·사람만 뭉개져 보이는 원인이었다.

v2는 모든 셀을 **실제 렌더 크기 그대로** 손으로 다시 그려 1:1로 찍는다.

- 아틀라스 레이아웃: 224×70 투명 WebP (lossless), 건물 4셀 50×43 · 사람 8셀
  11×17 · **군중 전용 8셀 7×12 신설** (v1은 사람 셀을 7×12로 재축소했었다).
  크롭 계약은 `townPixelAtlas()`에 명시: 건물 `(i*55+2, 2)` · 사람 `(i*13+2, 50)`
  · 군중 `(i*9+110, 52)`. 셀 매핑(0 장터·1 정비소·2 모닥불·3 보관소 / 사람
  0 주인공·1–2 동료·7 합류 인물)은 v1과 동일.
- 생성기: `tools/settlement-atlas-v2.py` (PIL, 셀 경계 밖 픽셀은 예외로 차단 →
  셀 간 번짐 원천 봉쇄). 36색, 최종 1,334 bytes — v1(4,270)보다 작다.
- 시설 4종: 장터(패치 캔버스 차양·계산대·걸린 상품·호박등·우측 출입구),
  정비소(녹슨 지붕·주름벽·어두운 정비 개구부·타이어 더미·공구 선반·드럼통),
  모닥불 쉼터(차양+뒷벽·개방 마루·화로·벤치·앉은 실루엣 2), 보관소(안테나·
  태양광 패널·기록함 선반·발전기·청록 포인트). 네 시설 모두 도로를 향한
  출입구와 텍스트 없는 실루엣 구분을 가진다.
- 사람 8종: 모자/두건/후드/안전모/백발, 코트/작업복/조끼, 배낭/공구/지팡이,
  손·림라이트 픽셀로 막대형 탈피. 주인공 amber 띠는 런타임 오버레이 행(y+5)과
  같은 행에 그려 이중 줄무늬를 피했다. 군중 8종은 7×12 전용 실루엣.
- 빌더는 `tools/build-html.mjs`의 아틀라스 경로만 v1→v2 교체. 최종 HTML
  38,989,808 bytes (하드 한도 39,000,000, v1 대비 −3,627).

검증:

- 캡처 10상태 재실행: errors 0 · horizontalOverflow 0 · escaped 0 · small 0.
- 320×578 밀양 / 390×844 대구·대구 정비소 선택 / 475×948 대전 육안 확인.
  일곱 도시 콘택트 시트(`after/seven-city-contact-sheet-v2.png`)에서 시설 4개와
  주민·합류 인물이 모든 팔레트 위에서 또렷함을 확인.
- 동일 크롭 v1↔v2 비교: `after/daegu-v1-vs-v2.png`,
  `after/daegu-sprite-focus-v1-vs-v2.png` (2× 확대). 사람 실루엣·시설 내부
  가독성이 v1 대비 명확히 개선, 외곽 UI는 픽셀 단위 동일.
- 회귀 테스트 5종 + `git diff --check` 실행. `test_smoke.py`의
  "같은 장면을 쓰는 선택→결과에서 이미지 크롭 고정" 1건은 실패하지만,
  v1 아틀라스로 되돌려 재실행해도 동일 값으로 실패함을 확인했다 —
  이번 스프라이트 작업과 무관한 기존(커밋 전 서사 작업) 이슈다.
  (`recruit-minji-meet-action` 장면 x 50%→32% 드리프트, 별도 수정 필요.)
- 산출물: `/Users/sang/Desktop/포켓몬식 타일 도시 최종/`에 v1↔v2 비교 2종과
  7도시 콘택트 시트, 최신 도시별 스크린샷을 갱신.

final result: passed (기존 서사 크롭 이슈 1건은 별도 추적)

## 후속 2건 — 장면 크롭 고정 픽스 + 도시 소품 패스 (2026-08-17 오후 2차)

1. **선택→결과 장면 크롭 드리프트 픽스** (`src/07-ui.js`): carry로 이어받은
   장면 키에 `shotLock`을 걸어, 같은 키가 보이는 동안 대화 케이던스 재크롭
   (`refreshShot`)을 막았다. 장면이 바뀌면 락을 해제해 기존 카메라 연출은
   유지된다. `test_smoke.py` "같은 장면을 쓰는 선택→결과에서 이미지 크롭 고정"
   ✅ — smoke 전체 실패 0건, 사건 레이아웃·타이포 회귀 2종 통과.
2. **도시 정체성 소품 §6C** (`src/05-scene.js` `townPixelProps()`): 도시당
   코드 드로잉 소품 2개 — 광주 국솥 화덕·방수포 그릇 더미 / 밀양 수동 펌프·
   청과 상자 / 대구 바리케이드·경기장 물품 상자 / 무주 배터리 랙·초 받침 /
   전주 장독·나무 벤치 / 대전 야외 단말·케이블 릴 / 수원 돌 표석·화로.
   대로 좌우 가장자리 고정 앵커(터널·성곽은 벽 두께 보정)라 시설 히트 영역·
   보행 동선과 겹치지 않고, 시설보다 낮은 대비를 유지한다. 아틀라스 추가 없음.

검증: 최종 HTML 38,992,376B (한도 내) · 캡처 10상태 errors 0 ·
overflow/escaped/small 0 · 정착지·UI 회귀 2종 통과 · `git diff --check` 클린.
7도시 콘택트 시트와 Desktop 산출물 갱신. 남은 것은 Codex ImageGen 패스
(`CODEX-HANDOFF-NEXT.md` Task 1, 선택 과제)뿐이다.

## Settlement sprite atlas v3 — ImageGen 시설 선별 채택 (2026-08-17 최종)

ImageGen으로 시설 4종·주연형 사람 8종·군중 8종을 각각 동일한 탑다운 픽셀 문법과
초록 크로마 배경으로 생성했다. `tools/settlement-atlas-v3.py`가 크로마 제거, 셀 분리,
정수배 캔버스 축소, 이진 알파, 무디더 팔레트 제한을 재현 가능하게 처리한다.

1× 동일 크롭 비교 결과는 선별 채택이었다.

- 시설: 패치 천막, 정비 개구부, 모닥불 쉼터, 안테나·기록 선반이 v2보다 명백히
  풍부하고 각 기능도 더 빨리 읽혀 **채택**.
- 새 사람·군중: 큰 원본에서는 좋았지만 11×17 / 7×12에서 어깨와 다리 폭이 줄어
  v2보다 식별성이 낮아 **미채택**. 원본과 전체 ImageGen 후보 아틀라스는 검수
  증거로 보존하고, 런타임은 v2 셀을 픽셀 그대로 사용한다.
- 최종: `town-world-sprite-atlas-v3.webp`, 224×70, 47 opaque colors,
  2,594 bytes. 시설/사람/군중 크롭 계약과 Canvas 좌표는 v2와 동일하다.

정착지 도움의 결과도 사진 레이어를 다시 얹지 않고 코드 월드의 1× 소품으로 연결했다.
도움 단계에 따라 작업등, 정리된 자재, 공동 표식이 쌓이고 `settlementState()`가
`impactStage`를 노출한다. smoke는 시설까지 실제로 걸어 도착한 뒤 입장이 열리는
현재 규칙을 직접 렌더 틱으로 검증한다.

검증: 최종 HTML 38,995,000B (<39,000,000) · 캡처 10상태 errors 0 ·
overflow/escaped/small 0 · 정착지/UI/smoke/사건 레이아웃/사건 타이포 5종 전부 통과 ·
`git diff --check` 클린. 비교 증거는 `after/daegu-v2-vs-v3.png`,
`after/daegu-sprite-focus-v2-vs-v3.png`, `after/seven-city-contact-sheet-v3.png`.

final result: passed

## 대사·타이밍 전수 검사 반영 (2026-08-17 밤)

이벤트 912개·짧은 라인 348줄·인트로 493항목을 6개 챕터로 나눠 전수 검수하고,
확인된 문제를 전부 반영했다. 검수는 후보만 내고 **판정은 원문·게이트 대조로** 했다.

**정합성**
- 옛 시한 "스무 날"/"DAY 20" 14곳 → "스물엿새"/DAY 26 (정본 `D.transferDeadlineDay`).
  `dialogue-lint.cjs`의 인트로 순서 검사 정규식도 갱신 — 되돌아가면 린트가 잡는다.
- 폐기된 3년 설정 5곳 제거(목마 아이·현수막 3주년·세 번째 가을·소포 세 살).
- 필수 경로 유령 동료: `seoul_gate`(은수·민지)·`seoul_decision`(은수)·`seoul_open`(한별)·
  `seoul_core`(재이)·`combat_walker_strike` 관련을 `S.party.includes()` 분기로 교체.
- 순서 계단 신설: `kw_absolved`→`ev_kangwoo_parkss`, `van_parts_named`→`comp_van_pride`,
  `eunsu_callsign_held`→`talk_es_16`. `ai_manifest` 적하 목록·`seoul_han` 우편부 녹음은
  개·편지·조우 여부에 따라 생성되도록 동적화.
- 계절 단정 제거(제설차 "여름이다"·매화 만개·철새 도래) — DAY 26 단일 여정에 봄·여름·겨울 공존 불가.
- 수치 정합: 목욕차(호가·라벨·req·fx·결과 서술), 드라이브인(라벨·req·fx).

**문자열 오염** — 대사에 그대로 노출돼 있던 내부 코드 `south`, 게이트 키워드 `once`,
영단어 `answer`, 한자 `習` 4건. 치환 파손 문장("오랜만에 처음" 4곳·"여러 해 차" 3곳·
"여러 해치" 5곳·"주줄"·"물러는")도 정리.

**보이스 계약** — 호칭표에 **주인공(다온) 칸이 아예 없던 것**이 말투가 이벤트마다 널뛴
근본 원인이었다. 실제 데이터 분포(민지 반말 41:5, 강우 반말 19:8, 나머지 해요체 우세)를
근거로 `addresses.daon` / `daonRegister`를 6인 전원에 신설하고 바이블에 반영했다.
강우 합쇼체 8줄을 반말로 통일하고, 「당신」·「너」 호칭 위반 4건을 고쳤다.
린트에 계약 누락·「당신/너」 사용 검사를 추가해 재발을 막았다.

**중복·말버릇** — 중복 이벤트 8쌍의 겹치는 도입·결구를 다른 소재로 분리(소재 자체는 유지해
이벤트 내부 정합을 지켰다). "만장일치" 21회→5회로 흩고 린트 상한 8회를 걸었다.

**엔진** — `G.pickBanter`에 `noFlag` 지원 추가(진행이 끝난 뒤 "아직 못 했다" 줄이 다시
뜨는 것을 막는 데 필요). 죽은 `minParty` 선택지 키 21곳을 `req.party`로 이관하고,
Codex가 넣은 런타임 정규화 `G.choiceReq`는 향후 작성 실수 대비 안전망으로 유지했다.

검증: `lint:dialogue` ✅ · `validate-content` ✅ · 회귀 5종 ✅ · `git diff --check` ✅ ·
HTML 36,868,549 bytes(한도 내). `test_smoke` 실패 1건은 **진행 중인 초상화 작업**
(mansu·sera·taeho 에셋 + 미커밋 assertion) 때문이며 대사 작업과 무관함을 diff로 확인했다.

**검수 오탐 4건**(기록용): `seoul_core` 고아 마침표·`party_north_vote`/`up_full_house`
빈 목록은 게이트로 도달 불가, `resist_reveal` 무게이트는 `needFlags` 배열이 실제로
엔진에 구현돼 있어 오탐, banter/chats 조건 누락 대량 보고는 **덤프 스크립트가 `need`를
`req`로 잘못 읽은 내 버그** 때문이었다. 런타임은 화자 탑승까지 이미 검사하고 있다.

## 사례가 아니라 계열을 고친다 (2026-08-17 운영 원칙)

사용자가 대구·세라·특정 이벤트처럼 한 인스턴스를 지목해도, 같은 컴포넌트·데이터 계약을
공유하는 전체 계열의 문제 신호로 취급한다. 먼저 동등 상태 전체를 캡처·계수하고, 같은
원인이 반복되면 공통 렌더러와 데이터 검증 계약을 고친 뒤 모든 인스턴스를 다시 검사한다.

이번 적용 범위는 도착 장면 58개, 큰 정착지 7개, 상주 주민 대화 17개 × 모바일 3규격으로
총 249상태였다. 전수 검사에서 대구 3명 외 주민 14명이 96px 삽화 초상을 사용하는 것을
확인해 256px 반실사 캐스트 정본으로 교체했다. 합류 후보의 이모지도 실제 동료 초상으로
바꾸고, `D.settlementPortraitCanon`·콘텐츠 검증기·스모크 테스트가 17명 전체를 보호한다.

검증: build ✅ · smoke 전체 ✅ · 249상태 errors/overflow/horizontal/small 0 ·
17/17 주민 초상 256px 이상·legacy 0 · `git diff --check` ✅.
증거: `audits/global-arrival-settlement-dialogue-2026-08-17/audit.md`.

## 정착지 인물 목록 겹침 픽스 (2026-08-17 밤, 초상화 작업 후속)

새 반실사 초상이 들어간 뒤 밀양 「대화 상대」 목록에서 합류 인물(민지) 행의
소개문과 오른쪽 상태 라벨("처음 보는 사람")이 서로 겹쳐 글자가 깨져 보였다.

원인(측정으로 확정): 좌표상 '겹침'이 아니라 **정렬** 문제였다. 행이
`align-items:center`라 nowrap 상태 라벨이 세로 중앙에 놓이는데, 합류 인물 행만
긴 `c.bio`를 써서 소개문이 두 줄이 된다. 그러면 라벨(608.6~623.6px)이 소개문
줄(610.1~640.1px)에 얹혀 문장의 일부처럼 읽힌다. 주민 행은 짧은 `role`이라
한 줄로 끝나서 이 조건이 안 만들어지고, 그래서 그동안 안 드러났다.

수정(`src/01-style.html`): 이름·소개 칸에 `flex:1 1 auto; min-width:0`,
소개문에 `overflow-wrap:anywhere`, `.npc-att`에 `flex:none; align-self:flex-start`.
라벨이 이름 줄 오른쪽에 고정되고 소개문은 아래로 흐른다.

회귀 검사 추가(`tests/test_smoke.py` "인물 목록 상태 라벨은 이름 줄에 정렬"):
라벨 하단이 소개문 상단을 넘지 않을 것 + 행 가로 오버플로 없을 것. **수정을 빼면
실제로 빨간불이 뜨는 것까지 확인**했다 — 처음 쓴 좌표 겹침 판정(`att.left < 본문.right`)은
이 버그를 못 잡아 폐기했고, 세로 정렬 기준으로 교체했다. 회귀 6종 전부 통과.

Codex가 작성한 마크업 자리(`src/07-ui.js`의 `.npc-row` 생성부)에도 3칸 flex 계약과
"긴 소개문을 쓰는 행은 여기 하나뿐"이라는 주의를 주석으로 남겼다.

## 현장 판 롤아웃 검수 — 4건 수정 (2026-08-18)

Codex가 28화면(7도시 × 4시설)에 현장 판을 적용한 뒤 전수 검토했다. 구조 자체는 의도대로
잡혔고(카드 스택 → 목록 1개, 행마다 버튼 → 실행 바 1개, 도착 사진 반복 제거), 네 가지를 고쳤다.

**1. 도시 팔레트가 화면에 전혀 안 나왔다 (P1)**
7도시 판 배경을 샘플링하니 `srgb(10.96%,10.88%,10.73%)`로 **소수점 3자리까지 동일**했다.
원인은 `border-image:var(--fb-frame) 24 fill`의 `fill` — 프레임 WebP의 중앙이 불투명(alpha 1,
`#1b1b1b`)이라 9-slice의 중앙 슬라이스가 도시 팔레트 그라데이션을 통째로 덮고 있었다.
`fill` 한 단어를 빼서 해결. 자산 재생성 불필요. 지금은 광주 `#4b3026`, 밀양 `#5a4c34`,
대구 `#282c2e`, 대전 `#29343b`로 갈린다. 제목 대비는 7도시 전부 7.4:1 이상(최저 밀양)이라
가독성 문제 없음. 증거: `board-head-before-after.png`, `city-palette-after.jpg`.

**2. 영문 개발 라벨이 플레이어에게 노출 (P1)**
판 머리에 `FIELD BOARD · MARKET`이 28화면 전부에 찍혀 있었다. 내부 컴포넌트명을 영문으로
보여 주는 것이라 `south`·`once` 문자열 유출과 같은 종류의 사고다. 도시명+시설 한국어
(`대구 돔 시장 · 장터`)로 교체하고 `FIELD_BOARD_LABEL` 표를 만들었다.

**3. 짧은 내용에서 판이 화면을 억지로 채웠다 (P2)**
통로 화면 몸통 508px 중 **355px(70%)** 가 빈칸이었다. `.field-board`/`.field-board-body`를
`flex:1` → `flex:0 1 auto`로 바꿔 판이 내용 높이에 맞게 줄도록 했다(넘치면 몸통이 스크롤).
빈칸 355→14px. 원래 진단했던 "컨테이너가 내용에 맞지 않는다"가 새 셸에도 남아 있던 것.

**4. 실행 버튼에 서술문이 들어가 3줄로 접혔다 (P2)**
현장 행동의 `action`은 "경비와 한 교대 동안 입구 동선을 정리한다" 같은 문장인데 좁은 버튼에
그대로 들어갔다. 서술은 넓은 메타 줄로 옮기고 버튼은 「일을 맡는다」로 통일. 데이터(7도시
행동 문장)는 건드리지 않았다. 함께: 나가기 문구를 `이 장소를 나와 …을 다시 둘러본다` →
`← …으로 돌아간다`로 축약(28화면 공통), 목록 하단에 22px 페이드를 깔아 잘림이 스크롤
신호로 읽히게 했다.

검증: 회귀 7종(신규 `test_field_board_rollout` 포함) 전부 통과 · `lint:dialogue` ✅ ·
`git diff --check` ✅ · 빌드 37,559,245 bytes(한도 39,000,000 내).
