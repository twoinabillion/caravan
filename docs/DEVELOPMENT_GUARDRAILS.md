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
- Repeated information must be removed. A detail panel should add meaning, not repeat the tile label and quantity in a larger box.
- Touch targets stay usable, but visual panels should occupy only the space required by their content.
- Images must be checked by visible subject size, not only CSS box size. Transparent padding and inherited absolute positioning can make a nominally large icon appear small.
- For text over a raster device shell, measure placement against the artwork's inner display and decorative controls. An element can fit its DOM parent while still crossing the painted bezel; inspect the selected map region on desktop and mobile without changing type size to hide an alignment error.
- Confirm the selected, disabled, empty, maximum-content, and narrow-screen states.
- Primary departure, its forecast, and the selected bag item description must be visible before scrolling. A successful `scroll_into_view_if_needed` is not proof of first-view discoverability. Reserve route action height before allocating scenery/map space; destination cards preview and the named departure button starts travel. Clear a previous stay-mode scenery height when returning to route mode, including after an event result.
- Short story decisions should show the last turn and the whole choice group together. Long decisions keep one scroll and a visible continuation cue without skipping unread text. Consume advancing input until release; a fixed timeout must not reject a new tap or allow a held key to choose.
- Content-led tool panels use available height as a maximum, not a forced empty panel. A responsive disclosure must remain openable after resizing from short to tall; urgent supply and vehicle state stay visible outside it.

## 4. Logic and transition checklist

- Define the entry trigger, visible feedback, success result, cancel/back route, and next action for every flow.
- There must be no state where the player cannot continue, return, or understand what to do next.
- Save before destructive transitions. Reloading must preserve gameplay data and the live preview should restore its supported UI surface.
- Event approach, event scene, choices, result, reward, and return-to-road must form one continuous sequence.
- Keep the event conversation, chosen action, and result in one transcript. Reading state belongs to the existing gameplay receipt; restoring it must not reapply effects. Save disclosure activation synchronously because a native queued `toggle` event can lose a race with immediate reload, and ignore handlers from a replaced story state.
- A quest update must say what changed, what the player should do now, and where that action is available.
- Route recommendations must respect the active corridor in both the next edge and the remaining path. For an outside objective, preserve its destination and guide through the corridor endpoint first; use the driving leg origin when the stopped node is empty.
- Saved narrative chains can bypass beat/story queue guards. Consume main-evidence chains through the same completion and recovery-location contract before opening a scene, and persist the consumed state; never infer a scene's current location from total distance.
- Live arrival, normal scene entry, and Continue must share the pending-presentation resolver. A preparation-return regression replayed completed Seoul work because only Continue recovered its unfinished phase; test the arrival's next control before any reload, including conflicting partial-save flags.

## 5. Image generation and integration

- Read `docs/IMAGE-BIBLE.md` and `assets/visual-contract.json` before generation or editing.
- Use the required canonical references for the Dalguji and named characters. Keep identity, age, clothing, world state, color grade, lens language, and realism consistent.
- Do not include companions the player has not met, incorrect landmarks, generated text, UI borders, or watermarks.
- Generate a large master, export the contract delivery size, inspect it in the live asset gallery, then inspect its actual in-game crop.
- Pixel art belongs only to road-approach cues. Narrative scenes and portraits follow `caravan-grounded-cinematic-v1`.

## 6. Definition of done

A change is done only when its source owner is clear, the live build succeeds, the exact affected screen is visually inspected, navigation still has a next action, refresh behavior is accounted for, and any new asset passes both the visual contract and in-game crop review.

When a regression escapes, document its cause here or in `AGENTS.md` before moving on. The goal is to remove the class of mistake, not stack another override on top of it.
