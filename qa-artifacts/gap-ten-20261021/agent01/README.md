# agent01 — 보존·감시 근무 결말

공개 행동으로 얻은 민지·강우·재이 세 사람과 `core_quarantine`을 선택하고 `SESSION 1 END`까지 완료했다. 확정한 게임 오류는 0건이다. 사용자의 Studio·화면·저장·서버와 생산 코드는 건드리지 않았다.

이 결과는 목표형 실엔진 API 검사다. 화면이나 사람 플레이가 아니다. 이전 정책과 현재 보존 조건·서사를 읽었으며, 한 번도 실패하지 않은 자연 완주라고 주장하지 않는다. 인위 fixture, 동료·자원·플래그 주입은 0회다.

## 완주 계보

1. `attempt01`, seed `221001`: interactive newGame부터 출발. 민지(n97), 강우(n140) 정식 합류 및 bench 구입. 무주에서 식량이 떨어졌는데 정책이 물물교환을 놓쳐 정체했다.
2. `attempt03`: `attempt01/agent01-save.json`을 그대로 G.load로 재개했다. 물물교환과 재이 의뢰를 실제 수행해 재이(n45)가 합류했다. 남산의 근무표 확인(n189)과 마지막 선택(n192)까지 갔지만 사기가 낮아 보존이 0/3으로 막혔다. 첫 결정의 원본 `decision-191-save.json`을 남겼다.
3. `attempt04`: 위 결정 저장을 그대로 재개했다. 준비 복귀(n4)는 실제 60분 뒤 수원으로 돌려보냈다. 물·식량 구매, 망루 교대, 성문 작업, 따뜻한 한 끼와 야영을 수행했다. DAY16 실제 사기 58/58/52를 확보해 서울로 돌아갔다.
4. 보존 선택(n65)이 활성화됐고 실제 세 명이 서명했다. 강우 반대 안내 `유대 -6`와 실제 15→9가 맞았다. 결과 재로드(n66)는 `applied:false`이며 같은 상태를 보존했다. 다음 목표는 결과 계속읽기를 안내하고 에필로그(n68), 상행 연결(n71), 가족 귀환(n74), 마지막 결과 재로드(n75)를 거쳐 종료했다.

`attempt02`는 첫 저장에서 따로 갈라진 보급 정책 실패다. 재이를 얻었지만 과도한 대구↔대전 왕복으로 정체했고, 성공 계보에 포함하지 않았다. 실패한 기록도 모두 보존했다.

## 증거

- 최종 전체 원시 기록: [attempt04/agent01-trace.json](attempt04/agent01-trace.json)
- 줄별 간단 기록: [attempt04-readable.jsonl](attempt04-readable.jsonl)
- 복귀·재진입·결정·에필로그 발췌: [target-excerpt.json](target-excerpt.json)
- 실제 최종 저장: [attempt04/agent01-save.json](attempt04/agent01-save.json)
- 검증 결과와 저장 SHA-256: [verification.json](verification.json)
- 전체 방법·한계·기각 사항: [report.json](report.json)

전체 분기 실행에서 미정산 entry 재로드 148회, paid result 재로드 145회가 실행됐고 중복 효과 적용은 0회였다. 성공의 보존 서명자는 정확히 `minji, kangwoo, jaeyi`다. `verify.cjs`는 새 게임이나 fixture 없이 실제 완료 export를 G.load로 읽고 서명·자원·메인 완료가 그대로인지 확인했다. 종료 후 G.save가 false인 것은 의도된 동작이며, 처음 잘못 기대한 assertion은 `verification-initial-failure.json`에 남겼다.

## 범위

보존의 진입 조건, 사기 부족 차단, 공개 준비 복귀, 실제 회복, 결정 실행, 반대 비용, paid receipt 재개, 다음 에필로그와 종료를 확인했다. 브라우저 버튼·Escape·초점, 실제 새로고침, 장부 접근, 그림·음성·모바일, 은수 우선 서명과 부상 경계는 확인하지 않았다. 기존 감사의 다른 우선 문제는 이번에 고치거나 재검증하지 않았다.

재검증: `node qa-artifacts/gap-ten-20261021/agent01/verify.cjs`. 각 `attemptNN`은 덮어쓰기를 거부한다. 새 플레이 실행에는 새 attempt명을 사용해야 한다.
