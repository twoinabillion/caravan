# HD Action Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 고화질 차량·인물·풍경을 유지하며 정비/야영 결과와 다음 행동을 읽기 쉽게 한다.

**Architecture:** 기존 UI 소유 함수와 CSS 블록을 수정한다. 프리뷰와 완료 표시만 UI가 소유하고 모든 결제·시간·저장은 기존 G 함수에 둔다.

**Tech Stack:** Vanilla JavaScript, CSS, Canvas, Node test runner, Python Playwright.

**Spec:** docs/superpowers/specs/2026-11-07-hd-action-flow-design.md

## Global Constraints
- 전체 픽셀 전환을 다시 하지 않는다. 새 엔진·의존성·저장 키·생성 이미지는 도입하지 않는다.
- 미리보기·탭·결과 닫기·작업 기록 열기는 무료다. 원문·RNG·밸런스·paid reader를 보존한다.
- 사용자의 연결된 화면을 강제 새로고침하지 않는다. 실제 사용자 장면과 QA 픽스처를 구분한다.

## Review Focus
- 소수 내구와 상한 근처 수리는 실제 사후-사전 값으로 표시한다.
- 잠긴/보유 부품과 취소된 프리뷰는 보유 상태와 RNG를 변경하지 않는다.
- 완료 화면의 키보드 닫기/포커스는 숨은 구매나 배경 조작을 유발하지 않는다.
- 야영 준비 상태는 reload 후에도 이미 소비한 물자를 다시 소비하지 않는다.
- 짧은 화면/큰 글씨에서 그림 때문에 버튼이 잘리거나 비용이 숨지 않는다.

### Task 1: 정비 선택과 완료
**Files:** src/07-ui.js (renderGarage, playUpgradeInstall), src/01-style.html (field-board/upgrade owners), tests/test_hd_action_flow.cjs.
**Interfaces:** 기존 G.canBuyUp/G.buyUpgrade/G.settlementRepair를 소비한다. UI의 garageRepairResult 세션 값과 renderGarage의 프리뷰를 생산한다.
- [x] 실제 UI 함수를 VM에서 호출하는 회귀 테스트를 쓰고 RED 확인: 장착 완료 버튼 즉시 사용 가능, 프리뷰/탭은 결제 없음, 수리의 capped delta.
- [x] playUpgradeInstall의 사후 세 번 작업 클릭을 선택형 작업 기록으로 바꾼다. 완료 버튼·포커스·닫기 경로를 유지한다.
- [x] renderGarage에 가능한 부품의 외형 미리보기와 잠김 이유/분야별 가능 수를 추가한다. 실제 수리 전후를 결과 내역으로 보여 준다.
- [x] 대상 테스트 GREEN과 실제 모바일 정비/개조/취소/재진입/저장을 확인한다.

### Task 2: 야영 준비 피드백
**Files:** src/07-ui.js (campPreparationState, showCampHub), src/01-style.html (camp owner), tests/test_hd_action_flow.cjs.
**Interfaces:** 기존 plan 및 G.hasResource를 읽는다. campPreparationState(kind, plan)는 {done, enabled, reason}을 반환한다.
- [x] 자원 없음/충분/완료/만차체/무한 물자에 대한 RED 테스트를 쓴다. UI 렌더링이 S를 바꾸지 않음을 검사한다.
- [x] 실제 준비 상태를 그림 밑 텍스트와 완료/취침 후 표시로 연결한다. 불가 이유는 클릭 전에 보이게 한다.
- [x] 대상 GREEN 후 준비→대화→선택→결과→reload에서 중복 소모 없음과 수동 읽기를 확인한다.

### Task 3: 검수와 인계
**Files:** tools/design-drafts/hd-action-flow.{html,css}, manifest.json, qa-artifacts/hd-action-flow-20261107/, docs/CURRENT.md.
**Interfaces:** Task1/2의 실제 UI와 기존 빌더를 소비한다. 독립 시안과 검증 보고서를 생산한다.
- [x] Studio 디자인 초안에 구현 방향을 별도 등록한다. 실제 세이브와 연결하지 않는다. 기존 사용자 실행 지시로 이번 범위를 구현한다.
- [x] 실제 브라우저 360/390/desktop/short/large/reduced에서 선택·완료·뒤로·다음 행동·reload를 확인한다.
- [x] 전체 소스 테스트, HTML/AIT 빌드, 기존 headlight/living/reader 회귀를 실행한다. 현재 작업 전 소스와 protected owners 해시를 비교한다.
- [x] 한 명의 새 검토자에게 이번 변경만 검토받고 필요한 수정 후 증거와 체크포인트를 남긴다.

## Progress
Task별 완료와 검증은 qa-artifacts/hd-action-flow-20261107/ledger.md에 보존한다. 기존 미커밋 작업과 섞이는 커밋/푸시는 이번 범위에서 하지 않는다.

최종 완료: qa-artifacts/hd-action-flow-20261107/verification.json. 전체8649/8649, 실제6배치/중복결제·reload·짧은화면포인터, HD민지대화15분·재접속, HTML/AIT검증 통과.
