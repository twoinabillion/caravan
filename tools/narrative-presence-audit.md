# Narrative presence follow-up — 2026-09-27

Sang's criterion: keep A's action when A is physically present; do not imply A or an anonymous interlocutor when nobody is there. This is not a request to erase companions, introduced NPCs, reminiscence, or intentional uncertainty.

## Changes

- `D.mealBanter`: retain the Bori line behind `need.dog`; one shared selector serves breakfast and lunch. Other meal prose is unchanged.
- Ambient window drawings: explicitly authored Minji/Leo actions gated by the corresponding companion. Tunnel breath belongs to the driver; contagious yawning requires a companion.
- Park/Jaeyi chat and fuel-detour conflict: remove a hardcoded six-person roster without restricting the existing encounter.
- `find_bori_nose`: Leo reaction remains when he is present; otherwise only Bori reacts.
- `ai_drone`, `vg_rainbow`, `vg_fisherman`, `vg_reflectors`, `loc_cablecar`, `wx_ghostlight`, `wx_struck_tree`, `vg_tunnelfan`: replace ungated back-and-forth with driver observations/thoughts. The real oncoming truck remains in its separate outcome.
- `meet_kids_toll`: driver tells the story to the already introduced children; remove literal “if Bori exists” narration and an implied group response.
- `wx_frogs`: keep the dog-gated Bori action, remove the ungated human debate, match its saved note.
- `wx_dustart`: driver draws on the exterior side window after stopping, rather than a phantom passenger drawing through the windshield.
- `camp_thief`: driver hears and sees the introduced intruder, without a second passenger replying. `camp_scan`: detects heat without assuming several people.
- `story_bridge_last_quiet`: preserve accompanied version; author a solo version.

Sixteen revised encounters retain their entry gates, choice labels, probabilities, effect values, flags and chains. A hash regression covers those non-prose fields. Changed dynamic text is resolved once into the existing presentation receipt, not recalculated on resume. Old receipts remain history rather than being rewritten for today's party.

## Verification

- `node --test tools/test-narrative-presence.cjs tests/test_narrative_context.cjs`: 12 passed, including 64 rosters × dog present/absent; both meal entry points; Bori without Leo; real NPC retention; receipt replay and next event.
- `node tests/test_cohesion_reader.cjs`: 14 passed.
- JavaScript syntax and `git diff --check`: passed.
- `npm run build:html --silent`: passed; dialogue/content references and visual asset contract checks passed. 79,999,956 bytes, unchanged 80 MB ceiling. Only redundant developer comment headings in affected narrative sections were shortened to accommodate the patch; no raster asset, build-limit, or UI style change.

## Live boundary

Before and after: active Studio 4317 / preview 4318, `ev_broadcast_station`, event/beat, DAY2 minute568.106, muju→jeonju distance39.60245518666704/55, party[], dogfalse, viewport360×728. After at01:29UTC: loaded/style1790468017021, pending1790472528790. No badge click, scene advance, save mutation or manual refresh.

The new build is staged, not applied. No current-screen screenshot or visual/readability QA was obtained; VM checks are not evidence of in-game appearance. This sweep fixes the confirmed cases above, not a claim that every possible narrative branch is now error-free. Previously generated replacement scene art remains a separate, unapproved draft.
