# Task 8 implementation report — complete campaign and branch verification

## Result

Task 8's implementation and evidence collection are complete on the isolated worktree. The runtime was frozen at `3a3c9aa868a8963edbc6d77fc873d180cbe352b6` with `GAME_BUILD=2026-09-11-director-journey`. Every accepted campaign loaded the same generated document: 77,666,839 bytes, SHA-256 `1c5601994277f1603e0d50c164fdab432b561d4c9d0700bbe07c867c78de9d07`.

The final evidence has 15 successful scenarios, 11,232 hash-chained action rows, 226 indexed evidence files (223 PNG captures and three exported ending journals), two normal-speed videos, and one exact earned checkpoint used by all three finale forks. Raw evidence remains in `artifacts/director-pass-2026-09-11/task8-final/` (1.1 GB, 410 files at packaging time). The tracked compact index is `artifacts/director-pass-2026-09-11/task8-final/evidence-index.json`; it independently recomputes every final trace row and chain head, each trace and manifest hash, every manifest-listed capture/video hash, each save hash, and local/browser document identity.

The last Task 8 plan checkbox, independent whole-change review, remains controller-owned. Task 8 does not synchronize the original project, correct `docs/CURRENT.md`, or declare the full director journey delivered; Task 9 owns those steps.

## Runtime changes and freeze

The final runtime contains four Task 8 repairs:

1. `GAME_BUILD` is exactly `2026-09-11-director-journey`.
2. Newly applied combat resolutions play confirmation and delayed success/partial/failure audio. A restored saved result is silent because cues run only when `savedResolution.applied` is true.
3. Both `route_mid_fork` actions render distance, time and fuel from the authored `out[].fx.routeChoice` and existing `G.routeForecast`. The cards use the existing choice-list owner, an intrinsic 88 px minimum, nonshrinking flex behavior and Korean keep-all wrapping. The final 320/390 captures and simultaneous geometry trace show each title/forecast inside its card, a 2 px card gap, the first action at scroll top, and the last action reachable at the list bottom.
4. Bag count numerals use tabular figures so changing quantities do not shift compact inventory rows.

The temporary blanket `reqVisible` change was reverted. The accepted selective event renderer remains: known companion/resource capability actions are visible and disabled, explicit secret/story-gated choices are hidden, and the companion action enables after joining. The helper comment now states that it evaluates prerequisites while the renderer owns visibility.

The exact 58 inherited visual-warning strings match `artifacts/director-pass-2026-09-11/legacy-visual-warnings-baseline.json`; added and removed sets are empty. The warnings remain known limitations. The 80,000,000-byte hard limit and approximately 32 MB advisory were not raised or weakened. The frozen HTML is 2,333,161 bytes below the hard limit.

## Reusable runner and stale-test repairs

`tests/director_journey_helpers.py` provides canonical schema-8 snapshots, SHA-256 chaining, resource deltas, exact save capture, checkpoint preload-once behavior, presentation identity and timed normal input. Snapshots use `S.v`, `S.noteSeq`, full notes, `S.injuries`/`G.isInjured`, companion mood/bond/level/perks, upgrades, archive/counters, navigation state, camp memories and the actual evidence owners `G.mainEvidenceRows()`, `G.pillars()`, `G.mainStoryReady()` and `G.coreLinkedCells()`.

`tools/qa-director-city-route.py` is a direct `main()` CLI. Pytest does not execute its campaigns. It starts through visible UI, uses the Road destination/depart controls, public quest tracking, ordinary trade/rest/camp controls, and actual `G.questPreferredNeighbor`/`G.questNavigationPlan`. It has no custom shortest-path implementation. After New Game or Continue it does not grant resources, party, bond, flags, evidence, locations, or presentation state; it never manually reopens an event. Accelerated runs use real `G.tick`; the two normal runs contain no `G.tick` or `UI.finishStory` and pause 4,000 ms before every recorded input.

The runner hashes `route.fetch()`'s exact original main-response bytes, asserts they match the local built HTML, and fulfills with that unchanged original response. Playwright's cached response UID avoids copying a 77 MB base64 body back through Python. Reload proof keeps that verified original response alive and reuses it for navigation 2–4. The manifest records `sourceNavigation: 1`, `fetchBodyMs: 0`, and the capture description `reuse exact route.fetch response verified on navigation 1; fulfill cached original response unchanged`. Those reloads are cached verified deliveries, not new HTTP fetches. Native-navigation and curl probes were transport diagnostics only and are not accepted document provenance.

The repaired regression owners now test current behavior:

- Goal completes the interactive opening and checks the actual quest ledger, tabs, cards, steps, scrolling and mutual exclusion with Bag. Bag retains its own mobile pockets/details/actions and wrapping checks.
- Companion diagnostic fixtures stop at the Lv2 personal-story guard, resolve each authored deed, then verify Lv3/signature. They remain legacy state-machine diagnostics, not the six earned campaign flows.
- Quality tests use the final build identity and current onboarding controls.
- Smoke checks current story controls, road versus floating notifications, normalized exploration text, fixed-seed diversity, mission strip/navigation badges, current ledger tabs/content, the continuous seven-action list, route forecasts, and selective locked-choice visibility. Its recruit-scene rows render the first and final scene states; intermediate scene membership is data validation rather than a rendered beat-by-beat transition.
- `tests/test_director_campaign_contract.py` checks direct script entry, required scenarios, forbidden post-start mutations/custom wayfinding, preload-once behavior, canonical independent hash recomputation, insertion-order stability, required trace fields and all pending-presentation classes. These are structural contract checks; they are not counted as six behavioral campaigns.

## Fresh route campaigns

Both route campaigns started from the real New Game UI with finite resources and five authored opening decisions. Every routed departure asserted `chosen == G.questPreferredNeighbor(...)` and recorded the policy/function hashes, candidate set, plan, action, location, day/minute/km, resources, flags, evidence, notes, presentation and before/after delta.

| Scenario | Seed | Trace | Route proof | Terminal proof |
|---|---:|---|---|---|
| `route-ridge` | 400911 | 1,737 rows; `fc29e2ca4931c9c004787121958dd3e25effb7714b658207bd3c18ae7dd02a23` | authored ridge; 13/13 preferred departures; 430 km/day 6 | all 10 evidence rows, pillars 3/4/3/2, four linked cells, `core_transfer`, `story_done`, archive 1 |
| `route-market` | 400912 | 1,779 rows; `f1ee14955f4af041be95d0a7eeb750b080be7ada8adc05aaaaf23459e9de51f2` | authored market; 14/14 preferred departures; 519 km/day 7 | all 10 evidence rows, pillars ready, `core_transfer`, `story_done`, archive 1 |

Both traces place the three mother-history events at stopped Suwon, preserve route geography, and traverse the actual Seoul sequence. Ridge's legitimate emergency-fuel recovery is action 1074 at `crisis_nofuel`: +8 L, water −3, food −3, fatigue +22.14 and next day. Market used ordinary finite-resource actions. `final-route-event-spacing.json` derives recorded presentation spacing from these two exact trace hashes; it describes event sequence/distance and does not measure quiet reading time or fun.

## Six separate fresh recruitment flows

Each run independently started from New Game, met the companion, tracked `companion_<id>` through the public quest owner, followed actual preferred legal hops, completed the recruit task, selected the requested authored camp line through `G.campConversationEvent()`, earned the join, then drove a later real leg that consumed the saved road echo. Every final memory has both `home` and `road`, the requested `choiceId`, and `pendingRoad=false`.

| Companion | Seed | Selected line | Final place / distance | Rows / trace SHA-256 |
|---|---:|---|---|---|
| Minji | 401001 | `listen` | Yangsan / 152 km / day 3 | 456 / `f3984ee452625a1faf8ad56f8602d4d55bb79c8317543668ef249e83565519f5` |
| Parkss | 401002 | `share` | Daegu / 581 km / day 8 | 1,524 / `2d5318f378fe12950af1a89872dd1050b752bd518c5ea8f78972982e59ff6d4c` |
| Leo | 401003 | `line` | Jinju / 273 km / day 4 | 579 / `fed0c29179e3918507d1e8b6a6b8dbb6d61542292b513cef0b974ccce1ac4aa0` |
| Jaeyi | 401004 | `space` | Sangju / 233 km / day 4 | 735 / `9d20f0f2e55d780100de2e0cf6ed044afe51f15a844ba025c6f2abb10616b079` |
| Eunsu | 401005 | `facts` | Daejeon / 313 km / day 5 | 771 / `e9e9f032a6cd97bfe6a1cddfbcc0b7217f1c38d7bb44a61d711d36d6b80fd662` |
| Kangwoo | 401006 | `trust` | Miryang / 158 km / day 3 | 396 / `ffa827de5c8168bb68645b5e18298913c748cbe91c4e36d57585713fcc3fb9b5` |

Parkss additionally bought a legitimate 10 L reserve at Jeonju for 6 scrap (action 350, fatigue +0.99), preventing the earlier bot-policy shortage in the long northern corridor. This was a normal gameplay trade, not a grant or threshold change.

## Earned checkpoint and exact-byte endings

`crew-checkpoint` freshly earned Minji, Kangwoo and Jaeyi, their `listen`/`trust`/`space` camp memories and actual later road echoes, all ten main evidence rows, four linked cells, and paid bench/cabin upgrades. The upgrade actions paid scrap 12/22, one part each, and fatigue 13.5 each. At 735 km/day 12 all three companions were healthy at mood 100; the actual restored `seoul_decision` displayed all three enabled methods. The 2,420-row trace SHA is `26ce4bd4f4f6fc07c147fd0985690f561d4b6c327ef2b3edf3cb7e9f17e42386`.

The exact gameplay-written checkpoint is 101,104 bytes, SHA-256 `0d89072b6a2063c3aac4e2fe05cd294b63ad750ad8e24cc62ff516d300a5fdc4`. It is tracked at `artifacts/director-pass-2026-09-11/task8-final/crew-checkpoint/save.json` so a clean checkout can reproduce the three forks.

Each fork preloaded those bytes once into a fresh isolated context, then used actual live auto-resume/Continue behavior. Reload never reset the old checkpoint. The runner selected the authored method from `out[].fx.flag2`, traversed result, night, epilogue and end UI, required the real ending journal/export controls, downloaded a distinct journal, asserted the selected resolved method, `story_done`, and exactly one archive.

| Fork | Rows / trace SHA-256 | Journal bytes | Terminal |
|---|---|---:|---|
| `core_transfer` | 237 / `d2b6d7faf1ec93e4afea65fd3feb182b7f1188ee540d801ab65286ecab16bc0b` | 16,403 | method match, `story_done`, archive 1 |
| `core_sleep` | 222 / `7470e70abd3e9479cebdcc130ca65748d7d7827fc509ec6a2f496f3fc374ed4b` | 16,247 | method match, `story_done`, archive 1 |
| `core_quarantine` | 239 / `0cfe057bafa385411a5ccf33540993284d30713f2e4b9f5f350020902d01c812` | 16,393 | method match, `story_done`, archive 1 |

The fork commands contain seed metadata (`402001`–`402003`), but resume does not apply a new seed. The byte-identical checkpoint RNG state is authoritative. The UI traces are reproducible commands with exact provenance; natural frame timing can vary, so they are not claimed as bit-for-bit deterministic replays.

## Reload and normal-speed proof

The final `reload-matrix` on `af73d31` executed three browser reload cases: `opening-event`, `opening-result`, and `travel`. It produced 46 rows with trace SHA `4ac78c01e21cc153c9b53e64bf8bdb0e30e6436ac5f25bdc850a465bc9c40f37`.

- Opening event preserves event ID, event phase, story step, title, authored body and choices. The known one-shot tutorial aside is consumed and the saved `onboarding_event_guide` flag remains. Load migration adds exactly `recruit_migration_v2`; every other flag, counter, resource, item, note and `noteSeq` is unchanged.
- Opening result is owned by `S.opening.pendingResult`, while the DOM is `outcome/result`; it restores that typed identity, title, authored result text, controls, opening receipt, resources, notes and counters exactly.
- Travel captures the raw localStorage save at new-document start. The consumed input is authoritative and is recorded separately from the pre-click save, because the old page can legitimately keep driving before navigation commits. The resumed Busan→Yangsan leg advances from 1.603013 to 1.950455 km. Fuel changes from 41.753136 to 41.699630, exactly matching `G.fuelFor` and the resumed distance; water, food, scrap, items, notes, flags and counters remain unchanged. No event or day boundary was crossed.

The remaining 19 class labels are external test references, not executions by the campaign reload runner. Ordinary, saved recruitment-offer, combat and Seoul evidence is the accepted historical Task 7 pytest work in `tests/test_director_pending.py`; camp pending/result evidence is from the separately executed `tests/test_director_camp.py` and `tests/test_director_camp_ui.py` main scripts. These historical results are not fresh final-build reruns. On 2026-09-12, two named combat audio/result/transition tests were actually rerun with pytest against the frozen HTML and passed. The corrected `referencedPendingClasses` in the compact index names each owner and scope, retains the inaccurate raw attribution as `historicalRecordedReference`, and links `audits/director-journey-2026-09-11/whole-review-fix/pending-owner-correction.json`. Qualified raw manifests, reload records, traces and hashes are unchanged.

`normal-opening` recorded 21 actual inputs and exactly five authored choices, completed onboarding, exposed the main mission, and left no pending presentation. It has 21 requested 4,000 ms pauses, 84,151 ms observed total (minimum 4,001 ms), 15 screenshots, and a 4,849,431-byte WebM SHA `01e48aff75ed7e2598a57b47536283b1821e8c95bf9783dcc66c112eecf83fd2`. FFprobe reports 139.080 s, VP8, 390×844, 25 fps.

`normal-earned` starts from the exact earned checkpoint and completes the full `core_transfer` ending using 70 actual inputs and 70 requested 4,000 ms pauses, 280,097 ms observed total, 13 screenshots, `story_done`, archive 1, and no accelerated ticks. Its 12,568,181-byte WebM SHA is `e3291509f2180d308676be948770ea9afe7e453091933adb85d8d8b227ec5c39`; FFprobe reports 354.880 s, 390×844, 25 fps.

Both videos include main-document verification/preload plus deliberate scripted pauses. Their duration is not app load time, unassisted reading time, human timing, attachment, or fun evidence.

## Commands and verification

Campaigns were run by direct Python invocation, using the commands in `task-8-preparation.md`; each exact expanded command is also embedded in its manifest. This distinction matters because pytest only collects the fast structural contract, not `qa-director-city-route.py`'s `main()`.

Before the runtime freeze, the following completed successfully:

```text
python3 -m pytest -q tests/test_director_campaign_contract.py   6 passed
python3 tests/test_goal_bag_alignment.py                        PASS at 320×578, 375×553, 390×844, 360×700, 462×832, 476×809
python3 tests/test_companions_e2e.py                             PASS, six diagnostic state machines, zero browser errors
python3 tests/test_quality_9_foundation.py                       PASS
python3 tests/test_smoke.py                                      PASS
python3 tests/test_director_pending.py                           INVALID TEST EVIDENCE: direct invocation executes 0 tests
python3 tests/test_save_migrations.py                            PASS
python3 tests/test_determinism.py                                PASS
python3 tests/test_choice_visibility.py                          PASS at mobile/large-text/desktop sizes, zero page errors
python3 tests/test_finale.py                                     PASS
python3 tests/test_source_health.py                              PASS
npm run validate:content                                        PASS
npm run audit:scene-assets                                      PASS with exact 58 inherited warnings
git diff --check                                                 PASS
```

After all campaigns and harness-only changes, final verification completed with these fresh results:

```text
npm run build:html --silent                                  exit 0; 77,666,839 bytes; 58 warnings
python3 -m pytest -q tests/test_director_campaign_contract.py 6 passed in 0.03s
python3 -m py_compile tests/director_journey_helpers.py \
  tools/qa-director-city-route.py tools/make-task8-index.py    exit 0
python3 tests/test_route_choice_forecast.py                    PASS; final trace path printed
python3 tests/test_director_pending.py                         exit 0, but 0 tests executed; not a regression pass
exact warning-set comparison                                  count 58, added 0, removed 0
python3 tools/make-task8-index.py                              15 scenarios, 11,232 rows, 223 PNG captures + 3 journal exports verified
shasum/wc rebuilt HTML                                        SHA 1c560199…9d07; 77,666,839 bytes
git diff --check                                               exit 0
```

### Whole-branch verification correction — 2026-09-12

The two direct-script entries above were incorrectly presented as pending/audio passes. This file defines pytest tests and no direct entry point: exit 0 did not execute any tests. The historical Task 7 pytest results and direct camp-script results remain valid at their recorded Task 7 build, but are not claimed as final frozen-build reruns.

The bounded correction actually ran:

```text
python3 -m pytest -q tests/test_director_pending.py -k 'close_transition_and_combat_result or new_combat_resolution_has_cues'
2 passed, 39 deselected in 13.89s (41 collected; 2 executed; exit 0)
```

The selected tests were `test_close_transition_and_combat_result_do_not_reroll` and `test_new_combat_resolution_has_cues_but_restored_result_is_silent`. They verify new confirmation/outcome cues, restored-result silence, unchanged saved state, and interrupted close-to-next-event recovery without duplicated events. This is isolated fixture evidence, not a new earned campaign. The default `file://` URL loaded `서울까지400km.html`: 77,666,839 bytes, SHA-256 `1c5601994277f1603e0d50c164fdab432b561d4c9d0700bbe07c867c78de9d07`, `GAME_BUILD=2026-09-11-director-journey`; bytes and hash matched before and after. The initial sandbox attempt had two Chromium setup errors before application execution. The identical command with approved browser-process escalation passed. Logs, test-file hash and exact result are retained in `audits/director-journey-2026-09-11/whole-review-fix/verification.json`. No runtime or test source changed, and no other browser regressions or campaigns were rerun for this correction.

The first route-forecast launch inside the filesystem sandbox could not start headless Chromium (`TargetClosedError`/macOS process permission). Repeating the same command with the approved browser-process permission passed; this was a tooling launch failure, not a game result. The compact index after the 2026-09-12 owner correction is 78,847 bytes, SHA-256 `0d7eaa54c40e0b12f8d759b18aef337782130f7395ef582617db2f9f8edfb300`; raw campaign hashes and counts remain unchanged.

## Diagnostics, provenance and limits

All final raw directories are explicitly rooted at `artifacts/director-pass-2026-09-11/task8-final/{route-ridge,route-market,recruit-minji,recruit-parkss,recruit-leo,recruit-jaeyi,recruit-eunsu,recruit-kangwoo,crew-checkpoint,finale-transfer,finale-sleep,finale-quarantine,reload-matrix,normal-opening,normal-earned}/`. Each contains its manifest, full trace, run log and applicable saves/captures/videos/downloads. The index names every file-bearing scenario directory and exact top-level hashes. `task8-route-forecast-final/`, `final-route-event-spacing.json`, `controller-qualified-integrity.json`, and the warning baseline are also named and hashed there.

The untracked diagnostic directories are all enumerated in `evidence-index.json` under `diagnosticOnlyDirectories`. They preserve wrong Road-pane selection, stale quest tracking, modal-loop, asynchronous event, resource-policy, camp-choice, record-label, old-page reload-progress and Playwright transfer experiments. They are not successful campaign proof. The two tracked `crew-preliminary.save.json` and `minji-first-night-natural.save.json` fixtures are legacy-only and are never counted as newly earned Task 8 evidence.

All final scenarios have zero JavaScript page errors. Each context reports the known optional development-server request `GET /assets/app-icon.png` as 404; reload produces it once per navigation. This is recorded as an HTTP/console error and is not described as pristine output. No runtime source change was justified for the missing optional development icon.

The source-status arrays truthfully include the observed `docs/CURRENT.md`, `reports/asset-budget.json`, and `qa-artifacts/director-art-2026-09-11/` drift. Those paths were preserved and excluded from Task 8 commits. The runtime stayed byte-identical after `3a3c9aa`; later commits only repaired the evidence harness and therefore do not invalidate already qualified gameplay traces. Each manifest carries the executing harness commit plus runner/helper file hashes, so evidence from different harness revisions is not mixed without labels.

Human playtesting, subjective fun/attachment, unassisted reading pace, physical-phone performance, and production-network load time remain unmeasured. Seeded accelerated browser runs prove state-machine reachability and finite-resource completion, not human pacing. The exact 58 legacy visual warnings and 32 MB advisory remain open limitations for the final director audit.

## Self-review

I re-read the brief and preparation matrix against the final index. Both fresh routes terminate successfully; all six companions have separate full earned flows with the requested contextual memory and a later real-road consequence; the three-method checkpoint is freshly earned and byte-identical across forks; every fork uses actual Continue/live resume, end journal/export and one archive; opening/result/travel reloads are directly executed with meaningful state accounting; the explicitly scoped historical pytest and direct camp-script owners supply external references for the other presentation classes; and the two normal sequences use actual controls, animation and labelled 4-second waits.

I also checked the prohibited shortcuts: the runner contains no custom Dijkstra, `G.openEvent`, state field grants, post-start teleport, bond pumping, manual event reopening, `rev`, or infinite-resource mode. The only final proof inputs are a fresh start or the one tracked earned checkpoint, preloaded once. Diagnostics and legacy fixtures remain distinctly labelled. The remaining action is the controller's independent Task 8 review, followed by Task 9's whole-branch gate and original-project synchronization.
