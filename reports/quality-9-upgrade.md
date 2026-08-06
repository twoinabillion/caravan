# Caravan quality-9 implementation report

Date: 2026-08-06
Build: `2026-08-06-quality3`
Target: move every category previously rated 8.x to a defensible 9.0.

## Result

All feature implementation work and the current automated release gate are complete. The build is
a **9.0 candidate**, not yet a locked 9.0 score: the roadmap deliberately requires blind
player medians of at least 9.0, real-device audio listening, and human completions before
subjective categories can be promoted.

| Category | Baseline | Implementation result | Remaining promotion evidence |
|---|---:|---|---|
| Story/worldbuilding | 8.9 | 17/17 key choices have immediate, near, and ending callbacks; endings recall four actual choices | Blind midgame comprehension and median |
| Characters/dialogue | 8.7 | Six complete voice sheets; all recruitment approaches now return in the first drive and ending | Blind speaker identification and median |
| Core gameplay loop | 8.5 | Route contracts, runtime forecast, event count, build identity, and arrival ledger are connected | Blind route-explanation and median |
| Exploration/variety | 8.6 | Seven persistent settlement fields and settlement-to-road callbacks; explorer simulation is viable | Unlabelled region-identification and median |
| Combat/tactics | 8.5 | 15 combat/rescue/escort phases expose intent and at least two counters; distinct result feedback | Blind result-cause test, tactic distribution, and median |
| Progression/vehicle | 8.4 | 28/28 upgrades affect play beyond a status number; build is included in route recap/replay identity | Four-build player sample, selection distribution, and median |
| Visuals/art direction | 8.7 | Scene-reference, mobile collision, persistent-change, crop, and asset-budget gates pass | Human S-tier continuity and unlabelled-region audit |
| UI/UX/accessibility | 8.3 | Reference mobile sizes, large text, reduced motion, keyboard focus, 200% zoom, and 44 px controls pass | Blind task success and median |
| Audio/music | 8.3 | Four-channel persistent mixer, nine place identities, crossfades, and combat cue language are implemented | Speakers/phone/headphones listening matrix and median |
| Pacing/onboarding | 8.2 | Contextual four-step first-journey guide, heavy-scene telemetry, and meaningful-change gap tracking | Ten fresh-player first-45-minute sessions and median |
| Replayability | 8.2 | Learned guidance collapses; prior route/build/party/choices and alternative-route rumor are shown | Opposed-run divergence and second-run intent sample |
| Polish/release readiness | 8.5 | Successful runs archive once; old/partial/corrupt saves are covered; the unified release gate passes twice | Real-device lifecycle checks, two unassisted completions, and resolution/acceptance of AIT package nondeterminism |

Concept/originality (9.2) and technical stability (9.3) remain guardrails rather than
upgrade targets.

## Automated evidence

- Content: 888 events, 58 nodes, 115 scenes, six recruitment arcs, seven settlement-field explorations.
- Narrative: 17/17 key choices with immediate and 15–40 km callbacks; successful completion supplies 17/17 late callbacks.
- Recruitment: every approach has a concrete post-join drive effect and an ending callback.
- Progression: 28/28 upgrades (100%) connect to an event, route, settlement, companion, seat, or engine behavior.
- Encounters: 15/15 combat, rescue, and escort stages declare intent and at least two counters.
- Accessibility: 360×700, 390×844, and 480×860 pass normal/large text and reduced motion; 200% zoom passes; critical controls remain at least 44 px.
- Balance: 1,000 deterministic runs produce 98.2% completion; direct 100%, prepared 100%, explorer 94.6%; policy spread 5.4 points; crisis exposure 18.7%.
- Packaging: single HTML is 30.64 MB, below the 31 MB target; content/dialogue checks report zero errors.
- Compatibility: historical, quality-v2, partial, malformed, and invalid-location saves recover or fail safely.
- Repeatability: the complete release suite passed twice from fresh browser storage, plus the migrated-save fixtures passed in each run.

### Packaging reproducibility note

The generated HTML content is stable at SHA-256
`91b776463d7074d672641487feb54cfcdca571ab6edc0bea3a6d8cf6b9a467e3`. The three AIT
filenames produced by any one build are byte-identical and checked by the release gate.
Separate invocations of the external `ait build` packager are not byte-identical because
the packager creates a new deployment ID and additional variable package metadata. Treat
“three identical AIT hashes” as unresolved external-packager reproducibility, or formally
replace that roadmap gate with stable HTML/content hash plus same-build alias equality.

## Principal player-facing changes

- A four-step contextual guide carries a new player from route choice through temporary companionship, then auto-collapses on subsequent journeys.
- Route choice now states distance, time, fuel, danger, supply promise, and story promise. Arrival shows the actual time, encounters, vehicle build, and resource deltas.
- Previous successful journeys become usable replay context instead of disappearing after the ending.
- Recruitment choices alter the first drive after joining and are recalled again at the ending.
- Regional ambience and combat feedback have distinct, persistent cue identities while retaining per-channel control.
- Corrupt and older saves no longer poison the runtime or expose a broken continue action.

## Commands

The consolidated command is:

```sh
npm run test:release
```

It builds the HTML and AIT artifact, validates dialogue/content, runs the quality-8 and
quality-9 suites, audits save migration and accessibility, completes the golden route and
full smoke matrix, simulates 1,000 journeys, and checks hashes and asset size.

Blind validation should be recorded with
[`docs/QUALITY-9-BLIND-VALIDATION.md`](../docs/QUALITY-9-BLIND-VALIDATION.md).
