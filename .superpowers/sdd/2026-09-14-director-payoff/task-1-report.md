# Task 1 report — 첫 동료를 만날 계기

Status: DONE — task and reload follow-up independently approved.
Commit: `5724e03` (`feat: surface first companion invitations`)
Reload follow-up: `41f00c5` (`fix: preserve declined companion encounters`)

## Outcome

- Added pure `G.firstCompanionInvitation(stlId)` beside `G.openRecruitMeet`.
- The helper requires the player's actual stopped node to own the requested settlement and rejects driving, ended, occupied-party, active recruitment, and already-encountered states.
- All six authored physical cues are returned with the existing meeting-event title and `말을 걸어 볼까?`, without reward or guaranteed-join copy.
- The existing settlement concern slot is replaced by the invitation when eligible. Its `말 걸기 →` click routes through the existing `recruitStl(invitation.id)` flow.
- After a declined/encountered meeting, the ordinary concern slot and alley action return. Canvas recruitment and people re-entry were not changed. No CSS was needed.

## Files in commit

- `src/04a-engine-core.js`
- `src/07-ui.js`
- `tests/test_director_first_meeting.py`

No generated HTML, capture, report, or unrelated file was committed.

## TDD evidence

### RED

Command:

```text
python3 -m pytest tests/test_director_first_meeting.py -q --tb=short
```

Actual feature RED, run by the root agent after my local sandboxed Chrome launch was blocked:

```text
10 failed, 1 passed in 40.43s
```

Failure scope was correct: six helper cases received `invitation=None`, three viewport cases found zero `[data-first-companion]` controls, and the decline flow timed out on the same missing control. There were no fixture page errors. My first local attempt did not count as RED because Chrome exited with `SIGABRT` before tests ran; the requested escalation was transiently rejected by the approval reviewer.

### GREEN

Command:

```text
python3 -m pytest tests/test_director_first_meeting.py -q --tb=short
```

Fresh local result after implementation:

```text
...........                                                              [100%]
11 passed in 12.15s
```

The focused suite uses isolated pages against the built game and covers all six settlements, every required null guard, state purity, real hub clicks, no recruitment/resource spend on entry, decline re-entry, alley opening, settlement exit, viewport fit, and nonzero captures.

### Build

Command:

```text
npm run build:html
```

Result: exit 0. Content validation reported 1,038 events, 58 nodes, 394 scenes, six recruitment definitions, and zero immersion-breaking dialogue findings. The generated HTML was 77,445,832 bytes.

### Existing cohesion regression

Command:

```text
python3 -m pytest tests/test_director_cohesion.py --tb=short
```

Result: exit 0; 40 items collected. The root baseline before production edits was also `40 passed in 50.22s`.

### Diff checks

```text
git diff --check -- src/04a-engine-core.js src/07-ui.js tests/test_director_first_meeting.py
```

Result: exit 0 with no output. The staged-name check before commit listed only the three task files above.

## Live QA and captures

Root live QA used this worktree on `http://localhost:4181/`, found the invitation by visible content/loaded state, captured and inspected all required viewports, and reported no page errors and correct invitation copy. Real CTA clicks were exercised separately by the 11-pass file-mode focused test.

- `artifacts/director-payoff/first-meeting/miryang-320.png` — 90,273 bytes
- `artifacts/director-payoff/first-meeting/miryang-390-large.png` — 107,491 bytes
- `artifacts/director-payoff/first-meeting/miryang-1440.png` — 310,874 bytes

I inspected all three captures at original resolution. The replacement concern fits without clipping or overlap; title, physical cue, and `말 걸기 →` remain readable at 320px, 390px large text, and desktop. The focused test also generated nonzero isolated-page captures under `artifacts/director-payoff-20260914/task1-first-meeting/`.

## Self-review

- The helper performs no writes; the suite snapshots the complete `S` object around inspection.
- The actual-node guard uses `D.nodes[S.at]?.stl===stlId`, so passing a settlement ID alone cannot spoof locality.
- The invitation replaces the single existing `.stl-local-concern` owner rather than adding a second action.
- The click handler invokes `recruitStl(invitation.id)` and therefore preserves the established event/persistence behavior.
- Encountering/declining marks the meet event used, making the helper return null on the next hub render; the pre-existing concern branch then opens the alley.
- No canvas, people-list, recruitment mechanics, styling, assets, or generated HTML source was changed.

## Reload persistence follow-up

Root live QA discovered that a new run did not initialize the existing
`flags.recruit_migration_v2` marker. Its first `G.load()` was therefore treated
as a legacy migration and removed a legitimately declined meeting from `S.used`,
causing the first-companion invitation to reappear after reload.

### Follow-up RED

Command:

```text
python3 -m pytest tests/test_director_first_meeting.py -q -k 'real_decline or markerless' --tb=short
```

Valid result before the fix:

```text
1 failed, 1 passed, 11 deselected in 3.57s
```

The real invitation → authored Parkss decline → result acknowledgement → save →
browser reload → Continue path reached `G.load()`, then failed because the loaded
save no longer contained `meet_bus`. The separate markerless legacy fixture passed,
showing that the existing one-time migration still cleared an old encounter and
then preserved a newly encountered meeting on the next load.

An earlier 45.69-second timeout was test-fixture setup only and is intentionally
excluded from RED evidence: a recurring `add_init_script` cleared local storage on
reload before Continue. The fixture was corrected to rely on `browser.new_page()`'s
isolated context, without pre-marking the new-game state.

### Follow-up fix

- New games now initialize the existing `recruit_migration_v2` marker in their
  initial `flags` object.
- The markerless `G.load()` legacy migration branch is unchanged, so old saves
  retain their one-time opportunity to re-enter the settlement recruitment flow.
- No schema version, encounter ledger, recruitment cost, UI, or asset changed.

Follow-up commit files:

- `src/04a-engine-core.js`
- `tests/test_director_first_meeting.py`

### Follow-up GREEN

Command:

```text
python3 -m pytest tests/test_director_first_meeting.py -q --tb=short
```

Result:

```text
13 passed in 13.07s
```

The required rebuild also completed with `npm run build:html` at exit 0. It
reported 1,040 events, 58 nodes, 394 scenes, six recruitment definitions, and
zero immersion-breaking dialogue findings. Commit `41f00c5` contains only the
two follow-up files listed above; `git diff --check` was clean before commit.

## Concerns

Controller closure: Task 2 corrected the loader fixture; the final 150-test
gate and six re-entry probes passed, and generated reports are included in
the final evidence commit. The two inherited asset limitations below remain
disclosed, not blockers specific to this task.

- `reports/asset-budget.json` remains modified in the worktree after the required build and is intentionally excluded from this task commit; root owns packaging of that generated report.
- The build still reports 58 legacy visual-contract warnings and the existing 32 MB advisory-size overage. Task 1 adds no assets and does not affect those warnings.
- Root identified an unrelated pre-existing content-registry fixture missing `03m`; Task 2 owns that loader-fixture correction, so it was not touched here.
