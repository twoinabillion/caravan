# Canon alignment audit — 2026-08-11

## Evidence

- `01-people-reference-vs-current.jpg`
- `02-world-reference-vs-current.jpg`
- `03-caravan-reference-vs-current.jpg`
- `20-final-people-comparison.jpg`
- `21-final-vehicle-comparison.jpg`
- `22-final-world-comparison.jpg`
- `23-final-dalguji-comparison.jpg`
- `all-scenes/scene-00.jpg` through `scene-07.jpg`
- `intro-00.jpg` and `intro-01.jpg`

## Finding

The current game is tonally adjacent to the supplied reference sheets, but it does not yet maintain one visual identity. The largest continuity failure is the protagonist vehicle: it alternates among a blue pickup camper, beige panel van, integrated RV, and small box truck. Portraits also shift into stylized or pixel-painted faces, and several settlements are warmer, cleaner, or more generic than the cold Korean locations in the canon sheets.

## Priority corrections

1. Replace the eight principal portraits with the exact faces, ages, hair, clothes, and props from the people sheet.
2. Keep one vehicle in every scene: warm gray-beige Korean cab-over one-ton truck, separate box camper, amber framed windows, rear double doors, roof bags and red cans, antenna, and faded white `X`.
3. Make the animated road vehicle use the same fixed silhouette while preserving its existing weight, wheel motion, and upgrade-driven rear extension.
4. Correct the highest-exposure scenes first: intro vehicle build, Busan departure, route choices, generic road events, vehicle interior, Seoul approach, and trailer frames.
5. Retain already-strong character scenes when their identity is close, but replace any frame where the Dalguji becomes a van or the environment becomes pixel art, sunny, or non-Korean.

## Acceptance test

A player should be able to compare any character, Dalguji, interior, or main route image with the reference sheets and identify the same person, vehicle, and world without relying on captions.

## Implemented alignment pass

- Added the four supplied canon sheets to `assets/reference/` and documented their non-negotiable visual invariants in `docs/visual-canon-2026-08-11.md`.
- Replaced all eight principal portrait assets with exact crops of the supplied cast sheet: Daun, Minji, Park Seong, Leo, Bori, Jaeyi, Eunsu, and Kangwoo.
- Replaced 40 high-exposure scene assets across Busan, route travel, markets, recruitment, combat, interiors, Seoul, and generic story encounters.
- Replaced eight intro images and all six trailer start frames.
- Rebuilt the live canvas Dalguji as a warm gray-beige Korean cab-over truck with a separate camper box, framed amber windows, roof bags, two red cans, cab-door `X`, and upgrade-driven rear extension.
- Added canon reference metadata for characters, the Dalguji, and scene generation; removed conflicting panel-van/blue-truck language from the active narrative and image prompts.
- Marked older contradictory visual prompt documents as superseded by the 2026-08-11 canon.

The pass modifies 62 production image assets in total: 40 scenes, 8 intro images, 8 portraits, and 6 trailer frames.

## Verification

- `npm run verify:quick` passes: dialogue lint, content references, asset contract, scene dimensions, and portrait dimensions.
- `npm run test:health` passes.
- `npm run build:html` passes with 218 embedded assets; the single-file build remains below its hard size limit.
- Browser-only smoke and companion suites could not launch Chromium because the macOS sandbox denied the browser process a Mach port. This occurred before application execution and is recorded as an environment limitation, not a passing browser result.

## Final assessment

The final comparison sheets show one coherent cast, one recognizable Dalguji, and one cool, rain-soaked Korean world. A second review of all 114 current scene assets caught and corrected remaining player-vehicle conflicts in Minji's recruitment, the grandfather garage, the perimeter walker fight, and the settlement road scene. Other visibly different vehicles were retained only where they belong to NPCs, local services, or pre-join locations; they are not the party's Dalguji. The player journey now meets the acceptance test, while the reference metadata prevents future generations from drifting back toward a panel van or pickup.
