# Living Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the caravan's places and domestic life change with the actual companions and owned extensions, following Sang's approved living-home-v1 draft.

**Architecture:** HOME remains a read-only projection of actual participants, upgrades and saved memories. A deterministic household layout needs no extra simulation or random assignment. Only a successful existing camp meal writes a versioned domestic moment; the same saved moment can return after actual sleep without replaying any cost or reward.

Implementation ruling after natural QA: physical household presence uses `G.homeParticipants()` including a task escort. Keep `G.campParticipants()` for authored camp-conversation eligibility; the two are intentionally distinct. The original wrong solo meal payloads remain historical evidence, and same-seed replays verify the correction without counting more fresh players.

**Tech Stack:** Existing plain JavaScript, HTML/CSS, Node test harness and live build.

**Spec:** `tools/design-drafts/living-home-v1.html`; Sang approved “이 방향으로 게임에 적용” on 2026-11-10.

## Global Constraints

- Preserve HD room/portraits/atlas, full image ratios, actual upgrade prices/time/capacity and camp meal food1/water1.
- No new generated room, extra resource/bond/time/RNG effects or automatic story advancement.
- Preserve existing paid camp conversations and legacy meals without retroactively inventing dialogue.
- Keep live structural updates staged; do not refresh/apply/reset the user's current preview.
- Prior four journeys are closed in root/CLOSED-before-living-ui.json and cannot verify the new implementation.

## Review Focus

- Guests are present without owning permanent keepsakes; departed memories do not create props.
- Old over-capacity saves retain people and explain shared space rather than inventing new seats.
- A remembered conversation never borrows an absent speaker or an unowned room after roster changes.
- Morning text requires actual sleep, not a free visual mode toggle or a changed wall clock.
- All modes/inspection and the last action remain reachable at320px and short heights; report unavailable actual UI checks separately.

---

### Task 1: Actual household projection

**Files:** `src/07g-ui-home.js`, `tests/test_home_household.cjs`.

**Interfaces:** `HOME.state(S,D,participants)` adds a household snapshot; `HOME.layout(state)` returns stage, capacity, real residents and owned-object positions. Neither mutates S.

- [x] Write failing tests comparing all owned seat stages/capacities to G; verify roster/guests/empty places/departure and read-only stability across save/load.
- [x] Implement deterministic places in current party order, distinguish temporary visitors and explain already-existing over-capacity saves.
- [x] Run household and existing HOME ownership/navigation tests.

### Task 2: Paid domestic moment and morning continuity

**Files:** `src/03j-camp-conversations.js`, `src/04e-engine-world.js`, household tests.

**Interfaces:** `D.homeMealMoment(S,participants)` creates a small versioned frozen record with exact roster/day/campNight, after-meal and morning turns. Only G.prepareCamp('meal') stores it as S.homeLife after the original successful payment.

- [x] Write failing real-engine tests for one exact meal payment, duplicate rejection, unchanged RNG/time/bond, paid camp words and save/load preservation.
- [x] Add approved Minji/Jaeyi/Park domestic exchange and shorter roster-specific alternatives without absent speakers or guest keepsakes.
- [x] Display after-meal text only for its paid camp; morning text only after one actual sleep with matching participants. Legacy already-paid meals remain unchanged.
- [x] Verify refusal, canceled preparation, fatal sleep, departure and subsequent meals.

### Task 3: Approved HOME interface and validation

**Files:** `src/07g-ui-home.js`, existing HOME block in `src/01-style.html`, `src/07-ui.js`, household tests and existing QA records.

**Interfaces:** Existing HOME.html/wire render the roster/seat relation diagram with free day/sleep preview controls and owned-object inspection. Camp supplies its existing meal eligibility; the HOME meal button uses the same data-camp-prep handler and G.prepareCamp owner as the preparation tab. Ending remains read-only.

- [x] Render real portraits, stage/occupied capacity, whole existing room image, place/aisle changes, and one paid domestic record.
- [x] Wire free modes/inspection with focus return, state invariance and stale-cleanup tests. Preserve camp view/scroll on real meal preparation and make its new result reachable.
- [x] Modify the existing CSS owner; use reading-size tokens, minimum44px controls and normal vertical flow at narrow/short sizes.
- [x] Run focused tests, full source/quick/health checks, independent ownership/content review, and fresh finite journeys after freezing the final implementation.
- [x] Inspect actual live UI if available without replacing the user's save; otherwise record that gap. Update CURRENT/checkpoint/memory with exact final evidence.

Final local evidence: `qa-artifacts/living-home-20261110/verification.json`;9028pass/0fail/1unsupported-native skip,37focused, final49source hash unchanged. Two fresh finite journeys and two same-seed controlled replays are separately counted. Actual UI/crop/input/audio unavailable and explicitly not claimed. No commit/push/deployment.

Execution is already authorized by Sang; proceed in this session without another approval gate. No commit/push/deployment is included.
