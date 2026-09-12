### Spec Compliance

- ✅ Spec compliant. The change foregrounds each of the seven authored local people/problems and reuses the existing field action and saved `change.after` state (`src/07-ui.js:3616`, `src/07-ui.js:3687`, `src/07-ui.js:3706`, `src/07-ui.js:3729`); it keeps day/night access and return controls testable at both target widths (`tests/capture_director_cities.py:20`, `tests/capture_director_cities.py:39`, `tests/capture_director_cities.py:43`, `tests/capture_director_cities.py:48`). It signposts the committed Gimcheon corridor (`src/03-data.js:5506`) and preserves the tracked Gumi objective while routing the next edge and remaining path through Cheongju, including while driving (`src/04f-engine-quests.js:17`, `src/04f-engine-quests.js:49`, `src/04f-engine-quests.js:58`, `src/04f-engine-quests.js:67`). It also gates the northern record/reunion/truth sequence to a stopped Suwon visit through beat, story, and saved-chain entry points (`src/04g-engine-evidence.js:47`, `src/04g-engine-evidence.js:49`, `src/04b-engine-crew.js:101`, `src/04b-engine-crew.js:171`).
- ✅ Journey evidence covers both actual finite-resource route completions and their distinct rescue/escort sequences, with `route_ridge_saved`/`route_market_escorted`, Suwon mother scenes, `story_done`, and zero page errors (`artifacts/director-pass-2026-09-11/task5-ridge-final.save.json:1`, `artifacts/director-pass-2026-09-11/task5-market-final.save.json:1`). The extracted rhythm keeps the ridge at 13 driving events with 22–52 km spacing and records the market route's 15-event 11–52 km sequence without changing scheduler thresholds (`artifacts/director-pass-2026-09-11/task5-rhythm-final.json:2`, `artifacts/director-pass-2026-09-11/task5-rhythm-final.json:100`).
- ⚠️ Cannot verify from the textual diff: the binary contents of all 42 city PNGs. The package contains all named before/after/night captures and its full 14-row trace records both viewports, saved state, ≥44 px controls, and no overflow (`qa-artifacts/director-cities-2026-09-11/trace.json:1`). Controller inspection verifies Gwangju before/after at 390, Miryang before at 320, Suwon night at 320, and the ridge driving cue; those representative views satisfy this task's requested visual spot check. The remaining six earned recruitment flows and three final-decision matrix are assigned to Task 8 and are not evidenced by this task diff.

### Strengths

- The objective and navigation plans are separated cleanly: the authored destination stays Gumi while the navigation layer adds only a temporary Cheongju waypoint (`src/04f-engine-quests.js:33`, `src/04f-engine-quests.js:49`). The Dijkstra search and candidate edge use the same route guard, which addresses both illegal recommendations and route oscillation (`src/04f-engine-quests.js:17`, `src/04f-engine-quests.js:62`).
- The location fix is centralized and reused across every entry path instead of adding distance exceptions in multiple schedulers (`src/04g-engine-evidence.js:47`, `src/04b-engine-crew.js:101`, `src/04b-engine-crew.js:171`). Completion flags for the three mother stages make legacy chain consumption idempotent (`src/03l-main-recovery.js:10`, `src/04g-engine-evidence.js:49`).
- The settlement addition has one UI owner and one CSS owner. It preserves the canvas, facilities, night closures, and established enter/return actions while reserving a compact concern row (`src/01-style.html:4019`, `src/01-style.html:4021`, `src/01-style.html:4057`, `src/07-ui.js:3706`). The city test also checks saved departure echoes exactly once, which is meaningful persistent-world coverage (`tests/test_director_cities_routes.py:67`).
- Tests cover both route identities after save, high-mileage non-Suwon deferral, actual Suwon completion, all seven saved hub changes, and both narrow layouts (`tests/test_director_cities_routes.py:6`, `tests/test_director_cities_routes.py:34`, `tests/test_director_cities_routes.py:51`, `tests/test_director_cities_routes.py:85`, `tests/test_director_cities_routes.py:102`). The route-cue capture clicks the actual recommended card and verifies the resulting driving copy (`tests/capture_director_route_cues.py:5`).
- Evidence inspected: both final campaign JSON summaries and ordered event/location traces; both one-line final saves; the complete rhythm JSON; the complete route-cue JSON; all 14 rows of the city trace; the package's 42 PNG inventory and README provenance. A focused outside-diff check for the risk that location-blocked story dequeue might lose progression inspected the only `G.popStory()` callers (`src/04d-engine-director.js:962`, `src/04e-engine-world.js:89`) and the central evidence-row fallback (`src/04g-engine-evidence.js:16`, `src/04g-engine-evidence.js:59`); the mother row remains recoverable at Suwon from its partial flags.

### Issues

#### Critical (Must Fix)

- None.

#### Important (Should Fix)

- None.

#### Minor (Nice to Have)

- `src/04f-engine-quests.js:56` — The route action blindly appends `으로` to the node name, producing the player-facing copy `구미 공단 폐허으로 향한다` in both route captures (`qa-artifacts/director-cities-2026-09-11/route-cues.json:8`, `qa-artifacts/director-cities-2026-09-11/route-cues.json:22`). This makes a prominent navigation instruction read as unfinished Korean. Use the project's particle helper if one exists, or avoid particle selection with copy such as `${name} 방면으로 향한다`.
- `.superpowers/sdd/2026-09-11-director-journey/task-5-report.md:32` — The reported build passes with 58 legacy visual warnings and a 32 MB advisory, so the verification output is not pristine and future warning drift is easier to miss. Keep this non-blocking for Task 5 because the report identifies it as unchanged, but baseline the known warnings and fail on new ones, or clear them in the owning follow-up.

### Assessment

**Task quality:** Approved

**Reasoning:** The task's functional and evidence requirements are met with focused ownership, legal critical paths, persistent city effects, and place-correct saved-chain recovery. The remaining findings are presentation and validation-noise cleanup, not reasons to block Task 5.
