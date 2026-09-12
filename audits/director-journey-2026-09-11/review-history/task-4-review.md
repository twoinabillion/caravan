# Task 4 review — choices, tactical advantages and callbacks

Reviewed `ab53578d07509f54f3746c4435404ab0e35ee0d6..422389baf604db16ef0632e432f914a20c37d218` from the supplied once-read package, plus narrowly scoped owner lookups for combat-read consumption and callback display/dispatch.

## Verdict

- **Spec compliance: changes requested.** The implementation delivers distinct successful walker reads, real rush upside in all three chains, truthful categorized previews, saved one-shot opening callbacks, clue reachability coverage, and usable narrow-screen action/result flows. One failure branch still produces a contradictory next-phase tactical benefit, so the required success/failure behavior is not fully correct.
- **Quality: otherwise sound.** State ownership is compact: opening callbacks derive from `S.opening.decisions`, consume by marking that decision, save immediately, and do not add a parallel identity ledger. The supplied settled 390×844 captures show readable preview rows, reachable lower actions, and an actionable retreat result. The known oversized result footer remains Task 6 presentation scope and does not block the control.

## Finding

### Medium — failed Kangwoo scan is still treated as a successful shooting read

- **Location:** `src/03-data.js:5641`; consumed by `src/04b-engine-crew.js:374-382`. The test records this value at `tests/test_director_choice_consequences.py:53` but only asserts successful reads at line 59.
- **Reason:** The failed `강우가 관절 사각을 짚는다` outcome says the joint is already hidden and the next angle cannot be awaited, while its `combatRead.tactics` is still `['사격']`. `G.combatReadDelta` therefore grants the next shooting action `+0.10`, and `G.combatReadNote` records `읽어낸 틈 활용`. A failed scan consequently supplies the same kind of method-specific advantage as the successful scan, contradicting both the result copy and the requested success/failure distinction. The edge/pressure penalty makes the branch worse overall, but it does not remove the false read bonus or false journal attribution.
- **Remedy:** Remove the usable `사격` tactic from this failed outcome (omit `combatRead`, or retain the failure label with an empty/non-final tactic list), then assert that every walker scanner failure gives no matching next-phase read bonus and is never recorded as `읽어낸 틈 활용`. Keep the existing negative edge/pressure effects.

## Residual assessment

No other Task 4 blocker was found. The opening preparation callbacks are distance/event gated, survive save/load through the opening decision, and consume once; the combat preparation links and rush success paths reach their next phases; foreseeable rows avoid odds, rolled outcomes, and rewards; locked requirements remain visible; and the provided narrow captures support the report's usability claims. The two reported broad-suite failures concern controller-assigned Task 8 harness expectations and are not attributable to this diff from the supplied evidence.

## Fix round 1 re-review — `422389b..68d7f2b`

- **Prior finding: resolved.** `src/03-data.js:5637-5641` now keeps the three failed scanner descriptions while giving each an empty usable tactic list. Under the unchanged `G.combatReadDelta` / `G.combatReadNote` consumers, no final walker action receives the `+0.10` read bonus or `읽어낸 틈 활용` attribution. The existing edge `-2`, pressure `+2`, chain, and companion mood effects remain intact; successful reads still map to `교란`, `근접`, and `사격`.
- **Regression coverage: adequate.** `tests/test_director_choice_consequences.py:50-70` applies every scanner failure, inspects every next-phase action, and asserts the zero bonus, absent use attribution, empty failure tactic lists, and final `edge === -2` / `pressure === 3`. This directly covers the previously missed behavior.
- **New findings from fix1: none.** The patch is limited to failed-read usability and its focused regression assertion; it does not alter UI, callback, asset, or other combat-result paths.

**Superseding verdict: spec pass; quality pass within the scoped Task 4 review.** No residual Task 4 finding remains from this review cycle.
