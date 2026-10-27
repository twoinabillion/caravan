# Story QA cycle3

두 실행의 선택 전후 원문을 모두 읽었다. 같은 seed263003, 원정 source SHA256 `688aafa55a5e6a36d36843455a6cc047b1f7f818bc4f5b31b677f70b6019c0bc`다.

- attempt01: DAY8·907km·83선택, 혼자 **이전 결말**까지 완주. 새 선택을 우선하는 정책이 레오/박 선생 만남에서 거절을 골라 보리 목표를 놓쳤다. 게임 실패로 분류하지 않았고 원본/정책/종료 save를 보존했다.
- attempt02: 영입의 첫 선택만 명시해 같은 seed로 새 출발. DAY17·1742km·133선택, 레오·박 선생·보리와 **이전 결말**. 보존결말은 실제 자격을 갖추지 못해 선택되지 않았다. 보리 구조/합류/출신/발바닥/통역 이야기는 자연 발생했지만 추적·인식표·가족·목욕4개는 미발생이다.

자연 발견5건과 명시 fixture1건을 부모 승인 후 최소 수선했다. 편의점의 ‘아무도 담배 안 피움’→애연가 교환 전제충돌, 명명식의 미래 반복행동 확정, 혼자 매화그늘에서 둘러앉는 문구, 서울진입시 미소유 편지/봉투 등장, 박 선생 가방의 미발생 과거약속은 현재 상태와 맞는 문구로 바꿨다. 보리 목욕은 물0/1로 물2효과가 지급되는 것을 fixture로 재현한 뒤 req.water2와 비용표기만 추가했다. 기존 무료 선택, 선택index, 시간·자원결과, 과거 지급 기록은 보존했다.

`tests/test_qa_cycle_story_cycle3.cjs`: 수정 전1통과9실패 → 수정 후10/10통과. 수정당시 파일 hash는 `source-manifest-after.json`, 원본 증거는 각 attempt의 `finding-raw-receipts.json`, fixture 증거는 `explicit-fixtures.json`이다. 모든 시도와 도구 오류는 `iteration-notes.json`에 구분했다. 전체 원문은 각 attempt의 `readable.jsonl`과 `agent03-trace.json`에 있다.

실제 화면검수용으로 정상 여정에서 얻은 백업을 저장했다. G.inspectSave 검사도 통과했다.

- 진료대: `agent03/attempt02/scene-rq_parkss_task-entry-291.json` (구미 DAY7 13:27).
- 등대: `agent03/attempt02/scene-ev_lighthouse_visit-entry-353.json` (DAY8 20:49).
- 혼자 등대: `agent03/attempt01/scene-ev_lighthouse_visit-entry-134.json` (DAY3 17:46).

각각의 지급 후 result 백업도 같은 폴더에 있다. 이 agent는 브라우저를 조작하지 않았으며 실제 그림crop 검수는 부모 agent가 맡았다. 자연 실행은 유한자원·공개 엔진행동·격리 저장소를 사용했고 각 선택 전후 저장/복원을 진행했다. 소스와 과거 정책을 참고했으므로 블라인드 플레이는 아니다. 목욕fixture를 자연 발견이나 완주로 세지 않는다.

간단 사전기억문구 선별은 `unearned-memory-candidates.json`에 남겼다. 레오의 지나온 마을/등대 이야기는 본인의 과거 여행일 가능성이 있어 새 확정버그로 잡지 않았다. 낮에 읽은 camp_visitor는 ‘지난밤’ memory origin이 있으므로 시간오류 후보에서 제외했다.
