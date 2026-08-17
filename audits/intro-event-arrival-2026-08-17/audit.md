# Intro, event title, arrival, and road-log audit

Date: 2026-08-18  
Scope: 320×578, 390×844, 475×948 mobile viewports  
Build: `서울까지400km.html`

## Outcome

The four surfaces now use one coherent physical-interface language while preserving the scene as the primary visual layer.

1. The intro changed from a short 16:9 image above a mostly empty dark page to a large cinematic image plus a paper field-record insert. Sound and auto controls no longer occupy the same coordinates.
2. Story-event headings now share one current-turn alignment contract. At 390px the heading moved from `(52, 25.3)` to `(40.1, 29.8)` relative to its report surface: leftward and slightly down, without clipping or control overflow.
3. Landscape arrival art was previously intentionally constrained to a complete 16:9 frame. That protected the source image but produced too much dead space. It now uses a controlled centered crop and occupies at least 62% of the viewport height; at 390px its rendered height increased from `203.6px` to about `608px`. Portrait-specific arrival art remains full-screen.
4. Non-urgent notices produced during driving no longer use the floating toast layer over the Caravan. They are classified and written into a persistent journey-log slot directly below the route-status sentence. Warnings and dangerous notices remain floating and immediate.
5. At 320px the panel scrolls only far enough to keep a newly updated journey log above the bottom navigation deck.

## Design reasoning

- Pentiment treats the manuscript medium and the interface as one visual object; the intro and event page now follow the same principle instead of switching to an unrelated dark text page. Reference: <https://pentiment.obsidian.net/>
- Road 96's UI work emphasizes polishing interactions, cinematic transitions, and maps as part of the road scene. The new journey log keeps the moving Caravan visible and integrates feedback into the route panel. Reference: <https://lucas-guibert.com/en/road-96-en/>
- The arrival change is deliberately not a universal stretch. Portrait art stays full-screen; landscape art uses a larger controlled crop with its focal point held at center/54% so location, road, and Caravan remain legible.

## ImageGen asset

Built-in ImageGen mode was used to generate a blank raster UI background with runtime-safe text regions:

- Source: `assets/ui/road-journey-log-panel-v1.webp`
- Native size: `2172×724` (3:1)
- Runtime behavior: HTML supplies icon, category, title, description, and remaining distance.

Final prompt:

> Use case: ui-mockup
>
> Asset type: production-ready blank raster background for an in-game mobile “journey update / road log” panel, displayed beneath the moving-route note in a post-collapse Korean road-trip game.
>
> Input images: Image 1 is the canonical paper-and-metal event report material reference; Image 2 is the canonical worn olive military navigation casing reference; Image 3 is the canonical blank ledger-slot construction reference.
>
> Primary request: create one wide, shallow, completely blank runtime UI frame that looks like a small removable log slip mounted into the Caravan dashboard. It must clearly belong to the same physical UI family, but be quieter than an event screen.
>
> Composition/framing: exact straight-on orthographic front view, very wide 3:1 horizontal composition, edge-to-edge asset, no perspective. Outer frame about 8% of the height: worn dark olive metal, black rubber gasket, four small fasteners. Inner insert is a warm charcoal-to-aged-paper field with a subtle horizontal divider. Reserve a compact blank circular instrument/insignia well on the left 16% and a large uninterrupted rectangular text-safe area from x=20% to x=92%, y=18% to y=82%. Keep all decoration outside that safe area.
>
> Style/medium: realistic raster game UI prop, tactile analog survival equipment, restrained Korean post-collapse field-recorder aesthetic, highly legible at 320–475px phone widths.
>
> Lighting/mood: soft diffuse top light, low glare, strong edge definition, no scene background.
>
> Color palette: oxidized olive steel, charcoal black, muted teal hairline accent, restrained amber wear marks, warm desaturated paper.
>
> Materials/textures: fine scratches, chipped paint, stitched or laminated paper insert, subtle grime only around edges.
>
> Text: none.
>
> Constraints: absolutely no words, letters, numbers, symbols, icons, logos, watermark, knobs protruding beyond the rectangle, cast shadow outside the asset, transparent holes, or busy texture inside the text-safe area. The center must remain empty so HTML can overlay dynamic Korean title, message, and numeric value. Preserve a clean continuous border and perfect horizontal alignment.

## Evidence

Accepted 390px captures:

1. `after/390x844-01-intro-opening.png`
2. `after/390x844-03-event-portrait-title.png`
3. `after/390x844-05-arrival-landscape.png`
4. `after/390x844-07-road-log.png`

Small-device guard:

5. `after/320x578-07-road-log.png`

Automated capture result: 21 states, 0 page errors, 0 document overflow states, 0 escaped controls.

## Verification

- `python3 tests/test_smoke.py`
- `python3 tests/test_arrival_presentation.py`
- `python3 tests/test_event_typography_layout.py`
- `python3 tests/test_source_health.py`
- `npm run verify:quick`
- `git diff --check`

## Evidence limits

The screenshots use desktop Chrome rendering at exact mobile viewport sizes. They validate responsive geometry and runtime DOM behavior, but they are not captures from physical iOS Safari or Android WebView devices.
