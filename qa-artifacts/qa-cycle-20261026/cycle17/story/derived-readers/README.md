# 17차 후 내부 동료 화자 정적 파생 감사

root가 survival의 좁은 동행 사건 전수검토에서 다섯 사건을 배정했다. 이 사건들은 본인 17차 자연 발견 수에 더하지 않는다.

- comp_diary_read: 낭독자/대답하는 다른 동료/주인공으로 7발화, entry 첫동료.
- up_beehive_swarm: 독행도 가능한 실패 결과의 자기 농담을 me로 지정.
- comp_van_pride: entry 질문은 첫동료, 결과 결론은 me.
- ev_group_feast: 6인 파티에서 은수/강우의 기존 실제 화자 유지. 두 번째 선택의 추모 초대만 me.
- up_armor_argument: entry 걱정은 첫동료, 두 결과는 서술만 유지.

본문/효과/조건/노트/인덱스/확률은 모두 동일하다. 9 metadata 필드, 실제 entry를 바꾼 사건의 모든 결과는 명시하여 entry 화자가 상속되지 않게 했다. cases.json이 exact delta, before.json과 8개 paid 백업은 동결17로 만든 fixture다.

회귀 tests/test_qa_cycle17_story_derived_readers.cjs: red 15실패/10통과 → green 25/25. 총14개 로스터 조합(독행/2인/6인/역순)의 전 entry·모든 결과, 실제 지급8개·reload8개, 옛 paid8개와 text-only8개를 검사했다. 과거 결과를 다시 지급하거나 새 화자로 덮어쓰지 않는다.

DAY3 후보는 추가 확인 후 비결함으로 종결했다. 단일 영입 소유와 각 영입의 다음날 조건 때문에 정상 새게임에서 두 동료는 최저 DAY3에 모인다. 관측되지 않은 일상 회상을 그 자체로 모순이라 확정하지 않았고 문구는 유지했다. 자세한 근거는 diary-day3-ruling.md에 있다.
