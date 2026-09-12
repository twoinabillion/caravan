# Task7 independent review — 79b7271

Reviewer: /root/finale_save_review (gpt-6-astra/high). Spec compliance: ❌. Task quality: Needs fixes. No Critical findings. Full earned campaigns, both routes, six recruitment flows and earned three-method preparation remain Task8/controller acceptance; fixtures do not replace them.

## Important findings (verbatim)

1. **Preparation revisit reopens already completed core work unless the player reloads.**
`src/04h-engine-presentation.js:166` clears the decision receipt and chain. On returning to Seoul, `G.finishArrival` only renders when `seoul_open` is already true (`src/04d-engine-director.js:930`). The normal fifth-stop action still calls `G.seoulEnter(4)`, which unconditionally opens `seoul_core` (`src/04e-engine-world.js:641`; `src/07-ui.js:3529`). This repeats the core choice and its effects/counters, then replays the costs inspection despite `seoul_costs_seen`.

One isolated focused browser probe confirmed:
```text
arrival: pending=null, chain=null, stage=4, costs=true
next normal stop event: seoul_core
```
The new revisit test saves and reloads immediately after reaching Seoul, so it tests Continue recovery while bypassing this live arrival branch. Route both live reentry and Continue through the same earliest-unfinished-finale resolver, and verify the actual arrival/next-action path without reloading.

2. **Conflicting legacy method flags can strand an unprepared save.**
`src/04h-engine-presentation.js:143` correctly routes anything other than exactly one method to the unanswered decision. But `G.prepareFinale` rejects the exit if **any** method flag exists (`:165`). A partial save with conflicting methods and currently insufficient contacts/healthy companions therefore has three locked methods plus a displayed preparation button that does nothing. Reload reproduces the same state.

Use the same resolved-method predicate in recovery and preparation, with an explicit unanswered phase check. Add a conflicting-method fixture where all methods are locked; the existing conflict test uses prepared crew and resolves the conflict by choosing an enabled method.

## Minor findings (verbatim)

- **Combat feedback was dropped during the presentation refactor.** `src/07-ui.js:3341` removes both the combat confirmation cue and the delayed success/partial/failure cue, retaining only `out.sfx`. Restore those cues for newly applied choices under `savedResolution.applied` so restoration remains silent.
- **Reported validation is not entirely clean.** `.superpowers/sdd/2026-09-11-director-journey/task-7-report.md:39` reports 58 existing build warnings, and `:54` reports five stale quality assertions. These are acknowledged downstream items, not new Task7 blockers, but must remain visible in controller acceptance.

## Other reviewer checks

The reviewer approved the trusted authored-action/bounded-data split, restoration bypass of RNG/effects/quality recording, saved450ms handoff through the accepted geographic resolver, actual journey callbacks and attributed six-person voices, state fingerprints across11Seoul phases and ordinary/combat/offer/corrupt cases, and selected-method archive guard.

Focused unchanged-code checks covered escaped renderer attributes/body, G.openEvent encounter counting after road approach, camp receipt guard, archive/export ownership, main-evidence geographic recovery, and actual arrival. One isolated browser probe established Important1; no evidenced suite was rerun. Narrow-control trace was inspected and actual image acceptance relied on controller visual inspection. Checkout/index/HEAD were not changed.

Assessment: The save owner and finale presentation are substantially implemented and meaningfully tested. Preparation recovery still differs between live play and Continue, leaving repeat-effect and corrupt-save dead-end paths that should be fixed before Task7 acceptance.

Controller disposition: Important1–2 enter fix round1. Combat-audio Minor is assigned Task8 before its runtime freeze/final campaigns; warnings and five stale assertions remain assigned Task8/9. No material finding is parked.


## Controller-added reproducibility finding (fix round1)

Important3: tests/test_director_pending.py:62,96,155,200,209,298 and tests/capture_director_finale.py:9 read artifacts/director-pass-2026-09-11/crew-preliminary.save.json, but it is not tracked (git ls-files is empty). Clean checkout/local delivery cannot reproduce the claimed tests. Include the unchanged required legacy fixture and concise hash/provenance/purpose record; preserve existing test paths, and do not reclassify it as final-build earned campaign evidence. Current SHA256 7bf69a049fcc5caba2a1be13a2dbb62ee6edabc75645b8d79871fad5d911e86a. Scoped re-review should verify fixture inclusion/references and exact bytes; no new runtime behavior is requested.

Important3 extension: tests/test_director_camp_ui.py:28 also requires an untracked legacy fixture, artifacts/director-pass-2026-09-11/minji-first-night-natural.save.json (SHA256 b8c44bcf74f15325643e80dc19c137831c10e0d1bad840a66183e80371cf86be). Include it unchanged with purpose/provenance, alongside the crew fixture. task3-conference-route.save.json is already tracked and must be included in delivery because capture_director_evidence.py reads it.

Important4 (controller verification correction): tests/test_director_camp.py:9 and test_director_camp_ui.py:15 expose main() rather than pytest test functions. The reported pytest40 command therefore did not execute those camp scripts. Run both scripts directly once on the fixed Task7 source, record their exact output separately, and correct the report coverage attribution. Preserve unrelated prior task capture artifacts when these scripts write their fixed output paths. This is missing affected regression evidence; no broad suite rerun is requested.

## Fix round1 verdict — 9e777ba

Reviewer /root/finale_save_review: all four findings ADDRESSED; no new Critical/Important breakage. Spec compliance: Task7 compliant within reviewed scope. Task quality: Approved.

- Live arrival and normal fifth-stop now use the Continue owner; actual arrival-control assertions precede reload, with matching live/Continue fingerprints (04d:933,04e:644,pending test:245).
- Shared resolved-method predicate and event-phase guard handle all-locked conflicting saves; ordinary camping heals the injury, and quarantine is selected explicitly after a real return (04h:136,168; test:208).
- Reviewer reconstructed both added fixture files from diff, independently matched their working bytes and original SHA256s, and confirmed legacy-only provenance documentation.
- Report attribution is corrected; separate direct camp/campUI PASS logs and new verification data are present. Prior Task2 artifacts are unchanged in the fix diff.

Reviewer inspected23-case output,2 strengthened return cases, Seoul output and capture trace; no suites or runtime probes rerun. Combat-audio Minor stays Task8, warnings/stale assertions remain downstream. Final earned campaigns/route/recruitment/three-method preparation remain outstanding and are not supplied by these historical fixtures.
