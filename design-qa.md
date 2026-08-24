# Design QA: Journey Route And Stop Actions

final result: passed

## Comparison target

- Source visual truth: `/Users/sang/Desktop/Screenshot 2026-08-24 at 8.33.26 PM.png`
- Source visual truth: `/Users/sang/Desktop/Screenshot 2026-08-24 at 8.36.00 PM.png`
- Route implementation: `/Users/sang/caravan/audits/live-user-session/verification-20260824/route-destination-after-fix.png`
- Stop-action implementation: `/Users/sang/caravan/audits/live-user-session/verification-20260824/local-actions-after-fix.png`
- Browser: the user's shared Chrome profile, loading the newly built `/Users/sang/caravan/서울까지400km.html`
- CSS viewport: 480 x 996 at device scale factor 2
- Source pixels: 936 x 1884 and 974 x 1988
- Implementation pixels: 960 x 1992 for both states
- State note: source and implementation use different journey days and locations. The comparison is limited to the same route-console and stop-action components rather than story-content fidelity.

## Full-view comparison

- The route screen retains the same vehicle scene, metal console, map, tabs, carousel, and bottom dock proportions.
- The stop-action screen retains the same four actions, item artwork, paper surface, tabs, console frame, and bottom dock.
- No horizontal overflow or persistent-control clipping is visible in either implementation capture.

## Focused region comparison

### Route guidance

- Before: mission title, destination prose, next action, optional quest text, route facts, and carousel occupied the same vertical band and visibly collided.
- After: map, mission guidance, route facts, and carousel have separate grid rows.
- Measured post-fix intersections: 0.
- Mission summary height increased from 104 CSS px to 132 CSS px while the map and carousel remain visible.

### Stop actions

- Before: a brown right column occupied about one quarter of each row and repeated the action verb.
- After: each action is one continuous paper card. The full 394 x 86 CSS px button remains clickable, with a 34 x 34 CSS px circular chevron as its secondary affordance.
- Disabled radio repair remains visibly muted without becoming a different component shape.

## Required fidelity surfaces

- Fonts and typography: existing game typefaces, weights, and semantic resource colors are preserved. Long route guidance is constrained to one readable summary line instead of overlapping adjacent rows.
- Spacing and layout rhythm: route sections no longer intersect; four stop actions divide the available console height evenly with consistent gaps.
- Colors and visual tokens: cyan telemetry, amber interaction, charcoal console, cream paper, and muted disabled states remain consistent with the existing game.
- Image quality and asset fidelity: existing map, vehicle, icon, paper, and metal assets are reused without stretching or replacement.
- Copy and content: no quest, resource, destination, or action copy was removed. Redundant right-column action verbs are visually reduced to a chevron.

## Interaction and runtime checks

- Destination and stay tabs switch successfully.
- Enabled action cards remain native buttons; the radio action remains disabled.
- Build completed successfully.
- Chrome console errors observed during the two-state capture: 0.

## Comparison history

### Iteration 1

- P1: route mission and resource information overlapped in the lower map console.
- P1: stop actions used a split-card layout with a broad brown duplicate-action column.

### Iteration 2

- Route rows were reallocated and text overflow was constrained. Post-fix intersections: 0.
- Stop actions were flattened into whole-card buttons with compact chevrons.
- Post-fix evidence is recorded in the implementation screenshots above.

## Follow-up polish

- P3: the compact mission guidance intentionally truncates long text; the Goals screen remains the full-detail source.
