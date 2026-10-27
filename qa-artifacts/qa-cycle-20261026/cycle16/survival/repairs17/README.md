# 16차 관측 뒤 승인된 17차용 문구 수선

새 원정이 아니라 기존 관측의 재현·수선이다. `cohortExcluded: true`. 16차 원정, 원본 종료 해시, 자연 발견 집계는 바꾸지 않았다.

- **S16-01 자연 확정:** `meet_bus[0]`의 냉장약 노트가 “식기 전”이라고 반대로 안내했다. 정상 원정 trace164 / `../attempt01/entry-162-meet_bus-export.json`을 실제 로더로 복원하고 선택했다. 새 노트는 “따뜻해지기 전에 약을 옮겨야 한다.”로 바뀌었다. 영입과 다른 지급 효과는 같다.
- **C16-01 관측 및 별도 엔진 재현:** trace148 주행에서 `thread-massacre-kangwoo`가 짧은 대사 큐에 잡혔다. 실제 브라우저에 그려졌다는 증거는 아니다. 별도 VM에서 실제 `doRecruit` → 같은 날 `startTravel` → `pickChat`으로 선택 가능함을 확인했다. 전날 행동 전제는 현재 선호 질문으로, 이미 자리를 편 서술은 오늘 밤 자리·통로를 정하는 약속으로 바꿨다. 동료/지식/유대6 조건과 once 기록은 그대로다.
- **C16-02 명료성:** trace246의 “수처럼 외웠던”을 “외워 두기만 했던”으로 바꿨다. 자연 결함 수에 더하지 않는다.

정확한 네 필드의 old/new 값은 `copy-delta.json`, 원래 전체 정의는 frozen16으로 만든 `before.json`에 있다. 공유 소스의 해당 줄만 `apply_patch`로 수정했다. 최초 역순 hunk 패치는 검증 단계에서 거절되어 소스 변화가 없었고, 줄 순서를 맞춘 `source-ordered.patch`가 적용됐다.

`tests/test_qa_cycle16_survival_copy.cjs`는 수선 전 5실패/5통과, 수선 후 10/10 통과했다. 새 노트/새 기억, 거절 경로, 첫날 주행·정차 대화, 유대 및 동료 조건, 거리 조건, once를 검사한다. 동결16에서 만든 지급본은 저장된 노트·본문·실제 reader 및 text-only 모드·echoLines·once를 유지한다. 세 소유 정의를 네 승인 문구만 되돌려 비교하면 완전히 같다. 기존 echoLines가 없는 아주 오래된 기억은 현재 정의를 사용하는 기존 fallback을 유지하며, 모든 옛 화면 문자가 고정된다고 주장하지 않는다.

`dialogue-lint01.txt`: 오류 0, 5,803줄, 기존 반복 표현 후보 2. 두 생산 파일 구문 검사와 diff whitespace 검사 통과. 전체 검사/빌드는 root, 정확 corpus projection은 story 담당이다. 소스 편집은 끝냈다. 현재 공유 소스 해시는 `source-after.json`에 있으며 다른 담당의 승인된 수선도 포함하므로 17차 동결과 구별한다. 17차 새 원정은 동결 신호까지 시작하지 않는다.

후속 독립 통합: story 담당이 copy4필드 exact projection 반영을 마쳤고, 세 담당 집중 회귀·story-contract consumer·dialogue 합계 109/109 및 lint 0오류를 보고했다. 이 수치는 survival의 재실행 결과가 아니라 담당자의 통합 결과다.
