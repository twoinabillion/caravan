# Cockpit Option 1 Design QA

- Source visual truth: `/Users/sang/.codex/generated_images/019fdfc9-5f28-7170-aab4-d2a0abfb6556/exec-186c663e-579f-4102-afaf-7d1bd9b00462.png`
- Implementation screenshot: `/private/tmp/caravan-cockpit-audit/14-cockpit-option1-final.png`
- Combined comparison: `/private/tmp/caravan-cockpit-audit/15-reference-vs-final.png`
- CSS viewport: `390 x 844`
- Device scale factor: `1`
- Source pixels: `852 x 1872`, normalized to `390 x 844` for comparison
- Implementation pixels: `390 x 844`
- State: first route selected, ignition waiting, one current occupant

## Full-view comparison evidence

The normalized side-by-side comparison preserves the source's main proportions: overhead route display and mirror, dominant windshield, steering wheel and twin gauges, and three physical dashboard controls. The implementation deliberately uses the live game's road renderer instead of the mock's static city scene.

## Focused-region comparison evidence

A separate crop was not needed. At the normalized `390 x 844` size, the route display, mirror portrait, gauge values and needles, ignition, paper map and radio frequency are all readable in the combined comparison. The original-size implementation screenshot was also inspected for transparency edges and text clipping.

## Required fidelity surfaces

- Fonts and typography: compact Korean monospace hierarchy matches the amber instrument language; destination, distance, values and control labels remain readable without wrapping.
- Spacing and layout rhythm: the cockpit fills the viewport; the windshield remains the largest region; all interactive controls stay inside their physical housings with no persistent dock or stacked mission panels.
- Colors and visual tokens: worn brown-black materials, amber display text, green running state and red warning capability match the selected direction and existing game palette.
- Image quality and asset fidelity: the generated cockpit shell is embedded at native quality with a clean transparent windshield opening. The folded map is a dedicated raster asset, not placeholder art. Existing game portraits are used in the mirror.
- Copy and content: destination, remaining distance, ignition state, fuel, vehicle condition, occupant count and control labels are driven by game state rather than baked into the image.

## Interaction evidence

- Ignition changes `ignition` to `driving` and updates the control state.
- Map control opens `#ovl-map`.
- Mirror opens the crew/status overlay.
- Fuel and vehicle gauges open the vehicle status overlay.
- Radio control changes the sound state.
- Browser `pageerror`: none across the tested flow.

## Comparison history

1. First implementation: P1 road sightline sat below the windshield and crew mirror contained text only. Fixed by resizing the live road canvas into the glass opening and binding existing portrait assets to the mirror.
2. Second implementation: P2 route text reused the long origin-to-destination string and truncated. Fixed with a dedicated live cockpit navigation display.
3. Third implementation: P2 map and radio housings were visually blank. Fixed with an embedded folded-map asset and live radio display label.
4. Final pass: no actionable P0, P1 or P2 visual differences remain.

## Follow-up polish

- P3: the live road renderer is intentionally simpler than the concept's painted city scene; future scenery upgrades can add density without changing the cockpit UI.
- P3: mirror portrait count varies with the real party and therefore may differ from the two-character concept reference.

final result: passed
