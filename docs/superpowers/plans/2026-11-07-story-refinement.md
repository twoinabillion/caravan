# Story refinement implementation plan

Use superpowers:executing-plans inline. Sang approved the four editorial findings with “그럼 어서 해”. Preserve dirty checkout and existing HD/mobile UI. No approval repetition, reset, commit, push or deploy.

**Goal:** Give the family-order revelation a human response, seed the AI's external-authority limit before its final explanation, shorten procedural recaps, and let the player finish the main story before choosing the upper-network afterword.

**Architecture:** New authored03o module loaded after03m captures legacy presentation and provides explicitly versioned entry/outcome turns. Existing ordinary presentation receipt gains an optional validated narrativeRevision; absent revision keeps existing active entries/paid flow. All old saved views/text and choice indices/effects win. New paid-night flag routes only new-edition journeys to one no-cost choice scene: main return/ending or clearly labeled optional existing afterword. Existing ending result/archival deferral is generalized narrowly to the new closing choice.

**Scope/files:** src/03o-story-refinement.js; tools/build-html.mjs; tools/content-registry.cjs; minimal src/04h-engine-presentation.js receipt/ending bridge. Existing03k/03m, UI, art and original outcomes stay unchanged. Tests pin content edition, known/unknown revelation, core authority/cast, actual optional chains and historical receipts. Explicitly validate new event metadata/FX in story-review-contract.cjs rather than replacing corpus hashes.

**Review focus:** Existing unmarked night must still go to its original afterword; new final payment must be archived once but remain readable after reload; late/unknown family knowledge must not fabricate a first revelation; solo/transfer/sleep/watch and optional afterword must preserve the chosen outcome; source paper anchors/entry proof and all historical paid words remain intact.

- [x] Archive baseline and record concrete editorial samples/flow before implementation. User already approved this scope; existing choice UI is reused without visual redesign.
- [x] RED focused tests for revised voices/authority seed and old/new presentation ownership. Add03o and revision carry through begin/validate/payment.
- [x] RED main/optional-afterword flow and paid reload tests. Add one explicit choice scene, new-night routing flag and narrow deferred-ending owner. Keep old paid routes and all original choices/effects.
- [x] Read revised scenes as connected prose and verify actual mobile reader routes, source documents, optional choice/cancel/return, three endings/solo and result reload with isolated saves. Report fixture scope honestly.
- [x] One fresh read-only final reviewer; resolve Important findings with RED→GREEN. Run appropriate regression/full suite and build, preserve unchanged sources/authored mechanics via explicit projection, checkpoint and show revised samples. Report actual findings/paths rather than test-count-as-quality.
