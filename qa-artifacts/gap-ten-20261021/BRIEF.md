# 미검증 영역 집중 감사 — 2026-10-21

Sang 요청: 새 subagent 10명이 이전에 못 본 장소/실행하지 못한 기능을 직접 조사·실행하고 오류와 수정 후보를 기록한다. 이번에는 수집만 한다. 생산 소스, 기존 QA 기록, 생성 HTML, 실제 Studio 저장/화면/서버는 수정하지 않는다.

## 공통 절차

- 먼저 `/Users/sang/caravan/AGENTS.md`, `docs/DEVELOPMENT_GUARDRAILS.md`를 읽는다. 게임 디렉터가 사용하는 관련 분야 skill은 필요하면 `/Users/sang/island-game-director/.agents/skills/`에서 읽되 새 subagent는 만들지 않는다.
- 자기 `agentNN/` 아래 QA 코드·원시 로그·report.json·README.md만 작성한다. 파일 편집은 apply_patch로 한다. 실행 결과 파일은 프로그램 출력으로 남길 수 있다. 기존 실패/시도를 덮어쓰지 않는다.
- 무작위 첫인상 조사가 아니라 목표형 QA다. 관련 소스·과거 정책/테스트/기록을 읽고 재사용할 수 있으나 읽은 정보와 재사용 출처를 밝힌다. 자연 출발부터 공개 행동만으로 도달한 플레이, 이전 정상 저장에서 재개한 플레이, 인위적 fixture, 정적 분석을 구분한다.
- `harness.cjs`는 현행 실엔진 정책 러너다. schema는 `../expedition-thirty-20261021/SCHEMA.md`, 정책 예시는 그 폴더 참가자 하위 파일이다. 결과는 config.id 아래 저장된다. 공개 API 행동만으로 진행하며 미발견 장소·아이템·사람·플래그·무한자원 주입을 자연 플레이로 세지 않는다.
- 직접 경계 검사를 만들 때 `../ten-persona-repairs-20261020/setup.cjs`의 setup은 opening.completed를 설정하는 fixture라는 점을 밝힌다. 인위 상태는 fixture로 별도 기록한다. UI stub 엔진 검사와 브라우저 버튼 클릭은 다르다. 실제 사용자 live 화면은 손대지 않는다.
- 범위는 담당 타깃으로 제한한다. 타깃의 진입 → 선택/실행 → 결과 → 취소/돌아가기 → 저장/재개 → 다음 행동을 가능한 범위에서 검사한다. 조우가 뜨지 않은 것은 불가능하다는 증거가 아니다. 실패/정책 한계와 실제 게임 버그를 분리한다.
- 예상 소요가 길어지면 10분 안에 중간 발견/막힘/다음 검사를 root에 알린다. 무제한 재시도하지 말고 의미 있는 첫 시도와 대안, 필요시 명시한 fixture로 재현한다. 중요 원시 결과를 읽고 기록하며 아무 오류도 없으면 없다고 한다.

## report.json

최상위: agent, focus, methods, commands, coverage, findings, rejected, limitations, artifacts.
coverage에는 actualVisited/actualActions/endings 등 실제 확인한 것만 기록한다. 자연 플레이/재개/fixture 수를 분리한다.
findings 원소: id, severity(P1/P2/P3), title, kind(confirmed-bug/clarity/design-question/coverage-blocker), evidence(파일:행/로그 index), reproduction, expected, actual, recommendation, confidence. 의견을 확정 버그로 올리지 않는다. 실제 시각/음성/모바일 검수하지 않았으면 명시한다.

## 이전의 빈 영역

이전30명은 일반42곳 전부 방문했으나 숨은16곳 중3곳만 방문했다. 보존감시 엔딩, 실제 라디오 수리/제작/치료, 브라우저 취소/재개가 공백이었다. 이전 보고의 우선3문제는 아직 미수정으로 기록되어 있으나 현재 코드를 확인하고 중복 여부를 명시한다. 이번 제목을 전부 고침이나 모든 버그 발견으로 쓰지 않는다.
