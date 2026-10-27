# 13차 survival — fresh 원정과 정상 저장 분기를 분리

새 여정 seed **273001** 1회로 레오·재이·은수와 **공동감시(core_quarantine), SESSION 1 END**까지 진행했다. DAY10, 840km, **110선택 / 543 trace**. 실패·재시도·새 여정의 legacy 재개는 0회다. 실제 함수와 유한 자원을 쓰는 소스 인지형 목표 QA이며 블라인드·브라우저 플레이 주장이 아니다.

시작·runtime·종료 engine LF hash는 `5c8940162113635cc9ddb0baf6a51501a6f320c87f7ddef7eaddb2fe8ca2e402`, 40개 src 개별 해시도 동결본과 모두 같다. `baseline.json`, `end-hashes.json`, 원본 `attempt01/player34-*`를 보존했다. 이후 reader 수선은 `reader-fix/`에 분리했다.

- 진입 reload110 + 지급 후 reload110, 실패·효과 재지급·상태차이·reader turn 차이 모두0.
- 성공 행동: 이동25, 주행52, 탐색20, 거래40, 야영9, 동료 대화15, 야영 대화7, 주민 대화5(첫인사와 응답10개), 현장일9, 동료 영입3, 영입 단계 성공6, 업그레이드1, 제작1, 식사준비1, 수리준비1, 공개 연료구조2.
- 영입 단계 호출1회(trace356)는 “함께 하룻밤부터”라는 정상 거절이다. 성공 피처로 세지 않았다. 이후 야영하고 정상 합류했다.
- 라디오 제어를 관측했으나 이번 여정 활성 기회/수리 실행은0. UI.playChat 전달과 UI.playRadio의 실제 선택 함수를 시작부터 연결했다. 짧은 speak92개를 읽었으나 모든 큐 말풍선의 실제 픽셀 노출을 보증하지 않는다.
- 식량 최저0, 물4, 연료1.28885, 고철16, 내구78.7. 무한자원·상태/이벤트 주입 없이 완주했다.

전편110 entry/result와 선택지, 실제 buildStoryTurns/표시 이름, 짧은 발화92개, NPC10개, 현장일9개, 메시지를 모두 읽었다. 이전48개 자연/정상 재개 trace 대비 같은 본문 조합99, 새 본문11, 새 정규화 선택쌍1(`ev_crashed_helicopter:0`). 48은 독립 참가자 수가 아니다. `attempt01/reader-full-01~05.md`, `short-and-npc-read-through.md`, `messages-read-through.md`, `field-work-read-through.md`에 실제 기록을 나눴다.

확정6건: 재이 회상·흥정, 은수 설명, 서울 폐허 질문/답, 할아버지 편지의 화자/매체5건과 미발생 판소리 약속을 회상하는 short1건. `findings.json`이 근거/기대/실제/소유자를 기록한다. seoul_base[1]은 story의 같은 자연발견과 중복이므로 통합 집계에서 한 번만 센다. `candidates.json`에는 확정하지 않은 해석도 남겼다.

보리는 DAY4에 합류했다. 이 새 여정에서는 코/인식표/가족 모두 미발생. 인식표는 실제 정지 후보풀에1회 포함됐지만 선택되지 않았다. 후보와 노출을 구분했다. 가족 공백은 아래 별도 분기에서 메웠고 코는 여전히 이 검사 범위 미발생이다.

`scene-evidence.json`/`scene-index.md`는 96개 scene key 및 본문 기대 내용이다. 실제 이미지 크롭·정체성 검수는 root의 브라우저 증거와 별개다.

## C6 정상 저장 분기 — 새 참가자/새 여정 아님

`bori-save-branch/`는 `cohortExcluded:true`, `classification:normal-save-branch-exploration`이다. C6 systems player02 attempt02의 정상 unpaid `entry-277-bori_tag-export.json`을 원형 그대로 G.load했다. 출처 및 SHA는 `lineage.json`. C6 원본은 이미 tag[0]을 자연 선택했으며, 본 분기는 tag[1]을 고른 다른 진행이다.

대전 DAY36 06:30에 태그 주소를 읽고 공개 탐색1회(120분) → DAY36 08:30에 **bori_family[0] 가족 소식**이 자연 발생했다. 강제 이벤트나 RNG 밀기는 없었다. 원본의 식량0/허기3 상태를 보존하고 북상했다. 수원에서 실제 보유 부품7개를 공개 수요에 팔고 보급16회를 거쳐 인계(core_transfer) 본편엔딩에 도달했다.

별도 **24선택 / 119trace**, 진입24+지급24 모두 동등, 새 이동164km, DAY37 종료. 이 수치는 위 fresh 집계에 합산하지 않는다. 전체 본문·reader·short17개도 읽었다. 새 확정3건(오후의 점심 전 표현, 레오 설명의 record 오분류, 내부 동료 대화를 외부 남자로 표시하는 comp_naming), fresh와 중복1건(할아버지 편지)을 기록했다. comp_naming은 최초 후보 판정 뒤 실제 roster4종의 표시 이름·초상 참조를 대조해 확정했으며, 자연 본문과 추가 fixture 진단을 구분했다.

현재 확정 범위는 새 여정6건 + 별도 분기3건이다. 이 보고는 무결점 선언이 아니며 실제 관측·수정·미발생을 구분한다.
