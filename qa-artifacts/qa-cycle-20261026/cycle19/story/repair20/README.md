# 20차 전 story 최소 수선

19차 정상 원정과 검토 종료의 40src 동결 기록을 먼저 마감한 뒤 적용했다. 이 폴더의 실행은 합성 경계 회귀이며 추가 정상 원정으로 세지 않는다. 새 게임이나 이벤트 주입을 자연 발견으로 표기하지 않는다.

- 자연 확정: `exp_printshop` 선택0의 인쇄물 인용을 `record / 활판 한 장 / paper`로 명시했다. 원본문·효과는 그대로다.
- 정적 파생 확정: `exp_observatory`는 독행/동료와 보리 유무를 본문에서 구분한다. 동료가 있으면 기존 관측 순서를 보존하고, 보리가 있으면 코 자국 묘사를 본문에 남긴다. 새 노트는 모든 조합에서 실제인 토성 관측만 기록한다. 노트 함수를 위해 엔진을 확장하지 않았다.
- 명료성: `comp_engine_sound`의 정차 중 설명을 ‘지금 손보면 30분’으로 바꿨다. 별도 정적 확정인 실패 결과의 ‘20km 뒤’는 실제 지급과 맞는 즉시 고장 묘사로 고쳤다. 기존 90분·차체−15·민지 사기−8·확률은 그대로다. 미수리 라디오의 잡음 가능성은 비결함으로 유지해 gate를 추가하지 않았다.
- 명료성: `thread-side-relay`는 전달 기록을 현재 읽고 다음 연락을 의논한다. 은수가 첫 전달 이전부터 있었거나 레오가 당시 잡음을 듣고 끼어들었다는 전제 없이 대화가 성립한다. 기존6줄의 화자·once·arc·조건을 보존했다.

정확 변경은 `field-delta.json`의 5필드(메타1, 본문3, 노트1)와 `chat-copy-delta.json`의 4문장이다. `before.json`과 frozen19 paid14개는 변경 전 원본이다. 천문대 4조합의 모든 결과, 인쇄소 solo/동료1/동료2, 엔진 모든4결과를 실제 `G.resolvePresentedChoice` 및 reader로 검사했다. 새 entry/paid reload와 옛 paid full-view/text-only도 확인했다. 새 천문대 노트1개를 제외한 수치·flag·인벤토리·관계·노트는 frozen19에서 동일하게 지급했다.

`tests/test_qa_cycle19_story_context.cjs`: 같은 최종 테스트로 frozen19는 11실패/2통과(`red-final.tap`), 수선본은13/13통과(`green-final.tap`). 최초 준비의 잘못된 D.crewChats 이름은 `prepare-attempt01-error.txt`에 남겼다. 첫 green 비교에서 QA fixture의 entry reload 유무가 달라 migration flag 한 개가 달랐던 기록도 `green-attempt01.tap`에 보존했다. 최종은 양 소스 모두 같은 entry reload를 수행해 비교한다. 게임 소스를 이 실패에 맞춰 수정하지 않았다.

통합 계약은 다른 담당의 waterpark1·연료 상인2와 본인 인쇄소1, 총4 result metadata만 정확한 새 값을 검증한 뒤 옛 부재 상태로 투영한다. `signal_bait`의 승인된 span 제거는 과거 단순 quote counter가 HTML class="ai"를 인용1개로 세던 차이(3→2)가 있어, 새 전체 문장을 정확히 확인하고 해당 수만3으로 투영했다. 실제 녹음 인용2개는 유지된다. `quote-raw-delta.json`에 근거를 저장했다. 역사 mechanics/quote 기준 해시는 변경하지 않았고 `story-review-contract.cjs`에는 이번 무의미한 투영을 추가하지 않았다.

본인13 + survival9 + systems18 + 기존 대사/문체25 = 통합65/65 통과(`integrated-final02.tap`). 앞선 미통합/부분통합 실패도 보존했다. 대사 lint 몰입 파괴0, 기존 수동 후보2는 그대로다. root가 전체 test/build와 실제 새 이미지/UI를 별도로 확인한다.
