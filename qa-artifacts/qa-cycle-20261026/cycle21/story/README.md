# 21차 스토리 원정 — seed 281003

정상 새 여정 1회로 민지·레오·은수와 **집행권 인계(core_transfer), story_done** 결말에 도달했다. DAY 9 20:47, 745km. 좌석칸은 정상 구매했고 보리는 레오와 함께 합류했다. 실패나 재시도, 상태·사건·자원 주입은 없었다.

- 선택 96개. 원시 trace는 503 **기록**이며 진입 리로드 96개와 결과 리로드 96개가 포함된다. 이를 뺀 311개도 고유 클릭 수로 표현하지 않는다.
- 실제 진입·결과 reader 96쌍(원문 33,920자), 짧은말 88줄, 노트 113개, NPC 첫 인사·소문 24메뉴와 부가 기록 46개를 전부 읽었다. 기존 본문 대조는 따로 기록했다.
- 앞선 story 1–20차와 같은 전체 튜플 82개/다른 튜플 14개, 결과 문자열 같은 것 89개/다른 것 7개. 전 담당자의 누적 836 선택쌍 기준 새 authored 선택쌍은 **0개**다. 동료·실제 분기 문맥 검토를 신규 콘텐츠 수로 부풀리지 않는다.
- 진입/결과 리로드 192건에서 상태가 같고, 유료 결과 reader 96개도 같다. 효과 재지급은 0건이다. 실제 연속 chat 6회에서 당일 동일 chat 중복은 0회다.
- 소스 40개는 시작·실행 종료·전편 검토 종료 모두 동결본과 같다. engine LF SHA-256: `43b982b514b86d2227f8b15b5cd2551c170c715b4173617123e9f4fb98fe6f3c`.

새 서사·화자 확정 오류는 0개다. 은수의 좌표 소각 선택이 캠프·합류·엔딩까지 이어지고, 첫 장부 전달 뒤 늦게 합류한 은수는 실제 전달자가 아니라 현재 기록을 읽는 사람으로 말한다. 우편부의 편지·해도를 얻지 않아 관련 서울 선택은 잠겼다. 자세한 판정은 `nondefect-rulings.json`에 남겼다.

그림은 실제 reader에서 사용된 88 scene 키를 보존하고, 그중 8개의 `D.scenes → token → build resolver → 실제 파일`을 따라 `view_image`로 열었다. 전부를 시각 검수한 것은 아니다. 새 확정 2건은 `findings.json`과 `image-review.json`에 기록했다.

1. **S21-V01 — exp_radioshop:** 양산 전파상 내부의 라디오·워크맨·TV 선반을 묘사하지만 `event-find-signal.webp`는 도시를 내려다보는 언덕 통신소 외관이다.
2. **S21-V02 — near_geochang_actor:** 거창 폐극장에서 정장 배우가 빈 객석 앞에 독백하지만 `event-explore-shelter.webp`는 고가 아래 천막·침낭 대피소다.

정상 pre-reader 백업은 각각 `agent03/attempt01/normal-unpaid-36-exp_radioshop.json`, `normal-unpaid-152-near_geochang_actor.json`이다. `pendingPresentation`에 version/eventId/phase/text만 있고 view/reading은 없다. 원본을 편집하지 않아 다음 소스 매핑의 UI 검수에도 그대로 쓸 수 있다. 이 담당자는 모바일 crop을 검증하지 않았고, 그림 통합과 실제 UI 검수는 root가 맡는다.

**미수선 명료성 후보 S21-C01:** 같은 민지 ambient banter 한 줄이 DAY 8 15:09와 17:21, 약 132.5 게임 분 간격으로 반복됐다. 사이에 정상 진입·결과 로드가 있고 `G.load → resetDriveTimers`가 전역 `lastBanter`를 비운다. 현재 시간·동행 모순은 없으므로 즉시 중복이나 당일 crew chat 결함으로 세지 않는다.

실제로 재노출한 수선은 19차 운전 문구 6범위, 20차 `thread-side-relay`, 외부 단말과 은수 소각 연속성이다. 새 21차 우체국 그림, 개인 페어 사건, 보리 목욕·태그·가족·추적 후속, 동료 미션 종결, 라디오 수리와 전술 전투는 이번 원정에서 나오지 않았다. 특정 콘텐츠를 강제로 띄우기 위한 추가 원정은 하지 않았다.

원본은 `agent03/attempt01/`, 전편 읽기 파일은 그 안의 `read-block-1.txt`부터 `read-block-8.txt`, `speech-reader.txt`, `notes-reader.txt`다. NPC·부가기능은 `extras-compact-1.txt`부터 `extras-compact-3.txt`에서 읽었다. 최종 수치·제약은 `report.json`, 동일성은 `reader-reload-deep-comparison.json`과 `source-review-close-verification.json`을 따른다.

Node VM의 실제 엔진·reader와 공개 행동 경로를 사용한 QA이며, 브라우저 입력·음향·화면 배치 QA와는 구분한다. 생산 소스는 변경하지 않았다.
