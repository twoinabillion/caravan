# Goal · Bag · Portrait Surface Audit — 2026-08-17

## Scope

Chrome 390 × 844 current-run captures plus automated checks at 320 × 578, 375 × 553, 360 × 700, 390 × 844, 462 × 832, and 476 × 809. The audit covers Bag slot alignment, repeated Bag ↔ Goal switching, and legacy/canonical event portrait presentation.

## Root causes found

1. Goal and Bag reused `#status-prop` and `#st-body` without an explicit active-surface contract. Swapping classes and `innerHTML` alone allowed stale nodes/styles to remain observable after navigation.
2. Bag title, icon, and quantity used three independent horizontal offsets. Small corrections therefore fixed one layer while moving another out of alignment.
3. Main companion portraits had two sources of truth: canonical files in `assets/portraits/` and stale base64 copies in `src/03b-portraits.js`. Replacing the asset file did not update the standalone game HTML.
4. Seventeen older illustrated NPC portraits do not match the current realistic scene/character direction.

## Fix contract

- Goal and Bag now set `data-tool-surface`, clear the shared body with `replaceChildren()`, and cannot display the other surface's live content.
- Bag slot name, icon, and quantity share one measured `--bag-slot-content-x` token.
- Main portraits are embedded from `assets/portraits/*.png` at build time; a byte-for-byte audit fails if the standalone HTML diverges.
- Legacy illustrated NPC portraits are withheld from cinematic dialogue until coherent replacements exist. Their names, dialogue, choices, and scene art remain intact.

## Captured steps

| Step | Description | Health | Evidence |
| --- | --- | --- | --- |
| 1 | Bag opened with Medicine selected; all five slot labels, icons, and quantities share the stitched pocket centerline | Healthy | `after/01-bag-medicine.png` |
| 2 | Goal opened immediately after Bag; Bag DOM count is 0 and Goal DOM count is 3 | Healthy | `after/02-goal-after-bag.png` |
| 3 | Bag reopened after Goal; Goal DOM count is 0 and Bag state is complete | Healthy | `after/03-bag-after-goal.png` |
| 4 | Goal opened after a second switch; isolation remains stable | Healthy | `after/04-goal-after-second-bag.png` |
| 5 | Event with a legacy illustrated NPC; incompatible avatar is absent while scene, copy, and choices remain contained | Healthy | `after/05-legacy-portrait-event.png` |
| 6 | Event with canonical Minji portrait; current realistic portrait is embedded and displayed | Healthy | `after/06-canonical-portrait-event.png` |

## Regression evidence

- `npm run test:surface-contract`: passed across six mobile viewports and two repeated Bag ↔ Goal cycles.
- `npm run test:event-typography`: passed 18 event states for portrait/text overlap, containment, contrast, and choice paging.
- `npm run test:accessibility9`: passed three mobile sizes, large text, 200% zoom, reduced motion, controls, and runtime checks.
- `npm run test:smoke`: passed.
- `npm run verify:quick`: dialogue, content, scene assets, and canonical portrait-byte checks passed.

## Result

No actionable state-leak, slot-axis, stale main-portrait, event-containment, or mobile-overflow issue remains in the captured scope. Full raw metrics are in `after/metrics.json`.
