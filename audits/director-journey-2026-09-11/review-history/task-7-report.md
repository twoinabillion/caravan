# Task 7 — journey finale and recoverable presentation

Base: `fef86bfd912789df6906d54141fee3650755b492`. Worktree: `/Users/sang/_workspace/caravan-director-20260911`. Implementation and fixture QA only; Task8 remains responsible for fresh earned campaign/recruitment/three-method acceptance on the integrated build.

## Result and source owners

- `src/04h-engine-presentation.js` is the single ordinary presentation owner. It contains the trusted authored registry, validation, one-choice receipt, display progress, close handoff, and legacy finale recovery. `tools/build-html.mjs` loads it after the existing evidence/chain owner. The core file stays below the 1,200-line limit.
- `07-ui.js` reconstructs ordinary events/results through normal Continue and trusted button callbacks. It does not restore QA HTML or use `restoreQaView`. Opening and camp keep their own step/conversation receipts and effects; the generic resolver delegates to those owners.
- `04a` stamps save schema8, migrates old saves without fabricating a presentation, validates pending data after normal state normalization, and suppresses intermediate nested saves while a choice's effects and receipt are committed together.
- `04b` returns the chosen authored outcome index even when combat inference copies the outcome. `04e` completes the fifth Seoul stop only at `story_done`; `core_reached` and obsolete `seoul_core_done` cannot claim completion. `completeJourney` retains the existing selected-method archive and callbacks; `endGame` skips duplicate successful-journey archive/session finalization and rejects repeated calls on ended state. The active save is still wiped on ending.
- `03-data.js` reads actual opening choices, confirmed testimony/command records, resolved camp choices, recruitment approaches, city impacts and choice memories into the finale. It preserves the operational costs of transfer/sleep/quarantine, dissent costs, the 6,412 residents' local victory, father's death maintaining medical/water lines, mother at the outside relay and the unresolved upper-purpose hook.

## Save contract

`S.pendingPresentation` has `version:1`, a trusted `eventId`, and exactly one phase:

| Phase | Saved data | Resume / next action |
| --- | --- | --- |
| `event` | Frozen displayed text and bounded pure-data view (turns, reader index, known-speaker state, registered scene keys) | Render authored choices without calling `G.openEvent`; no encounter/counter inflation. |
| `result` | Choice/outcome indexes, frozen result text, escaped text chips with whitelisted classes, combat display summary and view | Render the already-applied result. No RNG, costs, bonds, notes, combat history or quality increments are replayed. Recruitment offer and following chain come from the trusted authored outcome. |
| `transition` | Next trusted event identity | Persisted before the 450ms close handoff, consumed when the next event opens. An unopened next event gets its one normal encounter count. |

The registry covers `D.events`, all 5 Seoul stops, Seoul entrance/gate, bridge and onboarding singleton definitions. Dynamic camp IDs are rebuilt only by the camp owner. There is no generated-definition fallback, serialized function, DOM reference, raw final-dock HTML or save-provided executable effects. Text follows the existing safeHtml/escaped renderer; corrupted chip classes cannot become markup.

The result's authored chain recovers a missing legacy `_chain`. Both new and recovered transitions use `G.resolveMainEvidenceChain`, preserving Task5's actual-location and completed-main-evidence routing. A stopped scene clears an orphaned saved road-approach marker, because the old browser's timer cannot clear it after reload. Initial road discovery still uses its existing four beats.

Unknown/malformed records are discarded. Legacy recovery uses established flags/chain and the earliest unresolved Seoul work: entrance, first unfinished climb stop via the map, core/costs, unanswered disposition, night, uplink, reset. A `core_decided` flag without exactly one actual method resumes the unanswered decision, never an invented quarantine result. The earned crew-preliminary old-schema checkpoint restores that unanswered decision. A legacy `story_done` checkpoint finishes the existing ending without another archive. Raw ended diagnostic saves have not been made a new Continue product feature.

## Finale and preparation behavior

Transfer still requires 3 unique contacts and leaves human priority disputes. Sleep requires 4 healthy-companion/contact holders and closes original-record search. Quarantine requires 3 uninjured companions at mood 45+ and ongoing night watch. Existing union identity and preparation math are unchanged.

Solo core blocks pointing at absent companions and retains the journal action; night labels/text work with an empty party. Six-person testimony now assigns actual spoken lines to all six characters, retaining their individual roles. Minji appears in the night response, with her selected camp/home memory returned alongside other experienced memories. Pending/unanswered camp plans do not become memories. Parent details and mother attribution remain explicit. Sleep reads the kept family-record copy and distinguishes immediate cancellation from next-day human result confirmation. Seoul entry/base/journal/finale labels use actual recorded distance; the fictitious deadline and unreachable late-ending UI branches are removed.

The preparation button appears separately from the three methods in `seoul_decision`. It acts only while atSeoul with that pending decision and no resolved method. It uses the authored gate's Suwon return convention: `goto:'suwon'` plus 60 minutes and a factual journal note. It grants no contacts, companions, evidence, supplies, mood or readiness; it does not add mileage/fuel cost. It clears pending presentation and `_chain`, preserving earned flags, chosen costs inspection, party and resources except normal time consequences. Continue stays atSuwon rather than opening the Seoul map. The focused test confirms exactly 60 minutes once, unchanged earned flags, no chain, no second charge on Continue, then travels back using real `G.startTravel('seoul')`/accelerated `G.tick` and resumes the unanswered decision through Continue. This is a short engine-driven return-leg fixture, not a fresh full campaign claim.

## Red → green verification

TDD used existing save-systems and verification-before-completion guidance. Initial browser red run reproduced: cafe event absent on Continue, earned legacy decision absent, archive2→3 on repeated ending, and solo companion choice incorrectly allowed. Subsequent red checks reproduced no preparation exit, a methodless partial save inventing quarantine, old fifth-stop completion, stale approach freezing driving, and a missing `_chain` losing the receipt's next scene.

Final commands/results are recorded below; headless launches used the normal sandbox escalation. All browser work was isolated; live captures used `http://127.0.0.1:4176/game?caravan-live=1`, the actual frame behind the live wrapper. No personal browser or original workspace was touched.

- `npm run build:html --silent` — passed. Final generated HTML 77,665,196 bytes (<80MB),58 existing visual-contract warnings, no added warnings. Generated HTML was not hand-edited or staged.
- `python3 -m pytest tests/test_director_pending.py tests/test_director_opening.py tests/test_director_camp.py tests/test_director_camp_ui.py tests/test_director_choice_consequences.py -q` — 40 passed in 194.57s (all cases collected at that run).
- `python3 -m pytest tests/test_director_pending.py -q -k 'conflicting_legacy or legacy_completion or completion_archives'` — 3 passed, 31 deselected in 11.13s after the final narrow conflicting-method cleanup. A deliberately selected method now replaces contradictory legacy method flags; no method is selected automatically. The legacy completed-but-not-ended checkpoint resumes its terminal screen without a second archive.
- `python3 tests/test_finale.py` — passed: all three requirements/locks, prepared branches, dissent effects, late-day6412-preservation, all authored ending kinds.
- `python3 tests/test_seoul_sequence.py` — passed: all 5 stops and all 3 methods at early/late dates. This older test is engine fixture coverage; the new suite supplies actual Continue/UI phase proof.
- `python3 tests/test_save_migrations.py` — passed historical, partial and corrupt saves.
- `python3 tests/test_xss_guard.py` — passed; new saved-result injection coverage is also in the focused suite.
- `python3 tests/test_source_health.py` and `git diff --check` — passed.
- `python3 tests/capture_director_finale.py` —24 scene/result fixture captures,3 terminal captures and3 actual ending-journal downloads; no page errors or unknown named speakers.
- `python3 tests/capture_director_finale.py --reachability-only` —4 actual pointer targets verified at 320/390px; no CSS change required.

The final focused matrix includes normal Continue before and after each of `seoul_open`, `seoul_han`, `seoul_ruins`, `seoul_square`, `seoul_base`, `seoul_core`, `seoul_costs`, `seoul_decision`, `seoul_night`, `seoul_uplink_reveal`, `seoul_session_reset`. Reset proceeds directly to the terminal ending rather than an intermediate result sheet. Additional cases cover ordinary cafe, rolled combat result, close→delayed chain reload, accepted/declined saved recruitment offers, malformed versions/identities/indexes/shapes, injected result text/classes, actual memory vs unplayed camp, and preparation return/revisit. Fingerprints compare resources/time, items, party/comps, notes/flags, events, combat history/report and quality choice/event counts. Early harness failures from clicking locked choice0, first-load normalization, and racing navigation were corrected; no game grants were used to make those assertions pass.

One additional existing script, `python3 tests/test_quality_9_foundation.py`, has five already-known stale assertions assigned toTask8: “품질 스키마 v3와 고정 빌드가 기록된다”, “이전 저장은 데이터 손실 없이 v3로 보강된다”, “JSON 내보내기에 빌드·이정표·회수 근거가 포함된다”, “첫 화면은 길 선택을 한 가지 다음 행동으로 안내한다”, “출발 뒤 안내가 주행과 첫 사건 규칙으로 전환된다”. Its expected2026-08-17build conflicts with the pre-existing2026-09-10build, and guide expectations predate accepted work. All three relevant completion assertions passed: four late choice callbacks, second recruitment-method callback, and one selected-method archive. No unrelated expectations were changed or repeatedly rerun.

## Evidence and limits

All evidence is under `artifacts/director-pass-2026-09-11/task7/`:

- `fixture-captures.json`: complete displayed text and named-speaker results for 24 fixtures. `branch-0/1/2-{decision,result,epilogue,night-result,ending}.png` and `branch-0/1/2-journey.md` distinguish all methods and actual UI exports.
- `solo-{core,core-result,night,night-result}.png` and matching`six-*` show current-party variants. The solo fixture empties the earned crew checkpoint's current party but retains its experienced history; it is **not** a never-recruited solo campaign. Earlier camp memories appearing there are truthful retained history.
- `seoul_han/ruins/square/base.png` plus core captures cover all five stops.
- `solo-journal-{320,390}.png`, `preparation-{320,390}.png`, `control-reachability.json`: actual list hover/scroll, elementFromPoint verification at the control center, pointer click and resulting receipt/location. The enabled solo journal action is below the initial locked choices but reachable by the existing continuous list scrolling.

Self visual inspection confirmed solo core/night, sleep epilogue, mother portrait/voice and 320px journal reachability. Controller independently inspected additional methods, six-person and terminal screens and the narrow controls. Captures do not freeze QA animations. Functional fixtures do not establish earned preparation; Task8 retains that assignment. The fixture capture source was settled before the final nonvisual partial-save hardening, which does not change these images.

No subagents or external consultation were used. Pre-existing `docs/CURRENT.md`, `reports/asset-budget.json` and Task6 QA artifacts are excluded from the Task7 commit.


## Fix round1 — Important1–4 (2026-09-11)

Base `79b7271ada186bd1f98af049cf644cf2e8d8834b`. Completed by replacement implementer `/root/finale_save_fix` from the persisted handoff; no subagents. Scope is the two authoritative Important runtime findings and the controller's added reproducibility/verification corrections. Combat audio remains Task8; no audio, readiness threshold, geographic chain, pure-data contract, opening/camp receipt, or generated HTML source was changed.

**Important1:** `G.finishArrival` at an already-open Seoul and the normal `G.seoulEnter(4)` now use `G.resumePresentation`, the same owner as Continue. Its existing earliest-unfinished resolver recovers costs/decision/night without calling `G.openEvent` again for already-reached work. Initial core entry still belongs to the map; the first four stops are unchanged. The root cause was entry-point drift: only reload used the recovery owner. The guardrail now requires actual arrival/next-control coverage before reload.

**Important2:** `G.resolvedFinaleMethod()` supplies one exactly-one-method predicate to recovery and preparation. Preparation requires an explicit `event` phase for `seoul_decision`; result and transition phases cannot leave. Conflicting methods remain unresolved until a real player choice replaces them. The Suwon/60-minute convention and all three readiness gates are retained.

The corrected return test actually clicks preparation, uses normal Continue at Suwon, drives `G.startTravel('seoul')` with accelerated real ticks, and clicks the real `[data-arrival-continue]`. It asserts the next scene is `seoul_decision` **before any arrival reload or manual event/map opening**, with the arrival fingerprint unchanged (resources, time, items, party/comps, notes, flags, event/choice counters, combat fields). Continue then preserves that same fingerprint. The separate normal fifth-stop test covers unfinished costs, decision and night.

The conflicting fixture removes confirmed contacts and gives the existing Minji one one-day injury, making all three methods locked; it does not grant readiness. After the real preparation exit and Continue, ordinary `G.camp()` pays its normal rest costs and heals the injury. The real 34km return and arrival then expose only quarantine. The two conflicting historical flags persist through rest, arrival and Continue; clicking the now-enabled quarantine method explicitly produces the result and sole `core_quarantine` flag. This is a historical fixture return leg plus actual preparation action, **not** a fresh final-build campaign.

**Important3:** Tracked the exact unchanged historical `crew-preliminary.save.json` and `minji-first-night-natural.save.json` at their existing paths. `artifacts/director-pass-2026-09-11/legacy-fixtures.md` records origin, byte counts, SHA256, dependent scripts and legacy-only purpose. No copying/migration/grants changed those fixtures. Their indexed bytes must match the recorded hashes. Existing tracked `task3-conference-route.save.json` is unchanged.

**Important4 / earlier report correction:** The original 40-pass pytest command did **not** run the two camp scripts: they expose `main()` and have no pytest test functions. It demonstrated the collected pending/opening/consequence tests only. Both camp scripts were now directly executed once on the fixed build, separately from the 23 pytest cases below. Their exact PASS output is retained. The camp UI script overwrote its fixed tracked Task2 output paths; those prior bytes were restored from HEAD, and this run's changed outputs retained under `task7/fix1/camp-verification/`.

### Exact verification commands and results

All commands ran from this isolated worktree. Browser launches used the normal approved sandbox escalation; the first sandboxed attempt failed at Chromium launch (`bootstrap_check_in ... Permission denied`), not at an application assertion. An initial harness attempt waited for a nonexistent guessed map selector; that branch was removed before the recorded proper red run. No source was changed before observing the correct red assertions.

- Live server: `npm run dev:live -- --port=4176`; all live tests used `http://127.0.0.1:4176/game?caravan-live=1`, never a personal browser or original workspace.
- RED: `CARAVAN_CAPTURE_URL='http://127.0.0.1:4176/game?caravan-live=1' python3 -m pytest tests/test_director_pending.py -q -k 'preparation_return or preparation_rejects'` — **4 failed, 33 deselected in 17.52s**. Actual arrival had no next scene; conflicting preparation did not charge/move; result and transition preparation wrongly returned true. See `fix1/red.log`.
- RED: same URL prefix with `python3 -m pytest tests/test_director_pending.py -q -k 'normal_fifth_stop'` — **3 failed, 37 deselected in 5.76s**; costs, decision and night all incorrectly opened `seoul_core`. See `fix1/red-fifth.log` (terminal trailing spaces removed for clean patch whitespace).
- `npm run build:html --silent` — **exit 0**, generated HTML **77,665,415 bytes**, the same **58 legacy visual-contract warnings** and existing recommended-size warning. HTML was built, never hand-edited or staged. See `fix1/build.log`.
- GREEN: `CARAVAN_CAPTURE_URL='http://127.0.0.1:4176/game?caravan-live=1' python3 -m pytest tests/test_director_pending.py -q -k 'prepar or conflicting or seoul or fifth_stop or partial_finale'` — **23 passed, 17 deselected in 132.32s**. Includes all 11 Seoul event/result Continue phases and the changed entry boundaries. See `fix1/green.log`.
- After strengthening only the conflicting fixture with actual overnight healing and explicit later choice: same URL prefix with `python3 -m pytest tests/test_director_pending.py -q -k 'preparation_return'` — **2 passed, 38 deselected in 26.20s**. No production change or repeated broad suite. See `fix1/return.log`.
- `python3 tests/test_seoul_sequence.py` — **exit 0**; all five stops, all three methods, early/late completion and zero page errors. See `fix1/seoul.log`.
- `CARAVAN_TEST_URL='http://127.0.0.1:4176/game?caravan-live=1' python3 tests/test_director_camp.py` — **exit 0**, `PASS: camp guests/choices/saves, all pending next-leg behaviors, legacy echoes, second-leg nonduplication and partial-save corruption`.
- `python3 tests/test_director_camp_ui.py` — **exit 0**, `PASS: live natural pre-join Minji cancel/reload/choice/home/road, six companion fixtures at 360px, correct speakers and reachable actions`. See separate `fix1/camp.log` and `fix1/camp-ui.log`.
- `CARAVAN_CAPTURE_URL='http://127.0.0.1:4176/game?caravan-live=1' python3 tests/capture_director_finale_fix.py` — **exit 0**, `PASS: prepared and conflicting live preparation returns; arrival-next-scene captured before reload; overnight healing and explicit quarantine choice; unchanged arrival/Continue fingerprints`. This invokes the corrected return tests and captures just before their final reload. See `fix1/capture.log`.
- `python3 tests/test_source_health.py` and `git diff --check` — **passed**: standalone parsing, file sizes, fresh generated build and clean whitespace.

### Evidence and self-review

`task7/fix1/live-return.json` records normal Continue → Suwon (+60 minutes exactly once) → actual arrival's next scene before reload → Continue, with pending phase, costs flag, readiness, method flags, counters and fingerprint hashes. Prepared live arrival and Continue both have `14a1e362...` fingerprints; conflicting live arrival and Continue both have `bbe7305d...`. The final conflicting explicit choice increments choices 86→87 while event count stays 79, and changes methods from transfer+sleep to quarantine only. Travel's own one event/choice is real road work; the tests compare **arrival-before-control** to **after-control**, so legitimate travel effects are not mistaken for replay.

Visually inspected `prepared-live-return.png`, `conflicting-live-return.png`, and `conflicting-explicit-quarantine-result.png` at 390px. They show the unanswered disposition directly on live reentry, only the legitimately prepared method enabled, a reachable preparation control, and the selected result's next-step action. No QA exact replay or manual event reopening was used for these captures. Source self-review confirms exactly one presentation owner and one method predicate, no new save payload or effects path, no readiness weakening, and no duplicate charges/counters at arrival/Continue. Initial map-owned core entry is covered by the unchanged five-stop engine script.

Remaining downstream work is unchanged: Task8 combat audio and earned final-build campaigns/three-method proof; Task8/9 the existing 58 warnings, size warning and five stale quality assertions. This round makes no claim to have completed those assignments. The controller obtains scoped re-review before Task8 starts.

Final indexed-fixture verification used `git show :<fixture>` and SHA256 against each unchanged working file: both byte-for-byte matches passed (98,797 and 28,475 bytes); both are staged/tracked at the original required paths. `git diff --cached --check` passed after removing terminal-only trailing spaces from the red log.
