# Caravan event typography audit — 2026-08-16

## Scope

Mobile event UI typography, containment, contrast, and control placement at 320×578, 390×844, and 475×948. The audit covers 18 browser-rendered states with Korean production copy, including the longest portrait dialogue and longest narration found in the event data.

## Captured steps

1. **Portrait record — healthy.** Father record card; title, source, name, portrait, and body share stable columns without overlap. Evidence: `after/390x844-01-portrait-record.png`.
2. **Long portrait dialogue — healthy.** 105-character mother dialogue; portrait and copy remain separated and the final clause is visible. Evidence: `after/390x844-02-portrait-dialogue.png`.
3. **Long narration and decision — healthy.** 148-character narration ends with “낯설지 않았다.” and keeps the single choice attached at 320px. Evidence: `after/320x578-03-long-narration.png`.
4. **Combat decision — healthy.** Five authored choices paginate to two cards per page on the smallest viewport and three on larger phones; no card or pager escapes. Evidence: `after/320x578-04-long-choice.png`.
5. **Story outcome — healthy.** Selected action, portrait, outcome copy, receipt, and return control stay in one continuous recorder shell. Evidence: `after/390x844-05-outcome.png`.
6. **Combat outcome — healthy.** Selected action is the visible title, narration uses light terminal text at a measured 14.07:1 contrast, effects align in one row, and the return control remains visible. Evidence: `after/320x578-06-combat-outcome.png`.

## Findings and fixes

- **P1 fixed — history-dependent alignment.** Hidden earlier narration changed the current title and body margins through `:has()`. Current-turn data attributes now own layout.
- **P1 fixed — portrait/dialogue collision.** Dialogue used absolute portrait positioning while record turns used a grid. Both now use the same portrait/copy grid.
- **P1 fixed — long narration clipping.** A one-choice decision reserved too much dock height and hid the last sentence at 320×578. The dock now contracts only for a single choice.
- **P1 fixed — small-screen choice escape.** Combat decisions now calculate two choices per page below 350px or 650px height, otherwise three.
- **P1 fixed — combat result contrast.** Dark paper ink was inherited on the dark combat terminal. Combat result prose now has an explicit light text contract and a regression contrast assertion.
- **P2 fixed — large-choice scene collapse.** Seven-choice story decisions no longer reduce the scene below 170px.
- **P2 fixed — result hierarchy.** Combat outcomes use the selected action as the title; story outcomes retain the event title and use a left-aligned result receipt.

## Verification

- `test:event-typography`: 18 states passed; no clipped text, text outside its surface, escaped controls, sub-44px controls, document overflow, portrait overlap, or runtime errors.
- `test_story_event_layout.py`: passed at 320×578, 375×667, 390×844, and 475×948.
- `test_choice_visibility.py`: passed at mobile, large-text mobile, and desktop viewports.
- `test:accessibility9`: tested large text, 200% zoom, touch targets, reduced motion, focus/controls, and runtime errors in its covered screens.
- `test:smoke`: full game smoke suite passed.
- `verify:quick`: dialogue lint, content references, and scene asset contract passed.

## Visual evidence

- Final 390px board: `after-contact-sheet-390x844.png`
- Final 320px stress board: `after-contact-sheet-320x578.png`
- Before/after portrait comparison: `compare-portrait-dialogue-390x844.png`
- Before/after narration comparison: `compare-long-narration-320x578.png`
- Before/after choice comparison: `compare-combat-choice-320x578.png`

No actionable P0/P1/P2 issue remains in the captured and tested scope.
