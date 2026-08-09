# Armored navigation design QA

- Source visual truth: `/Users/sang/Desktop/Caravan UI Concepts/03-armored-route-deck.png`
- User-reported regression: `/Users/sang/Desktop/Screenshot 2026-08-09 at 2.10.20 PM.png`
- Implementation screenshots: `/Users/sang/caravan/tests/shots/armored-nav-depth-390/01-main.png` and `/Users/sang/caravan/tests/shots/armored-nav-depth-580/01-main.png`
- Full-view comparison: `/Users/sang/caravan/tests/shots/armored-nav-depth-390/compare-restored-390.png`
- Focused responsive comparison: `/Users/sang/caravan/tests/shots/armored-nav-depth-580/compare-wide-before-after.png`
- Focused press comparison: `/Users/sang/caravan/tests/shots/armored-nav-depth-580/compare-depth-states.png`
- Viewport/state: 390 × 844 and 580 × 844 CSS px, stopped at Daegu with route choices visible, device scale factor 1
- Density normalization: source concept 852 × 1846 px downsampled to 390 × 844 px. User regression screenshot 1160 × 327 px normalized to a 580 × 164 comparison crop. Implementations captured natively at both CSS sizes.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the implementation keeps the game's existing Korean mono/sans hierarchy rather than rasterizing mockup labels. The five labels are readable at 12px or larger and remain live text.
- Spacing and layout rhythm: the generated shell occupies 76–77px at 390px and scales to 114px at 580px. The five live buttons remain in the original equal responsive grid, matching the five evenly distributed hardware frames without protruding above or separating from the shell.
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
   - [P1] The attempted fix replaced the responsive equal grid with absolute per-button coordinates. At the user's 580px CSS / 2× density view, the button frames detached from the shell and protruded far above it.
   - Evidence: the top half of `compare-wide-before-after.png` reproduces the reported broken proportions.
4. Responsive restoration and uniform depth pass
   - Fix: restored the exact original five-column responsive layout. Removed all scale and per-button position transforms, then routed both the face and icon/label through one shared `--press-depth` value: 2px selected and 4px held.
   - Post-fix evidence: the bottom half of `compare-wide-before-after.png` restores the compact integrated plate at 580px. `compare-depth-states.png` shows the selected and held states staying centered while sinking uniformly. All five selected states were also captured in `all-selected-states.png`.
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
- [x] Restored the original responsive five-column placement at 390px and 580px
- [x] Applied one shared vertical depth value to the face, icon, and label
- [x] Passed source health, content/asset verification, keyboard regression, and golden route

final result: passed
