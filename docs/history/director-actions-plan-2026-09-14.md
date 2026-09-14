# Caravan 행동·읽기 개선 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for task-by-task execution and checkpoints. This session already has Sang's instruction to plan and execute. Preserve the existing dirty checkout; do not commit unrelated work or create a new branch without need.

**Goal:** 목표 갱신이 출발을 가리지 않고, 메뉴의 읽기 설정과 선택 결과가 실제로 읽히는 빌드 전달.

**Architecture:** 기존 QuestLedgerUI가 알림 상태를 소유하고, 하단 목표 버튼이 발견 경로를 제공한다. UI 설정은 기존 localStorage 키와 applyUiPrefs를 사용한다. CSS는 기존 소유 블록에서 크기 토큰을 소비하며 게임 엔진은 변경하지 않는다.

**Tech Stack:** Vanilla JS/CSS, 단일 HTML 빌드, Python Playwright/pytest, AIT.

**Spec:** [설계와 판단 근거](director-actions-design-2026-09-14.md)

## Global Constraints

- 이야기·자원 규칙·저장 스키마는 바꾸지 않는다.
- 기존 사용자 수정과 개인 저장을 보존한다.
- 320×578, 390×844, 480×900 및 데스크톱을 확인한다.
- 외부 배포·push·기존 수정의 일괄 커밋은 하지 않는다.
- 백업: `/Users/sang/_workspace/caravan-actions-backup-20260914-Mfkr2a`.

## Task 1 — 목표 알림을 기존 진입점으로 통합

Files: `src/07d-ui-quests.js`, `src/01b-quest-style.html`, `src/01-style.html`; test `tests/test_director_actions.py`.

Consumes: `G.questLedgerSync()`, `G.questLedgerUpdates()`, `G.clearQuestLedgerUpdates()`, `QuestLedgerUI.open()/close()`.
Produces: `.has-quest-update` on existing goal button, `#quest-update-status[role=status]`, no floating ribbon. Native goal accessible name remains ‘목표’.

- [x] Write real state-change test: `G.questLedgerSync(); S.flags.first_order_trace=true; G.questLedgerSync()`; assert no visible overlay intersects `.nav-route-facts`/`.nav-depart-cta`, goal update marked, click opens relevant ledger without gameplay mutation, close returns focus.
- [x] Run `python3 -m pytest tests/test_director_actions.py -k quest -q`; retain expected pre-fix failure.
- [x] Replace ribbon creation with `button.classList.add('has-quest-update')` plus polite live status; acknowledge on open; use existing main/side tab. Remove obsolete ribbon-specific CSS rather than append a new override.
- [x] Run the same tests and existing `tests/test_quest_actions.py` against live4177.

## Task 2 — 실제 메뉴의 화면 편의 설정

Files: `src/02-dom.html`, `src/07-ui.js`, existing typography/menu blocks in `src/01-style.html`, `src/01b-quest-style.html`; same test file.

Consumes: `uiPrefs`, `applyUiPrefs()`, `renderSimpleMenu()`. Storage keys stay `caravan_ui_text` and `caravan_ui_motion`.
Produces: `#menu-text-toggle`, `#menu-motion-toggle`, reversible persisted preferences.

- [x] Add tests opening `#dk-menu`; assert each toggle exists and is ≥44px, toggling text/motion updates pressed state, persists after reload, does not alter resources.
- [x] Add a saved-large-pref test comparing rendered narration/dialogue/choice sizes against normal, scrolling actual choices into view at 320/390, and result containment.
- [x] Run `python3 -m pytest tests/test_director_actions.py -k 'preferences or large' -q`; expect missing menu control and unchanged rendered sizes.
- [x] Add controls inside display card. Reuse a shared `toggleUiPref(kind)` for old and current settings. In existing owner rules replace hard-coded typography with `var(--reading-body-size,15px)` / `var(--reading-choice-size,13px)` / `var(--reading-result-size,13px)`; only `.ui-large-text` defines 18px/17px/16px.
- [x] Run preference tests, typography gate, choice discovery and combat regression. Inspect normal and large captures. Do not force all choices into first viewport when text genuinely needs scrolling.

## Task 3 — 선택 결과 대비와 통합 검증

Files: outcome owner in `src/01-style.html`; same test file; audit/checkpoint docs.

Consumes: real `onboarding_first_road` choices and saved outcome. Produces story-paper-only semantic ink tokens; no reward-state changes.

- [x] Add a regression for readable outcome pills against an explicit conservative paper sample: compare linear RGB luminance ratio ≥4.5 for normal-size text. Capture actual textured output as a separate visual judgment.
- [x] Run `python3 -m pytest tests/test_director_actions.py -k reward -q`; record old-color failure.
- [x] Define story outcome foreground tokens `#174d49`, `#702f26`, `#603b0c`; consume them in existing reward selectors. Use opaque pale reward backgrounds on paper; keep combat fallback colors intact.
- [x] Run `npm run build`; run new tests, existing bag/navigation/chat/choice/road/quest tests, typography and combat scripts. Record all warnings without relabelling old campaign tests as new.
- [x] Review screenshots at 320/390/desktop, real five-choice opening to first drive, preference reload, and outcome reload without duplicate costs.
- [x] Run `node tools/verify-ait-web.mjs`, `npm run audit:portrait-build`, `git diff --check`; compare and copy HTML/AIT into `caravan-latest` only after tests pass. Preserve backup.
- [x] Move completed plan/design into `docs/history/`; update CURRENT, durable audit and Caravan director memory with exact evidence and limits.

## Completion — 2026-09-14

All three tasks completed. New regressions17 + existing UI39 + goal13 =69 passed on final code; typography18states and combat gate passed. Independent review findings (unread acknowledgement, opening thought owner) were reproduced and fixed. Source and delivery backups preserved; no commit/push/deployment. See `../../audits/director-actions-2026-09-14/README.md` for hashes, captures and limitations.

## Self-review

All three demonstrated problems map to tasks. No new tutorial, story edits, economy changes or save migration are required. Scope includes no physical-phone or participant result claim. The current menu, not the hidden legacy settings page, is the test entry point.
