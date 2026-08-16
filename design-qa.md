# Design QA — 머물기·이벤트 Option 2 `여정 기록철`

- source visual truth: `audits/stay-event-option2-implementation-2026-08-16/reference-option2-journey-ledger.png`
- source pixels: 1712 × 922; the two 856 × 922 concept screens were normalized to 390 px width for full-view comparison
- primary implementation evidence:
  - `audits/stay-route-shell-lock-2026-08-16/route-390x844.png`
  - `audits/stay-route-shell-lock-2026-08-16/stay-390x844.png`
  - `audits/stay-route-shell-lock-2026-08-16/route-return-390x844.png`
  - `audits/stay-option2-frame-lock-2026-08-16/stay-390x844.png`
  - `audits/stay-option2-frame-lock-2026-08-16/route-390x844.png`
  - `audits/stay-option2-frame-lock-2026-08-16/route-return-390x844.png`
  - `audits/stay-event-option2-implementation-2026-08-16/event-dialogue-390x844.png`
  - `audits/stay-event-option2-implementation-2026-08-16/event-decision-320x578.png`
- implementation pixels / CSS viewport: 390 × 844 and 320 × 578, deviceScaleFactor 1
- browser: Google Chrome
- state: 부산 감천 부두 정차 → 머물기 4행; `lib_meet` 사건 대화 턴; 같은 사건의 3개 선택지
- density normalization: source halves were resized to the same 390 px comparison width; implementation captures remained 1:1 CSS pixels

## Full-view comparison evidence

- `audits/stay-event-option2-implementation-2026-08-16/compare-stay-final.png`
- `audits/stay-option2-frame-lock-2026-08-16/comparison-reference-vs-final.png`
- `audits/stay-route-shell-lock-2026-08-16/comparison-route-vs-stay.png`
- `audits/stay-event-option2-implementation-2026-08-16/compare-event-final.png`

The implementation preserves the approved hierarchy: live road/scene image, tactile ledger/report surface, then physical action control. The tall phone viewport intentionally gives surplus height to the live road and event scene, matching the existing game requirement to keep the dalguji and scene imagery prominent rather than stretching the ledger itself.

The stopped screen now also preserves one continuous physical enclosure across the 목적지 ↔ 머물기 switch: the outer metal bezel and bottom keydeck remain fixed, the active console stays within that enclosure, and only the center console content changes. The larger live scene above the ledger is intentional; the approved Option 2 ledger itself is compared at equal scale in the focused evidence.

## Focused comparison evidence

- `audits/stay-event-option2-implementation-2026-08-16/compare-stay-focus-final.png`
- `audits/stay-event-option2-implementation-2026-08-16/compare-event-focus-final.png`

Focused comparisons were required because row baselines, portrait alignment, paper margins, stamp placement, and the event title/dialogue rule were too small to judge in the full view.

## Findings

No actionable P0, P1, or P2 findings remain.

- Fonts and typography: the existing Korean sans/mono stack is preserved. Titles, costs, speaker name, dialogue, and action labels hold the same hierarchy as the source and do not wrap or clip at 320–475 px.
- Spacing and layout rhythm: four stay rows have equal tracks and at least 44 px hit height; icons, copy, stamps, and CTA tabs share stable columns. The event portrait, title, speaker label, and current line align to the report rules. Three decision slips fit at 320 × 578 without clipping.
- Colors and visual tokens: worn parchment, charcoal steel, amber actions, and muted teal stamps/names track the source. Disabled rows remain explicit through native disabled state and reduced contrast.
- Image quality and asset fidelity: the ledger, narrow ledger, report, continue key, choice slip, and four action icons are real WebP assets. A dedicated 3:2 narrow ledger prevents the 16:9 asset from being stretched on 320 px screens.
- Copy and content: the mock's sample values are replaced by live game time, cost, inventory, title, speaker, dialogue, and choice data; no future encounter prediction was introduced.
- Interaction and accessibility: every stay action remains a real button; story progression, final choices, paging, and combat detail behavior remain live. The rectangular continue key keeps a minimum 44 px hit height.

## Comparison history

### Iteration 1 — blocked

- P1: the implementation still used a dark text list instead of four tactile paper work orders.
- P1: the event used a messenger bubble and square nav key instead of the portrait field report and low rectangular continue key.
- Fix: added dedicated ledger, icons, field report, and rectangular key assets; moved live HTML content and controls over those measured surfaces.
- Evidence: `compare-stay-pass1.png`, `compare-event-pass1.png`.

### Iteration 2 — blocked

- P2: the final event decision state retained a black empty band and generic blue choice cards.
- P2: the third decision card was partially below the 320 × 578 viewport.
- Fix: made the story scene consume the decision header's surplus height, added paper decision slips, and tuned the 320 px ratio so all three cards remain visible.
- Evidence: `event-decision-390x844.png`, `event-decision-320x578.png`.

### Iteration 3 — blocked

- P1 accessibility: the four 16:9 stay rows fell below 44 px on the shortest 320 px viewport.
- Fix: created a dedicated 3:2 narrow-mobile ledger rather than stretching the wide asset.
- Post-fix evidence: `stay-320x578.png`; `qa_alignment.py` passed 320 × 578, 360 × 700, 390 × 844, and 475 × 948.

### Iteration 4 — passed

- `tests/test_story_event_layout.py`: passed four Chrome viewports.
- `tests/test_choice_visibility.py`: passed mobile, large-text, desktop, paging, combat, and outcome states.
- `tests/test_quality_9_accessibility.py`: passed touch target, zoom, reduced motion, overflow, and runtime gates.
- `tests/test_smoke.py`: passed.
- `tests/test_source_health.py`: passed.
- Final visual evidence: `compare-stay-final.png`, `compare-event-final.png`, `compare-stay-focus-final.png`, `compare-event-focus-final.png`.

### Iteration 5 — passed

- P1 continuity: switching to 머물기 previously replaced the visible device silhouette instead of retaining a shared stopped-screen enclosure.
- P1 crop: a mobile negative top margin clipped roughly 10 px from the ledger's upper metal border, making the approved Option 2 frame read as a different panel.
- Fix: added one persistent raster metal bezel around the stopped screen, locked the bottom keydeck position, removed the local-mode negative offset, restored the complete ledger border, and limited the console-to-keydeck gap to 0–6 px.
- Motion: Chrome View Transition provides a 160 ms content crossfade while the enclosure stays still; reduced-motion mode removes it.
- `audits/stay-option2-frame-lock-2026-08-16/capture.py`: passed 320 × 578, 390 × 844, and 475 × 948, including outer-frame geometry, fixed keydeck geometry, complete ledger top edge, return-to-route geometry, overflow, and runtime errors.
- `tests/test_quality_9_accessibility.py`: passed normal/large text, 44 px controls, 200% zoom, reduced motion, overlay controls, and the new 0–6 px keydeck lock.
- `tests/test_smoke.py`, `tests/test_story_event_layout.py`, `tests/test_choice_visibility.py`, and `tests/test_source_health.py`: passed after accounting for the asynchronous mode-transition frame.
- Final visual evidence: `audits/stay-option2-frame-lock-2026-08-16/comparison-reference-vs-final.png`.

### Iteration 6 — passed

- P1 motion/continuity: the route console used the approved tall `.95` shell while the stay ledger used a 16:9/3:2 shell and a different top margin. Switching modes therefore returned the height difference to the road scene and visibly pushed the entire stay console downward.
- Fix: both modes now use the exact same `.95` console box, the same `route-console-shell-option3.webp` transparent bezel, the same rocker position, and the same mobile margin. Only the inner screen content crossfades.
- Asset fix: `assets/ui/stay-journey-ledger-insert-v2.webp` reformats the approved four paper rows as a real square raster insert. It contains no text or icons; live HTML controls, values, disabled states, and action handlers remain above it.
- Geometry evidence: `audits/stay-route-shell-lock-2026-08-16/capture.py` passed 320 × 578, 390 × 844, and 475 × 948. Route, stay, and return states have matching console, shell, rocker, dock, and road-scene geometry; `window.scrollY` and panel scroll remain unchanged.
- Regression evidence: story-event layout, choice visibility, Quality 9 accessibility, full smoke, and source-health tests all passed.
- Final visual evidence: `audits/stay-route-shell-lock-2026-08-16/comparison-route-vs-stay.png`.

## Follow-up polish

No blocking follow-up. Live Korean strings longer than the current test fixtures continue to use ellipsis or two-line clamps by design.

### Iteration 7 — passed

- P1 information density: the fixed-height stay ledger previously hid every action description, so the four rows looked artificially empty even though their outer shell matched the route console.
- Fix: retained the exact route/stay console, rocker, road scene, and bottom dock geometry; each row now uses the existing space for a one-line action explanation plus deterministic time, fatigue, resource, recovery, or unlock effects. No icon exceeds 50 px and no title exceeds 16 px in the QA viewports.
- Spoiler rule: exploration still reveals no resource, encounter, danger, or regional target before the action. It shows only deterministic time/fatigue and `발견물 미확인`.
- P1 event continuity: resolving a choice rebuilt the outcome with the old generic blue dialogue sheet, removing the approved paper report. The decision state also collapsed the report to a title strip.
- Fix: beat, decision, and outcome now reuse the same `event-field-report` raster component at the same rendered width and height. The outer field-recorder sheet stays fixed; lower choice space is allocated by option count, and two-choice events return surplus height to the scene instead of stretching buttons.
- Visual evidence: `audits/stay-effects-event-continuity-2026-08-16/comparison-final.png` combines the approved Option 2 source with the final route, stay, event beat, decision, and outcome renders.
- Geometry evidence: `audits/stay-effects-event-continuity-2026-08-16/after-geometry.json` passed 320 × 578, 390 × 844, and 475 × 948. Route/stay console, shell, rocker, stage, dock, and scroll position match; the event sheet remains fixed; the report size is stable through every story phase; no horizontal overflow or page error occurred.
- Regression evidence: `tests/test_story_event_layout.py`, `tests/test_choice_visibility.py`, `tests/test_quality_9_accessibility.py`, `tests/test_smoke.py`, and `tests/test_source_health.py` passed.

### Iteration 8 — passed

- P1 false frame parity: the route and stay outer console boxes matched, but the stay screen still used a deeper `9.6% 11% 8.5% 12%` inset. At 390 × 844, the route screen was 325.47 × 353.86 px while stay was only 294.16 × 329.33 px, producing the visible shrink the user reported.
- Fix: both modes now use the same `8.2% 7.4% 3.8%` usable-screen rectangle. The stay ledger raster is cropped inside that shared screen instead of replacing and shrinking the whole console. Typography and icon clamps were not enlarged to disguise the mismatch.
- Geometry evidence: `audits/route-stay-frame-lock-2026-08-16/after-geometry.json` passed 320 × 578, 390 × 844, and 475 × 948 with exact route/stay matches for console, shell, usable screen, rocker, stage, dock, and panel scroll.
- Visual evidence: `audits/route-stay-frame-lock-2026-08-16/comparison.png` shows the two modes at one viewport and scale.
- Regression gate: `tests/test_quality_9_accessibility.py` now fails if the route and stay usable screens diverge by more than 1 px.

### Iteration 9 — passed

- P2 decorative noise: four teal circular stamps on the stay slips and one on the event field report had no state or interaction meaning. They competed with live costs and action labels.
- Fix: ImageGen precise-object edits removed only those five circles and restored the parchment underneath. `assets/ui/stay-journey-ledger-insert-v3.webp` and `assets/ui/event-field-report-panel-v2.webp` preserve the measured composition, metal, paper, clips, tabs, tears, rules, lighting, and crop.
- P2 choice hierarchy: story choices previously presented a bare number plus repeated generic `대응` tags, while stay action tabs used only one centered word.
- Fix: story slips now separate `선택`, number, action type, and authored action text; generic tags are replaced by meaningful non-predictive action types such as `기록` and `확인`. Stay tabs use existing space for a small `실행` label plus the live action verb. Hover/focus lifts the paper by 1 px, active press moves it down 2 px, and disabled choices are visibly muted.
- Full-view and focused comparison: `audits/stay-stamp-event-choice-polish-2026-08-16/comparison.png` at 390 × 844.
- Responsive evidence: `audits/stay-stamp-event-choice-polish-2026-08-16/after-geometry.json` passed 320 × 578, 390 × 844, and 475 × 948 with 44 px minimum controls, no horizontal overflow, and no page errors.
- Regression evidence: `tests/test_story_event_layout.py`, `tests/test_choice_visibility.py`, `tests/test_quality_9_accessibility.py`, `tests/test_smoke.py`, `tests/test_source_health.py`, and `npm run verify:quick` passed.

### Iteration 10 — passed

- Source visual truth: `audits/journey-event-stability-2026-08-16/before/user-reference-normalized-475x948.png`; the reported broken event view is normalized to the same 475 × 948 CSS-pixel viewport as the implementation.
- Browser-rendered implementation: `audits/journey-event-stability-2026-08-16/after/family-key-04-475x948.png`; Google Chrome, deviceScaleFactor 1.
- Combined comparison input opened and reviewed: `audits/journey-event-stability-2026-08-16/source-vs-after-475x948.png`.
- Full-surface evidence: `audits/full-ui-alignment-2026-08-16/contact-sheet-320x578.jpg`, `contact-sheet-390x844.jpg`, and `contact-sheet-475x948.jpg` cover 29 route, stay, goal, map, bag, menu, camp, settlement, story, decision, outcome, combat, and travel states.
- Focused evidence: `audits/full-ui-alignment-2026-08-16/compare-route-stay-390x844.png`, `compare-tools-390x844.png`, and `compare-event-states-390x844.png`.
- P1 geometry finding fixed: route/stay switches previously rebuilt the stopped screen and moved the road, vehicle, console, and dock. Both panels now stay mounted inside one device and only the visible inner panel toggles. Three viewports, sync + 12 animation frames + settled state returned one unique geometry each.
- P1 image/dialogue finding fixed: authored 16:9 story art was forced into a tall crop and record/outcome turns fell back to the old generic card. Story art now uses its natural ratio with `contain`; all 14 beats, decision, and outcome use the same field-report component. No report, reader, or latest-turn overflow remains.
- P2 alignment/accessibility findings fixed: hidden status tabs no longer remain focusable offscreen; route time, stay descriptions, and map-title line height fit at 320–475 px; camp actions reuse real raster icons rather than temporary emoji.
- Fonts/typography: Korean sans and mono hierarchy is stable; the final 29-state pass reports zero clipped labels or copy.
- Spacing/layout rhythm: no document overflow or escaped controls; route/stay outer frame, usable screen, road stage, and dock are invariant.
- Colors/tokens: charcoal metal, parchment, amber action, and muted teal information tokens remain consistent. Combat intentionally keeps the darker tactical treatment while retaining the same enclosure and control-size rules.
- Image quality: story images show the complete authored composition; goal/map/bag shells retain their native aspect ratio; portraits and item icons remain real raster assets aligned to measured slots.
- Copy/content: deterministic costs and effects remain visible; no future danger, encounter, or person prediction was reintroduced. Outcome headings retain the stable event title while the selected action remains available to assistive technology.
- Interactions checked: route/stay toggle, route selection/departure, goal/map/bag/menu, bag selection/repair, camp, settlement entry, 14-beat story progression, decision/outcome, combat choice, and travel.
- Console and runtime errors: zero in all 29 Chrome states.
- Regression and build evidence: story layout, golden route, Quality 9 accessibility, smoke, choice visibility, source health, event geography, `npm run verify:quick`, full HTML build, and AIT build passed.

### Iteration 11 — passed: one event instance, three consecutive states

- Source targets: `/Users/sang/Desktop/Caravan 이벤트 UI 시안/1-시네마틱-기록철.png`, `2-선택-트레이.png`, and `3-결과-기록표.png` (853 × 1844 each). They are treated as the dialogue, decision, and outcome phases of one event—not three competing screens.
- Browser-rendered implementation: `audits/event-sequence-unified-2026-08-16/390x844-01-dialogue.png`, `390x844-02-decision.png`, and `390x844-03-outcome.png`; Google Chrome, 390 × 844 CSS px, deviceScaleFactor 1.
- Responsive evidence: the same three phases were also captured at 320 × 578 and 475 × 948. `metrics.json` reports zero escaped controls and zero controls below 44 × 44 px in all nine states.
- Combined comparison inputs opened and reviewed: `compare-01-dialogue.png`, `compare-02-decision.png`, and `compare-03-outcome.png`. Each places its normalized source and implementation together at the same 390 × 844 size.
- P1 continuity fixed: dialogue, decision, and outcome previously changed the scene height and read as separate screens. All three now preserve the same outer recorder, scene coordinates, report origin, palette, and title. Only the live report content and lower interaction module change.
- P1 portrait/copy collision fixed: the portrait was an absolutely positioned tall strip and could overlap the speaker label or dialogue. Portrait turns now use a measured two-column grid with a square archival portrait, separate speaker metadata, and unrestricted wrapped copy.
- P2 result hierarchy fixed: the outcome no longer collapses to tiny equal-weight chips. A real raster result ticket separates the stamped result label, primary consequence, secondary confirmation, and return action.
- Image and surface fidelity: the field report and result ticket are dedicated ImageGen WebP assets; the established scene art, choice slips, and ledger button remain real raster assets. No placeholder image, CSS illustration, or fake SVG was introduced.
- Typography and spacing: Korean sans/mono hierarchy, parchment rules, metal edges, amber actions, and teal record labels match the approved direction. No text clipping, horizontal overflow, or malformed wrapping remains at the three tested widths.
- Interaction and accessibility: continue advances the same story instance, decision choices resolve it, the outcome returns to the road, focusable controls remain semantic buttons, reduced-motion rules remain present, and every visible control meets the 44 px mobile target.
- Runtime note: file-URL capture receives an expected 401 only from the optional `https://api.anthropic.com/v1/models` capability probe when no key is supplied; there are no page exceptions or event-rendering errors.
- Regression evidence: `npm run verify:quick`, `npm run test:smoke`, and `npm run test:accessibility9` passed. The standalone HTML build is 38,625,251 bytes, within the updated 39,000,000-byte hard release budget.
- Final fidelity finding: no actionable P0, P1, or P2 issue remains for the unified event sequence.

### Iteration 12 — passed: event typography and dark-terminal contrast

- Source visual truth: `audits/event-typography-2026-08-16/before/390x844-02-portrait-dialogue.png`, `before/320x578-03-long-narration.png`, and `before/320x578-04-long-choice.png`; browser-rendered captures at deviceScaleFactor 1.
- Implementation evidence: `audits/event-typography-2026-08-16/after/390x844-02-portrait-dialogue.png`, `after/320x578-03-long-narration.png`, `after/320x578-04-long-choice.png`, `after/390x844-05-outcome.png`, and `after/320x578-06-combat-outcome.png`; Google Chrome at 320 × 578, 390 × 844, and 475 × 948 CSS px, deviceScaleFactor 1. Source and implementation have identical pixel and CSS dimensions at each comparison viewport, so no density resampling was required.
- Full-view comparison evidence opened and reviewed: `compare-portrait-dialogue-390x844.png`, `compare-long-narration-320x578.png`, `compare-combat-choice-320x578.png`, `after-contact-sheet-390x844.png`, and `after-contact-sheet-320x578.png`.
- Focused evidence was required and reviewed because portrait/body baselines, the last narration line, two-card paging, and combat-result contrast are too small to judge from a single full phone sheet.
- P1 typography/history fixed: hidden historical transcript nodes could move the current title and reader through `:has()`. The current turn's data attributes now own alignment.
- P1 dialogue layout fixed: portrait dialogue now uses the same measured portrait/copy grid as record turns; there is no portrait/name/body overlap.
- P1 long-copy containment fixed: the 148-character narration is fully visible at 320 × 578, including the final sentence. One-choice docks use only the height they need.
- P1 responsive decision fixed: five-choice combat decisions show two cards per page on 320 × 578 and three on larger phones. All choices remain reachable; paging and visible control bounds pass.
- P1 dark-terminal contrast fixed: combat outcome copy can no longer inherit paper ink. The rendered result uses `rgb(217, 222, 223)` against the terminal and measures 14.07:1 in the regression probe.
- P2 image/layout rhythm fixed: story decisions with many choices retain at least 170 px of scene height instead of collapsing the image to 150 px.
- P2 result hierarchy fixed: combat outcomes present the selected action as the title; story outcomes retain the event title and align the result receipt as a left-reading hierarchy.
- Required fidelity surfaces: Korean sans/mono weights and line heights are stable; scene/report/dock rhythm is contained; teal/amber/dark-terminal tokens maintain contrast; real raster scene, portrait, report, ticket, and key assets retain crop and sharpness; all tested Korean copy is coherent and fully visible.
- Primary interactions tested: story next, long narration, story choice/outcome, two-page combat choice, combat outcome, return control, large text, 200% zoom, reduced motion, and focus/touch targets. Console and page errors: zero in all 18 typography captures.
- Regression evidence: `test:event-typography` passed 18 states; `test_story_event_layout.py`, `test_choice_visibility.py`, `test:accessibility9`, full `test:smoke`, and `verify:quick` passed.
- Final finding: no actionable P0, P1, or P2 issue remains in the captured and tested event-typography scope.

### Iteration 13 — passed: paper record alignment

- Source visual truth: current-run Chrome captures `audits/event-typography-2026-08-16/paper-alignment-before/390x844-02-portrait-dialogue.png`, `paper-alignment-before/320x578-02-portrait-dialogue.png`, and `paper-alignment-before/390x844-05-outcome.png`.
- Browser-rendered implementation: matching `paper-alignment-after/` captures at 320 × 578, 390 × 844, and 475 × 948 CSS px, deviceScaleFactor 1. Source and implementation are equal-size browser captures, so no density normalization was needed.
- Full-view and focused combined comparisons opened and reviewed: `compare-paper-alignment-dialogue-390x844.png`, `compare-paper-alignment-dialogue-320x578.png`, and `compare-paper-alignment-outcome-390x844.png`.
- P2 spacing/layout fixed: portrait turns forced the title to a 23% left margin and made the paper composition read as a right-hand column. The title now returns to the paper's 8% record line.
- P2 portrait/copy balance fixed: the body group keeps its exact width while its left/right margins change from 8%/8% to 4%/12%. The portrait, source, speaker, and prose therefore move left together without oversized art, compressed copy, or a new wrap regression.
- Fonts/typography: Korean family, weight, size, line height, and wrapping remain unchanged; the longest portrait dialogue is fully visible at 320 px.
- Colors/tokens and image quality: parchment, teal rule, amber speaker, metal latch, real scene art, and raster portraits are unchanged. The adjustment is positional only.
- Copy/content and interaction: no copy or event behavior changed; continue, decision, outcome, and return actions remain live.
- Current-run evidence: 18 captured states across three viewports report zero clipping, surface escape, document overflow, portrait overlap, sub-44px controls, or page errors.
- Regression evidence: `test:event-typography`, `test_story_event_layout.py`, `test:accessibility9`, and full `test:smoke` passed.
- Final finding: no actionable P0, P1, or P2 issue remains in the corrected paper-record alignment scope.

final result: passed

### Iteration 14 — passed: Goal/Bag isolation and portrait source of truth

- Current-run evidence: `audits/surface-consistency-2026-08-17/after/01-bag-medicine.png` through `06-canonical-portrait-event.png`; Google Chrome at 390 × 844 CSS px.
- P1 cross-surface state leak fixed: Goal and Bag now declare `data-tool-surface`, clear their shared body before render, and hard-hide content that does not belong to the active surface. Two repeated Bag → Goal → Bag → Goal cycles retain zero stale nodes.
- P2 Bag alignment fixed: item name, icon, and quantity no longer use three independent offsets. All use the measured 41.5% stitched-pocket content axis at six mobile viewports.
- P1 visual-source drift fixed: seven main-character portraits no longer keep stale base64 duplicates in source. The build directly embeds canonical `assets/portraits/*.png` files, and `tools/check-built-portraits.mjs` verifies byte-for-byte identity on every quick verification run.
- P1 style mismatch contained: seventeen legacy illustrated NPC portraits are withheld from cinematic dialogue until coherent replacements exist; authored scenes, speaker identity, dialogue, and choices remain available.
- Event containment: 18 portrait, narration, decision, combat, and outcome states report no text/portrait overlap, frame escape, malformed wrapping, or page error.
- Regression evidence: `test:surface-contract`, `test:event-typography`, `test:accessibility9`, `test:smoke`, `audit:portrait-build`, and `verify:quick` passed.

final result: passed
