# S19-01 → cycle20 수선

`src/03-data.js`의 `ev_waterpark.choices[1].out[0]`에 `turnSpeakers:['party_first']`만 추가했다. 폐워터파크에서 일행이 웃는 말을 외부 작업자로 추정하지 않고 현재 실제 동료에게 표시한다. 민지 같은 특정 인물을 고정하지 않았으며, 동료 1명 조건은 그대로다. entry와 선택 0의 두 결과에는 새 메타를 넣지 않았다.

자연 근거는 19차 trace168과 `../attempt01/entry-166-ev_waterpark-export.json`이다. 민지 1명과 임시 승객 재이가 있던 원정에서 `passer_worker / ???`가 실제 표시됐다. 이 원정은 그대로 보존했고 수선 검사나 fixture를 새 여정에 합산하지 않는다.

`tests/test_qa_cycle19_waterpark.cjs`가 수정 전 **6실패·3통과**, 수정 후 **9/9 통과**했다. 실제 reader로 동료 1명·2명·순서 변경 및 임시 승객 유무를 검사했다. 플레이어는 `상혁`인 상태에서 결과 화자가 현재 동료로 resolve되며 `me`나 미영입 승객으로 바뀌지 않는다. solo에서는 놀이 선택이 기존대로 비활성이다. 두 보급 결과의 reader·효과도 동결본과 동일하다. 정상 과거 unpaid 진입 화면을 재개하고 새 선택을 한 번 지급한 뒤 새 reader를 재개하는 경로까지 확인했다.

원래 19차 전체 동결 소스에서 정상 unpaid를 로드하고 선택 1을 실제 실행해 `frozen19-paid.json`을 만들었다. 이는 `cohortExcluded:true`인 회귀 fixture다. `legacy-lineage.json`에 원본과 생성 경로를 적었다. 과거 paid reader의 `???`는 역사적 표시 그대로 유지되고, reader view를 제거한 text-only 변형도 frozen19와 현재 코드가 동일하게 읽는다. 두 경우 모두 효과 재지급이 없다. 본문·노트·비용·조건·확률·인덱스·30분을 그대로 비교했다.

첫 `tests-red.txt`에는 VM 경계 객체 prototype 때문에 내용이 같은 배열도 다르다고 본 검사 구현 오류 3건이 섞였다. runtime helper의 반환값을 호스트 JSON으로 정규화한 뒤 `tests-red-normalized.txt`에 유효한 6실패·3통과 증거를 다시 남겼다. 생산 수정 후 `tests-green.txt`가 9/9이며 `dialogue-lint.txt`는 오류 0이다. 초기 로그를 덮어쓰지 않았다.

`before-event.json`·`after-event.json`·`exact-delta.json`을 저장했고, story 담당에게 이 한 필드의 계약 projection을 전달했다. production 소유 범위 편집은 종료했다. 화면 크롭·브라우저 조작 검증은 이 회귀의 범위가 아니다.
