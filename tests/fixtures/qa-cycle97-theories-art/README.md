# QA97 theories immutable pre-wiring baseline

Captured from production before the 97 theories night variant was registered. `baseline.json` records exact hashes of 03-data, 03g, 04h and 07 at capture. `SHA256.json` pins all 11 JSON fixture files; none is an expected-new-asset projection.

Four files are exact bytes copied from cycle96 survival/agent96/attempt01, seed961157, choice n230 DAY8: trace snapshot rounds to 21:30, while the original save clock is min1289.7 (21:29:42). New-payment clock assertions use the exact raw saved minute. They are natural first-capture-before unpaid, after-view unpaid, choice entry, and actual paid choice0. Absolute source path and SHA are in baseline.provenance. Natural96 failed journey remains unchanged. Natural paid choice1 does not exist and is not claimed.

`controlled-600-*` and `controlled-1290-*` are six controlled fixtures derived from the natural unpaid save with explicitly adjusted clock/resources and a fresh event receipt. They capture entry plus both authored outcomes at day/night. They are diagnostics, not natural runs or additional players. Both complete event definitions, entry turns/knownSpeaker, result words/roles/chips and state are preserved in baseline.rows.

The test's view-only and text-only variants are made in memory by deleting reader metadata. No original file is overwritten. Untimed original receipts keep their old base scene, words, chips and no-repayment behavior; text-only mode does not claim to recover removed dialogue-role information. New payment from an old unpaid receipt may use qa97/current clock, while its history retains the old entry. Stored reader and view-only modes retain their actual roles and keys.

Current tests cover 05:29/05:30/19:29/19:30, every entry and result turn, both choices, load before the first view capture, paid load before the first result capture, subsequent paid replay, explicit knownSpeaker comparisons, exact event/gameplay preservation, natural/controlled legacy states, and real delivery geometry. UI crop/audio are not covered.
