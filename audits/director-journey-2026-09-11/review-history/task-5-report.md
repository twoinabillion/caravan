# Task 5 — seven city concerns, legal wayfinding and reunion geography

Implemented from accepted base `25ce8abc3cca8a02659b356986ca16c19e8cdc57` in the isolated director worktree. Shared level-design guidance was applied to the existing road graph, signposted commitment and observed quiet/event rhythm. No engine/platformer workflow or new intensity curve was introduced.

## Implementation

- The seven existing city field systems remain the source of local people, actions, costs, rewards and lasting changes. A compact hub strip foregrounds each city's first authored resident action: 금자/공동 국밥 솥, 순덕/국수 좌판, 태호/전광판 배선, 재필/촛불 순찰, 미영/공동 우물 줄, 한 박사/물 배급 화이트보드, 덕구/북문 망루 교대. These are existing writing, not newly authored city quests. Other authored problems, including Miryang's pump and Muju's ventilation, remain in the same field board.
- The strip opens that existing field action by day. After helping, it shows the existing `change.after` from `G.stlImpact`; leaving the hub recalls that same change. At night the strip leads to people and explicitly says field work resumes in the morning. The existing three closed services and people/rest route remain intact.
- The canvas city and canonical Dalguji remain the world view. The owning settlement CSS block now reserves a separate compact row for the concern. The canvas can shrink on 320×578 so the concern, facility choices and established enter/return controls fit. No duplicate emergency overrides or new raster assets were added.
- `G.questObjectivePlan` preserves the authored objective; `G.questNavigationPlan` adds a Cheongju waypoint when the tracked target lies outside an active selected corridor. Gumi remains Gumi. The next-edge filter and remaining-distance search use the existing `G.routeTravelCheck`. Completed routes permit returning to the original target. The current route origin is `S.at` when stopped and `S.driving.from` underway, so the same truthful explanation appears while driving.
- The Gimcheon choice now explicitly says the chosen corridor cannot be left before Cheongju and outside errands require returning after the roads meet. No route guard, authored clinic, choice or resource cost was removed.
- A shared `G.mainEvidenceLocationReady` gates the northern exchange record and both mother scenes on a real stopped Suwon visit. Beat scheduling/dequeue, story dequeue and the accepted central saved-evidence-chain resolver all use it. High cumulative kilometres on southern/midland detours cannot cause an in-person Seoul-outskirts reunion. Completed mother facts now participate in the existing completion table. Deferred legacy chains are consumed through the existing resolver while partial facts remain intact; the explicit Suwon evidence opportunity resumes the work. No generic pending-event save framework was added.
- Scheduler frequency, ordinary slots, quiet intervals and all verification thresholds are unchanged. Observed final campaigns preserve the earlier measured calm/ordinary/required mix. The location defect was fixed at eligibility and saved-chain routing, not by changing pacing targets.
- Guardrails now document corridor-aware remaining-path searches and driving-origin handling.

## Red / green and regression results

All browser tests use isolated headless Chromium. The first sandboxed launch failed at macOS bootstrap-port permission; rerunning with the authorized browser execution scope produced the meaningful RED results.

- `python3 -m pytest -q tests/test_director_cities_routes.py` initial behavioral RED: **3 failed**. The navigator advised a forbidden immediate Gumi edge without completing the route; a 627km Miryang fixture dequeued the mother record/reunion; no hub concern existed.
- After the initial implementation: **3 passed**.
- Additional underway regression RED: `python3 -m pytest -q tests/test_director_cities_routes.py::test_tracked_clinic_routes_through_commitment_then_returns` — **1 failed**, actual cue `None` while `S.at` was empty. Resolving from the driving leg origin fixed it.
- Final `python3 -m pytest -q tests/test_director_cities_routes.py`: **6 passed in 12.49s**. Includes both corridor-to-Cheongju-to-Gumi paths without illegal edges/oscillation; stationary and driving guidance; 627km southern/midland queued/saved mother deferral; actual result-close and Suwon reunion/truth UI continuation; completed-scene suppression; all seven hub/save effects and once-only saved departure echoes; both existing route-specific conditional crew callbacks after save/load.
- The extra callback fixture initially used a nonexistent `G.addComp` setup helper. This was a test setup error, corrected to an explicit labelled crew fixture; no production change was made for it.
- `python3 tests/test_journey_beats.py`: **PASS** on the final build, including companion/region/water/knowledge-related conditions, queue ordering, single dequeue, slot guarantees and zero page errors.
- `python3 tests/test_director_saved_chains.py`: **PASS**, all twelve accepted Task 3 shared/guarded extraction completion/location/recovery combinations.
- `python3 tests/test_city_action_layout.py`: **PASS**, all 28 city × day/night × viewport states, established ≥44px settled enter/return controls, bounds and night closures. This older layout suite manually advances SCENE; it is structural fixture evidence only.
- `python3 tests/capture_director_cities.py`: **PASS**, 14 complete real-control city/viewport flows, normal animation, help/result/back/out, save/reload through the real 머물기 tab, re-entry, night people/back, no clipping/overflow and zero page errors. Its final captures wait for natural toast dismissal.
- `python3 tests/capture_director_route_cues.py`: **PASS**, both stopped recommended-card badges and actual clicked departure/driving waypoint text.
- `python3 tests/test_save_migrations.py`: **PASS**, historical/partial/corrupt saves and zero runtime errors.
- `python3 tests/test_source_health.py`: **PASS**, standalone source parsing, source-size limits and fresh build.
- `npm run build:html --silent`: **PASS**, 1005 validated events, unchanged 58 legacy visual warnings and established 32MB size advisory; HTML 76,121,855 bytes. No warning limit was raised.
- `python3 -m py_compile tools/qa-director-city-route.py tests/capture_director_cities.py` and `git diff --check`: **PASS**.

## Actual final-build journeys and rhythm

`tools/qa-director-city-route.py` starts through new-game UI, chooses the selected branch through real event buttons, uses actual finite-resource engine travel and in-game `G.questPreferredNeighbor`, and completes all five Seoul stops and the ending. Dialogue reveal and driving ticks are accelerated. No resource, evidence, companion, route-completion or finale grants are used. Earlier Task 5 intermediate runs are separately retained; these are the final runs:

| Final trace | Actions | Distance/day | Used events | Driving events | Adjacent driving-event spacing | Result |
|---|---:|---|---:|---:|---|---|
| `artifacts/director-pass-2026-09-11/task5-ridge-final.json` | 106 | 430km/day5 | 54 | 13 | 22–52km | `story_done`, zero errors |
| `artifacts/director-pass-2026-09-11/task5-market-final.json` | 114 | 519km/day6 | 56 | 15 | 11–52km | `story_done`, zero errors |

Both have 41 stationary choices including records/finale. The western 11km spacing is two ordinary opportunities on the longer route, not a lowered minimum assertion. Complete sequences and spacing are extracted into `task5-rhythm-final.json`; the original input traces remain intact. The ridge final sequence still has the original 13 driving events and 22–52km spacing. Ordinary truck cafe, salvage, postman and other events remain reachable alongside guaranteed beats and the bridge. Quiet legs and reduced slot counts still pass the existing beat contract.

- Ridge actually plays rescue→anchor→extract at Sangju196km, earns `route_ridge_saved`, and visits Gimcheon→Sangju→Mungyeong→Chungju→Cheongju; route completion day3. Final finite supplies: fuel37.3975, water19, food24, scrap65, van82.44.
- Market actually plays convoy→mask→pass at Muju208km, earns `route_market_escorted`, and visits Gimcheon→Muju→Jeonju→Nonsan→Daejeon→Cheongju; route completion day4. Final supplies: fuel37.2521, water27, food24, scrap77, van82.42.
- The mother record→reunion→truth now all play **at stopped Suwon**, ridge396km and market485km. The prior crew627km Mungyeong→Chungju defect is reproduced in focused high-mileage/dequeue/chain fixtures; no cumulative-distance location inference remains in this mother path.
- Both earned final saves preserve actual route flags, visited corridor and completed day. Conditional later crew-moment/save behavior and legal return-to-Gumi routing are tested as explicit state fixtures; they are not claimed as a new no-grant Parkss recruitment campaign. City return/revisit/reload paths are exercised through actual controls.

## Visual evidence and provenance

`qa-artifacts/director-cities-2026-09-11/README.md`, `trace.json` and `route-cues.json` identify every capture method. All use live4176 without `rev`; no personal browser profile or other server was touched.

- Forty-two final city frames cover each of seven cities before help, after help and at night, at390×844 and320×578. Representative personally inspected frames include Gwangju before/after390, Miryang before320, Daegu after390, Muju after390, Jeonju before390, Daejeon before390, Suwon after390 and night320. The canvas/facility hierarchy, local copy, field entry, night closures and return action remain visible. The controller also inspected the Gwangju pair without requesting a design revision.
- Four route-cue frames show ridge/market stopped recommendations and driving text. The ridge driving and market stopped frames were visually inspected. These use explicit active-route/tracked-clinic fixtures and an actual clicked departure; they do not claim earned recruitment provenance.
- The original city comparison captures remain at `artifacts/director-pass-2026-09-11/city-before-task5/`. A temporary reload-harness diagnostic is separately labelled under `task5-diagnostics/`: reload restored the destination tab, so the original script looked for a hidden settlement action before selecting 머물기. The corrected runner uses that real tab. A subsequent role-selector typo was also test-only. Neither is reported as a gameplay save failure.
- Toast-covered draft frames were replaced after waiting for natural dismissal. Final shots do not hide/remove UI or manually advance SCENE.

## Self-review and limits

Self-review checked source ownership, one concern CSS owner, night and return behavior, authored-cost preservation, route commitment and original target identity, legal next edges plus remaining paths, driving-origin text, mother geography at enqueue/dequeue/chain, completed/partial save facts and once-only local/crew callbacks. No unresolved Task 5 implementation blocker remains.

This is not human reading-time, attachment/fun, physical-device performance or final whole-game acceptance. The full no-grant final matrix remains Task8; generic pending ordinary/finale presentation reload remains Task7/8. The two complete solo campaigns do not substitute for a final earned high-mileage crew campaign. The seven controller scene candidates remain unwired and unstaged; generated CURRENT/asset-budget drift is excluded. No broad smoke/goal-bag harness or unrelated fixture was weakened or repeatedly rerun.
