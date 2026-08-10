# Stop Mode Console Design QA

## Artifacts

- Source visual truth: `/Users/sang/Desktop/Caravan 정차 UI 세 가지 안 - 2026-08-09/03-모드-전환-콘솔.png`
- Normalized source: `/Users/sang/caravan/tests/shots/stop-console-structure-final-3/source-option-03-normalized.png`
- Browser-rendered implementation:
  - Local overview: `/Users/sang/caravan/tests/shots/stop-console-structure-final-3/00d-stop-actions.png`
  - Local overview with extra actions: `/Users/sang/caravan/tests/shots/stop-console-structure-final-3/00da-stop-actions-extra.png`
  - Local extra-action drawer: `/Users/sang/caravan/tests/shots/stop-console-structure-final-3/00db-local-actions-drawer.png`
  - Route navigator: `/Users/sang/caravan/tests/shots/stop-console-structure-final-3/00-navigation-busan.png`
  - Vehicle overview: `/Users/sang/caravan/tests/shots/stop-console-structure-final-3/00e-vehicle-tools.png`
  - Vehicle detail drawer: `/Users/sang/caravan/tests/shots/stop-console-structure-final-3/00f-vehicle-detail.png`
- Full-view comparison: `/Users/sang/caravan/tests/shots/stop-console-structure-final-3/design-comparison-local.png`
- Focused console comparison: `/Users/sang/caravan/tests/shots/stop-console-structure-final-3/design-comparison-console-focus.png`

## Normalization

- Source pixel size: `900 × 1747` px.
- Source normalized size: `360 × 700` px.
- Implementation viewport and CSS size: `360 × 700` CSS px.
- Implementation pixel size: `360 × 700` px at device scale factor `1`.
- State: stopped at 부산 감천 부두, Day 1 at 07:30, `머물기` selected.
- The source was normalized to the implementation viewport. Both full views omit browser chrome and device framing.

## Findings

- No actionable P0, P1, or P2 differences remain.
- [P3] The concept uses a second heavy metal rail around `길 / 현지 / 달구지`; the implementation intentionally uses a thin `목적지 / 머물기 / 달구지` switcher so the Caravan and live console retain more space.
- [P3] The concept uses a shared time/risk/reward summary. The implementation intentionally keeps those facts on each action card, preventing metadata from describing the wrong action when multiple choices are visible.
- [P3] 부산 has two authored local actions, so the normal local overview has no `더 할 일` button. The separately captured recruit-task state proves that the button and drawer appear when a third action exists.

## Required Fidelity Surfaces

- Fonts and typography: the Korean sans/mono hierarchy, amber action titles, teal state labels, and compact instrument labels match Caravan's established system. The final browser audit found no visible text below 12 px, and dynamic action metadata wraps without covering the CTA.
- Spacing and layout rhythm: the upper Caravan scene remains dominant. The mode switcher is a single 44 px rail, the destination navigator keeps its original geometry, and local/vehicle screens use one metal shell. The local overview shows at most two complete actions; neither overview has an internal scroll area.
- Colors and visual tokens: navy screens, warm metal, amber selected/action states, teal status states, and red hazard states match the source direction and existing game tokens. Selected tabs also use a bottom marker, not color alone.
- Image quality and asset fidelity: the implementation reuses the real raster console shell, button faces, pixel icons, minimap, and Caravan scene. No placeholder imagery, handcrafted SVG, CSS-drawn substitute, or stretched UI sprite was introduced.
- Copy and content: ambiguous `길 / 현지` copy is replaced by task language—`목적지 / 머물기 / 달구지`. Route danger and supplies remain functional; local actions carry their own time/risk/reward; vehicle detail contains real fuel, chassis, equipment, repair, and radio state.

## Full-view Comparison Evidence

The combined full-view pair shows the same stopped/local state. Both preserve the scene → resource HUD → mode selector → armored terminal → five-button dock hierarchy. The implementation deliberately removes the source's second heavy selector frame and global summary, but retains the same amber/teal hierarchy, two-action scan pattern, vehicle status strip, and raster hardware language.

## Focused Region Comparison Evidence

The focused pair confirms that the live screen still reads as one armored terminal. Compared with the source, the implementation's action rows expose their own metadata and full CTA faces without overlap, while the thin selector reduces stacked metal. Text, status chips, shell edges, and the three system values are readable at the native 360 px capture.

## Comparison History

1. Audited implementation at commit `47a6e10`:
   - Evidence: `/Users/sang/caravan/audits/stop-console-qa-2026-08-10/00-stop-console-audit-contact.png`.
   - [P1] The second local action was clipped behind a fixed summary.
   - [P1] The route navigator was compressed by a generic fixed panel ratio.
   - [P1] Opening vehicle management changed the toggle label but left its contents below an invisible nested scroll.
   - [P2] `길 / 현지` competed with the selected bottom `길` tab and did not describe the tasks clearly.
2. Structural fix:
   - Restored the original route-console geometry.
   - Replaced the heavy mode rail with a thin 44 px selector.
   - Limited the local overview to two complete action cards and moved additional actions to a full-screen drawer.
   - Removed the nested vehicle-management toggle; the overview now shows three system values and the most-needed action, while full repair/equipment content opens in a full-screen drawer.
   - Renamed modes to `목적지 / 머물기 / 달구지`.
3. First 360 px recapture:
   - Evidence: `/Users/sang/caravan/tests/shots/stop-console-structure-final/00d-stop-actions.png`.
   - [P2] Local status content extended behind the persistent dock.
   - Fix: shortened small-screen rows, removed only redundant description copy, retained per-action metadata, and adjusted local/vehicle shell ratios.
4. Accessibility-density recapture:
   - Evidence: `/Users/sang/caravan/tests/shots/stop-console-structure-final-3/00d-stop-actions.png`.
   - Raised every visible local/vehicle label to at least 12 px and hid redundant English kickers on the smallest viewport.
   - Post-fix evidence shows complete actions, the resource strip, and all persistent controls without overlap.
5. Final combined comparison:
   - Evidence: `/Users/sang/caravan/tests/shots/stop-console-structure-final-3/design-comparison-local.png`.
   - No actionable P0/P1/P2 differences remain.

## Interaction and Runtime Checks

- Chromium browser capture at `360 × 700`, device scale factor `1`.
- Tested mouse/touch mode switching and arrow-key tab switching.
- Tested route selection, hazard details, resource details, and departure.
- Tested local camp, the conditional `더 할 일` button, drawer open/close, and focus restoration.
- Tested vehicle overview, detail drawer, repair action, radio state, and drawer close.
- Tested `360 × 700`, `390 × 844`, `480 × 860`, large text, reduced motion, and 200% zoom.
- Golden route, keyboard-only, source-health, and Quality 9 accessibility gates pass.
- Browser console/page errors: zero.

## Follow-up Polish

- If 부산 later receives an authored settlement-interior hub, it can become the first local action while keeping exploration second and moving camp to the existing extra-action drawer.

final result: passed
