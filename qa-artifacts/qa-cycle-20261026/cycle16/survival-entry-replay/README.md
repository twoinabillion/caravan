# UI entry exports — cohort excluded

16차 소스만으로 과거 15차 seed275001 정책을 정상 공개 행동·유한 자원으로 다시 실행했다. 고래와 와인 두 사건이 새로 열리자 각각 진입 export를 저장했고, 두 번째 사건의 선택 전에 중단했다. 이전 presentation의 sceneKey, 지급 여부, RNG, 자원을 수동 변경하지 않았다.

- player44 / attempt01, 37선택·183trace·38진입 export. 완주나 새 독립 참가자로 세지 않는다.
- raw player44-summary.json 및 player44-trace.json의 summary 모두 cohortExcluded:true, classification:normal-public-action-partial-replay이다. 분류 sidecar만으로 제외했다고 주장하지 않는다.
- 이전 15차 원정의 첫37개 사건 ID·선택·진입 본문·결과와 동일하다. 원본의 전편 읽기와 대조하고 현재 두 대상 진입을 다시 읽었다. 새 독립 자연 관측으로 합산하지 않는다.
- 고래: attempt01/entry-82-lc_ulsan_whale-export.json, 새 키 local-ulsan-gray-whale-v1.
- 와인: attempt01/entry-183-lc_yeongdong_wine-export.json, 새 키 local-yeongdong-wine-cellar-v1. 이 결과는 아직 고르지 않았다.

runtime 시작과 종료 40src는 모두 cycle16 동결과 일치한다. 엔진 hash1911ad89b75afe51e44e8c8856bd7d6b7a16f070c0d717214e5230be996df9ab. 이 저장들은 root의 실제 이미지 crop/UI 검수용이다. Node 관측기를 브라우저 클릭 증거라고 부르지 않는다.

준비 단계의 observer-syntax-before.txt는 실행 전 node --check가 발견한 문자열 조립 오류 보존본이다. 실제 여정은 이를 수정한 뒤 처음 실행한 attempt01 한 건이다. 실패 게임이나 재시도로 세지 않는다.
