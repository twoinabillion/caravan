# Task 1–8 승인 기록 보관본

2026-09-12 KST에 `.superpowers/sdd/2026-09-11-director-journey/`에서 복사했다. scratch SDD를 나중에 정리해도 디렉터 감사의 판정 근거가 남도록 하는 보관본이다. 각 보고서의 사실관계는 뒤의 독립 review와 컨트롤러 ledger를 함께 읽는다. Task 9A 보고서와 review는 승인 뒤 Phase B 영수증과 함께 추가한다.

| Task | 최종 승인 상태 | 구현 경계 | 원본 경로 | 보관 경로 |
|---|---|---|---|---|
| 1 출발 | spec/quality 승인, Critical/Important 없음 | `73bef1d..fae8b8b` | `.superpowers/sdd/2026-09-11-director-journey/task-1-{report,review}.md` | `task-1-{report,review}.md` |
| 2 야영·동료 | fix 뒤 승인 | `fae8b8b..71b0a4d` | `.superpowers/sdd/2026-09-11-director-journey/task-2-{report,review}.md` | `task-2-{report,review}.md` |
| 3 메인 진행 | review 두 차례 fix 뒤 승인 | `3cd6130..e4ac8f6` | `.superpowers/sdd/2026-09-11-director-journey/task-3-{report,review}.md` | `task-3-{report,review}.md` |
| 4 선택·전투 | 실패 보너스 fix 뒤 승인 | `ab53578..68d7f2b` | `.superpowers/sdd/2026-09-11-director-journey/task-4-{report,review}.md` | `task-4-{report,review}.md` |
| 5 도시·노선 | spec/quality 승인 | `25ce8ab..2505056` | `.superpowers/sdd/2026-09-11-director-journey/task-5-{report,review}.md` | `task-5-{report,review}.md` |
| 6 그림·모바일 | fix 뒤 승인, 차량 절대값 문서 교정 포함 | `6cb0180..0fdfddd` | `.superpowers/sdd/2026-09-11-director-journey/task-6-{report,review}.md` | `task-6-{report,review}.md` |
| 7 결말·저장 | re-entry/pending fix 뒤 승인 | `fef86bf..9e777ba` | `.superpowers/sdd/2026-09-11-director-journey/task-7-{report,review}.md` | `task-7-{report,review}.md` |
| 8 전체 캠페인 | spec/quality 승인, Critical/Important 없음; 두 Minor는 Task 9A에서 교정 | `89371b4..901fd95` | `.superpowers/sdd/2026-09-11-director-journey/task-8-{report,review}.md` | `task-8-{report,review}.md` |

전체 진행·판정 원본은 `.superpowers/sdd/2026-09-11-director-journey/progress.md`, 이 시점의 바이트 동일 보관본은 [`progress-ledger-2026-09-12.md`](progress-ledger-2026-09-12.md)다. 보관본 SHA-256은 `6941c319a5a7e32d4d1b89596566ce8eeed1ba159adcc633b39eb93b8f1c27d3`이며 이후 원본 ledger 갱신과 분리한다. 최종 통합에 직접 영향을 주는 판정은 [`rulings-2026-09-12.md`](rulings-2026-09-12.md)에 출처와 함께 짧게 모았다.

## Task 9A 승인 — 2026-09-12

문서·검증·전달 준비 변경은 `901fd95..833e6fc`에서 독립 검토를 통과했다. 한 차례 수정으로 작업 저장소를 명시한 충돌 검사와 증거 총계 계산을 보완했으며, 남은 Critical/Important 지적은 없다. 원본 전달은 전체 브랜치 리뷰 이후 Phase B에서 수행한다.

- [Task 9A 구현·수정 보고서](task-9a-report.md): 원본 `.superpowers/sdd/2026-09-11-director-journey/task-9-report.md`의 바이트 동일 보관본.
- [Task 9A 독립 검토와 재검토](task-9a-review.md): 원본 `task-9-review.md`의 바이트 동일 보관본.
- [9A 승인 시점 원장](progress-ledger-2026-09-12-task9a-approved.md): SHA-256 `1f2d7a5eae2ebe6c5642791aef5b7b2e55ca34aea935718bc6b93bb88a05ad22`. 앞의 초기 스냅샷은 그대로 보존한다.

## Whole-branch approval

[Whole-branch review and scoped approval](whole-branch-review.md) reviews73bef1d→9dab9c0 and accepts the bounded verification correction c667fbf. [Correction report](../whole-review-fix/report.md) and [actual execution receipt](../whole-review-fix/verification.json) preserve the real two-test pytest proof. Historical ledgers preserve earlier claims as history; this approval and correction supersede their zero-test pending/audio PASS wording.

## Final completion archive

[Final ledger](progress-ledger-2026-09-12-complete.md) records all task approvals, the delivery-discovered UI correction and the controller closure. SHA-256: `c0f339b7cd53b25214f361ec12add710ed4d16f08f00f0364eec0520bbad054a`. [All 14 rulings](../rulings.md) preserve decisions and risks. [Completion receipt](../completion-closure.md) records final documentation, memory and scratch archival. Older ledger snapshots remain unchanged historical records.
