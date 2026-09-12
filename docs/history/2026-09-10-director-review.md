# Director review delivery — 2026-09-10

User objective: improve Caravan visuals, conversations, logic and story using Game Director and Obsidian references. Delivered as local build `2026-09-10-director-review` in the existing worktree, preserving user changes. No commit or publication.

- [x] Read project/director canon and Obsidian story, dialogue, city and QA references; distinguish historical deadlines from current source.
- [x] Inspect the currently open generational-speech scene and extract story/recruitment speaker assignments. Reproduce and fix seven speaker checks.
- [x] Review six companions' meet/task/follow/join text, including dynamic text and choice outcomes; fix physical continuity and action/reward contradictions.
- [x] Preserve the prior arrival/combat implementation and verify its persistence, intent/requirements, scrolling and handoff behavior.
- [x] Capture all seven city hubs at two phone sizes. Reproduce twelve clipped day/night states; fix shared structure and verify all 28 states.
- [x] Check first-meeting retries in the actual city map and people list. Reproduce disappearance for all six candidates and verify visibility, reopening, active-quest and joined exclusions.
- [x] Inspect affected story crops and choices/results; generate correct cast and rescue art with references, gallery review and mobile review. Preserve the neutral walker art from the preceding pass.
- [x] Verify the opening golden route, parent-tracking graph, companion routes, and prepared-state Seoul gate/5 stops/epilogue for all three final dispositions. This is component/path coverage, not a single unmodified human campaign.
- [x] Repair simulation instrumentation, record the 24-run result, and preserve seven remaining pacing gate findings without changing balance to satisfy a bot.
- [x] Run 16 distinct relevant regression suites, repeat the five affected final suites, run content/portrait checks, build HTML/AIT aliases and record hashes.
- [x] Update the final audit, source current-state document, Obsidian project hub/review note and Director memory.

Evidence: [director audit](../../audits/director-review-2026-09-10/README.md). The initial exploratory checklist is preserved in `artifacts/director-review-2026-09-10/initial-review-plan.md`.

Further full-game certification would need a same-save human campaign, every event branch and every facility's long/empty/locked state, plus an informed complete-story pacing policy. These are explicitly unverified; this delivery does not claim the entire game is defect-free or that its balance gate is green.
