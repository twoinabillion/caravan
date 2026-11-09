> **2026-11-07 후속 사용자 결정:** 전체 픽셀 전환을 이전 고화질 버전으로 롤백했다. 이 계획은 완료된 실험의 이력이며 현재 구현 지시가 아니다. 현재 근거는 `qa-artifacts/hd-rollback-20261107/restore-manifest.json` 및 `docs/CURRENT.md`.

# Caravan Pixel Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline. A fresh independent review checks the integrated production result before completion; no per-task implementer delegation.

**Goal:** Apply the approved recognizable pixel world throughout the real Caravan game, with extensible local assets and preserved gameplay/save behavior.

**Architecture:** Compile the accepted editable profiles/poses, original pixel world and vendored CC0 sprites into one local render kit. A pure presentation module supplies canvas drawing and SVG URIs; existing engine/state/reader owners remain authoritative. Presentation adapters resolve original scene/portrait keys without rewriting canonical data or saved receipts.

**Tech Stack:** Current vanilla JS/canvas single-HTML game, Python/Pillow offline compiler, embedded JSON/vector kit, current Node and Chromium QA.

**Spec:** `docs/superpowers/specs/2026-11-06-extensible-pixel-world-design.md`, original goal attachment, and `2026-11-06-pixel-production-inventory.md`. Accepted reference: `pixel-characters-v1` plus the prior pixel journey/world study.

## Global Constraints

- Sang explicitly approved “이 방향으로 전체 게임 전환 계속” for the revised six-character face/body/gesture direction on2026-11-07. The direction-review gate is satisfied; do not ask again for routine implementation phases.
- Preserve all original HD source bytes and original data/scene/portrait keys, story text, choices, RNG, resources, time, receipts, save schema and user session.
- All ordinary game visuals must become coherent pixel visuals; a prototype or one opt-in event is not completion.
- Named character identity anchors remain fixed across shared outfit/tool customizations. New content is editable locally without creator updates or runtime external services.
- Use existing source/build/live owners. Never hand-edit generated game HTML. Structural apply remains explicit; don't replace the user's save or force-refresh their screen.
- No commit, push or public deployment requested. Baseline production sources and dirty patch are preserved in `qa-artifacts/pixel-production-20261107/`.

## Review Focus

- Guest/present/departed/historical actors differ by context; a current party cannot overwrite a saved memory's cast/time.
- Paid preparation booleans are not ongoing work clocks. Animation/reading must never pay costs or advance time.
- Sparse/missing data needs a coherent pixel fallback and readable controls, not unrelated cinematic art or invented people.
- Current236×128 road canvas and accepted240×144 study require deliberate pixel projection; keep hit regions, braking, upgrades and scale coherent.
- Long/large text, short landscape, reduced motion and replay must preserve reading/choice reachability and avoid hidden duplicate motions.

## Task 1 — shared local render kit

Files: create `tools/pixel-workshop/compile-kit.py`, `assets/pixel-world/kit-v1.json`, `src/05g-pixel-world.js`, `tests/test_pixel_world.cjs`; modify `tools/build-html.mjs`.

Interfaces: compiler emits schema1 with people[id].frames[pose][expression][frame], portraits, material roles, imported sprite frames and world parts. `PIXEL_WORLD.active()`, `drawActor(ctx, options)`, `portrait(id, expression)`, `drawSprite(ctx, options)` are pure presentation APIs. No reference to mutable `S`, `G`, storage, timers or RNG.

- [x] Write failing renderer tests for real compiled six identities/poses, data-only unknown-profile/tool extension, reduced motion, invalid inputs, source immutability and canvas save/restore.
- [x] Compile accepted source parts into integer local drawing commands, preserving per-head/frame/hand geometry and provenance.
- [x] Implement canvas and SVG consumers from the same commands; include kit synchronously in the existing HTML builder before SCENE/UI.
- [x] Verify focused tests, compiler determinism, original hashes and actual canvas/portrait render parity.

## Task 2 — real-state scene/identity registry

Files: `assets/pixel-world/scenes-v1.json`, `assets/pixel-world/people-v1.json`, common presentation APIs in `05g-pixel-world.js`, focused tests.

Interfaces: `sceneModel(state, context)` reads actual location/clock/weather/roster/upgrades plus owner-supplied historical scene time, actor eligibility and action/reading phase. `sceneURI(model)` and `drawScene(ctx,model,time)` share a semantic registry. No generic scene resolver may rewrite saved keys or infer an ongoing job from `_campPlan`.

- [x] Inventory all actual ordinary scene/portrait/item consumers, all58 locations,7 settlements,6 companions,17 NPCs,28 upgrades and current scene mappings. Keep a requirement coverage registry with explicit fallback/identity gaps, not misleading green counts.
- [x] Add current canonical player/supporting identities from inspected references; anonymous fallbacks are explicitly anonymous.
- [x] Add scene families and location features/materials while preserving Korean geography and route continuity, phase/time markers and event origin.
- [x] Test empty/full/guest/departed rosters, historical scenes, completed preparation, selected speaker, malformed legacy snapshots and no-state/no-RNG mutation.

## Task 3 — road/vehicle/settlement

Files: existing `05-scene.js`, `05a-road-environment.js`, `05b-vehicle-kit.js`, `05c-road-cue-kit.js`, `05e-road-continuity.js`, `05f-continuous-terrain.js`, settlement UI owner as needed.

- [x] Connect pixel terrain while preserving58 locations/78 roads, reverse direction, clock/weather and continuous distance-owned transitions.
- [x] Connect accepted vehicle parts without flattening actual living-box stages, roof bays, installed upgrades, riders, curtains, wheels or braking.
- [x] Use shared named actors and valid anonymous roles during approach; keep discovery→deceleration→stop→event timing.
- [x] Use existing settlement navigation/hit projection with pixel environment/people; preserve every facility/action entry and real occupancy.
- [x] Verify actual drive/arrival/hub actions, route edges, scale, weather, roster and upgrade combinations at supported sizes.

## Task 4 — camp/interior/story and all visual consumers

Files: existing `07-ui.js`, `07g-ui-home.js`, `07h-story-pages.js`, CSS/DOM owning sections; visual registry/build module.

- [x] Replace camp/interior art using current participant, furniture/keepsake and action lifecycle owners. Separate momentary action playback from already-paid preparation.
- [x] Resolve canonical portraits/scenes to shared pixel views in events, intros, title, arrivals, endings, previews, crew, garage, trade, map/notebook/records/combat/off-road wherever pictures occur.
- [x] Short life speech appears in-world; deliberate long reading/choices stays below the same scene. Speaker gestures/expressions respond to actual reader phase; no automatic text advancement.
- [x] Preserve all original cursor/paid scene keys/text/resource feedback and long record behavior. Propose optional HD-original access outside ordinary play without changing records.
- [x] Verify actual entry→read→choice→outcome→close/back→reload and terminal paths, ownership and no double charge.

## Task 5 — production evidence and full completion audit

- [x] Full source suite and relevant content/save/determinism/build checks with current hashes; fix regressions without weakening preserved mechanics contracts.
- [x] Separate real gameplay browser journeys spanning road, each surface, companion dialogue/choice/results/camp/interior and ending; mobile/desktop/short landscape/large text/reduced motion; capture exact rendered states and source freeze.
- [x] Offline/local render dependencies, data-only new content extension, retained HD bytes and all visual-consumer coverage.
- [x] Fresh independent review, reproduce/fix material findings, then audit every original goal clause. Report actual screen/device/audio limits accurately.
- [x] Only then mark the full Goal complete. No prototype, mapping count or source test alone proves that state.

## Ledger

2026-11-07: revised identity study approved by direct async-question response. Prior blocked gate superseded. Production plan starts from existing dirty preview workspace; baseline source tar/hash+binary diff preserved, new branch `codex/pixel-world-20261107` created without discarding/committing changes. Ruling: work in the existing live workspace to preserve its uncommitted authorized changes/current preview; no second checkout or auto-apply to user save. Cost if wrong: additional baseline patch comparison at review. No installation needed; existing Node/Python/Pillow/Playwright available.

Pre-flight: shared compiler schema consumed by canvas/SVG, scene registry and UI adapters must have one owner. Road coordinate projection and old saved scene keys are integration constraints, not reasons to alter game geometry/state blindly. Task2/3/4 depend on Task1 APIs; implement those tests first.

Task1 recorded complete locally in `.superpowers/sdd/2026-11-07-pixel-production/progress.md`; whole source8653/8653 and actual kit/browser evidence retained. Task2 in progress;50 actual portraits supersede limited43 static count. No full-game completion claim.


Final closeout2026-11-07: all tasks complete. Original-clause audit and explicit fallback/QA limits are in qa-artifacts/pixel-production-20261107/COMPLETION-AUDIT.md; current source8713/8713, compiler5/5, production browser flow,3actual-engine terminal journeys+9earned-ending browser layouts, localHTML/AIT aliases and independent review verified. This local migration completion does not publish/commit/apply the user's session or claim723unique hand-authored illustrations/physical-device performance.
