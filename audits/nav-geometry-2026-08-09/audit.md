# Armored navigation geometry audit

## Implementation status

Fixed in the game on 2026-08-09. The original sections below document the pre-fix evidence and diagnosis; the final section records the implementation verification.

## Audit scope

- Surface: five-button armored navigation dock
- States captured: initial rest, pointer hold, keyboard focus
- Evidence: user-provided 1280 × 306 Retina crop and a fresh 640 × 860 Chromium render
- Goal: make each face, icon, and label read as centered inside the metal shell's corresponding well

## Verdict

The remaining drift is structural, not typographic. The shell artwork's five wells are not positioned at equal 20% intervals, but the five CSS buttons are. The raised button face and its icon/label are centered on the equal CSS grid, so they progressively diverge from the wells built into the background image. Content-only 0.5–1px corrections cannot solve that registration error.

## Captured steps

1. Initial resting navigation — needs structural correction
   - Road reads left of its shell well.
   - Inventory and Menu read right of their shell wells.
   - The icon/label groups are centered inside their raised face assets; the raised face assets themselves are misregistered against the shell.
2. Pointer-held state — interaction is healthy
   - The recessed face, icon, and label move vertically together.
   - No sideways press movement was observed.
   - The same horizontal shell/grid mismatch remains because press state inherits the same CSS grid center.
3. Keyboard-focus state — healthy
   - The rectangular yellow outline is gone.
   - Focus remains visible as icon/text glow.

## Geometry evidence

The 1560px shell source has well centers at approximately:

`194, 485, 770, 1063, 1356px`

An equal five-column grid at the same width has centers at:

`156, 468, 780, 1092, 1404px`

Projected into the user screenshot, the mismatch is:

| Button | Shell-well center | CSS-face center | Visible error |
| --- | ---: | ---: | ---: |
| Road | 204px | 174px | 30px left |
| Objectives | 431px | 417px | 14px left |
| Map | 653px | 661px | 8px right |
| Inventory | 881px | 904px | 23px right |
| Menu | 1110px | 1147px | 37px right |

The screenshot is Retina-density, so the approximate CSS-pixel errors are half those values. This is why moving Road by 1px and Menu by 1px looked effectively unchanged: the underlying visual assemblies remained roughly 15px left and 19px right of their shell wells before small content-only compensation.

## Strengths

- The generated shell and face assets share one coherent material and lighting language.
- Button labels and icons are internally centered within each raised face.
- Press travel is vertical and uniform.
- Native buttons preserve large, evenly divided hit targets.
- Keyboard focus is visible without introducing a rectangular shape that conflicts with the metal frame.

## UX risks

- P1: the background shell and interactive faces use different horizontal coordinate systems, making the dock look assembled incorrectly even when individual labels are mathematically centered.
- P2: per-label optical offsets conceal part of the problem and make future tuning unpredictable across widths and pixel densities.

## Accessibility risks

- Keep the existing equal 20% invisible hit targets; moving the visual faces must not create gaps, overlaps, or smaller click areas.
- The current focus glow is visually confirmed, but this bounded audit does not claim full WCAG compliance.

## Recommended correction

1. Keep each button's hit target in the equal five-column grid.
2. Position each visual face and its icon/label together at the shell's normalized well centers: `12.44%, 31.09%, 49.36%, 68.14%, 86.92%`.
3. Remove the current Road/Inventory/Menu content-only offsets during the structural pass.
4. Reapply only genuinely necessary subpixel optical corrections after the faces align with the shell.
5. Verify rest, pointer hold, and keyboard focus at both 1× and 2× density.

## Evidence limits

- The user screenshot is a cropped Retina capture, so projected CSS-pixel values are approximate; the source-asset center percentages are exact enough to implement responsively.
- The audit covers this dock component rather than the full game flow.

## Fix verification — 2026-08-09

- Kept the five native button hit targets in an equal 20% grid.
- Repositioned each raised face, icon, and label together at the shell centers.
- Removed the old Road, Inventory, and Menu content-only offsets.
- Preserved vertical pointer-press travel and glow-only keyboard focus.
- Verified a 560 CSS px dock at both 1× and 2× density: all five hit targets measured 112 CSS px, and every visual center landed within 0.02 CSS px of its target.

| Button | Target center | Measured face center |
| --- | ---: | ---: |
| Road | 12.440% | 12.437% |
| Objectives | 31.090% | 31.087% |
| Map | 49.360% | 49.360% |
| Inventory | 68.140% | 68.140% |
| Menu | 86.920% | 86.921% |

Fresh evidence:

- `03-fixed-rest-640-1x.png`
- `04-fixed-pressed-640-1x.png`
- `05-fixed-focus-640-1x.png`
- `03-fixed-rest-640-2x.png`

Automated checks:

- `npm run test:golden` — passed, including geometry, press-state, and keyboard-focus assertions.
- `npm run test:health` — passed.
