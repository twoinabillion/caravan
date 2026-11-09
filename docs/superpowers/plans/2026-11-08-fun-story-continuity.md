# Fun and story continuity implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent owned tasks; root integrates and reviews. Sang has approved implementing the preceding concrete critique and requested subagents. No additional interview or publication is part of this task.

**Goal:** Let this journey's relationships, investigations and losses remain visible in what happens next.

**Architecture:** Preserve existing event, paid-reader and save owners. Add a future prose edition in the existing narrative refinement module; compute truthful companion guidance without changing earned levels. Reuse saved ambient chat receipts for shorter recurring conversations.

**Tech Stack:** Existing plain JavaScript game and Node22 VM tests; existing HTML/AIT builder.

**Spec:** `qa-artifacts/fun-story-review-20261108/REVIEW.md`, approved by Sang on 2026-11-08.

## Global constraints

- Preserve existing HD scenery, portraits, vehicle and parts; no new UI layout or pixel conversion.
- Preserve old paid words, scene keys, reading positions, ownership and payments, including viewless saved results.
- Preserve earned companion levels/perks, main-story gates, ending costs, resource economy and all choice IDs/order.
- Separate actual personal actions from relationship stage; never infer a physical visit from a broad flag or event entry.
- No forced cast, punitive family timer, fake legacy heroism, forced afterword, save reset, commit or publish.
- Source edits are paused for fresh persona cohorts; new runs are finite one-attempt journeys, never fixtures counted as players.

## Review focus

- Legacy unknown/unmarked narrative owners must fall through the complete old-edition chain.
- A solo driver receives no nonexistent companion reaction.
- A confession flag is not proof of a visited place or paid handoff.
- Repeated chat callbacks must not re-award relationship points or claim new resources/actions.
- A paid callback and quiet period must survive reload without altering old result words or consuming extra RNG.

### Task 1: Truthful companion guidance

Files: `src/04f-engine-quests.js`, `src/07d-ui-quests.js`, `tests/test_companion_quest_truth.cjs`.

- [ ] Write/run RED cases for all six relationships at stage3 without unique personal action, and actual resolved actions.
- [ ] Compute read-only personal-action guidance from exact existing evidence; keep relationship progress and perks.
- [ ] Remove invented physical milestones from journal projection; preserve stored quest receipts.
- [ ] Run focused quest, journal and navigation regressions; independent root review.

### Task 2: Story that remembers

Files: `src/03o-story-refinement.js`, `tests/test_story_rhythm.cjs`; narrowly extend existing content contract tests only for intended new edition.

- [ ] Write/run RED for future/legacy editions, actual companion reaction and solo, family update reachability, selected investigation order, known-principle execution and truthful core callback.
- [ ] Add future revision with exact legacy delegation. React after the father's record; add one mid-road family contact using existing beat owner; follow the selected investigation emphasis in recovered records; cite an actual paid action at the core.
- [ ] Reuse appropriate existing HD scene plates/portraits; decide new raster only if a specific scene needs it.
- [ ] Run compatibility against preserved baseline and actual paid journey receipts; independent root/copy review.

### Task 3: Road conversation rhythm

Files: `src/03i-story-expansion.js`, `src/04b-engine-crew.js`, `src/04e-engine-world.js`, `src/04c-engine-travel.js`, `src/04d-engine-director.js`, `tests/test_road_story_rhythm.cjs`.

- [ ] Write/run RED for first full chat, later short callback, same-day suppression, old seen ledger, actual cast, once-only relationship award and persisted quiet after father payment.
- [ ] Use original chat object for relationship accounting; return a short authored continuation only after its full prior conversation. Exhausted lengthy vignettes without continuation leave space for existing one-line ambient banter.
- [ ] Establish a saved finite quiet period only on the new father-payment transition. Tick it only while driving; suppress generic chatter and choice echoes, preserve event/radio progression.
- [ ] Run focused deterministic/reload and narration regressions; independent reviewer.

### Task 4: Delivery and actual journey review

- [ ] Inspect source diff and run relevant focused tests, dialogue/content validation and scene preservation checks.
- [ ] Resume the original live watcher exactly once after edits; reuse completed HTML for Node22 AIT build (`CARAVAN_HTML_READY=1`) to avoid simultaneous giant builds.
- [ ] Verify compiled changed fragments, original scene/portrait bytes and AIT aliases; record SHA/size.
- [ ] Freeze runtime and observers; root releases three fresh distinct finite persona subagent journeys serially (225–227, seeds2026110822–24). Preserve full actual readers, notes and failures within disk budgets. Review all actual output before closing cohort.
- [ ] Report unavailable current-screen/device/crop/audio coverage explicitly; update Caravan checkpoint and director memory.

## Execution ledger

- Baseline: `qa-artifacts/fun-story-build-20261108/before/source-baseline.json`; six exact dirty-workspace source originals retained under `before/`.
- Ruling: reuse the existing dirty workspace because it contains Sang's approved work; do not replace it with HEAD or copy huge build outputs into a worktree.
- Ruling: temporarily SIGSTOP only idle live watcher PID70845 (clients0), then resume same process after source integration. This prevents repeated automatic 169MB builds under severe disk pressure.

- Implementation evidence: final focused suite191/191, compatibility61/61; independent story review corrected Hajin location, Jaeyi numberplate reaction and exact heater recollections. HTML169116293 bytes, SHA d013ba176439a2c6e274976922aecdcbd9e765f819afc975d757d20c9102e285;728 keys/721images preserve all prior embedded bytes.
- Ruling: saved grief quiet is12 seconds of active driving (~19km), avoiding a64km ambient gap. Functional meals and radio remain active.
- Storage ruling: current cohort uses28MiB checkpoints/44MiB runtime/64MiB total perpersona. Drop duplicate checkpoint file copies while retaining full actual readers, trace, notes, reload comparisons and scene entry/result saves. Serialize and losslessly compress completed outputs before releasing the next player; require one64MiB budget plus128MiB reserve. This replaces this plan's earlier90MiB reservation, not any gameplay.
- Delivery ruling: run HTML/source cohort before AIT packaging while storage is constrained. The existing three AIT files remain the prior build; do not claim these contain the new story. Sang was asked asynchronously to free1GB; meanwhile continue independent validation.
- Storage preservation: removed only regenerable dist staging; historical HTML compression left both exact bytes/mtime unchanged and freed0. Git incremental compression failed128; all19220object IDs/all refs verified unchanged, only its own unreferenced43.6MB incomplete temp removed.
