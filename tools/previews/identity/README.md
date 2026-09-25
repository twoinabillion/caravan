# 동료 화면의 격리된 표시 검증

원본에서 `npm run build:html` 뒤 `node tools/previews/identity/serve.mjs`를 실행한다.
`http://localhost:4180/crew`는 기존 개발 저장의 세 동료,
`http://localhost:4180/full`은 여섯 동료·보리·부상을 구성한 표시 fixture다.

서버는 127.0.0.1에만 바인딩하고 두 경로만 제공한다. LIVE 4176의 저장을 읽거나 쓰지 않는다.
테스트 여정은 새로 열 때 fixture로 재설정되므로 실제 진행 전달용으로 쓰지 않는다.
기준 저장은 `artifacts/director-pass-2026-09-11/crew-preliminary.save.json`이다.
이는 UI 표시와 조작 검사이며 해당 상태를 이번에 플레이로 획득했다는 증거가 아니다.

구현·검증·그림 출처: `audits/design-identity-2026-09-21/IMPLEMENTATION.md`.
