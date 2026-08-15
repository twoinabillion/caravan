# Caravan 목적지 콘솔 Option 3 Deep-dive QA — 2026-08-13

final result: passed

## 비교 기준

- Source: `Desktop/Caravan 목적지 UI 3가지 시안/3-세로-로커와-캐러셀.png`
- Final implementation: `audits/destination-console-v3-deep-dive-2026-08-13/after-final/01-route-primary.png`
- Side-by-side: `audits/destination-console-v3-deep-dive-2026-08-13/after-final/source-vs-final.png`
- 동일 viewport: 480×860 CSS px / image px, deviceScaleFactor 1
- 추가 상태: 김해 선택, 머물기, 360×700

## 발견한 원인과 수정

1. P1 — 프레임의 비대칭 내부 윤곽을 직사각형 한 개로 처리했다.
   - 결과: 지도는 옆으로 늘고 하단 사진은 좁아졌다.
   - 수정: 지도·설명은 좌우 20px 안쪽, 캐러셀은 넓어진 하단 폭 전체를 쓰게 했다.
     프레임 래스터를 최상단 마스크로 올려 로커와 사선 테두리를 보존했다.
2. P1 — 세로 비율이 `48.5 / 18.5 / 33`으로 지도 쪽에 치우쳤다.
   - 결과: 설명이 한 줄처럼 보이고 사진이 작아졌다.
   - 수정: 원본 측정에 맞춰 지도 45%, 설명·정보 21%, 캐러셀 34%로 고정했다.
3. P1 — 두 목적지를 스크롤 캐러셀로 흉내 내 중앙 카드가 흔들렸다.
   - 결과: 중앙 사진이 약 35px 오른쪽으로 밀리거나 360px에서 126px까지 줄었다.
   - 수정: 두 길일 때 `좌 미리보기 / 중앙 선택 / 우 미리보기` 고정 대칭 그리드를 쓴다.
4. P1 — 장소 데이터가 짧아 설명 슬롯이 있어도 한 줄만 나왔다.
   - 수정: 양산과 김해를 이미 관측된 지형 사실만으로 두 줄 보강했다. 위험·사람·사건을
     미래 예고하지 않는다.
5. P2 — 시간과 거리 자리에 피로·관측 아이콘을 임시 사용했다.
   - 수정: 승인 원본의 연료·시계·도로 아이콘을 각각 투명 PNG로 분리해 적용했다.

## 최종 규격

- 콘솔: 472×462.7px
- 내부 화면: 402.2×407.2px
- 지도: 362.2×183.2px = 내부 높이 45.0%
- 설명·정보: 362.2×85.5px = 21.0%
- 캐러셀: 402.2×138.5px = 34.0%
- 선택 사진 카드: 193.0×114.5px
- 설명: 양산·김해 모두 실제 2줄
- 로커 터치 영역: 목적지·머물기 각각 44px 이상

## 검증

- `python3 tests/capture_destination_console_v3.py`: passed
  - 위 비율, 중앙 카드 최소 180×105px, 두 줄 설명을 자동 고정
  - 양산 ↔ 김해 선택, 머물기 전환, 선택 카드 출발 동작 확인
  - 480×860과 360×700 가로 넘침 및 브라우저 오류 없음
- `npm run test:accessibility9`: passed
  - 360×700, 390×844, 480×860 일반·큰 글자
  - 목표·지도·가방 조작, 200% 확대
- `git diff --check`: passed

## 의도적으로 다른 부분

- 원본 예시는 가상 목적지 3개와 208–341km 거리다. 실제 게임은 부산에서 양산·김해 두
  길만 열려 있으므로 가짜 목적지를 추가하지 않고 양옆에 반대 길 미리보기를 반복한다.
- 원본 중간의 별도 연료·차체 바는 이전 요청대로 제거된 상태를 유지한다. 같은 정보는
  상단 HUD에 있으므로 중복 복원하지 않았다.

---

# Goal + Bag Design QA

- Date: 2026-08-15
- Source visual truth: `audits/goal-bag-overflow-2026-08-15/user-screen-fix-goal-476x809.png`, `audits/goal-bag-overflow-2026-08-15/user-screen-fix-bag-selected-476x809.png`
- Implementation: `audits/goal-bag-overflow-2026-08-15/balanced-pass-2-goal-476x809.png`, `audits/goal-bag-overflow-2026-08-15/balanced-pass-2-bag-selected-476x809.png`
- Responsive evidence: matching 320×578 source and implementation captures in the same audit folder
- Comparison composites: `qa-goal-before-after-476x809.png`, `qa-bag-before-after-476x809.png`, `qa-goal-before-after-320x578.png`, `qa-bag-before-after-320x578.png`
- Viewports: 476×809 and 320×578 CSS px
- Pixels/density: screenshots match CSS viewport dimensions at device scale factor 1; no density normalization required
- State: Day 1 new-game state, goal progress 3/6; bag comparison uses selected `고철`

The user's current screenshots used a later in-game clock and different inventory values. The comparison therefore judges the same UI structure and responsive geometry, not exact state-dependent numbers.

## Full-view comparison evidence

The before/after composites were opened together after both implementation captures were inspected. At 476×809, the prior goal page left the lower paper frame almost empty and repeated the progress-step label as the next action. The revised page assigns the map-side area to a distinct action and uses the lower frame for current location and completion criteria. At 320×578, the lower frame collapses to completion criteria only without clipping. The bag comparison keeps the established raster shell but reduces the selected pocket's full-height emphasis and returns space from the icon to the detail copy.

## Focused-region evidence

Separate crops were not needed: the 476×809 full capture keeps the small goal metadata, all five bag pocket labels/counts, and the detail action readable at original resolution. The 320×578 full capture provides the focused short-screen check.

## Comparison history

### Iteration 1 — blocked

- [P1] Goal lower frame looked unfinished because it was mostly blank and repeated the same `분리 절차 복원·검증키 안전 회수` copy already shown in progress.
- [P2] The third raster tab had no label or behavior and looked broken.
- [P2] Bag selected state used long gold side rails, while secondary labels were too dim and the detail icon consumed too much width.

Fixes:

- Added step-specific, non-spoiler next-action copy.
- Split the lower goal frame into `현재 위치` and `완료 기준`; short screens retain only the completion criterion.
- Turned the third edge tab into a functional `메뉴` control.
- Removed the selected pocket's vertical rails, increased secondary text contrast/size, reduced the detail icon column, and allowed two-line detail copy.

### Iteration 2 — passed

- The goal page now uses both lower paper frames with a clear hierarchy and no repeated action label.
- All three side tabs are labeled, at least 44px, contained in the viewport, and the Menu tab opens the menu overlay.
- The bag selection remains visible without dividing the whole pocket column, and detail copy has more usable width.
- No actionable P0/P1/P2 mismatch remains in the 476×809 or 320×578 comparisons.

## Required fidelity surfaces

- Fonts/typography: Existing Korean sans and mono families remain intact. Action hierarchy is stronger; small goal and bag labels use heavier weights and higher contrast. No new wrapping or truncation issue is visible.
- Spacing/layout rhythm: The 720:1120 prop ratio is preserved. Goal support content is separated into map-side action copy and full-width metadata; bag detail uses a 21/79 image-copy split. Side gutters remain at least 8px.
- Colors/tokens: Existing teal, amber, paper, and canvas palette remains unchanged. Contrast was increased within the existing token family rather than introducing a new accent.
- Image quality/assets: Original goal folio, map slip, bag canvas, and item raster assets are preserved at their native shell proportions; no replacement or stretching was introduced.
- Copy/content: Next-action wording is distinct from progress history and describes only the active objective. It does not reveal future encounters or route danger.

## Interaction and runtime checks

- Chrome captures completed at 320×578, 375×553, 360×700, 390×664, 390×844, 462×832, and 476×809.
- Goal edge tabs, menu opening, bag selection, bag repair action, dock return, large text, reduced motion, and 200% zoom checks passed.
- Horizontal overflow: none.
- Console/runtime errors: none.
- Full smoke suite: passed.

## Follow-up polish

- [P3] On very short screens, `현재 위치` is intentionally omitted from the lower goal frame to protect the completion criterion and 44px controls.

final result: passed
