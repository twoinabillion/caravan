# Caravan Cohesion Implementation Plan

Completed2026-09-21. Source89198f3, original4176 integrated with save preserved. Evidence: `audits/cohesion-2026-09-21/IMPLEMENTATION.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task, with independent task reviews and a broad final review. Read only your extracted task brief plus the spec. No worker may spawn subagents.

**Goal:** Deliver the approved whole-game cohesion improvements into Sang's actual local4176 game with current saves preserved.

**Architecture:** Retain current engine and presentation receipt. Add explicit authored narrative direction in existing data owners; maintain fixed story viewport plus a review view from the same transcript. Distinct settlement rendering uses existing facility interactions. Home rendering derives from existing party/upgrades/memories. No new progression subsystem.

**Tech Stack:** Vanilla JavaScript, HTML/CSS, Canvas2D, existing Node build and tests, CUA visual verification.

**Spec:** `docs/superpowers/specs/2026-09-21-caravan-cohesion-design.md`

## Global Constraints

- Work only in `/Users/sang/caravan/.worktrees/caravan-cohesion-20260921` until controller integrates verified files into original4176.
- Preserve version8 saves, event/choice identities and order, requirements, probabilities, resource effects, chains, note deduplication identity and canonical father/mother/6412/TIANYAN outcomes.
- Modify source owners; never hand-edit generated HTML; no new competing final/emergency CSS override. No external publish/push. Commit only owned files in isolated branch.
- CUA is the only browser automation surface. No shell Playwright or app-state injection through browser evaluate. Engine/DOM-free Node tests and explicit development fixture servers are allowed. Root owns visual verification.
- Accepted passenger palette: #142826/#0b1718/#eee9d9/#b0b5aa/#c29958; existing Black Han Sans display and Korean sans body. Preserve settings accessibility and forecast readability.
- Independent tasks are implemented sequentially; root performs useful inspection, asset preparation and integration/visual checks alongside a running worker. Read-only review may be independent. No child subagents.

### Task 1: Authored story integrity and human-scale editing

**Files:** `src/03-data.js`, `src/03j-camp-conversations.js`, `src/03k-main-evidence.js`, `src/03m-finale-reading.js`, `src/04e-engine-world.js`; new `tests/test_cohesion_narrative.cjs`. Do not edit07UI,CSS,05scene or builder.

**Interfaces:** Existing `event.turns(S)`, `event.turnSpeakers`, `choice.out[].turnSpeakers`, `readingRecord(S)`, `G.campConversationEvent()` and persisted camp context. Optional `event.inspection` is `{title,items:[{id,label,text}],prompt}` with authored evidence only, no hidden outcomes. Task3 renders it as an optional in-scene physical evidence surface; normal choices remain reachable. Tell root exact ids used.

- [x] Write a Node vm regression using actual data plus extracted `UI.storyTurns` parser if feasible, or authored turn semantics if parser needs DOM. Expected first key mappings: `loc_mingyu`→mingyu; `pss_forgive`→anonymous patient relative (not parkss); `kw_base` recollections→kangwoo; `leo_broadcast` song intro→leo; `loc_jaeyi_cache` quote→neutral record named 재이 아빠의 분필 글씨 (not protagonist father or jaeyi). Check all result quotes too. Confirm failure on baseline before fixes. Existing olderworktree code is a reference, not automatic proof or a file to copy wholesale.
- [x] Add explicit roles and preserve actual source text/branches. Inspect every authored key quote/result for six personal payoff events including es_backdoor. In non-explicit prose do not introduce a new broad fragile inference heuristic.
- [x] Correct 도윤/유나 sibling inconsistency. Condense optional historical industrial lecture while retaining fiction canon; keep the family viewpoint. Give father-last-log and mother-reunion explicit meaningful beat progression and correct records/speakers; keep legacy text as optional reading record.
- [x] Implement authored inspection surfaces for `main_transfer_testimony` and `main_command_ledger`: witness/object strips expose the evidence the player can compare, with no unseen-future spoiler, no added costs or auto-completion. Renderable plain text only. Avoid duplicating the entire default narration in each strip. Preserve existing choices and outcomes.
- [x] Replace camp raw combat summaries with human/context-specific phrasing, without writing a success memory for a failure. Preserve frozen choice/context receipts, no extra effects on reload. Edit repetitive recruitment fidgets selectively, retaining character voices and concrete objects.
- [x] Compress default `seoul_uplink_reveal`/`seoul_session_reset` and their outcomes into brief explicit turns while preserving existing text in readingRecord and all effects/chains. Keep current victory and costs. Existing chosen departure/camp recall remains; no unchosen action implied. Standard finale tests may require intentional tighter-turn expectations, never weaken choice/effect invariants.
- [x] Run new test, `node tests/test_finale_reading.cjs`, data content checks relevant to edits. Capture exact commands/results and red/green. Commit owned files and write task report including changedIDs, compatibility evidence, root visual cases.

### Task 2: Distinct settlements and stateful home space

**Files:** `src/05-scene.js`; new `src/07g-ui-home.js` if useful; new `tests/test_cohesion_places.cjs`. Root/Task3 handles its build registration and UI hook. Do not edit07UI,CSS,03data.

**Interfaces:** Existing `SCENE.initSettlement(canvas,options)`, facility ids/callbacks, `walkSettlement`, `settlementState` stay compatible. New `SCENE.drawHome(canvas,{party,up,memories,keepsakes,weather,night})` if implementing canvas; or `HOME.html(state)` and `HOME.wire(container,state)` for an accessible HTML/SVG scene, with no global gameplay mutations. Props are keyed by actual upgrade/companion ids. Use existing canonical art/portraits; new raster requires root handling contract.

- [x] Read existing settlement map/collision/facility selection ownership completely. Define distinct per-city arrangement compatible with clickable destinations. For path logic changes write a failing Node test for all7 destination reachability and layout distinctions before implementing.
- [x] Implement seven readable structural variations: narrow market alley(miryang), communal square(gwangju), curved stadium(daegu), enclosed tunnel(muju), hanok courtyards(jeonju), connected labs(daejeon), wall/gate road(suwon). Reuse atlas but change ground/canopy/building placement and occlusion meaningfully. No new road renderer/raster pixel art. Verify labels and hit targets remain on valid walkable areas.
- [x] Implement one legible Dalguji living space derived from existing data, not an array of identical cards. Show only owned/present companions' objects and installed living upgrades; memories may remain when companion departed. Bed/tool shelf/table/roof choices should be spatial. No decorative controls; object activation reveals the actual stored memory or upgrade effect, escaped, keyboard accessible. Empty state is still an empty vehicle space. Keep optional descriptions out of the primary scene.
- [x] Support320px without clipping and desktop placement under root's container. Ensure drawing state restored after canvas calls and no perpetual timers/listeners. Test no phantom companion/upgrade, actual memory is escaped/present and object ids stable. Root will screenshot populated/empty states and all7towns.
- [x] Commit owned files and report exact public interface, tests, root hook instructions and concerns.

### Task 3: Passenger story reader and cohesive supporting screens

**Files:** `src/07-ui.js`, `src/01-style.html`, `src/02-dom.html`, `src/07d-ui-quests.js` only if notification ownership requires it; `src/04h-engine-presentation.js` for sanitized reading view fields and optional deferred quest-notice acknowledgement; `tools/build-html.mjs` for Task2home registration; new `tests/test_cohesion_reader.cjs`. Update directly related old tests only when semantics intentionally change, preserving effect/restore assertions.

**Interfaces:** Existing `curStory`/`G.capturePresentationView`/`pendingPresentation.view` remain state owners. `storyDisplayTurns` retains event+chosenaction+outcome. Render current meaning unit in fixed panel; render already-read transcript in review mode. No new save namespace. Consume Task1 `inspection` and Task2 home API as reported.

- [x] Search every story selector and !important owner first, map winning layout. Write failing logical reader tests for visible current slice, review range excludes unread turns, history close restores index, outcome appears once, and resume does not replay gameplay. Expose a small pure helper only if it serves real renderer; avoid static-string mirroring tests.
- [x] Replace growing default story transcript with stable scene+current reading+bottom choices. Preserve full read transcript in a reachable 기록 control; same event chosen action and reaction stay continuous there. Keyboard/touch advance must consume input correctly. Record interaction must not advance story. Save/reload in event and result retains index, review state where supported, effects once. Intro may use same visual language while preserving its optional full flow.
- [x] Rework existing story owner block to passenger material/type. Desktop uses separate scene and reading columns; mobile keeps readable current text and fixed bottom action group with internal overflow for large text/long choices. No wholesale narrowing font to fit. Keep combat separate and its forecasts/requirements intact.
- [x] Render Task1 inspection items as real selectable evidence objects/sources in an optional view that returns to same reading state. Mark inspected only in presentation view if needed, not gameplay progression. Do not hide actionable choices behind an unexplained gate.
- [x] Fix GRAPH.draw on end, format journal wikilinks as safe labels/links through current note graph navigation (no raw brackets), correct Korean destination particle. Suppress unrelated mission/perk suggestion in key story outcomes while preserving ledger unread information for later.
- [x] Remove meaningless camp/field counters and generic craft instructions, label rescue/convoy according to actual activity. Apply passenger palette/type and clearer hierarchy to companion detail/garage/camp/Seoul/end without duplicating CSS owners. Keep useful costs and accessibility options. Render Task2 home at camp and/or companion surface.
- [x] Normal and failed ending displays use actual present cast/keepsakes/chosen departure to give a journey-specific closing image/space with concise prose. No invented choice or unearned memory. Stats secondary. History/current chosen result readable. Fix new-game adult vs child portrait assignment.
- [x] Run focused Node tests and existing identity/finale contracts; commit owned files, report CSS owners/reader state contract and root visual matrix. Root performs browser verification before accepting.

### Task 4: Asset alignment, integration and final validation

**Files:** Controller-owned `assets/scenes/leo-broadcast-room-v1.webp` only if needed; delivery WebP exports of the already-approved prototype UI panel/button in `assets/ui/`; `src/03g-scenes.js`, small observed pixel material/use-detail refinements in `src/05-scene.js`, linked-note selection repair in `src/06-mapgraph.js` and `tests/test_cohesion_graph.cjs`, build asset mapping if needed; affected docs and audit records; `tests/test_content_registry.py` stale fixture repair; original source integration after all reviews.

- [x] Read IMAGE-BIBLE and visual-contract, inspect canonical refs. Prefer an existing correct radio-room scene if identity/location fits; otherwise imagegen exactly one broadcast-room scene with Leo + Dalguji only if visible, no unrelated characters. Inspect new art in live gallery and final in-game crop. Do not use prototype passenger-scene as canonical art.
- [x] Build only after component commits are ready; current disk is constrained. Keep exact HTML hash and command results. Run `node tests/test_cohesion_narrative.cjs`, places, reader, finale, identity; `python3 tests/test_source_health.py`; lint/content/build/portrait checks. Root must distinguish scripts from pytest: baseline source-health was mistakenly invoked with pytest and collected0; run script correctly. No shell-controlled browser tests.
- [x] Through CUA on isolated origin: fresh intro selection/result; actual main+companion speaker scenes; history open/close and reload;320×568large,390×844,desktop; long choices/combat;7towns; empty/populatedhome; family rejoin; Seoul3decision results, one continuous common end; endjournalgraph; return/back next action. Report fixtures honestly, not a new fullcampaign unless actually played.
- [x] Independent whole diff review on strongest model, resolve important findings with one bounded fix wave plus rereview. Preserve backup/current dirtyoriginal changes. Compare originalmanifest before copy; copy only owned source changes and newassets into original, build original, inspect4176 after applying live update. No publish/push/main merge.
- [x] Update docs/CURRENT, report/ledger and director memory with implemented vs remaining, exact validation and visual limits. Retain worktree and audit evidence for recovery. Final concise Korean outcome links plus actual4176address.
