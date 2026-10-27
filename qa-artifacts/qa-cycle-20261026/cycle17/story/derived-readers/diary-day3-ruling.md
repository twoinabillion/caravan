# 일지 DAY 3 — 비결함 종결, 본문 수선 없음

정상 새 게임은 party가 비어 있다. G.startRecruitQuest와 G.openRecruitMeet는 S.recruitQ가 있으면 다른 영입을 시작하지 못한다. 각 영입은 task→road→follow로 이어지고, G.openRecruitStep의 follow 처리에서 S.day<=q.roadDay이면 거절된다. 다음날 이후에만 ready→join을 공개 UI로 진행할 수 있다. UI/목표 안내도 오늘 함께 이동했으면 야영 뒤 다음날 대화를 제시한다.

따라서 정상 시작에서 첫 동료는 최저 DAY 2, 단일 영입 소유가 끝난 뒤 두 번째 동료의 다음날은 최저 DAY 3이다. comp_diary_read는 minParty2/night이므로 정상 새게임에서 DAY 3 이전에 보이는 조건이 성립하지 않는다. party 강제 주입 fixture는 자연 도달 증거가 아니다. 실제17에서는 첫 민지 DAY3, 둘째 강우 DAY5로 더 늦었다.

DAY3의 졸음이 화면에 직접 나온 적 없다는 점만으로 일상의 회상을 모순이라고 확정할 수 없다. 따라서 날짜 중립 문구로 추가 수선하지 않고, 앞서 확인된 외부 초상 오배정의 metadata만 유지한다. gate나 효과 변경도 없다.

근거: src/04a-engine-core.js G.startRecruitQuest/G.openRecruitMeet/G.markRecruitRoad/G.openRecruitStep; src/04d-engine-director.js arrive road→follow; src/07d-ui-quests.js follows wait-night 안내; src/03-data.js comp_diary_read minParty2/night.
