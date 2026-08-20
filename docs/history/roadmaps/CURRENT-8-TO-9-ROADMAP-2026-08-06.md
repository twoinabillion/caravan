# Caravan — Current 8.x to 9.0 Roadmap

Date: 2026-08-06
Baseline: post quality-8 upgrade build
Purpose: move every category currently rated 8.x to a verified 9.0 or higher.

## 1. Scope

The current overall internal score is 8.6/10. Core concept and originality (9.2) and
technical stability (9.3) are already above target; they are release guardrails and must
not regress.

| Category | Current | Target | Gap |
|---|---:|---:|---:|
| Story and worldbuilding | 8.9 | 9.0 | 0.1 |
| Characters and dialogue | 8.7 | 9.0 | 0.3 |
| Core gameplay loop | 8.5 | 9.0 | 0.5 |
| Exploration and content variety | 8.6 | 9.0 | 0.4 |
| Combat and tactics | 8.5 | 9.0 | 0.5 |
| Progression and vehicle customization | 8.4 | 9.0 | 0.6 |
| Visuals and art direction | 8.7 | 9.0 | 0.3 |
| UI/UX and accessibility | 8.3 | 9.0 | 0.7 |
| Audio and music implementation | 8.3 | 9.0 | 0.7 |
| Pacing and onboarding | 8.2 | 9.0 | 0.8 |
| Replayability | 8.2 | 9.0 | 0.8 |
| Polish and release readiness | 8.5 | 9.0 | 0.5 |

## 2. What counts as 9.0

A category is promoted only when all four conditions are true:

1. Its implementation work is complete.
2. Its automated or instrumented promotion gate passes.
3. Blind player evaluation for that category has a median of at least 9.0/10.
4. No release blocker, accessibility failure, save regression, or concept/stability
   regression was introduced.

Automated tests can prove correctness and consistency. They cannot, by themselves, prove
that pacing, dialogue, audio, or replay value feels like a 9.0.

## 3. Delivery order

Recommended solo-development duration: 28–32 working days, followed by any iteration
required by player testing.

| Sprint | Focus | Categories primarily moved | Estimate |
|---|---|---|---:|
| 0 | Measurement lock | All | 2 days |
| 1 | First 45 minutes | Pacing, UI/UX, audio | 5 days |
| 2 | Journey decisions and builds | Core loop, exploration, progression | 6 days |
| 3 | Combat clarity and feel | Combat, UI/UX, audio, visuals | 4 days |
| 4 | Narrative and presentation pass | Story, characters, visuals, pacing | 5 days |
| 5 | Meaningful replay and release hardening | Replayability, polish | 5 days |
| 6 | Blind validation and correction | All | 5+ days |

Do not run these as twelve isolated feature projects. UI, audio, visual feedback, and
pacing should be improved inside the same gameplay scenes so the work compounds.

## 4. Sprint 0 — Measurement lock

### Work

- Add build version, route, settlement dwell time, upgrade selection time, stop reason,
  and key-choice callback completion to the existing quality export.
- Establish a fixed first-45-minute capture route and one complete east/west route seed.
- Record current route choice, upgrade choice, combat tactic, repeat-event, and exit-point
  distributions before balance work.
- Add a single `test:release` command that runs quick validation, quality regression,
  golden route, smoke, keyboard/accessibility, save migration fixtures, simulation, build,
  artifact hashes, and asset budget checks.
- Preserve the current 97.5% overall simulation completion rate as the balance baseline.

### Gate

- The same build produces repeatable scorecard data on two runs.
- Every later task can be tied to a metric, screenshot, or named player-test question.
- HTML remains below 31 MB target and 32 MB hard warning.

## 5. Sprint 1 — First 45 minutes

### Pacing and onboarding: 8.2 → 9.0

- Treat prologue summary → first journey → first event → first settlement → temporary
  companion as one authored vertical slice.
- Keep only the current objective and the next usable action visually dominant.
- Reveal fuel, fatigue, settlement actions, relationships, and combat rules only when each
  system first becomes actionable.
- Prevent more than two heavy scenes in sequence; prioritize two quieter beats after combat.
- Guarantee a visible change in vehicle, relationship, objective, or world state every
  20 minutes and prevent any 30-minute stretch without meaningful change.
- Use quality telemetry to edit the most common pause, backtrack, and early-exit points.

Promotion gate:

- 90% of new players can explain why they are going to Seoul and what 시한(DAY 8) means.
- 90% find the next action within 10 seconds without observer help.
- First-45-minute abandonment is at most 15%.
- No run contains three heavy events in sequence or 30 minutes without meaningful change.
- Blind pacing/onboarding median is at least 9.0.

### UI/UX and accessibility: 8.3 → 9.0

- Apply one information hierarchy everywhere: current action, imminent risk, supporting
  context, optional detail.
- Give each major screen one strongest action: drive, compare route, choose location,
  answer threat, inspect detail, or review history.
- Standardize choice cards as title → expected consequence → requirement/cost.
- Remove repeated resource and mission text across HUD, event sheet, and status panels.
- Complete 360×700, 390×844, and 480×860 audits in normal and large-text modes.
- Extend keyboard coverage from modal samples to the 부산→서울 critical path.
- Verify 200% zoom, reduced motion, screen-reader announcements, focus restoration, and
  minimum 44 px controls.

Promotion gate:

- 95% success on predefined mobile primary-action tasks.
- Zero clipped or overlapping critical controls at all three reference sizes.
- Keyboard, large-text, reduced-motion, and 200%-zoom critical paths all complete.
- No critical information exists only as color or only behind detail mode.
- Blind UI/UX and accessibility median is at least 9.0.

### Audio and music implementation: 8.3 → 9.0

- Perform a real listening audit on speakers, phone speaker, and headphones; automated
  muted-browser tests are not sufficient.
- Loudness-match music, ambience, effects, and voice, then remove abrupt channel jumps and
  audible clipping.
- Give 부산, 밀양, 대구, 무주, 대전, 수원, and 서울 distinct ambient identities using
  restrained layers rather than continuous new tracks.
- Establish a cue language for threat intent, pressure increase, choice confirmation,
  success, partial success, failure, and safe exit.
- Crossfade by place, time, and danger while avoiding short-loop fatigue over 30 minutes.
- Keep the existing four-channel mixer, persistence, lifecycle suspension, and full mute
  as non-regression requirements.

Promotion gate:

- 90% of blind listeners distinguish pressure increase, confirmation, and outcome cues.
- 80% identify at least five of the seven major regions from audio plus a neutral screenshot.
- No clipping, unintended silence, or perceptible channel jump in the full route audit.
- Repetition/fatigue complaints remain below 10% in 30-minute sessions.
- Blind audio implementation median is at least 9.0.

## 6. Sprint 2 — Journey decisions and vehicle identity

### Core gameplay loop: 8.5 → 9.0

- Before departure, compare distance, time, fuel, road danger, supply opportunity, and
  story opportunity without presenting one route as the correct answer.
- Make at least three major route decisions form a clear contract: forecasted risk,
  related road event, arrival consequence, and short journey recap.
- Let current vehicle build and companion skills change route options, not only percentages.
- At arrival, summarize what was gained, lost, delayed, or changed in the settlement.
- Remove unrelated penalties that the departure forecast could not reasonably imply.

Promotion gate:

- 90% of players can explain why they chose their route before departure.
- Forecasted time/fuel/risk agrees with runtime calculation on all tested paths.
- Each of three major route branches has a distinct event or settlement response.
- Core-loop blind median is at least 9.0.

### Exploration and content variety: 8.6 → 9.0

- Give each major region a recognizable exploration question, risk, visual language, and
  permanent trace; do not solve this by merely adding more generic encounters.
- Turn hidden locations into knowledge, relationship, or alternative-solution rewards,
  not only supply containers.
- Make the first road event after leaving a settlement prefer a callback to the action just
  completed there.
- Use route/weather/build context to select variants from the existing event volume.
- Rebalance exploration so the explorer policy remains within 7 percentage points of the
  best completion policy without eliminating risk.

Promotion gate:

- 90% region-identification rate from scenes and local behavior without map labels.
- Every major region has one mechanically distinct exploration decision and persistent trace.
- Explorer completion remains 93–97% and no resource softlock exceeds 1%.
- Exploration/content-variety blind median is at least 9.0.

### Progression and vehicle customization: 8.4 → 9.0

- Make at least four coherent builds viable: survival, maintenance, stealth/trade, and
  rescue/combat.
- Connect at least 80% of upgrades to a route, event choice, settlement action, companion
  interaction, or visible vehicle change—not only a numerical modifier.
- Give strong upgrades a meaningful cost, slot conflict, or missed opportunity.
- Show before/after appearance, changed capability, and newly available action together.
- Add journey-life callbacks after major upgrades so the van feels inhabited and changed.
- Use telemetry to redesign upgrades outside the 5–65% selection range.

Promotion gate:

- Four builds complete the journey without one dominating every situation.
- No upgrade exceeds 65% selection across relevant eligible runs.
- 80% of upgrades affect play outside the status-number display.
- 80% of players describe their own build identity in one sentence.
- Progression/customization blind median is at least 9.0.

## 7. Sprint 3 — Combat clarity and feel

### Combat and tactics: 8.5 → 9.0

- Make success, partial success, and failure explicit data for every combat result.
- Complete objective, failure stake, terrain, enemy intent, and choice metadata for all
  combat, rescue, and escort stages.
- Give walkers, drone formations, checkpoints, ridge rescues, and market escorts distinct
  rules that players can read from the scene before choosing.
- Ensure preparation or a discovered opening changes the final calculation and result scene.
- Provide a nonlethal or safe-exit route where fiction allows it; after repeated failures,
  guarantee recovery without hiding outcome manipulation.
- Combine visual, text, and audio feedback so result, cause, gain, and cost are understandable
  within 10 seconds, including reduced-motion mode.

Promotion gate:

- 90% can explain why a combat result occurred.
- “Unfair result” responses remain below 10%.
- No tactic exceeds 60% selection across comparable states.
- Prepared choices land at 75–90%, normal choices at 55–70%, and unprepared choices at
  25–45%; every required battle has an option of at least 45%.
- Forced success, partial, failure, and exit paths all remain completable.
- Combat/tactics blind median is at least 9.0.

## 8. Sprint 4 — Narrative and presentation

### Story and worldbuilding: 8.9 → 9.0

- Keep the Seoul objective alive at least every 20–30 minutes through actions or reactions,
  not repeated exposition.
- Converge the parents’ work, the 143-year transfer system, the dashboard module, and the
  Namsan core into one clear midgame question.
- Give all 17 recorded key choices an immediate result, a 15–40 km callback, and a late-game
  or ending callback.
- Let companions cite the player’s actual route, settlement, relationship, and sacrifice
  choices before the final decision.
- Make each ending recap at least four specific prior choices without turning them into a
  morality score.

Promotion gate:

- Key-choice callbacks complete at 17/17 immediate, 17/17 near, and 17/17 late.
- 90% explain the core conflict by midgame without opening the lore/status panel.
- Every tested ending recalls at least four actual journey decisions.
- Story/worldbuilding blind median is at least 9.0.

### Characters and dialogue: 8.7 → 9.0

- Create a voice sheet for all six companions: vocabulary, sentence rhythm, humor,
  avoidance, silence, and forbidden generic expressions.
- Rank events by actual exposure and manually edit all S-tier story/companion/ending scenes
  plus the highest-exposure A/B events before touching low-frequency content.
- Change address, sentence length, initiative, and willingness to help by relationship stage.
- Give every companion a mistake, conflict, and repair scene in addition to competence scenes.
- Reflect recruitment approach in at least two later reactions and make companion-pair
  relationships alter scene behavior rather than only bonuses.
- Add checks for repeated sentence openings, premature knowledge, speaker mismatch, and
  duplicate explanation.

Promotion gate:

- 90% speaker-identification rate with names and portraits removed.
- Zero premature-knowledge or wrong-speaker defects in S-tier content.
- Every companion’s recruitment approach has at least two verified callbacks.
- Characters/dialogue blind median is at least 9.0.

### Visuals and art direction: 8.7 → 9.0

- Audit every S-tier scene for character, vehicle, weather, time-of-day, and camera continuity.
- Replace or recrop the highest-exposure generic scene mismatches before creating new assets.
- Ensure vehicle upgrades and passenger silhouettes agree across driving, settlement,
  workshop, combat, and ending scenes.
- Define per-region palette/contrast rules and keep text-safe focal space in interactive art.
- Add before/after screenshot checks for permanent settlement and vehicle changes.
- Compress or reuse before adding assets; preserve the 31 MB target.

Promotion gate:

- Zero S-tier continuity or scene-to-dialogue mismatches.
- Zero unreadable text/art collisions at reference mobile sizes.
- Players identify at least 90% of major regions from unlabeled key scenes.
- Visual/art-direction blind median is at least 9.0.

## 9. Sprint 5 — Meaningful replay and release hardening

### Replayability: 8.2 → 9.0

- Keep full prologue and summary entry, then automatically collapse learned explanations on
  subsequent playthroughs while leaving them available in status/help.
- Before a new journey, show the previous journey’s defining choices and broad unseen branch
  names without completion percentages or spoilers.
- Expose east/west route rumors before the split so players can intentionally prepare.
- Make route, companion approach, and vehicle build each change events, available solutions,
  relationships, and ending details.
- Record meaningful scene/choice overlap between complete runs and redesign branches that
  differ only in flavor text or reward quantity.

Promotion gate:

- At least 35% of meaningful decisions/scenes differ between intentionally opposed runs.
- Each route, recruitment approach, and build axis produces at least two verified callbacks.
- 75% of completers report a concrete reason to start a second journey.
- Second-play setup reaches the road without repeating mandatory learned instruction.
- Replayability blind median is at least 9.0.

### Polish and release readiness: 8.5 → 9.0

- Add save fixtures for at least three historical schema versions and corrupted/partial saves.
- Test pause, background, process return, offline start, muted start, and low-memory recovery
  across HTML and Toss AIT runtimes.
- Audit every critical path for console errors, dead controls, stale ARIA state, missing image,
  missing audio, and untranslated/internal copy.
- Run screenshot comparison on the first 45 minutes, all major settlements, representative
  combat phases, the map, status, journal, and all endings.
- Keep HTML below 31 MB target; produce three identical AIT hashes and a clean asset report.
- Resolve every P0/P1 issue found in blind testing and rerun the full release gate.

Promotion gate:

- Zero blocker/critical defects and zero known progress-loss defects.
- All historical and corrupted-save fixtures recover or fail safely.
- Full release suite passes twice from clean storage and once from migrated storage.
- Two human completions finish without save damage or observer intervention.
- Polish/release-readiness blind median is at least 9.0.

## 10. Sprint 6 — Blind validation

Minimum sample:

| Group | Minimum | Purpose |
|---|---:|---|
| New players, first 45 minutes | 10 | Pacing, onboarding, UI, story comprehension |
| East-route completions | 4 | Journey loop, combat, route identity |
| West-route completions | 4 | Exploration, settlements, supplies, route identity |
| Deliberate second playthrough | 4 | Replay divergence and setup friction |
| Keyboard/large text/reduced motion | 3 | Accessibility critical path |
| Real mobile devices | 5 devices | Touch, performance, audio, lifecycle |

The same person may cover multiple completion groups, but first-45-minute participants must
not have prior experience with the game. Any moment where the observer explains what to do
is logged as a UX failure.

After each round:

1. Fix blockers and repeated confusion before adding enhancements.
2. Rerun the affected focused test plus the full release gate.
3. Repeat only the affected player tasks with fresh participants where learning would bias
   the result.
4. Promote scores only when all category gates and the 9.0 median are satisfied.

## 11. Release-wide guardrails

- Overall simulation completion: 94–99%.
- Difference between play policies: at most 7 percentage points.
- Resource softlock: at most 1%.
- Crisis experience: 12–30%.
- A single route, tactic, or upgrade must not dominate above its stated gate.
- Same event type: no more than two consecutive occurrences.
- Console errors and hard progress locks: zero.
- HTML: below 31 MB target, stop adding assets at 32 MB.
- Core concept remains at least 9.2 and technical stability remains at least 9.3.

## 12. Scope controls

Do not:

- increase scores by adding more generic events to an already large event pool;
- globally raise combat odds instead of improving information and counterplay;
- add explanatory popups where hierarchy or button language can solve the problem;
- create large visual/audio batches without a named interaction and asset budget;
- make one vehicle build mandatory for a route or ending;
- declare 9.0 from automated checks without blind player evidence.

The first implementation action should be Sprint 0 measurement lock, followed by the
first-45-minute vertical slice. That sequence provides the fastest reliable lift across
pacing, UI, audio, core loop, story comprehension, and replay friction.
