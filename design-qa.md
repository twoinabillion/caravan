# Interactive Road Tools — Design QA

## Comparison target

- Source visual truth:
  - `/Users/sang/Desktop/Caravan UI 시안 - 목표 지도 가방/01-목표-여행-서류철.png` — 937×1678 px
  - `/Users/sang/Desktop/Caravan UI 시안 - 목표 지도 가방/02-지도-차내-네비게이션.png` — 938×1677 px
  - `/Users/sang/Desktop/Caravan UI 시안 - 목표 지도 가방/03-가방-보급-롤.png` — 937×1678 px
- Browser-rendered implementation:
  - `audits/interactive-road-tools-2026-08-12/01-goal-folio.png`
  - `audits/interactive-road-tools-2026-08-12/02-map-navigator.png`
  - `audits/interactive-road-tools-2026-08-12/03-bag-supply-roll.png`
- Implementation screenshots: 480×860 px, CSS viewport 480×860, `deviceScaleFactor: 1`.
- Density normalization: each source was proportionally downsampled and centered on a 480×860 canvas before being paired with the 480×860 browser capture. No device chrome was included.
- State: new game, Day 1 morning, current stop 부산 감천 부두. The implementation intentionally shows the live 07:30 game clock and actual route/resource values; the source mock uses illustrative 09:30 values.

## Evidence

- Full-view, same-input comparisons:
  - `audits/interactive-road-tools-2026-08-12/04-goal-reference-vs-implementation.png`
  - `audits/interactive-road-tools-2026-08-12/05-map-reference-vs-implementation.png`
  - `audits/interactive-road-tools-2026-08-12/06-bag-reference-vs-implementation.png`
  - Contact sheet: `audits/interactive-road-tools-2026-08-12/07-all-reference-vs-implementation.jpg`
- Focused comparisons for readable typography, map selection, resource rows, pockets, and actions:
  - `audits/interactive-road-tools-2026-08-12/08-goal-focused.png`
  - `audits/interactive-road-tools-2026-08-12/09-map-focused.png`
  - `audits/interactive-road-tools-2026-08-12/10-bag-focused.png`
  - Contact sheet: `audits/interactive-road-tools-2026-08-12/11-focused-reference-vs-implementation.jpg`

## Findings

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: the condensed Korean sans/mono hierarchy, optical weights, line height, truncation, and amber/teal emphasis preserve the source hierarchy. Live quest copy is denser than the illustrative mock but remains legible and contained.
- Spacing and layout rhythm: all three props retain the source major-region proportions, hardware frame, fixed bottom dock, tap-target separation, and vertical hierarchy at 480×860. Goal content uses three focused progression rows to avoid crowding.
- Colors and visual tokens: parchment black/teal, CRT teal, canvas brown, and amber interaction states match the source direction; selected/disabled states remain distinct.
- Image quality and asset fidelity: the leather folio, CRT navigator, and canvas roll are project-local WebP raster shells, not CSS approximations. Live icons use the game's existing raster icon family. Crops are sharp with no transparency halos or stretching.
- Copy and content: all visible labels are coherent in Korean and use current game state. The map shows only known geography and player-selected routes; it does not reveal future encounters or danger predictions.
- Interaction and accessibility: bottom-dock navigation, folio-to-map navigation, destination selection, route departure, bag pocket selection, repair action, and return-to-road were exercised. Route departure decreased fuel; repair consumed a part and increased vehicle health; a resource mutation was reflected by the visible number. Console/page errors were zero. The Quality 9 accessibility gate passed at 360×700, 390×844, and 480×860, including large text, reduced motion, and 200% zoom.

## Comparison history

### Iteration 1 — blocked

- P2 goal density: all six steps were shown at once, making the paper crowded. Fixed by showing a three-step progress window centered on current progress.
- P2 map fidelity: the first canvas pass read too purple and opened without a useful route card. Fixed by applying the teal CRT navigator palette and selecting the first reachable known destination on open.
- P2 map layout: destination details occupied the wrong region. Fixed by moving the compact selected-route summary and departure control into the physical lower hardware bay.
- P2 bag state: zero quantities rendered as a dash and the QA capture showed a different selected pocket. Fixed by rendering numeric zero and capturing the source-matching `부품` selected state before exercising alternatives.
- P3 bag icon scale: first-pass item icons were visually underweighted. Fixed by increasing pocket and detail icon size while retaining the existing raster icon family.

### Iteration 2 — passed

- Post-fix evidence is recorded in comparison files 04–11 above.
- The final normalized comparison found no remaining P0/P1/P2 visual or interaction issues.

## Residual follow-up polish

- P3: the live route graph contains more discovered-city labels than the simplified concept map. This is an intentional product difference so the real world state remains usable rather than decorative.
- P3: the standalone HTML remains above its 32 MB advisory size budget (37.5 MB) because the game embeds all media for offline play. This does not block this UI or its interaction path.

## Implementation checklist

- [x] Preserve all three physical prop designs as raster shells.
- [x] Render all readable values and app copy as live DOM/canvas content.
- [x] Connect goal, map, bag, road, and menu navigation.
- [x] Connect destination selection and departure.
- [x] Connect bag item selection and parts repair.
- [x] Verify responsive accessibility and console health.
- [x] Compare normalized source and implementation full views and focused regions.

final result: passed
