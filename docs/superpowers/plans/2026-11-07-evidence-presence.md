# Evidence Presence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 본문에서 사물을 발견할 때 그 모습과 실제 적힌 내용을 자동으로 보여 준다.

**Architecture:** 순수 EvidenceScenes가 명시적12장면의 anchor/proof와 실제 페이지 범위로 현재 사물을 결정한다. 기존 scene frame에 표시하고, 누르면 기존 inspection으로 연결한다. 새로운 게임 상태/결제/언어는 만들지 않는다.

**Tech Stack:** 기존 Vanilla JS/CSS/HTML builder, StoryPages, Node tests, Playwright.

**Spec:** docs/superpowers/specs/2026-11-07-evidence-presence-design.md

## Global Constraints
고화질 풍경·얼굴·차량, 원문·선택·효과·게임 시간·RNG·save key·paid receipt·paginator 원본을 보존한다. 새 이미지/의존성 없음. 사용자 화면에 강제 apply/refresh/reset하지 않는다. 구형 회상/paid 결과에 현재 사실을 합성하지 않는다.

## Review Focus
- 현재 페이지가 아직 발견 문장에 도달하지 않았거나 이전 페이지로 돌아가면 사물이 먼저 보이지 않는다.
- 초반 이송표→어린 시절 회상→현재 민원 단말에서 시간/물건이 섞이지 않는다.
- 출처 사본과 원본, 요청과 완료를 구별하며 unknown identifiers를 생성하지 않는다.
- 사물 클릭이 본문 넘기기/선택 결제로 새지 않고 기존 확대/닫기/키보드가 작동한다.
- 작은 화면/큰 글씨/모션 감소에서도 frame 높이가 변하지 않고, 전체 자료와 다음 행동이 실제로 눌린다.

### Task 1: 사물과 읽는 대목 판정
**Files:** new src/07i-evidence-scenes.js, new tests/test_evidence_presence.cjs, tools/build-html.mjs.
**Interfaces:** inspection(event)->existing or registry inspection; current(state, narrativeTime)->{item, count, key}|null; previewHtml(cue)->escaped span markup. state consumes frozen turns and actual readingPage.cursor/_page.end, never a synthetic clock.
- [x] 독립 초안을 등록하고 기존 UI/소스를 보존한다.
- [x] actual-page/anchor/proof/옛원문/회상/후일담/결과/escape/data purity RED tests.
- [x] 12장면의 명시적 자료와 표시 구간을 구현하고 builder가 UI보다 앞서 포함하도록 한다.
- [x] 대상 GREEN, 전체 authored D가 이전과 그대로인지 비교한다.

### Task 2: 장면 안의 물건
**Files:** src/07-ui.js (inspection wiring/renderPagedStory final pass), src/01-style.html(existing evidence owner), current page test fixture dependencies where necessary.
**Interfaces:** Task1's EvidenceScenes; 기존 setStoryReaderMode/storyInspectionHtml/scene zoom controls.
- [x] 자동 등장·이전·회상 숨김·그림 확대·사물 누르기·커서보존 회귀를 RED로 확인한다.
- [x] 같은 frame 높이에서 사물을 합성한다. 같은 물건의 node/focus를 유지하고 짧은 화면용 명시적 표시를 둔다.
- [x] actual tap/Enter/Space/Escape/reload/결제1회를 verify한다. 기존 선택지 중앙·정비/야영 흐름을 보존한다.

### Task 3: 최종 검수와 체크포인트
- [x] 한 명의 새 읽기 전용 reviewer가 이번 delta만 검토한다.
- [x] 실제6화면조건에서 원문 대목→사물→대화복귀와 초반 회상 전환·기존 paid reader 유지 확인.
- [x] 동결한 최종 소스로 full suite,source-health,HTML/AIT 동일aliases,보호소스·authored data 해시 확인.
- [x] 실패/실제 관찰 범위/한계와 계획·현재 checkpoint를 남긴다. 기존 미커밋 작업과 섞어 커밋/푸시하지 않는다.

Final:8662/8662; actual19fixture paths/3zoom-resize/4paid/6settled captures. All production sources frozen. Deferred minor: companion command variant outside12event coverage. See qa-artifacts/evidence-presence-20261107/verification.json.
