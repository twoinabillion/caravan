# HD Evidence and Button Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 단서를 읽을 수 있는 실물 기록으로 살리고 대화 버튼 글씨를 중앙에 맞춘다.

**Architecture:** 기존 event.inspection의 item.document를 순수 HTML로 그린다. showEvent/기존 reader tools가 동일 inspection 모드를 열며 새로운 상태 소유자는 만들지 않는다.

**Tech Stack:** Vanilla JS/CSS, existing Canvas/HD art, Node runner, Playwright.

**Spec:** docs/superpowers/specs/2026-11-07-hd-evidence-buttons-design.md

## Global Constraints
원문·선택 순서·엔진·효과·저장 키·RNG·자원/시간은 미변경. 새 이미지·의존성 없음. 사용자 화면을 강제 적용/새로고침하지 않는다. 이미 지불된 글·결과·커서는 기존 owner를 유지한다.

## Review Focus
- 기록은 entry에서 확인된 사실만 보여 주며 서명/완료/정정 결과를 선공개하지 않는다.
- 열기/탭/닫기/Escape/reload는 읽기 커서와 자원/시간을 유지한다.
- 단서 버튼 클릭이 그림 탭의 다음 읽기 또는 선택 결제를 실행하지 않는다.
- 긴 선택지/잠김 조건/큰 글씨에서도 중앙과 요구 조건이 겹치지 않는다.
- 360/390/desktop/short/reduced에서 자료와 다음/취소 버튼이 실제로 눌린다.

### Task 1: 직접 펼치는 기록
**Files:** src/03i-story-expansion.js, src/03k-main-evidence.js, src/07-ui.js(storyDocumentHtml/storyInspectionHtml/setStoryReaderMode/wireStoryTools), src/01-style.html(inspection owner), tests/test_evidence_documents.cjs.
**Interfaces:** inspection.items[].document={kind,title,source,rows:[{label,value,blank?}]}; storyDocumentHtml(document) returns escaped semantic article.
- [x] 현재 게임/자료 버튼·선택지 화면 baseline 캡처 및 Studio 별도 시안 등록.
- [x] 실제 data/renderer의 시간·빈칸·정정 요청·escape 테스트를 쓰고 RED 확인.
- [x] 3장면7자료를 기존 inspection에 연결한다. scene trigger는 실제 포인터 적중과 수동 cursor 보존을 확인한다.
- [x] GREEN 및 실제 자료 선택→닫기→선택→결과→reload 검증.

### Task 2: 버튼 정렬
**Files:** src/01-style.html(pages/materials/cinematic choice owner), tests/test_evidence_documents.cjs, qa-artifacts/hd-evidence-buttons-20261107/qa-*.py.
**Interfaces:** 기존 .choice/.choice-head/.choice-title 구조와 클릭을 유지한다.
- [x] 실제 버튼/텍스트 중심 차이와 현재 winning CSS를 측정한다.
- [x] 해당 소유 블록에서 주 문구 가로/세로 중앙을 정리하고 긴 문구·비용 줄은 가독성을 유지한다.
- [x] 6배치/큰 글씨/잠김 조건/키보드/리로드에서 시각과 실제 클릭 검증.

### Task 3: 검증과 기록
- [x] 한 명의 새 읽기 전용 리뷰로 이번 delta만 검토.
- [x] 전체 source suite, story/scene/reader 회귀, source-health, HTML/AIT 동일 alias 빌드. 보호 소스 해시 비교.
- [x] 실제 검수 범위/실패/남은 한계와 현재 checkpoint를 기록한다. 로컬 구현으로 끝내며 기존 미커밋 작업을 섞어 커밋/푸시하지 않는다.

최종 검증: qa-artifacts/hd-evidence-buttons-20261107/verification.json. 전체8654/8654, 문서16경로·최종선택지12조건·빠른키보드재열기8회, source-health/HTML/AIT 동일alias 통과.
