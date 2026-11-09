# Story continuity and deliberate memory entry

Goal: Keep the automatic default prologue, repair narrative joins, and let travel memories open deliberately. Present events announce a sensory cue before the existing stopped reader.

Spec: Sang asked to fix the story critique and confirmed only travel recollections should use a notice. Design prototype story-entry-v1 is registered in Studio and awaiting discussion. No game UI implementation before that approval.

Architecture: Existing presentation receipts own versions and paid results. New narrative editions delegate old/unmarked owners to old text. New prologue edition preserves the previous playlist for an active session cursor. Travel memories use their existing reader/effect owner; notification neither pays nor marks an event read. Present road events retain the four-beat canvas handoff.

Global constraints: Preserve current save and live screen at :4319; source-only edits; HD assets; no raster road cues; no new game process; no rewriting paid text or random/time costs from reading. Scope public work in the existing isolated worktree; main workspace has unrelated changes.

1. Port and verify the already authored narrative refinement: meaningful record order, family status, grounded core explanation/reactions, opening causality and optional closure. Run new behavioral tests red, then green; preserve legacy receipts.
2. Repair default history joins with existing living-grandfather and camper scenes; version the playlist so v1 cursors stay stable. Add and run prologue regressions red then green.
3. After draft approval, add persisted travel-memory entry notices and extend present-event cues through existing road handoff. Test defer/open/reload/exactly-once and urgent-event paths.
4. Run focused then full source/build checks. Fresh-context whole-branch review; fix substantive findings. Stage scoped files into the active preview without resetting it. Report actual browser coverage honestly.
5. Commit/publish scoped fixes through the existing GitHub Pages workflow, verify deployed hash/release and desktop URL, update checkpoint.

Review focus: legacy narrative editions and paid snapshots; memory queue ownership and companion/time truth; no false knowledge from notices; no current event stranded by deferral; reachable next action.
