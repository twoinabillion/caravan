# Caravan development guardrails

This is the canonical workflow for changes to `서울까지 400km`. `AGENTS.md` contains the short mandatory version; this document owns the detail. Do not create competing copies of these rules.

## 1. Source ownership

- `서울까지400km.html` is generated output. Never edit it directly.
- UI and responsive behavior live in `src/01-style.html`, DOM in `src/02-dom.html`, data in `src/03*.js`, game state and persistence in `src/04*.js`, and rendering/interactions in `src/07*.js`.
- Find every rule for a component before editing it. If a component already has an owning block such as `bag-code-panel-final`, modify that block. Do not add another late `!important` patch.
- Legacy normalizers may support old markup, but they must explicitly exclude current components that have a maintained layout owner.

## 2. Live development

1. Run `npm run dev:live`.
2. Use the normal Chrome tab at `http://localhost:4173/`.
3. CSS-only builds replace styles in place and must not reset the current screen, selection, or scroll position.
4. JS, data, structure, and wired-asset builds show `새 코드 준비됨 · 눌러서 적용`. Apply them deliberately.
5. In live mode, a refresh resumes the current save. Road tools such as 가방, 목표, and 지도 should reopen from the captured preview state.
6. Newly generated images appear first at `http://localhost:4173/__live/assets`.

## 3. UI change checklist

- Establish one layout owner and remove or exclude competing selectors.
- Check the real mobile portrait viewport, not only source code or generated HTML.
- A growing transcript's manuscript must contain every entry and action. Remove inherited fixed aspect ratios from its owner; `height:auto` alone can leave readable text outside the painted background. Check both pre-choice and result states.
- Verify the top, middle, and bottom of the screen. No clipping, overlap, accidental horizontal growth, or unexplained dead space is acceptable.
- The legacy text-based action-card normalizer must exclude `#ovl-camp`; a navigation label containing 야영 준비 is not a road action card. Camp navigation, scrolling content and rest footer have separate layout owners.
- Repeated information must be removed. A detail panel should add meaning, not repeat the tile label and quantity in a larger box.
- Observer-driven goal rendering must preserve unchanged cards and focused controls. When the summary is hidden, keep the card list in its flexible grid row so it scrolls inside the screen; verify an actual click, not just the presence of its label.
- Touch targets stay usable, but visual panels should occupy only the space required by their content.
- Images must be checked by visible subject size, not only CSS box size. Transparent padding and inherited absolute positioning can make a nominally large icon appear small.
- Upgrade installation art has its own bounded landscape overview above the work panel. Never use the small workbench art as a full-height `cover` background: the 2026-09-24 fuel-tank player report exposed severe side cropping. Keep the whole part visible and allow the work content to scroll at short heights.
- HOME artwork derives from the same owned objects as its readable labels. Departed-companion memories never create physical props; sleeping tiers replace the previous furniture. Atlas regions follow actual visible bounds, not an assumed equal grid. Inspect floor contact, shelf height and all furnishings together at mobile size.
- For the route preview, review the selected photograph's width and crop together with its height. Equal-height map/photo rows can turn a narrow carousel card into a portrait crop; verify the centered selected card and both map labels at short and tall viewports.
- Destination previews have dedicated horizontal art; arrival portraits keep their own registry. Verify both route and driving consumers: a new16:9 asset still crops if a fixed-height `cover` rule wins. Search specificity as well as rule order; `#app #journey-mode-route` can override a later class-only aspect-ratio rule. Keep the whole landmark visible without enlarging map/forecast rows.
- For text over a raster device shell, measure placement against the artwork's inner display and decorative controls. An element can fit its DOM parent while still crossing the painted bezel; inspect the selected map region on desktop and mobile without changing type size to hide an alignment error.
- Confirm the selected, disabled, empty, maximum-content, and narrow-screen states.
- Primary departure, its forecast, and the selected bag item description must be visible before scrolling. A successful `scroll_into_view_if_needed` is not proof of first-view discoverability. Reserve route action height before allocating scenery/map space; destination cards preview and the named departure button starts travel. Clear a previous stay-mode scenery height when returning to route mode, including after an event result.
- Short story decisions should show the last turn and the whole choice group together. Long decisions keep one scroll and a visible continuation cue without skipping unread text. Consume advancing input until release; a fixed timeout must not reject a new tap or allow a held key to choose.
- Narrative choices must read as controls before interaction. The 2026-09-24 paper theme used almost identical paper/button colors (1.07:1 fill contrast), hid the choice heading, and lost choice discoverability in a player test. Keep a distinct button surface and visible decision cue; check default, pressed and disabled states on the actual paper background, not text contrast alone. Equally valid story options receive equal visual emphasis.
- Content-led tool panels use available height as a maximum, not a forced empty panel. A responsive disclosure must remain openable after resizing from short to tall; urgent supply and vehicle state stay visible outside it.
- A content-led bag must also clear inherited aspect ratios and absolute insets. Test text/count rectangles inside each item, not only the card rectangles; desktop uses the game container width, not the outer browser width. A 62px card still needs two real text rows beside its icon.
- Continuous transcripts append choices after story entries. Tests must select the last story entry explicitly, not `.story-entry:last-child`. For focus assigned on the next animation frame, use a retrying focus assertion rather than sampling synchronously.
- Reading preferences must be reachable from the current menu, not only a retired settings surface. Check computed sizes of narration, dialogue, opening thoughts (`D.openingDeparture`), choices and reward labels. Consume reading-size tokens in the winning owner rules, including duplicate high-specificity `!important` blocks.
- Reward labels must wrap within their result section at 320px with large text. Paper ink needs paper-specific foreground/background tokens; do not apply those dark inks to combat's dark surface.
- Visual captures after `restoreQaView` must explicitly leave `qa-exact-replay` when testing animation completion. A paused entry animation is not evidence that its text is permanently missing.
- Story forecast rows separate authored cost and lasting information and inherit reading-size preferences. Shared choice markup also serves combat: keep its inline labels and separators unless its own layout is intentionally changed and tested. Validate real text spacing, not only node presence. Wait for text reveal opacity before accepting visual captures.

### Approved stopped-scene composition — 2026-09-25

- `Journey scene/deck owner` owns the new stopped screen. Scene/time → slim vehicle status → destination/forecast/departure/objective → navigation. Regional map replaces scenery only when requested; opening it compresses the deck by46px. The existing driving destination preview remains separate.
- Preserve real route selection, `G.travelForecast`, departure eligibility and urgent warnings. An unavailable journey must say `이동 불가`, not turn a zero-duration forecast into1minute. Unlimited fuel labels apply only to the existing developer mode.
- The journey view stores mode/destination/map disclosure separately from gameplay. Restore only at the same stopped location and validate the selected route. Escape closes the top dialog before the underlying map, then returns focus to its toggle.
- Legacy local-action CSS must exclude or explicitly defer to `.journey-deck`; a stale48px inset caused a false empty band below the new tabs. Check the first activity and the last reachable activity.
- The map terrain is illustrative. Endpoints/connectivity/costs come from the game graph; the curved gold line is schematic, not a GIS road trace. Never add a false geographic scale.

## 4. Logic and transition checklist

- Define the entry trigger, visible feedback, success result, cancel/back route, and next action for every flow.
- There must be no state where the player cannot continue, return, or understand what to do next.
- Save before destructive transitions. Reloading must preserve gameplay data and the live preview should restore its supported UI surface.
- Camp recollections contain one short saved incident, without mechanic labels or numeric costs. Legacy context is presented from its own frozen text, never regenerated from a newer combat report; its original remains an optional record. Rendering cannot rewrite the receipt or apply its effects.
- Event approach, event scene, choices, result, reward, and return-to-road must form one continuous sequence.
- Keep the event conversation, chosen action, and result in one transcript. Reading state belongs to the existing gameplay receipt; restoring it must not reapply effects. Save disclosure activation synchronously because a native queued `toggle` event can lose a race with immediate reload, and ignore handlers from a replaced story state.
- A quest update must say what changed, what the player should do now, and where that action is available.
- Goal notifications use the existing goal entry; they must not cover forecast or departure. The existing ledger unread queue is acknowledged when the ledger is opened or when a saved event result owns the update, not when its indicator is drawn. Test unread and acknowledged states across reload, keeping unchanged renders idempotent.
- Goal shortcuts open a decision surface without running its gameplay actions. In particular, opening the market from a goal must not auto-complete a delivery; keep the explicit hand-in control. Close previously open journal/map overlays before returning to road controls.
- Route recommendations must respect the active corridor in both the next edge and the remaining path. For an outside objective, preserve its destination and guide through the corridor endpoint first; use the driving leg origin when the stopped node is empty.
- Saved narrative chains can bypass beat/story queue guards. Consume main-evidence chains through the same completion and recovery-location contract before opening a scene, and persist the consumed state; never infer a scene's current location from total distance.
- Live arrival, normal scene entry, and Continue must share the pending-presentation resolver. A preparation-return regression replayed completed Seoul work because only Continue recovered its unfinished phase; test the arrival's next control before any reload, including conflicting partial-save flags.

## 5. Image generation and integration

- Read `docs/IMAGE-BIBLE.md` and `assets/visual-contract.json` before generation or editing.
- Use the required canonical references for the Dalguji and named characters. Keep identity, age, clothing, world state, color grade, lens language, and realism consistent.
- Do not include companions the player has not met, incorrect landmarks, generated text, UI borders, or watermarks.
- Generate a large master, export the contract delivery size, inspect it in the live asset gallery, then inspect its actual in-game crop.
- Each registered upgrade must show its own selected part through `D.upgradeItemArt`; a known item missing art must not silently display another part from a shared workbench group. New item images use768×512 WebP and the checker enforces their size/budget separately from legacy cards.
- Pixel art belongs only to road-approach cues. Narrative scenes and portraits follow `caravan-grounded-cinematic-v1`.

### Live renderer assets — 2026-09-25

- The approved mock uses a dedicated transparent cream Dalguji and blue-gray overpass environment plate. They were reviewed in the live gallery before wiring. Event paintings remain excluded from moving-road scenes.
- Keep236logical coordinates and a2× backing buffer. Drawing a high-resolution buffer into another canvas requires explicit source/destination dimensions, including glitch sampling and the shared garage preview.
- Split base vehicle at the living-box/cab seam and below the windows; extend living space from actual upgrade stages while preserving wheel/cab geometry. Keep weather, clock lighting, passengers, upgrades, cue approach and braking live. Interior lights remain warm at night; owned curtains cover the actual sprite windows.
- Mirror alternating background tiles to share identical edge pixels. Apply this environment only to the matching overpass profile; retain other biomes and transitions.
- Register renderer placeholders in the HTML builder, not just CSS. Reject unresolved `__UI_*` placeholders. Delivery vehicle is compressed WebP with alpha; retain PNG/master provenance. Do not increase build limits to accommodate an uncompressed source.
- Manual fixtures use a separate port and explicit test state. Browser DOM evaluation is read-only; use visible controls to exercise flows. Studio's S26 skin is layout QA with assumed density, not proof of native Android performance.

## 6. Definition of done

A change is done only when its source owner is clear, the live build succeeds, the exact affected screen is visually inspected, navigation still has a next action, refresh behavior is accounted for, and any new asset passes both the visual contract and in-game crop review.

When a regression escapes, document its cause here or in `AGENTS.md` before moving on. The goal is to remove the class of mistake, not stack another override on top of it.
