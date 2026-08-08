# Current Game Audit

Captured at 390x844 mobile and 1280x800 desktop on 2026-08-08. Browser page errors: 0.

## Verdict

The game now has substantial narrative and systemic breadth. Its main risk is no longer missing features; it is that the interface presents too many systems with equal visual weight. Mobile hierarchy, combat decision readability, visual-language consistency, and map legibility should be improved before adding more content.

## Findings by priority

### P0: Mobile journey actions are pushed below the fold

Evidence: `02-journey-mobile.png`.

The location art, resource ledger, deadline block, journey control, and large first-journey guide consume the full viewport. The actual actions at the stop begin beneath the fixed navigation and are partially obscured. A new player learns about choosing a road before seeing the road choices.

Fix: collapse the guide after its first display, reduce the vertical HUD to one compact resource row, and reserve a visible area above the bottom navigation for the primary local or departure action.

### P0: Combat decisions use two dense vertical reading zones

Evidence: `03-combat-choice-mobile.png`.

The cinematic and encounter briefing occupy the upper half while a separate choice dock occupies the lower half. Only roughly two of four choices are visible, and each card contains tactic, action, modifiers, grade, failure cost, and resource cost in similarly muted text. Comparison requires repeated scrolling and memory.

Fix: collapse the completed briefing into a sticky one-line threat summary when choices appear; use a single scroll region; keep only tactic, action, confidence, and failure cost on the card; move detailed modifiers into an expandable explanation.

### P0: The visual language is still mixed

Evidence: all screens, especially `01-title-mobile.png`, `03-combat-choice-mobile.png`, and `05-settlement-mobile.png`.

The title uses procedural pixel art, story scenes use painterly cinematic illustration, controls mix emoji and bespoke symbols, portraits use another rendering style, and settlement navigation uses numbered diegetic plaques. Individual screens are attractive, but the game does not yet look like one authored visual system.

Fix: define three permitted asset families: painterly 16:9 narrative scenes, pixel/procedural vehicle and map graphics, and one consistent UI icon family. Remove emoji from permanent navigation and resource UI, while allowing it only inside informal dialogue or temporary notifications.

### P1: Map information is too faint and small on mobile

Evidence: `06-map-mobile.png`.

Unselected roads, city labels, the bottom legend, and secondary nodes are low contrast. The active location is clear, but the next meaningful destination and route direction are not. The map communicates geography better than a decision.

Fix: highlight the recommended/current corridor, enlarge the next two reachable nodes, dim irrelevant branches further, and replace the tiny legend with a contextual bottom sheet after selecting a node.

### P1: Camp ownership arrives as empty-state exposition

Evidence: `04-camp-mobile.png`.

At the start of the game, the new keepsake area and companion conversation area both explain absence. The player sees more empty-state copy than lived-in detail, weakening the intended feeling of home.

Fix: before the first recruit, combine these sections into one compact teaser. Expand the interior section only when the first companion or meaningful upgrade creates a visible change.

### P1: Desktop layout underuses available space

Evidence: `07-journey-desktop.png`.

The main game remains a narrow mobile column with a small detached summary panel and large unused areas. This preserves mobile behavior but feels unfinished on desktop and weakens readability for long-form content.

Fix: use a centered two-column shell at wider breakpoints: primary journey content on the left and persistent mission, party, and route context on the right. Keep overlays constrained rather than stretching them.

### P1: Small, muted text creates an accessibility risk

Evidence: `02-journey-mobile.png`, `03-combat-choice-mobile.png`, and `06-map-mobile.png`.

Several labels and descriptions appear near 10-12px with low-contrast blue-gray or brown-gray text. Color also carries meaning in combat grades and route state. Screenshots cannot confirm accessible names, focus order, screen-reader output, or reduced-motion behavior.

Fix: set 13px as the minimum functional text size, raise contrast for secondary copy, add non-color status shapes or words, and perform keyboard and screen-reader passes separately.

### P2: Settlement presentation is strong but navigation needs clearer affordance

Evidence: `05-settlement-mobile.png`.

The settlement is the most cohesive screen: consistent scene art, spatial navigation, party presence, and a clear primary action. However, numbered hotspots look partly decorative and their relationship to the illustrated locations is not always obvious.

Fix: strengthen selected and available states, connect each plaque to its location with a subtle line or glow, and show the function and expected result on focus before requiring entry.

## Flow health

1. Title: Healthy. Clear promise, strong atmosphere, and two understandable entry choices.
2. Journey hub: Needs major improvement. Complete information but weak action hierarchy on mobile.
3. Combat choice: Needs major improvement. Mechanically transparent but visually overloaded.
4. Camp: Functional. Good foundation, weak early-game empty state.
5. Settlement: Healthy. Best current example of cohesive, spatial UI.
6. Map: Needs improvement. Geographic overview is clear; route decision support is weak.
7. Desktop journey: Functional. Stable but not fully adapted to wide screens.

## Recommended order

1. Mobile journey hierarchy and bottom-navigation clearance.
2. Combat single-scroll decision layout.
3. UI icon and art-family standardization.
4. Map decision readability.
5. Camp progressive disclosure.
6. Desktop two-column adaptation.
7. Keyboard, screen-reader, contrast, and reduced-motion testing.

## Evidence limits

This audit covers captured visual states and visible hierarchy. It does not establish real-player pacing, comprehension over a full run, touch accuracy on physical devices, screen-reader compatibility, battery usage, or long-session fatigue.
