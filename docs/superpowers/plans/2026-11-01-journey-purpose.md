# Journey purpose Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, with one final review.

**Goal:** Make the whole journey communicate place identity, route purpose and recruitment progress accurately.
**Architecture:** Reuse authored short previews and the existing quest planner; share recruitment-stage wording between journal and route guidance. No new modal, save version or resource transaction.
**Tech Stack:** Existing vanilla JS, Node VM regression tests and Playwright.
**Spec:** Sang's request to review and fix the experience in a batch, including the first20-purpose-v1 draft already shown and discussed.

## Constraints
Preserve user's loaded scene/save and old paid readers. No forced refresh or publish. Previews <=30 characters; no reward, stock or safety promises. Route cues distinguish the next edge from the ultimate target. No hidden-place disclosure before discovery. Existing story and callback intervals remain intact.

## Tasks
- [x] Add failing tests for all58 place previews, opening completion and six companions through task/road/follow/ready and reload.
- [x] Author58 short factual previews; connect actual route purpose in the existing preview row and picker. Correct intermediate-arrival wording.
- [x] Share stage-correct recruitment guidance; never direct road-stage guests back to completed task locations. Retain real night and joining conditions.
- [x] Review existing moving-home feedback and event pacing; change only demonstrated issues, record what remains a human playtest question.
- [x] Build, run source regressions, representative UI/crop/cancel/reload checks and a final independent review; update checkpoint.

## Review focus
Known vs hidden graph, corridor commitments, old paid receipts, next-day follow-up, 320px/large text and urgent warnings. Full graph state matrices are not full human playthroughs.

## Execution ledger

All14 new purpose tests observed red/green, then legacy task wording retained to preserve unrelated existing guidance contracts. Final reviewer found and rechecked3 state-boundary cases; no remaining must-fix. UI matrices348 states plus both release waypoints, actual finite opening route, saved-choice callbacks, save migrations and determinism checked. No mechanics tuning without a demonstrated experience defect. Final full-source result recorded in docs/journey-purpose-review-2026-11-01.md; source hashes remain frozen. No commit/push requested for this batch.
