# Caravan repository instructions

## Required workflow

- For design changes, show a draft in Studio's **디자인 초안** window and discuss it with Sang before implementing the game UI. Register prototypes in `tools/design-drafts/manifest.json`; draft selection only prepares a chat request and must not auto-apply changes. Keep prototypes separate from gameplay/save state.

- Read `docs/DEVELOPMENT_GUARDRAILS.md` before changing UI, gameplay flow, transitions, persistence, or visual assets.
- Edit source files under `src/`, `assets/`, and `tools/`; never hand-edit the generated `서울까지400km.html`.
- Before adding CSS, search the whole stylesheet for every existing selector and `!important` owner. Modify the owning final block instead of appending another `final`, `lock`, or emergency override.
- The current bag layout has one owner: `<style id="bag-code-panel-final">` in `src/01-style.html`. The legacy inventory normalizer must not style `#ovl-status`.
- Use `npm run dev:live` and inspect the user's actual current screen. In Live Game Studio, use the runtime preview URL supplied with the request (normally `http://127.0.0.1:4318/`, but ports can change), and its read-only current-scene endpoint before and after a change. `http://localhost:4173/` is only the standalone default. Do not start another server or open a fresh save as a substitute. A state snapshot, source diff or static DOM inspection is not visual QA.
- CSS-only live updates must preserve the current screen. Structural updates are staged behind the live apply badge. Manual refresh in live mode must resume the save and restore the open road tool when supported.
- A UI change is incomplete if text clips, panels overlap, a control has no clear purpose, a screen has unexplained dead space, or the next action is unavailable.
- A logic change is incomplete until the entry condition, success path, cancel/back path, persistence after refresh, and next reachable action are accounted for.

## Visual assets

- Moving-road approach cues must be drawn with the same canvas/pixel renderer as the caravan. Never place generated or raster event art into the live road scene; cinematic art starts only after the caravan has stopped and the event view opens.
- Dedicated base-vehicle and environment renderer assets (`journey-dalguji-base-v1`, `journey-road-backdrop-v1`) were introduced for the approved 2026-09-25 mock. They are transparent/live canvas parts, not event paintings or a screenshot backdrop. Preserve real upgrades, riders, weather, motion, braking and cue proportions; do not flatten them into one static game image.
- Road-cue proportions are contractual: a vehicle near the stop point is roughly 45-55% of the caravan's visible width, an adult is roughly half the cue vehicle's body height, and roadside props remain subordinate to both. Keep the caravan scale fixed; express approach with position and no more than 18-20% cue growth.
- Road events use a four-beat handoff: readable discovery, gradual deceleration, settled stop, then event view. Never switch the caravan bounce or world scroll with a boolean speed threshold; both must ease continuously to zero.
- The approved 2026-09-25 stopped screen has one owner: `Journey scene/deck owner` in `src/01-style.html`. The scene header owns location/time; the slim strip owns fuel/hull/weather; one destination row and forecast lead to one departure button and a quiet objective shortcut. Open the regional map in place of scenery on demand; do not restore the always-visible map/photo/telemetry stack. Driving retains its separate destination preview.
- Player-facing game terms are `메인 스토리`, `사이드 미션`, and, only when the distinction matters, `동료 미션`. Do not expose `주 임무`, `선택 이야기`, `선택 임무`, `선택 의뢰`, or `업무` as navigation labels.
- Every non-main objective, including parcel delivery, procurement, regional requests, recruitment, and companion stories, belongs to the top-level `사이드 미션` tab. Show `배달`, `조달`, `지역`, or `동료` only as a card subtype. Active cards show the next action but never reveal their outcome or reward; results appear only after completion.

- Before generating, editing, accepting, or wiring any raster image, read `docs/IMAGE-BIBLE.md` and `assets/visual-contract.json`.
- The only standard narrative style is `caravan-grounded-cinematic-v1`. Do not introduce comic, anime, pixel-art, glossy photographic, 3D-rendered, or unrelated concept-art variants into intro, event, settlement, ending, or portrait assets.
- Always attach the required canonical reference images listed in `assets/visual-contract.json`. When a named character or the Dalguji appears, also attach that subject's canonical portrait or vehicle reference.
- Generate a large master, then export the repository delivery asset at the contract size. Never use a UI screenshot, generated text, border, caption, or watermark as part of scene art.
- Pixel art is reserved for the road-approach cue layer under `assets/road-cues/`; it must not be reused for narrative scenes or portraits.
- A visual asset is not complete until its aspect ratio, dimensions, identity continuity, world continuity, and style checklist all pass. Machine validation checks geometry and files; a human or vision QA pass remains mandatory for style.
- New assets must appear in `/__live/assets` on the actual active preview origin before being wired into gameplay. After wiring, inspect the exact in-game crop and confirm that no unintroduced companion or landmark appears.


<claude-mem-context>
# Memory Context

# [caravan] recent context, 2026-09-28 3:57pm GMT+9

No previous sessions found.
</claude-mem-context>
