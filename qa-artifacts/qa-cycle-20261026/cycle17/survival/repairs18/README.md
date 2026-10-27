# 18차 전 수선 — survival 담당 11사건

17차 자연 확정 exp_arcade / wx_bigwash / comp_food_debate 3개와 story 자연 확정 comp_hometown, 정적 파생 comp_water_fight / comp_ghost_story / comp_van_name / comp_radio_war / comp_storm_count / comp_snore / comp_dj_night 7개를 수선했다. 새 자연 여정은 실행하지 않았다.

`src/03-data.js`의 해당 metadata만 수정했다. 내부 발화는 실제 party_first/party_second와 운전자로, 에어하키 승자는 본문에 나온 노인 고수로, 정착지 뉴스는 radio record로 표시한다. 고정 이름의 새 친구를 추가하지 않았다. 모든 entry에 추가한 화자표 아래 결과의 독립 경로를 확인했다. ‘월요일 아침 지하철’과 ‘달구지 1호’는 발화가 아닌 인라인 문구여서 원래 문단을 유지한 authored turns로 보호했다. van_name authored turns는 실제 S.party에서 cid를 선택한다.

원본11개 전체 정의는 `before-events.json`에 동결17로 저장했다. production exact delta는 `field-delta-final.json`의28필드다. `metadata-delta.json`은 테스트 기대 경로 표로, authored narration의 기대 빈 발화열까지 포함하므로 projection에는 exact delta 파일을 사용한다. body/text, notes, 모든 FX, 시간, 비용, 조건, 확률, once, choice index는 동일성 검사로 보호했다.

검증:
- red `tests-before01.tap`:15검사 중11실패4통과. 각 미지 외부인 경로를 실제 parser에서 재현.
- 최초 패치 후 `tests-after01.tap`의 exp_arcade1실패는 기존 quote-script 키와 중복되어 덮인 결과였다. 기존 소유 키에 합쳐서 `tests-after02.tap`15/15 통과.
- `tests-after03.tap`16/17은 실제 정상 unpaid export에 reading.view가 아직 없는 경우를 테스트가 단정한 harness 오류였다. 없는 reader를 과거 화면 증거로 만들지 않고 null 그대로 비교하도록 수정. `tests-after04.tap`17/17 통과.
- 마지막 인라인 narration lint 보완 후 `tests-final01.tap`과 `dialogue-lint01.log` 확인. lint0오류.
- 0/1/2/3/reordered 실제 roster, 모든 choice/outcome의 entry 상속, new entry/paid reload, 가용성의 동결17 대비 동일성을 검증.
- 44개 과거 paid fixture를 reader와 text-only 각각 현재/동결17에 로드: 원문/화자/기존 notes/수치가 동일하며 재지급하지 않는다. 이 fixture는 정상 플레이나 독립 참가자가 아니다.
- 실제 정상 unpaid export 4개(우리3개+story comp_hometown)를 로드하여 선택 성공→paid→reload를 확인했다. wx_bigwash 실제 저장의 party는 민지·레오2명이다. reading.view가 있으면 그대로, 없는 export는 null 그대로 보존한 뒤 새 결과를 검사했다.

실제 이미지와 브라우저 crop 검수는 root 범위다. 이 문서의 검증은 실제 함수/저장 엔진 검사이며 UI 클릭 또는 새 원정을 뜻하지 않는다. 17차 원정 종료와40src불변 증거는 원정 보고에 보존되어 있고, 이 수선은 그 종료 이후18차를 위한 별도 변경이다.
