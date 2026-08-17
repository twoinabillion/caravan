# UI coherence overhaul — 2026-08-17

## Scope

- Goal, Map, and Bag raster-shell/content alignment
- Destination/Stay physical switch feedback
- Stay action density and vertical-scroll behavior
- Settlement entry and market navigation
- Companion portrait and scene continuity, with a focused Minji pass

## Evidence

- Combined before/after tools: `compare-tools-before-after.jpg`
- Combined Minji continuity: `compare-minji-before-after.jpg`
- Raw captures: `before/` and `after/`
- Final 390×844 tool states: `after/390x844-01-route.png` through `after/390x844-09-city-people.png`
- Geometry report: `after/metrics.json`

## Findings and resolution

1. **P0 — Map CRT was blank. Fixed.**
   - Cause: the canvas was initialized while its overlay had zero layout size and the first visible frame could remain undrawn.
   - Resolution: defer resize/draw for two animation frames whenever the map surface opens, then paint immediately.
   - Evidence: before/after map row in `compare-tools-before-after.jpg`.

2. **P1 — Settlement entry was an overcrowded image overlay. Rebuilt.**
   - The generated city image is now a clean location hero rather than a button backdrop.
   - A separate code-driven `TOWN WALK` touch map provides four destinations, a moving player marker, selected-state feedback, resource context, and an explicit enter action.
   - Current companions appear as tappable portraits; tapping one opens the existing companion conversation/status sheet.
   - The settlement root, map, and dock all remain at viewport width. The companion row intentionally scrolls horizontally when the full six-person party is present.

3. **P1 — Destination/Stay mode change lacked physical feedback. Fixed.**
   - The same outer console stays fixed in place.
   - The selected half of the rocker now receives a recessed amber tint and a dedicated upper/lower indicator lamp.
   - Stage and dock geometry remain unchanged when switching.

4. **P1 — Stay felt like a long list and exposed an awkward recruitment phrase. Fixed.**
   - Stay is capped at four immediate actions and no longer vertically scrolls.
   - Two- and three-action states use the available space for useful descriptions rather than oversized labels or icons.
   - The disabled “동료와 하룻밤을 보낸다” branch was removed from the UI and source copy. Overnight progression remains in the existing camp flow.

5. **P1 — Minji changed illustration style mid-sequence. Fixed selectively.**
   - All six companion arcs were compared against canonical portraits.
   - The core meet/task/follow/join scenes for all companions were coherent and preserved.
   - Three Minji outliers were regenerated and replaced: signal check, collapse response, and in-van listening.
   - The replacement images lock canonical face, tied hair, goggles, mechanic clothing, grounded cinematic realism, desaturated rain palette, and the canonical compact gray cab-over dalguji.

6. **P2 — Goal and Bag content rails were slightly loose against generated shells. Tightened.**
   - Goal title, progress, clue, support, and button rails now share measured inset variables.
   - Bag title/resources, vehicle panel, stitched pockets, and detail panel use refined percent anchors.
   - Five pocket names, icons, and counts remain aligned to the stitched-slot content center.

## QA

- `npm run build:html` — passed
- `npm run verify:quick` — passed
- `npm run test:health` — passed
- `npm run test:surface-contract` — passed at 320×578, 375×553, 360×700, 390×844, 462×832, and 476×809
- `python3 tests/test_interface_cleanup.py` — passed
- `python3 tests/test_ui_coherence_overhaul.py` — passed in Chrome
- Final capture matrix — 21 states, zero page errors

## Known constraint

The standalone HTML is about 38.9 MB and exceeds the repository's 32 MB recommendation. This pass reduced the three replaced Minji assets by roughly 96 KB total, but audio remains the dominant size cost and was outside this UI task.
