# Cycle16 story repairs for cycle17

Natural findings S16-01 and S16-02: seed-warehouse player reflection now uses `me`; station sign and stationmaster diary use separate record metadata. The station has one choice and one outcome; its explicit outcome metadata prevents entry-title inheritance. All three seed-warehouse outcomes are checked, including unchanged alternatives.

S16-C01 remains a clarity improvement rather than another confirmed reader defect: the scarecrow ambient now describes a current rear-view impression without claiming the player saw the same place yesterday. Only this ambient sentence changed; the two events' prose, choice order, gates, outcome probabilities and effects are byte-for-byte equal after removing the three added metadata fields.

`capture-before.cjs` uses the actual cycle16 source snapshot to preserve four distinct paid outcome fixtures and readers. These are deliberately named fixtures and excluded from natural-play totals. Regression checks solo/Leo/Minji+Eunsu roles, all outcomes, current real-reader payment/reload, entry metadata independence, and old frozen-view plus frozen-text-only saves.

- `red.txt`: 7 failures / 7 passes before production repair.
- `green.txt`: 14/14 after repair.
- `focused-pre-integration.txt`: 31/31 including unchanged quote corpus/mechanics contracts.
- `lint-pre-integration.txt`: 0 errors, 5,803 samples; two pre-existing manual candidates.
- `exact-delta.json`: exact field-level specification.

The quote contract asserts only the three exact new reader fields before projecting them to prior undefined values. No corpus baseline was replaced. The ambient remains outside the event quote corpus and has its own exact regression. Root owns the new seed-warehouse scene asset and mapping; story did not change raster assets.

Other agents' approved deltas are integrated separately after final specifications arrive. No cycle17 natural journey has started before freeze.

Final integration is complete. Systems salt-worker metadata and grandfather-envelope current-action copy, plus survival cold-medicine note/current echo/current-night plan copy, were checked against their exact manifests. The event-note/prose projections assert the specific new values and preserve old corpus baselines. Chat/echo text has exact source assertions without inventing an event-corpus projection.

`integration-final.txt`: **109/109 pass** (three owners' regressions, dialogue contract, all story-contract consumers). `lint-final.txt`: **0 errors / 5,803 samples**, same two manual candidates. `all-team-projection.json` preserves all three manifests. Production story edits and shared projection edits are finished; cycle17 waits for root's frozen source.
