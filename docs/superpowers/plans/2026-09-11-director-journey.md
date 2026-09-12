# Caravan Director Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement and verify the complete director improvement pass from 부산 departure through all three 서울 decisions.

**Architecture:** Keep the existing event/effect/save engine and add focused authored data and narrow integration points. Recover long-lived choices through saved state, use real UI transitions, and verify a complete route without fixture grants. Keep source changes in an isolated copy of the user's current work.

**Tech Stack:** Browser JavaScript, HTML/CSS, Canvas, Node build tools, Python Playwright tests; no new runtime framework.

**Spec:** `docs/superpowers/specs/2026-09-11-director-journey-design.md`

## Global Constraints

- Source changes belong under `src/`, `assets/`, and `tools/`; never hand-edit generated `서울까지400km.html`.
- Preserve existing saves and unrelated work.
- Player-facing navigation terms are `메인 스토리`, `사이드 미션`, and contextually `동료 미션`.
- Do not expose outcomes/rewards on active objective cards.
- Read the image bible and visual contract before changing raster assets; attach required references when generating.
- Keep one CSS owner per component; no appended emergency overrides.
- Use headless isolated sessions for automated play and captures; leave personal browser saves and windows alone.
- Build/test in `/Users/sang/_workspace/caravan-director-20260911`.
- The complete journey, both route alternatives, six recruitment flows and three final decisions remain required.

## Task 1: Playable, saved departure

**Files:** `src/03-data.js`, new focused opening data/engine module if warranted, `src/04a-engine-core.js`, `src/04c-engine-travel.js`, `src/04d-engine-director.js`, `src/07-ui.js`, `src/02-dom.html`, existing owning intro/event CSS in `src/01-style.html`, `tools/build-html.mjs`; tests `tests/test_director_opening.py` and affected existing intro/profile/save tests.

**Interfaces:** New-game UI calls `G.newGame('onroad', name, 'interactive', profile)` then enters the normal game/event shell. Preserve existing explicit legacy `full`/`summary`/`skip` callers and saves. A saved `S.opening` object owns step, pending result and decisions. Define `G.openingPending()` to return the current authored event or null and `G.resolveOpeningChoice(stepId, choiceId)` (or an equivalently narrow effect integration) to apply each decision exactly once. Use the established result/continue UI and public engine APIs; do not add an unrelated second story renderer.

- [x] Write and run failing behavior tests: a fresh UI journey reaches an actual choice after at most eight short text turns; at least two choices alter resources/time differently; travel is unavailable until departure; reload before and after a choice preserves stage, pending result and costs; double activation does not double-charge; completion reaches ordinary road UI; legacy saves do not restart opening.
- [x] Implement four or five short event scenes: workshop identity, family bus repair, relocation/failed appeal, parents' module, departure. A safe resource-free alternative must keep every starting profile viable. Avoid long political/history exposition before the first choice.
- [x] Keep the established longer prologue accessible as optional history/replay. Do not claim it was played during the short opening; adjust the hard-coded 17-chapter label to its actual content.
- [x] Record opening decisions in the journey journal and expose them for later callbacks. Preserve the canonical facts required by the downstream family story.
- [x] Run `npm run build:html`, `python3 tests/test_director_opening.py`, relevant intro/profile/save tests, and inspect 390×844 and 320×578 screenshots for the choice, result and departure.
- [x] Commit only this task's source/tests/docs on the isolated branch; write exact tests, outcomes, captures and limitations to the task report. Task review includes spec and quality.

## Task 2: First night and six companion voices

**Files:** `src/04e-engine-world.js`, `src/04a-engine-core.js`, `src/04b-engine-crew.js`, focused camp data module, `src/07-ui.js`, owning camp CSS, companion visual data; `tests/test_director_camp.py` and recruitment/profile tests.

**Interfaces:** Consume existing `S.lastCombatReport`, recruitment approach/temporary guest state, journey recaps and saved opening decisions. Save a camp conversation identity and resolved choice; each night may have one substantial chosen conversation, and closing/reloading must not duplicate bond or costs.

- [x] Write failing tests for first-night temporary guest inclusion, actual selected dialogue, previous-event context, once-only outcomes and save/reload.
- [x] Adapt the strongest existing follow-up beat into travel/camp before voluntary joining, with distinct dialogue for all six companions. Selecting a person must show a specific exchange, not only a generic caption.
- [x] Make the choice leave an individual keepsake/behavior in the home and next travel segment. Maintain honest preview, pending/resolved labels and time-of-day copy.
- [x] Verify all six recruitment chains including cancel/revisit, insufficient seats/resources, night, join and saved continuation; inspect first-night and established-camp screens.
- [x] Commit and complete task review.

## Task 3: Main-story evidence and optional companion arcs

**Files:** `src/04e-engine-world.js`, `src/04f-engine-quests.js`, `src/04a-engine-core.js`, `src/03-data.js`, `src/03i-story-expansion.js`, objective UI; `tests/test_director_progression.py`, parent/finale/Seoul tests.

**Interfaces:** `G.mainStoryReady()`, `G.seoulReady()`, `G.pillars()`, `G.seoulMissing()`, `G.departureSteps()` and displayed mission steps must agree on reachable main-story evidence. Old companion deeds remain valid; arbitrary arc quota cannot be an undisclosed main-story gate.

- [x] Trace each currently required flag to its event and legitimate entry path. Write failing tests for a main-story route without optional arc completion and actionable missing-evidence hints.
- [x] Author explicit testimony/record opportunities on the main route; preserve human confirmation, verified module, family truth and mother broadcast. Integrate companion-specific evidence as alternatives and fuller personal payoff.
- [x] Update objective classification/copy and preserve legacy completed evidence. Test late saves, partial evidence and skipped/revisited optional content.
- [x] Build and verify representative full progression to the gate. Commit and review.

## Task 4: Choices, tactical advantages and callbacks

**Files:** `src/03-data.js`, `src/04b-engine-crew.js`, `src/04d-engine-director.js`, `src/07-ui.js`; choice/combat/determinism tests and `tests/test_director_choice_consequences.py`.

- [x] Write failing tests for distinct scanner methods and an actual tactical benefit for riskier rush actions, while every core-clue choice preserves progression.
- [x] Show foreseeable method costs/risks without exposing uncertain results or quest rewards. Distinguish immediate expense, threat exposure and persistent action consequences.
- [x] Connect preparatory combat actions to the next phase; carry at least the major opening/scanner/local/companion decisions to a later encountered scene, place or journal/ending consequence.
- [x] Verify success/failure/retreat, insufficient requirements, save/load and seeded determinism. Inspect full action lists and results on narrow screens. Commit and review.

## Task 5: Seven city concerns and travel rhythm

**Files:** settlement/road data, `src/04c-engine-travel.js`, `src/04d-engine-director.js`, `src/04e-engine-world.js`, settlement UI; city/field/route/beat tests and journey audit.

- [x] Record actual event sequences and city entry states. Test main beats and ordinary events are reachable without breaking their geography, knowledge or companion conditions.
- [x] Foreground each city's existing person/problem; connect help to visible city and departure consequences, with working return and revisit paths.
- [x] Tune guaranteed beats, ordinary-event slots and quiet intervals using observed complete journeys. Fix the cause of pacing failures rather than lowering checks.
- [x] Verify both 김천 route alternatives including rescue/escort, seven city day/night hubs and saved impact. Capture representative local before/after states. Commit and review.

## Task 6: State-consistent art and mobile hierarchy

**Files:** `src/03g-scenes.js`, scene-selection UI, assets and contracts as needed, existing CSS owners; asset and mobile layout tests.

- [x] Build a concrete cast/outcome mismatch list from high-exposure opening, recruitment, road, combat, city and ending scenes.
- [x] Reuse suitable canonical art or generate replacements with required references. Inspect gallery before wiring, then exact game crop. Solo/postman and rescue-before/after are mandatory cases.
- [x] Improve secondary-text readability and reduce framing/duplicate panels where it hides the next action. Verify selected, disabled, empty and long-content states at 320×578, 390×844 and desktop.
- [x] Run asset geometry/reference validators and visual QA. Commit and review.

## Task 7: Journey-specific finale and epilogue

**Files:** final story data, world/progression engine, event/effect/save UI integration and one focused pending-presentation module if warranted; `tests/test_finale.py`, `tests/test_seoul_sequence.py`, new consequence and pending-save coverage.

- [x] Enumerate the three decisions, operational trade-offs and existing journey callbacks; write failing tests for missing actual payoff and continuity.
- [x] Make the player's earlier help, evidence method, companion/home decisions and city outcomes appear coherently at the finale. Preserve father/mother canon and the completed Seoul victory.
- [x] Implement one validated, pure-data pending-presentation save contract for ordinary events/results and the finale. Reuse opening/camp owners; restore through normal Continue without rerolls, duplicate effects/counters, lost offers or lost close-to-chain transitions. Preserve legacy/partial/corrupt saves and accepted geographic chain routing; legacy reconstruction must not invent a past choice/result.
- [x] Verify all five Seoul stops and three decisions, choice requirements, pending-result reload, one-time finalization and exported journey record. Capture each decision and epilogue. Commit and review.

## Task 8: Complete campaign and branch verification

**Files:** `tools/` complete-campaign runner, `tests/` reusable journey helpers, audit reports/captures.

- [x] Extend or build a runner that starts through the real UI, follows legitimate travel/quest/camp/recruitment/resource APIs and never grants progress flags or resources after start. Keep diagnostic fixture tests separately labelled.
- [x] Complete at least one main campaign from new game to ending; run both major route alternatives, all six full recruitment flows and all three finales with traceable preparation. Record visited nodes, choices, resource history, evidence, saves and terminal outcome.
- [x] Test save/reload during opening, travel, recruitment, camp, story result and Seoul. Capture normal-speed representative sequences as well as deterministic accelerated test traces.
- [x] Run relevant regressions and triage all failures. Keep the goal active if any required journey cannot finish or any verification is indirect.
- [x] Independent whole-change review against this spec and the original objective; fix material findings.

## Task 9: Integrate and deliver the improved local build

- [x] Compare original-source hashes with `artifacts/director-pass-2026-09-11/source-baseline-hashes.json`; merge any intervening work without overwriting it.
- [x] Apply reviewed changes back to `/Users/sang/caravan`, build HTML/AIT, and verify actual original-project live screens with preserved saves.
- [x] Update `docs/CURRENT.md`, final audit, director checkpoint/memory and user-facing notes. Provide local build paths, captures, director assessment and prioritized remaining issues.
- [x] Audit every row in the spec's completion table against authoritative current evidence before marking the goal complete.
