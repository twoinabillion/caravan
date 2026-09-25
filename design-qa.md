# Approved Caravan mock → live game

final result: passed

## Comparison target and evidence

- Source visual truth: `/Users/sang/Desktop/Caravan_UI_시안_2026-09-25.png`,1254×1254 board with two app states.
- Implementation: original `/Users/sang/caravan`, generated HTML SHA256 `aedd868a2c44cfc0f100a2e47a5e16ba7e806b4504aa2c1a9732848280a74bce`,79,906,360bytes.
- Source left app crop ≈561×1029 at(46,151); right app normalized independently. Browser review page scales each source app to360×659 and places the actual360×659 game beside it. Labels/padding are outside both app regions.
- State: Yangsan, DAY1·09:37, hull82%, clear, Miryang34km·157min, existing developer unlimited resources. Map comparison uses the same selected destination. Real objective text is preserved.
- Both source and rendered app were viewed together in each comparison input, including focused deck comparison. Source scaling is≈0.641; implementation evidence is normalized1image pixel/CSSpx. Browser screenshot clipping required a0.9 coordinate correction at the current browser zoom; saved dimensions were checked. This is not a double-density image comparison.
- Full composition: [scene-comparison.png](audits/mockup-implementation-2026-09-25/scene-comparison.png),760×690; [map-comparison.png](audits/mockup-implementation-2026-09-25/map-comparison.png),760×690.
- Focused typography/controls: [deck-comparison.png](audits/mockup-implementation-2026-09-25/deck-comparison.png),760×364.
- Additional app capture: [implemented-s26.png](audits/mockup-implementation-2026-09-25/implemented-s26.png),360×728. [Installed Studio S26](audits/mockup-implementation-2026-09-25/studio-s26.png),1920×1007, contains a75% display of360×728 CSS content with a3× device-density assumption. The Studio capture is supporting integration evidence, not the normalized fidelity comparison.

## Findings and iteration history

No actionable P0/P1/P2 finding remains within the approved stopped-screen/map scope.

1. **P1, resolved — hierarchy and density.** The old always-visible scenery/map/destination/status/mission stack competed for space. Replaced with a single destination/forecast/action deck and an on-demand map. Actual departure and warnings remain visible.
2. **P2, resolved — proportions and local-mode dead space.** Earlier deck proportions compressed the destination block; legacy48px local-action inset created an empty band. Main road deck is292px, map deck246px, with smaller responsive values at short heights. Local actions now own their scroll area. Post-fix: full and focused comparisons above;320×568 first-view controls inspected.
3. **P1, resolved — artwork fidelity.** [Iteration2](audits/mockup-implementation-2026-09-25/iteration-2-scene.png) had the correct UI but a boxy pixel vehicle and flat skyline. Dedicated canonical Dalguji/overpass assets now compose within the live renderer. They preserve actual vehicle extensions, passengers, weather, motion and events. Full final comparison shows the intended cream metal, amber windows and blue-gray city layers.
4. **P2, resolved — map backdrop and route readability.** Replaced a broad existing map crop with dedicated inland relief; increased label contrast and used a gold schematic curve between real game endpoints. Post-fix: map comparison. No fake GIS scale was added.
5. **P2, resolved — unavailable-trip forecast.** Zero fuel previously displayed1minute after rounding a zero duration. It now says `이동 불가`, displays the reason and disables departure. Verified using the explicit no-fuel fixture.
6. **P2, resolved — night sprite lighting.** Global body darkening initially dimmed the window lamps too. Actual window crops now remain lit; curtains mask those same regions when owned. [Final night](audits/mockup-implementation-2026-09-25/night.png).

Build-size and placeholder integration failures were separately fixed by embedding the renderer assets and using the compressed WebP delivery. Those fixes are technical verification, not counted as visual comparison iterations.

## Five fidelity surfaces

| Surface | Assessment |
|---|---|
| Fonts/typography | Korean sans matches the reference's compact, clear character. Actual stack is Apple SD Gothic Neo→Pretendard→Noto Sans KR→Malgun Gothic→sans-serif. Destination22px/750, tabs15px/700, forecast15px/550, departure16px/750; narrow sizes explicitly reduced. Generated reference has no trustworthy font metadata, so exact typeface identity is not claimed. Focused capture shows readable alignment and no unintended wrapping. |
| Spacing/layout | Scene,38px status,292px deck,66px navigation reproduce the road hierarchy. Map removes the status and gains room through246px deck. Same-view comparison shows comparable gutters and primary-action placement. At320×568 the dock bottom is567.8px and scrollWidth equals320; departure and objective remain in view. |
| Colors/tokens | Dark olive surface, low-contrast borders, warm cream text and muted amber primary action track the source. Shared generated surface prevents a flat generic card appearance. Disabled state reduces emphasis; urgent hull/weather uses warm warning ink. |
| Image/asset fidelity | Generated dedicated renderer parts use canonical references; no full screenshot is pasted into gameplay. Vehicle keeps cream cab-over identity, roof cargo, two red cans, rear ladder and white X. Alpha/crop checked in gallery and real game. Terrain has no baked labels or UI. Official MIT Tabler icons form a consistent family; no custom invented icon approximation. |
| Copy/content | Location/time/fuel/hull/weather/destination/forecast are live values. Existing objective is deliberately `오지 않은 부모님의 다음 차를 찾는다`, slightly longer than the mock's abbreviated phrase. `지도 접기`, destination select, whole-map navigation and error text are functional additions. No implementation instructions appear inside player content. |

## Interaction and responsive verification

- Destination Miryang→Ulsan updates32km/148min, departure name and map endpoints. Reload retains destination/map disclosure at the same location.
- Map open/close, Escape and focus return; an open objective dialog consumes Escape before the underlying map. Full world map and objective ledger remain reachable.
- Local tab shows actual actions and scrolls to the last action. No gameplay action was performed on the user's saved preview.
- Isolated finite-resource departure enters actual driving and deducts fuel42→41L. [Driving](audits/mockup-implementation-2026-09-25/driving.png).
- No-fuel disabled state, storm+22% hull+80fatigue warning,320×568 normal/large reading preference,360×659,360×728 and390×844 were checked by scope. Reading preference primarily affects narrative text; this pass does not claim all route labels enlarge.
- Shared [garage preview](audits/mockup-implementation-2026-09-25/garage.png), [all-upgrades stress fixture](audits/mockup-implementation-2026-09-25/upgraded.png), night and storm inspected. The all-upgrades fixture intentionally exceeds ordinary slot choices to stress the renderer, not to certify an obtainable build.
- Installed Studio4317 uses the4318 game. Applied the visible new-code badge and confirmed Yangsan/DAY1·09:37/hull82% unchanged, with latest-code badge and new artwork. Inspected through a dedicated ordinary Chrome tab, not the separate native-app profile.
- Browser console inspection found only an unrelated Chrome extension `content.js` TypeError; no game error was observed in the inspected log window.

## Acceptable differences and test limits

- **P3:** Raster reference and generated runtime parts differ in individual clouds, building placement, wet-road glints and a few pixels of vehicle silhouette. The live road foreground and upgrade pieces remain dynamic. They do not change hierarchy or usability.
- **P3:** Standard vector icons use outlines where the generated mock mixes filled shapes. Focus outlines, a select chevron and map close action are intentionally visible for actual interaction.
- **Expected:** The map background is illustrative relief and its route is schematic. Graph connectivity/costs are real game data; this is not a geographic navigation product.
- Physical S26/Android/One UI performance, native desktop-app window, landscape, every biography/mission length and a complete campaign were not certified by this scoped pass. Existing unrelated mobile issues are not silently marked fixed.

## Implementation checklist

- [x] Approved road and map composition implemented in existing source owners.
- [x] Full and focused visual comparisons inspected after fixes.
- [x] Actual entry/action/back, disabled/warning states and view restoration checked.
- [x] Builder/content/strict visual contract and relevant graph/reader/place/renderer tests pass.
- [x] Desktop comparisons and implementation report saved; personal saves and prior dirty work preserved.

## Git 저장 직전 재검증

2026-09-25 사용자 요청으로 원본 게임의 누적 미커밋 작업을 저장한다. `npm run build:html`, Node 테스트 프로그램13/13, `git diff --check`를 다시 확인했다. 이때 재생성된 HTML은79,905,231bytes / SHA256`c38bee5d36c03e2ea95784781a9e2d50f6f63a1fc4251c45da3826834cda8c7c`이다. 위 캡처와 시각 판정은 앞서 명시한 빌드의 근거로 보존하며, 이 저장 단계에서 전체 시각 검수를 새로 수행한 것으로 바꾸지 않는다.
