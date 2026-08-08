# Design QA: Korean Title Departure Console

## Source and implementation

- Source capture: `/private/tmp/caravan-audit/01-title-mobile.png`
- Mobile implementation: `/private/tmp/caravan-audit-2/01-title-mobile.png`
- Desktop implementation: `/private/tmp/caravan-audit-2/08-title-desktop.png`
- Viewports: 390x844 and 1280x800

## Comparison

- P0: none.
- P1: none.
- P2: none.
- P3: the permanent sound control still uses its legacy mute glyph because the existing automated accessibility and audio contract depends on that label. A future icon-library migration should update the contract and all permanent controls together.

## Acceptance

- Korean title and departure context remain readable over the existing canvas.
- Primary action is visually dominant and fully visible at 390x844.
- Preview, continue, save status, version information, and music control remain available.
- Mobile content does not crop or overlap the safe area.
- Desktop composition preserves the truck artwork and keeps the action console grouped.
- Existing title, audio, preview, naming, intro, and game-entry smoke checks pass.
- Browser page errors: 0.

final result: passed
