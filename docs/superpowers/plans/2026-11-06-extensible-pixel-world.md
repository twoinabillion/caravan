# Extensible Pixel World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for production work. The current first milestone is an explicitly requested standalone study; use the brainstorming spike workflow with minimal checks and direct render QA.

**Goal:** Transition Caravan to a cohesive, extensible pixel world using reusable licensed assets plus local custom content, preserving the existing game and saves.

**Architecture:** An editable local catalog supplies normalized sprites, actor parts/poses and scene layers. Presentation reads existing state; it never owns gameplay effects. A standalone script-free study proves extension and visual cohesion before production wiring.

**Tech Stack:** Existing browser game, Python authoring/build tools, SVG/CSS study, local CC0 source sprites; no new engine or remote runtime service.

**Spec:** `docs/superpowers/specs/2026-11-06-extensible-pixel-world-design.md` and the full user attachment named there.

## Global Constraints

- First show the integrated study and confirm direction, then migrate the real game.
- Preserve story/choice effects/resources/progress/saves and all high-resolution original files.
- Use one 240×144 logical grid and common material palette in the study.
- No generated HTML hand edits, no automatic changes to the user's active scene/save.
- The goal remains active until production migration and full validation are complete.
- No commit, push or public deployment is needed for this review milestone.

## Review Focus

- Tool swaps during work/walk must remain attached to hands, including reduced motion.
- Variant heads/clothes must share the same pose/ground baseline rather than jumping in size.
- Dialogue must stop the speaking worker while unrelated ambient motion continues.
- Imported props must have matching grid/palette/light and legible silhouettes at 320px.
- All next/back/choice controls remain readable with long text and on short viewports.

## Milestone 1 — integrated extension study (authorized now)

### Task 1: Provenance and editable import catalog

Files: `tools/pixel-workshop/vendor/`, `tools/pixel-workshop/catalog.json`, `tools/pixel-workshop/style.json`, `tools/pixel-workshop/build.py`.

- [x] Verify original author/license and inspect downloaded sources at nearest-neighbor scale.
- [x] Record source hashes, selected rectangles, exact palette mapping and rejected candidate reasons.
- [x] Build selected source sprites into local SVG frames; rerun without network and verify deterministic output.

### Task 2: Shared actors and composed scene

Files: `tools/pixel-workshop/actors.json`, `tools/pixel-workshop/world.py`, `tools/design-drafts/pixel-workshop.html`, `tools/design-drafts/pixel-workshop.css`.

Interface: `build.py` reads JSON definitions and writes one script-free HTML/CSS study; generated scene uses the same named head/body/tool anchors for all appearance variants and poses.

- [x] Assemble Minji and a new demonstration actor in the same world, preserving canonical identifiers.
- [x] Provide outfit/hair/tool and idle/walk/work comparisons from shared local definitions; add an original tool/prop/action.
- [x] Provide two environments from the same grid/palette and existing asset family.
- [x] Show focused/speaking/relaxed faces changing with dialogue/action state and surviving appearance swaps (builder-check finding).
- [x] Add incidental bubble→important lower dialogue→choice→explicit work completion states, with no automatic reading progression.
- [x] Register the draft in `tools/design-drafts/manifest.json`; keep all controls/production provenance outside player-facing art.

### Task 3: Review evidence

Files: `tools/qa-pixel-workshop.py`, `qa-artifacts/pixel-workshop-20261106/`, project checkpoint/memory.

- [x] Render mobile/desktop, inspect actual captures, exercise all appearance/tool/action/background/dialogue controls.
- [x] Check hand/ground anchors, imported frame animation, work pause/completion, reduced motion and 320/360/480/960 layouts.
- [x] Confirm no script/storage/network dependency in the draft; deterministic offline rebuild; source originals unchanged.
- [x] Independent read-only review of source/provenance/QA coverage; fix material findings and recheck affected behavior.
- [x] Show Sang the concrete integrated study and request the explicit direction review. Response pending; production migration is gated.

## Milestone 2 — actual game migration (after direction review)

### Revision before migration: six recognizable companions (goal resumed)

- [ ] Inspect all six canonical portraits and record identity anchors, distinguishing source traits from proposed body proportions.
- [ ] Build editable six-profile heads/bodies/signature props/gestures with shared renderer, same palette/pixel world and existing imported assets.
- [ ] Register `pixel-characters-v1`: actual-size group, same-source enlarged faces, names hidden, uniform coats, hidden props, silhouette-only and walk/activity comparisons, actual canonical dialogue example.
- [ ] Verify rendered mobile/desktop states, fixed face/head identity, ground/tool attachment, animation/pause/reduced motion and data-only extension; inspect actual captures and review material issues.
- [ ] Show revised character direction; do not treat prior similar-character study as approved or call the full migration complete.

- [ ] Inventory every visual consumer and actual state owner in `src/`; update accepted art policy without rewriting canonical story/paid receipts.
- [ ] Detail shared renderer/state adapters and focused behavioral tests before production changes.
- [ ] Implement road/vehicle/weather/upgrade/roster rendering and actual settlement profiles.
- [ ] Implement camp/interior/encounter/reader visuals and state-driven dialogue/action timing.
- [ ] Preserve long records and optional HD original access; verify ownership, no unintroduced actors, and full fallback coverage.
- [ ] Run complete source/build checks plus meaningful mobile/desktop actual gameplay/save/reload QA.
- [ ] Audit every user requirement against actual current evidence before goal completion.

## Session ledger

2026-11-06: goal attachment read. Existing worktree contains earlier living-encounter changes and prototypes; retain them. No production migration authorized before integrated study direction review. Official Kenney ZIP downloads returned403; use a public GitHub mirror of the creator-identified CC0 sheet with exact blob hash instead. Original krial campfire obtained from creator's OpenGameArt entry. No source code from the mirrored Unity game is used.

2026-11-06 milestone1 evidence: `qa-artifacts/pixel-workshop-20261106/verification.json`, `studio-verification.json`, source originals/provenance.36 existing appearance/tool/pose combinations, four fire/work frames,8 width/environment cases, dialogue/choice/cancel/completion, reduced motion, no page errors or external runtime requests. Independent review found hardcoded extension controls and a lamp hiding all finger pixels. Both reproduced as2 failing tests in `tools/test_pixel_workshop.py`, fixed, then2/2 passed. Actual Chromium fixture additionally adds an unknown head/tool/coat/pose from data, proves only the selected parts render, and retains speaking expression. No deferred review findings.

Production inventory prepared in `docs/superpowers/specs/2026-11-06-pixel-production-inventory.md`:58 locations,7 settlements,6 companions,17 NPCs,28 upgrades,1044 static permanent event definitions. No production change is credited from this inventory. User asked for visual direction review through the pending async question; goal remains active.

2026-11-06 후속 준비: 시안 방향 응답은 아직 없음. 전체 게임에 화풍을 적용하지 않고 실제 상태 계약을 검증했다. `tools/audit-pixel-state-contract.cjs`는 현재 엔진/공개 HOME API를 별도 VM/store에서 실행한다.320동료/손님 조건·64소유물 조합, 식사 즉시 소비와 정비 취침회복 예약, 대화20회읽기 무효과·15분선택/paid reload재지급0·지난밤대화만료 등8계약 확인. HOME.objects는 private이므로 미래 adapter에서 공개 API인 것처럼 호출하지 않는다. 기존 야영/집/읽기 회귀13/13도 통과. 근거 `qa-artifacts/pixel-workshop-20261106/state-contract.json`, 제작 표면 목록의 Actual state baseline 절. 통합 시안 소스 해시 불변. 실게임 renderer/state연결 완료가 아니며 Goal active/사용자 방향 검토 대기.

2026-11-06 방향검토 대기 확정: 동일한 시안 확정 단계가3차례 Goal턴에서 계속 확인됐고, 독립 준비(시안/확장검증/실제상태계약/회귀/전체표면목록)는 끝났다. 사용자 응답 없이 실제 게임 화풍 적용을 진행할 수 없어 Goal 상태를 도구로 **blocked**로 전환했다. 일시정지(paused)나 완료가 아니다. 근거 `qa-artifacts/pixel-workshop-20261106/direction-review-gate.json`. 정적 미리보기4386 프로세스 동작/시안 소스 해시 불변 재확인. 사용자 방향 승인 또는 수정 지시가 오면 해당 판단으로 재개하며 전체 전환 범위를 보존한다.
