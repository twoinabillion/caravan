# Claude Fable handoff — Caravan settlement pixel world

Date: 2026-08-17
Project: `/Users/sang/caravan`
Current branch: `master`
Current committed baseline: `7a30c1d feat: build spatial settlements and grounded recruit flow`

## 1. The exact goal

Improve the in-world pixel art inside the already accepted settlement interface for **서울까지 400km / Caravan**.

The outer interface, map proportions, 2×2 facility controls, selected/disabled states, focus plate, enter button, return button, and responsive layout are already accepted. Keep them visually and behaviorally the same. The only immediate quality problem is that the little buildings and people inside the playable city map still look less polished than the surrounding interface.

This is not a request for another mockup. It must remain a real interactive Canvas world:

- the player can walk by touching the map;
- facilities are real destinations with existing hit areas;
- residents move and can be approached;
- recruit characters open their existing first-meeting events;
- the map animates continuously;
- all seven cities must keep working.

The intended result is a polished, coherent 16-bit top-down Korean post-collapse city map—not a literal copy of Pokémon and not a photograph with icons placed on top.

## 2. Before touching anything

The working tree contains the newest uncommitted visual refinement plus older audit evidence. Do **not** reset, clean, checkout, or overwrite unrelated work.

Start with:

```bash
cd /Users/sang/caravan
git status --short
git diff --check
```

Do not run `git reset`, `git clean`, or `git checkout --`. Do not pull over the working tree. Work from the files as they exist now.

Open the actual current game first:

- `/Users/sang/caravan/서울까지400km.html`

The source files are assembled into that single HTML by `npm run build:html`; never hand-edit the generated HTML.

## 3. Visual truth and evidence to inspect, in this order

1. Desired spatial grammar:
   - `/Users/sang/Desktop/images (4).jpeg`
   - `/Users/sang/Desktop/pokemon-gold-gen1recomp.avif`
2. The current full implementation:
   - `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/390x844-daegu-walk.png`
3. Focused before/after of the exact area being improved:
   - `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/daegu-sprite-focus-before-vs-after.png`
4. Reference beside the current game:
   - `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/reference-vs-daegu-sprites-v2.png`
5. The accepted outer UI and button states:
   - `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/daegu-button-states-v1.png`
   - `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/after/daegu-buttons-before-vs-after.png`
6. Existing implementation notes:
   - `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/audit.md`
   - `/Users/sang/caravan/docs/history/handoffs/design-qa.md`

The right side of `daegu-sprite-focus-before-vs-after.png` is the current target state. Build on it; do not regress to the left side.

## 4. What must not change

- Do not redesign the accepted outer frame or bottom controls.
- Do not change the 236×306 logical Canvas world size.
- Do not move facilities, residents, recruits, the player, or the parked Caravan.
- Do not alter facility hit areas or movement destinations.
- Do not add labels, speech bubbles, floating cards, or explanatory text inside the map.
- Do not make people larger merely to show detail. Named people currently render around 11×17 logical pixels and crowds around 7×12.
- Do not replace the city with an arrival photograph, hotspot overlay, miniature 3D scene, or realistic isometric illustration.
- Do not copy Pokémon characters, buildings, palettes, or proprietary sprites. Use only the broad top-down 16-bit spatial grammar.
- Do not introduce anime portraits, emoji, SVG stand-ins, CSS figures, blurry resampling, soft photo edges, bloom, large circular selection rings, or modern glass UI.
- Do not alter story data, recruit geography, dialogue, resource economy, or navigation.
- Do not commit or push unrelated files. Leave commit/push for the user to request unless explicitly told otherwise.

## 5. Current implementation map

### Runtime drawing

Main file:

- `/Users/sang/caravan/src/05-scene.js`

Important functions:

- `townPixelPalette()` — seven settlement palette families.
- `townPixelGround()` — roads and walkable ground.
- `townPixelBuilding()` — procedural background buildings and the large Daegu dome.
- `townPixelBackdrop()` — city-type-specific background placement.
- `townPixelAtlas()` — crops cells from the sprite atlas.
- `townPixelFacility()` — maps the four facility types to atlas cells.
- `townPixelPerson()` — maps player, recruits, companions, residents, and crowd to people cells.
- `townPixelVan()` — the parked Caravan; do not replace during this task.
- `townPixelAmbient()` / `townPixelNamed()` — moving crowd and named people.
- `townMove()` / settlement pointer handlers — interaction and movement; preserve them.

Logical world constants:

```js
const TOWN_W = 236;
const TOWN_H = 306;
const TOWN_RENDER_SCALE = 1;
```

The Canvas is enlarged with `image-rendering: pixelated`; sprites therefore need to work at their actual logical size, not only when viewed as a large source sheet.

### Existing sprite source and atlas

Files:

- `assets/ui/settlement/town-world-sprite-sheet-source-v1.png` — ImageGen source sheet.
- `assets/ui/settlement/town-world-sprite-sheet-alpha-v1.png` — chroma-removed intermediate.
- `assets/ui/settlement/town-world-sprite-atlas-v1.webp` — actual runtime atlas.

Runtime atlas size: **256×90, transparent WebP, 32-color palette, 4,270 bytes**.

Current crop contract:

```js
// Four building cells
sourceX = index * 64 + 4;
sourceY = 5;
sourceW = 56;
sourceH = 48;

// Eight person cells
sourceX = index * 32 + 8;
sourceY = 62;
sourceW = 16;
sourceH = 24;
```

Current rendered sizes:

```text
facility: 50×43 logical px
named person/player/recruit: 11×17 logical px
ambient crowd: 7×12 logical px
```

Facility cell mapping:

```text
0 = market / supply stall
1 = garage / repair workshop
2 = people / campfire-social shelter
3 = alley / utility-storage-research location
```

Person mapping:

```text
0 = player
1–2 = companion variants
7 = recruit emphasis
remaining cells = residents and moving crowd, selected by stable frame/index
```

Keep this contract for the first replacement pass. It is the lowest-risk way to improve the art without disturbing behavior. If a different atlas layout is genuinely necessary, update `townPixelAtlas()` explicitly and document every cell; do not hide arbitrary crops in unexplained numbers.

### Build embedding

`/Users/sang/caravan/tools/build-html.mjs` replaces `__TOWN_WORLD_SPRITE_ATLAS__` with the atlas data URI. If the runtime file changes to `v2`, update the one path in this builder and rebuild.

Important size constraint:

```text
current generated HTML: 38,993,435 bytes
hard maximum:           39,000,000 bytes
remaining headroom:          6,565 bytes
```

The current atlas is 4,270 bytes before base64. Replace it; do not embed a second large sheet. Keep the final atlas at roughly 4 KB and preferably no more than 4.5 KB. If a larger asset breaks the budget, reduce colors and optimize the WebP rather than raising the project maximum.

### Accepted outer UI

The accepted settlement UI is in:

- `/Users/sang/caravan/src/01-style.html`

The active block begins at the comment `settlement code world v4`. It uses these generated assets:

- `town-map-frame-v1.webp`
- `town-button-normal-v1.webp`
- `town-button-selected-v1.webp`
- `town-button-disabled-v1.webp`
- `town-icon-bezel-v1.webp`

Do not modify these unless a sprite is visibly escaping the map frame. The user has already approved this part.

## 6. The art task to execute now

Produce a `v2` sprite pass that is visibly better at actual in-game size while preserving the current proportions.

### A. Four facility sprites

Each facility needs an unmistakable silhouette and readable function without text:

1. **Market / supply stall**
   - patched canvas roof;
   - crates, sacks, jars, hanging goods, or a counter;
   - warm amber lamp/window pixels;
   - asymmetry and a believable entrance.
2. **Garage / repair workshop**
   - dark service opening;
   - tires, tool rack, work lamp, scrap or welding detail;
   - stronger industrial silhouette than the market;
   - readable doorway that faces the walkable road.
3. **Campfire / people shelter**
   - sheltered communal area rather than simply another house;
   - bench, fire bowl, seated silhouettes or supplies;
   - warm center with a darker enclosing roof or awning;
   - no large glow baked into the sprite; runtime ambience can animate it.
4. **Utility / storage / research site**
   - boxes, radio, shelves, instruments, generator, or records depending on the shared archetype;
   - visually distinct from the garage;
   - clear front-facing interaction point.

Requirements for all four:

- 3/4 top-down view compatible with the road plane;
- crisp pixel clusters with no anti-aliased fringe;
- transparent background;
- neutral material colors that accept the seven city palettes around them;
- warm light only in small, intentional pixels;
- no legible signage or generated pseudo-text;
- no identical rectangular house repeated four times;
- do not let roofs or props spill into neighboring atlas cells.

### B. Eight person sprites

The people must remain tiny but stop reading like sticks. Use silhouette, value grouping, and one or two role props rather than facial detail.

Across the eight cells, provide clearly different combinations of:

- cap, loose hair, head scarf, hood, or bare head;
- long coat, work jacket, vest, or layered travel clothes;
- backpack, satchel, tool roll, radio, wrench, or carried bundle;
- straight stance, walking stance, working stance, or turned 3/4 stance;
- dark neutral clothing with restrained rust, amber, blue-green, and olive accents.

The player cell should read as Daon without becoming oversized. Recruit and companion cells should be recognizable through clothing/prop differences, not neon outlines. Skin and clothing must remain consistent with the grounded Korean survivor references used elsewhere in the game.

At 11×17, check that:

- the head is not more than roughly one quarter of total height;
- legs are separated in at least the walking variants;
- backpack or tool pixels remain visible;
- the darkest outline does not swallow the whole torso;
- every person still reads against all seven city road palettes.

### C. Optional city identity only after the core v2 passes

Do not expand scope until the four-building/eight-person replacement works. If there is still room and no regression, add one or two **code-drawn** low-contrast props per city, not seven new embedded atlases:

| City | Existing identity | Suitable tiny props |
| --- | --- | --- |
| Gwangju | night market | stock pot, tarp, stacked bowls |
| Miryang | five-day market | noodle cart, water pump, produce crate |
| Daegu | dome market | barrier, scoreboard light, sports crate |
| Muju | tunnel settlement | ventilation fan, battery rack, candle |
| Jeonju | hanok market | low wall, jar, wooden bench |
| Daejeon | research settlement | terminal, cable bundle, archive box |
| Suwon | fortress settlement | stone marker, supply rack, brazier |

These props must remain subordinate to the four interactive facilities and must not block walking paths.

## 7. Recommended asset workflow

Do not overwrite `v1` before comparison.

Create:

```text
assets/ui/settlement/town-world-sprite-sheet-source-v2.png
assets/ui/settlement/town-world-sprite-sheet-alpha-v2.png
assets/ui/settlement/town-world-sprite-atlas-v2.webp
```

Recommended generation direction:

> Production-ready 16-bit top-down sprite sheet for a grounded Korean post-collapse road-survival game. Four distinct interactive settlement facilities—supply market, repair garage, communal campfire shelter, utility/archive workshop—and eight distinct Korean survivor sprites. Muted charcoal, weathered canvas, oxidized brown, olive and restrained amber light. Clear 3/4 top-down silhouettes, crisp pixel clusters, no anti-aliasing, no text, no logos, no copyrighted characters, no Pokémon copies. Every facility must have a readable front entrance and role-specific props. Every person must have a distinct hat/hair, coat, carried prop or walking pose. Subjects isolated on a flat chroma background with generous cell separation.

Then:

1. remove the chroma background cleanly;
2. crop subjects into the exact atlas cells;
3. scale only with nearest-neighbor;
4. quantize to 32 colors, or at most 48 if the file remains within budget;
5. inspect alpha edges at 400–800% zoom;
6. inspect the **actual 50×43 and 11×17 render**, not only the source sheet;
7. update the builder to embed `v2` only after comparison is visibly better.

Avoid a lazy downscale of detailed concept art. If details collapse at target size, manually simplify the clusters or regenerate specifically for the small dimensions.

## 8. Integration procedure

1. Put the optimized `v2` atlas in `assets/ui/settlement/`.
2. Change only the atlas path in `tools/build-html.mjs` from `v1` to `v2`.
3. Keep the `__TOWN_WORLD_SPRITE_ATLAS__` placeholder and existing `Image` loader.
4. Keep the procedural fallback in `townPixelFacility()` and `townPixelPerson()`.
5. If cell crops remain the same, avoid changing movement/render logic.
6. Run:

```bash
npm run build:html
node --check src/05-scene.js
git diff --check
```

The build must remain below 39,000,000 bytes. Check:

```bash
stat -f '%z %N' 서울까지400km.html
magick identify assets/ui/settlement/town-world-sprite-atlas-v2.webp
```

## 9. Required visual QA loop

Use Chrome because the current audit baseline was captured in Chrome.

Run the settlement capture:

```bash
python3 audits/settlement-story-overhaul-2026-08-17/capture.py
```

Then visually inspect at minimum:

- `after/320x578-miryang-walk.png`
- `after/390x844-daegu-walk.png`
- `after/390x844-daegu-garage-selected.png`
- `after/475x948-daejeon-walk.png`

Create and inspect a same-crop, side-by-side comparison of the old and new Daegu map region. Do not accept screenshots as proof by themselves: compare old and new in one image and judge the visible difference.

Repeat until all of these are true:

- each of the four facilities is identifiable without reading the bottom button label;
- buildings sit on the road plane and do not look pasted on;
- entrances face plausible walk-up points;
- no facility overlaps a person, selection corner, map edge, Caravan, or focus plate;
- people have distinct silhouettes at normal phone size;
- people are not comically large relative to doors;
- no sprite is blurry, stretched, clipped, haloed, or carrying chroma-green pixels;
- selected corners remain visible around the facility;
- the accepted outer UI is pixel-for-pixel unchanged in layout;
- switching selection does not resize or move the city stage or control dock;
- 320×578, 390×844, and 475×948 have no horizontal overflow or escaped controls;
- all seven cities still show four facilities and the expected residents/recruit;
- Chrome page errors remain zero.

Check `after/metrics.json`. It must report ten states and:

```text
errors: []
horizontalOverflow: false for every state
escaped: [] for every state
small: [] for every state
```

## 10. Required functional regression tests

Run all of these after the final visual pass:

```bash
python3 tests/test_settlement_story_overhaul.py
python3 tests/test_ui_coherence_overhaul.py
python3 tests/test_smoke.py
python3 tests/test_story_event_layout.py
python3 tests/test_event_typography_layout.py
git diff --check
```

Do not dismiss a failure as unrelated without examining it. The generated HTML is a tightly integrated single-file game.

## 11. Definition of done

The work is done only when:

1. the current accepted “after” interface is preserved;
2. houses/facilities and people are visibly more polished at real phone size;
3. the Canvas world remains interactive and animated;
4. all seven settlement states work;
5. visual comparison shows a clear improvement rather than merely a different style;
6. the HTML remains below the hard asset budget;
7. the required tests pass;
8. a final before/after comparison and the updated seven-city contact sheet are placed in:
   - `/Users/sang/Desktop/포켓몬식 타일 도시 최종/`
9. the implementation and QA notes are updated in:
   - `/Users/sang/caravan/docs/history/handoffs/design-qa.md`
   - `/Users/sang/caravan/audits/settlement-story-overhaul-2026-08-17/audit.md`

When reporting back, state exactly which source/atlas files changed, the final atlas size and color count, the generated HTML byte size, which viewports were inspected, and the test results. Do not claim completion based only on asset generation.
