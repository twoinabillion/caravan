# Caravan · 확장 가능한 픽셀 세계

## User goal and approval boundary

Sang activated this goal from `/Users/sang/.codex/attachments/43993046-1924-444b-b813-a04667cd61f0/pasted-text-1.txt`. That entire file is the governing requested outcome. The goal is an actual game-wide migration, not a prototype-only result. First show an integrated external-asset/custom-extension study, confirm its direction with Sang, then apply it across travel, settlements, camp, interior and events. This review boundary is explicit in the user's goal. Work needed to make that first review concrete is already authorized.

Current approved reference for atmosphere: `tools/design-drafts/pixel-journey.html`. Its code-native, muted green/blue world and restrained amber lights are a visual starting point, not yet a proven production pipeline. Existing cinematic originals and the user's active game/save remain intact. The new user goal supersedes the old cinematic-only policy for this migration; production policy files will be updated with the accepted target after first study review, rather than silently changing old assets now.

## Desired experience

The same world keeps living during a conversation. Short incidental dialogue appears near the speaker; deliberate story/choices expand below the same scene; long records retain a comfortable reading mode. Reading advances by user input. A character can stop work to face the player, then resume or finish based on the real action state. Cosmetic motion must never charge resources or advance game time.

## First reviewable result

A script-free, standalone Studio draft with a camp and a second location, both built on the same 240×144 logical grid. Keep the original Dalguji silhouette, Minji's ponytail/goggles/workwear, and human-scale proportions. Incorporate real imported CC0 assets and identify their origins outside the player experience. Add an original modular actor, an original tool/prop and an original work gesture absent from the source. Outfit, hair and held-tool variants must move using shared anchors/poses, not unrelated replacement illustrations. Two actors must be visible together with the background at actual mobile size.

Study controls live outside the game scene. Allow background, clothing, hair, tool, motion and dialogue state comparison. Ambient fire and work run without clicking. Important dialogue pauses the speaking worker's gesture while ambient fire continues; the final line ends that demo work state. Shared faces have focused, speaking and relaxed expressions selected by dialogue/action state and preserved through appearance swaps. The study's fictional example lines/state are not new canonical game text or real progress.

## Asset sourcing and ownership

- Research original creators and actual downloadable files, not just directory descriptions.
- Vendor only used assets plus needed editable source; record original URLs, author, license, hash, slicing rectangles and transformations.
- Prefer transparent sprites on an integer grid with understandable pixels/frames. Preserve unmodified originals; normalization is deterministic and reproducible locally.
- A pack is not a dependency on future creator updates: add a genuinely new member of the family and a new action using editable local definitions.
- Do not import a foreign engine/game merely to obtain a few sprites. Existing browser renderer and story/state owners remain authoritative.
- First candidates: Kenney Roguelike/RPG pack (CC0, 16×16 environment/furniture); krial 16×16 Animated Campfire (CC0, actual frames). Kenney modular characters and 0x72 DungeonTilesetII were researched, but their unmodified character proportions/fantasy costumes do not automatically fit the current visual target.

## Shared visual rules for the study

240×144 logical canvas, nearest-neighbor integer pixel clusters, common palette roles for near/far terrain, worn material midtones, skin, hair and amber lighting. Imported props are mapped to these roles while preserving their source silhouettes. Background/actor detail must read together at 320 CSS px. Sky/background can be quieter and lower contrast than actors, but may not use an unrelated rendering style. Scene-specific staging can vary without changing character identity, scale or anatomy.

## Production migration after direction review

1. Shared data-driven parts/poses/scene catalog with strict fallback and provenance. Keep original sources editable; provide authoring examples and validation of bounds, frame anchors and required states.
2. Read-only adapters from actual game state for location, clock, weather, roster, upgrades, current action and dialogue speaker/phase. No invented passenger, owned object or ongoing job.
3. Replace visual consumers across road, settlement, camp, home/interior, encounters, portraits and story presentation; preserve the existing narrative, choices, RNG, resource deltas, receipts, save migration and long record readers. No permanent loop implying finished work is still happening.
4. Preserve HD originals and propose optional archive/special-moment access separately; no automatic mixed-style interruption of normal pixel play.
5. Run source/save/story regression checks and actual gameplay QA on mobile and desktop, including departure→arrival→encounter→choice→result→reload, camp/interior ownership, reduced motion and long/large text.

## Evidence and completion

The first study must demonstrate actual imported pixels in rendered scenes, multiple real fire frames, stable tool/head/clothing alignment through poses, new content made from the shared definitions, dialogue transitions with readable controls, no horizontal overflow at 320/360/480/960 px, reduced-motion behavior and no game/save access. Source provenance and an offline reproducible build accompany it. This is a review milestone only. Full goal completion additionally requires all production migration items above and requirement-by-requirement runtime evidence.

## Open creative decision

Sang reviews the integrated study before its visual direction is applied game-wide. HD optional placement is a proposal, not a user decision. Do not mark the active goal complete at this boundary.

## Revision: character identity (user feedback, goal resumed)

Sang found the shared-body faces/clothes too similar to identify people. The goal was reactivated to address this; the old pending/blocked audit is superseded for this revision, not permission to adopt the old study unchanged.

Build `pixel-characters-v1`: use the six inspected canonical portraits in `assets/reference/portraits-canon/` as identity references; retain the accepted muted pixel world and real imported props/fire. Six named local profiles must share the renderer and material/animation rules but have different hair silhouettes, face/jaw geometry, shoulder/leg proportions, fixed accessories and signature gestures. Height/body proportions are readable art proposals, not new biographical canon.

Provide actual-size240×144 group staging and enlarged faces made from exactly the same head parts, plus names initially hidden, uniform clothing colors, hidden held props and silhouette-only comparisons. A walk mode and six individual activity gestures show identity in motion. Preserve identity details across common clothing/material swaps; head identity is not an interchangeable generic hair option for named characters. Reuse actual canonical camp dialogue text in a selected-speaker example, without game/save effects.

Keep definitions editable in `tools/pixel-workshop/characters.json` and generic rendering in `characters.py`; a new profile must not require an identity-specific code branch. Verify geometry, ground/hand anchors, motion/reduced motion, mobile/desktop legibility and selector behavior. Visual and shape-distinctness checks are not proof of human recognition: show the result for Sang's evaluation. Production migration remains part of the original full goal after direction confirmation.
