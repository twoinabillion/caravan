# Caravan 9.0 blind-validation scorecard

Use this sheet only with the exact candidate build named in the session record. Do not
brief players on controls, intended strategy, story meaning, or which category is under
test. Any observer explanation counts as a task failure.

## Session record

- Build:
- Date:
- Participant ID:
- Prior Caravan experience: none / one completed run / multiple runs
- Device, OS, browser, and viewport:
- Input: touch / mouse / keyboard / assistive technology
- Audio: phone speaker / external speaker / headphones / muted
- Text/motion mode:
- Route and ending:
- Session length:
- Observer interventions:
- Blocker, crash, lost progress, missing image, or missing audio:

## Minimum sample

| Cohort | Minimum | Required evidence |
|---|---:|---|
| New players, first 45 minutes | 10 | Pacing, next-action discovery, DAY 30/Seoul comprehension |
| East-route completions | 4 | Route identity, combat, build, ending callbacks |
| West-route completions | 4 | Exploration, settlement identity, supplies, ending callbacks |
| Deliberate second journeys | 4 | Setup speed, changed scenes/choices, reason to replay |
| Accessibility users/modes | 3 | Keyboard, large text, reduced motion, zoom critical path |
| Real mobile devices | 5 devices | Touch, lifecycle, performance, and audio |

## Observed tasks

Record success without help, time, wrong turns, and the participant's own words.

1. Begin a journey and choose the first road.
2. Explain why Seoul matters and what DAY 30 means.
3. Respond to the first road event and explain the consequence.
4. Enter the first settlement and choose a useful action.
5. Complete a temporary-companion step.
6. Compare the two major route contracts and explain the selected tradeoff.
7. Resolve a combat/rescue/escort phase and explain why the result occurred.
8. Describe the vehicle build in one sentence.
9. Finish the route and name four earlier choices reflected by the ending.
10. Start a second journey and state one concrete reason for choosing a different path.

## Blind ratings

After play, rate each item from 0–10 without showing the baseline scores.

| Category | Rating | One concrete reason | Biggest remaining problem |
|---|---:|---|---|
| Story/worldbuilding | | | |
| Characters/dialogue | | | |
| Core gameplay loop | | | |
| Exploration/content variety | | | |
| Combat/tactics | | | |
| Progression/vehicle customization | | | |
| Visuals/art direction | | | |
| UI/UX/accessibility | | | |
| Audio/music implementation | | | |
| Pacing/onboarding | | | |
| Replayability | | | |
| Polish/release readiness | | | |

## Short category probes

- Story: “What is the central conflict, in your own words?”
- Characters: show six name-free, portrait-free lines and ask who spoke each one.
- Core loop: “Why did you choose that road, and did the arrival match the promise?”
- Exploration: show unlabelled key scenes and ask for the region; ask what changed permanently.
- Combat: “What caused that outcome? Which cue warned you? What would you change?”
- Progression: “What kind of vehicle did you build, and what new action did it enable?”
- Visuals: log character, vehicle, weather, time, camera, crop, and text-safe continuity defects.
- Audio: distinguish pressure, confirmation, success/partial/failure, and safe exit; identify regions from a neutral screenshot plus sound.
- Replay: compare meaningful scene/decision IDs between opposed completed runs.

## Promotion decision

A category becomes 9.0 only when its implementation and automated gates pass, the blind
median is at least 9.0, and no blocker or regression remains. Also require:

- At least 90% understand Seoul/DAY 30, find the next action, explain route choice, and explain combat results.
- First-45-minute abandonment at or below 15%; observer interventions count as UI failures.
- At least 90% speaker and visual-region identification; at least 80% identify five of seven audio regions.
- Audio cue identification at least 90%, with no clipping/jumps and fatigue complaints below 10%.
- At least 35% meaningful divergence between opposed runs; at least 75% of completers name a concrete replay reason.
- Zero P0/P1, progress-loss, S-tier continuity, critical accessibility, or console defects.
- Two unassisted human completions with intact saves.

For each category record: **promote / iterate / blocked**, median, sample size, failed gate,
issue links, fix build, and retest result.
