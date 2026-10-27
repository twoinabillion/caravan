# Six scene mappings — independent regression

Scope: six root-owned scene changes for cycle22. This directory contains isolated, cohort-excluded engine/actual-reader fixtures, never natural journey checkpoints. All fixture crew/resources and weighted outcome selection are explicit in check.cjs. They must not be added to fresh/resume/choice coverage.

Frozen21 is the immutable baseline. Seven entry variants cover all six events plus both mother-reunion states of story_bridge_crew_question. Every authored outcome is exercised: 18 outcomes total. The baseline contains complete event object/function source, actual entry/result turns, chips, all compared resource/time/flag/note/crew state, and saved old scene keys.

`before.json`: 57 pass / 25 fail. Only seven new-entry and eighteen new-result scene expectations fail. All full-body/FX/condition/index, explicit leading scene priority, old unpaid/paid saved-view and text-only checks already pass.

The current-image tests will verify registration, description and metadata presence without assuming any particular format. Production UI source must still equal frozen21. Both sides first perform G.save/G.load normalization before beginning a presentation, so existing load migrations are compared consistently. No state field is omitted just to hide a mismatch.

Commands (from repository root):

- Prepare once: `node qa-artifacts/qa-cycle-20261026/cycle21/systems/visual-six-review/check.cjs prepare`
- Frozen baseline red: `QA_VISUAL_FROZEN21=1 node qa-artifacts/qa-cycle-20261026/cycle21/systems/visual-six-review/check.cjs check before.json`
- After root connects images: `node qa-artifacts/qa-cycle-20261026/cycle21/systems/visual-six-review/check.cjs check after.json`

Do not rerun prepare over its retained baseline. The checker refuses to replace it. This engine/parser check does not claim image style, crop, actual browser interaction or audio QA; root owns those checks.

Final result: `after.json` **82 pass / 0 fail**. The seven original unpaid presentations and eighteen original paid outcomes (including text-only legacy views) retain their saved scene keys, full reader and already-paid effects. New presentations select the six approved mappings.

`source-diff.json` compares every one of frozen21's 40 source files: only `src/03g-scenes.js` changed. `source.diff` retains that complete change. `registry-diff.json` independently checks the loaded registries: exactly five new asset paths, descriptions and metadata entries, and exactly six event mappings; all five files exist. No event body, branch, condition, index, time, FX, note or UI source changed. The initial diff-report helper used an incorrect filename assumption; its assertion was corrected to the actual observed owning file, without modifying production source.

These 82 checks and their seven-entry/eighteen-outcome fixtures remain cohort-excluded. Root's `cycle21/visual-review.json` owns original image/live-gallery inspection; this independent engine/reader check does not certify browser crop. No cycle22 journey was started as part of this image regression.
