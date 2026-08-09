# Armored navigation design QA

- Source visual truth: `/Users/sang/Desktop/Caravan UI Concepts/03-armored-route-deck.png`
- Implementation screenshot: `/Users/sang/caravan/tests/shots/armored-nav-aligned/01-main.png`
- Full-view comparison: `/Users/sang/caravan/tests/shots/armored-nav-aligned/target-final.png`
- Focused state comparison: `/Users/sang/caravan/tests/shots/armored-nav-aligned/nav-state-strip.png`
- Viewport/state: 390 × 844 CSS px, stopped at Daegu with route choices visible, device scale factor 1
- Density normalization: source 852 × 1846 px downsampled to 390 × 844 px; implementation captured natively at 390 × 844 px

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the implementation keeps the game's existing Korean mono/sans hierarchy rather than rasterizing mockup labels. The five labels are readable at 12px or larger and remain live text.
- Spacing and layout rhythm: the generated shell occupies 76–77px at the target viewport, matches the source's low armored silhouette, and preserves the visible second route choice. Each live button uses the measured center and vertical offset of its own illustrated well instead of assuming the raster is a mathematically even grid.
- Colors and visual tokens: olive-charcoal steel, rubbed silver edges, soot-black recesses, and amber active state match the selected source. The implementation is slightly brighter than the mockup at the lower edge; this is acceptable because it improves well separation on the actual game background.
- Image quality and asset fidelity: the shell, raised button face, and pressed button face are dedicated transparent raster assets generated from the selected source. Edges are clean, corners are transparent, and there are no chroma halos at the captured scale.
- Copy and content: `길 / 목표 / 지도 / 가방 / 메뉴` matches the selected design and remains accessible, selectable interface copy.
- Icons: the implementation intentionally retains the game's embedded icon family rather than baking mockup glyphs into the plate. Desaturation and amber active treatment integrate them with the generated metal assets.
- Interaction and accessibility: the controls remain native buttons. Hover/focus, latched selected, pointer-down pressed, keyboard activation, modal focus transfer, Escape return, and 12px minimum rendered text all pass.

## Comparison history

1. Initial coded pass
   - [P2] The active and held-down faces were too similar in the focused comparison, so the hardware press was not immediately legible.
   - Fix: generated a separate recessed button-face asset with a physical inner shadow and amber pilot lamp, then mapped it to selected and active states. Increased active travel and darkening without delaying navigation.
2. Final coded pass
   - Post-fix evidence: `compare-dock-states.png` shows source, latched selected, and held-down states together. The selected face has the lamp and recessed plate; the held state sinks and darkens further.
   - No remaining P0/P1/P2 findings.
3. Precision alignment pass
   - [P2] User testing exposed that the five wells in the hand-rendered shell are not perfectly equidistant or level. An equal CSS grid plus press-state scaling made some buttons appear to jump sideways or settle below their opening.
   - Fix: measured all five well centers, positioned each native button independently, and removed state scaling. Selected and pointer-down states now use vertical travel only.
   - Post-fix evidence: `nav-state-strip.png` captures resting, held, and all five latched states in one strip. Every face stays centered in its own opening with consistent press travel.
   - No remaining P0/P1/P2 findings.

## Primary interactions tested

- All five buttons in resting and latched-selected states, plus Road held-down
- Map and Inventory opening from keyboard and pointer input
- Status tab arrow-key navigation
- Escape close with focus restored to the triggering dock button
- Menu overlay capture
- Golden route progression with no horizontal overflow or console errors

## Follow-up polish

- [P3] A future custom monochrome navigation icon set could match the mockup pictograms more literally, but the current embedded game icons are coherent and avoid introducing a second icon language elsewhere in the game.

## Implementation checklist

- [x] Generated image shell with five empty wells
- [x] Generated separate raised and pressed button-face assets
- [x] Kept labels, icons, clicks, focus, and selected state in code
- [x] Embedded all three UI assets into the single-file build
- [x] Captured and compared the same viewport and state
- [x] Measured and matched each illustrated well rather than assuming equal spacing
- [x] Passed source health, content/asset verification, keyboard regression, and golden route

final result: passed
