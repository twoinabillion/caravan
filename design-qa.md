# 달구지 코드 렌더링 Design QA

- Source visual truth: `assets/van/dalguji-base.png`, `assets/van/dalguji-expedition.png`
- Implementation screenshots: `tests/shots/title-procedural.png`, `tests/shots/van-base-procedural.png`, `tests/shots/van-all-upgrades.png`
- Combined focused comparison: `tests/shots/van-design-qa.png`
- Browser viewport: 480 × 860 CSS px, device scale factor 1
- Source pixels: 96 × 53 px
- Implementation pixels: base Canvas 480 × 399 px, fully upgraded Canvas 480 × 448 px
- Normalization: vehicle-focused crops were nearest-neighbor scaled into a 1012 × 592 px comparison sheet
- States: default base vehicle; all 28 upgrades installed; clear daytime/evening road scenes

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: no vehicle typography was introduced or changed. Existing HUD and sign typography remains intact.
- Spacing and layout rhythm: the base vehicle keeps the source's long box body, short cab, two-wheel stance, roof rack, and side-window rhythm. The upgraded body grows upward and rearward without clipping the road scene.
- Colors and visual tokens: the beige upper body, brown lower body, warm windows, dark tires, rust accents, and amber lights preserve the original palette. Armor deliberately shifts the lower body to a cool steel gray.
- Image quality and asset fidelity: the runtime vehicle no longer uses raster vehicle assets. Canvas shapes stay snapped to the low-resolution pixel grid and upscale without smoothing. The base silhouette remains recognizable while upgrades can now be combined from live state.
- Copy and content: unchanged.
- Interaction/state fidelity: `S.up` drives all 28 upgrade visuals. Cabin, armor, suspension, mud tires, roof systems, utility modules, seats, curtains, lights, antenna, front hardware, and camping equipment have visible states.

The fully upgraded result is intentionally busier than the old expedition PNG: it shows the accumulated run state rather than selecting one of four static chassis images. This is the requested product behavior, not design drift.

## Comparison History

1. Initial pass
   - Finding: the title vehicle lost too much cab, windshield, lower-body, rust, ladder, and light detail when the sprite path was removed.
   - Finding: the first upgraded capture was obscured by arrival and speech overlays.
   - Fixes: added procedural windshield, cab band, bumper/skirt, rust patches, ladder, mirrors, lights, heavier armor, larger mud tires, seat hardware, and collision-aware roof placement. Canvas screenshots now use `toDataURL()` so overlays cannot contaminate the evidence.
2. Final pass
   - Evidence: `tests/shots/van-design-qa.png`
   - Result: base identity and upgraded-state legibility pass at the intended pixel scale. No P0/P1/P2 issue remains.

## Follow-up Polish

- P3: add one or two deterministic patina patterns if the code-rendered base should inherit more of the source PNG's mottled rust texture.

## Verification

- Build: passed
- Reference scanner: 821 events, 58 nodes, 77 roads, 0 errors, 0 warnings
- Browser smoke test: passed, including game boot, core flows, `D.vanSprites` absence, all 28 upgrades, and zero console errors
- Primary interactions tested: new game flow, game entry, events, upgrades, travel systems, and screenshot states

final result: passed
