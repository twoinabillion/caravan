# Task 2 report — 두 노선의 다음 정차에서 고르는 일

## Status

Implemented and self-reviewed on branch `codex/director-payoff-20260914` from reviewed Task 1 base `5724e03`.

The implementation adds one earned, location-bound aftermath scene for each route. It reads the existing route outcome flags, opens before the ordinary location event on actual arrival, and remains available as a local stop action for eligible old saves already stopped at the node. It does not modify combat outcomes, route corridors, resource mechanics, or the save schema.

## TDD evidence

### Initial RED

Command run by root against the targeted actual-game test:

```text
python3 -m pytest -q tests/test_director_route_aftermath.py -x
```

Result: `1 failed in 3.39s`.

First failure was the deliberately missing interface:

```text
test_earned_outcome[ridge-route_ridge_saved-success]
actual None == expected 'success'
```

### Implementation iterations

The first implementation run reached `12 passed, 10 failed in 77.55s`. Those failures exposed test-harness assumptions rather than reasons to change mechanics:

- Local-action tests were still on the route tab after `restoreQaView`; the actual action is correctly on the local tab. The tests now select the local tab before clicking.
- Zero-resource fixtures omitted the route argument, making the resolver correctly ineligible. The fixture now passes the route.
- Receipt expectations omitted ordinary awake fatigue from `G.advance`. They now assert the existing formula, `0.045 * elapsed minutes`, plus the authored `+4` for work.

The next run reached `20 passed, 2 failed in 18.32s`. Both remaining failures were test plumbing: Playwright required `arg=` for `wait_for_function`, and restored QA markup needed to be removed before capturing the real rendered layout. The tests now use the supported signature, leave exact-replay mode, and wait for story/result content to settle.

That produced `22 passed in 20.06s` and four settled choice/result captures.

### Cost visibility RED and GREEN

Visual QA then caught that the six exact costs were applied but not shown before selection. A real-DOM assertion was added before production data changed.

Focused RED:

```text
1 failed, 22 deselected in 1.93s
```

The ridge supplies choice exposed only its requirement and omitted the authored expense. The implementation now supplies `foreseeable.expense` through the existing renderer for all six choices:

- Ridge supplies: `의약품 1개 · 시간 15분`
- Ridge work: `시간 90분 · 추가 피로 +4 · 시간 경과 피로 별도`
- Ridge handoff: `시간 10분`
- Market supplies: `고철 2 · 시간 20분`
- Market work: `시간 90분 · 추가 피로 +4 · 시간 경과 피로 별도`
- Market handoff: `시간 10분`

Current aftermath suite: all `24` tests passed as part of the combined aftermath/city run. The two failures in that combined run were isolated to stale city regression fixtures; no Task 2 aftermath test failed.

### Compatibility regression fixtures

The combined run initially reported `28 passed, 2 failed in 31.22s`:

- The ordinary hub concern fixture had no party, so reviewed Task 1 correctly foregrounded a first-companion invitation. It now supplies a valid existing Minji party and companion state, preserving the original test purpose.
- The route callback fixture marked the route complete and drove outside its corridor, but expected a route-specific conversation. It now exercises a valid active corridor through the real choice/receipt/save/reload flow, and separately proves that a completed route outside its corridor opens a normal conversation without inventing route identity. It also uses the established game-screen/onboarding setup from `tests/test_road_checkin.py`.

Focused current verification:

```text
python3 -m pytest -q tests/test_director_cities_routes.py -k 'seven_hubs or active_route'
2 passed, 4 deselected in 5.97s
```

The other four city tests had already passed in the combined run and were not changed.

After self-review strengthened the completed/outside assertion to require `out.ok === true` (so a blocked request could not pass merely by returning no route moment), root reran that exact test: `1 passed, 5 deselected in 5.13s`. A local duplicate attempt could not launch Chromium because the macOS sandbox denied its Mach rendezvous service; it failed before setup or any assertion, and the supported root run is the recorded behavioral result.

## Build and registry evidence

The current Task 2 sources were built successfully after the cost implementation:

```text
npm run build:html --silent
```

Observed build gates:

- Dialogue lint: no issues.
- Content registry: `1040` permanent definitions validated.
- Visual contract: passed for `503` scenes and `73` portraits; the build reported the existing `58` legacy warnings.
- Built HTML: `77,456,465` bytes; the existing recommended-size warning remains.
- Standalone content registry test: PASS.
- Targeted aftermath collection: `24` tests.
- Diff check: clean.

Explicit loader changes:

- `tools/build-html.mjs`: loads `03n-route-aftermath.js` after `03m-finale-reading.js`.
- `tools/content-registry.cjs`: includes `03n-route-aftermath.js`.
- `tools/dialogue-lint.cjs`: includes `03n-route-aftermath.js`.
- `tests/test_content_registry.py`: restores the pre-existing omitted `03m-finale-reading.js`, adds `03n-route-aftermath.js`, and includes existing `D.roadCheckInEvents` in the permanent runtime/built-page grouping so the restored source fixture matches the actual registry contract.

## Narrative and mechanics review

- `D.routeAftermathState` uses an explicit outcome lookup with conservative precedence `failure > partial > success`.
- Both events are permanent `once:true`, `noPool:1`, `w:0`, `type:'스토리'`; neither joins random pools or journey beats.
- Every branch has four narration turns and every choice result has two narration turns.
- Each choice has exactly one permanent action flag, the shared done flag, its specified costs, and one 사건 note linked only to `달구지`. No bond, pillar, supplies, or other reward was added.
- Ridge failure prose only asserts shared facts: all four people survived, all medicine was lost, and an injury occurred. It does not assign the injury to the rescued woman or driver, and does not claim an injury remains at arrival.
- Ridge partial only asserts some medicine was lost because the shared legacy flag does not prove an exact fraction for both extraction choices.
- Market partial only asserts people/seeds/medicine crossed and the convoy was damaged; it does not invent a specific salt or axle loss or claim all five carts remain.
- Market failure preserves both permanent consequences: seeds were lost and people were recorded. Cart work does not erase records or restore seeds.
- Success prose naturally prepares the next delivery rather than explaining engine state.

## Visual QA

Reused only the approved existing scenes from the image contract:

- Ridge: `road-supply-shelter`
- Market: `jeonju-market`

Six actual-game screenshots were captured in `artifacts/director-payoff-20260914/task2-route-aftermath/`:

- `ridge-320-intro.png`
- `ridge-320-choice.png`
- `ridge-320-result.png`
- `market-390-large-intro.png`
- `market-390-large-choice.png`
- `market-390-large-result.png`

The introductions were captured at scroll top to include the event header and in-game scene crop. Choices and results were captured after all story and receipt content reached settled opacity. At 320 px default text and 390 px large text, the approved art is visible, all three choices fit, cost text is readable, the zero-resource handoff remains available, and no overlap was observed.

## Remaining integration scope

No additional broad corridor, saved-chain, or Task 1 suite was run after the final cost/fixture edits. Root requested avoiding redundant broad runs and will run the combined final-build integration gate. Existing generated `docs/CURRENT.md`, `reports/asset-budget.json`, and capture artifacts are intentionally excluded from the Task 2 commit for root packaging.

### Controller regression addendum after task review

The task review found no code issue but requested these gates before approval.
Root ran the built descendant `41f00c5` (Task2 production unchanged; separate
new-game recruitment migration fix included):

- `python3 tests/test_director_saved_chains.py`: exit0, all12 shared/guarded
  Suwon/Cheonan/Cheongju saved-chain probes printed PASS.
- `python3 -m pytest -q tests/test_director_cities_routes.py --tb=short`:
  `6 passed in14.61s`, covering both route corridors and valid/absent route chat.
- `python3 -m pytest tests/test_director_first_meeting.py -q --tb=short`:
  `13 passed in13.07s`, including actual declined-meeting reload and legacy migration.

The final all-feature gate will run again after Task3. These are current
regression results, not a claim that Task3 or final packaging is already complete.

Final controller closure: the frozen Task3 build passed the combined 150-test
gate in400.81s and both actual earned-route continuations reached story_done.
Both aftermath receipts survived real reload and their chosen action appeared
in the default ending. Task2 review and final whole-feature review are Ready.
