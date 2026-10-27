# 20차 survival — 정상 새 여정 1회, 전편 검토 완료

seed **280001**, player48. **레오·박 선생·은수와 보리**를 정상 영입하고 **집행권 이양 `core_transfer`**로 SESSION 1 끝까지 갔다. 118선택, 633 trace, DAY13 14:04의 종료 상태, 실제 누적 1,243km다. 재시도·별도 재개·부분 재생·사망은 없다. 이번 관측 범위에서 **새 자연 확정 0, 파생 확정 0, 새 명료성 확정 0**이다. 게임 전체의 무결함 주장이 아니다.

실제 엔진과 reader를 격리 VM에서 실행했다. 공개 화면에 대응하는 현재 조건·활성 선택·가격·용량을 읽는, 이전 소스와 커버리지를 아는 목표형 정책이다. 블라인드 플레이나 브라우저 입력 검수로 세지 않는다. 자원·state·flags·사건 주입 없이 정상 획득과 이동만 사용했다. 생산 소스 편집은 0이다.

## 결과와 보존

- 미지급 entry reload **118/118**, paid result reload **118/118**, 총 **236회**를 실제 실행했다. 생략 0, 실패 0, reader 차이 0, 상태 차이 0, 재지급 0. 정상 entry export 118개가 `attempt01/`에 있다.
- 시작·실행 종료·전편 검토 종료의 40src가 모두 동결20과 같다. 엔진 hash는 `a9e246136f3100132bf83625f4b032bd4b315782538f31364b38b0e32df93e0b`이다. 알고리즘은 frozen `engineFiles` 순서의 UTF-8 원문을 LF 한 개로 연결한다. 원래 파일 말미 개행은 유지하고 파일명은 넣지 않는다.
- 최종 식량 22, 물 26, 연료 약 50.85, 고철 46, 차체 100, 피로 약 26.37. 원정 최저 물 16, 식량 2, 연료 약 6.66. 도보 연료 위기나 탈진은 없었다.
- 정상 거래 68회 모두 당시 `enabled/ fits`가 true였고 성공했다. 호출 실패 자체가 0이다. 이전19차의 용량 초과 69거절은 지우지 않았으며, 이번 새 정책의 용량 관찰로 재발하지 않았다. 동일 실패 상태 차단 분기는 이번에는 발동할 필요가 없었고 별도 준비 검사에서만 확인했다.

## 읽은 범위

118개 사건의 entry·실제 선택 결과·전체 선택 목록·결과 chip을 모두 읽었다. 기존69개 primary segment와 비교하면 텍스트 동일108, 새롭거나 동적 차이가 있는10개다. 캠프 번호를 정규화한 신규 선택쌍은 **`exp_radiostation[1]` 1개**다. 기존 좁은 harness baseline의 novelPairs30을 누적 신규 커버리지로 쓰지 않았다.

노트118, UI.speak141, NPC5명의 첫 인사와 응답10 및 선택 목록10, 지역 일감11, 퍼크6, 제작1, 안내 메시지82묶음/114문자열도 모두 읽었다. 118사건의98개 scene key와 본문·장면 전환을 대조했다. **실제 이미지 파일의 픽셀과 브라우저 crop은 이번 에이전트가 검수한 범위가 아니다.** root가 별도 실파일·화면 검수를 맡았다.

시간·선행 관계로 의심한6개 후보는 근거를 남겨 닫았다(`candidates.json`). 특히 06:30 `camp_visitor`는 entry와 result의 실제 reader 첫 turn에 **`timeKind: memory`, `지난밤 · 야영지`**가 있어 밤 표현이 현재 시각을 오인한 것이 아니었다. DAY9 박 선생의 “어제” 대사는 DAY5부터 임시 승객으로 동행한 기록과 함께 판정했다. 일반 저녁 당번 설명, 주제곡 대상, 과거 회상과 다음 정차 계획을 자연 결함으로 부풀리지 않았다.

이번 경로에서 계기판 번호표·잉크·작업장 열쇠 회상은 실제 주행 중 다음 정차 계획/과거 회상으로 나왔다. DAY7 장부 배달 뒤 DAY12에 합류한 은수는 장부 **기록을 먼저 근거로** 삼았다. 서울 비용의 예약자는 모르는 사람일 수 있다는 설명, 실제 연결된 이음망·유령·산지기만 등장하는 이양, 미전달 남산행 편지의 별도 약속도 확인했다.

## 사용 기능과 공백

정상 영입3, 좌석 확장1, 개인대화15, 야영12·야영대화10·식사 준비1·정비 준비1, 현장 정비1, 퍼크6, 탄약 제작1, 지역 일감11, NPC대화5, 게시판 의뢰 수락·완료 각1을 사용했다. 서쪽 수레 호송의 편성·위장·통과를 선택했다. 독립 전투 action은 없었다. 동료 부탁과 서쪽 고정 노선을 병행한 우회가 길어 최단 인간 플레이의 증거로 삼지 않는다.

보리는 정상 구조·합류했지만 코/인식표/가족 후속은 선택되지 않았다. 실제 director 후보15회 중 인식표가 정차 후보에1회 들어갔고 선택되지는 않았다. 코 후보는0회였다. 마지막 상태에서 코·인식표 조건은 가능했고 가족은 tag 선행이 없었다. 가족은 별도 정착지 탐색 경로라 director 후보 누락만으로 버그라 판단하지 않는다. 누적 다른 차수의 인식표·가족 분기 증거와 별개인 **이번 차수의 공백**이다.

라디오 수리·청취 action은0이다. `exp_radiostation[1]`은 겉만 보고 나왔고, 무전 장부 의뢰 stage1 완료를 라디오 기능 해금으로 세지 않는다. 원정 중 공개 local control 관찰은 유지했다. cross-version old-paid/text-only 회귀는 동결 전 `cycle19/survival/repair20/`의 별도 검사이며 이 새 여정/reload 수에 합산하지 않았다.

## 원본과 검토 자료

- `attempt01/player48-{trace,summary,save}.json`, `run01.log`: 정상 원본
- `runtime-start-attempt01.json`, `runtime-end-attempt01.json`, `review-end-hashes.json`: 40src 비교
- `report-final.json`, `findings.json`, `candidates.json`, `policy-limitations.json`: 최종 판정·집계
- `attempt01/reader-full-review.txt`, `choices-compact.txt`, `notes-compact.txt`, `speech-compact.txt`, `actions-compact.json`, `chips-compact.json`, `messages-read-through.md`: 전편 독서 자료
- `attempt01/scene-evidence.json`, `scene-index.md`: 실제 scene resolver 결과와 기대 본문
- 새 인쇄소 키가 자연 발생한 trace464: `attempt01/entry-462-exp_printshop-export.json`이 UI 확인용 정상 미지급 저장이다. 실제 파일명을 목록에서 확인해 사용한다.

`analysis-initial.json`의 `readStatus: pending`은 최초 분석 시점의 원본 값으로 보존했다. 최종 상태는 `report-final.json`의 `review.status: complete`다. 준비 단계 실패 로그도 원래대로 남겼으며 새 여정 실패로 세지 않는다.
