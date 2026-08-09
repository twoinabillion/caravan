# Armored navigation state design QA

## Evidence

- Visual baseline: `/Users/sang/Desktop/Caravan UI Concepts/03-armored-route-deck.png`
- User-reported state regression: `/Users/sang/Desktop/Screenshot 2026-08-09 at 2.28.16 PM.png`
- User intent overriding the baseline state: every button is physically raised at rest; the recessed face appears only while the pointer is held down; keyboard focus must not draw a yellow rectangle.
- Resting implementation: `/Users/sang/caravan/tests/shots/armored-nav-optical-final-580/01-main.png`
- Pointer-held implementation: `/Users/sang/caravan/tests/shots/armored-nav-optical-final-580/01d-nav-pressed.png`
- Keyboard-focus implementation: `/Users/sang/caravan/tests/shots/armored-nav-optical-final-580/01f-nav-focus.png`
- Focused state comparison: `/Users/sang/caravan/tests/shots/armored-nav-state-fix-580/compare-nav-states.png`
- Focused optical comparison: `/Users/sang/caravan/tests/shots/armored-nav-optical-final-580/compare-optical-final.png`
- Viewport: 580 × 844 CSS px, Chromium, device scale factor 1.
- Pixel normalization: the 1152 × 278 user capture is a 2×-density navigation crop and is normalized to approximately 576 × 139 CSS pixels. Implementation screenshots are native 580 × 844 pixels; focused implementation crops are 580 × 144 pixels.
- State: stopped in Daegu with the road view selected; separate captures cover rest, pointer hold, and keyboard focus.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: existing Korean labels, weight, size, and line height are unchanged. Final content-only offsets are Road +3px, Inventory -2.5px, and Menu -3px; Objectives and Map remain mathematically centered.
- Spacing and layout rhythm: the shell, five equal grid tracks, button frames, icon/label spacing, and responsive height are unchanged. The focused comparison shows no horizontal or diagonal movement between states.
- Colors and visual tokens: amber remains the selected-page color. Keyboard focus now uses a restrained amber icon/text glow instead of the unrelated rectangular outline.
- Image quality and asset fidelity: the existing armored shell, raised face, and recessed face raster assets remain unchanged and sharp. The raised asset is used for every resting button; the recessed asset is used only for `:active`.
- Copy and content: `길 / 목표 / 지도 / 가방 / 메뉴` is unchanged.
- Interaction and accessibility: the road button starts raised despite remaining semantically selected through `aria-current`. During pointer hold, the face, icon, and label all travel by the same 4px depth. Keyboard focus remains visible through content glow without the yellow square.

## Comparison history

1. User-reported regression
   - [P1] `길` used the recessed image and a 2px downward offset immediately on entering the game, making it look permanently pressed.
   - [P2] `:focus-visible` drew a rectangular yellow outline inside the irregular metal frame after focus restoration.
2. Fix
   - Removed physical depth and the recessed face from the latched `.here` state while retaining its amber selected-page indication.
   - Kept the recessed face and one shared 4px vertical travel exclusively on `:active`.
   - Replaced the rectangular focus outline with icon and label glow.
3. Post-fix evidence
   - `compare-nav-states.png` shows the user capture, corrected rest state, pointer-held state, and keyboard-focus state together.
   - The resting `길` face now matches the height and raised asset of the other four buttons.
   - The pointer-held capture shows an evenly recessed face without sideways motion.
   - The keyboard-focus capture shows the Map icon/text glow with no yellow rectangle.
4. Final optical-centering pass
   - [P2] At the reported 2× density, Road still read about 1px left, Menu about 1px right, and Inventory about half a CSS pixel right.
   - Fix: moved content only: Road +1px right, Menu +1px left, and Inventory 0.5px left relative to the prior offsets.
   - Post-fix evidence: `compare-optical-final.png` shows the corrected 580px capture beside the user capture. Frames and press travel remain untouched.

## Primary interactions tested

- Initial selected Road state versus unselected resting buttons
- Pointer-down recessed asset and equal face/icon/label depth
- Keyboard focus reached with Shift+Tab and no rectangular outline
- All five selected-state captures
- Map, inventory, menu, modal focus restoration, and 360px overflow through the existing capture and golden-route suites
- Golden route completed with zero browser console errors

## Implementation checklist

- [x] Keep all five faces raised at rest
- [x] Preserve amber semantic selection without physical depression
- [x] Use the recessed asset only during pointer hold
- [x] Move face, icon, and label by one shared depth value
- [x] Remove the yellow rectangular focus outline
- [x] Preserve a visible keyboard-only focus treatment
- [x] Add automated regression checks for rest, press, and focus states
- [x] Capture and compare all three interaction states at the reported width

## Follow-up polish

- No remaining P3 work is required for this correction.

prior result: passed

---

# Destination navigator design QA — option 2

## Evidence

- Source visual truth: `/Users/sang/.codex/generated_images/019fe565-5708-73b1-b061-eeb593218d5a/exec-e88e89ab-f058-4912-813b-0f6569155d4e.png`.
- Browser-rendered implementation: `/Users/sang/caravan/tests/shots/route-console-640-final/00-navigation-busan.png`.
- Narrow responsive implementation: `/Users/sang/caravan/tests/shots/route-console-390-final-2/00-navigation-busan.png`.
- Interactive 360px states: `/Users/sang/caravan/tests/shots/route-intel-360/00-navigation-busan.png`, `00b-navigation-danger.png`, and `00c-navigation-resources.png`.
- Full-view comparison: `/Users/sang/caravan/tests/shots/route-console-640-final/compare-full-final.png`.
- Focused navigator comparison: `/Users/sang/caravan/tests/shots/route-console-640-final/compare-nav-final.png`.
- Source pixels: 1082 × 1454. It was normalized to 640 × 860 for comparison; the aspect ratio differs by less than 0.1%, so no material crop was required.
- Implementation pixels and CSS viewport: 640 × 860 at device scale factor 1. Responsive evidence uses 390 × 844 at device scale factor 1.
- State: new journey stopped at 부산 감천 부두, 양산 고가차도 selected, two immediate routes available, DAY 1 07:30, fuel 42L, vehicle 82%.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the implementation keeps the game's live Korean sans/mono hierarchy instead of rasterizing mockup text. Destination, hazard, resource, time, selector, and CTA text remain legible and truncation-free at 640px. The compact 390px layout keeps the selected destination unobscured after the first-pass fix. Large-text and 200% zoom checks pass without clipped critical controls.
- Spacing and layout rhythm: the generated housing preserves the selected concept's split map/decision structure, hardware inset, narrow dividers, and paired footer actions. The game's established 560px maximum app width is intentionally retained at a 640px viewport, so the navigator is narrower than the full-bleed ImageGen reference; this is an existing product constraint, not a route-console drift. At phone widths, the map and decision columns become equal so the destination title and 44px selectors fit.
- Colors and visual tokens: olive-charcoal steel, navy display, amber selected route/CTA, cyan alternate route, and red danger marks map directly to the source and existing game tokens. Contrast remains sufficient across normal, large-text, focus, selected, and disabled states.
- Image quality and asset fidelity: `assets/ui/route-console-shell-v1.jpg` is a dedicated 1536 × 1024 raster housing generated from option 2 and compressed to 122KB. Hardware edges remain sharp at both captures. The inner route display is live canvas/DOM, not baked text or placeholder art. Existing fuel and food raster icons are reused.
- Copy and content: destination names, distance, drive time, fuel before/after, food/water forecast, readiness, and risk bands come from the actual selected route and current save state. Every currently public city has authored approach intel: a local hazard, expected consequence, countermeasure, source, and confidence. Risk is shown as `낮음 / 주의 / 높음`, not a fictional event probability.
- Icons and controls: route selectors, fuel/food icons, map markers, risk meters, other-route action, and departure confirmation are implemented. The generated mock's decorative threat pictograms are replaced by readable live labels rather than CSS/SVG imitations.
- Interaction and accessibility: selecting another route updates the destination, map, hazard forecast, resource impact, time, readiness, and departure target without starting travel. Danger markers and the risk summary open source/consequence/countermeasure detail; the combined resource control opens fuel, food, water, and destination-supply detail. `출발` starts only the selected route, while a fuel shortage changes the primary control into an actionable explanation. All critical controls remain at least 44px at 360, 390, and 480px; keyboard focus, reduced motion, large text, 200% zoom, horizontal containment, and zero console errors pass.

## Comparison history

1. Pass 1
   - [P1] At 390px, the 01/02 destination selector overflowed its 28px header track and partially covered `양산 고가차도`.
   - Fix: reserved a 44px selector row, balanced the narrow screen into equal map/decision columns, and tightened only the secondary hazard/supply row rhythm.
   - Post-fix evidence: `/Users/sang/caravan/tests/shots/route-console-390-final/00-navigation-busan.png` shows the selector and destination title separated with both 44px targets intact.
2. Pass 2
   - [P2] One-hop context nodes compressed the immediate 부산→양산 leg, causing the two danger labels to bunch together.
   - Fix: scale the local navigator to the current stop and currently selectable destinations only, while keeping the selected and alternate route geometry geographic. Danger labels now choose the open side of the route line.
   - Post-fix evidence: `/Users/sang/caravan/tests/shots/route-console-390-final-2/00-navigation-busan.png` and `/Users/sang/caravan/tests/shots/route-console-640-final/00-navigation-busan.png` show separate 매복/붕괴 points and non-overlapping labels.
3. Final pass
   - The focused source/implementation comparison confirms the selected split-screen structure, material language, semantic colors, route hierarchy, resource ledger, and paired actions.
   - No remaining P0/P1/P2 findings.

## Primary interactions and gates tested

- Select 김해, verify no automatic departure, then select 양산 and depart through the navigator CTA.
- Verify all public cities have authored navigation intel; open local danger and combined resource details; verify no invented percentage is exposed.
- Verify destination, three danger forecasts, fuel, food/water, distance, time, readiness, and departure target update from live state.
- Golden 부산→양산→밀양→대구 route and zero browser console errors.
- 360×700, 390×844, and 480×860 normal and large text.
- Reduced motion, keyboard focus, 200% zoom, 44px touch targets, and horizontal overflow.
- Source health, dialogue lint, content references, and scene asset contract.

## Implementation checklist

- [x] Dedicated generated housing embedded in the single-file build
- [x] Live local route canvas with selected, alternate, and danger segments
- [x] Live destination selectors and separate departure confirmation
- [x] Live fuel/food/water/time/readiness forecast
- [x] Authored local danger, consequence, countermeasure, source, and confidence for every public city
- [x] Clickable danger markers plus danger/resource inspection states
- [x] 390px collision fix and final recapture
- [x] Interaction, accessibility, regression, and visual comparison gates

final result: passed
