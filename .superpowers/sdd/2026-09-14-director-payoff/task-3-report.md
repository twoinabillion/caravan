# Task 3 report — 선택한 행동만 엔딩에 남기기

## Status

Completed and self-reviewed on `codex/director-payoff-20260914`, based on
reviewed Task 1/2 base `41f00c5`.

`D.routeAftermathRecall(S)` is a pure, conservative reader. It returns one of
the six authored route/action sentences only when all earned evidence agrees:
the known matching `routePlan.id`, a valid combat result, consumed matching
aftermath event ID, its done flag, and exactly one route action flag. It has no
writes or migration behavior. Both `seoul_night` outcome builders prepend that
one selected sentence to the existing dawn narration turn; no turn is added.

## TDD evidence

### RED

Root ran the focused browser test first, before the production reader existed:

```text
python3 -m pytest -q tests/test_director_route_recall.py -x --tb=short
```

Result: `1 failed in 3.11s` (root run `70760`). The expected six literal recall
strings were all empty because `D.routeAftermathRecall` was absent. This was the
intended missing-interface failure. A local launch was not counted as RED: the
macOS sandbox stopped Chrome before page setup.

### GREEN

After the minimal reader and one-turn integration, the final frozen-build
combined GREEN was:

```text
python3 -m pytest -q tests/test_director_route_recall.py tests/test_director_cohesion.py tests/test_director_first_meeting.py tests/test_director_route_aftermath.py tests/test_director_cities_routes.py tests/test_director_pending.py tests/test_chat_continuity.py tests/test_road_checkin.py --tb=short --junitxml=artifacts/director-payoff/final-regressions.xml
```

Result: `150 passed in 400.81s`, with no failures or warnings. This includes
the two new recall tests and the 40 cohesion tests. The focused test initially
exposed only test plumbing (the omitted `solo` return and the intentionally
retained history record); those fixture assertions were corrected without
changing production code.

Additional focused source test:

```text
node tests/test_finale_reading.cjs
```

Result: `Finale reading PASS: 9 method/cast combinations, parent payoff,
untouched choices/effects, original optional records, no state mutation.`

## Coverage and visual evidence

- The new browser matrix covers all six route/action recalls, both night
  outcomes, all three core methods, no-party states, malformed/null saves,
  absent outcome/used/done/action guards, multiple action flags, non-mutation,
  opening/camp recall survival, and the 12-turn ceiling.
- It resolves the actual ridge aftermath through the UI, saves, reloads through
  Continue before finale rendering, then verifies the same visible recall.
- Default record-closed screenshots were captured at 320 default and 390 large
  text, plus the post-reload 390 large result, under
  `artifacts/director-payoff-20260914/task3-route-recall/`.
- The 390 large preference is persisted through `caravan_ui_text`; the replay
  asserts it remains active after reload. Captures remove `qa-exact-replay` and
  wait for settled entry opacity. Root visually inspected all three: the exact
  handoff recall is visible, readable, and the current optional record is
  closed.
- Full local build passed with the pre-existing 58 legacy asset warnings.
  Frozen candidate HTML: `77,458,306` bytes,
  SHA-256 `0cd1a30af4e7de8598f0dc5eb67422e47e6450ea64e53f23c025958190a01a5e`.
  Content registry and AIT checks passed on that build.

## Files changed

- `src/03n-route-aftermath.js`
- `src/03m-finale-reading.js`
- `tests/test_director_route_recall.py`
- `.superpowers/sdd/2026-09-14-director-payoff/task-3-report.md`

## Self-review

- `git diff --check` passed.
- The reader touches neither effects, costs, route outcomes, flags, nor the
  optional original record. It rejects rather than guesses when evidence is
  missing or conflicting.
- The dawn text remains one narration turn and the final TIANYAN lead is
  untouched. Existing personal and camp recalls remain in their original
  position.
- No generated `CURRENT`/asset-budget changes are staged; those build-owned
  files were already dirty and remain outside this task commit.

## Concern

Root's actual earned-route observer found only an overly strict comparison of
raw save timestamps. Gameplay save fields and full-runtime snapshots are equal
across both earned aftermath reloads; this is not a Task 3 source issue.
