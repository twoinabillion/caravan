# Cycle 8 story — seed 268003

Source-informed isolated public-action VM journey; not blind play or browser/visual QA. One fresh finite-resource run, no retry or resurrection. Raw actions, choices, saves and reloads remain under `agent03/attempt01/`.

## Actual result and review

- **Thirst ending**, DAY19 00:00 at Miryang, 1,230 km. Main story unfinished, party Jaeyi + Park; no Bori.
- 650 recorded actions, 125 choices. All125 entry/label/result records (36,738 characters) manually read, including48 occurrences differing from prior own cycles1–7. 77 occurrences exactly match prior text. Comparing results only,34 differ and91 match. Counts are occurrences, not unique branch claims.
- Six NPC rumor outputs and eleven field-work outputs also read in full. Repeated candle-round work is repeated content.
- 125 unpaid-entry reloads,124 paid-result reloads, zero paid-effect reapplications. Fatal final choice has raw computed outcome prose but **actual UI does not show it**: `src/07-ui.js` returns on `S.ended` immediately after resolution, before rendering. Its tractor-success prose is not a demonstrated visible false ending.
- Raw pair novelty31 versus own cycles1–7 includes nine run-numbered camp IDs; these IDs alone do not prove new authored content. Exact-text counts above are the conservative comparison. Harness baseline separately reports29 pairs; the baselines differ.
- Frozen engine LF SHA256: `4aa512d311b53bdf1a7294df0c9bf7230ea3c7702f07c8af75dd0e3ec839bc0c`. Both source manifests preserve all40src hashes unchanged during the run. Later approved fixes are not attributed to that run.

## Findings and approved minimal fixes

1. **C8-STORY-01: future completion in immediate result.** Trace n432/#83, `comp_wordchain[0].out[0]`, DAY11 06:30 at tunnelbook, Jaeyi/Park, driving null. Camp's current companion pool fires this event after waking; this is not the separate camp-memory reader. At unchanged06:30, the mood-only result claimed clean windows at the next stop. Changed only to “다음 정차 때는 다 같이 유리창을 닦기로 했다.” The other outcome's cleaning/van2 remains intact.
2. **C8-STORY-02: label clarity, not a strong canon error.** Trace n547/#104, `loc_tower[1]`, exchanges scrap3 for battery/part but says “빌린다,” without a return mechanic. Label changed only to “고철을 두고 배터리를 챙긴다 (고철 3).” No loan/return mission added.

Complete choice requirements, outcome probabilities and FX including note bodies of both events are identical before/after. Mechanics SHA256 `4c4b82e6d9feadd02f80cdd9014e490b85d09740255895d2b545430490013910`. Existing narrative-context + dialogue-register checks **25/25 pass** (`story-contract-check.txt`). No low-impact dedicated test or corpus-baseline reset.

## Failure and next public actions

The policy gave short forecast-safe neighbors priority over progress toward the main objective. Hidden spurs bounced to their hubs (tunnelbook6, spring3, tower4 visits), while a westward detour goal displaced the displayed main objective. Seventeen public fuel-recovery actions consumed time/resources. Two Muju→Jeonju departures were rejected for insufficient actual fuel (trace419,525); raw failures are retained. 56 travel calls include54 successful departures.

At DAY18 19:33, Miryang was reached just after the19:30 market/alley closing. The policy explored120minutes, then at21:33 chose public fuel recovery, paying scrap20 for6L and300minutes. Without food/water and with ongoing thirst, midnight ended the journey147minutes into that action. Market and pump were **not public nighttime alternatives**: `showStl` routes non-people sections back to the night hub even though lower-level trade/field APIs omit that gate.

People → “이곳에서 하룻밤 묵는다” remained an actual public next action, but observation5 makes the town refuse shelter supplies. The initial suggestion that camp would rescue this state was disproved and is **not** a reported recovery. A separate reconstructed diagnostic (`terminal-camp-diagnostic.json`, terminal save plus last observed scalar fields; no natural journey count) confirms camp reaches the same midnight thirst ending. The final fuel event's other enabled option is ten-hour walking without water replenishment; it is not a demonstrated survival escape. No safe escape is established at that final corner. Earlier route/supply decisions caused it; this does not establish an engine softlock.

Cycle9 preparation: main-objective-first, no hidden detour loops, different party, rest/replenish before this state. No cycle8 retry, event injection or resource grants.

## Natural scope and gaps

Naturally revisited repaired tunnelbook paid-food choice1 (food2→1), time-neutral spring entry/bottle choice1, tower scrap3 payment, and Park medicine-task choice0. Park was a valid temporary recruitment passenger during camp before joining. Only the encountered branches are covered. Wordchain/tower originals are findings, not natural post-fix rechecks.

`ev_uplink` at Muju→Yeongdong is consistent with authored Yeongdong `region:'north'`; no geographic bug claim. Jaeyi mock accounting is framed as play-acting, not real inventory. Prior non-defect Sutra age readings were not reopened.

Jaeyi05/09, noodleworks, conflict fuel-detour, Bori life/family features, Leo, Gwangju, lighthouse, Seoul/core/main ending did **not** occur. No screenshot/crop/image QA claimed; root handles that separately.
