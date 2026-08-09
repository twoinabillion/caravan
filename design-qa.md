# Stop Mode Console Design QA

## Artifacts

- Source visual truth: `/Users/sang/Desktop/Caravan 정차 UI 세 가지 안 - 2026-08-09/03-모드-전환-콘솔.png`
- Normalized source: `/Users/sang/caravan/tests/shots/mode-console-03-qa/source-option-03-normalized.png`
- Rendered implementation screenshots:
  - Local mode: `/Users/sang/caravan/tests/shots/mode-console-03-qa/00d-stop-actions.png`
  - Route mode: `/Users/sang/caravan/tests/shots/mode-console-03-qa/00-navigation-busan.png`
  - Vehicle mode: `/Users/sang/caravan/tests/shots/mode-console-03-qa/00e-vehicle-tools.png`
- Full-view comparison: `/Users/sang/caravan/tests/shots/mode-console-03-qa/design-comparison-local.png`
- Focused console comparison: `/Users/sang/caravan/tests/shots/mode-console-03-qa/design-comparison-console-focus.png`

## Normalization

- Source pixel size: `900 × 1747` px.
- Source normalized size: `450 × 874` px.
- Implementation viewport and CSS size: `450 × 874` CSS px.
- Implementation pixel size: `450 × 874` px, device scale factor `1`.
- State: stopped at 부산 감천 부두, Day 1 at 07:30, Local mode selected.
- The source and implementation were compared at equal dimensions without browser chrome or an added device frame.

## Findings

- No actionable P0, P1, or P2 differences remain.
- [P3] The source mock shows `정착지 안으로` as its second local action. 부산 감천 부두 has no authored settlement-interior hub in production data, so the implementation surfaces the existing functional `야영 준비` flow instead of adding a dead or fabricated button.
- [P3] The implementation keeps the Caravan scene slightly larger than the concept. This is intentional and directly supports the requested goal of preserving more of the vehicle and upper scene.

## Required Fidelity Surfaces

- Fonts and typography: the implementation keeps Caravan's Korean sans/mono hierarchy, uses amber headings and teal state copy, and exposes no visible local-mode text below 12 px. Long dynamic descriptions wrap without covering the CTA.
- Spacing and layout rhythm: `길 / 현지 / 달구지` occupy one three-button hardware strip; exactly one fixed-height console panel is rendered at a time. The HUD, console, and bottom dock remain separate and aligned, with no horizontal overflow at the verified mobile widths.
- Colors and visual tokens: navy screen surfaces, amber selected/action states, teal local/status states, red hazard states, and warm metal shells match the selected direction and the existing game palette.
- Image quality and asset fidelity: the implementation reuses the game's real raster route-console shell, button faces, pixel icons, minimap, and Caravan scene. No placeholder image, custom SVG, or CSS-drawn replacement was introduced.
- Copy and content: mock copy was mapped to real game behavior. Local mode exposes exploration and the existing camp-preparation flow; Route mode keeps destination, danger, fuel, food, water, and departure behavior; Vehicle mode keeps fuel, chassis, installed equipment, repair, and radio actions.

## Full-view Comparison Evidence

The full-view comparison shows the same stopped/local state at equal `450 × 874` dimensions. Scene dominance, resource HUD, three-way mode selector, armored terminal, two local action rows, three-column risk/reward summary, vehicle status strip, and five-button dock preserve the selected concept's hierarchy.

## Focused Region Comparison Evidence

The focused comparison isolates the console region at equal width. It confirms the matching armored frame, selected `현지` state, two-row action structure, amber/teal emphasis, compact three-column summary, and persistent fuel/chassis/equipment strip. The production copy is denser but remains readable and contained.

## Comparison History

1. Initial implementation capture: `/Users/sang/caravan/tests/shots/mode-console-03/00d-stop-actions.png`
   - [P2] 부산 exposed only one local action, leaving most of the fixed terminal empty.
   - Fix: aligned action rows to the top and added the existing functional camp-preparation flow as a second local action.
2. Accessibility-density iteration: `/Users/sang/caravan/tests/shots/mode-console-03-qa/00d-stop-actions.png`
   - [P2] Raising visible local copy to the 12 px accessibility floor initially crowded redundant kicker and chip metadata.
   - Fix: mobile local rows now keep the title, description, CTA, shared risk/reward summary, and resource strip while hiding redundant per-row kicker/chip repetition.
3. Final comparison: `/Users/sang/caravan/tests/shots/mode-console-03-qa/design-comparison-local.png`
   - No actionable P0/P1/P2 differences remain.

## Interaction and Runtime Checks

- Tested mouse/touch switching between `길`, `현지`, and `달구지`; only one panel is present at a time.
- Tested arrow-key movement across the three mode tabs and visible focus states.
- Tested route selection, route cycling, hazard details, resource details, and departure.
- Tested local exploration and opening the real camp-preparation overlay.
- Tested vehicle-system visibility, equipment-management expansion, field repair, and radio actions.
- Tested `360 × 700`, `390 × 844`, `480 × 860`, large text, reduced motion, and 200% zoom.
- Golden route, keyboard-only, source-health, and Quality 9 accessibility gates pass.
- Console/page errors: zero in the browser regression runs.

## Follow-up Polish

- If 부산 later receives its own authored settlement-interior hub, replace the camp row in that location with the concept's `정착지 안으로` action and keep camp available through the existing menu.

final result: passed
