# Task 2 report — First night and six companion voices

Status: DONE_WITH_CONCERNS (one reproduced pre-existing regression-suite mismatch; implementation and focused checks pass).
Base: `fae8b8b3f8e9b0674d575753086ab02c9ac7a126`.
Worktree: `/Users/sang/_workspace/caravan-director-20260911`.

## Implementation

- Added focused `src/03j-camp-conversations.js`: two authored, optional replies for each of Minji, Park, Leo, Jaeyi, Eunsu, and Kangwoo. Adapted the follow-up beats around useful work versus belonging, shared responsibility, silence without performing, space for personal possessions, uncertain information without orders, and trust without controlling others. Later visits acknowledge the home object. Personal quest secrets and formal recruitment remain in their existing stages.
- The camp roster includes `recruitQ.stage` road, follow, and ready guests without placing them in `S.party`. Task-stage recruits are not represented as overnight guests.
- Choosing a person opens the existing event/result shell. Reply previews show time and required supplies; the player can return without replying and revisit or pick somebody else. One resolved substantial conversation per sleep interval, including a reply that crosses midnight.
- Saved `campNight`, `campConversation`, and `campMemories` retain identity, frozen prior-event context, selected reply, result chips, result time, active/recoverable UI state, individual home change, and pending road behavior. Resolved replay/reload cannot spend time/resources or grant bond twice. Legacy unplayed talk plans migrate to unselected status.
- Context reads actual journey recap, recruitment approach, last combat outcome, and saved opening bus-repair choice. It does not turn a failure/retreat into a victory. No flags, companions, or main-story evidence are granted by camp dialogue.
- Guests accumulate a pending bond credit that applies once on voluntary joining. Existing sleep-wide bond remains; removed the old second application of the selected-person +2 at sleep.
- Extended the existing `D.companionKeepsakes` home rendering rather than introducing a second object catalogue. The selected reply changes its visible description. The next travel leg shows a saved, companion-specific action; it survives drive reload and is consumed for subsequent legs.
- Pending, completed, and reread UI are distinct. Time labels come from the clock; daytime is not labelled sunset. Daytime uses present companions' existing daylight artwork, with compact status for solo daytime rather than a nighttime image. Shortened the result keepsake chip and hunger cell to avoid clipping at 360px. Existing CSS owner updated; no override block added.
- Live QA exposed an existing delayed morning-event race. Camp timers now retain an incident in the existing story queue when a modal is open and ignore a replaced game state. Optional morning banter cannot overwrite an open camp exchange.

## Files

- `src/03j-camp-conversations.js` — six voices and reply-specific home/travel outcomes.
- `src/04e-engine-world.js` — camp participants, saved conversation, resolution, travel memory, timer handoff.
- `src/04a-engine-core.js` — new-state defaults and old-save backfill.
- `src/04c-engine-travel.js` — consume pending camp memory at actual departure.
- `src/04d-engine-director.js` — transfer guest bond on successful recruitment.
- `src/07-ui.js` — reuse event shell, result recovery, roster/home/road rendering.
- `src/01-style.html` — guest label and full-width solo empty state in existing camp owner.
- `tools/build-html.mjs` — include focused data module.
- `tests/test_director_camp.py`, `tests/test_director_camp_ui.py` — behavioral and live-mobile coverage.

Generated HTML was rebuilt by the build command, never hand-edited. Controller plan edits, unrelated art assets, `docs/CURRENT.md`, and generated asset-budget report are excluded from this task commit. Opening-test recaptures were restored to HEAD after testing so this task does not alter Task 1 evidence.

## TDD and checks

RED: `python3 tests/test_director_camp.py` before implementation reached the running game and failed with `TypeError: G.campParticipants is not a function`. Initial sandboxed browser launch was blocked by the OS; isolated headless Chrome runs succeeded with the required execution escalation. No personal browser or save was used.

GREEN and focused verification:

| Command | Result |
|---|---|
| `python3 tests/test_director_camp.py` | PASS: 12 road/follow guest fixtures; all six context/choice/results; pending and resolved save replay; conflicting reply denial; midnight lock; guest credit once; old-save migration; all six night gate → save → full-seat rejection → free-seat join; all three resource-cost rejections; queued morning event and replaced-game timer |
| `python3 tests/test_director_camp_ui.py` | PASS: live natural pre-join Minji selection/cancel/revisit, pending reload, resolved reload, unchanged guest stage/party, home memory, next road; six authored voices and second replies; established-camp revisits; 360px choice bounds and next actions; zero page errors |
| `python3 tests/test_recruitment_flow_qa.py` | PASS: all six discovery, destinations, retry, joining, dialogue speakers and existing scene references |
| `python3 tests/test_recruit_return_visibility.py` | PASS: all six return discovery in map and list |
| `python3 tests/test_recruit_decision_ui.py` | PASS: available/full-seat join UI, cancel option and control bounds |
| `python3 tests/test_companion_profile_moments.py` | PASS: perk/profile, daily talk, road talk and dynamic speakers |
| `python3 tests/test_save_migrations.py` | PASS: historical, partial, quality, corruption fixtures; zero runtime errors |
| `python3 tests/test_director_opening.py` | PASS: playable saved departure |
| `npm run build:html` | PASS: dialogue/content checks and visual-contract geometry; final HTML 76,087,304 bytes. Existing 58 legacy art warnings and 32MB advisory retained; under existing 80MB hard limit |
| `git diff --check` | PASS |

`tests/test_companions_e2e.py` still fails six **pre-existing** Lv3/signature assertions. Its fixture only pumps bond and chooses level 1/2 perks (lines 98–104); it never completes the existing personal-story stages required by `G.checkLevel`. All six `started`, `joined`, `driveEcho`, and `endingEcho` results are true; all stop at level 2, correctly retaining the story guard. Reproduced identical results using `/private/tmp/caravan-task2-baseline.html`, constructed by replacing the changed engine/UI source segments with `git show fae8b8b3f8e9b0674d575753086ab02c9ac7a126:<path>` inside the generated HTML; executed with `python3 /private/tmp/caravan-task2-baseline-e2e.py`. No threshold was weakened to satisfy this obsolete test expectation.

## Live evidence and visual inspection

Server reused: `127.0.0.1:4176`. Tests use its actual `/game?caravan-live=1` endpoint without `rev`, because the existing studio shell intentionally enables infinite resources when `rev` is present. Final natural captures and tests assert normal resource mode. No user server was restarted or killed.

Evidence directory: `artifacts/director-pass-2026-09-11/camp-task2/`.

- `01-natural-prejoin-hub-390.png`: real checkpoint, Minji explicitly labelled temporary guest, no completed conversation implied.
- `02-natural-prejoin-exchange-390.png`: specific exchange, two replies, time/supply preview and cancel.
- `03-natural-prejoin-result-390.png`: selected result and compact time/bond/home confirmation.
- `04-natural-prejoin-home-390.png`: persistent modified keepsake and reachable sleep action.
- `05-natural-next-road-390.png`: exact reply-specific next-leg behavior.
- `fixture-{minji,parkss,leo,jaeyi,eunsu,kangwoo}-{reply,home,established}-360.png`: six explicit diagnostic fixtures, narrow-screen results/home/revisit.
- `fixture-solo-day-hub-360.png`, `fixture-all-six-day-hub-360.png`, `fixture-all-six-people-360.png`: supplemental live inspections of solo daytime, full roster, daylight scene and reachable sleep. The supplemental captures predate only the final compact hunger-label/empty-width correction; final standard UI captures include that correction.
- `verification.json`: recorded natural state, chosen memory, next drive echo, six speaker lists and choice rectangles, zero page errors.

Manually inspected natural initial/exchange/result/home/road and narrow six-companion replies, plus solo/day/full-roster screens with the image viewer. Controls fit their viewport; transcript history can scroll; current replies and return/sleep actions remain reachable. The capture harness originally froze CSS via `restoreQaView`; it now removes that diagnostic pause before gameplay and waits for the camp entrance opacity, so final images show the actual rendered stage rather than a frozen first animation frame.

## Limits / self-review

The supplied Minji checkpoint is a **natural pre-join follow-stage** checkpoint at day 3, 154km, Gyeongju. It is not literally the first night: the earlier Ulsan road-stage camp already happened. That distinction is retained in filenames and this report. Road-stage inclusion is covered by explicit fixtures. All-six end-to-end no-grant journey proofs remain Task 8; these tests do not claim them.

Only existing canonical art was reused, with no new raster files. Daytime companion plates depict their ordinary activity; a dedicated daytime solo camp plate is unnecessary because that state uses the compact roster/status surface. UI and engine files are already large; edits stayed within their current owners and no broad restructuring was attempted.

Attachment, pacing preference, physical-device performance, and six naturally completed recruitment chains are not established by these automated fixtures. The reproduced legacy Lv3 suite mismatch is the only outstanding test failure in the listed checks.

Controller supplemental evidence received before commit: a fresh UI run without grants reached the **literal first guest camp**, Ulsan 120km, day 2 17:22, `recruitQ.stage='road'`, empty formal party. Root independently inspected `artifacts/director-pass-2026-09-11/minji-first-guest-camp.{json,png,save.json}` and confirmed the temporary Minji talk action, 함께 1명, and zero page errors. This fills first-road-night availability evidence; the Gyeongju test above separately proves the full selected exchange and persistence.

## Review fix round — multiple pending promises and partial camp saves

Base: `ff71e32`. Addressed the controller's focused review findings.

- `G.campTravelEchoes()` now gathers every pending behavior for currently present participants. The next actual departure stores the complete list in `S.driving.campEchoes` and consumes all those pending markers together. `G.campDriveEchoes()` reads the new list and preserves existing single-echo `S.driving.campEcho` saves. One compact road-memory section renders all participants' behaviors; a subsequent leg does not repeat them.
- Changed the four road lines containing “어제” to time-neutral references. A departure on the same evening, or after more than one sleep, no longer makes an unsupported calendar claim.
- Camp save normalization now drops null/non-object/unknown companion-memory rows, normalizes pending bond to a finite nonnegative integer, repairs missing text/IDs, and validates the saved conversation's companion, night, and selected reply. Missing/non-array result chips become an empty list, preserving resolved status and preventing duplicate resolution. This is limited to camp-owned fields; no general migration or main-story threshold changed.
- Added a diagnostic two-conversation sequence: Minji conversation → actual sleep → Park conversation → actual departure → save/load of both callbacks → legacy single-echo load → arrival and second actual departure with no callback repeated. Added partial/corrupt camp records with `chips:null`, null memory rows, string/nonfinite/negative pending bond, and unknown companion IDs.

TDD: amended `python3 tests/test_director_camp.py` failed before the fix with `TypeError: G.campTravelEchoes is not a function`. After implementation it passed: `PASS: camp guests/choices/saves, all pending next-leg behaviors, legacy echoes, second-leg nonduplication and partial-save corruption`.

Focused validation only:

- `python3 tests/test_director_camp.py` — PASS, including the amended multiple-promise and corruption fixtures.
- `python3 tests/test_save_migrations.py` — PASS, historical/partial/corrupt save fixtures; zero runtime errors.
- `python3 tests/test_director_camp_ui.py --multi-echo` — PASS, one visible 360px road-memory section with both Minji and Park after reload, no overlap/overflow, pending markers consumed, legacy single echo still visible, zero page errors. Explicit fixture marks onboarding completed so the road is actually visible; checks also reject an overlying event modal.
- `npm run build:html` — PASS, 76,089,016 bytes; only the existing legacy-art and advisory-size warnings.
- `git diff --check` — PASS.

Live server reused at `http://127.0.0.1:4176/game?caravan-live=1`; controller restarted its expired server before this round. No user servers or personal browser profiles were touched. New evidence: `artifacts/director-pass-2026-09-11/camp-task2/review-two-camp-promises-360.png` and `review-two-camp-promises.json`. Manually inspected the final narrow callback capture. No broader test suite was rerun. Previously documented baseline Lv3 test mismatch remains unchanged.
