# Caravan cockpit design QA

## Result

- Status: passed
- P0: 0
- P1: 0
- P2: 0

## Evidence

- Reference: `/Users/sang/.codex/generated_images/019fdfc9-5f28-7170-aab4-d2a0abfb6556/exec-186c663e-579f-4102-afaf-7d1bd9b00462.png`
- Mobile implementation: `/private/tmp/caravan-cockpit-audit/16-cockpit-v2-ignition.png`
- Side-by-side comparison: `/private/tmp/caravan-cockpit-audit/17-reference-vs-v2.png`
- Viewport: 390 x 844

## Findings resolved

- Replaced the generic dashboard composition with the selected analog cockpit geometry and material treatment.
- Preserved the physical ignition cylinder, folded-map unit, radio face, analog gauge markings, steering wheel, mirror, and windshield framing.
- Removed oversized visible button rectangles and constrained touch targets to the corresponding physical devices.
- Kept live destination, remaining distance, ignition state, passenger portrait, fuel needle, and body-condition needle as dynamic UI.
- Kept the windshield transparent so the live road, weather, time, and destination scenery remain visible.
- Avoided duplicated labels by using the labels baked into the cockpit face while retaining accessible button names.

## Interaction map

- Ignition: physical key cylinder and its immediate bezel.
- Map: center folded-map device.
- Radio: right radio device.
- Fuel and body gauges: their circular instrument faces.
- Rear-view mirror: passenger/status area.

## Residual note

The world visible through the windshield intentionally keeps the existing game pixel-art rendering. The cockpit is more detailed than the exterior scene, but this preserves gameplay readability and avoids turning the driving view into a static illustration.
