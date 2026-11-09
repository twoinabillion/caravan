# Opening Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the opening's preparation, consent, diagram and first-road choices clearer through short visible actions and responses, with old reading/payment ownership intact.

**Architecture:** A copied `D.openingFlowV1` presence table is selected only by `S.opening.proseRevision==='opening-flow-v1'`, stamped by new interactive games. All old opening definitions, indices, naming and farewell remain. Ordinary first-road result prose uses its existing saved narrative-revision owner; entry facts and all mechanics remain unchanged.

**Tech Stack:** Existing vanilla JavaScript, current reader/document components, Node22 full HTML/AIT build. No new package, image, layout, CSS or renderer.

**Spec:** Sang approved the proposed first20-minute dialogue/choice/travel-flow priority with “ㄱㄱㄱ”. The preceding commentary narrows this implementation to four scenes. It follows the approved important fact/action → character reaction → choice direction. Human20-minute pacing is a target, not a measured result. User requested execution without another planning/permission stop.

## Global Constraints

- Preserve HD scene/portrait bytes, current UI and manual Unicode reading.
- Preserve all original choice IDs/order/labels/requirements, costs/effects/notes, RNG, inventory and timing. Do not grant the still-mounted key or missing pages.
- Preserve historical `D.openingDeparture`, `D.openingPresence`, name interlude and farewell, including paid/no-view results; absent/unknown markers never opt in on load.
- Opening index count stays five; the naming interlude and zero-cost farewell use existing handoffs. Core stays within1279 lines.
- Ordinary first-road entry facts and physical-document anchors stay exact; old paid outcomes retain frozen text/history/keys/cursors.
- Current source/bundle is extensively dirty. No reset, commit, push or deploy; no user-profile/new-save substitution. Actual browser/device gaps are reported separately.

## Review Focus

- Captured versus viewless old opening payments must both return the old edition with `applied:false`.
- Unknown or absent optional prose markers, original opening versions and full/summary/skip entry must retain their old flow.
- Named/unnamed entry and all three repair paths must keep the name interlude, correct speakers and once-only first-road queue.
- Current/memory/current appeal markers, actual diagram facts and two-page warning must survive source/paged reading; no promise of a cure/cancelled transfer.
- First-road20/35/10-minute choices and pursuit cost must equal the old effects, resources and RNG; only future-revision result prose changes.

### Task 1: Future opening edition

**Files:** `src/03o-story-refinement.js`, two existing owner lines in `src/04a-engine-core.js`; new focused `tests/test_opening_flow.cjs` and appropriate existing opening tests.

- [x] Pin RED tests for new-only opt-in, unknown/absent legacy markers, paid-before-view and captured-view reload, unchanged actions/notes/RNG, naming/farewell/once-only queue.
- [x] Copy the presence table without mutating its turns/choices/outcomes or nested effects; select the copy only on explicit marker. Stamp marker only at new interactive initialization. Keep name and farewell unchanged.
- [x] Bus: replace the first narration with equal-scale text reflecting the actual workshop preparation decision, neutral without that receipt. Preserve fever/characters and all original scene indices. Add one short Doyun response only to the scrap-collar outcome, keeping the original repair/recheck facts.
- [x] Appeal: supply the missing “이의 신청” antecedent after the memory, and let Hajin answer the already-selected name-consent request; retain original paper/refusal/population anchors and complete industrial-history record.
- [x] Module: split the existing first paragraph into physical discovery and its exact remaining explanation as narration, keeping every fact, player thought, missing-two-page/burn warning and mother's full memo. Do not invent literal text on the diagram. Keep both actions and inventory effects unchanged.
- [x] Run actual current UI reader expressions and saved-owner restore regressions, and review the final Korean lines independently. Keep source character totals and added manual pages visible in the report; no human-feel claim.

### Task 2: First-road result pacing

**Files:** existing refinement owner in `src/03o-story-refinement.js`; focused ordinary receipt tests.

- [x] Pin RED for new ordinary queue/begin/payment revision, unmarked old entry/results with and without views, exact20/35/10-minute/pursuit effects and original cue facts.
- [x] Keep the entry completely unchanged. Replace repeated result exposition with the actual paper/module/full-scan handling and necessary received/registered consequences. Keep family/parent connection facts available in the entry and notes; invent no carried object, actor, promise or new clock.
- [x] Keep old outcomes behind their original owner/revision, including payments interrupted before first result render.

### Task 3: Build and frozen persona review

- [x] Preserve before hashes/source copies; compare all authored data outside declared future prose fields, all old assets and scene keys.
- [x] Run focused opening/presentation/audio/evidence checks and sourcehealth. Build HTML/AIT with Node22; verify embedded old scenes/portraits and AIT aliases.
- [x] Provide a small read-only before/after source comparison without initializing the user's save. Actual CUA browser host is currently unavailable; do not call it actual game crop/input/audio QA.
- [x] Freeze source/assets/build/current observer inputs. Run three distinct finite persona journeys serially with unique IDs219–221 and seeds2026110816–18, output limits90MiB each, no rerolls/state injection. Review full dialogue/notes/resources/time/ownership/selected art; report target selection and unselected gaps honestly.
- [x] Fix any confirmed material issue, verify and record checkpoints. Do not treat test counts as literary quality or fun.

No commits are part of this task. Decisions on exact small wording and optional marker dispatch are implementation choices within Sang's authorized direction.

Follow-up: cohort01 completed with2actualpre-existingnight-artissues. Their approvedsame-style repair and the second frozen cohort are tracked in qa-artifacts/opening-flow-20261108/repair03/PLAN.md. Manual concurrentHTMLbuild ENOSPC and metadata path failure remain retained; final automaticHTML sourcefragment and supportedNode22AITreuse were verified.

Completion: bothcohorts219–224 fullreviews closed; all6normal, final8238frozeninputsunchanged. Repair03 rareeventsunselected; controlledart/clockevidence remains separate. Actualphone/UI/crop/audio/humanpace pending. See opening-flow-20261108/final-verification.json.
