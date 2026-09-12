# Task 4 — choices, tactical advantages and callbacks

Implemented from accepted base `ab53578d07509f54f3746c4435404ab0e35ee0d6` in the isolated director worktree.

## Implementation

- Choice cards now render authored foreseeable information as three distinct kinds: `즉시` for known time/resource expense, `위험`/`노출` for the threat created by the method, and `이후` for a persistent consequence. These rows do not show success odds, rolled results, failure costs or quest rewards. When an authored immediate row already contains a required resource, the UI does not render the old requirement cost a second time. Locked choices still show the unmet requirement.
- All eleven interactive opening choices disclose their real time and known resource cost. The five resource-free routes now say how much time they spend. Workshop tools, copied records/names, module wiring method and workshop key disposition disclose the persistent object or record they leave.
- Every opening choice has a later callback, derived directly from `S.opening.decisions`. There is no second saved identity ledger: the existing decision receives `callbackEchoed`, day and kilometre only when its callback plays. Distance/event gates prevent an immediate echo; the callback survives save/load and is consumed once. The paid `pack_workshop` callback uses the carried thin wrench on a loose battery clamp and puts it back in its persistent door-pocket location.
- The walker scanner methods now lead to distinct usable reads: timing supports `교란`, Minji's hydraulic method supports `근접`, and Kangwoo's angle supports `사격`. The existing combat history/journal records the selected read, next-phase use and final outcome.
- The risky rush in walker, swarm and toll phase two now has a real successful branch: edge `+2`, pressure `+1`, and one relevant next-phase read. Its failed branch remains edge `-2`, pressure `+2`. The preview says that rushing exposes the party and carries both initiative and pressure forward, without promising the success branch.
- Walker final methods disclose known ammunition/fuel/vehicle expense, exposure and persistence. Successful fire remains a distraction: it records no part/scrap gain and does not represent the walker as disabled. Success, failure and retreat continue through the existing `G.inferCombatResult` / `G.applyFx` report owner. Solo retreat copy no longer invents a last passenger or a group headcount.
- Parkss's battery callback uses his pharmacy rubber and insulating tape. It no longer claims he learned from Minji in a journey where they never met. Its `차체 +3` effect remains save-stable and once-only.
- Existing settlement work and companion interfaces remain the owners for local/companion consequences. Focused coverage resolves the Miryang pump action, saves, schedules its road scene, consumes the callback once, and checks its journal entry. Existing all-companion callback checks still report first-drive and ending callbacks for all six companions.
- `tests/test_choice_visibility.py` now verifies the source's already-established continuous-scroll behavior. At the accepted base, `wireEventChoicePages` already removed the generated pager and exposed every choice. The stale test still required three-choice pages. The replacement asserts that all actions remain in one list, no card content/preview overlaps or clips, the last action is reachable by actual scrolling and click, and the result remains actionable.
- `src/04d-engine-director.js` required no change: its existing combat effect/report and settlement callback owners already provided the needed state transitions.

## Red / green evidence

All browser runs used isolated headless Chromium. Chromium required execution outside the macOS sandbox because its bootstrap ports are blocked there.

- Initial `python3 -m pytest -q tests/test_director_choice_consequences.py`: **RED, 4 failed / 1 passed**. Distinct scanner/rush effects, foreseeable rows, opening callbacks and the Parkss history correction were absent. The existing core-clue progression graph already passed.
- The first implementation build failed content validation because an early approach expanded fixed `D.choiceMemories` from 17 to 21. The implementation was corrected to derive virtual callback records from `S.opening.decisions`; the fixed 17-entry memory contract remains unchanged.
- First focused green: `python3 -m pytest -q tests/test_director_choice_consequences.py`: **5 passed**.
- Live visual inspection then found an overlap that the original height-only assertion missed. After adding a bounding-box overlap check, `python3 -m pytest -q tests/test_director_choice_consequences.py::test_foreseeable_costs_are_separate_and_results_stay_hidden_on_mobile`: **RED, 1 failed**. Reusing the existing static requirement-row layout and suppressing duplicate available-cost rows fixed it. The opening regression also initially exposed the duplicate row at 320×578; final result is green.
- `python3 tests/test_combat_rework.py` initially rejected `차체 3%` because its no-odds-leak guard correctly treats an unexplained percentage as a prediction. The known retreat expense now says `차체 내구 3`. Final: **PASS**, including first-encounter failures, preparation, three-way outcomes, no prediction/reward leak, and result controls.
- Final `python3 -m pytest -q tests/test_director_choice_consequences.py`: **6 passed**. Coverage includes all three rush chains, all walker scanner reads, journal linkage, success/failure/retreat, fire-distraction identity, all opening callback definitions, due gating, save/load/exact-once, insufficient requirements, core-clue reachability, settlement callback persistence, Parkss solo callback and seed repeatability.
- Final `python3 tests/test_choice_visibility.py`: **PASS** at 360×700, 390×844, 390×844 large text and 1440×900. All five actions were present, list overflow was `auto`, top-to-last scroll ranges were 256/220/220/222 px, no cards clipped or overlapped, and the 48 px result control remained reachable. Zero page errors.
- Final `python3 tests/test_director_opening.py`: **PASS**, including the actual five-step UI, save/restore and 390×844 plus 320×578 choice/result/departure fit.
- Final `python3 tests/test_determinism.py`: **PASS**. Same seeds produced the same journey; different seeds diverged.
- Final `python3 tests/test_save_migrations.py`: **PASS**, historical/quality-v2/partial/corrupt saves and zero runtime errors.
- Final `python3 tests/test_source_health.py`: **PASS**, standalone parsing, source budgets and fresh build.
- Final `npm run build:html --silent`: **PASS**, 1005 validated events, zero immersion-break lint findings, current HTML `76,118,967` bytes. The established 58 legacy visual warnings and 32 MB size advisory remain; no warning count or source limit was raised.
- Final `git diff --check`: **PASS**.

Two extra broad legacy suites are not reported as green. `python3 tests/test_companions_e2e.py` passed all twelve first-drive/ending callback assertions and zero-page-error checks, but its six unrelated Lv3/signature expectations observed Lv2 and exited 1. `python3 tests/test_quality_9_foundation.py` passed the six-companion first-drive callback, ending callback and console checks, but exited 1 on five existing build-ID/onboarding-copy expectations. Task 4 did not change leveling, the quality build identifier or onboarding guidance; the baseline cause of those failures was not established here.

## Live narrow-screen evidence

The final diagnostic captures use `http://127.0.0.1:4176/game?caravan-live=1` without `rev`, in isolated browser contexts. They load the current live build and drive real choice/result controls, but open the audited events from explicit diagnostic new-game states; they are not evidence of a fresh organic campaign or human reading time.

- `qa-artifacts/director-choice-consequences-2026-09-11/opening-costs-390x844.png` — both opening actions, 5/15-minute expense and persistent-tools preview, no overlap.
- `walker-methods-top-390x844.png` and `walker-risk-bottom-390x844.png` — the complete four-action scanner list across its top/bottom scroll states, including the three differentiated next-phase methods and the rush risk/exposure/persistence row.
- `walker-actions-top-390x844.png` and `walker-actions-bottom-390x844.png` — the complete five-action final combat list across scroll states, with locked requirements and known method costs/exposure.
- `walker-retreat-result-390x844.png` — actual clicked retreat result, four effect chips, singular/party-neutral copy and reachable 48 px exit action.

All final frames show their mapped art. An earlier blank scanner capture was taken during the normal scene fade; DOM inspection showed the correct loaded scene key. That superseded file was discarded and is not final evidence. The six final captures were visually inspected. No page errors occurred.

## Limits and handoff

- This pass does not claim physical-device performance, fresh-player comprehension or full-campaign choice frequency. Task 8's route/ending matrix remains the campaign-level verification owner.
- The inherited low-contrast helper line near the event title and oversized result footer remain presentation work for Task 6. They did not block action scrolling or result completion and no style expansion was made here.
- Broad smoke and goal/bag suites were not rerun, per the task context. The known baseline timeout's cause remains unestablished; no assertion was removed or weakened.
- The seven controller art candidates remain unwired. `docs/CURRENT.md`, `reports/asset-budget.json`, Task 3 report clarification and regenerated Task 1 screenshots remain excluded generated/controller drift.

Self-review checked the data/engine/UI ownership boundary, one-time mutation points, success/failure polarity, fire-distraction semantics, solo copy, save reload, preview truthfulness, continuous-list accessibility and scoped status. No unresolved Task 4 implementation blocker remains.

## Review fix round 1 (base `422389baf604db16ef0632e432f914a20c37d218`)

The reviewer found that Kangwoo's failed walker scan still stored `combatRead.tactics:['사격']`. Because the final phase has shooting actions, the failure incorrectly received `G.combatReadDelta === 0.10` and `G.combatReadNote === '읽어낸 틈 활용'` despite its copy saying the angle was lost.

- All three failed walker scanner outcomes now retain their descriptive failed-read label but store an empty usable tactic list. Their existing edge `-2`, pressure `+2`, chain and companion mood effects are unchanged. Successful timing/Minji/Kangwoo reads remain `교란`/`근접`/`사격` respectively.
- The scanner test now applies every failed outcome, checks the full next-phase action list, and requires zero matching read bonus plus no `읽어낸 틈 활용` attribution for every action. It also explicitly preserves the `-2` edge and resulting pressure `3` state for each failure.
- RED: `python3 -m pytest -q tests/test_director_choice_consequences.py::test_scanner_methods_and_rush_actions_change_the_next_phase` — **1 failed**; observed failed tactic lists were `[['관찰'], ['정비'], ['사격']]` instead of three empty lists.
- GREEN: `python3 -m pytest -q tests/test_director_choice_consequences.py` — **6 passed in 10.25s**.
- Affected regression: `python3 tests/test_combat_rework.py` — **PASS**, including first-encounter failure reachability, preparation reads, outcome classifications and zero page errors.
- `npm run build:html --silent` — **PASS**, 1005 validated events and current HTML `76,118,943` bytes. The same 58 legacy visual warnings and size advisory remain.

No UI, CSS, asset or callback behavior changed in this review fix. `git diff --check` passed; the controller-owned Task 3 report/CURRENT/asset-budget drift and seven unwired art candidates remain excluded.
