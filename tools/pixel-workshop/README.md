# Caravan pixel workshop · review milestone

This is the first integrated extension study for Sang's active pixel-world goal. It is **not the production migration** and does not read/write game state, localStorage, cookies, time, resources or paid dialogue. All example dialogue/choices are illustrative. Production wiring waits for direction review, per the user's goal.

## Run and extend offline

```sh
python3 tools/pixel-workshop/build.py
# Open /tools/design-drafts/pixel-workshop.html on the existing preview server.
```

Build requires local Python/Pillow. Rendering requires no JavaScript, engine, CDN or network service. SVG and CSS are served locally; it also works in Studio's script-free design iframe. Do not run a foreign game or installer to obtain these assets.

## One shared visual system

- `style.json`: 240×144 logical world, one-pixel clusters, common material colors, nearest-neighbor presentation, shared feet/head/wrist conventions.
- `catalog.json`: exact source rectangles, frame strides and color→material-role mappings. Unmapped colors and out-of-bounds rectangles fail the build. Imports preserve source pixel shapes; originals are never overwritten.
- `actors.json`: editable heads, tools, original props, appearances and named idle/walk/work frames. Each frame supplies the same body, head and hand anchors for all variants. Add a head/tool as one set of rectangles, not a new complete character animation.
- `world.py`: editable world/vehicle seed extracted from the liked pixel journey study. It only defines local SVG parts; it has no import-time output or game access.
- `build.py`: deterministic catalog/actor composition and script-free draft registration. `../design-drafts/pixel-workshop.css` is the single owner of scene, appearance and dialogue state styling.

Examples of extension in this study: the ponytail/goggles Minji, a new noncanonical character with three heads/two coats/two tools and three shared poses, a new portable work lamp/wrench and kettle, original work frames, two environment layouts, focused/speaking/relaxed expressions. None of these new actor gestures/props are copied from the external packs. The external pine/bench/crate/barrel and the four actual campfire frames are present in the same composed scene.

For a new held object, add `tools.<id>` rectangles around `[0,0]` in `actors.json`; existing frame hands locate it. For a new head, add `heads.<id>` around the shared head anchor. For a new animation, add four frame records with head/body/legs/hand geometry; all compatible appearances/tools reuse it. The current study demonstrates these small human proportions; different body plans and special actions require additional authored frames. It does not prove arbitrary animation automation.

## Sources and adoption decisions

See `vendor/provenance.json` for author URLs, license URLs, download locations, Git blob/hash, original SHA256 and transformations.

- **Kenney Roguelike/RPG pack**, [original creator](https://kenney.nl/assets/roguelike-rpg-pack), CC0-1.0. Used pine, bench, crate and barrel; exact rectangles in `catalog.json`. The official archive returned403 in this environment; the sheet was retrieved through GitHub's authenticated read tool from `superdevgit/MobileRPG`, whose README explicitly credits this pack. The source blob is pinned. No mirrored Unity code or other images were imported.
- **krial · 16x16 Animated Campfire**, [creator entry](https://opengameart.org/content/16x16-animated-campfire), CC0-1.0. Used the original four-frame sheet. Its native palette is adapted through explicit local material roles.
- **Kenney Roguelike Characters** researched: editable modular construction is useful, but its short 16px proportions were not adopted for named Caravan actors.
- **0x72 DungeonTileset II** researched: actual animated frames and CC0 allow extension; its fantasy-character silhouettes are not the selected Caravan actor baseline.
- Higher-resolution smooth fire effects were rejected for this study because downsampling would lose the intended common pixel grammar.

The licenses above apply to the original source assets, not an assertion about unrelated code in their download hosts. CC0 permits copying/adapting; author credits are retained as provenance. Original HD game assets remain intact. Runtime always uses local assets; author-site availability affects neither existing visuals nor new content authoring.

## Review and remaining goal

Compare source assets, custom characters, tools and background at actual mobile size. Appearance swaps should preserve stance, hand attachments and expression. Important dialogue stops work and changes face while fire continues; an explicit final choice ends that demo task. Reduced motion presents one stable frame. Actual save/state/weather/roster/action integration and every gameplay surface remain in milestone2; see `docs/superpowers/plans/2026-11-06-extensible-pixel-world.md`.
