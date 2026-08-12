# Destination Console V3 — Design QA

## Comparison target

- Source visual truth: `/Users/sang/Desktop/Caravan 목적지 UI 3가지 시안/3-세로-로커와-캐러셀.png` — 938×1676 px.
- Browser-rendered implementation: `audits/destination-console-v3-2026-08-12/01-route-primary.png` — 480×860 px.
- Secondary destination state: `audits/destination-console-v3-2026-08-12/02-route-secondary.png`.
- Stay state: `audits/destination-console-v3-2026-08-12/03-stay-mode.png`.
- Viewport: 480×860 CSS px at `deviceScaleFactor: 1`.
- Density normalization: source resized and center-cropped to 480×860; implementation captured at native 480×860.
- State: Day 1, 부산 감천 부두, 목적지 active, 양산 고가차도 selected.

## Evidence

- Full-view comparison: `audits/destination-console-v3-2026-08-12/04-source-vs-implementation.png`.
- Focused console comparison: `audits/destination-console-v3-2026-08-12/07-console-focused-comparison.png`.

## Findings

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: Korean sans headings and monospaced telemetry preserve the selected hierarchy. Real destination names and values remain legible at 480×860.
- Spacing and layout rhythm: square housing, left rocker, live map, summary, centered carousel, departure action, and dock fit the locked viewport. Console width is 456 px, live screen width 337 px, and rocker targets are over 44 px tall.
- Colors and visual tokens: amber selection/action, teal current position/secondary route, near-black display, and weathered olive metal match the selected reference and Caravan palette.
- Image quality and asset fidelity: the 1024 px console housing is a dedicated raster asset. Destination cards reuse canonical game scene art and are properly cropped at their live size.
- Copy and content: the screen shows only current destination, known place description, distance, time, and required fuel. It never previews a future danger, encounter, person, success rate, or breakdown.
- Intentional P3 variance: the source concept uses a static Korea route illustration; the game uses its live immediate-route canvas so all selectable routes remain real and unknown events stay unknown.

## Interaction and browser evidence

- Carousel arrow changed selection from `yangsan` to `gimhae` and updated map, text, image, values, and CTA.
- Destination cards, dots, keyboard arrows, and horizontal swipe share the same live selection state.
- The vertical rocker switches between `목적지` and `머물기`.
- Departure remains connected to `G.startTravel`.
- Goal → map → route departure and bag repair/state-number updates passed `tests/capture_interactive_tools.py`.
- Console/page errors: zero. Horizontal viewport overflow: none.

## Comparison history

### Iteration 1 — blocked

- P0 interaction failure: pointer capture on the carousel viewport swallowed the arrow click, so the selected destination did not change.
- Fix: removed pointer capture while retaining swipe-distance detection.

### Iteration 2 — passed

- Same-viewport post-fix evidence changed the route from Yangsan to Gimhae in `02-route-secondary.png`.
- Both destination and stay states fit above the persistent dock and retain 44 px touch targets.

## Residual follow-up polish

- P3: when a future node exposes five or more immediate destinations, re-check the centered-card scroll treatment with the longer set.

final result: passed

---

# Previous QA — Locked Game Viewport + Road Tools

## Comparison target

- Source visual truth:
  - User-approved road composition represented by the existing 480×860 game view.
  - `/Users/sang/Desktop/Caravan UI 시안 - 목표 지도 가방/01-목표-여행-서류철.png` — 937×1678 px.
  - `/Users/sang/Desktop/Caravan UI 시안 - 목표 지도 가방/02-지도-차내-네비게이션.png` — 938×1677 px.
  - `/Users/sang/Desktop/Caravan UI 시안 - 목표 지도 가방/03-가방-보급-롤.png` — 937×1678 px.
- Browser-rendered implementation:
  - `audits/locked-game-ui-2026-08-12/01-mobile-480x860-road-app.png`
  - `audits/locked-game-ui-2026-08-12/01-mobile-480x860-goal-app.png`
  - `audits/locked-game-ui-2026-08-12/01-mobile-480x860-bag-app.png`
  - `audits/locked-game-ui-2026-08-12/02-desktop-1440x900-road-app.png`
  - `audits/locked-game-ui-2026-08-12/02-desktop-1440x900-goal-app.png`
  - `audits/locked-game-ui-2026-08-12/02-desktop-1440x900-bag-app.png`
- Viewports: mobile 480×860 and desktop 1440×900, both at `deviceScaleFactor: 1`.
- Density normalization: the desktop `#app` content was captured at its actual 480 px CSS width and cropped to the same 480×860 comparison window as mobile. No browser chrome was included.
- State: new game, Day 1 07:30, 부산 감천 부두, default goal and `부품` inventory selection.

## Evidence

- Full-view, same-input mobile/desktop comparisons:
  - `audits/locked-game-ui-2026-08-12/03-road-mobile-vs-desktop.png`
  - `audits/locked-game-ui-2026-08-12/04-goal-mobile-vs-desktop.png`
  - `audits/locked-game-ui-2026-08-12/05-bag-mobile-vs-desktop.png`
  - Contact sheet: `audits/locked-game-ui-2026-08-12/06-mobile-vs-desktop-contact.jpg`.
- Same-input reference/implementation comparisons for the changed physical props:
  - `audits/locked-game-ui-2026-08-12/07-goal-source-vs-final.png`
  - `audits/locked-game-ui-2026-08-12/08-bag-source-vs-final.png`
  - Contact sheet: `audits/locked-game-ui-2026-08-12/09-source-vs-final-contact.jpg`.
- Focused regions were not split into additional files because each pair preserves a full 480×860 screen at readable original pixels; HUD labels, paper rows, pocket labels, numbers, and bottom controls remain legible.

## Findings

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: tool typography now uses the 480 px game container (`cqw`) instead of the outer browser viewport, so font size, optical weight, line height, and truncation no longer drift on desktop. Korean labels remain contained by their paper, pocket, and hardware slots.
- Spacing and layout rhythm: `#app`, the road tools, and the bottom dock use the same 480 px layout on mobile and desktop. Desktop adds only outside margins. Goal rows and bag pockets align to the same raster-shell coordinates in both captures.
- Colors and visual tokens: the existing amber/teal/night tokens and parchment/canvas materials are unchanged. The new HUD uses the same amber and neutral instrument palette.
- Image quality and asset fidelity: the folio, CRT map, canvas roll, icons, dock, road, and vehicle remain raster/canvas assets from the game. No replacement CSS/SVG illustration was introduced.
- Copy and content: the upper-left readout now contains only `연료` and `차체`; the upper-right contains `DAY`, time, and current weather. The redundant miniature map and current-stop plaque are removed from the stage; current place and route remain in the navigation surface.
- Interaction and accessibility: the visible main controls remain real buttons. The hidden minimap is removed from keyboard navigation and the full map remains available through the bottom dock. Console/page errors were zero. The accessibility gate passed at 360×700, 390×844, and 480×860 with large text, reduced motion, and 200% zoom.

## Comparison history

### Iteration 1 — blocked

- P1 composition drift: the desktop game expanded to 840/1180 px and activated desktop-only layout rules. Fixed by locking `#app` to a 480 px game column and removing the desktop side rail/reflow.
- P2 HUD duplication: current-stop information and the miniature map repeated navigation data while fuel, condition, date, time, and weather remained lower in a separate dashboard. Fixed by replacing the two upper corners with vehicle and time/weather readouts and hiding the miniature map from view and keyboard order.
- P2 road-tool slot alignment: `vw`-based typography followed the outer desktop viewport instead of the physical prop. Fixed by converting prop/dock sizing to container-query width units.
- P2 panel scale drift: the folio and bag width depended on outer viewport height, producing different sizes at 860 and 900 px tall captures. Fixed by locking the road-tool prop width to the same 480 px game column.

### Iteration 2 — passed

- The final browser capture reports a 480 px `#app`, goal prop, and bag prop on both mobile and desktop.
- Post-fix visual evidence is recorded in comparison files 03–06 above.
- The normalized comparison found no remaining P0/P1/P2 visual, responsive, or interaction issue.

### Iteration 3 — passed

- Source and final goal/bag screens were normalized to the same 480×860 frame and inspected together in files 07–09.
- The folio preserves the source's paper hierarchy and tab registration; the bag preserves its roll, pocket, meter, and inventory alignment. Content density changed only to support live game data and controls.

## Residual follow-up polish

- P3: a 1440×900 desktop viewport has 40 more vertical pixels than the 480×860 mobile target. The game keeps those pixels as neutral bottom breathing room rather than stretching or reflowing content.
- P3: the single-file offline HTML remains above its 32 MB advisory budget because the game embeds all media. This does not block the UI path.

## Implementation checklist

- [x] Replace upper-left stop plaque with live fuel and vehicle condition.
- [x] Replace upper-right miniature map with live day, time, and weather.
- [x] Keep full map access in the persistent bottom dock.
- [x] Lock mobile and desktop to one 480 px game composition.
- [x] Bind road-tool typography and dock sizing to the game container.
- [x] Match folio and bag shell geometry on mobile and desktop.
- [x] Verify browser console, responsive accessibility, large text, reduced motion, and zoom.
- [x] Compare normalized mobile and desktop screenshots in the same inputs.

final result: passed
