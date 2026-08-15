# Caravan 목적지 콘솔 Option 3 Deep-dive QA — 2026-08-13

final result: passed

---

# Goal Clue Separation + Bag Item Rail QA — 2026-08-15

- Source visual truth: the user's live Goal/Bag screenshots in `audits/goal-bag-live-review-2026-08-15/01-goal-live.png` and `02-bag-live.png`, plus the exact requested clue copy: `확인된 단서 / 부모님의 수정안 / 엄마와 아빠는 강제 명령 앞에 인간 확인을 돌려놓으려 했다.`
- Implementation screenshots: `audits/goal-bag-live-review-2026-08-15/07-goal-clue-spacing-fixed.png` and `08-bag-items-left-fixed.png`.
- Viewport and density: 476×809 CSS px, deviceScaleFactor 1; source and implementation states are normalized in 952×809 before/after composites.
- State: Goal panel open at progress 3/6; Bag panel open with a selected inventory pocket.
- Full-view comparison evidence: `05-goal-before-vs-clue-spacing.png` and `06-bag-before-vs-left-shift.png`.
- Focused evidence: the full-height same-state composites preserve readable clue typography and individual pocket contents, so separate crops were not needed.

## Findings and comparison history

### Iteration 1 — blocked

- [P2] The clue label, title, and sentence read as one compressed text stack instead of three levels held between the folio's printed separators.
- [P2] Inventory names, icons, and count rows sat slightly right of the stitched pocket's optical center.

Fixes:

- Converted the clue block to a vertically centered flex stack with explicit 2–4px inter-row spacing, balanced top/bottom padding, and enough usable width for the requested sentence.
- Shifted every pocket's name, icon, and count group together by 4% of the pocket width to the left; the stitched five-column geometry itself remains unchanged.

### Iteration 2 — passed

- The clue's three text levels now have distinct vertical rhythm and remain contained between the raster lines.
- The exact requested sentence was injected during the six-viewport Chrome regression test; it does not overflow at 320×578 through 476×809.
- All five inventory content groups share the same left-shifted optical center without affecting hit targets or pocket seams.

## Required fidelity surfaces

- Fonts and typography: existing Korean font stack, weights, sizes, and line heights are preserved; only vertical spacing and available text width changed.
- Spacing and layout rhythm: clue top/bottom breathing room and internal gaps are explicit; inventory content moves as one unit while pocket boundaries remain locked to the raster.
- Colors and visual tokens: unchanged.
- Image quality and assets: original folio, bag, and inventory raster assets remain unmodified and unstretched.
- Copy and content: the user's exact clue sentence is covered by regression testing; dynamic production copy remains unchanged.

## Runtime and interaction checks

- `python3 tests/test_goal_bag_alignment.py`: passed at 320×578, 375×553, 360×700, 390×844, 462×832, and 476×809.
- `npm run verify:quick`: passed.
- `python3 tests/test_quality_9_accessibility.py`: passed, including large text, reduced motion, 44px controls, 200% zoom, and zero runtime errors.
- `python3 tests/test_smoke.py`: passed.
- Horizontal overflow: none.

final result: passed

---

# Goal + Bag Raster-slot Precision QA — 2026-08-15

- Source visual truth: `assets/ui/goal-folio-shell-v1.webp` and `assets/ui/bag-supply-roll-v1.webp` (720×1120 px each), plus the user's goal/bag screenshots represented by the pre-fix captures below.
- Pre-fix implementation: `audits/goal-bag-overflow-2026-08-15/deep-adjust-before-goal-476x809.png` and `deep-adjust-before-bag-selected-476x809.png`.
- Final implementation: `audits/goal-bag-overflow-2026-08-15/deep-adjust-after-goal-476x809.png` and `deep-adjust-after-bag-selected-476x809.png`.
- Short-screen evidence: matching `deep-adjust-before-*320x578.png` and `deep-adjust-after-*320x578.png` captures.
- Side-by-side full-view comparisons: `deep-adjust-qa-goal-476x809.png`, `deep-adjust-qa-bag-476x809.png`, `deep-adjust-qa-goal-320x578.png`, and `deep-adjust-qa-bag-320x578.png`.
- Viewports: 476×809 and 320×578 CSS px; additional regression viewports 375×553, 360×700, 390×844, and 462×832.
- Pixels/density: implementation captures equal their CSS viewport dimensions at deviceScaleFactor 1. The 720×1120 shell assets are proportionally scaled into the same 720:1120 prop box; no density resampling was used for layout measurements.
- Browser/state: Google Chrome, Day 1 new-game goal progress 3/6; bag state selected `고철`. State-dependent numbers are intentionally not compared to the user's later save.

## Full-view comparison evidence

The 476×809 goal and bag before/after captures were joined into the same comparison images and opened at original resolution. A second same-input comparison was performed at 320×578. The final goal screen uses the raster's printed paper frames instead of drawing a second CSS rectangle. The action copy now begins inside the printed map frame, while its lower metadata sits inside the lower printed panel. The final bag screen moves its resource panel and five interactive columns onto the actual leather panel and stitched pocket seams.

## Focused-region evidence

Separate crops were unnecessary because the original-size 476×809 composites keep every stitched divider, item center, count strip, small metadata label, and printed paper border legible. The 320×578 composites serve as the focused responsive check for the densest layout.

## Comparison history

### Iteration 1 — blocked

- [P2] Goal clue region had a coded 1px rectangle over the raster's own printed frames, producing a visibly doubled/competing border and making the page feel misregistered.
- [P2] The goal action area started too low and used conservative type, leaving the printed map frame visually empty.
- [P1] Bag pocket columns were inset 6.7% from the shell, but the measured stitched pocket centers are approximately 13.12%, 31.56%, 50%, 68.44%, and 86.88%. The outer columns were visibly pulled toward the middle.
- [P2] Bag vehicle status started below the second leather panel's true top and the pocket grid ended before the printed lower seam.

Fixes:

- Removed the duplicate goal clue border, shortened its reserved height, and raised the action frame.
- Increased goal action and completion-metadata optical size/contrast without changing the existing paper palette.
- Set the bag pocket grid to 3.9% side insets with zero artificial inter-column gap, matching the five measured raster seam centers.
- Raised and widened the vehicle panel, extended the pocket grid through the printed lower seam, and recentered icons/count strips within their stitched slots.
- Added automated guards for the five raster seam centers, duplicate goal border, action-frame vertical band, 44px controls, and cross-viewport containment.

### Iteration 2 — passed

- The 476×809 side-by-side comparison shows one coherent set of goal paper frames and five centered bag columns.
- The 320×578 comparison preserves readable hierarchy, full five-column containment, and the persistent bottom controls.
- No actionable P0/P1/P2 mismatch remains at the checked states and viewports.

## Required fidelity surfaces

- Fonts and typography: the established Korean sans/mono families remain unchanged. Goal action and completion values use heavier optical weights; no new clipping, unwanted wrapping, or truncation appears at 320×578 through 476×809.
- Spacing and layout rhythm: the 720:1120 prop ratio is preserved. Goal content follows the printed paper frames. Bag columns now follow the asset's measured stitch geometry instead of a generic evenly inset grid.
- Colors and visual tokens: existing teal, amber, paper, canvas, and muted ink tokens are preserved. Only existing-family contrast was strengthened.
- Image quality and asset fidelity: the original 720×1120 goal and bag raster assets remain unmodified and unstretched. Icons stay as real raster assets; no CSS/SVG/emoji substitute was introduced.
- Copy and content: existing non-spoiler goal copy is retained. No future encounter, danger, reward, or route outcome is exposed.

## Interaction, accessibility, and runtime checks

- `python3 tests/test_goal_bag_alignment.py`: passed on 320×578, 375×553, 360×700, 390×844, 462×832, and 476×809 in Google Chrome.
- `python3 tests/test_quality_9_accessibility.py`: passed, including 44px goal/bag controls, large text, reduced motion, selection updates, repair action, 200% zoom, and zero console/runtime errors.
- `npm run verify:quick`: passed; dialogue, content references, and scene-asset contracts are clean.
- `python3 tests/test_smoke.py`: passed in full.
- `git diff --check`: passed.

## Follow-up polish

- [P3] At very short heights, the goal page intentionally hides secondary location metadata and prose before reducing touch targets or overlapping the printed map.

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

---

# Goal + Bag Live Screenshot Correction QA — 2026-08-15 20:56

- Source visual truth: `audits/goal-bag-live-review-2026-08-15/01-goal-live.png` (864×1478 px) and `02-bag-live.png` (994×1492 px), supplied from the user's actual play session.
- Final implementation: `audits/goal-bag-overflow-2026-08-15/live-fix-1-goal-476x809.png` and `live-fix-1-bag-selected-476x809.png` (476×809 px at deviceScaleFactor 1).
- Responsive implementation: matching Chrome captures at 320×578, 375×553, 360×700, 390×664, 390×844, and 462×832.
- Combined comparison evidence: `audits/goal-bag-live-review-2026-08-15/03-goal-reference-vs-fixed.png` and `04-bag-reference-vs-fixed.png`.
- State: Day 1 goal progress 3/6; bag selected-state comparison. Time and inventory values differ because the source is a later save. Geometry, hierarchy, and state styling are the comparison targets.
- Density normalization: source screenshots were proportionally normalized to the 476px comparison width; the implementation remained at 1×. Black top padding and the persistent dock are excluded from fidelity findings.

## Full-view and focused comparison evidence

The actual play screenshots and revised Chrome renders were joined into the same comparison images and inspected at original composite resolution. Separate crops were not necessary: at the normalized width the goal paper rails, action frame, button frame, bag stitches, item icons, selected pocket, and detail panel remain legible. The 320×578 captures provide the focused short-screen check.

## Comparison history

### Iteration 1 — blocked

- [P1] Goal content used several incompatible left rails; the action copy began outside the printed map frame and the coded button border sat over the raster frame.
- [P1] The goal title was oversized and visually collided with the metal binding.
- [P1] The bag selected state was a full-height rectangular overlay unrelated to the stitched pocket silhouette.
- [P2] Bag item icons sat above the visual center of the black pocket cavities.
- [P2] Vehicle status and detail panels were offset from the raster panel boundaries.

Fixes:

- Introduced explicit goal content and printed-frame rails; all title, location, progress, clue, action, metadata, and return-button anchors now follow one of those two measured rails.
- Reduced the goal title scale and removed the return button's duplicate coded border.
- Raised the bag vehicle panel to 17.7%, set the pocket span to the stitched 34.8–71.3% region, and moved icons to 37% within that region.
- Removed the selected pocket rectangle. Selection now uses the label, underline, icon glow, and count strip inside the pocket.
- Moved the detail panel to the raster's 8% side rails and 74–95% vertical band.

### Iteration 2 — passed

- The side-by-side goal comparison shows a smaller title, coherent left rail, action copy fully inside its printed frame, and a single aligned button frame.
- The bag comparison shows icons centered in their cavities and no full-height selected rectangle.
- The 320×578 check preserves all five pockets, readable selected detail, and persistent 44px controls.
- No actionable P0/P1/P2 issue remains in the checked states.

## Required fidelity surfaces

- Fonts and typography: the product's `Apple SD Gothic Neo`/Pretendard/Noto Sans KR fallback stack remains intact. The display title is reduced from a 38px to 34px maximum, with less aggressive negative tracking. Wrapping and truncation remain controlled at the short viewport.
- Spacing and layout rhythm: the goal uses measured 7.2% content and 6.5% printed-frame left rails. Bag panels use the source raster's measured bands; five pocket centers remain locked to their stitch centers.
- Colors and visual tokens: the existing paper ink, teal, amber, and canvas palette is unchanged. Selected styling is restrained to existing amber state tokens.
- Image quality and asset fidelity: the original 720×1120 folio and supply-roll rasters and the existing inventory PNGs remain unmodified and unstretched. No replacement asset or CSS illustration was introduced.
- Copy and content: dynamic goal, location, inventory, and repair copy are unchanged. No future route encounter or danger information was added.

## Interaction, accessibility, and runtime checks

- `python3 tests/test_goal_bag_alignment.py`: passed across six phone viewports; now asserts goal rail families, raster seam centers, icon vertical band, transparent selected pocket, detail-panel rail, and 44px controls.
- `python3 tests/test_quality_9_accessibility.py`: passed for large text, reduced motion, selection updates, repair action, 200% zoom, and zero console/runtime errors.
- `npm run verify:quick`: passed.
- `python3 tests/test_smoke.py`: passed in full.
- `git diff --check`: passed.

## Follow-up polish

- [P3] On screens shorter than 650px, secondary goal prose and location metadata remain intentionally reduced before any primary control is compressed.

final result: passed

---

# Cinematic Story Event Layout QA — 2026-08-15 21:57

- Source visual truth: `audits/story-event-panel-2026-08-15/01-user-live.png` (950×1896 px, approximately 475×948 CSS px at 2× density) and the normalized live recreation `02-before-475x948.png`.
- Final implementation: `audits/story-event-panel-2026-08-15/04-final-475x948.png` (475×948 px, deviceScaleFactor 1).
- Responsive evidence: `06-final-short-320x578.png` (320×578 px, deviceScaleFactor 1).
- State: `세 겹의 이송표`, story beat 1/4, automatic progression off, 10km remaining.
- Full-view comparison evidence: `05-before-vs-final.png` (950×948 px; left before, right final).
- Focused evidence: the combined full-height comparison keeps the story text and complete 60px button legible; the separate 320×578 capture verifies the constrained state.

## Comparison history

### Iteration 1 — blocked

- [P1] A 256×249 square navigation-button raster was stretched to roughly 445×64, visibly distorting the metal face.
- [P1] The current story beat was vertically centered inside a 383px reader, producing a large false gap between title and copy.
- [P2] Progress, autoplay, primary action, and next-step copy were visually scattered across an oversized dock.

Fixes:

- Made the current story reader content-sized and top-aligned immediately after the event heading.
- Added a lower divider to complete the current-beat reading block.
- Rebuilt the primary action as a maximum-360px two-column control. The existing raster is preserved at 54×54 without distortion, while live label and progress copy occupy a separate text column.
- Preserved automatic progression, direct progression, active/pressed state, and minimum 44px targets.

### Iteration 2 — passed

- The same-state composite shows the story text directly under the title and a compact centered action instead of a stretched full-width raster.
- At 320×578, the scene, heading, complete first beat, autoplay toggle, and primary action remain visible without horizontal overflow.
- Clicking `계속` advances the live progress from 1/4 to 2/4.

## Required fidelity surfaces

- Fonts and typography: existing Korean serif narration, sans title, and mono metadata families and weights are unchanged; only grouping and alignment changed.
- Spacing and layout rhythm: the false vertical gap is removed; story copy now forms one bordered reading block, and the dock uses a centered 360px maximum action rail.
- Colors and visual tokens: existing navy, teal, amber, and muted-paper tokens are unchanged.
- Image quality and assets: the scene image is unchanged. The square navigation raster is no longer stretched and renders at its intended near-square proportion.
- Copy and content: event title, narration, progress, autoplay state, and next-step labels are unchanged.

## Interaction, accessibility, and runtime checks

- `python3 tests/test_story_event_layout.py`: passed at 320×578, 375×667, 390×844, and 475×948; covers compact geometry, undistorted raster size, progress advancement, overflow, and runtime errors.
- `npm run verify:quick`: passed.
- `python3 tests/test_quality_9_accessibility.py`: passed for large text, reduced motion, 44px targets, 200% zoom, and zero runtime errors.
- `python3 tests/test_smoke.py`: passed.

final result: passed
