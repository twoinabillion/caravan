# Pixel migration · production surface inventory

Prepared from the current worktree while the first integrated study awaits Sang's direction review. This is preparation, not production implementation or a declaration of visual coverage.

## Authored content footprint

`tools/content-registry.cjs` static registry was loaded in a read-only isolated Node VM, following the existing test harness. Evidence: `qa-artifacts/pixel-workshop-20261106/production-content-inventory.json`.

- 58 location nodes; node scene keys for all58.
- 7 settlements, 6 companions, 17 named NPC definitions, 28 upgrades.
- 723 registered scene keys, 315 event-scene mappings, 43 portrait keys visible in that static registry. This does not mean723 unique new scenes must be drawn; scene semantics/identity/state need explicit catalog coverage and sensible compositional families.
- 1044 permanent authored event definitions in the existing registry helper; camp-conversation definitions separately have6 top-level companion entries. Runtime-generated/conditional text and full image decoding were not executed for these counts.

## Current authoritative consumers

| Surface | Current owner | Preserve / migration risk |
| --- | --- | --- |
| Road frame, sky, weather, approach, braking | `src/05-scene.js` `draw`, `drawRoadBackdrop`, road/cue composition | Existing road uses236×128 logical coordinates with2× backing buffer; study is240×144. Choose a deliberate projection, not a fractional stretch of pixel sprites. Preserve continuous braking, facing, speed and overlay proportions. |
| Road environment / neighboring location continuity | `src/05a-road-environment.js`, `05d-route-panorama.js`, `05e-road-continuity.js`, `05f-continuous-terrain.js` | Replace high-resolution terrain sampling with the accepted pixel family without losing58 node identities, route ends, direction, weather or near/far continuity. Keep one terrain owner. |
| Actual vehicle upgrades | `src/05b-vehicle-kit.js` `draw`; `SCENE` vehicle composition | Keep real living-box stages, roof bays, riders, windows/curtains and current ownership.28 upgrades need explicit supported parts/fallbacks, not the study's fixed van. |
| Road encounter actors | `src/05c-road-cue-kit.js`; `src/04d-engine-director.js` profiles | Keep canonical named identity and discovery→deceleration→stop→dialogue. Adapt shared parts/poses rather than paste complete scene pictures on moving roads. |
| Settlement walkable scene | `src/05-scene.js` `drawSettlement`, `townPixelBackdrop` family; `src/07-ui.js` `showStl`, `settlementFieldHtml` | An existing pixel path and navigation/hit projection already exist alongside cinematic mode. Reuse state/interaction owners and unify the art catalog; no anonymous painted resident may be assigned a named identity. |
| Camp | `src/07-ui.js` `showCampHub` | Read `_campPlan`, actual `campParticipants`, `currentCampConversation`, memories and clock. A completed repair/meal is not an indefinitely active job. No companions outside the eligible roster. |
| Interior | `src/07g-ui-home.js` public `html`, `wire`; private `objects` | Preserve owned furniture tiers, keepsakes, present/departed roster distinction and inspection action. `objects` is private, not a callable exported adapter; factor the same owner only when wiring the accepted renderer. All pixels/labels must derive from the same object list. |
| Story and choices | `src/07-ui.js` `showEvent`, `renderStoryScene`, `renderStoryState`, `renderPagedStory`; `src/07h-story-pages.js`; `src/04h-engine-presentation.js` | Render scene/action/speaker state as read-only consumers. Preserve authored scene/time markers, paid entry/outcome receipts, reader cursor/high-water, actual choice owner and long records. Keep auto-advance disabled for reading. |
| Small talk / short travel speech | `src/07-ui.js` `showNpcDialogue`, speaker helpers; `src/07f-ui-road-thoughts.js` | Ambient bubbles must use actual speaker/roster and source line; avoid covering vital actors or controls on mobile. Don't fabricate authored event receipts for small talk. |
| Portraits / crew / recruit | `src/07-ui.js` `faceOf`, speaker helpers and crew screens; `src/03b-portraits.js`, `03f-npc-portraits.js` | One identity definition must supply scene body and UI portrait. Six companions and named supporting roles need a consistent family, with neutral unknown-person fallback. |
| Garage / upgrade installation / trade | `src/07-ui.js` `renderGarage`, `playUpgradeInstall`, `renderTrade`; item art registries | Same part silhouettes/materials as the actual vehicle, preserve selected item and resource semantics. |
| Intro / arrival / title / ending / previews | `src/07-ui.js` `renderIntro`, `renderPreview`, arrival renderer, `showEnding`; `src/05-scene.js` `drawTitle` | Replace default visual consumers consistently; retain story timing, route/arrival distinction, reader legibility and terminal state. Preserve HD originals for optional access proposal. |
| Maps, notebook, records, combat and off-road | `src/06-mapgraph.js`, `07-ui.js` maintained panels, `07d-ui-quests.js`, `08-offroad.js` | Inventory their picture/portrait consumers and preserve usable controls. A world migration must not leave an unrelated cinematic thumbnail family on ordinary gameplay panels. Long text and records remain readable. |

## Required production proofs after direction review

1. Explicit catalog/fallback coverage for all named identities, location families, upgrade parts and ordinary visual consumers. Compare road→arrival→hub→event→camp→interior under the same party/time/weather.
2. Save/RNG/resource/paid-receipt equality for actual actions and reload; no presentation-time effects, costs or invented resource progression.
3. Real action start/paused/speaking/completed/absent behavior, not only demo hash states. Test empty and full rosters, departed keepsakes and partially completed tasks.
4. Content extension from local parts/data: add a new identity/tool/prop/pose/location family and verify visuals and controls at actual game scale. The study proves a small family, not arbitrary body plans.
5. Mobile320/360/480 and desktop, short landscape, large text, reduced motion, reachable choices and return paths. Actual independent Chromium evidence is not physical-device performance or a human playtest.
6. Complete source/build regression suite plus fresh gameplay flows spanning beginning/arrival/story outcomes/camp/interior/ending and reload. Historical8598 passes from the previous slice are not new migration verification.

No item in this section has yet been credited as production completion. The active Goal remains game-wide.

## Actual state baseline verified while awaiting visual direction

`node tools/audit-pixel-state-contract.cjs` runs the current real engine and HOME public API in an isolated VM/store. Evidence: `qa-artifacts/pixel-workshop-20261106/state-contract.json`, including exact source hashes. It establishes eight baseline contracts, not a new renderer or proof that the current study is state-connected:

- All64 companion rosters ×5 recruitment stages (320 cases) use `G.campParticipants()` without writing state/storage. Road/follow/ready guests can join camp; task-stage/absent actors cannot be invented. Camp eligibility and ordinary party/interior presence have different owners.
- All64 rosters retain only present companions' physical keepsakes and preserve departed companions' saved memories as records. Sleeping furniture tiers show only the owned highest replacement.
- `prepareCamp('repair')` charges one part, sets `plan.repair`, leaves clock/current hull unchanged and reserves the existing sleep recovery. It is a settled preparation marker, not a persisted ongoing work timer. Repeating the action is rejected without another charge.
- `prepareCamp('meal')` consumes food/water and resolves hunger immediately, without elapsed clock time. `plan.meal` is already consumed; animation/reading may not repeat effects or turn it into unpaid cooking progress.
- Opening a talk and reading its event20 times does not advance the clock or change state/storage. A real explicit choice applies15minutes; its paid result survives save/load and does not pay again. Prior-night conversations are not current actions.

Production needs a presentation-only action lifecycle for momentary gestures; do not infer ongoing jobs from these saved booleans. The real choice/action owner keeps all costs and elapsed time. These findings correct the implementation approach before any production visual wiring.
