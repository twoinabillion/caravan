# 23차 전 story 수선 — 22차 자연·인접 결과 근거

22차 원정/검토 종료40해시를 먼저 보존한 뒤 승인된 다섯 사건만 수정했다. 자연 원정 두 시도와 과거 paid 원문은 수정하지 않았다.

- `loc_tunnelbook`: 사서 역할과 주인공 응답을 entry/두 결과에 독립 지정. 이미 정상인 첫 선택의 주인공 질문은 유지한다.
- `ev_parkss_past`: entry 두 발화와 세 결과를 정확한 Parkss/me 역할로 지정한다. 보장되지 않은 고개·차 안 환자·내 발열 대신 실제 영입 정류소의 아이들과 지금 곁에 있음을 말한다. 즉시 결과에서 미래 숙면을 확정하던 끝문장은 현재 찻잔/긴장 완화 행동으로 바꾼다.
- `ev_atm_cash`: 외부인이 없는 줍기 결과의 농담을 me로 지정한다.
- `comp_snore`: 실제 첫 동료가 Parkss일 때만 주인공이 “선생님 코에서 난 소리인데요.”라고 답한다. 다른 동료 조합의 원문/역할은 그대로다.
- `talk_es_01`: 새 노트의 ‘밤’만 제거한다. 전파에 관한 일반 설명과 시간/조건/효과는 유지한다.

최종 `exact-delta.json`은 12필드(metadata8/copy4)이다. `production.patch`와 마지막 인원 중립 표현 `singular-clarity.patch`가 국소 수정 이력을 남긴다. 숫자 효과, 가용 조건, 확률, 선택 순서와 비용은 모두 동결22와 같다. 새 은수 노트 body만 승인된 차이다.

`tests/test_qa_cycle22_story_readers.cjs`: 수정 전 `red-final.tap` **11실패/7통과**, 수정 후 `green.tap` **18/18**. 다섯 사건 모든11결과·코골이4조합·ATM독행, 정상 unpaid load→선택→실제 reader→paid reload, entry 화자 상속 차단을 검사한다. 대안 선택/roster fixture는 자연 원정 집계에서 제외했다.

`before.json`과 `*-paid.json` 17개는 frozen22로 먼저 생성했다. 동일 17 paid의 frozen reader와 text-only reload 모두 옛 화자·문구·노트·효과를 보존한다. 기존의 다른 결과까지 포함한 모든 payment 상태는 승인 노트 한 필드 외에 같다.

관련 집중 검사 `focused.tap` **102/102**, 마지막 인원 중립 문구 뒤 신규+quote `final-focused.tap` **35/35**. dialogue-lint는 몰입 파괴 항목0, 샘플5803 유지(기존 반복 시작 후보2). `tools/test-dialogue-register.cjs`에 새8배열·4copy를 정확히 assert하고 이전 undefined로만 투영했다. corpus 전체 hash는 바꾸지 않았다. mechanics 계약은 기존 관련 검사들이 그대로 통과하여 `tools/story-review-contract.cjs` 추가 변경은 필요하지 않았다.

생산 src 수정은 종료했다. 전체 source suite/build와 23차 이미지 매핑/브라우저 검수는 root 소유다. 이 검사 결과는 실제 모바일 화면 QA를 뜻하지 않는다.

시스템 담당 덕구의 두 결과 metadata도 exact assert→undefined로 통합했다. `integrated.tap`은 quote계약+story18+deokgu7 **42/42** 통과다. 덕구 원본문/quote 수는 바꾸지 않았다.

후속 승인된 정적 파생 `exp_oilmill` 현재 계획 문구를 정확 assert하고 기존 텍스트 한 필드만 옛 값으로 투영했다. 전체 event 정의가 frozen22와 일치하는지 독립 확인했다. `integrated-with-oilmill.tap` 최종 통합 **48/48**이며, 이 문구는 자연22 발견 수에 추가하지 않는다. 생산/계약 편집 종료.
