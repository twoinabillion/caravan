# Postoffice scene independent review

This is cohort-excluded, isolated engine/actual-reader evidence. Explicit fixture crew/resources are not a natural journey or UI checkpoint. Production edits were root-owned, only the exp_postoffice scene registration/mapping.

- Frozen20 source: new entry and both outcomes chose `event-explore-water`.
- Final expectation: `explore-postoffice-parcels-v1`, registered as `place`, no companions.
- Final unchanged test against frozen20: `before-final.json` = 6 pass / 3 fail, only the three new-picture expectations fail.
- Current source: `after-normalized.json` = 9 pass / 0 fail. Full event text, choice/index/conditions/effects/notes and actual reader remain identical. Current entry and two paid outcomes use the new image; saved old entry/paid views retain the old image. Both text-only old paid receipts preserve text and do not repay effects.

Initial test artifacts are preserved in `initial-fixture/`. The first current-source check had two test-design problems, not game regressions: (1) it assumed image format `detail` before the author supplied the final `place` metadata; (2) the initial fixture compared a fresh state before its first G.load with the post-load state, which correctly adds the existing `recruit_migration_v2` marker. The final fixture performs the same G.save/G.load normalization on both frozen/current baselines before presentation; no state fields are removed from comparison. Original raw fixtures/logs remain in initial-fixture. The fixed checker still gives the expected 6/3 red on frozen20 and 9/0 green after the mapping.

Commands:
`QA_POSTOFFICE_FROZEN20=1 node check.cjs check before-final.json`
`node check.cjs check after-normalized.json`

This does not prove visual style/crop; root inspected the generated asset, live gallery, and actual UI separately.
