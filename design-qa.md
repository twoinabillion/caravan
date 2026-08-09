# Event Terminal Design QA

## Artifacts

- Source visual truth: `/Users/sang/caravan/audits/event-interface-redesign-2026-08-09/event-interface-final-concept-v1.png`
- Rendered implementation screenshots:
  - `/Users/sang/caravan/tests/shots/event-terminal-360-final/11-event-context.png`
  - `/Users/sang/caravan/tests/shots/event-terminal-360-final/10d-combat-plan.png`
  - `/Users/sang/caravan/tests/shots/event-terminal-360-final/10e-combat-choice-result.png`
- Full-view normalized comparison: `/Users/sang/caravan/audits/event-interface-redesign-2026-08-09/event-terminal-design-qa-pairs-final.png`
- Focused choice/result comparison: `/Users/sang/caravan/audits/event-interface-redesign-2026-08-09/event-terminal-design-qa-focus-final.png`

## Normalization

- Implementation viewport and CSS size: `360 × 700` CSS px.
- Implementation pixel size: `360 × 700` px per screenshot, device scale factor `1`.
- Source pixel size: `1536 × 1024` px containing three framed concepts.
- Source normalization: the three concept frames were cropped at their visible frame bounds and each normalized to `360 × 700` px before comparison. The paired comparison preserves each normalized source and implementation screen at 1:1 pixels.
- States: normal story beat (`roadbeat_200_archive`, 1/4), tactical choice (`patrol_walker`, 3/3), and immediate result after the lure choice (2/2).

## Findings

- No actionable P0, P1, or P2 differences remain.
- [P3] The concept includes a decorative armored footer bezel around every phone frame. The implementation keeps Caravan's existing full-screen event sheet and uses the game's real raster navigation-button face for the primary action instead of adding a second decorative device frame. This is an intentional integration constraint and does not change hierarchy or interaction.
- [P3] The implementation uses longer production story and consequence copy than the concept's short example copy. The content still remains readable, scrollable where needed, and keeps the primary action visible.

## Required Fidelity Surfaces

- Fonts and typography: Korean sans and mono roles preserve the concept's hierarchy: strong event title, mono metadata, readable body copy, and compact secondary labels. Tactical names are now plain bold headings rather than inherited bordered pills. No clipped or truncated critical copy was found at 360 × 700, 390 × 844, large text, or 200% zoom.
- Spacing and layout rhythm: the image remains the dominant upper region; metadata, title, context, and story use a continuous navy surface; tactical decisions are limited to three visible rows per page; outcome chips form one compact row; primary actions remain at least 44 px. The larger runtime scene is intentional because the product goal was to show more of the Caravan.
- Colors and visual tokens: dark navy surfaces, amber action emphasis, teal context/intent, and red danger states match the source direction and reuse the game's established tokens.
- Image quality and asset fidelity: all three states render the real Caravan/walker scene asset with a stable crop and no placeholder imagery. The primary action uses the existing raster navigation-button asset.
- Copy and content: production Korean event copy replaces the mock's example copy while preserving the same beat → decision → consequence structure, explicit progress, selected-action recap, danger/context information, and next action.

## Full-view Comparison Evidence

The final paired comparison shows all three source/implementation state pairs at equal `360 × 700` dimensions. Overall hierarchy, scene dominance, continuous surface, three-row tactical layout, consequence chips, and bottom primary action align. The implementation's real content density is slightly higher but does not obscure the primary path.

## Focused Region Comparison Evidence

The focused comparison covers the tactical cards and result/action regions at 1:1 pixel scale. It confirms plain tactical headings, uncut supporting copy, distinct amber/teal/red states, a clear selected-action recap, three consequence chips, and a fully visible primary action.

## Comparison History

1. Initial comparison: `/Users/sang/caravan/audits/event-interface-redesign-2026-08-09/event-terminal-design-qa-pairs-v1.png`
   - [P2] Tactical names inherited the old bordered-pill treatment, making the cards denser and visually different from the concept.
   - Fix: reset `.combat-tactic` padding, border, and background inside the cinematic decision state and retain it as a bold plain heading.
2. Post-fix comparison: `/Users/sang/caravan/audits/event-interface-redesign-2026-08-09/event-terminal-design-qa-pairs-final.png`
   - The tactical hierarchy now matches the concept. No actionable P0/P1/P2 differences remain.

## Interaction and Runtime Checks

- Tested story auto-advance and manual pause.
- Tested finishing a story into a decision state.
- Tested 3-item pagination across 4- and 7-choice events.
- Tested combat detail expansion/collapse.
- Tested resolving a choice into recap, effects, story result, and the next action.
- Tested 360 × 700, 390 × 844, large text, reduced motion, and 200% zoom coverage.
- Console/page errors: zero in the relevant browser regression suites.

## Follow-up Polish

- If a future dedicated event-shell raster is commissioned, the concept's armored footer bezel could be added without changing the current interaction model.

final result: passed
